'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  AlertTriangle,
  CheckCircle2,
  Clock3,
  DatabaseBackup,
  Download,
  FileJson,
  FileSpreadsheet,
  Loader2,
  RefreshCw,
  Table2,
} from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import { useToast } from '@/components/toast-provider';
import { rowsToCsv } from '@/lib/csv';

// Kun admin-styret indhold. Almindelige brugeres personlige data ligger under RLS
// og skal ikke kunne eksporteres fra admin-panelet.
const EXPORT_TABLES = [
  { name: 'products', label: 'Varer', description: 'Varenavne som standardpriser og tilbud refererer til' },
  { name: 'global_standard_prices', label: 'Standardpriser', description: 'Basispriser på varer på tværs af butikker' },
  { name: 'global_offers', label: 'Ugens tilbud', description: 'Aktive, kommende og udløbne tilbud' },
  { name: 'global_recipes', label: 'Opskrifter', description: 'Opskriftsbiblioteket til madplanen' },
  { name: 'timeline_events', label: 'Tidslinje', description: 'Roadmap, deadlines og milepæle' },
  { name: 'health_conditions', label: 'Sundhedstilstande', description: 'Cyklus-appens tilstandsbibliotek' },
  { name: 'symptom_glossary', label: 'Symptomordbog', description: 'Forklaringer af symptomer og sundhedstermer' },
  { name: 'support_tickets', label: 'Supportsager', description: 'Indkomne supportbeskeder og admin-svar' },
  { name: 'waitlist_signups', label: 'Venteliste', description: 'Tilmeldinger, platform og bekræftelsesstatus' },
  { name: 'admin_users', label: 'Admins', description: 'Personer med adgang til admin-panelet' },
] as const;

type ExportTable = (typeof EXPORT_TABLES)[number];
type TableName = ExportTable['name'];
type ExportFormat = 'json' | 'csv';
type SelectedTable = TableName | 'all';
type JsonRow = Record<string, unknown>;

type TableState = {
  name: TableName;
  label: string;
  description: string;
  count: number | null;
  error: string | null;
};

type ExportResult = {
  table: TableName;
  label: string;
  data: JsonRow[];
  error: string | null;
};

type LastExport = {
  exportedAt: string;
  format: ExportFormat;
  selection: SelectedTable;
  rowCount: number;
};

const LAST_EXPORT_KEY = 'lifesort:last-admin-export';

function dateStamp() {
  return new Date().toISOString().split('T')[0];
}

function formatDateTime(iso: string) {
  return new Date(iso).toLocaleString('da-DK', { dateStyle: 'medium', timeStyle: 'short' });
}

function downloadFile(filename: string, content: string, type: string) {
  const blob = new Blob([content], { type });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

function toCsv(results: ExportResult[]) {
  const rows = results.flatMap((result) =>
    result.data.map((row, index) => {
      const normalized: JsonRow = {
        table: result.label,
        table_name: result.table,
        row_number: index + 1,
      };

      Object.entries(row).forEach(([key, value]) => {
        normalized[key] = value;
      });

      return normalized;
    })
  );

  if (rows.length === 0) return 'table,table_name,row_number\n';

  const columns = Array.from(new Set(rows.flatMap((row) => Object.keys(row))));
  // Supportsager og venteliste indeholder tekst skrevet af fremmede — rowsToCsv citerer
  // korrekt og neutraliserer celler et regneark ellers ville køre som formler.
  return rowsToCsv(rows, columns);
}

function formatSelection(selection: SelectedTable) {
  if (selection === 'all') return 'Alle tabeller';
  return EXPORT_TABLES.find((table) => table.name === selection)?.label ?? selection;
}

function slugify(value: string) {
  return value.toLowerCase().replaceAll(' ', '-');
}

function StatusBadge({ state }: { state: TableState }) {
  if (state.error) {
    return (
      <span className="inline-flex items-center gap-1 rounded-full bg-red-100 px-2 py-0.5 text-[10px] font-bold uppercase text-red-700 dark:bg-red-500/15 dark:text-red-400">
        <AlertTriangle size={11} />
        Fejl
      </span>
    );
  }

  if (state.count === null) {
    return (
      <span className="inline-flex items-center gap-1 rounded-full bg-stone-100 px-2 py-0.5 text-[10px] font-bold uppercase text-stone-500 dark:bg-stone-800 dark:text-stone-400">
        <Loader2 size={11} className="animate-spin" />
        Tjekker
      </span>
    );
  }

  return (
    <span className="inline-flex items-center gap-1 rounded-full bg-emerald-100 px-2 py-0.5 text-[10px] font-bold uppercase text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-400">
      <CheckCircle2 size={11} />
      Klar
    </span>
  );
}

export function ExportDataClient() {
  const supabase = useMemo(() => createClient(), []);
  const { showToast } = useToast();
  const [selectedTable, setSelectedTable] = useState<SelectedTable>('all');
  const [format, setFormat] = useState<ExportFormat>('json');
  const [tableStates, setTableStates] = useState<TableState[]>(
    EXPORT_TABLES.map((table) => ({ ...table, count: null, error: null }))
  );
  const [isCounting, setIsCounting] = useState(true);
  const [isExporting, setIsExporting] = useState(false);
  const [lastExport, setLastExport] = useState<LastExport | null>(null);

  const selectedTables = useMemo(
    () => (selectedTable === 'all' ? EXPORT_TABLES : EXPORT_TABLES.filter((table) => table.name === selectedTable)),
    [selectedTable]
  );

  const selectedStates = useMemo(
    () => tableStates.filter((state) => selectedTable === 'all' || state.name === selectedTable),
    [selectedTable, tableStates]
  );

  const knownRows = selectedStates.reduce((sum, state) => sum + (state.count ?? 0), 0);
  const failedTables = selectedStates.filter((state) => state.error);
  const readyTables = selectedStates.filter((state) => !state.error && state.count !== null);

  const refreshCounts = useCallback(async () => {
    setIsCounting(true);
    try {
      const results = await Promise.all(
        EXPORT_TABLES.map(async (table) => {
          const { count, error } = await supabase.from(table.name).select('id', { count: 'exact', head: true });
          return {
            ...table,
            count: error ? null : count ?? 0,
            error: error?.message ?? null,
          };
        })
      );

      setTableStates(results);
    } catch (err) {
      const error = err instanceof Error ? err.message : 'Kunne ikke hente antal';
      setTableStates(EXPORT_TABLES.map((table) => ({ ...table, count: null, error })));
    } finally {
      setIsCounting(false);
    }
  }, [supabase]);

  useEffect(() => {
    queueMicrotask(() => {
      const saved = window.localStorage.getItem(LAST_EXPORT_KEY);
      if (!saved) return;

      try {
        setLastExport(JSON.parse(saved) as LastExport);
      } catch {
        window.localStorage.removeItem(LAST_EXPORT_KEY);
      }
    });
  }, []);

  useEffect(() => {
    queueMicrotask(() => {
      void refreshCounts();
    });
  }, [refreshCounts]);

  const handleExport = async () => {
    setIsExporting(true);
    try {
      const results = await Promise.all(
        selectedTables.map(async (table) => {
          const { data, error } = await supabase.from(table.name).select('*');
          return {
            table: table.name,
            label: table.label,
            data: error ? [] : (data as JsonRow[] | null) ?? [],
            error: error?.message ?? null,
          };
        })
      );

      const failed = results.filter((result) => result.error);
      const successful = results.filter((result) => !result.error);
      const rowCount = successful.reduce((sum, result) => sum + result.data.length, 0);

      if (successful.length === 0) {
        showToast('Ingen tabeller kunne eksporteres.', 'error');
        return;
      }

      const filenameBase = `lifesort-admin-backup-${slugify(formatSelection(selectedTable))}-${dateStamp()}`;

      if (format === 'json') {
        const exportObject = {
          exportedAt: new Date().toISOString(),
          selection: selectedTable,
          tables: Object.fromEntries(successful.map((result) => [result.table, result.data])),
          errors: failed.map((result) => ({ table: result.table, error: result.error })),
        };
        downloadFile(`${filenameBase}.json`, JSON.stringify(exportObject, null, 2), 'application/json;charset=utf-8;');
      } else {
        downloadFile(`${filenameBase}.csv`, toCsv(successful), 'text/csv;charset=utf-8;');
      }

      const exportMeta = {
        exportedAt: new Date().toISOString(),
        format,
        selection: selectedTable,
        rowCount,
      };
      window.localStorage.setItem(LAST_EXPORT_KEY, JSON.stringify(exportMeta));
      setLastExport(exportMeta);

      if (failed.length > 0) {
        showToast(`Eksport færdig, men ${failed.length} tabel kunne ikke hentes.`, 'error');
      } else {
        showToast(`${rowCount} rækker downloadet.`);
      }

      refreshCounts();
    } catch {
      showToast('Kunne ikke lave backup.', 'error');
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-stone-800 to-stone-900">
            <DatabaseBackup className="h-5 w-5 text-white" strokeWidth={2.2} />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-stone-900 dark:text-stone-100">Eksportér data</h1>
            <p className="text-sm text-stone-500 dark:text-stone-400">
              Backup af admin-styret indhold som JSON eller CSV
            </p>
          </div>
        </div>
        <button
          onClick={refreshCounts}
          disabled={isCounting || isExporting}
          className="flex items-center gap-1.5 rounded-xl border border-stone-200 bg-white px-3 py-2 text-sm font-semibold text-stone-700 transition hover:bg-stone-50 disabled:opacity-40 dark:border-stone-700 dark:bg-stone-900 dark:text-stone-300 dark:hover:bg-stone-800"
        >
          <RefreshCw size={15} className={isCounting ? 'animate-spin' : ''} />
          Opdater antal
        </button>
      </div>

      <div className="mt-8 grid grid-cols-1 gap-4 lg:grid-cols-3">
        <div className="rounded-2xl border border-stone-200 bg-white p-5 shadow-sm shadow-stone-900/5 dark:border-stone-800 dark:bg-stone-900">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-emerald-500 to-emerald-600">
            <Table2 className="h-5 w-5 text-white" strokeWidth={2.2} />
          </div>
          <p className="mt-4 text-2xl font-bold text-stone-900 dark:text-stone-100">{knownRows}</p>
          <p className="text-xs font-medium text-stone-500 dark:text-stone-400">Rækker i valget</p>
          <p className="mt-2 text-xs text-stone-400 dark:text-stone-500">
            Baseret på {readyTables.length} af {selectedTables.length} tabeller
          </p>
        </div>

        <div className="rounded-2xl border border-stone-200 bg-white p-5 shadow-sm shadow-stone-900/5 dark:border-stone-800 dark:bg-stone-900">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-sky-500 to-sky-600">
            {format === 'json' ? <FileJson className="h-5 w-5 text-white" /> : <FileSpreadsheet className="h-5 w-5 text-white" />}
          </div>
          <p className="mt-4 text-2xl font-bold uppercase text-stone-900 dark:text-stone-100">{format}</p>
          <p className="text-xs font-medium text-stone-500 dark:text-stone-400">Valgt format</p>
          <p className="mt-2 text-xs text-stone-400 dark:text-stone-500">
            {format === 'json' ? 'Bedst til fuld backup og restore senere' : 'Bedst til ark, filtrering og hurtig gennemgang'}
          </p>
        </div>

        <div className="rounded-2xl border border-stone-200 bg-white p-5 shadow-sm shadow-stone-900/5 dark:border-stone-800 dark:bg-stone-900">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-amber-500 to-amber-600">
            <Clock3 className="h-5 w-5 text-white" strokeWidth={2.2} />
          </div>
          <p className="mt-4 text-sm font-bold text-stone-900 dark:text-stone-100">
            {lastExport ? formatDateTime(lastExport.exportedAt) : 'Ingen lokal eksport endnu'}
          </p>
          <p className="text-xs font-medium text-stone-500 dark:text-stone-400">Sidst eksporteret</p>
          <p className="mt-2 text-xs text-stone-400 dark:text-stone-500">
            {lastExport
              ? `${lastExport.rowCount} rækker som ${lastExport.format.toUpperCase()} fra ${formatSelection(lastExport.selection)}`
              : 'Gemmes kun i denne browser'}
          </p>
        </div>
      </div>

      <section className="mt-6 rounded-2xl border border-stone-200 bg-stone-50/60 p-4 dark:border-stone-800 dark:bg-stone-950/40">
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-[1.2fr_0.8fr]">
          <div className="rounded-2xl border border-stone-200 bg-white p-5 shadow-sm shadow-stone-900/5 dark:border-stone-800 dark:bg-stone-900">
            <h2 className="text-sm font-bold text-stone-900 dark:text-stone-100">Vælg indhold</h2>
            <p className="mt-1 text-xs text-stone-500 dark:text-stone-400">
              Eksporter alt samlet, eller tag én bestemt tabel når du kun skal arbejde med et område.
            </p>

            <div className="mt-4 grid grid-cols-1 gap-2 sm:grid-cols-2">
              <button
                onClick={() => setSelectedTable('all')}
                className={`rounded-xl border px-3 py-3 text-left transition ${
                  selectedTable === 'all'
                    ? 'border-stone-900 bg-stone-900 text-white dark:border-stone-100 dark:bg-stone-100 dark:text-stone-950'
                    : 'border-stone-200 bg-white text-stone-700 hover:bg-stone-50 dark:border-stone-700 dark:bg-stone-900 dark:text-stone-300 dark:hover:bg-stone-800'
                }`}
              >
                <span className="block text-sm font-semibold">Alle tabeller</span>
                <span className={`mt-1 block text-xs ${selectedTable === 'all' ? 'text-white/70 dark:text-stone-600' : 'text-stone-400'}`}>
                  Samlet backup af hele admin-datasættet
                </span>
              </button>

              {EXPORT_TABLES.map((table) => {
                const state = tableStates.find((item) => item.name === table.name);
                return (
                  <button
                    key={table.name}
                    onClick={() => setSelectedTable(table.name)}
                    className={`rounded-xl border px-3 py-3 text-left transition ${
                      selectedTable === table.name
                        ? 'border-stone-900 bg-stone-900 text-white dark:border-stone-100 dark:bg-stone-100 dark:text-stone-950'
                        : 'border-stone-200 bg-white text-stone-700 hover:bg-stone-50 dark:border-stone-700 dark:bg-stone-900 dark:text-stone-300 dark:hover:bg-stone-800'
                    }`}
                  >
                    <span className="flex items-center justify-between gap-2">
                      <span className="text-sm font-semibold">{table.label}</span>
                      <span className={`text-xs font-bold ${selectedTable === table.name ? 'text-white/80 dark:text-stone-600' : 'text-stone-400'}`}>
                        {state?.count ?? '-'}
                      </span>
                    </span>
                    <span className={`mt-1 block text-xs ${selectedTable === table.name ? 'text-white/70 dark:text-stone-600' : 'text-stone-400'}`}>
                      {table.description}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          <div className="rounded-2xl border border-stone-200 bg-white p-5 shadow-sm shadow-stone-900/5 dark:border-stone-800 dark:bg-stone-900">
            <h2 className="text-sm font-bold text-stone-900 dark:text-stone-100">Format</h2>
            <p className="mt-1 text-xs text-stone-500 dark:text-stone-400">
              JSON bevarer strukturen bedst. CSV er hurtigere at åbne i Excel eller Sheets.
            </p>

            <div className="mt-4 grid grid-cols-2 rounded-xl border border-stone-200 bg-stone-100 p-1 text-sm font-semibold dark:border-stone-700 dark:bg-stone-950">
              <button
                onClick={() => setFormat('json')}
                className={`flex items-center justify-center gap-1.5 rounded-lg px-3 py-2 transition ${
                  format === 'json'
                    ? 'bg-white text-stone-900 shadow-sm dark:bg-stone-800 dark:text-stone-100'
                    : 'text-stone-500 hover:text-stone-700 dark:text-stone-400 dark:hover:text-stone-200'
                }`}
              >
                <FileJson size={15} />
                JSON
              </button>
              <button
                onClick={() => setFormat('csv')}
                className={`flex items-center justify-center gap-1.5 rounded-lg px-3 py-2 transition ${
                  format === 'csv'
                    ? 'bg-white text-stone-900 shadow-sm dark:bg-stone-800 dark:text-stone-100'
                    : 'text-stone-500 hover:text-stone-700 dark:text-stone-400 dark:hover:text-stone-200'
                }`}
              >
                <FileSpreadsheet size={15} />
                CSV
              </button>
            </div>

            <div className="mt-5 rounded-xl border border-stone-200 bg-stone-50 p-4 dark:border-stone-800 dark:bg-stone-950/60">
              <p className="text-xs font-bold uppercase tracking-wide text-stone-400 dark:text-stone-500">Valgt eksport</p>
              <p className="mt-2 text-sm font-semibold text-stone-900 dark:text-stone-100">{formatSelection(selectedTable)}</p>
              <p className="mt-1 text-xs text-stone-500 dark:text-stone-400">
                {knownRows} rækker fordelt på {selectedTables.length} tabel{selectedTables.length === 1 ? '' : 'ler'}
              </p>
              {failedTables.length > 0 && (
                <p className="mt-3 rounded-lg bg-red-50 px-3 py-2 text-xs font-medium text-red-700 dark:bg-red-500/10 dark:text-red-300">
                  {failedTables.length} tabel{failedTables.length === 1 ? '' : 'ler'} har fejl og bliver sprunget over.
                </p>
              )}
            </div>

            <button
              onClick={handleExport}
              disabled={isExporting || readyTables.length === 0}
              className="mt-5 flex w-full items-center justify-center gap-2 rounded-xl bg-stone-900 px-4 py-3 text-sm font-semibold text-white transition hover:bg-stone-800 disabled:opacity-40 dark:bg-stone-700 dark:hover:bg-stone-600"
            >
              {isExporting ? <Loader2 size={16} className="animate-spin" /> : <Download size={16} />}
              {isExporting ? 'Henter data...' : `Download ${format.toUpperCase()}`}
            </button>
          </div>
        </div>
      </section>

      <section className="mt-6 rounded-2xl border border-stone-200 bg-white shadow-sm shadow-stone-900/5 dark:border-stone-800 dark:bg-stone-900">
        <div className="border-b border-stone-200 px-5 py-4 dark:border-stone-800">
          <h2 className="text-sm font-bold text-stone-900 dark:text-stone-100">Tabeller i backup</h2>
          <p className="mt-1 text-xs text-stone-500 dark:text-stone-400">
            Kun admin-styret indhold er med. Private brugerdata eksporteres ikke herfra.
          </p>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[760px] text-left text-sm">
            <thead className="bg-stone-50 text-xs uppercase tracking-wide text-stone-400 dark:bg-stone-950/60 dark:text-stone-500">
              <tr>
                <th className="px-5 py-3">Område</th>
                <th className="px-5 py-3">Tabel</th>
                <th className="px-5 py-3">Rækker</th>
                <th className="px-5 py-3">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-stone-100 dark:divide-stone-800">
              {tableStates.map((state) => (
                <tr key={state.name} className="align-top">
                  <td className="px-5 py-4">
                    <p className="font-semibold text-stone-900 dark:text-stone-100">{state.label}</p>
                    <p className="mt-1 text-xs text-stone-500 dark:text-stone-400">{state.description}</p>
                  </td>
                  <td className="px-5 py-4 font-mono text-xs text-stone-500 dark:text-stone-400">{state.name}</td>
                  <td className="px-5 py-4 font-semibold text-stone-900 dark:text-stone-100">
                    {state.count === null ? '-' : state.count}
                  </td>
                  <td className="px-5 py-4">
                    <StatusBadge state={state} />
                    {state.error && <p className="mt-2 max-w-xs text-xs text-red-600 dark:text-red-300">{state.error}</p>}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}
