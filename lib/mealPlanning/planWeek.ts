import { findBestGlobalPrice } from './priceLookup';
import { GlobalOffer, GlobalStandardPrice, MealType, Recipe } from './types';

const MEAL_SLOTS: MealType[] = ['breakfast', 'lunch', 'dinner'];
const MAX_REPEATS = 3;

export interface PlannedSlot {
  day: number;
  mealType: MealType;
  recipe: Recipe | null;
}

export interface ShoppingListEntry {
  ingredientName: string;
  price: number | null;
  store: string | null;
  source: 'offer' | 'standard' | 'unknown';
}

export interface StoreTotal {
  store: string;
  total: number;
  items: ShoppingListEntry[];
}

export interface WeekPlan {
  slots: PlannedSlot[];
  shoppingList: ShoppingListEntry[];
  storeTotals: StoreTotal[];
  totalPrice: number;
  emptySlotCount: number;
}

function normalize(text: string): string {
  return text.trim().toLowerCase();
}

function marginalPrice(
  recipe: Recipe,
  purchased: Map<string, ShoppingListEntry>,
  globalOffers: GlobalOffer[],
  globalStandardPrices: GlobalStandardPrice[],
  selectedStores: string[]
): number {
  let total = 0;
  for (const ing of recipe.ingredients) {
    const key = normalize(ing.name);
    if (purchased.has(key)) continue;
    const match = findBestGlobalPrice(ing.name, globalOffers, globalStandardPrices, selectedStores);
    if (match) total += match.price;
  }
  return total;
}

function recordIngredients(
  recipe: Recipe,
  purchased: Map<string, ShoppingListEntry>,
  globalOffers: GlobalOffer[],
  globalStandardPrices: GlobalStandardPrice[],
  selectedStores: string[]
) {
  for (const ing of recipe.ingredients) {
    const key = normalize(ing.name);
    if (purchased.has(key)) continue;

    const match = findBestGlobalPrice(ing.name, globalOffers, globalStandardPrices, selectedStores);
    purchased.set(key, {
      ingredientName: ing.name,
      price: match?.price ?? null,
      store: match?.store ?? null,
      source: match?.source ?? 'unknown',
    });
  }
}

export function groupShoppingListByStore(list: ShoppingListEntry[]): StoreTotal[] {
  const byStore = new Map<string, ShoppingListEntry[]>();
  for (const entry of list) {
    if (!entry.store) continue;
    const arr = byStore.get(entry.store) ?? [];
    arr.push(entry);
    byStore.set(entry.store, arr);
  }
  return Array.from(byStore.entries()).map(([store, items]) => ({
    store,
    total: items.reduce((sum, i) => sum + (i.price ?? 0), 0),
    items,
  }));
}

/**
 * Portering af app'ens planWeek-algoritme til admin's diagnostiske forhåndsvisning.
 * Samme kernelogik som appen bruger til rigtige brugere (budget-begrænsning,
 * MAX_REPEATS, butiksmatchning) — uden pantry/låste-slots, som er brugerspecifikke
 * og ikke giver mening i en generel forhåndsvisning.
 */
export function planWeek(
  recipes: Recipe[],
  globalOffers: GlobalOffer[],
  globalStandardPrices: GlobalStandardPrice[],
  selectedStores: string[],
  weeklyBudget: number
): WeekPlan {
  const purchased = new Map<string, ShoppingListEntry>();
  const usageCount = new Map<string, number>();
  const slots: PlannedSlot[] = [];
  let runningTotal = 0;

  for (let day = 0; day < 7; day++) {
    for (const mealType of MEAL_SLOTS) {
      const candidates = recipes.filter(
        (r) => r.mealType === mealType && (usageCount.get(r.id) ?? 0) < MAX_REPEATS
      );

      let best: { recipe: Recipe; cost: number } | null = null;
      for (const candidate of candidates) {
        const cost = marginalPrice(candidate, purchased, globalOffers, globalStandardPrices, selectedStores);
        if (runningTotal + cost > weeklyBudget) continue;
        if (!best || cost < best.cost) best = { recipe: candidate, cost };
      }

      if (best) {
        runningTotal += best.cost;
        usageCount.set(best.recipe.id, (usageCount.get(best.recipe.id) ?? 0) + 1);
        recordIngredients(best.recipe, purchased, globalOffers, globalStandardPrices, selectedStores);
        slots.push({ day, mealType, recipe: best.recipe });
      } else {
        slots.push({ day, mealType, recipe: null });
      }
    }
  }

  const shoppingList = Array.from(purchased.values());

  return {
    slots,
    shoppingList,
    storeTotals: groupShoppingListByStore(shoppingList),
    totalPrice: runningTotal,
    emptySlotCount: slots.filter((s) => !s.recipe).length,
  };
}