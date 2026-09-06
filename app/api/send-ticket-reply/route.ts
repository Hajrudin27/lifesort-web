import { NextResponse } from 'next/server';
import * as Sentry from '@sentry/nextjs';
import { createAdminClient } from '@/lib/supabase/admin';
import { requireAdmin } from '@/lib/admin-auth';
import { CUSTOMER_DATA_ROLES } from '@/lib/admin-roles';
import { sendEmail, escapeHtml } from '@/lib/resend';
import { checkRateLimit } from '@/lib/rate-limit';
import { logActivity } from '@/lib/activity-log';
import { readJsonBody } from '@/lib/validation';

export async function POST(request: Request) {
  // Auth først, og kroppen gennem readJsonBody. Rækkefølgen var omvendt, så en
  // uautentificeret kalder kunne få serveren til at parse en vilkårligt stor krop, før
  // afvisningen faldt — målt med 2 MB, der blev parset og derefter besvaret med 401.
  const auth = await requireAdmin(CUSTOMER_DATA_ROLES);
  if (!auth.ok) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }

  const parsedBody = await readJsonBody(request);
  if (!parsedBody.ok) {
    return NextResponse.json({ error: parsedBody.error }, { status: parsedBody.status });
  }
  const { ticketId } = (parsedBody.data ?? {}) as Record<string, unknown>;

  if (!ticketId || typeof ticketId !== 'string') {
    return NextResponse.json({ error: 'ticketId mangler' }, { status: 400 });
  }

  // Hvert kald sender en mail fra jeres domæne. Ruten er kun for owner og support, men en
  // kapret session skal ikke kunne bruges som afsendermaskine — og en fejl i UI'et skal
  // ikke kunne sende det samme svar hundrede gange.
  const { allowed } = await checkRateLimit(`ticket-reply:${auth.admin.id}`, 30, 60 * 60 * 1000);
  if (!allowed) {
    return NextResponse.json(
      { error: 'For mange svar sendt på kort tid. Prøv igen om lidt.' },
      { status: 429 }
    );
  }

  const adminClient = createAdminClient();
  const { data: ticket, error: ticketError } = await adminClient
    .from('support_tickets')
    .select('id, email, subject, message, admin_reply')
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

  await logActivity(adminClient, {
    actorId: auth.admin.id,
    actorName: auth.admin.fullName,
    action: 'replied',
    entityType: 'ticket',
    entityId: ticket.id,
    entityLabel: ticket.subject,
  });

  return NextResponse.json({ ok: true });
}
