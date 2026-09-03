'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { UserPlus } from 'lucide-react';
import { useToast } from '@/components/toast-provider';

export function InviteAdminForm() {
  const router = useRouter();
  const { showToast } = useToast();

  const [email, setEmail] = useState('');
  const [fullName, setFullName] = useState('');
  const [role, setRole] = useState('owner');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const canSubmit = email.trim().length > 0 && fullName.trim().length > 0;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!canSubmit) return;
    setIsSubmitting(true);

    try {
      const res = await fetch('/api/invite-admin', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: email.trim(), fullName: fullName.trim(), role: role.trim() }),
      });
      const body = await res.json().catch(() => ({}));

      if (!res.ok) {
        showToast(body.error ?? 'Kunne ikke invitere.', 'error');
        setIsSubmitting(false);
        return;
      }

      showToast(`Invitation sendt til ${email.trim()}.`);
      setEmail(''); setFullName('');
      router.refresh();
    } catch {
      showToast('Kunne ikke invitere.', 'error');
    }
    setIsSubmitting(false);
  };

  return (
    <form onSubmit={handleSubmit} className="mt-6 flex flex-wrap items-end gap-3 rounded-2xl border border-stone-200 bg-white p-5 shadow-sm shadow-stone-900/5">
      <div className="flex flex-col gap-1">
        <label className="text-xs font-semibold text-stone-500">Navn</label>
        <input value={fullName} onChange={(e) => setFullName(e.target.value)}
          className="rounded-xl border border-stone-200 px-3 py-2 text-sm outline-none focus:border-stone-400 focus:ring-4 focus:ring-stone-100"
          placeholder="Fx Walid" />
      </div>
      <div className="flex flex-col gap-1">
        <label className="text-xs font-semibold text-stone-500">Email</label>
        <input type="email" value={email} onChange={(e) => setEmail(e.target.value)}
          className="rounded-xl border border-stone-200 px-3 py-2 text-sm outline-none focus:border-stone-400 focus:ring-4 focus:ring-stone-100"
          placeholder="navn@email.dk" />
      </div>
      <div className="flex flex-col gap-1">
        <label className="text-xs font-semibold text-stone-500">Rolle</label>
        <input value={role} onChange={(e) => setRole(e.target.value)}
          className="w-28 rounded-xl border border-stone-200 px-3 py-2 text-sm outline-none focus:border-stone-400 focus:ring-4 focus:ring-stone-100"
          placeholder="owner" />
      </div>
      <button type="submit" disabled={!canSubmit || isSubmitting}
        className="flex items-center gap-1.5 rounded-xl bg-stone-900 px-4 py-2 text-sm font-semibold text-white transition hover:bg-stone-800 disabled:opacity-40">
        <UserPlus size={15} />
        {isSubmitting ? 'Inviterer...' : 'Inviter admin'}
      </button>
    </form>
  );
}