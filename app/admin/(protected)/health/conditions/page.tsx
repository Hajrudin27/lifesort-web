'use client';

import { useEffect, useState, useCallback } from 'react';
import { HeartPulse, Plus, Pencil, Trash2, Search } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import { useToast } from '@/components/toast-provider';
import { useDebouncedValue } from '@/hooks/useDebouncedValue';
import { SkeletonRows } from '@/components/skeleton-rows';

type ConditionRow = {
  id: string;
  name_da: string;
  name_en: string;
  summary_da: string;
  summary_en: string;
  what_it_is_da: string;
  what_it_is_en: string;
  common_symptoms: string[];
  what_helps_da: string;
  what_helps_en: string;
  when_to_see_doctor_da: string;
  when_to_see_doctor_en: string;
};

type SymptomOption = { id: string; name_da: string };

function slugify(input: string) {
  return input.trim().toLowerCase().replace(/[^a-z0-9]+/g, '');
}

const EMPTY_FORM = {
  nameDa: '', nameEn: '',
  summaryDa: '', summaryEn: '',
  whatItIsDa: '', whatItIsEn: '',
  whatHelpsDa: '', whatHelpsEn: '',
  whenToSeeDoctorDa: '', whenToSeeDoctorEn: '',
};

export default function HealthConditionsPage() {
  const supabase = createClient();
  const { showToast, showUndoToast } = useToast();

  const [rows, setRows] = useState<ConditionRow[]>([]);
  const [symptomOptions, setSymptomOptions] = useState<SymptomOption[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState('');
  const debouncedSearch = useDebouncedValue(search, 300);

  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [idInput, setIdInput] = useState('');
  const [formLang, setFormLang] = useState<'da' | 'en'>('da');
  const [form, setForm] = useState(EMPTY_FORM);
  const [selectedSymptoms, setSelectedSymptoms] = useState<string[]>([]);
  const [isSaving, setIsSaving] = useState(false);

  const fetchAll = useCallback(async () => {
    setIsLoading(true);
    const [conditionsRes, symptomsRes] = await Promise.all([
      supabase.from('health_conditions').select('*').order('name_da'),
      supabase.from('symptom_glossary').select('id, name_da').order('name_da'),
    ]);
    if (!conditionsRes.error) setRows(conditionsRes.data ?? []);
    else showToast('Kunne ikke hente tilstande.', 'error');
    if (!symptomsRes.error) setSymptomOptions(symptomsRes.data ?? []);
    setIsLoading(false);
  }, [supabase, showToast]);

  useEffect(() => { fetchAll(); }, [fetchAll]);

  const filteredRows = rows.filter(
    (r) => !debouncedSearch.trim() || r.name_da.toLowerCase().includes(debouncedSearch.trim().toLowerCase())
  );

  const resetForm = () => {
    setEditingId(null); setIdInput(''); setForm(EMPTY_FORM); setSelectedSymptoms([]);
    setFormLang('da'); setShowForm(false);
  };

  const startNew = () => { resetForm(); setShowForm(true); };

  const startEdit = (row: ConditionRow) => {
    setEditingId(row.id);
    setIdInput(row.id);
    setForm({
      nameDa: row.name_da, nameEn: row.name_en,
      summaryDa: row.summary_da, summaryEn: row.summary_en,
      whatItIsDa: row.what_it_is_da, whatItIsEn: row.what_it_is_en,
      whatHelpsDa: row.what_helps_da, whatHelpsEn: row.what_helps_en,
      whenToSeeDoctorDa: row.when_to_see_doctor_da, whenToSeeDoctorEn: row.when_to_see_doctor_en,
    });
    setSelectedSymptoms(row.common_symptoms);
    setFormLang('da');
    setShowForm(true);
  };

  const toggleSymptom = (id: string) => {
    setSelectedSymptoms((prev) => (prev.includes(id) ? prev.filter((s) => s !== id) : [...prev, id]));
  };

  const slug = editingId ?? slugify(idInput);
  const canSave =
    slug.length > 0 &&
    form.nameDa.trim() && form.nameEn.trim() &&
    form.summaryDa.trim() && form.summaryEn.trim() &&
    form.whatItIsDa.trim() && form.whatItIsEn.trim() &&
    form.whatHelpsDa.trim() && form.whatHelpsEn.trim() &&
    form.whenToSeeDoctorDa.trim() && form.whenToSeeDoctorEn.trim();

  const handleSave = async () => {
    if (!canSave) return;
    setIsSaving(true);
    const payload = {
      id: slug,
      name_da: form.nameDa.trim(), name_en: form.nameEn.trim(),
      summary_da: form.summaryDa.trim(), summary_en: form.summaryEn.trim(),
      what_it_is_da: form.whatItIsDa.trim(), what_it_is_en: form.whatItIsEn.trim(),
      common_symptoms: selectedSymptoms,
      what_helps_da: form.whatHelpsDa.trim(), what_helps_en: form.whatHelpsEn.trim(),
      when_to_see_doctor_da: form.whenToSeeDoctorDa.trim(), when_to_see_doctor_en: form.whenToSeeDoctorEn.trim(),
    };
    const { error } = await supabase.from('health_conditions').upsert(payload);
    setIsSaving(false);
    if (error) { showToast('Kunne ikke gemme tilstanden.', 'error'); return; }
    showToast(editingId ? 'Tilstand opdateret.' : 'Tilstand oprettet.');
    resetForm();
    fetchAll();
  };

  const handleDelete = (row: ConditionRow) => {
    setRows((prev) => prev.filter((r) => r.id !== row.id));
    showUndoToast(
      `"${row.name_da}" slettet.`,
      async () => {
        const { error } = await supabase.from('health_conditions').delete().eq('id', row.id);
        if (error) { showToast('Kunne ikke slette tilstanden.', 'error'); fetchAll(); }
      },
      () => setRows((prev) => [...prev, row].sort((a, b) => a.name_da.localeCompare(b.name_da)))
    );
  };

  const inputClass = "mt-1 w-full rounded-xl border border-stone-200 bg-white px-3 py-2 text-sm text-stone-900 outline-none focus:border-rose-400 focus:ring-4 focus:ring-rose-100 dark:border-stone-700 dark:bg-stone-800 dark:text-stone-100";
  const labelClass = "text-xs font-semibold text-stone-500 dark:text-stone-400";

  return (
    <div>
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-rose-500 to-rose-600">
            <HeartPulse className="h-5 w-5 text-white" strokeWidth={2.2} />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-stone-900 dark:text-stone-100">Sundhedstilstande</h1>
            <p className="text-sm text-stone-500 dark:text-stone-400">{rows.length} tilstande · vises i appens cyklus-sundhedsinfo</p>
          </div>
        </div>
        {!showForm && (
          <button onClick={startNew}
            className="flex items-center gap-1.5 rounded-xl bg-stone-900 px-4 py-2 text-sm font-semibold text-white transition hover:bg-stone-800 dark:bg-rose-600 dark:hover:bg-rose-500">
            <Plus size={15} /> Ny tilstand
          </button>
        )}
      </div>

      {showForm && (
        <div className="mt-6 rounded-2xl border border-stone-200 bg-white p-6 shadow-sm shadow-stone-900/5 dark:border-stone-800 dark:bg-stone-900">
          <h2 className="font-bold text-stone-900 dark:text-stone-100">{editingId ? 'Redigér tilstand' : 'Ny tilstand'}</h2>

          {!editingId && (
            <div className="mt-4">
              <label className={labelClass}>ID (bruges internt, kan ikke ændres senere)</label>
              <input value={idInput} onChange={(e) => setIdInput(e.target.value)} className={inputClass} placeholder="fx endometriosis" />
              {idInput && <p className="mt-1 text-xs text-stone-400">Gemmes som: {slugify(idInput)}</p>}
            </div>
          )}

          <div className="mt-4 flex overflow-hidden rounded-xl border border-stone-200 text-sm dark:border-stone-700">
            <button onClick={() => setFormLang('da')}
              className={`flex-1 py-2 font-semibold transition ${formLang === 'da' ? 'bg-stone-900 text-white dark:bg-rose-600' : 'bg-white text-stone-600 dark:bg-stone-800 dark:text-stone-300'}`}>
              Dansk
            </button>
            <button onClick={() => setFormLang('en')}
              className={`flex-1 py-2 font-semibold transition ${formLang === 'en' ? 'bg-stone-900 text-white dark:bg-rose-600' : 'bg-white text-stone-600 dark:bg-stone-800 dark:text-stone-300'}`}>
              English
            </button>
          </div>

          {formLang === 'da' ? (
            <div className="mt-4 flex flex-col gap-4">
              <div>
                <label className={labelClass}>Navn</label>
                <input value={form.nameDa} onChange={(e) => setForm({ ...form, nameDa: e.target.value })} className={inputClass} placeholder="Fx Endometriose" />
              </div>
              <div>
                <label className={labelClass}>Kort resumé (vises i listen)</label>
                <input value={form.summaryDa} onChange={(e) => setForm({ ...form, summaryDa: e.target.value })} className={inputClass} />
              </div>
              <div>
                <label className={labelClass}>Hvad er det</label>
                <textarea value={form.whatItIsDa} onChange={(e) => setForm({ ...form, whatItIsDa: e.target.value })} rows={4} className={inputClass} />
              </div>
              <div>
                <label className={labelClass}>Hvad hjælper</label>
                <textarea value={form.whatHelpsDa} onChange={(e) => setForm({ ...form, whatHelpsDa: e.target.value })} rows={3} className={inputClass} />
              </div>
              <div>
                <label className={labelClass}>Hvornår skal man se en læge</label>
                <textarea value={form.whenToSeeDoctorDa} onChange={(e) => setForm({ ...form, whenToSeeDoctorDa: e.target.value })} rows={3} className={inputClass} />
              </div>
            </div>
          ) : (
            <div className="mt-4 flex flex-col gap-4">
              <div>
                <label className={labelClass}>Name</label>
                <input value={form.nameEn} onChange={(e) => setForm({ ...form, nameEn: e.target.value })} className={inputClass} placeholder="E.g. Endometriosis" />
              </div>
              <div>
                <label className={labelClass}>Short summary (shown in the list)</label>
                <input value={form.summaryEn} onChange={(e) => setForm({ ...form, summaryEn: e.target.value })} className={inputClass} />
              </div>
              <div>
                <label className={labelClass}>What it is</label>
                <textarea value={form.whatItIsEn} onChange={(e) => setForm({ ...form, whatItIsEn: e.target.value })} rows={4} className={inputClass} />
              </div>
              <div>
                <label className={labelClass}>What helps</label>
                <textarea value={form.whatHelpsEn} onChange={(e) => setForm({ ...form, whatHelpsEn: e.target.value })} rows={3} className={inputClass} />
              </div>
              <div>
                <label className={labelClass}>When to see a doctor</label>
                <textarea value={form.whenToSeeDoctorEn} onChange={(e) => setForm({ ...form, whenToSeeDoctorEn: e.target.value })} rows={3} className={inputClass} />
              </div>
            </div>
          )}

          <div className="mt-4">
            <label className={labelClass}>Almindelige symptomer (samme for begge sprog)</label>
            <div className="mt-2 flex flex-wrap gap-2">
              {symptomOptions.length === 0 ? (
                <p className="text-xs text-stone-400">Ingen symptomer oprettet endnu — tilføj dem under Symptomordbog først.</p>
              ) : (
                symptomOptions.map((s) => (
                  <button key={s.id} type="button" onClick={() => toggleSymptom(s.id)}
                    className={`rounded-full px-3 py-1.5 text-xs font-semibold transition ${
                      selectedSymptoms.includes(s.id)
                        ? 'bg-rose-600 text-white'
                        : 'border border-stone-200 bg-white text-stone-600 hover:bg-stone-50 dark:border-stone-700 dark:bg-stone-800 dark:text-stone-300'
                    }`}>
                    {s.name_da}
                  </button>
                ))
              )}
            </div>
          </div>

          <div className="mt-6 flex gap-2">
            <button onClick={handleSave} disabled={!canSave || isSaving}
              className="rounded-xl bg-stone-900 px-4 py-2 text-sm font-semibold text-white transition hover:bg-stone-800 disabled:opacity-40 dark:bg-rose-600 dark:hover:bg-rose-500">
              {isSaving ? 'Gemmer...' : editingId ? 'Gem ændringer' : 'Opret tilstand'}
            </button>
            <button onClick={resetForm} className="rounded-xl border border-stone-200 px-4 py-2 text-sm font-medium text-stone-600 hover:bg-stone-50 dark:border-stone-700 dark:text-stone-300 dark:hover:bg-stone-800">
              Annullér
            </button>
          </div>
          {!canSave && (form.nameDa || form.nameEn) && (
            <p className="mt-3 text-xs text-amber-600 dark:text-amber-400">Udfyld alle felter på begge sprog (Dansk + English) før du kan gemme.</p>
          )}
        </div>
      )}

      {!showForm && (
        <div className="mt-6">
          <div className="relative">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-stone-400" />
            <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Søg tilstand..."
              className="w-full rounded-xl border border-stone-200 bg-white py-2 pl-10 pr-3 text-sm text-stone-900 outline-none focus:border-rose-400 focus:ring-4 focus:ring-rose-100 dark:border-stone-700 dark:bg-stone-900 dark:text-stone-100" />
          </div>

          <div className="mt-4 overflow-hidden rounded-2xl border border-stone-200 bg-white shadow-sm shadow-stone-900/5 dark:border-stone-800 dark:bg-stone-900">
            <table className="w-full text-sm">
              <thead className="border-b border-stone-100 bg-stone-50/50 text-left text-xs font-semibold text-stone-500 dark:border-stone-800 dark:bg-stone-800/50 dark:text-stone-400">
                <tr>
                  <th className="px-5 py-3">Tilstand</th>
                  <th className="px-5 py-3">Resumé</th>
                  <th className="px-5 py-3">Symptomer</th>
                  <th className="px-5 py-3"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-stone-100 dark:divide-stone-800">
                {isLoading ? (
                  <SkeletonRows columns={4} />
                ) : filteredRows.length === 0 ? (
                  <tr><td colSpan={4} className="px-5 py-8 text-center text-stone-400 dark:text-stone-500">Ingen tilstande fundet.</td></tr>
                ) : (
                  filteredRows.map((row) => (
                    <tr key={row.id} className="transition hover:bg-stone-50/50 dark:hover:bg-stone-800/50">
                      <td className="px-5 py-3.5 font-medium text-stone-900 dark:text-stone-100">{row.name_da}</td>
                      <td className="max-w-xs truncate px-5 py-3.5 text-stone-600 dark:text-stone-400">{row.summary_da}</td>
                      <td className="px-5 py-3.5 text-stone-500 dark:text-stone-400">{row.common_symptoms.length}</td>
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