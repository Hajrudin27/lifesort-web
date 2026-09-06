import { NextResponse } from 'next/server';
import * as Sentry from '@sentry/nextjs';
import { createAdminClient } from '@/lib/supabase/admin';
import { siteUrl } from '@/lib/site-config';

/**
 * confirm_token er en uuid i databasen. Uden det her tjek gik enhver streng videre til
 * forespørgslen, og Postgres svarede med en type-fejl (22P02) i stedet for et rent afslag —
 * som så blev logget i Sentry som om noget var gået galt. Alle kan kalde dette endpoint,
 * så det er billigt for en fremmed at fylde fejlloggen.
 */
const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const token = searchParams.get('token');

  if (!token || !UUID_PATTERN.test(token)) {
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