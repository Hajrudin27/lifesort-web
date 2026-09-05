import { NextResponse } from 'next/server';
import * as Sentry from '@sentry/nextjs';
import { createAdminClient } from '@/lib/supabase/admin';
import { createClient } from '@/lib/supabase/server';

export async function POST(request: Request) {
  const { id } = await request.json();

  if (!id || typeof id !== 'string') {
    return NextResponse.json({ error: 'id mangler' }, { status: 400 });
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
