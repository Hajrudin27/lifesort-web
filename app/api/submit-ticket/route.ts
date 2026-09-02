import { NextResponse } from 'next/server';
import * as Sentry from '@sentry/nextjs';
import { createAdminClient } from '@/lib/supabase/admin';
import { checkRateLimit, getClientIp } from '@/lib/rate-limit';
import { sendEmail, escapeHtml } from '@/lib/resend';

export async function POST(request: Request) {
  const body = await request.json();
  const { name, email, subject, message, company } = body;

  // Honeypot: bots that fill in every field trip this. Pretend success, insert nothing.
  if (typeof company === 'string' && company.trim().length > 0) {
    return NextResponse.json({ ok: true });
  }

  if (
    typeof name !== 'string' || name.trim().length === 0 ||
    typeof email !== 'string' || email.trim().length === 0 ||
    typeof subject !== 'string' || subject.trim().length === 0 ||
    typeof message !== 'string' || message.trim().length === 0
  ) {
    return NextResponse.json({ error: 'Udfyld alle felter' }, { status: 400 });
  }

  const ip = getClientIp(request);
  const { allowed } = checkRateLimit(`ticket:${ip}`, 5, 15 * 60 * 1000); // 5 per 15 min
  if (!allowed) {
    return NextResponse.json(
      { error: 'For mange henvendelser. Prøv igen om lidt.' },
      { status: 429 }
    );
  }

  const supabase = createAdminClient();
  const { error } = await supabase.from('support_tickets').insert({
    name: name.trim(),
    email: email.trim(),
    subject: subject.trim(),
    message: message.trim(),
  });

  if (error) {
    Sentry.captureException(error, { tags: { route: 'submit-ticket' } });
    return NextResponse.json({ error: 'Kunne ikke oprette sagen' }, { status: 500 });
  }

  // Confirmation email is best-effort: the ticket is already saved either way.
  const emailResult = await sendEmail({
    to: email.trim(),
    subject: 'Vi har modtaget din henvendelse',
    html: `
      <p>Hej ${escapeHtml(name.trim())},</p>
      <p>Tak for din besked — vi har modtaget den og svarer hurtigst muligt.</p>
      <p style="color: #78716c; font-size: 13px; margin-top: 24px;">
        Din besked:<br>
        <strong>${escapeHtml(subject.trim())}</strong><br>
        <em>${escapeHtml(message.trim()).replace(/\n/g, '<br>')}</em>
      </p>
      <p>Mvh<br>LifeSort Support</p>
    `,
  });
  if (!emailResult.ok) {
    Sentry.captureMessage(`Ticket confirmation email failed: ${emailResult.error}`, 'warning');
  }

  return NextResponse.json({ ok: true });
}