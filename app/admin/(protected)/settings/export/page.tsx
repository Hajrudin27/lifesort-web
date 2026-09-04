'use client';

import { useState } from 'react';
import { Download, DatabaseBackup, Loader2 } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import { useToast } from '@/components/toast-provider';

// Kun admin-styret indhold — ikke almindelige brugeres personlige data (todos, udgifter osv.),
// som lever under RLS og admin ikke har (og ikke bør have) direkte adgang til her.
const TABLES = [
  'global_standard_prices',
  'global_offers',
  'global_recipes',
  'timeline_events',
  'health_conditions',
  'symptom_glossary',
  'support_tickets',
  'waitlist_signups',
  'admin_users',
] as const;

export default function ExportDataPage() {
  const supabase = createClient();
  const { showToast } = useToast();
  const [isExporting, setIsExporting] = useState(false);

  const handleExport = async () => {
    setIsExporting(true);
    try {
      const results = await Promise.all(
        TABLES.map(async (table) => {
          const { data, error } = await supabase.from(table).select('*');
          return { table, data: error ? [] : data, error: error?.message };
        })
      );

      const failed = results.filter((r) => r.error);
      if (failed.length > 0) {
        showToast(`Kunne ikke hente: ${failed.map((f) => f.table).join(', ')}`, 'error');
      }

      const exportObject = {
        exportedAt: new Date().toISOString(),
        tables: Object.fromEntries(results.map((r) => [r.table, r.data])),
      };

      const json = JSON.stringify(exportObject, null, 2);
      const blob = new Blob([json], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `lifesort-admin-backup-${new Date().toISOString().split('T')[0]}.json`;
      a.click();
      URL.revokeObjectURL(url);

      if (failed.length === 0) showToast('Backup downloadet.');
    } catch {
      showToast('Kunne ikke lave backup.', 'error');
    }
    setIsExporting(false);
  };

  return (
    <div>
      <div className="flex items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-stone-800 to-stone-900">
          <DatabaseBackup className="h-5 w-5 text-white" strokeWidth={2.2} />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-stone-900 dark:text-stone-100">Eksportér data</h1>
          <p className="text-sm text-stone-500 dark:text-stone-400">En samlet backup af alt admin-styret indhold, som JSON</p>
        </div>
      </div>

      <div className="mt-6 rounded-2xl border border-stone-200 bg-white p-6 shadow-sm shadow-stone-900/5 dark:border-stone-800 dark:bg-stone-900">
        <p className="text-sm text-stone-600 dark:text-stone-400">Dette inkluderer:</p>
        <ul className="mt-2 flex flex-wrap gap-2">
          {TABLES.map((t) => (
            <li key={t} className="rounded-full bg-stone-100 px-2.5 py-1 text-xs font-medium text-stone-600 dark:bg-stone-800 dark:text-stone-300">
              {t}
            </li>
          ))}
        </ul>
        <p className="mt-3 text-xs text-stone-400 dark:text-stone-500">
          Almindelige brugeres personlige data (gøremål, udgifter, garantier osv.) er ikke med — det er ikke admin-styret indhold, og I har ikke direkte adgang til det herfra.
        </p>

        <button onClick={handleExport} disabled={isExporting}
          className="mt-6 flex items-center gap-2 rounded-xl bg-stone-900 px-4 py-2 text-sm font-semibold text-white transition hover:bg-stone-800 disabled:opacity-40 dark:bg-stone-700 dark:hover:bg-stone-600">
          {isExporting ? <Loader2 size={15} className="animate-spin" /> : <Download size={15} />}
          {isExporting ? 'Henter data...' : 'Download backup'}
        </button>
      </div>
    </div>
  );
}