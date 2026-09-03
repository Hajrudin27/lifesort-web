'use client';

import { useEffect, useState, useCallback } from 'react';
import { BookOpen, Plus, Pencil, Trash2, Search, ChevronLeft, ChevronRight, X, Clock, ImagePlus, Loader2 } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import { useToast } from '@/components/toast-provider';
import { logActivity } from '@/lib/activity-log';
import { useAdminUser } from '@/components/admin-user-context';
import { SkeletonRows } from '@/components/skeleton-rows';
import { useDebouncedValue } from '@/hooks/useDebouncedValue';
import { compressImage } from '@/lib/imageCompression';

type MealType = 'breakfast' | 'lunch' | 'dinner';
type Ingredient = { name: string; amount: string };

type RecipeRow = {
  id: string;
  name: string;
  meal_type: MealType;
  ingredients: Ingredient[];
  minutes: number | null;
  instructions: string | null;
  calories: number | null;
  protein: number | null;
  carbs: number | null;
  fat: number | null;
  tags: string[];
  image_url: string | null;
};

const PAGE_SIZE = 20;
const MEAL_TYPES: MealType[] = ['breakfast', 'lunch', 'dinner'];
const MEAL_LABELS: Record<MealType, string> = { breakfast: 'Morgenmad', lunch: 'Frokost', dinner: 'Aftensmad' };
const MEAL_COLORS: Record<MealType, string> = {
  breakfast: 'bg-amber-100 text-amber-700 dark:bg-amber-500/15 dark:text-amber-400',
  lunch: 'bg-sky-100 text-sky-700 dark:bg-sky-500/15 dark:text-sky-400',
  dinner: 'bg-violet-100 text-violet-700 dark:bg-violet-500/15 dark:text-violet-400',
};

function emptyIngredient(): Ingredient {
  return { name: '', amount: '' };
}

export default function RecipesPage() {
  const supabase = createClient();
  const { showToast, showUndoToast } = useToast();
  const adminUser = useAdminUser();

  const [rows, setRows] = useState<RecipeRow[]>([]);
  const [totalCount, setTotalCount] = useState(0);
  const [page, setPage] = useState(0);
  const [search, setSearch] = useState('');
  const debouncedSearch = useDebouncedValue(search, 300);
  const [mealFilter, setMealFilter] = useState<MealType | 'all'>('all');
  const [isLoading, setIsLoading] = useState(true);

  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  const [name, setName] = useState('');
  const [mealType, setMealType] = useState<MealType>('dinner');
  const [ingredients, setIngredients] = useState<Ingredient[]>([emptyIngredient()]);
  const [minutes, setMinutes] = useState('');
  const [instructions, setInstructions] = useState('');
  const [calories, setCalories] = useState('');
  const [protein, setProtein] = useState('');
  const [carbs, setCarbs] = useState('');
  const [fat, setFat] = useState('');
  const [tagsInput, setTagsInput] = useState('');
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [isUploadingImage, setIsUploadingImage] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  const fetchRows = useCallback(async () => {
    setIsLoading(true);
    let query = supabase.from('global_recipes').select('*', { count: 'exact' }).order('name');
    if (debouncedSearch.trim()) query = query.ilike('name', `%${debouncedSearch.trim()}%`);
    if (mealFilter !== 'all') query = query.eq('meal_type', mealFilter);

    const from = page * PAGE_SIZE;
    const to = from + PAGE_SIZE - 1;
    query = query.range(from, to);

    const { data, count, error } = await query;
    if (!error) {
      setRows((data as unknown as RecipeRow[]) ?? []);
      setTotalCount(count ?? 0);
    } else {
      showToast('Kunne ikke hente opskrifter.', 'error');
    }
    setIsLoading(false);
  }, [supabase, debouncedSearch, mealFilter, page, showToast]);

  useEffect(() => { fetchRows(); }, [fetchRows]);
  useEffect(() => { setPage(0); }, [debouncedSearch, mealFilter]);

  const resetForm = () => {
    setEditingId(null); setName(''); setMealType('dinner');
    setIngredients([emptyIngredient()]); setMinutes(''); setInstructions('');
    setCalories(''); setProtein(''); setCarbs(''); setFat(''); setTagsInput('');
    setImageUrl(null); setShowForm(false);
  };

  const startEdit = (row: RecipeRow) => {
    setEditingId(row.id);
    setName(row.name);
    setMealType(row.meal_type);
    setIngredients(row.ingredients.length > 0 ? row.ingredients : [emptyIngredient()]);
    setMinutes(row.minutes?.toString() ?? '');
    setInstructions(row.instructions ?? '');
    setCalories(row.calories?.toString() ?? '');
    setProtein(row.protein?.toString() ?? '');
    setCarbs(row.carbs?.toString() ?? '');
    setFat(row.fat?.toString() ?? '');
    setTagsInput(row.tags.join(', '));
    setImageUrl(row.image_url);
    setShowForm(true);
  };

  const startNew = () => { resetForm(); setShowForm(true); };

  const updateIngredient = (index: number, field: keyof Ingredient, value: string) => {
    setIngredients((prev) => prev.map((ing, i) => (i === index ? { ...ing, [field]: value } : ing)));
  };
  const addIngredientRow = () => setIngredients((prev) => [...prev, emptyIngredient()]);
  const removeIngredientRow = (index: number) => setIngredients((prev) => prev.filter((_, i) => i !== index));

  const handleImageSelect = async (file: File) => {
    setIsUploadingImage(true);
    const compressed = await compressImage(file, { maxDimension: 1600, quality: 0.75 });
    const ext = compressed.name.split('.').pop() ?? 'jpg';
    const path = `${crypto.randomUUID()}.${ext}`;

    const { error } = await supabase.storage.from('recipe-images').upload(path, compressed);
    if (error) {
      showToast('Kunne ikke uploade billedet.', 'error');
      setIsUploadingImage(false);
      return;
    }

    const { data } = supabase.storage.from('recipe-images').getPublicUrl(path);
    setImageUrl(data.publicUrl);
    setIsUploadingImage(false);
  };

  const validIngredients = ingredients.filter((i) => i.name.trim().length > 0);
  const canSave = name.trim().length > 0 && validIngredients.length > 0;

  const handleSave = async () => {
    if (!canSave) return;
    setIsSaving(true);
    const wasEditing = !!editingId;
    const payload = {
      name: name.trim(), meal_type: mealType,
      ingredients: validIngredients.map((i) => ({ name: i.name.trim(), amount: i.amount.trim() })),
      minutes: minutes.trim() ? parseInt(minutes, 10) : null,
      instructions: instructions.trim() || null,
      calories: calories.trim() ? parseFloat(calories) : null,
      protein: protein.trim() ? parseFloat(protein) : null,
      carbs: carbs.trim() ? parseFloat(carbs) : null,
      fat: fat.trim() ? parseFloat(fat) : null,
      tags: tagsInput.trim() ? tagsInput.split(',').map((t) => t.trim()).filter(Boolean) : [],
      image_url: imageUrl,
      updated_at: new Date().toISOString(),
    };

    if (wasEditing) {
      // Optimistisk: opdater rækken i listen med det samme.
      setRows((prev) => prev.map((r) => (r.id === editingId ? { ...r, ...payload } : r)));
      resetForm();
      const { error } = await supabase.from('global_recipes').update(payload).eq('id', editingId);
      setIsSaving(false);
      if (error) { showToast('Kunne ikke gemme opskriften.', 'error'); fetchRows(); return; }
    } else {
      const { error } = await supabase.from('global_recipes').insert(payload);
      setIsSaving(false);
      if (error) { showToast('Kunne ikke gemme opskriften.', 'error'); return; }
      resetForm();
      fetchRows();
    }

    showToast(wasEditing ? 'Opskrift opdateret.' : 'Opskrift oprettet.');
    logActivity(supabase, {
      actorId: adminUser.id, actorName: adminUser.name,
      action: wasEditing ? 'updated' : 'created', entityType: 'recipe',
      entityLabel: name.trim(),
    });
  };

  const handleDelete = (row: RecipeRow) => {
    setRows((prev) => prev.filter((r) => r.id !== row.id));
    showUndoToast(
      `"${row.name}" slettet.`,
      async () => {
        const { error } = await supabase.from('global_recipes').delete().eq('id', row.id);
        if (error) { showToast('Kunne ikke slette opskriften.', 'error'); fetchRows(); return; }
        logActivity(supabase, {
          actorId: adminUser.id, actorName: adminUser.name,
          action: 'deleted', entityType: 'recipe',
          entityLabel: row.name,
        });
      },
      () => setRows((prev) => [...prev, row].sort((a, b) => a.name.localeCompare(b.name)))
    );
  };

  const totalPages = Math.max(1, Math.ceil(totalCount / PAGE_SIZE));

  return (
    <div>
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-amber-500 to-amber-600">
            <BookOpen className="h-5 w-5 text-white" strokeWidth={2.2} />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-stone-900 dark:text-stone-100">Opskrifter</h1>
            <p className="text-sm text-stone-500 dark:text-stone-400">{totalCount} opskrifter i alt</p>
          </div>
        </div>
        {!showForm && (
          <button onClick={startNew}
            className="flex items-center gap-1.5 rounded-xl bg-stone-900 px-4 py-2 text-sm font-semibold text-white transition hover:bg-stone-800 dark:bg-amber-600 dark:hover:bg-amber-500">
            <Plus size={15} /> Ny opskrift
          </button>
        )}
      </div>

      {showForm && (
        <div className="mt-6 rounded-2xl border border-stone-200 bg-white p-6 shadow-sm shadow-stone-900/5 dark:border-stone-800 dark:bg-stone-900">
          <h2 className="font-bold text-stone-900 dark:text-stone-100">{editingId ? 'Redigér opskrift' : 'Ny opskrift'}</h2>

          <div className="mt-4">
            <label className="text-xs font-semibold text-stone-500 dark:text-stone-400">Billede</label>
            <div className="mt-1 flex items-center gap-3">
              {imageUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={imageUrl} alt="" className="h-20 w-20 rounded-xl object-cover" />
              ) : (
                <div className="flex h-20 w-20 items-center justify-center rounded-xl border-2 border-dashed border-stone-200 text-stone-300 dark:border-stone-700 dark:text-stone-600">
                  <ImagePlus size={22} />
                </div>
              )}
              <label className="flex cursor-pointer items-center gap-1.5 rounded-xl border border-stone-200 bg-white px-3 py-2 text-sm font-medium text-stone-600 transition hover:bg-stone-50 dark:border-stone-700 dark:bg-stone-800 dark:text-stone-300 dark:hover:bg-stone-700">
                {isUploadingImage ? <Loader2 size={14} className="animate-spin" /> : <ImagePlus size={14} />}
                {isUploadingImage ? 'Uploader...' : imageUrl ? 'Skift billede' : 'Upload billede'}
                <input
                  type="file"
                  accept="image/*"
                  className="hidden"
                  disabled={isUploadingImage}
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) handleImageSelect(file);
                  }}
                />
              </label>
              {imageUrl && (
                <button type="button" onClick={() => setImageUrl(null)} className="text-xs font-medium text-stone-400 hover:text-red-500 dark:text-stone-500 dark:hover:text-red-400">
                  Fjern
                </button>
              )}
            </div>
          </div>

          <div className="mt-4 grid grid-cols-2 gap-4">
            <div>
              <label className="text-xs font-semibold text-stone-500 dark:text-stone-400">Navn</label>
              <input value={name} onChange={(e) => setName(e.target.value)}
                className="mt-1 w-full rounded-xl border border-stone-200 bg-white px-3 py-2 text-sm text-stone-900 outline-none focus:border-amber-400 focus:ring-4 focus:ring-amber-100 dark:border-stone-700 dark:bg-stone-800 dark:text-stone-100 dark:focus:ring-amber-900/30"
                placeholder="Fx Kylling i karry" />
            </div>
            <div>
              <label className="text-xs font-semibold text-stone-500 dark:text-stone-400">Måltid</label>
              <select value={mealType} onChange={(e) => setMealType(e.target.value as MealType)}
                className="mt-1 w-full rounded-xl border border-stone-200 bg-white px-3 py-2 text-sm text-stone-900 outline-none focus:border-amber-400 focus:ring-4 focus:ring-amber-100 dark:border-stone-700 dark:bg-stone-800 dark:text-stone-100 dark:focus:ring-amber-900/30">
                {MEAL_TYPES.map((m) => <option key={m} value={m}>{MEAL_LABELS[m]}</option>)}
              </select>
            </div>
          </div>

          <div className="mt-4">
            <label className="text-xs font-semibold text-stone-500 dark:text-stone-400">Ingredienser</label>
            <div className="mt-2 space-y-2">
              {ingredients.map((ing, i) => (
                <div key={i} className="flex gap-2">
                  <input value={ing.name} onChange={(e) => updateIngredient(i, 'name', e.target.value)}
                    placeholder="Ingrediens (fx Kyllingebryst)"
                    className="flex-1 rounded-xl border border-stone-200 bg-white px-3 py-2 text-sm text-stone-900 outline-none focus:border-amber-400 focus:ring-4 focus:ring-amber-100 dark:border-stone-700 dark:bg-stone-800 dark:text-stone-100 dark:focus:ring-amber-900/30" />
                  <input value={ing.amount} onChange={(e) => updateIngredient(i, 'amount', e.target.value)}
                    placeholder="Mængde (fx 400 g)"
                    className="w-40 rounded-xl border border-stone-200 bg-white px-3 py-2 text-sm text-stone-900 outline-none focus:border-amber-400 focus:ring-4 focus:ring-amber-100 dark:border-stone-700 dark:bg-stone-800 dark:text-stone-100 dark:focus:ring-amber-900/30" />
                  {ingredients.length > 1 && (
                    <button onClick={() => removeIngredientRow(i)}
                      className="rounded-xl border border-stone-200 px-3 text-red-500 transition hover:bg-red-50 dark:border-stone-700 dark:text-red-400 dark:hover:bg-red-500/10">
                      <X size={14} />
                    </button>
                  )}
                </div>
              ))}
            </div>
            <button onClick={addIngredientRow} className="mt-2 flex items-center gap-1 text-sm font-medium text-amber-600 hover:underline dark:text-amber-400">
              <Plus size={14} /> Tilføj ingrediens
            </button>
          </div>

          <div className="mt-4">
            <label className="text-xs font-semibold text-stone-500 dark:text-stone-400">Fremgangsmåde</label>
            <textarea value={instructions} onChange={(e) => setInstructions(e.target.value)} rows={4}
              className="mt-1 w-full rounded-xl border border-stone-200 bg-white px-3 py-2 text-sm text-stone-900 outline-none focus:border-amber-400 focus:ring-4 focus:ring-amber-100 dark:border-stone-700 dark:bg-stone-800 dark:text-stone-100 dark:focus:ring-amber-900/30"
              placeholder="Beskriv trinene..." />
          </div>

          <div className="mt-4 grid grid-cols-2 gap-4">
            <div>
              <label className="text-xs font-semibold text-stone-500 dark:text-stone-400">Tid (minutter)</label>
              <input type="number" value={minutes} onChange={(e) => setMinutes(e.target.value)}
                className="mt-1 w-full rounded-xl border border-stone-200 bg-white px-3 py-2 text-sm text-stone-900 outline-none focus:border-amber-400 focus:ring-4 focus:ring-amber-100 dark:border-stone-700 dark:bg-stone-800 dark:text-stone-100 dark:focus:ring-amber-900/30"
                placeholder="30" />
            </div>
            <div>
              <label className="text-xs font-semibold text-stone-500 dark:text-stone-400">Tags (kommasepareret)</label>
              <input value={tagsInput} onChange={(e) => setTagsInput(e.target.value)}
                className="mt-1 w-full rounded-xl border border-stone-200 bg-white px-3 py-2 text-sm text-stone-900 outline-none focus:border-amber-400 focus:ring-4 focus:ring-amber-100 dark:border-stone-700 dark:bg-stone-800 dark:text-stone-100 dark:focus:ring-amber-900/30"
                placeholder="hurtig, vegetar, familievenlig" />
            </div>
          </div>

          <div className="mt-4">
            <label className="text-xs font-semibold text-stone-500 dark:text-stone-400">Næringsindhold (valgfrit, per portion)</label>
            <div className="mt-1 grid grid-cols-4 gap-3">
              <input type="number" value={calories} onChange={(e) => setCalories(e.target.value)} placeholder="Kalorier"
                className="rounded-xl border border-stone-200 bg-white px-3 py-2 text-sm text-stone-900 outline-none focus:border-amber-400 focus:ring-4 focus:ring-amber-100 dark:border-stone-700 dark:bg-stone-800 dark:text-stone-100 dark:focus:ring-amber-900/30" />
              <input type="number" value={protein} onChange={(e) => setProtein(e.target.value)} placeholder="Protein (g)"
                className="rounded-xl border border-stone-200 bg-white px-3 py-2 text-sm text-stone-900 outline-none focus:border-amber-400 focus:ring-4 focus:ring-amber-100 dark:border-stone-700 dark:bg-stone-800 dark:text-stone-100 dark:focus:ring-amber-900/30" />
              <input type="number" value={carbs} onChange={(e) => setCarbs(e.target.value)} placeholder="Kulhydrat (g)"
                className="rounded-xl border border-stone-200 bg-white px-3 py-2 text-sm text-stone-900 outline-none focus:border-amber-400 focus:ring-4 focus:ring-amber-100 dark:border-stone-700 dark:bg-stone-800 dark:text-stone-100 dark:focus:ring-amber-900/30" />
              <input type="number" value={fat} onChange={(e) => setFat(e.target.value)} placeholder="Fedt (g)"
                className="rounded-xl border border-stone-200 bg-white px-3 py-2 text-sm text-stone-900 outline-none focus:border-amber-400 focus:ring-4 focus:ring-amber-100 dark:border-stone-700 dark:bg-stone-800 dark:text-stone-100 dark:focus:ring-amber-900/30" />
            </div>
          </div>

          <div className="mt-6 flex gap-2">
            <button onClick={handleSave} disabled={!canSave || isSaving}
              className="rounded-xl bg-stone-900 px-4 py-2 text-sm font-semibold text-white transition hover:bg-stone-800 disabled:opacity-40 dark:bg-amber-600 dark:hover:bg-amber-500">
              {isSaving ? 'Gemmer...' : editingId ? 'Gem ændringer' : 'Opret opskrift'}
            </button>
            <button onClick={resetForm} className="rounded-xl border border-stone-200 px-4 py-2 text-sm font-medium text-stone-600 hover:bg-stone-50 dark:border-stone-700 dark:text-stone-300 dark:hover:bg-stone-800">
              Annullér
            </button>
          </div>
        </div>
      )}

      {!showForm && (
        <div className="mt-6 flex gap-3">
          <div className="relative flex-1">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-stone-400" />
            <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Søg opskriftsnavn..."
              className="w-full rounded-xl border border-stone-200 bg-white py-2 pl-10 pr-3 text-sm text-stone-900 outline-none focus:border-amber-400 focus:ring-4 focus:ring-amber-100 dark:border-stone-700 dark:bg-stone-900 dark:text-stone-100 dark:focus:ring-amber-900/30" />
          </div>
          <select value={mealFilter} onChange={(e) => setMealFilter(e.target.value as MealType | 'all')}
            className="rounded-xl border border-stone-200 bg-white px-3 py-2 text-sm text-stone-900 outline-none focus:border-amber-400 focus:ring-4 focus:ring-amber-100 dark:border-stone-700 dark:bg-stone-900 dark:text-stone-100 dark:focus:ring-amber-900/30">
            <option value="all">Alle måltider</option>
            {MEAL_TYPES.map((m) => <option key={m} value={m}>{MEAL_LABELS[m]}</option>)}
          </select>
        </div>
      )}

      {!showForm && (
        <div className="mt-4 overflow-hidden rounded-2xl border border-stone-200 bg-white shadow-sm shadow-stone-900/5 dark:border-stone-800 dark:bg-stone-900">
          <table className="w-full text-sm">
            <thead className="border-b border-stone-100 bg-stone-50/50 text-left text-xs font-semibold text-stone-500 dark:border-stone-800 dark:bg-stone-800/50 dark:text-stone-400">
              <tr>
                <th className="px-5 py-3">Opskrift</th>
                <th className="px-5 py-3">Måltid</th>
                <th className="px-5 py-3">Ingredienser</th>
                <th className="px-5 py-3">Tid</th>
                <th className="px-5 py-3"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-stone-100 dark:divide-stone-800">
              {isLoading ? (
                <SkeletonRows columns={5} />
              ) : rows.length === 0 ? (
                <tr><td colSpan={5} className="px-5 py-8 text-center text-stone-400 dark:text-stone-500">Ingen opskrifter fundet.</td></tr>
              ) : (
                rows.map((row) => (
                  <tr key={row.id} className="transition hover:bg-stone-50/50 dark:hover:bg-stone-800/50">
                    <td className="px-5 py-3.5">
                      <div className="flex items-center gap-3">
                        {row.image_url ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img src={row.image_url} alt="" className="h-9 w-9 rounded-lg object-cover" />
                        ) : (
                          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-stone-100 text-stone-300 dark:bg-stone-800 dark:text-stone-600">
                            <ImagePlus size={14} />
                          </div>
                        )}
                        <span className="font-medium text-stone-900 dark:text-stone-100">{row.name}</span>
                      </div>
                    </td>
                    <td className="px-5 py-3.5">
                      <span className={`rounded-full px-2.5 py-1 text-xs font-semibold ${MEAL_COLORS[row.meal_type]}`}>
                        {MEAL_LABELS[row.meal_type]}
                      </span>
                    </td>
                    <td className="px-5 py-3.5 text-stone-500 dark:text-stone-400">{row.ingredients.length} ingredienser</td>
                    <td className="px-5 py-3.5 text-stone-500 dark:text-stone-400">
                      {row.minutes ? (
                        <span className="flex items-center gap-1"><Clock size={13} /> {row.minutes} min</span>
                      ) : '—'}
                    </td>
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
      )}

      {!showForm && totalPages > 1 && (
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