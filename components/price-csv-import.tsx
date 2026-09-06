'use client';

import { useState } from 'react';
import Papa from 'papaparse';
import { AlertTriangle, CheckCircle2, FileText, Loader2, RefreshCw, Upload, X } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import { useToast } from '@/components/toast-provider';
import { logActivity } from '@/lib/activity-log';
import { useAdminUser } from '@/components/admin-user-context';

type ParsedRow = {
  line: number;
  productName: string;
  store: string;
  price: number;
};

type RowIssue = {
  line: number;
  reason: string;
};

type ImportAction = 'create' | 'update' | 'unchanged';

type PlannedRow = ParsedRow & {
  action: ImportAction;
  productId: string | null;
  priceId: string | null;
  oldPrice: number | null;
};

type ExistingProduct = {
  id: string;
  name: string;
};

type ExistingPrice = {
  id: string;
  product_id: string;
  store: string;
  price: number;
};

type ImportSummary = {
  createdProducts: number;
  createdPrices: number;
  updatedPrices: number;
  unchangedPrices: number;
};

const ACTION_LABEL: Record<ImportAction, string> = {
  create: 'Opret',
  update: 'Opdater',
  unchanged: 'Uændret',
};

const ACTION_STYLE: Record<ImportAction, string> = {
  create: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-400',
  update: 'bg-sky-100 text-sky-700 dark:bg-sky-500/15 dark:text-sky-400',
  unchanged: 'bg-stone-100 text-stone-600 dark:bg-stone-800 dark:text-stone-400',
};

function normalize(value: string) {
  return value.trim().toLowerCase();
}

function priceKey(productId: string, store: string) {
  return `${productId}:${normalize(store)}`;
}

function cents(value: number) {
  return Math.round(value * 100);
}

function formatPrice(value: number) {
  return value.toLocaleString('da-DK', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

function parsePrice(raw: string) {
  const trimmed = raw.trim().replace(/\s/g, '');
  const normalized = trimmed.includes(',')
    ? trimmed.replace(/\./g, '').replace(',', '.')
    : trimmed;
  return Number(normalized);
}

function summarize(rows: PlannedRow[]): ImportSummary {
  const productNamesToCreate = new Set(
    rows
      .filter((row) => row.action === 'create' && !row.productId)
      .map((row) => normalize(row.productName))
  );

  return {
    createdProducts: productNamesToCreate.size,
    createdPrices: rows.filter((row) => row.action === 'create').length,
    updatedPrices: rows.filter((row) => row.action === 'update').length,
    unchangedPrices: rows.filter((row) => row.action === 'unchanged').length,
  };
}

function actionCount(summary: ImportSummary) {
  return summary.createdPrices + summary.updatedPrices;
}

function validateRows(data: Record<string, string>[]) {
  const rows: ParsedRow[] = [];
  const issues: RowIssue[] = [];
  const seen = new Set<string>();

  data.forEach((row, i) => {
    const line = i + 2; // +1 for header row, +1 for 1-indexing.
    const productName = (row.produkt ?? row.product ?? '').trim();
    const store = (row.butik ?? row.store ?? '').trim();
    const priceRaw = (row.pris ?? row.price ?? '').trim();
    const price = parsePrice(priceRaw);

    if (!productName) {
      issues.push({ line, reason: 'Mangler produktnavn' });
      return;
    }
    if (!store) {
      issues.push({ line, reason: 'Mangler butik' });
      return;
    }
    if (!Number.isFinite(price) || price <= 0) {
      issues.push({ line, reason: `Ugyldig pris ("${priceRaw}")` });
      return;
    }

    const key = `${normalize(productName)}:${normalize(store)}`;
    if (seen.has(key)) {
      issues.push({ line, reason: 'Dublet i filen for samme produkt og butik' });
      return;
    }
    seen.add(key);

    rows.push({ line, productName, store, price });
  });

  return { rows, issues };
}

export function PriceCsvImport({ onImported }: { onImported: () => void }) {
  const supabase = createClient();
  const { showToast } = useToast();
  const adminUser = useAdminUser();

  const [isOpen, setIsOpen] = useState(false);
  const [fileName, setFileName] = useState<string | null>(null);
  const [validRows, setValidRows] = useState<ParsedRow[]>([]);
  const [plannedRows, setPlannedRows] = useState<PlannedRow[]>([]);
  const [issues, setIssues] = useState<RowIssue[]>([]);
  const [previewError, setPreviewError] = useState<string | null>(null);
  const [isPreparing, setIsPreparing] = useState(false);
  const [isImporting, setIsImporting] = useState(false);

  const summary = summarize(plannedRows);
  const rowsToImport = actionCount(summary);

  const reset = () => {
    setFileName(null);
    setValidRows([]);
    setPlannedRows([]);
    setIssues([]);
    setPreviewError(null);
    setIsPreparing(false);
  };

  const closeModal = () => {
    if (isImporting) return;
    setIsOpen(false);
    reset();
  };

  const loadExistingState = async () => {
    const [productsRes, pricesRes] = await Promise.all([
      supabase.from('products').select('id, name'),
      supabase.from('global_standard_prices').select('id, product_id, store, price'),
    ]);

    if (productsRes.error) throw new Error('Kunne ikke slå eksisterende varer op.');
    if (pricesRes.error) throw new Error('Kunne ikke slå eksisterende priser op.');

    const products = (productsRes.data ?? []) as ExistingProduct[];
    const prices = (pricesRes.data ?? []) as ExistingPrice[];
    const productByName = new Map(products.map((product) => [normalize(product.name), product]));
    const priceByProductAndStore = new Map(prices.map((price) => [priceKey(price.product_id, price.store), price]));

    return { productByName, priceByProductAndStore };
  };

  const buildPreview = async (rows: ParsedRow[], baseIssues: RowIssue[]) => {
    setIsPreparing(true);
    setPreviewError(null);
    setPlannedRows([]);

    try {
      const { productByName, priceByProductAndStore } = await loadExistingState();
      const planned = rows.map((row): PlannedRow => {
        const product = productByName.get(normalize(row.productName)) ?? null;
        const existingPrice = product
          ? priceByProductAndStore.get(priceKey(product.id, row.store)) ?? null
          : null;

        if (!product || !existingPrice) {
          return { ...row, action: 'create', productId: product?.id ?? null, priceId: null, oldPrice: null };
        }
        if (cents(existingPrice.price) === cents(row.price)) {
          return { ...row, action: 'unchanged', productId: product.id, priceId: existingPrice.id, oldPrice: existingPrice.price };
        }
        return { ...row, action: 'update', productId: product.id, priceId: existingPrice.id, oldPrice: existingPrice.price };
      });

      setPlannedRows(planned);
    } catch (err) {
      setPreviewError(err instanceof Error ? err.message : 'Kunne ikke forberede importen.');
      setIssues(baseIssues);
    } finally {
      setIsPreparing(false);
    }
  };

  const handleFile = (file: File) => {
    reset();
    setFileName(file.name);
    Papa.parse<Record<string, string>>(file, {
      header: true,
      skipEmptyLines: true,
      transformHeader: (h) => h.trim().toLowerCase(),
      complete: (results) => {
        const { rows, issues: parsedIssues } = validateRows(results.data);
        setValidRows(rows);
        setIssues(parsedIssues);
        void buildPreview(rows, parsedIssues);
      },
      error: () => {
        setPreviewError('Kunne ikke læse CSV-filen.');
        showToast('Kunne ikke læse CSV-filen.', 'error');
      },
    });
  };

  const handleImport = async () => {
    if (validRows.length === 0 || rowsToImport === 0) return;
    setIsImporting(true);

    try {
      const existing = await loadExistingState();
      const productByName = new Map(existing.productByName);
      const missingProducts = Array.from(
        new Map(
          validRows
            .filter((row) => !productByName.has(normalize(row.productName)))
            .map((row) => [normalize(row.productName), row.productName.trim()])
        ).values()
      );

      if (missingProducts.length > 0) {
        const { data: created, error } = await supabase
          .from('products')
          .insert(missingProducts.map((name) => ({ name })))
          .select('id, name');

        if (error) throw new Error('Kunne ikke oprette nye varer.');
        ((created ?? []) as ExistingProduct[]).forEach((product) => {
          productByName.set(normalize(product.name), product);
        });
      }

      const { data: latestPrices, error: latestPricesError } = await supabase
        .from('global_standard_prices')
        .select('id, product_id, store, price');

      if (latestPricesError) throw new Error('Kunne ikke slå eksisterende priser op.');
      const priceByProductAndStore = new Map(
        ((latestPrices ?? []) as ExistingPrice[]).map((price) => [priceKey(price.product_id, price.store), price])
      );

      const pricesToCreate: Array<{ product_id: string; store: string; price: number }> = [];
      const pricesToUpdate: Array<{ id: string; price: number }> = [];
      let unchangedPrices = 0;

      validRows.forEach((row) => {
        const product = productByName.get(normalize(row.productName));
        if (!product) return;

        const existingPrice = priceByProductAndStore.get(priceKey(product.id, row.store));
        if (!existingPrice) {
          pricesToCreate.push({ product_id: product.id, store: row.store, price: row.price });
          return;
        }
        if (cents(existingPrice.price) === cents(row.price)) {
          unchangedPrices++;
          return;
        }
        pricesToUpdate.push({ id: existingPrice.id, price: row.price });
      });

      if (pricesToCreate.length > 0) {
        const { error } = await supabase.from('global_standard_prices').insert(pricesToCreate);
        if (error) throw new Error('Kunne ikke oprette nye priser.');
      }

      if (pricesToUpdate.length > 0) {
        const updateResults = await Promise.all(
          pricesToUpdate.map((price) =>
            supabase
              .from('global_standard_prices')
              .update({ price: price.price, updated_at: new Date().toISOString() })
              .eq('id', price.id)
          )
        );
        const failedUpdate = updateResults.find((result) => result.error);
        if (failedUpdate?.error) throw new Error('Kunne ikke opdatere eksisterende priser.');
      }

      const createdCount = pricesToCreate.length;
      const updatedCount = pricesToUpdate.length;
      showToast(`${createdCount} oprettet · ${updatedCount} opdateret · ${unchangedPrices} uændret.`);
      logActivity(supabase, {
        actorId: adminUser.id,
        actorName: adminUser.name,
        action: updatedCount > 0 && createdCount === 0 ? 'updated' : 'created',
        entityType: 'price',
        entityLabel: `${createdCount} priser oprettet · ${updatedCount} opdateret · ${missingProducts.length} nye varer (CSV-import)`,
      });

      closeModal();
      onImported();
    } catch (err) {
      showToast(err instanceof Error ? err.message : 'Kunne ikke importere priserne.', 'error');
    } finally {
      setIsImporting(false);
    }
  };

  return (
    <>
      <button
        onClick={() => setIsOpen(true)}
        className="flex items-center gap-1.5 rounded-xl border border-stone-200 bg-white px-4 py-2 text-sm font-semibold text-stone-700 transition hover:bg-stone-50"
      >
        <Upload size={15} />
        Importér CSV
      </button>

      {isOpen && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-stone-900/40 backdrop-blur-sm" onClick={closeModal}>
          <div className="flex min-h-full items-center justify-center p-4">
            <div className="w-full max-w-3xl rounded-2xl bg-white p-6 shadow-2xl dark:bg-stone-900" onClick={(e) => e.stopPropagation()}>
              <div className="flex items-start justify-between gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-rose-500 to-rose-600">
                  <Upload size={18} className="text-white" />
                </div>
                <button onClick={closeModal} disabled={isImporting} className="text-stone-400 transition hover:text-stone-600 disabled:opacity-40 dark:hover:text-stone-200">
                  <X size={18} />
                </button>
              </div>

              <h2 className="mt-3 text-lg font-bold text-stone-900 dark:text-stone-100">Importér standardpriser</h2>
              <p className="mt-1 text-sm text-stone-600 dark:text-stone-400">
                CSV med kolonnerne <code className="rounded bg-stone-100 px-1 py-0.5 text-xs dark:bg-stone-800">produkt</code>,{' '}
                <code className="rounded bg-stone-100 px-1 py-0.5 text-xs dark:bg-stone-800">butik</code>,{' '}
                <code className="rounded bg-stone-100 px-1 py-0.5 text-xs dark:bg-stone-800">pris</code>. Eksisterende produkt/butik-priser opdateres i stedet for at blive dubletter.
              </p>

              <label className="mt-4 flex cursor-pointer flex-col items-center justify-center gap-2 rounded-xl border-2 border-dashed border-stone-200 px-4 py-8 text-center transition hover:border-rose-300 hover:bg-rose-50/30 dark:border-stone-700 dark:hover:bg-rose-500/10">
                <FileText size={22} className="text-stone-400" />
                <span className="text-sm font-medium text-stone-600 dark:text-stone-300">
                  {fileName ?? 'Vælg CSV-fil, eller træk den herhen'}
                </span>
                <input
                  type="file"
                  accept=".csv"
                  className="hidden"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) handleFile(file);
                  }}
                />
              </label>

              {fileName && (
                <div className="mt-4 flex flex-col gap-4">
                  <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
                    <div className="rounded-xl bg-emerald-50 px-3 py-3 dark:bg-emerald-500/10">
                      <p className="text-xl font-bold text-emerald-700 dark:text-emerald-400">{summary.createdPrices}</p>
                      <p className="text-xs font-medium text-emerald-700/70 dark:text-emerald-300/80">Nye priser</p>
                      <p className="mt-1 text-[11px] text-emerald-700/60 dark:text-emerald-300/70">{summary.createdProducts} nye varer</p>
                    </div>
                    <div className="rounded-xl bg-sky-50 px-3 py-3 dark:bg-sky-500/10">
                      <p className="text-xl font-bold text-sky-700 dark:text-sky-400">{summary.updatedPrices}</p>
                      <p className="text-xs font-medium text-sky-700/70 dark:text-sky-300/80">Opdateringer</p>
                    </div>
                    <div className="rounded-xl bg-stone-100 px-3 py-3 dark:bg-stone-800">
                      <p className="text-xl font-bold text-stone-700 dark:text-stone-200">{summary.unchangedPrices}</p>
                      <p className="text-xs font-medium text-stone-500 dark:text-stone-400">Uændrede</p>
                    </div>
                    <div className="rounded-xl bg-amber-50 px-3 py-3 dark:bg-amber-500/10">
                      <p className="text-xl font-bold text-amber-700 dark:text-amber-400">{issues.length}</p>
                      <p className="text-xs font-medium text-amber-700/70 dark:text-amber-300/80">Sprunget over</p>
                    </div>
                  </div>

                  {isPreparing && (
                    <div className="flex items-center gap-2 rounded-xl bg-stone-100 px-3 py-2 text-sm text-stone-600 dark:bg-stone-800 dark:text-stone-300">
                      <Loader2 size={16} className="animate-spin" />
                      Forbereder import-preview...
                    </div>
                  )}

                  {previewError && (
                    <div className="flex items-center gap-2 rounded-xl bg-red-50 px-3 py-2 text-sm text-red-700 dark:bg-red-500/10 dark:text-red-300">
                      <AlertTriangle size={16} className="shrink-0" />
                      {previewError}
                    </div>
                  )}

                  {issues.length > 0 && (
                    <div className="flex flex-col gap-1 rounded-xl bg-amber-50 px-3 py-2 text-sm text-amber-700 dark:bg-amber-500/10 dark:text-amber-300">
                      <div className="flex items-center gap-2 font-medium">
                        <AlertTriangle size={16} className="shrink-0" />
                        {issues.length} {issues.length === 1 ? 'linje' : 'linjer'} sprunget over
                      </div>
                      <ul className="ml-6 list-disc text-xs">
                        {issues.slice(0, 5).map((issue) => (
                          <li key={issue.line}>Linje {issue.line}: {issue.reason}</li>
                        ))}
                        {issues.length > 5 && <li>...og {issues.length - 5} mere</li>}
                      </ul>
                    </div>
                  )}

                  {plannedRows.length > 0 && (
                    <div className="overflow-hidden rounded-xl border border-stone-200 dark:border-stone-700">
                      <table className="w-full min-w-[640px] text-left text-sm">
                        <thead className="bg-stone-50 text-xs uppercase tracking-wide text-stone-400 dark:bg-stone-950/60 dark:text-stone-500">
                          <tr>
                            <th className="px-3 py-2">Linje</th>
                            <th className="px-3 py-2">Vare</th>
                            <th className="px-3 py-2">Butik</th>
                            <th className="px-3 py-2">Pris</th>
                            <th className="px-3 py-2">Handling</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-stone-100 dark:divide-stone-800">
                          {plannedRows.slice(0, 8).map((row) => (
                            <tr key={`${row.line}-${row.productName}-${row.store}`}>
                              <td className="px-3 py-2 text-stone-500 dark:text-stone-400">{row.line}</td>
                              <td className="px-3 py-2 font-medium text-stone-900 dark:text-stone-100">{row.productName}</td>
                              <td className="px-3 py-2 text-stone-600 dark:text-stone-300">{row.store}</td>
                              <td className="px-3 py-2 text-stone-600 dark:text-stone-300">
                                {row.action === 'update' && row.oldPrice !== null
                                  ? `${formatPrice(row.oldPrice)} -> ${formatPrice(row.price)} kr.`
                                  : `${formatPrice(row.price)} kr.`}
                              </td>
                              <td className="px-3 py-2">
                                <span className={`rounded-full px-2.5 py-1 text-xs font-semibold ${ACTION_STYLE[row.action]}`}>
                                  {ACTION_LABEL[row.action]}
                                </span>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                      {plannedRows.length > 8 && (
                        <p className="border-t border-stone-100 px-3 py-2 text-xs text-stone-400 dark:border-stone-800 dark:text-stone-500">
                          Viser 8 af {plannedRows.length} gyldige linjer.
                        </p>
                      )}
                    </div>
                  )}
                </div>
              )}

              <div className="mt-6 flex flex-wrap justify-end gap-2">
                <button onClick={closeModal} disabled={isImporting} className="rounded-xl border border-stone-200 px-4 py-2 text-sm font-medium text-stone-600 transition hover:bg-stone-50 disabled:opacity-40 dark:border-stone-700 dark:text-stone-300 dark:hover:bg-stone-800">
                  Annullér
                </button>
                <button
                  onClick={() => validRows.length > 0 && void buildPreview(validRows, issues)}
                  disabled={validRows.length === 0 || isPreparing || isImporting}
                  className="flex items-center gap-1.5 rounded-xl border border-stone-200 px-4 py-2 text-sm font-semibold text-stone-700 transition hover:bg-stone-50 disabled:opacity-40 dark:border-stone-700 dark:text-stone-300 dark:hover:bg-stone-800"
                >
                  <RefreshCw size={15} className={isPreparing ? 'animate-spin' : ''} />
                  Opdater preview
                </button>
                <button
                  onClick={handleImport}
                  disabled={rowsToImport === 0 || isPreparing || isImporting}
                  className="flex items-center gap-1.5 rounded-xl bg-rose-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-rose-700 disabled:opacity-40"
                >
                  {isImporting ? <Loader2 size={15} className="animate-spin" /> : <CheckCircle2 size={15} />}
                  {isImporting ? 'Importerer...' : `Importér ${rowsToImport} ændringer`}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
