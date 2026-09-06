import { NextResponse } from 'next/server';
import * as Sentry from '@sentry/nextjs';
import { createAdminClient } from '@/lib/supabase/admin';
import { checkRateLimit, getClientIp, emailKey } from '@/lib/rate-limit';
import { sendEmail } from '@/lib/resend';
import { siteUrl } from '@/lib/site-config';
import { cleanEmail, readJsonBody } from '@/lib/validation';

export async function POST(request: Request) {
  const parsedBody = await readJsonBody(request);
  if (!parsedBody.ok) {
    return NextResponse.json({ error: parsedBody.error }, { status: parsedBody.status });
  }
  const body = (parsedBody.data ?? {}) as Record<string, unknown>;
  const { email, platform, company } = body;

  // Honeypot: bots that fill in every field trip this. Pretend success, insert nothing.
  if (typeof company === 'string' && company.trim().length > 0) {
    return NextResponse.json({ ok: true });
  }

  const validEmail = cleanEmail(email);
  if (!validEmail.ok) {
    return NextResponse.json({ error: validEmail.error }, { status: 400 });
  }
  if (platform !== 'ios' && platform !== 'android') {
    return NextResponse.json({ error: 'Ugyldig platform' }, { status: 400 });
  }
  const cleanEmailValue = validEmail.value;

  const ip = getClientIp(request);
  const { allowed } = checkRateLimit(`waitlist:${ip}`, 8, 15 * 60 * 1000); // 8 per 15 min
  if (!allowed) {
    return NextResponse.json(
      { error: 'For mange forsøg. Prøv igen om lidt.' },
      { status: 429 }
    );
  }

  // Samme grund som i submit-ticket: bekræftelsesmailen går til den indtastede adresse.
  const { allowed: emailAllowed } = checkRateLimit(emailKey('waitlist-email', cleanEmailValue), 3, 60 * 60 * 1000);
  if (!emailAllowed) {
    return NextResponse.json({ ok: true, emailSent: false });
  }

  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from('waitlist_signups')
    .insert({ email: cleanEmailValue, platform })
    .select('confirm_token')
    .single();

  // A duplicate signup (unique constraint) is treated as success, not an error —
  // no new confirmation email is sent for an already-existing signup.
  if (error) {
    if (error.code === '23505') {
      return NextResponse.json({ ok: true, emailSent: false });
    }
    Sentry.captureException(error, { tags: { route: 'join-waitlist' } });
    return NextResponse.json({ error: 'Kunne ikke tilmelde' }, { status: 500 });
  }

  const confirmUrl = `${siteUrl}/api/confirm-waitlist?token=${data.confirm_token}`;
  const emailResult = await sendEmail({
    to: cleanEmailValue,
    subject: 'Bekræft din tilmelding til LifeSort',
    html: `
      <p>Hej!</p>
      <p>Tak fordi du vil på ventelisten til LifeSort. Bekræft lige din email, så vi ved, det er dig:</p>
      <p><a href="${confirmUrl}" style="display:inline-block;background:#1c1917;color:#fff;padding:10px 20px;border-radius:10px;text-decoration:none;font-weight:600;">Bekræft tilmelding</a></p>
      <p style="color:#78716c;font-size:13px;">Hvis linket ikke virker, kan du kopiere denne adresse: ${confirmUrl}</p>
    `,
  });

  if (!emailResult.ok) {
    // Tilmeldingen er stadig gemt — vi fejler ikke selve signup'et, hvis kun emailen fejler.
    Sentry.captureMessage('Kunne ikke sende bekræftelsesmail til venteliste', {
      level: 'warning',
      extra: { error: emailResult.error },
    });
  }

  return NextResponse.json({ ok: true, emailSent: emailResult.ok });
}
