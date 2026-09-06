import { NextResponse } from 'next/server';
import { captureDatabaseError } from '@/lib/observability';
import { createAdminClient } from '@/lib/supabase/admin';
import { requireAdmin, isAdminRole, type AdminRole } from '@/lib/admin-auth';
import { OWNER_ONLY } from '@/lib/admin-roles';
import { logActivity } from '@/lib/activity-log';

type AdminUserRow = {
  id: string;
  full_name: string;
  role: AdminRole;
};

type ManageAdminBody = {
  id?: unknown;
  action?: unknown;
  role?: unknown;
};

async function getTargetAdmin(adminClient: ReturnType<typeof createAdminClient>, id: string) {
  return adminClient
    .from('admin_users')
    .select('id, full_name, role')
    .eq('id', id)
    .maybeSingle();
}

async function getOwnerCount(adminClient: ReturnType<typeof createAdminClient>) {
  const { count, error } = await adminClient
    .from('admin_users')
    .select('id', { count: 'exact', head: true })
    .eq('role', 'owner');

  if (error) throw error;
  return count ?? 0;
}

function canDemoteOrRemoveOwner(target: AdminUserRow, ownerCount: number) {
  return target.role !== 'owner' || ownerCount > 1;
}

export async function POST(request: Request) {
  const auth = await requireAdmin(OWNER_ONLY);
  if (!auth.ok) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }

  let body: ManageAdminBody;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Ugyldig anmodning' }, { status: 400 });
  }

  const { id, action, role } = body;
  if (typeof id !== 'string' || id.trim().length === 0) {
    return NextResponse.json({ error: 'Admin-id mangler' }, { status: 400 });
  }
  if (action !== 'update_role' && action !== 'remove_access') {
    return NextResponse.json({ error: 'Ugyldig handling' }, { status: 400 });
  }
  if (action === 'update_role' && !isAdminRole(role)) {
    return NextResponse.json({ error: 'Ugyldig rolle' }, { status: 400 });
  }

  const adminClient = createAdminClient();
  const { data: target, error: targetError } = await getTargetAdmin(adminClient, id);
  if (targetError) {
    captureDatabaseError(targetError, { route: 'admin-admins-update-target' });
    return NextResponse.json({ error: 'Kunne ikke hente admin-brugeren' }, { status: 500 });
  }
  if (!target || !isAdminRole(target.role)) {
    return NextResponse.json({ error: 'Admin-bruger ikke fundet' }, { status: 404 });
  }

  const typedTarget: AdminUserRow = {
    id: target.id,
    full_name: target.full_name,
    role: target.role,
  };

  if (action === 'update_role') {
    const newRole = role as AdminRole;
    if (typedTarget.id === auth.admin.id && newRole !== 'owner') {
      return NextResponse.json({ error: 'Du kan ikke sænke din egen ejerrolle.' }, { status: 400 });
    }
    if (typedTarget.role === newRole) {
      return NextResponse.json({ ok: true, row: typedTarget });
    }

    try {
      const ownerCount = await getOwnerCount(adminClient);
      if (typedTarget.role === 'owner' && newRole !== 'owner' && !canDemoteOrRemoveOwner(typedTarget, ownerCount)) {
        return NextResponse.json({ error: 'Der skal altid være mindst én owner tilbage.' }, { status: 400 });
      }
    } catch (err) {
      captureDatabaseError(err, { route: 'admin-admins-owner-count' });
      return NextResponse.json({ error: 'Kunne ikke tjekke owner-beskyttelsen' }, { status: 500 });
    }

    const { data, error } = await adminClient
      .from('admin_users')
      .update({ role: newRole })
      .eq('id', typedTarget.id)
      .select('id, full_name, role')
      .maybeSingle();

    if (error) {
      captureDatabaseError(error, { route: 'admin-admins-update-role' });
      return NextResponse.json({ error: 'Kunne ikke opdatere rollen' }, { status: 500 });
    }
    if (!data || !isAdminRole(data.role)) {
      return NextResponse.json({ error: 'Admin-bruger ikke fundet' }, { status: 404 });
    }

    await logActivity(adminClient, {
      actorId: auth.admin.id,
      actorName: auth.admin.fullName,
      action: 'updated',
      entityType: 'admin_user',
      entityId: data.id,
      entityLabel: `${data.full_name}: ${typedTarget.role} -> ${data.role}`,
    });

    return NextResponse.json({ ok: true, row: data });
  }

  if (typedTarget.id === auth.admin.id) {
    return NextResponse.json({ error: 'Du kan ikke fjerne din egen admin-adgang.' }, { status: 400 });
  }

  try {
    const ownerCount = await getOwnerCount(adminClient);
    if (!canDemoteOrRemoveOwner(typedTarget, ownerCount)) {
      return NextResponse.json({ error: 'Der skal altid være mindst én owner tilbage.' }, { status: 400 });
    }
  } catch (err) {
    captureDatabaseError(err, { route: 'admin-admins-owner-count' });
    return NextResponse.json({ error: 'Kunne ikke tjekke owner-beskyttelsen' }, { status: 500 });
  }

  const { error } = await adminClient
    .from('admin_users')
    .delete()
    .eq('id', typedTarget.id);

  if (error) {
    captureDatabaseError(error, { route: 'admin-admins-remove-access' });
    return NextResponse.json({ error: 'Kunne ikke fjerne admin-adgangen' }, { status: 500 });
  }

  await logActivity(adminClient, {
    actorId: auth.admin.id,
    actorName: auth.admin.fullName,
    action: 'deleted',
    entityType: 'admin_user',
    entityId: typedTarget.id,
    entityLabel: `${typedTarget.full_name} (${typedTarget.role})`,
  });

  return NextResponse.json({ ok: true });
}
