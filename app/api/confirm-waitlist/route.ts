import { NextResponse } from 'next/server';
import * as Sentry from '@sentry/nextjs';
import { createAdminClient } from '@/lib/supabase/admin';
import { siteUrl } from '@/lib/site-config';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const token = searchParams.get('token');

  if (!token) {
    return NextResponse.redirect(`${siteUrl}/waitlist-confirmed?status=invalid`);
  }

  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from('waitlist_signups')
    .update({ confirmed: true })
    .eq('confirm_token', token)
    .select('id')
    .maybeSingle();

  if (error) {
    Sentry.captureException(error, { tags: { route: 'confirm-waitlist' } });
    return NextResponse.redirect(`${siteUrl}/waitlist-confirmed?status=error`);
  }

  if (!data) {
    return NextResponse.redirect(`${siteUrl}/waitlist-confirmed?status=invalid`);
  }

  return NextResponse.redirect(`${siteUrl}/waitlist-confirmed?status=ok`);
}