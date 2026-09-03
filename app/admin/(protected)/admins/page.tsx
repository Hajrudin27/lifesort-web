import { ShieldCheck } from 'lucide-react';
import { createAdminClient } from '@/lib/supabase/admin';
import { InviteAdminForm } from '@/components/invite-admin-form';

export const metadata = {
  title: 'Admins',
};

function initials(name: string) {
  return name.split(' ').map((n) => n[0]).slice(0, 2).join('').toUpperCase();
}

export default async function AdminsPage() {
  const supabase = createAdminClient();

  const [{ data: adminRows }, { data: authData }] = await Promise.all([
    supabase.from('admin_users').select('*').order('full_name'),
    supabase.auth.admin.listUsers(),
  ]);

  const emailById = new Map((authData?.users ?? []).map((u) => [u.id, u.email ?? '—']));

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

      <div className="mt-6 overflow-hidden rounded-2xl border border-stone-200 bg-white shadow-sm shadow-stone-900/5 dark:border-stone-800 dark:bg-stone-900">
        <table className="w-full text-sm">
          <thead className="border-b border-stone-100 bg-stone-50/50 text-left text-xs font-semibold text-stone-500 dark:border-stone-800 dark:bg-stone-800/50 dark:text-stone-400">
            <tr>
              <th className="px-5 py-3">Navn</th>
              <th className="px-5 py-3">Email</th>
              <th className="px-5 py-3">Rolle</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-stone-100 dark:divide-stone-800">
            {(adminRows ?? []).map((row) => (
              <tr key={row.id} className="transition hover:bg-stone-50/50 dark:hover:bg-stone-800/50">
                <td className="px-5 py-3.5">
                  <div className="flex items-center gap-3">
                    <span className="flex h-8 w-8 items-center justify-center rounded-full bg-rose-500/10 text-xs font-bold text-rose-600 dark:bg-rose-500/15 dark:text-rose-400">
                      {initials(row.full_name)}
                    </span>
                    <span className="font-medium text-stone-900 dark:text-stone-100">{row.full_name}</span>
                  </div>
                </td>
                <td className="px-5 py-3.5 text-stone-600 dark:text-stone-400">{emailById.get(row.id) ?? '—'}</td>
                <td className="px-5 py-3.5">
                  <span className="rounded-full bg-stone-100 px-2.5 py-1 text-xs font-semibold capitalize text-stone-700 dark:bg-stone-800 dark:text-stone-300">
                    {row.role}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}