'use client';

import { useEffect, useState, useCallback } from 'react';
import { Users, Search, Apple, Smartphone, Download } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import { useToast } from '@/components/toast-provider';

type Platform = 'ios' | 'android';

type WaitlistRow = {
  id: string;
  email: string;
  platform: Platform;
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
  const [platformFilter, setPlatformFilter] = useState<Platform | 'all'>('all');
  const [isLoading, setIsLoading] = useState(true);

  const fetchRows = useCallback(async () => {
    setIsLoading(true);
    let query = supabase
      .from('waitlist_signups')
      .select('*', { count: 'exact' })
      .order('created_at', { ascending: false });

    if (search.trim()) query = query.ilike('email', `%${search.trim()}%`);
    if (platformFilter !== 'all') query = query.eq('platform', platformFilter);

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
  }, [supabase, search, platformFilter, page, showToast]);

  useEffect(() => { fetchRows(); }, [fetchRows]);
  useEffect(() => { setPage(0); }, [search, platformFilter]);

  const [isExporting, setIsExporting] = useState(false);

  const exportCsv = async () => {
    setIsExporting(true);
    let query = supabase
      .from('waitlist_signups')
      .select('email, platform, created_at')
      .order('created_at', { ascending: false });

    if (search.trim()) query = query.ilike('email', `%${search.trim()}%`);
    if (platformFilter !== 'all') query = query.eq('platform', platformFilter);

    const { data, error } = await query;
    setIsExporting(false);
    if (error || !data) {
      showToast('Kunne ikke eksportere ventelisten.', 'error');
      return;
    }

    const header = 'email,platform,created_at';
    const lines = data.map((r) => `${r.email},${r.platform},${r.created_at}`);
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
            <h1 className="text-2xl font-bold text-stone-900">Venteliste</h1>
            <p className="text-sm text-stone-500">{totalCount} tilmeldte i alt</p>
          </div>
        </div>
        <button onClick={exportCsv} disabled={isExporting || totalCount === 0}
          className="flex items-center gap-1.5 rounded-xl border border-stone-200 bg-white px-4 py-2 text-sm font-semibold text-stone-700 transition hover:bg-stone-50 disabled:opacity-40">
          <Download size={15} />
          {isExporting ? 'Eksporterer...' : 'Eksportér CSV'}
        </button>
      </div>

      <div className="mt-6 flex gap-3">
        <div className="relative flex-1">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-stone-400" />
          <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Søg email..."
            className="w-full rounded-xl border border-stone-200 bg-white py-2 pl-10 pr-3 text-sm outline-none focus:border-rose-400 focus:ring-4 focus:ring-rose-100" />
        </div>
        <select value={platformFilter} onChange={(e) => setPlatformFilter(e.target.value as Platform | 'all')}
          className="rounded-xl border border-stone-200 bg-white px-3 py-2 text-sm outline-none focus:border-rose-400 focus:ring-4 focus:ring-rose-100">
          <option value="all">Alle platforme</option>
          <option value="ios">iOS</option>
          <option value="android">Android</option>
        </select>
      </div>

      <div className="mt-4 overflow-hidden rounded-2xl border border-stone-200 bg-white shadow-sm shadow-stone-900/5">
        <table className="w-full text-sm">
          <thead className="border-b border-stone-100 bg-stone-50/50 text-left text-xs font-semibold text-stone-500">
            <tr>
              <th className="px-5 py-3">Email</th>
              <th className="px-5 py-3">Platform</th>
              <th className="px-5 py-3">Tilmeldt</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-stone-100">
            {isLoading ? (
              <SkeletonRows columns={3} />
            ) : rows.length === 0 ? (
              <tr>
                <td colSpan={3} className="px-5 py-12 text-center">
                  <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-stone-100">
                    <Users className="h-5 w-5 text-stone-400" />
                  </div>
                  <p className="mt-3 text-sm font-medium text-stone-500">Ingen tilmeldinger endnu</p>
                </td>
              </tr>
            ) : (
              rows.map((row) => (
                <tr key={row.id} className="transition hover:bg-stone-50/50">
                  <td className="px-5 py-3.5 font-medium text-stone-900">{row.email}</td>
                  <td className="px-5 py-3.5">
                    <span className="inline-flex items-center gap-1.5 rounded-full bg-stone-100 px-2.5 py-1 text-xs font-semibold text-stone-600">
                      {row.platform === 'ios' ? <Apple size={12} /> : <Smartphone size={12} />}
                      {row.platform === 'ios' ? 'iOS' : 'Android'}
                    </span>
                  </td>
                  <td className="px-5 py-3.5 text-xs text-stone-400">{formatDate(row.created_at)}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {totalPages > 1 && (
        <div className="mt-4 flex items-center justify-center gap-3 text-sm">
          <button onClick={() => setPage((p) => Math.max(0, p - 1))} disabled={page === 0}
            className="rounded-lg border border-stone-200 bg-white px-3 py-1.5 font-medium text-stone-600 transition hover:bg-stone-50 disabled:opacity-30">
            Forrige
          </button>
          <span className="text-stone-500">Side {page + 1} af {totalPages}</span>
          <button onClick={() => setPage((p) => Math.min(totalPages - 1, p + 1))} disabled={page >= totalPages - 1}
            className="rounded-lg border border-stone-200 bg-white px-3 py-1.5 font-medium text-stone-600 transition hover:bg-stone-50 disabled:opacity-30">
            Næste
          </button>
        </div>
      )}
    </div>
  );
}

function SkeletonRows({ columns }: { columns: number }) {
  return (
    <>
      {Array.from({ length: 5 }).map((_, i) => (
        <tr key={i}>
          {Array.from({ length: columns }).map((_, j) => (
            <td key={j} className="px-5 py-4">
              <div className="h-3.5 w-full max-w-[120px] animate-pulse rounded bg-stone-100" />
            </td>
          ))}
        </tr>
      ))}
    </>
  );
}