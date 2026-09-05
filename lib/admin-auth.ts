import { createClient } from '@/lib/supabase/server';
import { isAdminRole, type AdminRole } from '@/lib/admin-roles';

export { ADMIN_ROLES, isAdminRole } from '@/lib/admin-roles';
export type { AdminRole } from '@/lib/admin-roles';

export type AdminIdentity = {
  id: string;
  fullName: string;
  role: AdminRole;
};

export type AdminAuthResult =
  | { ok: true; admin: AdminIdentity }
  | { ok: false; status: 401 | 403; error: string };

/**
 * Server-side gate for admin endpoints. Slår altid rollen op i databasen — aldrig ud fra
 * noget klienten sender, og aldrig ud fra at UI'et skjulte knappen.
 *
 * Uden `allowedRoles` kræves blot at brugeren står i admin_users. Med `allowedRoles`
 * kræves derudover en af de angivne roller.
 */
export async function requireAdmin(
  allowedRoles?: readonly AdminRole[]
): Promise<AdminAuthResult> {
  const supabase = await createClient();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return { ok: false, status: 401, error: 'Ikke logget ind' };
  }

  const { data: row } = await supabase
    .from('admin_users')
    .select('id, full_name, role')
    .eq('id', user.id)
    .single();

  if (!row || !isAdminRole(row.role)) {
    return { ok: false, status: 403, error: 'Ingen admin-adgang' };
  }

  const admin: AdminIdentity = { id: row.id, fullName: row.full_name, role: row.role };

  if (allowedRoles && !allowedRoles.includes(admin.role)) {
    return { ok: false, status: 403, error: 'Din rolle har ikke adgang til denne handling' };
  }

  return { ok: true, admin };
}
