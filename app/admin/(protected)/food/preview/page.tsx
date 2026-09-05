'use client';

import { useEffect, useState, useCallback } from 'react';
import { ChefHat, AlertTriangle, ShoppingCart, RefreshCw } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import { useToast } from '@/components/toast-provider';
import { planWeek, WeekPlan } from '@/lib/mealPlanning/planWeek';
import { GlobalOffer, GlobalStandardPrice, Recipe } from '@/lib/mealPlanning/types';

const DAY_LABELS = ['Mandag', 'Tirsdag', 'Onsdag', 'Torsdag', 'Fredag', 'Lørdag', 'Søndag'];
const MEAL_LABELS = { breakfast: 'Morgenmad', lunch: 'Frokost', dinner: 'Aftensmad' } as const;

export default function MealPlanPreviewPage() {
  const supabase = createClient();
  const { showToast } = useToast();

  const [stores, setStores] = useState<string[]>([]);
  const [selectedStores, setSelectedStores] = useState<string[]>([]);
  const [budget, setBudget] = useState('600');
  const [isLoadingData, setIsLoadingData] = useState(true);
  const [isGenerating, setIsGenerating] = useState(false);
  const [plan, setPlan] = useState<WeekPlan | null>(null);

  const [recipes, setRecipes] = useState<Recipe[]>([]);
  const [offers, setOffers] = useState<GlobalOffer[]>([]);
  const [prices, setPrices] = useState<GlobalStandardPrice[]>([]);

  const fetchData = useCallback(async () => {
    setIsLoadingData(true);
    const [storesRes, recipesRes, offersRes, pricesRes] = await Promise.all([
      supabase.from('distinct_stores').select('store'),
      supabase.from('global_recipes').select('id, name, meal_type, ingredients').eq('published', true),
      supabase.from('global_offers').select('id, offer_price, valid_from, valid_to, standard_price:global_standard_prices(store, product:products(name))'),
      supabase.from('global_standard_prices').select('id, store, price, product:products(name)'),
    ]);

    if (storesRes.error || recipesRes.error || offersRes.error || pricesRes.error) {
      showToast('Kunne ikke hente data til forhåndsvisning.', 'error');
      setIsLoadingData(false);
      return;
    }

    const storeList = (storesRes.data ?? []).map((r) => r.store);
    setStores(storeList);
    setSelectedStores(storeList);

    setRecipes(
      (recipesRes.data ?? []).map((r) => ({
        id: r.id,
        name: r.name,
        mealType: r.meal_type,
        ingredients: r.ingredients,
      }))
    );
    const priceRows = (pricesRes.data as unknown as Array<{
      id: string;
      store: string;
      price: number;
      product: { name: string } | null;
    }>) ?? [];
    setPrices(
      priceRows.map((p) => ({
        id: p.id,
        productName: p.product?.name ?? '',
        store: p.store,
        price: p.price,
      }))
    );
    const offerRows = (offersRes.data as unknown as Array<{
      id: string;
      offer_price: number;
      valid_from: string;
      valid_to: string;
      standard_price: { store: string; product: { name: string } | null } | null;
    }>) ?? [];
    setOffers(
      offerRows
        .filter((o) => o.standard_price)
        .map((o) => ({
          id: o.id,
          productName: o.standard_price!.product?.name ?? '',
          store: o.standard_price!.store,
          offerPrice: o.offer_price,
          validFrom: o.valid_from,
          validTo: o.valid_to,
        }))
    );

    setIsLoadingData(false);
  }, [supabase, showToast]);

  useEffect(() => { fetchData(); }, [fetchData]);

  const toggleStore = (store: string) => {
    setSelectedStores((prev) => (prev.includes(store) ? prev.filter((s) => s !== store) : [...prev, store]));
  };

  const generate = () => {
    const budgetValue = parseFloat(budget);
    if (isNaN(budgetValue) || budgetValue <= 0) {
      showToast('Angiv et gyldigt budget.', 'error');
      return;
    }
    if (selectedStores.length === 0) {
      showToast('Vælg mindst én butik.', 'error');
      return;
    }
    setIsGenerating(true);
    // Kører synkront i browseren — samme algoritme som appen, ingen server-tur nødvendig.
    const result = planWeek(recipes, offers, prices, selectedStores, budgetValue);
    setPlan(result);
    setIsGenerating(false);
  };

  return (
    <div>
      <div className="flex items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-amber-500 to-amber-600">
          <ChefHat className="h-5 w-5 text-white" strokeWidth={2.2} />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-stone-900 dark:text-stone-100">Forhåndsvis madplan</h1>
          <p className="text-sm text-stone-500 dark:text-stone-400">
            Kør den rigtige madplan-algoritme på jeres nuværende data — se huller, før en bruger gør.
          </p>
        </div>
      </div>

      <div className="mt-6 rounded-2xl border border-stone-200 bg-white p-5 shadow-sm shadow-stone-900/5 dark:border-stone-800 dark:bg-stone-900">
        <div className="flex flex-wrap items-end gap-4">
          <div className="flex flex-col gap-1">
            <label className="text-xs font-semibold text-stone-500 dark:text-stone-400">Ugentligt budget (kr.)</label>
            <input
              type="number"
              value={budget}
              onChange={(e) => setBudget(e.target.value)}
              className="w-32 rounded-xl border border-stone-200 bg-white px-3 py-2 text-sm text-stone-900 outline-none focus:border-amber-400 focus:ring-4 focus:ring-amber-100 dark:border-stone-700 dark:bg-stone-800 dark:text-stone-100"
            />
          </div>

          <button
            onClick={generate}
            disabled={isLoadingData || isGenerating || recipes.length === 0}
            className="flex items-center gap-1.5 rounded-xl bg-stone-900 px-4 py-2 text-sm font-semibold text-white transition hover:bg-stone-800 disabled:opacity-40 dark:bg-amber-600 dark:hover:bg-amber-500"
          >
            <RefreshCw size={14} className={isGenerating ? 'animate-spin' : ''} />
            {isGenerating ? 'Genererer...' : 'Generér forhåndsvisning'}
          </button>
        </div>

        <div className="mt-4">
          <label className="text-xs font-semibold text-stone-500 dark:text-stone-400">Butikker med i planen</label>
          <div className="mt-2 flex flex-wrap gap-2">
            {isLoadingData ? (
              <span className="text-sm text-stone-400">Indlæser butikker...</span>
            ) : stores.length === 0 ? (
              <span className="text-sm text-stone-400">Ingen butikker fundet — tilføj priser først.</span>
            ) : (
              stores.map((store) => (
                <button
                  key={store}
                  onClick={() => toggleStore(store)}
                  className={`rounded-full px-3 py-1.5 text-xs font-semibold transition ${
                    selectedStores.includes(store)
                      ? 'bg-amber-600 text-white'
                      : 'border border-stone-200 bg-white text-stone-600 hover:bg-stone-50 dark:border-stone-700 dark:bg-stone-800 dark:text-stone-300'
                  }`}
                >
                  {store}
                </button>
              ))
            )}
          </div>
        </div>

        {!isLoadingData && recipes.length === 0 && (
          <p className="mt-4 text-sm text-amber-600 dark:text-amber-400">
            Ingen opskrifter fundet — tilføj opskrifter under Opskrifter, før I kan forhåndsvise en plan.
          </p>
        )}
      </div>

      {plan && (
        <>
          {plan.emptySlotCount > 0 && (
            <div className="mt-6 flex items-start gap-3 rounded-2xl border border-amber-200 bg-amber-50 p-4 dark:border-amber-500/20 dark:bg-amber-500/10">
              <AlertTriangle size={18} className="mt-0.5 shrink-0 text-amber-600 dark:text-amber-400" />
              <div>
                <p className="text-sm font-semibold text-amber-800 dark:text-amber-300">
                  {plan.emptySlotCount} {plan.emptySlotCount === 1 ? 'måltid kunne' : 'måltider kunne'} ikke udfyldes
                </p>
                <p className="mt-0.5 text-sm text-amber-700 dark:text-amber-400/80">
                  Enten mangler I opskrifter til den type måltid, eller ingredienserne er for dyre/mangler priser i de valgte butikker inden for budgettet.
                </p>
              </div>
            </div>
          )}

          <div className="mt-6 grid grid-cols-1 gap-4 lg:grid-cols-7">
            {DAY_LABELS.map((label, day) => (
              <div key={day} className="rounded-2xl border border-stone-200 bg-white p-3 shadow-sm shadow-stone-900/5 dark:border-stone-800 dark:bg-stone-900">
                <p className="text-xs font-bold uppercase tracking-wide text-stone-400">{label}</p>
                <div className="mt-2 flex flex-col gap-2">
                  {plan.slots.filter((s) => s.day === day).map((slot) => (
                    <div key={slot.mealType} className="rounded-xl bg-stone-50 p-2 dark:bg-stone-800/60">
                      <p className="text-[10px] font-semibold uppercase text-stone-400">{MEAL_LABELS[slot.mealType]}</p>
                      {slot.recipe ? (
                        <p className="text-xs font-medium text-stone-800 dark:text-stone-200">{slot.recipe.name}</p>
                      ) : (
                        <p className="text-xs italic text-rose-500 dark:text-rose-400">Intet fundet</p>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>

          <div className="mt-6 rounded-2xl border border-stone-200 bg-white p-5 shadow-sm shadow-stone-900/5 dark:border-stone-800 dark:bg-stone-900">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <ShoppingCart size={16} className="text-stone-500 dark:text-stone-400" />
                <h2 className="text-sm font-bold text-stone-900 dark:text-stone-100">Indkøbsliste</h2>
              </div>
              <p className="text-sm font-semibold text-stone-900 dark:text-stone-100">
                {plan.totalPrice.toFixed(2)} kr. <span className="font-normal text-stone-400">/ {parseFloat(budget).toFixed(2)} kr.</span>
              </p>
            </div>

            <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2">
              {plan.storeTotals.map((st) => (
                <div key={st.store} className="rounded-xl border border-stone-100 p-3 dark:border-stone-800">
                  <div className="flex items-center justify-between">
                    <p className="text-sm font-semibold text-stone-800 dark:text-stone-200">{st.store}</p>
                    <p className="text-sm text-stone-500 dark:text-stone-400">{st.total.toFixed(2)} kr.</p>
                  </div>
                  <ul className="mt-2 flex flex-col gap-1">
                    {st.items.map((item) => (
                      <li key={item.ingredientName} className="flex justify-between text-xs text-stone-500 dark:text-stone-400">
                        <span>{item.ingredientName}</span>
                        <span>{item.price !== null ? `${item.price.toFixed(2)} kr.` : '—'}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>

            {plan.shoppingList.some((i) => i.source === 'unknown') && (
              <p className="mt-4 text-xs text-stone-400">
                Ingredienser uden fundet pris tæller ikke med i totalen, men er stadig med i planen — det er dem, der mangler standardpriser.
              </p>
            )}
          </div>
        </>
      )}
    </div>
  );
}
