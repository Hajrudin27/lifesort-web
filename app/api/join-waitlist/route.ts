import { NextResponse } from 'next/server';
import * as Sentry from '@sentry/nextjs';
import { createAdminClient } from '@/lib/supabase/admin';
import { checkRateLimit, getClientIp } from '@/lib/rate-limit';

export async function POST(request: Request) {
  const body = await request.json();
  const { email, platform, company } = body;

  // Honeypot: bots that fill in every field trip this. Pretend success, insert nothing.
  if (typeof company === 'string' && company.trim().length > 0) {
    return NextResponse.json({ ok: true });
  }

  if (typeof email !== 'string' || email.trim().length === 0) {
    return NextResponse.json({ error: 'Email mangler' }, { status: 400 });
  }
  if (platform !== 'ios' && platform !== 'android') {
    return NextResponse.json({ error: 'Ugyldig platform' }, { status: 400 });
  }

  const ip = getClientIp(request);
  const { allowed } = checkRateLimit(`waitlist:${ip}`, 8, 15 * 60 * 1000); // 8 per 15 min
  if (!allowed) {
    return NextResponse.json(
      { error: 'For mange forsøg. Prøv igen om lidt.' },
      { status: 429 }
    );
  }

  const supabase = createAdminClient();
  const { error } = await supabase.from('waitlist_signups').insert({
    email: email.trim(),
    platform,
  });

  // A duplicate signup (unique constraint) is treated as success, not an error.
  if (error && error.code !== '23505') {
    Sentry.captureException(error, { tags: { route: 'join-waitlist' } });
    return NextResponse.json({ error: 'Kunne ikke tilmelde' }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}