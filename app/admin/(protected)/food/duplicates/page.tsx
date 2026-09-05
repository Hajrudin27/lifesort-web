'use client';

import { useEffect, useState, useCallback } from 'react';
import { Copy, RefreshCw, CheckCircle2, Merge } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import { useToast } from '@/components/toast-provider';
import { useConfirm } from '@/components/confirm-dialog';
import { logActivity } from '@/lib/activity-log';
import { useAdminUser } from '@/components/admin-user-context';
import { findDuplicateClusters, type DuplicateCluster, type ProductForDuplicateCheck } from '@/lib/priceDuplicates';

export default function PriceDuplicatesPage() {
  const supabase = createClient();
  const { showToast } = useToast();
  const confirm = useConfirm();
  const adminUser = useAdminUser();

  const [clusters, setClusters] = useState<DuplicateCluster[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isMerging, setIsMerging] = useState<string | null>(null);
  const [totalScanned, setTotalScanned] = useState(0);

  const scan = useCallback(async () => {
    setIsLoading(true);
    const { data: products, error } = await supabase.from('products').select('id, name').order('name');

    if (error) {
      showToast('Kunne ikke hente varer.', 'error');
      setIsLoading(false);
      return;
    }

    const productIds = (products ?? []).map((p) => p.id);
    const priceCounts = new Map<string, number>();
    if (productIds.length > 0) {
      const { data: prices } = await supabase.from('global_standard_prices').select('product_id').in('product_id', productIds);
      (prices ?? []).forEach((row) => priceCounts.set(row.product_id, (priceCounts.get(row.product_id) ?? 0) + 1));
    }

    const rows: ProductForDuplicateCheck[] = (products ?? []).map((p) => ({
      id: p.id,
      name: p.name,
      priceCount: priceCounts.get(p.id) ?? 0,
    }));

    setTotalScanned(rows.length);
    setClusters(findDuplicateClusters(rows));
    setIsLoading(false);
  }, [supabase, showToast]);

  useEffect(() => { scan(); }, [scan]);

  const handleMerge = async (source: ProductForDuplicateCheck, target: ProductForDuplicateCheck) => {
    const ok = await confirm({
      title: 'Flet varer sammen?',
      message: `Alle butikspriser fra "${source.name}" flyttes over på "${target.name}", og "${source.name}" slettes derefter. Har begge en pris i samme butik, får du to priser for den butik bagefter — ryd op manuelt på Varer-siden, hvis det sker.`,
    });
    if (!ok) return;

    setIsMerging(source.id);
    const { error: moveError } = await supabase
      .from('global_standard_prices')
      .update({ product_id: target.id })
      .eq('product_id', source.id);

    if (moveError) {
      setIsMerging(null);
      showToast('Kunne ikke flytte priserne.', 'error');
      return;
    }

    const { error: deleteError } = await supabase.from('products').delete().eq('id', source.id);
    setIsMerging(null);

    if (deleteError) {
      showToast('Priserne blev flyttet, men den gamle vare kunne ikke slettes.', 'error');
      scan();
      return;
    }

    showToast(`"${source.name}" flettet ind i "${target.name}".`);
    logActivity(supabase, {
      actorId: adminUser.id, actorName: adminUser.name,
      action: 'updated', entityType: 'price',
      entityLabel: `${source.name} flettet ind i ${target.name}`,
    });
    scan();
  };

  return (
    <div>
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-rose-500 to-rose-600">
            <Copy className="h-5 w-5 text-white" strokeWidth={2.2} />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-stone-900 dark:text-stone-100">Dublet-tjek</h1>
            <p className="text-sm text-stone-500 dark:text-stone-400">
              {isLoading ? 'Scanner...' : `${totalScanned} varer scannet, ${clusters.length} mulige ${clusters.length === 1 ? 'dublet' : 'dubletter'} fundet`}
            </p>
          </div>
        </div>
        <button onClick={scan} disabled={isLoading}
          className="flex items-center gap-1.5 rounded-xl border border-stone-200 bg-white px-4 py-2 text-sm font-semibold text-stone-700 transition hover:bg-stone-50 disabled:opacity-40 dark:border-stone-700 dark:bg-stone-900 dark:text-stone-300 dark:hover:bg-stone-800">
          <RefreshCw size={14} className={isLoading ? 'animate-spin' : ''} />
          Scan igen
        </button>
      </div>

      <p className="mt-4 text-xs text-stone-400 dark:text-stone-500">
        Sammenligner varenavne på tværs af hele varelisten — forskellig mellemrumsbrug eller stavning tæller som en mulig dublet. Klik &ldquo;Flet ind i&rdquo; for at flytte alle butikspriser over på den anden vare og fjerne dubletten.
      </p>

      <div className="mt-6 flex flex-col gap-4">
        {isLoading ? (
          Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="h-24 animate-pulse rounded-2xl bg-stone-100 dark:bg-stone-800" />
          ))
        ) : clusters.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-stone-200 bg-white py-16 text-center dark:border-stone-800 dark:bg-stone-900">
            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-emerald-100 dark:bg-emerald-500/15">
              <CheckCircle2 className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />
            </div>
            <p className="mt-3 text-sm font-medium text-stone-500 dark:text-stone-400">Ingen dubletter fundet</p>
            <p className="text-xs text-stone-400 dark:text-stone-500">Jeres vareliste ser ren ud.</p>
          </div>
        ) : (
          clusters.map((cluster) => (
            <div key={cluster.key} className="rounded-2xl border border-stone-200 bg-white p-5 shadow-sm shadow-stone-900/5 dark:border-stone-800 dark:bg-stone-900">
              <span className={`inline-block rounded-full px-2.5 py-1 text-[11px] font-bold ${
                cluster.confidence === 'exact'
                  ? 'bg-rose-100 text-rose-700 dark:bg-rose-500/15 dark:text-rose-400'
                  : 'bg-amber-100 text-amber-700 dark:bg-amber-500/15 dark:text-amber-400'
              }`}>
                {cluster.confidence === 'exact' ? 'Næsten identisk' : 'Ligner hinanden'}
              </span>

              <div className="mt-3 flex flex-col divide-y divide-stone-100 dark:divide-stone-800">
                {cluster.items.map((item) => (
                  <div key={item.id} className="flex items-center justify-between gap-3 py-2.5">
                    <div>
                      <p className="text-sm font-semibold text-stone-900 dark:text-stone-100">{item.name}</p>
                      <p className="text-xs text-stone-400 dark:text-stone-500">{item.priceCount} {item.priceCount === 1 ? 'butikspris' : 'butikspriser'}</p>
                    </div>
                    <div className="flex flex-wrap justify-end gap-1.5">
                      {cluster.items.filter((other) => other.id !== item.id).map((other) => (
                        <button
                          key={other.id}
                          onClick={() => handleMerge(item, other)}
                          disabled={isMerging !== null}
                          className="flex items-center gap-1.5 rounded-lg border border-stone-200 px-3 py-1.5 text-xs font-semibold text-stone-600 transition hover:border-rose-300 hover:bg-rose-50 hover:text-rose-700 disabled:opacity-40 dark:border-stone-700 dark:text-stone-300 dark:hover:bg-rose-500/10"
                        >
                          <Merge size={12} /> Flet ind i &ldquo;{other.name}&rdquo;
                        </button>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
