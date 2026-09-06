'use client';

import { useEffect, useState, useCallback } from 'react';
import {
  AlertTriangle,
  Apple,
  CheckCircle2,
  Clock,
  Download,
  Loader2,
  Search,
  Smartphone,
  TrendingUp,
  Trash2,
  Users,
} from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import { useToast } from '@/components/toast-provider';
import { useConfirm } from '@/components/confirm-dialog';
import { rowsToCsv } from '@/lib/csv';
import { SkeletonRows } from '@/components/skeleton-rows';
import { useDebouncedValue } from '@/hooks/useDebouncedValue';

type Platform = 'ios' | 'android';

type WaitlistRow = {
  id: string;
  email: string;
  platform: Platform;
  confirmed: boolean;
  created_at: string;
};

type WaitlistStats = {
  total: number;
  confirmed: number;
  pending: number;
  ios: number;
  android: number;
  last7: number;
  last30: number;
};

const PAGE_SIZE = 30;

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString('da-DK', { day: '2-digit', month: 'short', year: 'numeric' });
}

function daysAgoIso(days: number) {
  const d = new Date();
  d.setDate(d.getDate() - days);
  return d.toISOString();
}

function percent(part: number, total: number) {
  if (total === 0) return 0;
  return Math.round((part / total) * 100);
}

function insightText(stats: WaitlistStats) {
  if (stats.total === 0) return 'Ventelisten er klar til første tilmelding.';
  if (stats.pending > stats.confirmed) return 'Mange mangler bekræftelse. Brug knappen i tabellen til manuelt at rydde op.';
  if (stats.last7 > 0) return `${stats.last7} nye tilmeldinger de sidste 7 dage. God bevægelse.`;
  return 'Ventelisten er stabil. Hold øje med nye tilmeldinger op mod launch.';
}

function StatCard({
  label,
  value,
  detail,
  icon: Icon,
  tone,
}: {
  label: string;
  value: string;
  detail: string;
  icon: typeof Users;
  tone: string;
}) {
  return (
    <div className="rounded-2xl border border-stone-200 bg-white p-5 shadow-sm shadow-stone-900/5 dark:border-stone-800 dark:bg-stone-900">
      <div className={`flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br ${tone}`}>
        <Icon className="h-5 w-5 text-white" strokeWidth={2.2} />
      </div>
      <p className="mt-4 text-2xl font-bold text-stone-900 dark:text-stone-100">{value}</p>
      <p className="text-xs font-medium text-stone-500 dark:text-stone-400">{label}</p>
      <p className="mt-2 text-xs text-stone-400 dark:text-stone-500">{detail}</p>
    </div>
  );
}

export default function WaitlistPage() {
  const supabase = createClient();
  const { showToast } = useToast();

  const [rows, setRows] = useState<WaitlistRow[]>([]);
  const [totalCount, setTotalCount] = useState(0);
  const [stats, setStats] = useState<WaitlistStats>({
    total: 0,
    confirmed: 0,
    pending: 0,
    ios: 0,
    android: 0,
    last7: 0,
    last30: 0,
  });
  const [page, setPage] = useState(0);
  const [search, setSearch] = useState('');
  const debouncedSearch = useDebouncedValue(search, 300);
  const [platformFilter, setPlatformFilter] = useState<Platform | 'all'>('all');
  const [confirmedFilter, setConfirmedFilter] = useState<'all' | 'confirmed' | 'pending'>('all');
  const [isLoading, setIsLoading] = useState(true);
  const [confirmingId, setConfirmingId] = useState<string | null>(null);

  const fetchStats = useCallback(async () => {
    const since7 = daysAgoIso(7);
    const since30 = daysAgoIso(30);

    const [totalRes, confirmedRes, iosRes, androidRes, last7Res, last30Res] = await Promise.all([
      supabase.from('waitlist_signups').select('id', { count: 'exact', head: true }),
      supabase.from('waitlist_signups').select('id', { count: 'exact', head: true }).eq('confirmed', true),
      supabase.from('waitlist_signups').select('id', { count: 'exact', head: true }).eq('platform', 'ios'),
      supabase.from('waitlist_signups').select('id', { count: 'exact', head: true }).eq('platform', 'android'),
      supabase.from('waitlist_signups').select('id', { count: 'exact', head: true }).gte('created_at', since7),
      supabase.from('waitlist_signups').select('id', { count: 'exact', head: true }).gte('created_at', since30),
    ]);

    const total = totalRes.count ?? 0;
    const confirmed = confirmedRes.count ?? 0;
    setStats({
      total,
      confirmed,
      pending: Math.max(0, total - confirmed),
      ios: iosRes.count ?? 0,
      android: androidRes.count ?? 0,
      last7: last7Res.count ?? 0,
      last30: last30Res.count ?? 0,
    });
  }, [supabase]);

  const fetchRows = useCallback(async () => {
    await Promise.resolve();
    setIsLoading(true);
    let query = supabase
      .from('waitlist_signups')
      .select('*', { count: 'exact' })
      .order('created_at', { ascending: false });

    if (debouncedSearch.trim()) query = query.ilike('email', `%${debouncedSearch.trim()}%`);
    if (platformFilter !== 'all') query = query.eq('platform', platformFilter);
    if (confirmedFilter !== 'all') query = query.eq('confirmed', confirmedFilter === 'confirmed');

    const from = page * PAGE_SIZE;
    const to = from + PAGE_SIZE - 1;
    query = query.range(from, to);

    const { data, count, error } = await query;
    if (!error) {
      setRows(data ?? []);
      setTotalCount(count ?? 0);
    } else {
      showToast('Kunne ikke hente ventelisten.', 'error');
    }
    setIsLoading(false);
  }, [supabase, debouncedSearch, platformFilter, confirmedFilter, page, showToast]);

  useEffect(() => {
    queueMicrotask(() => {
      fetchRows();
      fetchStats();
    });
  }, [fetchRows, fetchStats]);

  const [isExporting, setIsExporting] = useState(false);

  const exportCsv = async () => {
    setIsExporting(true);
    let query = supabase
      .from('waitlist_signups')
      .select('email, platform, confirmed, created_at')
      .order('created_at', { ascending: false });

    if (search.trim()) query = query.ilike('email', `%${search.trim()}%`);
    if (platformFilter !== 'all') query = query.eq('platform', platformFilter);
    if (confirmedFilter !== 'all') query = query.eq('confirmed', confirmedFilter === 'confirmed');

    const { data, error } = await query;
    setIsExporting(false);
    if (error || !data) {
      showToast('Kunne ikke eksportere ventelisten.', 'error');
      return;
    }

    // Emails kommer fra en offentlig formular. Sat sammen i hånden kunne en adresse med
    // komma eller linjeskift skabe nye felter og rækker i filen, og en adresse der
    // begynder med = blive kørt som en formel, når filen åbnes i et regneark.
    const csv = rowsToCsv(data, ['email', 'platform', 'confirmed', 'created_at']);

    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `lifesort-venteliste-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const confirmDialog = useConfirm();
  const [deletingId, setDeletingId] = useState<string | null>(null);

  // Sletning her er hvordan en anmodning efter GDPR artikel 17 rent faktisk efterkommes.
  // Den er endelig, så den kræver en bekræftelse og bliver altid logget serverside.
  const handleDelete = async (row: WaitlistRow) => {
    const ok = await confirmDialog({
      title: 'Slet tilmelding?',
      message: `${row.email} fjernes permanent fra ventelisten. Handlingen kan ikke fortrydes.`,
      confirmLabel: 'Slet',
    });
    if (!ok) return;

    setDeletingId(row.id);
    try {
      const res = await fetch('/api/admin/data/delete', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ kind: 'waitlist', id: row.id }),
      });
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        showToast(body.error ?? 'Kunne ikke slette tilmeldingen.', 'error');
        return;
      }
      showToast(`${row.email} er slettet.`);
      await Promise.all([fetchRows(), fetchStats()]);
    } catch {
      showToast('Kunne ikke slette tilmeldingen.', 'error');
    } finally {
      setDeletingId(null);
    }
  };

  const handleConfirm = async (row: WaitlistRow) => {
    setConfirmingId(row.id);
    try {
      const res = await fetch('/api/admin/waitlist/confirm', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: row.id }),
      });

      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        showToast(body.error ?? 'Kunne ikke bekræfte tilmeldingen.', 'error');
        return;
      }

      showToast(`${row.email} er bekræftet.`);
      await Promise.all([fetchRows(), fetchStats()]);
    } catch {
      showToast('Kunne ikke bekræfte tilmeldingen.', 'error');
    } finally {
      setConfirmingId(null);
    }
  };

  const totalPages = Math.max(1, Math.ceil(totalCount / PAGE_SIZE));
  const confirmationRate = percent(stats.confirmed, stats.total);
  const platformLeader = stats.ios === stats.android
    ? 'Lige fordelt'
    : stats.ios > stats.android
      ? 'iOS fylder mest'
      : 'Android fylder mest';

  return (
    <div>
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-violet-500 to-violet-600">
            <Users className="h-5 w-5 text-white" strokeWidth={2.2} />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-stone-900 dark:text-stone-100">Venteliste</h1>
            <p className="text-sm text-stone-500 dark:text-stone-400">{totalCount} tilmeldte i alt</p>
          </div>
        </div>
        <button onClick={exportCsv} disabled={isExporting || totalCount === 0}
          className="flex items-center gap-1.5 rounded-xl border border-stone-200 bg-white px-4 py-2 text-sm font-semibold text-stone-700 transition hover:bg-stone-50 disabled:opacity-40 dark:border-stone-700 dark:bg-stone-900 dark:text-stone-300 dark:hover:bg-stone-800">
          <Download size={15} />
          {isExporting ? 'Eksporterer...' : 'Eksportér CSV'}
        </button>
      </div>

      <div className="mt-8 grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatCard
          label="Bekræftede"
          value={`${confirmationRate}%`}
          detail={`${stats.confirmed} af ${stats.total} tilmeldinger`}
          icon={CheckCircle2}
          tone="from-emerald-500 to-emerald-600"
        />
        <StatCard
          label="Afventer"
          value={stats.pending.toString()}
          detail={stats.pending === 0 ? 'Ingen manuel oprydning nødvendig' : 'Kan bekræftes direkte i listen'}
          icon={Clock}
          tone="from-amber-500 to-amber-600"
        />
        <StatCard
          label="Platforme"
          value={`${stats.ios}/${stats.android}`}
          detail={`${platformLeader} · iOS/Android`}
          icon={Smartphone}
          tone="from-violet-500 to-violet-600"
        />
        <StatCard
          label="Seneste 30 dage"
          value={stats.last30.toString()}
          detail={`${stats.last7} nye de sidste 7 dage`}
          icon={TrendingUp}
          tone="from-sky-500 to-sky-600"
        />
      </div>

      <div className={`mt-5 rounded-2xl border p-4 shadow-sm shadow-stone-900/5 ${
        stats.pending > stats.confirmed
          ? 'border-amber-200 bg-amber-50 dark:border-amber-500/20 dark:bg-amber-500/10'
          : 'border-stone-200 bg-white dark:border-stone-800 dark:bg-stone-900'
      }`}>
        <div className="flex items-start gap-3">
          <div className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-xl ${
            stats.pending > stats.confirmed
              ? 'bg-amber-100 text-amber-700 dark:bg-amber-500/15 dark:text-amber-400'
              : 'bg-stone-100 text-stone-600 dark:bg-stone-800 dark:text-stone-300'
          }`}>
            {stats.pending > stats.confirmed ? <AlertTriangle size={17} /> : <Users size={17} />}
          </div>
          <div>
            <p className="text-sm font-semibold text-stone-900 dark:text-stone-100">Venteliste-status</p>
            <p className="mt-1 text-sm leading-relaxed text-stone-600 dark:text-stone-400">{insightText(stats)}</p>
          </div>
        </div>
      </div>

      <div className="mt-6 flex gap-3">
        <div className="relative flex-1">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-stone-400" />
          <input
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(0);
            }}
            placeholder="Søg email..."
            className="w-full rounded-xl border border-stone-200 bg-white py-2 pl-10 pr-3 text-sm text-stone-900 outline-none focus:border-rose-400 focus:ring-4 focus:ring-rose-100 dark:border-stone-700 dark:bg-stone-900 dark:text-stone-100 dark:focus:ring-rose-900/30" />
        </div>
        <select
          value={platformFilter}
          onChange={(e) => {
            setPlatformFilter(e.target.value as Platform | 'all');
            setPage(0);
          }}
          className="rounded-xl border border-stone-200 bg-white px-3 py-2 text-sm text-stone-900 outline-none focus:border-rose-400 focus:ring-4 focus:ring-rose-100 dark:border-stone-700 dark:bg-stone-900 dark:text-stone-100 dark:focus:ring-rose-900/30">
          <option value="all">Alle platforme</option>
          <option value="ios">iOS</option>
          <option value="android">Android</option>
        </select>
        <select
          value={confirmedFilter}
          onChange={(e) => {
            setConfirmedFilter(e.target.value as 'all' | 'confirmed' | 'pending');
            setPage(0);
          }}
          className="rounded-xl border border-stone-200 bg-white px-3 py-2 text-sm text-stone-900 outline-none focus:border-rose-400 focus:ring-4 focus:ring-rose-100 dark:border-stone-700 dark:bg-stone-900 dark:text-stone-100 dark:focus:ring-rose-900/30">
          <option value="all">Alle</option>
          <option value="confirmed">Bekræftede</option>
          <option value="pending">Afventer bekræftelse</option>
        </select>
      </div>

      <div className="mt-4 overflow-hidden rounded-2xl border border-stone-200 bg-white shadow-sm shadow-stone-900/5 dark:border-stone-800 dark:bg-stone-900">
        <table className="w-full text-sm">
          <thead className="border-b border-stone-100 bg-stone-50/50 text-left text-xs font-semibold text-stone-500 dark:border-stone-800 dark:bg-stone-800/50 dark:text-stone-400">
            <tr>
              <th className="px-5 py-3">Email</th>
              <th className="px-5 py-3">Platform</th>
              <th className="px-5 py-3">Status</th>
              <th className="px-5 py-3">Tilmeldt</th>
              <th className="px-5 py-3"></th>
            </tr>
          </thead>
          <tbody className="divide-y divide-stone-100 dark:divide-stone-800">
            {isLoading ? (
              <SkeletonRows columns={5} />
            ) : rows.length === 0 ? (
              <tr>
                <td colSpan={5} className="px-5 py-12 text-center">
                  <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-stone-100 dark:bg-stone-800">
                    <Users className="h-5 w-5 text-stone-400" />
                  </div>
                  <p className="mt-3 text-sm font-medium text-stone-500 dark:text-stone-400">Ingen tilmeldinger endnu</p>
                </td>
              </tr>
            ) : (
              rows.map((row) => (
                <tr key={row.id} className="transition hover:bg-stone-50/50 dark:hover:bg-stone-800/50">
                  <td className="px-5 py-3.5 font-medium text-stone-900 dark:text-stone-100">{row.email}</td>
                  <td className="px-5 py-3.5">
                    <span className="inline-flex items-center gap-1.5 rounded-full bg-stone-100 px-2.5 py-1 text-xs font-semibold text-stone-600 dark:bg-stone-800 dark:text-stone-300">
                      {row.platform === 'ios' ? <Apple size={12} /> : <Smartphone size={12} />}
                      {row.platform === 'ios' ? 'iOS' : 'Android'}
                    </span>
                  </td>
                  <td className="px-5 py-3.5">
                    {row.confirmed ? (
                      <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-100 px-2.5 py-1 text-xs font-semibold text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-400">
                        <CheckCircle2 size={12} /> Bekræftet
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1.5 rounded-full bg-amber-100 px-2.5 py-1 text-xs font-semibold text-amber-700 dark:bg-amber-500/15 dark:text-amber-400">
                        <Clock size={12} /> Afventer
                      </span>
                    )}
                  </td>
                  <td className="px-5 py-3.5 text-xs text-stone-400 dark:text-stone-500">{formatDate(row.created_at)}</td>
                  <td className="px-5 py-3.5 text-right">
                    {!row.confirmed && (
                      <button
                        onClick={() => handleConfirm(row)}
                        disabled={confirmingId === row.id}
                        className="inline-flex items-center gap-1.5 rounded-lg bg-stone-900 px-3 py-1.5 text-xs font-semibold text-white transition hover:bg-stone-800 disabled:opacity-40 dark:bg-rose-600 dark:hover:bg-rose-500"
                      >
                        {confirmingId === row.id ? <Loader2 size={13} className="animate-spin" /> : <CheckCircle2 size={13} />}
                        Bekræft
                      </button>
                    )}
                    <button
                      onClick={() => handleDelete(row)}
                      disabled={deletingId === row.id}
                      title="Slet tilmeldingen permanent"
                      className="ml-2 inline-flex items-center gap-1.5 rounded-lg border border-stone-200 px-3 py-1.5 text-xs font-semibold text-stone-600 transition hover:border-red-300 hover:text-red-600 disabled:opacity-40 dark:border-stone-700 dark:text-stone-400 dark:hover:border-red-500/40 dark:hover:text-red-400"
                    >
                      {deletingId === row.id ? <Loader2 size={13} className="animate-spin" /> : <Trash2 size={13} />}
                      Slet
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {totalPages > 1 && (
        <div className="mt-4 flex items-center justify-center gap-3 text-sm">
          <button onClick={() => setPage((p) => Math.max(0, p - 1))} disabled={page === 0}
            className="rounded-lg border border-stone-200 bg-white px-3 py-1.5 font-medium text-stone-600 transition hover:bg-stone-50 disabled:opacity-30 dark:border-stone-700 dark:bg-stone-900 dark:text-stone-300 dark:hover:bg-stone-800">
            Forrige
          </button>
          <span className="text-stone-500 dark:text-stone-400">Side {page + 1} af {totalPages}</span>
          <button onClick={() => setPage((p) => Math.min(totalPages - 1, p + 1))} disabled={page >= totalPages - 1}
            className="rounded-lg border border-stone-200 bg-white px-3 py-1.5 font-medium text-stone-600 transition hover:bg-stone-50 disabled:opacity-30 dark:border-stone-700 dark:bg-stone-900 dark:text-stone-300 dark:hover:bg-stone-800">
            Næste
          </button>
        </div>
      )}
    </div>
  );
}
