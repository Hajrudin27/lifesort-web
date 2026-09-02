import { NextResponse } from 'next/server';
import * as Sentry from '@sentry/nextjs';
import { createClient } from '@/lib/supabase/server';
import { sendEmail, escapeHtml } from '@/lib/resend';

export async function POST(request: Request) {
  const { ticketId } = await request.json();

  if (!ticketId || typeof ticketId !== 'string') {
    return NextResponse.json({ error: 'ticketId mangler' }, { status: 400 });
  }

  const supabase = await createClient();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: 'Ikke logget ind' }, { status: 401 });
  }

  const { data: adminRow } = await supabase
    .from('admin_users')
    .select('id')
    .eq('id', user.id)
    .single();

  if (!adminRow) {
    return NextResponse.json({ error: 'Ingen admin-adgang' }, { status: 403 });
  }

  const { data: ticket, error: ticketError } = await supabase
    .from('support_tickets')
    .select('email, subject, message, admin_reply')
    .eq('id', ticketId)
    .single();

  if (ticketError || !ticket || !ticket.admin_reply) {
    return NextResponse.json({ error: 'Sag eller svar ikke fundet' }, { status: 404 });
  }

  const emailResult = await sendEmail({
    to: ticket.email,
    subject: `Re: ${ticket.subject}`,
    html: `
      <p>Hej,</p>
      <p>Her er svar på din henvendelse:</p>
      <blockquote style="border-left: 3px solid #e5e5e5; margin: 12px 0; padding-left: 12px; color: #44403c;">
        ${escapeHtml(ticket.admin_reply).replace(/\n/g, '<br>')}
      </blockquote>
      <p style="color: #78716c; font-size: 13px; margin-top: 24px;">
        Din oprindelige besked:<br>
        <em>${escapeHtml(ticket.message).replace(/\n/g, '<br>')}</em>
      </p>
      <p>Mvh<br>LifeSort Support</p>
    `,
  });

  if (!emailResult.ok) {
    Sentry.captureMessage(`Ticket reply email failed: ${emailResult.error}`, 'error');
    return NextResponse.json({ error: emailResult.error }, { status: 502 });
  }

  return NextResponse.json({ ok: true });
}