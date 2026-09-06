import { NextResponse } from 'next/server';
import * as Sentry from '@sentry/nextjs';
import { createAdminClient } from '@/lib/supabase/admin';
import { sendEmail, escapeHtml } from '@/lib/resend';

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

/**
 * Titler skrives af admins, ikke af os. En editor kunne ellers lægge markup — fx et link
 * der ligner en adgangskode-nulstilling — ind i den mail der hver mandag sendes til alle
 * admins, inklusive ejerne.
 */
function timelineItem(event: { title: string; event_date: string }) {
  return `<li>${escapeHtml(event.title)} — ${escapeHtml(event.event_date)}</li>`;
}

/**
 * Emailadresser på dem der faktisk har adgang til admin-panelet.
 *
 * Her stod tidligere supabase.auth.admin.listUsers(). Den returnerer ALLE brugere i
 * Supabase-projektet — altså hele appens brugerbase — så det ugentlige interne overblik
 * med supportsagstal, ventelistetal og roadmap-deadlines blev adresseret til hver eneste
 * registrerede bruger. Målt lokalt: 5 modtagere ud af 5 brugere, hvoraf kun 2 var admins.
 *
 * Opslaget går gennem admin_users og henter hver adresse enkeltvis. Der er en håndfuld
 * admins, så det koster ingenting — og i modsætning til listUsers() kan resultatet ikke
 * ændre sig med antallet af app-brugere eller falde over sidenummerering.
 */
async function adminEmails(supabase: ReturnType<typeof createAdminClient>): Promise<string[]> {
  const { data: admins, error } = await supabase.from('admin_users').select('id');
  if (error || !admins) return [];

  const found = await Promise.all(
    admins.map(async (admin) => {
      const { data } = await supabase.auth.admin.getUserById(admin.id);
      return data?.user?.email ?? null;
    })
  );

  return found.filter((email): email is string => Boolean(email));
}

export async function GET(request: Request) {
  const authHeader = request.headers.get('authorization');
  if (!process.env.CRON_SECRET || authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const supabase = createAdminClient();
  const since = daysAgoIso(7);

  const [newTicketsRes, openTicketsRes, newWaitlistRes, upcomingTimelineRes, overdueTimelineRes] = await Promise.all([
    supabase.from('support_tickets').select('id', { count: 'exact', head: true }).gte('created_at', since),
    supabase.from('support_tickets').select('id', { count: 'exact', head: true }).eq('status', 'open'),
    supabase.from('waitlist_signups').select('id', { count: 'exact', head: true }).gte('created_at', since),
    supabase.from('timeline_events').select('title, event_date').neq('status', 'done')
      .gte('event_date', todayStr()).lte('event_date', inNextDaysStr(7)).order('event_date'),
    supabase.from('timeline_events').select('title, event_date').neq('status', 'done').lt('event_date', todayStr()),
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
      <ul>${overdue.map(timelineItem).join('')}</ul>
    ` : ''}
    ${upcoming.length > 0 ? `
      <h3>Deadlines de næste 7 dage (${upcoming.length})</h3>
      <ul>${upcoming.map(timelineItem).join('')}</ul>
    ` : '<p>Ingen deadlines de næste 7 dage.</p>'}
    <p style="color:#78716c; font-size:13px; margin-top:24px;">Automatisk sendt hver mandag fra LifeSort Admin.</p>
  `;

  const recipients = await adminEmails(supabase);

  const results = await Promise.all(
    recipients.map((to) => sendEmail({ to, subject: 'Ugentligt overblik — LifeSort Admin', html }))
  );

  const failed = results.filter((r) => !r.ok);
  if (failed.length > 0) {
    Sentry.captureMessage(`Weekly digest: ${failed.length}/${recipients.length} emails failed`, 'warning');
  }

  return NextResponse.json({ ok: true, sent: recipients.length - failed.length, failed: failed.length });
}