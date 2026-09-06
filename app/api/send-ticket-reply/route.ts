import { NextResponse } from 'next/server';
import * as Sentry from '@sentry/nextjs';
import { createAdminClient } from '@/lib/supabase/admin';
import { requireAdmin } from '@/lib/admin-auth';
import { CUSTOMER_DATA_ROLES } from '@/lib/admin-roles';
import { sendEmail, escapeHtml } from '@/lib/resend';

export async function POST(request: Request) {
  const { ticketId } = await request.json();

  if (!ticketId || typeof ticketId !== 'string') {
    return NextResponse.json({ error: 'ticketId mangler' }, { status: 400 });
  }

  const auth = await requireAdmin(CUSTOMER_DATA_ROLES);
  if (!auth.ok) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }

  const adminClient = createAdminClient();
  const { data: ticket, error: ticketError } = await adminClient
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
    return NextResponse.json(
      {
        error: emailResult.error,
        code: emailResult.code,
        setupHint: emailResult.setupHint,
      },
      { status: 502 }
    );
  }

  return NextResponse.json({ ok: true });
}
