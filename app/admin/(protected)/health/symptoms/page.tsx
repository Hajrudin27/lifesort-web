'use client';

import { useEffect, useState, useCallback } from 'react';
import { HeartPulse, Plus, Pencil, Trash2, Search } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import { useToast } from '@/components/toast-provider';
import { useDebouncedValue } from '@/hooks/useDebouncedValue';
import { SkeletonRows } from '@/components/skeleton-rows';

type SymptomRow = {
  id: string;
  name_da: string;
  name_en: string;
  description_da: string;
  description_en: string;
};

function slugify(input: string) {
  return input
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '');
}

export default function SymptomGlossaryPage() {
  const supabase = createClient();
  const { showToast, showUndoToast } = useToast();

  const [rows, setRows] = useState<SymptomRow[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState('');
  const debouncedSearch = useDebouncedValue(search, 300);

  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [idInput, setIdInput] = useState('');
  const [nameDa, setNameDa] = useState('');
  const [nameEn, setNameEn] = useState('');
  const [descDa, setDescDa] = useState('');
  const [descEn, setDescEn] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  const fetchRows = useCallback(async () => {
    setIsLoading(true);
    const { data, error } = await supabase.from('symptom_glossary').select('*').order('name_da');
    if (!error) setRows(data ?? []);
    else showToast('Kunne ikke hente symptomer.', 'error');
    setIsLoading(false);
  }, [supabase, showToast]);

  useEffect(() => { fetchRows(); }, [fetchRows]);

  const filteredRows = rows.filter(
    (r) =>
      !debouncedSearch.trim() ||
      r.name_da.toLowerCase().includes(debouncedSearch.trim().toLowerCase()) ||
      r.name_en.toLowerCase().includes(debouncedSearch.trim().toLowerCase())
  );

  const resetForm = () => {
    setEditingId(null); setIdInput(''); setNameDa(''); setNameEn('');
    setDescDa(''); setDescEn(''); setShowForm(false);
  };

  const startNew = () => { resetForm(); setShowForm(true); };

  const startEdit = (row: SymptomRow) => {
    setEditingId(row.id);
    setIdInput(row.id);
    setNameDa(row.name_da); setNameEn(row.name_en);
    setDescDa(row.description_da); setDescEn(row.description_en);
    setShowForm(true);
  };

  const slug = editingId ?? slugify(idInput);
  const canSave = slug.length > 0 && nameDa.trim().length > 0 && nameEn.trim().length > 0 && descDa.trim().length > 0 && descEn.trim().length > 0;

  const handleSave = async () => {
    if (!canSave) return;
    setIsSaving(true);
    const payload = {
      id: slug,
      name_da: nameDa.trim(), name_en: nameEn.trim(),
      description_da: descDa.trim(), description_en: descEn.trim(),
    };
    const { error } = await supabase.from('symptom_glossary').upsert(payload);
    setIsSaving(false);
    if (error) { showToast('Kunne ikke gemme symptomet.', 'error'); return; }
    showToast(editingId ? 'Symptom opdateret.' : 'Symptom oprettet.');
    resetForm();
    fetchRows();
  };

  const handleDelete = (row: SymptomRow) => {
    setRows((prev) => prev.filter((r) => r.id !== row.id));
    showUndoToast(
      `"${row.name_da}" slettet.`,
      async () => {
        const { error } = await supabase.from('symptom_glossary').delete().eq('id', row.id);
        if (error) { showToast('Kunne ikke slette symptomet.', 'error'); fetchRows(); }
      },
      () => setRows((prev) => [...prev, row].sort((a, b) => a.name_da.localeCompare(b.name_da)))
    );
  };

  return (
    <div>
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-rose-500 to-rose-600">
            <HeartPulse className="h-5 w-5 text-white" strokeWidth={2.2} />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-stone-900 dark:text-stone-100">Symptomordbog</h1>
            <p className="text-sm text-stone-500 dark:text-stone-400">{rows.length} symptomer · vises i appens sundhedsinfo</p>
          </div>
        </div>
        {!showForm && (
          <button onClick={startNew}
            className="flex items-center gap-1.5 rounded-xl bg-stone-900 px-4 py-2 text-sm font-semibold text-white transition hover:bg-stone-800 dark:bg-rose-600 dark:hover:bg-rose-500">
            <Plus size={15} /> Nyt symptom
          </button>
        )}
      </div>

      {showForm && (
        <div className="mt-6 rounded-2xl border border-stone-200 bg-white p-6 shadow-sm shadow-stone-900/5 dark:border-stone-800 dark:bg-stone-900">
          <h2 className="font-bold text-stone-900 dark:text-stone-100">{editingId ? 'Redigér symptom' : 'Nyt symptom'}</h2>

          {!editingId && (
            <div className="mt-4">
              <label className="text-xs font-semibold text-stone-500 dark:text-stone-400">ID (bruges internt, kan ikke ændres senere)</label>
              <input value={idInput} onChange={(e) => setIdInput(e.target.value)}
                className="mt-1 w-full rounded-xl border border-stone-200 bg-white px-3 py-2 text-sm text-stone-900 outline-none focus:border-rose-400 focus:ring-4 focus:ring-rose-100 dark:border-stone-700 dark:bg-stone-800 dark:text-stone-100"
                placeholder="fx cramps" />
              {idInput && <p className="mt-1 text-xs text-stone-400">Gemmes som: {slugify(idInput)}</p>}
            </div>
          )}

          <div className="mt-4 grid grid-cols-2 gap-4">
            <div>
              <label className="text-xs font-semibold text-stone-500 dark:text-stone-400">Navn (dansk)</label>
              <input value={nameDa} onChange={(e) => setNameDa(e.target.value)}
                className="mt-1 w-full rounded-xl border border-stone-200 bg-white px-3 py-2 text-sm text-stone-900 outline-none focus:border-rose-400 focus:ring-4 focus:ring-rose-100 dark:border-stone-700 dark:bg-stone-800 dark:text-stone-100"
                placeholder="Kramper" />
            </div>
            <div>
              <label className="text-xs font-semibold text-stone-500 dark:text-stone-400">Name (English)</label>
              <input value={nameEn} onChange={(e) => setNameEn(e.target.value)}
                className="mt-1 w-full rounded-xl border border-stone-200 bg-white px-3 py-2 text-sm text-stone-900 outline-none focus:border-rose-400 focus:ring-4 focus:ring-rose-100 dark:border-stone-700 dark:bg-stone-800 dark:text-stone-100"
                placeholder="Cramps" />
            </div>
          </div>

          <div className="mt-4 grid grid-cols-2 gap-4">
            <div>
              <label className="text-xs font-semibold text-stone-500 dark:text-stone-400">Beskrivelse (dansk)</label>
              <textarea value={descDa} onChange={(e) => setDescDa(e.target.value)} rows={3}
                className="mt-1 w-full rounded-xl border border-stone-200 bg-white px-3 py-2 text-sm text-stone-900 outline-none focus:border-rose-400 focus:ring-4 focus:ring-rose-100 dark:border-stone-700 dark:bg-stone-800 dark:text-stone-100" />
            </div>
            <div>
              <label className="text-xs font-semibold text-stone-500 dark:text-stone-400">Description (English)</label>
              <textarea value={descEn} onChange={(e) => setDescEn(e.target.value)} rows={3}
                className="mt-1 w-full rounded-xl border border-stone-200 bg-white px-3 py-2 text-sm text-stone-900 outline-none focus:border-rose-400 focus:ring-4 focus:ring-rose-100 dark:border-stone-700 dark:bg-stone-800 dark:text-stone-100" />
            </div>
          </div>

          <div className="mt-6 flex gap-2">
            <button onClick={handleSave} disabled={!canSave || isSaving}
              className="rounded-xl bg-stone-900 px-4 py-2 text-sm font-semibold text-white transition hover:bg-stone-800 disabled:opacity-40 dark:bg-rose-600 dark:hover:bg-rose-500">
              {isSaving ? 'Gemmer...' : editingId ? 'Gem ændringer' : 'Opret symptom'}
            </button>
            <button onClick={resetForm} className="rounded-xl border border-stone-200 px-4 py-2 text-sm font-medium text-stone-600 hover:bg-stone-50 dark:border-stone-700 dark:text-stone-300 dark:hover:bg-stone-800">
              Annullér
            </button>
          </div>
        </div>
      )}

      {!showForm && (
        <div className="mt-6">
          <div className="relative">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-stone-400" />
            <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Søg symptom..."
              className="w-full rounded-xl border border-stone-200 bg-white py-2 pl-10 pr-3 text-sm text-stone-900 outline-none focus:border-rose-400 focus:ring-4 focus:ring-rose-100 dark:border-stone-700 dark:bg-stone-900 dark:text-stone-100" />
          </div>

          <div className="mt-4 overflow-hidden rounded-2xl border border-stone-200 bg-white shadow-sm shadow-stone-900/5 dark:border-stone-800 dark:bg-stone-900">
            <table className="w-full text-sm">
              <thead className="border-b border-stone-100 bg-stone-50/50 text-left text-xs font-semibold text-stone-500 dark:border-stone-800 dark:bg-stone-800/50 dark:text-stone-400">
                <tr>
                  <th className="px-5 py-3">Dansk</th>
                  <th className="px-5 py-3">English</th>
                  <th className="px-5 py-3"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-stone-100 dark:divide-stone-800">
                {isLoading ? (
                  <SkeletonRows columns={3} />
                ) : filteredRows.length === 0 ? (
                  <tr><td colSpan={3} className="px-5 py-8 text-center text-stone-400 dark:text-stone-500">Ingen symptomer fundet.</td></tr>
                ) : (
                  filteredRows.map((row) => (
                    <tr key={row.id} className="transition hover:bg-stone-50/50 dark:hover:bg-stone-800/50">
                      <td className="px-5 py-3.5 font-medium text-stone-900 dark:text-stone-100">{row.name_da}</td>
                      <td className="px-5 py-3.5 text-stone-600 dark:text-stone-400">{row.name_en}</td>
                      <td className="px-5 py-3.5 text-right">
                        <div className="flex items-center justify-end gap-1">
                          <button onClick={() => startEdit(row)} title="Redigér" className="rounded-lg p-1.5 text-stone-500 transition hover:bg-stone-100 dark:text-stone-400 dark:hover:bg-stone-800">
                            <Pencil size={15} />
                          </button>
                          <button onClick={() => handleDelete(row)} title="Slet" className="rounded-lg p-1.5 text-red-500 transition hover:bg-red-50 dark:text-red-400 dark:hover:bg-red-500/10">
                            <Trash2 size={15} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}