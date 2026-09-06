'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { Loader2, ShieldCheck, Trash2 } from 'lucide-react';
import { ADMIN_ROLES, type AdminRole } from '@/lib/admin-roles';
import { useConfirm } from '@/components/confirm-dialog';
import { useToast } from '@/components/toast-provider';

export type AdminUserListRow = {
  id: string;
  fullName: string;
  email: string;
  role: AdminRole;
};

type AdminUpdateResponse = {
  error?: string;
  row?: {
    id: string;
    full_name: string;
    role: AdminRole;
  };
};

const ROLE_LABEL: Record<AdminRole, string> = {
  owner: 'Owner',
  editor: 'Editor',
  support: 'Support',
};

const ROLE_DESCRIPTION: Record<AdminRole, string> = {
  owner: 'Fuld adgang, invitationer og systemindstillinger',
  editor: 'Indhold, mad, sundhed og tidslinje',
  support: 'Supportsager og venteliste',
};

const ROLE_STYLE: Record<AdminRole, string> = {
  owner: 'bg-rose-100 text-rose-700 dark:bg-rose-500/15 dark:text-rose-400',
  editor: 'bg-sky-100 text-sky-700 dark:bg-sky-500/15 dark:text-sky-400',
  support: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-400',
};

function initials(name: string) {
  return name
    .split(' ')
    .map((n) => n[0])
    .slice(0, 2)
    .join('')
    .toUpperCase();
}

export function AdminUsersTable({
  initialRows,
  currentAdminId,
  canManage,
}: {
  initialRows: AdminUserListRow[];
  currentAdminId: string | null;
  canManage: boolean;
}) {
  const router = useRouter();
  const confirm = useConfirm();
  const { showToast } = useToast();
  const [rows, setRows] = useState(initialRows);
  const [pendingId, setPendingId] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const ownerCount = rows.filter((row) => row.role === 'owner').length;

  const refreshServerRows = () => {
    startTransition(() => {
      router.refresh();
    });
  };

  const updateRole = async (row: AdminUserListRow, role: AdminRole) => {
    if (row.role === role) return;

    setPendingId(row.id);
    try {
      const res = await fetch('/api/admin/admins/update', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: row.id, action: 'update_role', role }),
      });
      const body = (await res.json().catch(() => ({}))) as AdminUpdateResponse;
      if (!res.ok || !body.row) {
        showToast(body.error ?? 'Kunne ikke opdatere rollen.', 'error');
        return;
      }

      setRows((prev) => prev.map((item) => (item.id === row.id ? { ...item, role: body.row!.role } : item)));
      showToast(`${row.fullName} er nu ${ROLE_LABEL[body.row.role]}.`);
      refreshServerRows();
    } catch {
      showToast('Kunne ikke opdatere rollen.', 'error');
    } finally {
      setPendingId(null);
    }
  };

  const removeAccess = async (row: AdminUserListRow) => {
    const accepted = await confirm({
      title: 'Fjern admin-adgang?',
      message: `${row.fullName} mister adgang til admin-panelet. Auth-kontoen slettes ikke.`,
      confirmLabel: 'Fjern adgang',
    });
    if (!accepted) return;

    setPendingId(row.id);
    try {
      const res = await fetch('/api/admin/admins/update', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: row.id, action: 'remove_access' }),
      });
      const body = (await res.json().catch(() => ({}))) as AdminUpdateResponse;
      if (!res.ok) {
        showToast(body.error ?? 'Kunne ikke fjerne admin-adgangen.', 'error');
        return;
      }

      setRows((prev) => prev.filter((item) => item.id !== row.id));
      showToast(`${row.fullName} har ikke længere admin-adgang.`);
      refreshServerRows();
    } catch {
      showToast('Kunne ikke fjerne admin-adgangen.', 'error');
    } finally {
      setPendingId(null);
    }
  };

  return (
    <div className="mt-6 overflow-hidden rounded-2xl border border-stone-200 bg-white shadow-sm shadow-stone-900/5 dark:border-stone-800 dark:bg-stone-900">
      <div className="border-b border-stone-100 px-5 py-4 dark:border-stone-800">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 className="text-sm font-bold text-stone-900 dark:text-stone-100">Adgang</h2>
            <p className="mt-1 text-xs text-stone-500 dark:text-stone-400">
              {ownerCount} owner{ownerCount === 1 ? '' : 's'} beskytter de mest følsomme admin-funktioner.
            </p>
          </div>
          {isPending && (
            <span className="flex items-center gap-1.5 rounded-full bg-stone-100 px-2.5 py-1 text-xs font-semibold text-stone-500 dark:bg-stone-800 dark:text-stone-400">
              <Loader2 size={12} className="animate-spin" />
              Opdaterer
            </span>
          )}
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full min-w-[820px] text-left text-sm">
          <thead className="border-b border-stone-100 bg-stone-50/50 text-xs font-semibold uppercase tracking-wide text-stone-500 dark:border-stone-800 dark:bg-stone-800/50 dark:text-stone-400">
            <tr>
              <th className="px-5 py-3">Navn</th>
              <th className="px-5 py-3">Email</th>
              <th className="px-5 py-3">Rolle</th>
              <th className="px-5 py-3">Adgang</th>
              {canManage && <th className="px-5 py-3 text-right">Handling</th>}
            </tr>
          </thead>
          <tbody className="divide-y divide-stone-100 dark:divide-stone-800">
            {rows.map((row) => {
              const isCurrentAdmin = row.id === currentAdminId;
              const isLastOwner = row.role === 'owner' && ownerCount <= 1;
              const isBusy = pendingId === row.id;

              return (
                <tr key={row.id} className="transition hover:bg-stone-50/50 dark:hover:bg-stone-800/50">
                  <td className="px-5 py-3.5">
                    <div className="flex items-center gap-3">
                      <span className="flex h-9 w-9 items-center justify-center rounded-full bg-rose-500/10 text-xs font-bold text-rose-600 dark:bg-rose-500/15 dark:text-rose-400">
                        {initials(row.fullName)}
                      </span>
                      <div>
                        <p className="font-medium text-stone-900 dark:text-stone-100">{row.fullName}</p>
                        {isCurrentAdmin && <p className="mt-0.5 text-xs text-stone-400 dark:text-stone-500">Dig</p>}
                      </div>
                    </div>
                  </td>
                  <td className="px-5 py-3.5 text-stone-600 dark:text-stone-400">{row.email}</td>
                  <td className="px-5 py-3.5">
                    {canManage ? (
                      <select
                        value={row.role}
                        disabled={isBusy || isCurrentAdmin || isLastOwner}
                        onChange={(event) => updateRole(row, event.target.value as AdminRole)}
                        className="rounded-xl border border-stone-200 bg-white px-3 py-2 text-xs font-semibold text-stone-700 outline-none transition focus:border-stone-400 disabled:opacity-50 dark:border-stone-700 dark:bg-stone-950 dark:text-stone-200"
                      >
                        {ADMIN_ROLES.map((role) => (
                          <option key={role} value={role}>
                            {ROLE_LABEL[role]}
                          </option>
                        ))}
                      </select>
                    ) : (
                      <span className={`rounded-full px-2.5 py-1 text-xs font-semibold ${ROLE_STYLE[row.role]}`}>
                        {ROLE_LABEL[row.role]}
                      </span>
                    )}
                  </td>
                  <td className="px-5 py-3.5">
                    <div className="flex items-center gap-2">
                      <span className={`rounded-full px-2.5 py-1 text-xs font-semibold ${ROLE_STYLE[row.role]}`}>
                        {ROLE_LABEL[row.role]}
                      </span>
                      <span className="text-xs text-stone-500 dark:text-stone-400">{ROLE_DESCRIPTION[row.role]}</span>
                    </div>
                  </td>
                  {canManage && (
                    <td className="px-5 py-3.5 text-right">
                      <button
                        onClick={() => removeAccess(row)}
                        disabled={isBusy || isCurrentAdmin || isLastOwner}
                        className="inline-flex items-center gap-1.5 rounded-xl border border-red-200 px-3 py-2 text-xs font-semibold text-red-700 transition hover:bg-red-50 disabled:opacity-40 dark:border-red-500/30 dark:text-red-300 dark:hover:bg-red-500/10"
                        title={
                          isCurrentAdmin
                            ? 'Du kan ikke fjerne din egen adgang'
                            : isLastOwner
                              ? 'Der skal altid være mindst én owner'
                              : 'Fjern admin-adgang'
                        }
                      >
                        {isBusy ? <Loader2 size={14} className="animate-spin" /> : <Trash2 size={14} />}
                        Fjern
                      </button>
                    </td>
                  )}
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {canManage && (
        <div className="flex items-start gap-2 border-t border-stone-100 bg-stone-50/60 px-5 py-4 text-xs text-stone-500 dark:border-stone-800 dark:bg-stone-950/40 dark:text-stone-400">
          <ShieldCheck size={15} className="mt-0.5 shrink-0" />
          Rolleændringer og fjernet adgang logges i aktivitetsloggen. Auth-brugeren slettes ikke, når admin-adgang fjernes.
        </div>
      )}
    </div>
  );
}
