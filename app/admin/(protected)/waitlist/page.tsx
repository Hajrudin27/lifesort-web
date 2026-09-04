'use client';

import { useEffect, useState, useCallback } from 'react';
import { Users, Search, Apple, Smartphone, Download, CheckCircle2, Clock } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import { useToast } from '@/components/toast-provider';
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

const PAGE_SIZE = 30;

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString('da-DK', { day: '2-digit', month: 'short', year: 'numeric' });
}

export default function WaitlistPage() {
  const supabase = createClient();
  const { showToast } = useToast();

  const [rows, setRows] = useState<WaitlistRow[]>([]);
  const [totalCount, setTotalCount] = useState(0);
  const [page, setPage] = useState(0);
  const [search, setSearch] = useState('');
  const debouncedSearch = useDebouncedValue(search, 300);
  const [platformFilter, setPlatformFilter] = useState<Platform | 'all'>('all');
  const [confirmedFilter, setConfirmedFilter] = useState<'all' | 'confirmed' | 'pending'>('all');
  const [isLoading, setIsLoading] = useState(true);

  const fetchRows = useCallback(async () => {
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

  useEffect(() => { fetchRows(); }, [fetchRows]);
  useEffect(() => { setPage(0); }, [debouncedSearch, platformFilter, confirmedFilter]);

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

    const header = 'email,platform,confirmed,created_at';
    const lines = data.map((r) => `${r.email},${r.platform},${r.confirmed},${r.created_at}`);
    const csv = [header, ...lines].join('\n');

    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `lifesort-venteliste-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const totalPages = Math.max(1, Math.ceil(totalCount / PAGE_SIZE));

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

      <div className="mt-6 flex gap-3">
        <div className="relative flex-1">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-stone-400" />
          <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Søg email..."
            className="w-full rounded-xl border border-stone-200 bg-white py-2 pl-10 pr-3 text-sm text-stone-900 outline-none focus:border-rose-400 focus:ring-4 focus:ring-rose-100 dark:border-stone-700 dark:bg-stone-900 dark:text-stone-100 dark:focus:ring-rose-900/30" />
        </div>
        <select value={platformFilter} onChange={(e) => setPlatformFilter(e.target.value as Platform | 'all')}
          className="rounded-xl border border-stone-200 bg-white px-3 py-2 text-sm text-stone-900 outline-none focus:border-rose-400 focus:ring-4 focus:ring-rose-100 dark:border-stone-700 dark:bg-stone-900 dark:text-stone-100 dark:focus:ring-rose-900/30">
          <option value="all">Alle platforme</option>
          <option value="ios">iOS</option>
          <option value="android">Android</option>
        </select>
        <select value={confirmedFilter} onChange={(e) => setConfirmedFilter(e.target.value as 'all' | 'confirmed' | 'pending')}
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
            </tr>
          </thead>
          <tbody className="divide-y divide-stone-100 dark:divide-stone-800">
            {isLoading ? (
              <SkeletonRows columns={4} />
            ) : rows.length === 0 ? (
              <tr>
                <td colSpan={4} className="px-5 py-12 text-center">
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