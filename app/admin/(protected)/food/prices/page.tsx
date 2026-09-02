'use client';

import { useEffect, useState, useCallback } from 'react';
import { Tag, Plus, Pencil, Trash2, Search, ChevronLeft, ChevronRight, Percent } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import { useToast } from '@/components/toast-provider';
import { useConfirm } from '@/components/confirm-dialog';

type PriceRow = {
  id: string;
  product_name: string;
  store: string;
  price: number;
  updated_at: string;
};

type ActiveOffer = {
  id: string;
  standard_price_id: string;
  offer_price: number;
  valid_from: string;
  valid_to: string;
};

const PAGE_SIZE = 25;
const NEW_STORE_VALUE = '__new__';

function todayStr() {
  return new Date().toISOString().split('T')[0];
}

export default function StandardPricesPage() {
  const supabase = createClient();
  const { showToast } = useToast();
  const confirm = useConfirm();

  const [rows, setRows] = useState<PriceRow[]>([]);
  const [offersByPriceId, setOffersByPriceId] = useState<Record<string, ActiveOffer>>({});
  const [totalCount, setTotalCount] = useState(0);
  const [page, setPage] = useState(0);
  const [search, setSearch] = useState('');
  const [storeFilter, setStoreFilter] = useState<string>('all');
  const [stores, setStores] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const [newProduct, setNewProduct] = useState('');
  const [newStore, setNewStore] = useState('');
  const [isAddingNewStore, setIsAddingNewStore] = useState(false);
  const [newStoreInput, setNewStoreInput] = useState('');
  const [newPrice, setNewPrice] = useState('');
  const [editingId, setEditingId] = useState<string | null>(null);

  const [offerModalRow, setOfferModalRow] = useState<PriceRow | null>(null);
  const [offerPrice, setOfferPrice] = useState('');
  const [offerFrom, setOfferFrom] = useState(todayStr());
  const [offerTo, setOfferTo] = useState(todayStr());
  const [isSavingOffer, setIsSavingOffer] = useState(false);

  const fetchStores = useCallback(async () => {
    const { data } = await supabase.from('global_standard_prices').select('store').order('store');
    if (data) setStores(Array.from(new Set(data.map((r) => r.store))));
  }, [supabase]);

  const fetchRows = useCallback(async () => {
    setIsLoading(true);
    let query = supabase
      .from('global_standard_prices')
      .select('*', { count: 'exact' })
      .order('product_name');

    if (search.trim()) query = query.ilike('product_name', `%${search.trim()}%`);
    if (storeFilter !== 'all') query = query.eq('store', storeFilter);

    const from = page * PAGE_SIZE;
    const to = from + PAGE_SIZE - 1;
    query = query.range(from, to);

    const { data, count, error } = await query;
    if (!error) {
      setRows(data ?? []);
      setTotalCount(count ?? 0);

      const ids = (data ?? []).map((r) => r.id);
      if (ids.length > 0) {
        const { data: offerData } = await supabase
          .from('global_offers')
          .select('id, standard_price_id, offer_price, valid_from, valid_to')
          .in('standard_price_id', ids)
          .gte('valid_to', todayStr());

        const map: Record<string, ActiveOffer> = {};
        (offerData ?? []).forEach((o) => {
          if (!map[o.standard_price_id] || o.valid_from < map[o.standard_price_id].valid_from) {
            map[o.standard_price_id] = o;
          }
        });
        setOffersByPriceId(map);
      } else {
        setOffersByPriceId({});
      }
    } else {
      showToast('Kunne ikke hente priser.', 'error');
    }
    setIsLoading(false);
  }, [supabase, search, storeFilter, page, showToast]);

  useEffect(() => { fetchStores(); }, [fetchStores]);
  useEffect(() => { fetchRows(); }, [fetchRows]);
  useEffect(() => { setPage(0); }, [search, storeFilter]);

  const resetForm = () => {
    setNewProduct(''); setNewStore(''); setIsAddingNewStore(false);
    setNewStoreInput(''); setNewPrice(''); setEditingId(null);
  };

  const startEdit = (row: PriceRow) => {
    setEditingId(row.id);
    setNewProduct(row.product_name);
    setNewStore(row.store);
    setIsAddingNewStore(false);
    setNewStoreInput('');
    setNewPrice(row.price.toString());
  };

  const handleStoreSelect = (value: string) => {
    if (value === NEW_STORE_VALUE) { setIsAddingNewStore(true); setNewStore(''); }
    else { setIsAddingNewStore(false); setNewStore(value); }
  };

  const resolvedStore = isAddingNewStore ? newStoreInput.trim() : newStore;
  const canSave = newProduct.trim().length > 0 && resolvedStore.length > 0 && !isNaN(parseFloat(newPrice)) && parseFloat(newPrice) > 0;

  const handleSave = async () => {
    if (!canSave) return;
    const wasEditing = !!editingId;
    if (editingId) {
      const { error } = await supabase.from('global_standard_prices').update({
        product_name: newProduct.trim(), store: resolvedStore, price: parseFloat(newPrice), updated_at: new Date().toISOString(),
      }).eq('id', editingId);
      if (error) { showToast('Kunne ikke gemme ændringen.', 'error'); return; }
    } else {
      const { error } = await supabase.from('global_standard_prices').insert({
        product_name: newProduct.trim(), store: resolvedStore, price: parseFloat(newPrice),
      });
      if (error) { showToast('Kunne ikke oprette prisen.', 'error'); return; }
    }
    showToast(wasEditing ? 'Pris opdateret.' : 'Pris tilføjet.');
    resetForm(); fetchStores(); fetchRows();
  };

  const handleDelete = async (id: string) => {
    const ok = await confirm({ title: 'Slet pris?', message: 'Evt. tilknyttede tilbud slettes også. Dette kan ikke fortrydes.' });
    if (!ok) return;
    const { error } = await supabase.from('global_standard_prices').delete().eq('id', id);
    if (error) { showToast('Kunne ikke slette prisen.', 'error'); return; }
    showToast('Pris slettet.');
    fetchRows();
  };

  const openOfferModal = (row: PriceRow) => {
    const existing = offersByPriceId[row.id];
    setOfferModalRow(row);
    setOfferPrice(existing ? existing.offer_price.toString() : '');
    setOfferFrom(existing ? existing.valid_from : todayStr());
    setOfferTo(existing ? existing.valid_to : todayStr());
  };

  const closeOfferModal = () => {
    setOfferModalRow(null); setOfferPrice(''); setOfferFrom(todayStr()); setOfferTo(todayStr());
  };

  const canSaveOffer = !isNaN(parseFloat(offerPrice)) && parseFloat(offerPrice) > 0 && offerFrom.length > 0 && offerTo.length > 0 && offerTo >= offerFrom;

  const handleSaveOffer = async () => {
    if (!offerModalRow || !canSaveOffer) return;
    setIsSavingOffer(true);
    const existing = offersByPriceId[offerModalRow.id];
    let error;
    if (existing) {
      ({ error } = await supabase.from('global_offers').update({
        offer_price: parseFloat(offerPrice), valid_from: offerFrom, valid_to: offerTo,
      }).eq('id', existing.id));
    } else {
      ({ error } = await supabase.from('global_offers').insert({
        standard_price_id: offerModalRow.id, offer_price: parseFloat(offerPrice), valid_from: offerFrom, valid_to: offerTo,
      }));
    }
    setIsSavingOffer(false);
    if (error) { showToast('Kunne ikke gemme tilbuddet.', 'error'); return; }
    showToast('Tilbud gemt.');
    closeOfferModal(); fetchRows();
  };

  const handleRemoveOffer = async () => {
    if (!offerModalRow) return;
    const existing = offersByPriceId[offerModalRow.id];
    if (!existing) return;
    const ok = await confirm({ title: 'Fjern tilbud?', message: 'Dette kan ikke fortrydes.' });
    if (!ok) return;
    const { error } = await supabase.from('global_offers').delete().eq('id', existing.id);
    if (error) { showToast('Kunne ikke fjerne tilbuddet.', 'error'); return; }
    showToast('Tilbud fjernet.');
    closeOfferModal(); fetchRows();
  };

  const totalPages = Math.max(1, Math.ceil(totalCount / PAGE_SIZE));

  return (
    <div>
      <div className="flex items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-rose-500 to-rose-600">
          <Tag className="h-5 w-5 text-white" strokeWidth={2.2} />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-stone-900">Standardpriser</h1>
          <p className="text-sm text-stone-500">{totalCount} priser i alt</p>
        </div>
      </div>

      <div className="mt-6 rounded-2xl border border-stone-200 bg-white p-5 shadow-sm shadow-stone-900/5">
        <div className="flex flex-wrap items-end gap-3">
          <div className="flex flex-col gap-1">
            <label className="text-xs font-semibold text-stone-500">Produkt</label>
            <input value={newProduct} onChange={(e) => setNewProduct(e.target.value)}
              className="rounded-xl border border-stone-200 px-3 py-2 text-sm outline-none focus:border-rose-400 focus:ring-4 focus:ring-rose-100"
              placeholder="Fx Mælk 1L" />
          </div>

          <div className="flex flex-col gap-1">
            <label className="text-xs font-semibold text-stone-500">Butik</label>
            {!isAddingNewStore ? (
              <select value={newStore} onChange={(e) => handleStoreSelect(e.target.value)}
                className="rounded-xl border border-stone-200 px-3 py-2 text-sm outline-none focus:border-rose-400 focus:ring-4 focus:ring-rose-100">
                <option value="" disabled>Vælg butik...</option>
                {stores.map((s) => <option key={s} value={s}>{s}</option>)}
                <option value={NEW_STORE_VALUE}>+ Ny butik...</option>
              </select>
            ) : (
              <div className="flex items-center gap-2">
                <input value={newStoreInput} onChange={(e) => setNewStoreInput(e.target.value)}
                  className="rounded-xl border border-stone-200 px-3 py-2 text-sm outline-none focus:border-rose-400 focus:ring-4 focus:ring-rose-100"
                  placeholder="Ny butiks navn" autoFocus />
                <button type="button" onClick={() => { setIsAddingNewStore(false); setNewStoreInput(''); }}
                  className="text-xs font-medium text-stone-400 hover:text-stone-600">Fortryd</button>
              </div>
            )}
          </div>

          <div className="flex flex-col gap-1">
            <label className="text-xs font-semibold text-stone-500">Pris (kr.)</label>
            <input type="number" step="0.01" value={newPrice} onChange={(e) => setNewPrice(e.target.value)}
              className="w-28 rounded-xl border border-stone-200 px-3 py-2 text-sm outline-none focus:border-rose-400 focus:ring-4 focus:ring-rose-100"
              placeholder="0.00" />
          </div>

          <button onClick={handleSave} disabled={!canSave}
            className="flex items-center gap-1.5 rounded-xl bg-stone-900 px-4 py-2 text-sm font-semibold text-white transition hover:bg-stone-800 disabled:opacity-30">
            <Plus size={15} />
            {editingId ? 'Gem ændring' : 'Tilføj pris'}
          </button>
          {editingId && (
            <button onClick={resetForm} className="text-sm font-medium text-stone-400 hover:text-stone-600">Annullér</button>
          )}
        </div>
      </div>

      <div className="mt-6 flex gap-3">
        <div className="relative flex-1">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-stone-400" />
          <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Søg produktnavn..."
            className="w-full rounded-xl border border-stone-200 bg-white py-2 pl-10 pr-3 text-sm outline-none focus:border-rose-400 focus:ring-4 focus:ring-rose-100" />
        </div>
        <select value={storeFilter} onChange={(e) => setStoreFilter(e.target.value)}
          className="rounded-xl border border-stone-200 bg-white px-3 py-2 text-sm outline-none focus:border-rose-400 focus:ring-4 focus:ring-rose-100">
          <option value="all">Alle butikker</option>
          {stores.map((s) => <option key={s} value={s}>{s}</option>)}
        </select>
      </div>

      <div className="mt-4 overflow-hidden rounded-2xl border border-stone-200 bg-white shadow-sm shadow-stone-900/5">
        <table className="w-full text-sm">
          <thead className="border-b border-stone-100 bg-stone-50/50 text-left text-xs font-semibold text-stone-500">
            <tr>
              <th className="px-5 py-3">Produkt</th>
              <th className="px-5 py-3">Butik</th>
              <th className="px-5 py-3">Pris</th>
              <th className="px-5 py-3">Tilbud</th>
              <th className="px-5 py-3"></th>
            </tr>
          </thead>
          <tbody className="divide-y divide-stone-100">
            {isLoading ? (
              <SkeletonRows columns={5} />
            ) : rows.length === 0 ? (
              <tr>
                <td colSpan={5} className="px-5 py-12 text-center">
                  <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-stone-100">
                    <Tag className="h-5 w-5 text-stone-400" />
                  </div>
                  <p className="mt-3 text-sm font-medium text-stone-500">Ingen priser fundet</p>
                  <p className="text-xs text-stone-400">Prøv en anden søgning, eller tilføj en ny pris ovenfor.</p>
                </td>
              </tr>
            ) : (
              rows.map((row) => {
                const offer = offersByPriceId[row.id];
                const isOfferActive = offer && offer.valid_from <= todayStr() && offer.valid_to >= todayStr();
                return (
                  <tr key={row.id} className="transition hover:bg-stone-50/50">
                    <td className="px-5 py-3.5 font-medium text-stone-900">{row.product_name}</td>
                    <td className="px-5 py-3.5 text-stone-600">{row.store}</td>
                    <td className="px-5 py-3.5 text-stone-600">{row.price.toFixed(2)} kr.</td>
                    <td className="px-5 py-3.5">
                      {offer ? (
                        <span className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-semibold ${
                          isOfferActive ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'
                        }`}>
                          {offer.offer_price.toFixed(2)} kr. · {isOfferActive ? 'Aktiv' : 'Kommende'}
                        </span>
                      ) : (
                        <span className="text-xs text-stone-400">Intet tilbud</span>
                      )}
                    </td>
                    <td className="px-5 py-3.5 text-right">
                      <div className="flex items-center justify-end gap-1">
                        <button onClick={() => openOfferModal(row)} title={offer ? 'Redigér tilbud' : 'Sæt tilbud'}
                          className="rounded-lg p-1.5 text-emerald-600 transition hover:bg-emerald-50">
                          <Percent size={15} />
                        </button>
                        <button onClick={() => startEdit(row)} title="Redigér"
                          className="rounded-lg p-1.5 text-stone-500 transition hover:bg-stone-100">
                          <Pencil size={15} />
                        </button>
                        <button onClick={() => handleDelete(row.id)} title="Slet"
                          className="rounded-lg p-1.5 text-red-500 transition hover:bg-red-50">
                          <Trash2 size={15} />
                        </button>
                      </div>
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
            className="flex items-center gap-1 rounded-lg border border-stone-200 bg-white px-3 py-1.5 font-medium text-stone-600 transition hover:bg-stone-50 disabled:opacity-30">
            <ChevronLeft size={14} /> Forrige
          </button>
          <span className="text-stone-500">Side {page + 1} af {totalPages}</span>
          <button onClick={() => setPage((p) => Math.min(totalPages - 1, p + 1))} disabled={page >= totalPages - 1}
            className="flex items-center gap-1 rounded-lg border border-stone-200 bg-white px-3 py-1.5 font-medium text-stone-600 transition hover:bg-stone-50 disabled:opacity-30">
            Næste <ChevronRight size={14} />
          </button>
        </div>
      )}

      {offerModalRow && (
        <div className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto bg-stone-900/40 p-4 backdrop-blur-sm" onClick={closeOfferModal}>
         <div className="my-8 w-full max-w-sm rounded-2xl bg-white p-6 shadow-2xl" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center gap-2">
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-emerald-100">
                <Percent size={16} className="text-emerald-600" />
              </div>
              <h2 className="text-lg font-bold text-stone-900">Sæt tilbud</h2>
            </div>
            <p className="mt-3 text-sm text-stone-600">{offerModalRow.product_name} · {offerModalRow.store}</p>
            <p className="text-xs text-stone-400">Normalpris: {offerModalRow.price.toFixed(2)} kr.</p>

            <div className="mt-4 flex flex-col gap-3">
              <div>
                <label className="text-xs font-semibold text-stone-500">Tilbudspris (kr.)</label>
                <input type="number" step="0.01" value={offerPrice} onChange={(e) => setOfferPrice(e.target.value)}
                  className="mt-1 w-full rounded-xl border border-stone-200 px-3 py-2 text-sm outline-none focus:border-emerald-400 focus:ring-4 focus:ring-emerald-100"
                  placeholder="0.00" autoFocus />
              </div>
              <div className="flex gap-3">
                <div className="flex-1">
                  <label className="text-xs font-semibold text-stone-500">Gyldig fra</label>
                  <input type="date" value={offerFrom} onChange={(e) => setOfferFrom(e.target.value)}
                    className="mt-1 w-full rounded-xl border border-stone-200 px-3 py-2 text-sm outline-none focus:border-emerald-400 focus:ring-4 focus:ring-emerald-100" />
                </div>
                <div className="flex-1">
                  <label className="text-xs font-semibold text-stone-500">Gyldig til</label>
                  <input type="date" value={offerTo} onChange={(e) => setOfferTo(e.target.value)}
                    className="mt-1 w-full rounded-xl border border-stone-200 px-3 py-2 text-sm outline-none focus:border-emerald-400 focus:ring-4 focus:ring-emerald-100" />
                </div>
              </div>
            </div>

            <div className="mt-6 flex items-center justify-between">
              <div>
                {offersByPriceId[offerModalRow.id] && (
                  <button onClick={handleRemoveOffer} className="text-sm font-medium text-red-600 hover:underline">Fjern tilbud</button>
                )}
              </div>
              <div className="flex gap-2">
                <button onClick={closeOfferModal} className="rounded-xl border border-stone-200 px-4 py-2 text-sm font-medium text-stone-600 hover:bg-stone-50">Annullér</button>
                <button onClick={handleSaveOffer} disabled={!canSaveOffer || isSavingOffer}
                  className="rounded-xl bg-emerald-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-emerald-700 disabled:opacity-40">
                  {isSavingOffer ? 'Gemmer...' : 'Gem tilbud'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function SkeletonRows({ columns }: { columns: number }) {
  return (
    <>
      {Array.from({ length: 6 }).map((_, i) => (
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