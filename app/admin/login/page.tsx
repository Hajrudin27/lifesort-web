'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Lock, Mail, Loader2 } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';

export default function LoginPage() {
  const router = useRouter();
  const supabase = createClient();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsLoading(true);

    const { data, error: signInError } = await supabase.auth.signInWithPassword({ email, password });

    if (signInError) {
      setError('Forkert email eller adgangskode.');
      setIsLoading(false);
      return;
    }

    const { data: adminRow } = await supabase
      .from('admin_users')
      .select('id')
      .eq('id', data.user.id)
      .single();

    if (!adminRow) {
      setError('Denne konto har ikke admin-adgang.');
      await supabase.auth.signOut();
      setIsLoading(false);
      return;
    }

    router.push('/admin/dashboard');
    router.refresh();
  };

  return (
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden bg-gradient-to-br from-rose-50 via-stone-50 to-amber-50">
      <div className="absolute -top-32 -right-32 h-96 w-96 rounded-full bg-rose-200/40 blur-3xl" />
      <div className="absolute -bottom-32 -left-32 h-96 w-96 rounded-full bg-amber-200/40 blur-3xl" />

      <form
        onSubmit={handleLogin}
        className="relative z-10 w-full max-w-sm space-y-5 rounded-3xl border border-stone-200/60 bg-white/90 p-8 shadow-xl shadow-rose-900/5 backdrop-blur-sm"
      >
        <div className="flex flex-col items-center gap-2 pb-2 text-center">
          <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-rose-500 to-rose-600 shadow-lg shadow-rose-500/30">
            <Lock className="h-6 w-6 text-white" strokeWidth={2.2} />
          </div>
          <h1 className="mt-2 text-xl font-bold text-stone-900">LifeSort Admin</h1>
          <p className="text-sm text-stone-500">Log ind for at fortsætte</p>
        </div>

        <div className="space-y-3">
          <div className="relative">
            <Mail className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-stone-400" />
            <input
              type="email"
              placeholder="Email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full rounded-xl border border-stone-200 bg-stone-50/50 py-2.5 pl-10 pr-3 text-sm text-stone-900 outline-none transition focus:border-rose-400 focus:bg-white focus:ring-4 focus:ring-rose-100"
              required
            />
          </div>
          <div className="relative">
            <Lock className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-stone-400" />
            <input
              type="password"
              placeholder="Adgangskode"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full rounded-xl border border-stone-200 bg-stone-50/50 py-2.5 pl-10 pr-3 text-sm text-stone-900 outline-none transition focus:border-rose-400 focus:bg-white focus:ring-4 focus:ring-rose-100"
              required
            />
          </div>
        </div>

        {error && (
          <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-600">{error}</p>
        )}

        <button
          type="submit"
          disabled={isLoading}
          className="flex w-full items-center justify-center gap-2 rounded-xl bg-stone-900 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-stone-800 disabled:opacity-50"
        >
          {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
          {isLoading ? 'Logger ind...' : 'Log ind'}
        </button>
      </form>
    </div>
  );
}