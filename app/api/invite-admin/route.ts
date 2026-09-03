import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { siteUrl } from '@/lib/site-config';

export async function POST(request: Request) {
  const { email, fullName, role } = await request.json();

  if (typeof email !== 'string' || email.trim().length === 0) {
    return NextResponse.json({ error: 'Email mangler' }, { status: 400 });
  }
  if (typeof fullName !== 'string' || fullName.trim().length === 0) {
    return NextResponse.json({ error: 'Navn mangler' }, { status: 400 });
  }

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Ikke logget ind' }, { status: 401 });

  const { data: callerRow } = await supabase
    .from('admin_users')
    .select('id, full_name')
    .eq('id', user.id)
    .single();
  if (!callerRow) return NextResponse.json({ error: 'Ingen admin-adgang' }, { status: 403 });

  const adminClient = createAdminClient();

  const { data: invited, error: inviteError } = await adminClient.auth.admin.inviteUserByEmail(email.trim(), {
    redirectTo: `${siteUrl}/admin/dashboard`,
  });
  if (inviteError || !invited?.user) {
    return NextResponse.json({ error: inviteError?.message ?? 'Kunne ikke invitere brugeren' }, { status: 500 });
  }

  const { error: insertError } = await adminClient.from('admin_users').insert({
    id: invited.user.id,
    full_name: fullName.trim(),
    role: (typeof role === 'string' && role.trim()) || 'editor',
  });
  if (insertError) {
    return NextResponse.json(
      { error: 'Brugeren blev inviteret, men kunne ikke tilføjes som admin. Tjek admin_users manuelt.' },
      { status: 500 }
    );
  }

  await adminClient.from('activity_log').insert({
    actor_id: callerRow.id,
    actor_name: callerRow.full_name,
    action: 'invited',
    entity_type: 'admin_user',
    entity_label: `${fullName.trim()} (${email.trim()})`,
  });

  return NextResponse.json({ ok: true });
}