import { NextResponse } from 'next/server';
import * as Sentry from '@sentry/nextjs';
import { createAdminClient } from '@/lib/supabase/admin';
import { requireAdmin } from '@/lib/admin-auth';
import { CUSTOMER_DATA_ROLES } from '@/lib/admin-roles';

export async function POST(request: Request) {
  const { id } = await request.json();

  if (!id || typeof id !== 'string') {
    return NextResponse.json({ error: 'id mangler' }, { status: 400 });
  }

  const auth = await requireAdmin(CUSTOMER_DATA_ROLES);
  if (!auth.ok) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }

  const adminClient = createAdminClient();
  const { data, error } = await adminClient
    .from('waitlist_signups')
    .update({ confirmed: true })
    .eq('id', id)
    .select('id, email, platform, confirmed, created_at')
    .maybeSingle();

  if (error) {
    Sentry.captureException(error, { tags: { route: 'admin-waitlist-confirm' } });
    return NextResponse.json({ error: 'Kunne ikke bekræfte tilmeldingen' }, { status: 500 });
  }

  if (!data) {
    return NextResponse.json({ error: 'Tilmelding ikke fundet' }, { status: 404 });
  }

  return NextResponse.json({ ok: true, row: data });
}
