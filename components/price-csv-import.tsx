'use client';

import { useState } from 'react';
import Papa from 'papaparse';
import { Upload, X, FileText, AlertTriangle, CheckCircle2 } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import { useToast } from '@/components/toast-provider';
import { logActivity } from '@/lib/activity-log';
import { useAdminUser } from '@/components/admin-user-context';

type ParsedRow = {
  product_name: string;
  store: string;
  price: number;
};

type RowIssue = {
  line: number;
  reason: string;
};

export function PriceCsvImport({ onImported }: { onImported: () => void }) {
  const supabase = createClient();
  const { showToast } = useToast();
  const adminUser = useAdminUser();

  const [isOpen, setIsOpen] = useState(false);
  const [fileName, setFileName] = useState<string | null>(null);
  const [validRows, setValidRows] = useState<ParsedRow[]>([]);
  const [issues, setIssues] = useState<RowIssue[]>([]);
  const [isImporting, setIsImporting] = useState(false);

  const reset = () => {
    setFileName(null);
    setValidRows([]);
    setIssues([]);
  };

  const closeModal = () => {
    setIsOpen(false);
    reset();
  };

  const handleFile = (file: File) => {
    setFileName(file.name);
    Papa.parse<Record<string, string>>(file, {
      header: true,
      skipEmptyLines: true,
      transformHeader: (h) => h.trim().toLowerCase(),
      complete: (results) => {
        const good: ParsedRow[] = [];
        const bad: RowIssue[] = [];

        results.data.forEach((row, i) => {
          const line = i + 2; // +1 for header row, +1 for 1-indexing
          const product = (row.produkt ?? row.product ?? '').trim();
          const store = (row.butik ?? row.store ?? '').trim();
          const priceRaw = (row.pris ?? row.price ?? '').trim().replace(',', '.');
          const price = parseFloat(priceRaw);

          if (!product) { bad.push({ line, reason: 'Mangler produktnavn' }); return; }
          if (!store) { bad.push({ line, reason: 'Mangler butik' }); return; }
          if (isNaN(price) || price <= 0) { bad.push({ line, reason: `Ugyldig pris ("${priceRaw}")` }); return; }

          good.push({ product_name: product, store, price });
        });

        setValidRows(good);
        setIssues(bad);
      },
      error: () => {
        showToast('Kunne ikke læse CSV-filen.', 'error');
      },
    });
  };

  const handleImport = async () => {
    if (validRows.length === 0) return;
    setIsImporting(true);

    const { error } = await supabase.from('global_standard_prices').insert(validRows);

    setIsImporting(false);
    if (error) {
      showToast('Kunne ikke importere priserne.', 'error');
      return;
    }
    showToast(`${validRows.length} priser importeret.`);
    logActivity(supabase, {
      actorId: adminUser.id, actorName: adminUser.name,
      action: 'created', entityType: 'price',
      entityLabel: `${validRows.length} priser (CSV-import)`,
    });
    closeModal();
    onImported();
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
          <div className="w-full max-w-lg rounded-2xl bg-white p-6 shadow-2xl" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-start justify-between gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-rose-500 to-rose-600">
                <Upload size={18} className="text-white" />
              </div>
              <button onClick={closeModal} className="text-stone-400 hover:text-stone-600">
                <X size={18} />
              </button>
            </div>

            <h2 className="mt-3 text-lg font-bold text-stone-900">Importér standardpriser</h2>
            <p className="mt-1 text-sm text-stone-600">
              CSV med kolonnerne <code className="rounded bg-stone-100 px-1 py-0.5 text-xs">produkt</code>,{' '}
              <code className="rounded bg-stone-100 px-1 py-0.5 text-xs">butik</code>,{' '}
              <code className="rounded bg-stone-100 px-1 py-0.5 text-xs">pris</code> (i den rækkefølge, med header-linje).
            </p>

            <label className="mt-4 flex cursor-pointer flex-col items-center justify-center gap-2 rounded-xl border-2 border-dashed border-stone-200 px-4 py-8 text-center transition hover:border-rose-300 hover:bg-rose-50/30">
              <FileText size={22} className="text-stone-400" />
              <span className="text-sm font-medium text-stone-600">
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
              <div className="mt-4 flex flex-col gap-2">
                {validRows.length > 0 && (
                  <div className="flex items-center gap-2 rounded-xl bg-emerald-50 px-3 py-2 text-sm text-emerald-700">
                    <CheckCircle2 size={16} className="shrink-0" />
                    {validRows.length} {validRows.length === 1 ? 'pris' : 'priser'} klar til import
                  </div>
                )}
                {issues.length > 0 && (
                  <div className="flex flex-col gap-1 rounded-xl bg-amber-50 px-3 py-2 text-sm text-amber-700">
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
              </div>
            )}

            <div className="mt-6 flex justify-end gap-2">
              <button onClick={closeModal} className="rounded-xl border border-stone-200 px-4 py-2 text-sm font-medium text-stone-600 hover:bg-stone-50">
                Annullér
              </button>
              <button
                onClick={handleImport}
                disabled={validRows.length === 0 || isImporting}
                className="rounded-xl bg-rose-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-rose-700 disabled:opacity-40"
              >
                {isImporting ? 'Importerer...' : `Importér ${validRows.length || ''} priser`}
              </button>
            </div>
          </div>
         </div>
        </div>
      )}
    </>
  );
}