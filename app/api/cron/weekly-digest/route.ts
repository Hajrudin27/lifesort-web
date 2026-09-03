import { NextResponse } from 'next/server';
import * as Sentry from '@sentry/nextjs';
import { createAdminClient } from '@/lib/supabase/admin';
import { sendEmail } from '@/lib/resend';

export const dynamic = 'force-dynamic';

function daysAgoIso(days: number) {
  const d = new Date();
  d.setDate(d.getDate() - days);
  return d.toISOString();
}

function todayStr() {
  return new Date().toISOString().split('T')[0];
}

function inNextDaysStr(days: number) {
  const d = new Date();
  d.setDate(d.getDate() + days);
  return d.toISOString().split('T')[0];
}

export async function GET(request: Request) {
  const authHeader = request.headers.get('authorization');
  if (!process.env.CRON_SECRET || authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const supabase = createAdminClient();
  const since = daysAgoIso(7);

  const [newTicketsRes, openTicketsRes, newWaitlistRes, upcomingTimelineRes, overdueTimelineRes, adminsRes] = await Promise.all([
    supabase.from('support_tickets').select('id', { count: 'exact', head: true }).gte('created_at', since),
    supabase.from('support_tickets').select('id', { count: 'exact', head: true }).eq('status', 'open'),
    supabase.from('waitlist_signups').select('id', { count: 'exact', head: true }).gte('created_at', since),
    supabase.from('timeline_events').select('title, event_date').neq('status', 'done')
      .gte('event_date', todayStr()).lte('event_date', inNextDaysStr(7)).order('event_date'),
    supabase.from('timeline_events').select('title, event_date').neq('status', 'done').lt('event_date', todayStr()),
    supabase.auth.admin.listUsers(),
  ]);

  const upcoming = upcomingTimelineRes.data ?? [];
  const overdue = overdueTimelineRes.data ?? [];

  const html = `
    <h2>Ugentligt overblik — LifeSort Admin</h2>
    <ul>
      <li><strong>${newTicketsRes.count ?? 0}</strong> nye supportsager denne uge (${openTicketsRes.count ?? 0} åbne i alt)</li>
      <li><strong>${newWaitlistRes.count ?? 0}</strong> nye på ventelisten denne uge</li>
    </ul>
    ${overdue.length > 0 ? `
      <h3 style="color:#e11d48;">Overskredne deadlines (${overdue.length})</h3>
      <ul>${overdue.map((e) => `<li>${e.title} — ${e.event_date}</li>`).join('')}</ul>
    ` : ''}
    ${upcoming.length > 0 ? `
      <h3>Deadlines de næste 7 dage (${upcoming.length})</h3>
      <ul>${upcoming.map((e) => `<li>${e.title} — ${e.event_date}</li>`).join('')}</ul>
    ` : '<p>Ingen deadlines de næste 7 dage.</p>'}
    <p style="color:#78716c; font-size:13px; margin-top:24px;">Automatisk sendt hver mandag fra LifeSort Admin.</p>
  `;

  const recipients = (adminsRes.data?.users ?? []).map((u) => u.email).filter((e): e is string => !!e);

  const results = await Promise.all(
    recipients.map((to) => sendEmail({ to, subject: 'Ugentligt overblik — LifeSort Admin', html }))
  );

  const failed = results.filter((r) => !r.ok);
  if (failed.length > 0) {
    Sentry.captureMessage(`Weekly digest: ${failed.length}/${recipients.length} emails failed`, 'warning');
  }

  return NextResponse.json({ ok: true, sent: recipients.length - failed.length, failed: failed.length });
}