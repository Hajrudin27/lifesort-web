'use client';

import { useEffect, useState, useCallback } from 'react';
import { Tag, Plus, Trash2, Search, ChevronDown, Pencil, Percent, Check, X } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import { useToast } from '@/components/toast-provider';
import { useConfirm } from '@/components/confirm-dialog';
import { PriceCsvImport } from '@/components/price-csv-import';
import { logActivity } from '@/lib/activity-log';
import { useAdminUser } from '@/components/admin-user-context';
import { useDebouncedValue } from '@/hooks/useDebouncedValue';

type StorePrice = {
  id: string;
  store: string;
  price: number;
  hasActiveOffer: boolean;
};

type ProductRow = {
  id: string;
  name: string;
  prices: StorePrice[];
};

const NEW_STORE_VALUE = '__new__';

function todayStr() {
  return new Date().toISOString().split('T')[0];
}

export default function ProductsPage() {
  const supabase = createClient();
  const { showToast, showUndoToast } = useToast();
  const confirm = useConfirm();
  const adminUser = useAdminUser();

  const [products, setProducts] = useState<ProductRow[]>([]);
  const [stores, setStores] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState('');
  const debouncedSearch = useDebouncedValue(search, 300);
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const [newProductName, setNewProductName] = useState('');
  const [renamingId, setRenamingId] = useState<string | null>(null);
  const [renameValue, setRenameValue] = useState('');

  const [addingPriceFor, setAddingPriceFor] = useState<string | null>(null);
  const [newStore, setNewStore] = useState('');
  const [isAddingNewStore, setIsAddingNewStore] = useState(false);
  const [newStoreInput, setNewStoreInput] = useState('');
  const [newPrice, setNewPrice] = useState('');

  const [editingPriceId, setEditingPriceId] = useState<string | null>(null);
  const [editPriceValue, setEditPriceValue] = useState('');

  const fetchAll = useCallback(async () => {
    setIsLoading(true);
    const [productsRes, storesRes] = await Promise.all([
      supabase.from('products').select('id, name').order('name'),
      supabase.from('distinct_stores').select('store'),
    ]);

    if (productsRes.error) {
      showToast('Kunne ikke hente varer.', 'error');
      setIsLoading(false);
      return;
    }
    if (storesRes.data) setStores(storesRes.data.map((r) => r.store));

    const productIds = (productsRes.data ?? []).map((p) => p.id);
    const pricesByProduct = new Map<string, StorePrice[]>();

    if (productIds.length > 0) {
      const [pricesRes, offersRes] = await Promise.all([
        supabase.from('global_standard_prices').select('id, product_id, store, price').in('product_id', productIds),
        supabase.from('global_offers').select('standard_price_id, valid_from, valid_to').gte('valid_to', todayStr()),
      ]);

      const activeOfferPriceIds = new Set(
        (offersRes.data ?? []).filter((o) => o.valid_from <= todayStr()).map((o) => o.standard_price_id)
      );

      (pricesRes.data ?? []).forEach((row) => {
        const arr = pricesByProduct.get(row.product_id) ?? [];
        arr.push({ id: row.id, store: row.store, price: row.price, hasActiveOffer: activeOfferPriceIds.has(row.id) });
        pricesByProduct.set(row.product_id, arr);
      });
    }

    const merged: ProductRow[] = (productsRes.data ?? []).map((p) => ({
      id: p.id,
      name: p.name,
      prices: (pricesByProduct.get(p.id) ?? []).sort((a, b) => a.store.localeCompare(b.store)),
    }));

    setProducts(merged);
    setIsLoading(false);
  }, [supabase, showToast]);

  useEffect(() => { fetchAll(); }, [fetchAll]);

  const filteredProducts = products.filter(
    (p) => !debouncedSearch.trim() || p.name.toLowerCase().includes(debouncedSearch.trim().toLowerCase())
  );

  const handleCreateProduct = async () => {
    const name = newProductName.trim();
    if (!name) return;
    const { data, error } = await supabase.from('products').insert({ name }).select('id, name').single();
    if (error || !data) { showToast('Kunne ikke oprette varen.', 'error'); return; }
    setProducts((prev) => [...prev, { id: data.id, name: data.name, prices: [] }].sort((a, b) => a.name.localeCompare(b.name)));
    setNewProductName('');
    setExpandedId(data.id);
    showToast('Vare oprettet.');
    logActivity(supabase, { actorId: adminUser.id, actorName: adminUser.name, action: 'created', entityType: 'price', entityLabel: name });
  };

  const startRename = (product: ProductRow) => {
    setRenamingId(product.id);
    setRenameValue(product.name);
  };

  const saveRename = async (productId: string) => {
    const name = renameValue.trim();
    if (!name) return;
    setProducts((prev) => prev.map((p) => (p.id === productId ? { ...p, name } : p)));
    setRenamingId(null);
    const { error } = await supabase.from('products').update({ name }).eq('id', productId);
    if (error) { showToast('Kunne ikke omdøbe varen.', 'error'); fetchAll(); return; }
    showToast('Vare omdøbt.');
  };

  const handleDeleteProduct = async (product: ProductRow) => {
    const ok = await confirm({
      title: 'Slet vare?',
      message: `"${product.name}" og alle ${product.prices.length} tilknyttede butikspriser (samt eventuelle tilbud på dem) slettes permanent.`,
    });
    if (!ok) return;

    setProducts((prev) => prev.filter((p) => p.id !== product.id));
    const { error } = await supabase.from('products').delete().eq('id', product.id);
    if (error) { showToast('Kunne ikke slette varen.', 'error'); fetchAll(); return; }
    showToast('Vare slettet.');
    logActivity(supabase, { actorId: adminUser.id, actorName: adminUser.name, action: 'deleted', entityType: 'price', entityLabel: product.name });
  };

  const openAddPrice = (productId: string) => {
    setAddingPriceFor(productId);
    setNewStore(''); setIsAddingNewStore(false); setNewStoreInput(''); setNewPrice('');
  };

  const handleStoreSelect = (value: string) => {
    if (value === NEW_STORE_VALUE) { setIsAddingNewStore(true); setNewStore(''); }
    else { setIsAddingNewStore(false); setNewStore(value); }
  };

  const resolvedStore = isAddingNewStore ? newStoreInput.trim() : newStore;
  const canAddPrice = resolvedStore.length > 0 && !isNaN(parseFloat(newPrice)) && parseFloat(newPrice) > 0;

  const handleAddPrice = async (product: ProductRow) => {
    if (!canAddPrice) return;
    const priceValue = parseFloat(newPrice);
    const { data, error } = await supabase
      .from('global_standard_prices')
      .insert({ product_id: product.id, store: resolvedStore, price: priceValue })
      .select('id, store, price')
      .single();

    if (error || !data) { showToast('Kunne ikke tilføje prisen.', 'error'); return; }

    setProducts((prev) =>
      prev.map((p) =>
        p.id === product.id
          ? { ...p, prices: [...p.prices, { id: data.id, store: data.store, price: data.price, hasActiveOffer: false }].sort((a, b) => a.store.localeCompare(b.store)) }
          : p
      )
    );
    setAddingPriceFor(null);
    showToast('Pris tilføjet.');
    logActivity(supabase, { actorId: adminUser.id, actorName: adminUser.name, action: 'created', entityType: 'price', entityLabel: `${product.name} (${resolvedStore})` });
    if (!stores.includes(resolvedStore)) setStores((prev) => [...prev, resolvedStore].sort());
  };

  const startEditPrice = (price: StorePrice) => {
    setEditingPriceId(price.id);
    setEditPriceValue(price.price.toString());
  };

  const saveEditPrice = async (productId: string, priceId: string) => {
    const value = parseFloat(editPriceValue);
    if (isNaN(value) || value <= 0) return;
    setProducts((prev) =>
      prev.map((p) => (p.id === productId ? { ...p, prices: p.prices.map((pr) => (pr.id === priceId ? { ...pr, price: value } : pr)) } : p))
    );
    setEditingPriceId(null);
    const { error } = await supabase.from('global_standard_prices').update({ price: value, updated_at: new Date().toISOString() }).eq('id', priceId);
    if (error) { showToast('Kunne ikke opdatere prisen.', 'error'); fetchAll(); return; }
    showToast('Pris opdateret.');
  };

  const handleDeletePrice = (product: ProductRow, price: StorePrice) => {
    setProducts((prev) => prev.map((p) => (p.id === product.id ? { ...p, prices: p.prices.filter((pr) => pr.id !== price.id) } : p)));
    showUndoToast(
      `Pris for "${product.name}" i ${price.store} slettet.`,
      async () => {
        const { error } = await supabase.from('global_standard_prices').delete().eq('id', price.id);
        if (error) { showToast('Kunne ikke slette prisen.', 'error'); fetchAll(); return; }
        logActivity(supabase, { actorId: adminUser.id, actorName: adminUser.name, action: 'deleted', entityType: 'price', entityLabel: `${product.name} (${price.store})` });
      },
      () => fetchAll()
    );
  };

  return (
    <div>
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-rose-500 to-rose-600">
            <Tag className="h-5 w-5 text-white" strokeWidth={2.2} />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-stone-900 dark:text-stone-100">Varer &amp; priser</h1>
            <p className="text-sm text-stone-500 dark:text-stone-400">{products.length} varer i alt</p>
          </div>
        </div>
        <PriceCsvImport onImported={fetchAll} />
      </div>

      <div className="mt-6 flex gap-3">
        <div className="relative flex-1">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-stone-400" />
          <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Søg varenavn..."
            className="w-full rounded-xl border border-stone-200 bg-white py-2 pl-10 pr-3 text-sm text-stone-900 outline-none focus:border-rose-400 focus:ring-4 focus:ring-rose-100 dark:border-stone-700 dark:bg-stone-900 dark:text-stone-100 dark:focus:ring-rose-900/30" />
        </div>
        <input
          value={newProductName}
          onChange={(e) => setNewProductName(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && handleCreateProduct()}
          placeholder="Ny vare, fx Mælk 1L"
          className="w-56 rounded-xl border border-stone-200 bg-white px-3 py-2 text-sm text-stone-900 outline-none focus:border-rose-400 focus:ring-4 focus:ring-rose-100 dark:border-stone-700 dark:bg-stone-900 dark:text-stone-100"
        />
        <button onClick={handleCreateProduct} disabled={!newProductName.trim()}
          className="flex items-center gap-1.5 rounded-xl bg-stone-900 px-4 py-2 text-sm font-semibold text-white transition hover:bg-stone-800 disabled:opacity-30 dark:bg-rose-600 dark:hover:bg-rose-500">
          <Plus size={15} /> Opret
        </button>
      </div>

      <div className="mt-4 flex flex-col gap-2">
        {isLoading ? (
          Array.from({ length: 4 }).map((_, i) => <div key={i} className="h-16 animate-pulse rounded-2xl bg-stone-100 dark:bg-stone-800" />)
        ) : filteredProducts.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-stone-200 bg-white py-16 text-center dark:border-stone-800 dark:bg-stone-900">
            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-stone-100 dark:bg-stone-800">
              <Tag className="h-5 w-5 text-stone-400" />
            </div>
            <p className="mt-3 text-sm font-medium text-stone-500 dark:text-stone-400">Ingen varer fundet</p>
          </div>
        ) : (
          filteredProducts.map((product) => {
            const isExpanded = expandedId === product.id;
            const priceRange = product.prices.length > 0
              ? product.prices.length === 1
                ? `${product.prices[0].price.toFixed(2)} kr.`
                : `${Math.min(...product.prices.map((p) => p.price)).toFixed(2)}–${Math.max(...product.prices.map((p) => p.price)).toFixed(2)} kr.`
              : 'Ingen priser endnu';

            return (
              <div key={product.id} className="overflow-hidden rounded-2xl border border-stone-200 bg-white shadow-sm shadow-stone-900/5 dark:border-stone-800 dark:bg-stone-900">
                <button
                  onClick={() => setExpandedId(isExpanded ? null : product.id)}
                  className="flex w-full items-center gap-3 px-5 py-4 text-left"
                >
                  <ChevronDown size={16} className={`shrink-0 text-stone-400 transition-transform ${isExpanded ? 'rotate-180' : ''}`} />
                  {renamingId === product.id ? (
                    <input
                      autoFocus
                      value={renameValue}
                      onChange={(e) => setRenameValue(e.target.value)}
                      onClick={(e) => e.stopPropagation()}
                      onKeyDown={(e) => e.key === 'Enter' && saveRename(product.id)}
                      className="flex-1 rounded-lg border border-stone-200 px-2 py-1 text-sm font-medium outline-none focus:border-rose-400 dark:border-stone-700 dark:bg-stone-800"
                    />
                  ) : (
                    <span className="flex-1 font-medium text-stone-900 dark:text-stone-100">{product.name}</span>
                  )}
                  <span className="text-xs text-stone-400 dark:text-stone-500">{product.prices.length} {product.prices.length === 1 ? 'butik' : 'butikker'} · {priceRange}</span>
                </button>

                {isExpanded && (
                  <div className="border-t border-stone-100 bg-stone-50/50 px-5 py-4 dark:border-stone-800 dark:bg-stone-800/30">
                    <div className="flex items-center justify-end gap-2">
                      {renamingId === product.id ? (
                        <>
                          <button onClick={() => saveRename(product.id)} className="flex items-center gap-1 rounded-lg bg-stone-900 px-3 py-1.5 text-xs font-semibold text-white dark:bg-rose-600">
                            <Check size={12} /> Gem navn
                          </button>
                          <button onClick={() => setRenamingId(null)} className="rounded-lg p-1.5 text-stone-400 hover:bg-stone-100 dark:hover:bg-stone-700">
                            <X size={14} />
                          </button>
                        </>
                      ) : (
                        <button onClick={() => startRename(product)} className="flex items-center gap-1 text-xs font-semibold text-stone-500 hover:text-stone-900 dark:text-stone-400 dark:hover:text-stone-100">
                          <Pencil size={12} /> Omdøb
                        </button>
                      )}
                      <button onClick={() => handleDeleteProduct(product)} className="flex items-center gap-1 text-xs font-semibold text-red-600 hover:underline dark:text-red-400">
                        <Trash2 size={12} /> Slet vare
                      </button>
                    </div>

                    <div className="mt-3 flex flex-col divide-y divide-stone-200 dark:divide-stone-700">
                      {product.prices.map((price) => (
                        <div key={price.id} className="flex items-center justify-between gap-3 py-2.5">
                          <div className="flex items-center gap-2">
                            <span className="text-sm font-medium text-stone-800 dark:text-stone-200">{price.store}</span>
                            {price.hasActiveOffer && (
                              <span className="flex items-center gap-1 rounded-full bg-emerald-100 px-2 py-0.5 text-[10px] font-bold text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-400">
                                <Percent size={9} /> Tilbud aktivt
                              </span>
                            )}
                          </div>
                          <div className="flex items-center gap-2">
                            {editingPriceId === price.id ? (
                              <>
                                <input
                                  autoFocus
                                  type="number" step="0.01"
                                  value={editPriceValue}
                                  onChange={(e) => setEditPriceValue(e.target.value)}
                                  onKeyDown={(e) => e.key === 'Enter' && saveEditPrice(product.id, price.id)}
                                  className="w-24 rounded-lg border border-stone-200 px-2 py-1 text-sm outline-none focus:border-rose-400 dark:border-stone-700 dark:bg-stone-800"
                                />
                                <button onClick={() => saveEditPrice(product.id, price.id)} className="rounded-lg p-1.5 text-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-500/10">
                                  <Check size={14} />
                                </button>
                              </>
                            ) : (
                              <button onClick={() => startEditPrice(price)} className="text-sm font-semibold text-stone-900 hover:underline dark:text-stone-100">
                                {price.price.toFixed(2)} kr.
                              </button>
                            )}
                            <button onClick={() => handleDeletePrice(product, price)} className="rounded-lg p-1.5 text-red-500 hover:bg-red-50 dark:text-red-400 dark:hover:bg-red-500/10">
                              <Trash2 size={13} />
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>

                    {addingPriceFor === product.id ? (
                      <div className="mt-3 flex flex-wrap items-end gap-2 rounded-xl bg-white p-3 dark:bg-stone-900">
                        {!isAddingNewStore ? (
                          <select value={newStore} onChange={(e) => handleStoreSelect(e.target.value)}
                            className="rounded-lg border border-stone-200 bg-white px-2.5 py-1.5 text-sm outline-none dark:border-stone-700 dark:bg-stone-800">
                            <option value="" disabled>Vælg butik...</option>
                            {stores.map((s) => <option key={s} value={s}>{s}</option>)}
                            <option value={NEW_STORE_VALUE}>+ Ny butik...</option>
                          </select>
                        ) : (
                          <input value={newStoreInput} onChange={(e) => setNewStoreInput(e.target.value)} placeholder="Ny butiks navn"
                            className="rounded-lg border border-stone-200 px-2.5 py-1.5 text-sm outline-none dark:border-stone-700 dark:bg-stone-800" />
                        )}
                        <input type="number" step="0.01" value={newPrice} onChange={(e) => setNewPrice(e.target.value)} placeholder="Pris"
                          className="w-24 rounded-lg border border-stone-200 px-2.5 py-1.5 text-sm outline-none dark:border-stone-700 dark:bg-stone-800" />
                        <button onClick={() => handleAddPrice(product)} disabled={!canAddPrice}
                          className="rounded-lg bg-stone-900 px-3 py-1.5 text-xs font-semibold text-white disabled:opacity-30 dark:bg-rose-600">
                          Gem
                        </button>
                        <button onClick={() => setAddingPriceFor(null)} className="text-xs font-medium text-stone-400 hover:text-stone-600">
                          Annullér
                        </button>
                      </div>
                    ) : (
                      <button onClick={() => openAddPrice(product.id)} className="mt-3 flex items-center gap-1.5 text-xs font-semibold text-rose-600 hover:underline dark:text-rose-400">
                        <Plus size={13} /> Tilføj pris i butik
                      </button>
                    )}
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
