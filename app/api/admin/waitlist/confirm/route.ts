import { NextResponse } from 'next/server';
import { captureDatabaseError } from '@/lib/observability';
import { createAdminClient } from '@/lib/supabase/admin';
import { requireAdmin } from '@/lib/admin-auth';
import { CUSTOMER_DATA_ROLES } from '@/lib/admin-roles';
import { logActivity } from '@/lib/activity-log';
import { emailAuditId, maskEmail } from '@/lib/privacy';

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
    captureDatabaseError(error, { route: 'admin-waitlist-confirm' });
    return NextResponse.json({ error: 'Kunne ikke bekræfte tilmeldingen' }, { status: 500 });
  }

  if (!data) {
    return NextResponse.json({ error: 'Tilmelding ikke fundet' }, { status: 404 });
  }

  await logActivity(adminClient, {
    actorId: auth.admin.id,
    actorName: auth.admin.fullName,
    action: 'confirmed',
    entityType: 'waitlist_signup',
    entityId: data.id,
    entityLabel: `${maskEmail(data.email)} (${data.platform}) · audit ${emailAuditId(data.email)}`,
  });

  return NextResponse.json({ ok: true, row: data });
}
