import { ShieldCheck } from 'lucide-react';
import { createAdminClient } from '@/lib/supabase/admin';
import { redirect } from 'next/navigation';
import { requireAdmin } from '@/lib/admin-auth';
import { OWNER_ONLY } from '@/lib/admin-roles';
import { InviteAdminForm } from '@/components/invite-admin-form';
import { AdminUsersTable } from '@/components/admin-users-table';

export const metadata = {
  title: 'Admins',
};

export default async function AdminsPage() {
  // Hele siden er owner-only. Tjekket lå tidligere kun i middleware, mens siden selv
  // nøjedes med requireAdmin() uden rolle — og da den henter med service role-nøglen, der
  // går uden om RLS, var middleware det eneste der holdt en editor eller support ude af
  // admin-listen med emailadresser. Rollen håndhæves derfor også her.
  const auth = await requireAdmin(OWNER_ONLY);
  if (!auth.ok) redirect('/admin/dashboard');

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

      <InviteAdminForm />

      <AdminUsersTable initialRows={admins} currentAdminId={auth.admin.id} canManage />
    </div>
  );
}
