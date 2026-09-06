import { ShieldCheck } from 'lucide-react';
import { createAdminClient } from '@/lib/supabase/admin';
import { requireAdmin } from '@/lib/admin-auth';
import { InviteAdminForm } from '@/components/invite-admin-form';
import { AdminUsersTable } from '@/components/admin-users-table';

export const metadata = {
  title: 'Admins',
};

export default async function AdminsPage() {
  // Kun ejere må invitere. Serveren håndhæver det i /api/invite-admin — her skjuler vi
  // blot formularen, så UI'et ikke tilbyder noget der alligevel bliver afvist.
  const auth = await requireAdmin();
  const canInvite = auth.ok && auth.admin.role === 'owner';

  const supabase = createAdminClient();

  const [{ data: adminRows }, { data: authData }] = await Promise.all([
    supabase.from('admin_users').select('*').order('full_name'),
    supabase.auth.admin.listUsers(),
  ]);

  const emailById = new Map((authData?.users ?? []).map((u) => [u.id, u.email ?? '—']));
  const admins = (adminRows ?? []).map((row) => ({
    id: row.id,
    fullName: row.full_name,
    email: emailById.get(row.id) ?? '—',
    role: row.role,
  }));

  return (
    <div>
      <div className="flex items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-stone-800 to-stone-900">
          <ShieldCheck className="h-5 w-5 text-white" strokeWidth={2.2} />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-stone-900 dark:text-stone-100">Admins</h1>
          <p className="text-sm text-stone-500 dark:text-stone-400">{adminRows?.length ?? 0} med adgang til panelet</p>
        </div>
      </div>

      {canInvite ? (
        <InviteAdminForm />
      ) : (
        <p className="mt-6 rounded-2xl border border-stone-200 bg-white p-5 text-sm text-stone-500 shadow-sm shadow-stone-900/5 dark:border-stone-800 dark:bg-stone-900 dark:text-stone-400">
          Kun ejere kan invitere nye admins.
        </p>
      )}

      <AdminUsersTable initialRows={admins} currentAdminId={auth.ok ? auth.admin.id : null} canManage={canInvite} />
    </div>
  );
}
