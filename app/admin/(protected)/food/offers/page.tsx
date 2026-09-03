'use client';

import { useEffect, useState, useCallback } from 'react';
import { Percent, Trash2, Search, ChevronLeft, ChevronRight } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import { useToast } from '@/components/toast-provider';
import { logActivity } from '@/lib/activity-log';
import { useAdminUser } from '@/components/admin-user-context';
import { SkeletonRows } from '@/components/skeleton-rows';
import { useDebouncedValue } from '@/hooks/useDebouncedValue';

type OfferRow = {
  id: string;
  offer_price: number;
  valid_from: string;
  valid_to: string;
  standard_price: {
    id: string;
    product_name: string;
    store: string;
    price: number;
  } | null;
};

type StatusFilter = 'all' | 'active' | 'upcoming' | 'expired';
const PAGE_SIZE = 25;

function todayStr() {
  return new Date().toISOString().split('T')[0];
}

function getStatus(offer: OfferRow): 'active' | 'upcoming' | 'expired' {
  const today = todayStr();
  if (offer.valid_to < today) return 'expired';
  if (offer.valid_from > today) return 'upcoming';
  return 'active';
}

export default function OffersOverviewPage() {
  const supabase = createClient();
  const { showToast, showUndoToast } = useToast();
  const adminUser = useAdminUser();

  const [rows, setRows] = useState<OfferRow[]>([]);
  const [totalCount, setTotalCount] = useState(0);
  const [page, setPage] = useState(0);
  const [search, setSearch] = useState('');
  const debouncedSearch = useDebouncedValue(search, 300);
  const [storeFilter, setStoreFilter] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('active');
  const [stores, setStores] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const fetchStores = useCallback(async () => {
    const { data } = await supabase.from('global_standard_prices').select('store').order('store');
    if (data) setStores(Array.from(new Set(data.map((r) => r.store))));
  }, [supabase]);

  const fetchRows = useCallback(async () => {
    setIsLoading(true);

    let query = supabase
      .from('global_offers')
      .select('id, offer_price, valid_from, valid_to, standard_price:global_standard_prices(id, product_name, store, price)', { count: 'exact' })
      .order('valid_from', { ascending: false });

    const today = todayStr();
    if (statusFilter === 'active') query = query.lte('valid_from', today).gte('valid_to', today);
    else if (statusFilter === 'upcoming') query = query.gt('valid_from', today);
    else if (statusFilter === 'expired') query = query.lt('valid_to', today);

    const from = page * PAGE_SIZE;
    const to = from + PAGE_SIZE - 1;
    query = query.range(from, to);

    const { data, count, error } = await query;
    if (!error) {
      let filtered = (data as unknown as OfferRow[]) ?? [];
      if (storeFilter !== 'all') filtered = filtered.filter((r) => r.standard_price?.store === storeFilter);
      if (debouncedSearch.trim()) {
        const q = debouncedSearch.trim().toLowerCase();
        filtered = filtered.filter((r) => r.standard_price?.product_name.toLowerCase().includes(q));
      }
      setRows(filtered);
      setTotalCount(count ?? 0);
    } else {
      showToast('Kunne ikke hente tilbud.', 'error');
    }
    setIsLoading(false);
  }, [supabase, debouncedSearch, storeFilter, statusFilter, page, showToast]);

  useEffect(() => { fetchStores(); }, [fetchStores]);
  useEffect(() => { fetchRows(); }, [fetchRows]);
  useEffect(() => { setPage(0); }, [debouncedSearch, storeFilter, statusFilter]);

  const handleDelete = (row: OfferRow) => {
    setRows((prev) => prev.filter((r) => r.id !== row.id));
    showUndoToast(
      `Tilbud på "${row.standard_price?.product_name ?? 'ukendt'}" fjernet.`,
      async () => {
        const { error } = await supabase.from('global_offers').delete().eq('id', row.id);
        if (error) { showToast('Kunne ikke fjerne tilbuddet.', 'error'); fetchRows(); return; }
        if (row.standard_price) {
          logActivity(supabase, {
            actorId: adminUser.id, actorName: adminUser.name,
            action: 'deleted', entityType: 'offer',
            entityLabel: `${row.standard_price.product_name} (${row.standard_price.store})`,
          });
        }
      },
      () => setRows((prev) => [row, ...prev])
    );
  };

  const totalPages = Math.max(1, Math.ceil(totalCount / PAGE_SIZE));

  const statusBadge = (status: 'active' | 'upcoming' | 'expired') => {
    const styles = {
      active: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-400',
      upcoming: 'bg-amber-100 text-amber-700 dark:bg-amber-500/15 dark:text-amber-400',
      expired: 'bg-stone-100 text-stone-500 dark:bg-stone-800 dark:text-stone-400',
    };
    const labels = { active: 'Aktiv', upcoming: 'Kommende', expired: 'Udløbet' };
    return <span className={`rounded-full px-2.5 py-1 text-xs font-semibold ${styles[status]}`}>{labels[status]}</span>;
  };

  return (
    <div>
      <div className="flex items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-emerald-500 to-emerald-600">
          <Percent className="h-5 w-5 text-white" strokeWidth={2.2} />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-stone-900 dark:text-stone-100">Ugens tilbud</h1>
          <p className="text-sm text-stone-500 dark:text-stone-400">{totalCount} tilbud i alt · Nye tilbud oprettes fra Standardpriser</p>
        </div>
      </div>

      <div className="mt-6 flex flex-wrap gap-3">
        <div className="relative flex-1">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-stone-400" />
          <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Søg produktnavn..."
            className="w-full rounded-xl border border-stone-200 bg-white py-2 pl-10 pr-3 text-sm text-stone-900 outline-none focus:border-emerald-400 focus:ring-4 focus:ring-emerald-100 dark:border-stone-700 dark:bg-stone-900 dark:text-stone-100 dark:focus:ring-emerald-900/30" />
        </div>
        <select value={storeFilter} onChange={(e) => setStoreFilter(e.target.value)}
          className="rounded-xl border border-stone-200 bg-white px-3 py-2 text-sm text-stone-900 outline-none focus:border-emerald-400 focus:ring-4 focus:ring-emerald-100 dark:border-stone-700 dark:bg-stone-900 dark:text-stone-100 dark:focus:ring-emerald-900/30">
          <option value="all">Alle butikker</option>
          {stores.map((s) => <option key={s} value={s}>{s}</option>)}
        </select>
        <div className="flex overflow-hidden rounded-xl border border-stone-200 bg-white text-sm dark:border-stone-700 dark:bg-stone-900">
          {(['active', 'upcoming', 'expired', 'all'] as StatusFilter[]).map((s) => (
            <button key={s} onClick={() => setStatusFilter(s)}
              className={`px-3 py-2 font-medium transition ${statusFilter === s ? 'bg-stone-900 text-white dark:bg-emerald-600' : 'text-stone-600 hover:bg-stone-50 dark:text-stone-300 dark:hover:bg-stone-800'}`}>
              {s === 'active' ? 'Aktive' : s === 'upcoming' ? 'Kommende' : s === 'expired' ? 'Udløbne' : 'Alle'}
            </button>
          ))}
        </div>
      </div>

      <div className="mt-4 overflow-hidden rounded-2xl border border-stone-200 bg-white shadow-sm shadow-stone-900/5 dark:border-stone-800 dark:bg-stone-900">
        <table className="w-full text-sm">
          <thead className="border-b border-stone-100 bg-stone-50/50 text-left text-xs font-semibold text-stone-500 dark:border-stone-800 dark:bg-stone-800/50 dark:text-stone-400">
            <tr>
              <th className="px-5 py-3">Produkt</th>
              <th className="px-5 py-3">Butik</th>
              <th className="px-5 py-3">Normalpris</th>
              <th className="px-5 py-3">Tilbudspris</th>
              <th className="px-5 py-3">Gyldig</th>
              <th className="px-5 py-3">Status</th>
              <th className="px-5 py-3"></th>
            </tr>
          </thead>
          <tbody className="divide-y divide-stone-100 dark:divide-stone-800">
            {isLoading ? (
              <SkeletonRows columns={7} />
            ) : rows.length === 0 ? (
              <tr><td colSpan={7} className="px-5 py-8 text-center text-stone-400 dark:text-stone-500">Ingen tilbud fundet.</td></tr>
            ) : (
              rows.map((row) => {
                if (!row.standard_price) return null;
                const status = getStatus(row);
                const savingsPercent = Math.round((1 - row.offer_price / row.standard_price.price) * 100);
                return (
                  <tr key={row.id} className="transition hover:bg-stone-50/50 dark:hover:bg-stone-800/50">
                    <td className="px-5 py-3.5 font-medium text-stone-900 dark:text-stone-100">{row.standard_price.product_name}</td>
                    <td className="px-5 py-3.5 text-stone-600 dark:text-stone-400">{row.standard_price.store}</td>
                    <td className="px-5 py-3.5 text-stone-400 line-through dark:text-stone-500">{row.standard_price.price.toFixed(2)} kr.</td>
                    <td className="px-5 py-3.5 font-semibold text-stone-900 dark:text-stone-100">
                      {row.offer_price.toFixed(2)} kr.
                      {savingsPercent > 0 && <span className="ml-2 text-xs font-normal text-emerald-600 dark:text-emerald-400">-{savingsPercent}%</span>}
                    </td>
                    <td className="px-5 py-3.5 text-xs text-stone-500 dark:text-stone-400">{row.valid_from} → {row.valid_to}</td>
                    <td className="px-5 py-3.5">{statusBadge(status)}</td>
                    <td className="px-5 py-3.5 text-right">
                      <button onClick={() => handleDelete(row)} title="Slet" className="rounded-lg p-1.5 text-red-500 transition hover:bg-red-50 dark:text-red-400 dark:hover:bg-red-500/10">
                        <Trash2 size={15} />
                      </button>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {totalPages > 1 && (
        <div className="mt-4 flex items-center justify-center gap-3 text-sm">
          <button onClick={() => setPage((p) => Math.max(0, p - 1))} disabled={page === 0}
            className="flex items-center gap-1 rounded-lg border border-stone-200 bg-white px-3 py-1.5 font-medium text-stone-600 transition hover:bg-stone-50 disabled:opacity-30 dark:border-stone-700 dark:bg-stone-900 dark:text-stone-300 dark:hover:bg-stone-800">
            <ChevronLeft size={14} /> Forrige
          </button>
          <span className="text-stone-500 dark:text-stone-400">Side {page + 1} af {totalPages}</span>
          <button onClick={() => setPage((p) => Math.min(totalPages - 1, p + 1))} disabled={page >= totalPages - 1}
            className="flex items-center gap-1 rounded-lg border border-stone-200 bg-white px-3 py-1.5 font-medium text-stone-600 transition hover:bg-stone-50 disabled:opacity-30 dark:border-stone-700 dark:bg-stone-900 dark:text-stone-300 dark:hover:bg-stone-800">
            Næste <ChevronRight size={14} />
          </button>
        </div>
      )}
    </div>
  );
}