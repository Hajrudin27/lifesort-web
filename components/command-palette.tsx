'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  Search, LayoutDashboard, Tag, BookOpen, Percent, Inbox, Users,
  Milestone, Activity, ShieldCheck, CornerDownLeft, ChefHat, HeartPulse, Loader2, DatabaseBackup, Copy, Rocket,
  ClipboardCheck, MailCheck,
} from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import { useDebouncedValue } from '@/hooks/useDebouncedValue';
import { canAccessPath, type AdminRole } from '@/lib/admin-roles';
import { orIlikeFilter } from '@/lib/postgrest';

type PaletteItem = {
  label: string;
  description: string;
  href: string;
  icon: typeof Tag;
  keywords: string[];
  category: 'Side' | 'Handling';
};

type ContentResult = {
  label: string;
  description: string;
  href: string;
  icon: typeof Tag;
  category: 'Mad' | 'Support';
};

type PriceSearchRow = {
  id: string;
  name: string;
  prices: { id: string; store: string; price: number }[];
};

const QUICK_ACTIONS: PaletteItem[] = [
  { label: 'Svar på supportsag', description: 'Åbn supportindbakken og håndter åbne beskeder', href: '/admin/tickets', icon: MailCheck, keywords: ['svar', 'reply', 'support', 'kunde', 'mail'], category: 'Handling' },
  { label: 'Tjek launch-status', description: 'Gå direkte til launchlisten før go-live', href: '/admin/launch', icon: ClipboardCheck, keywords: ['launch', 'klar', 'go-live', 'check'], category: 'Handling' },
  { label: 'Kør sundhedstjek', description: 'Kontrollér miljø, database, storage og automatik', href: '/admin/settings/health', icon: HeartPulse, keywords: ['health', 'sundhed', 'env', 'cron', 'retention'], category: 'Handling' },
  { label: 'Eksportér data', description: 'Hent JSON/CSV backup af admin-data', href: '/admin/settings/export', icon: DatabaseBackup, keywords: ['backup', 'eksport', 'csv', 'json'], category: 'Handling' },
  { label: 'Gennemgå venteliste', description: 'Se og bekræft tilmeldinger før launch', href: '/admin/waitlist', icon: Users, keywords: ['venteliste', 'bekræft', 'launch', 'email'], category: 'Handling' },
];

const ITEMS: PaletteItem[] = [
  { label: 'Oversigt', description: 'Dashboard med nøgletal og prioriteringer', href: '/admin/dashboard', icon: LayoutDashboard, keywords: ['dashboard', 'hjem', 'oversigt', 'mission control'], category: 'Side' },
  { label: 'Launch', description: 'Klarhedstjek før lancering', href: '/admin/launch', icon: Rocket, keywords: ['launch', 'lancering', 'klar', 'checkliste', 'go-live'], category: 'Side' },
  { label: 'Tidslinje', description: 'Projekt-deadlines og milepæle', href: '/admin/timeline', icon: Milestone, keywords: ['deadline', 'milepæl', 'roadmap', 'plan'], category: 'Side' },
  { label: 'Aktivitet', description: 'Audit-center over ændringer i panelet', href: '/admin/activity', icon: Activity, keywords: ['log', 'historik', 'aktivitetslog', 'audit', 'hvem gjorde hvad'], category: 'Side' },
  { label: 'Admins', description: 'Hvem har adgang til panelet', href: '/admin/admins', icon: ShieldCheck, keywords: ['brugere', 'adgang', 'inviter', 'rolle', 'owner'], category: 'Side' },
  { label: 'Sundhedstjek', description: 'Er miljøvariabler og Supabase sat rigtigt op?', href: '/admin/settings/health', icon: Activity, keywords: ['miljø', 'env', 'sundhed', 'system', 'cron', 'retention', 'resend'], category: 'Side' },
  { label: 'Eksportér data', description: 'Download admin-styret indhold som JSON eller CSV', href: '/admin/settings/export', icon: DatabaseBackup, keywords: ['backup', 'eksport', 'json', 'csv', 'export'], category: 'Side' },
  { label: 'Standardpriser', description: 'Priser på tværs af butikker', href: '/admin/food/prices', icon: Tag, keywords: ['pris', 'produkt', 'butik', 'mad', 'vare'], category: 'Side' },
  { label: 'Dublet-tjek', description: 'Find mulige dubletter i prislisten', href: '/admin/food/duplicates', icon: Copy, keywords: ['dublet', 'duplicate', 'dobbelt', 'pris', 'ryd op'], category: 'Side' },
  { label: 'Ugens tilbud', description: 'Aktive og kommende tilbud', href: '/admin/food/offers', icon: Percent, keywords: ['tilbud', 'rabat', 'mad', 'kampagne'], category: 'Side' },
  { label: 'Opskrifter', description: 'Madplanens opskriftsbibliotek', href: '/admin/food/recipes', icon: BookOpen, keywords: ['opskrift', 'mad', 'ingrediens', 'meal'], category: 'Side' },
  { label: 'Forhåndsvis madplan', description: 'Test madplan-algoritmen på jeres data', href: '/admin/food/preview', icon: ChefHat, keywords: ['madplan', 'preview', 'test', 'algoritme'], category: 'Side' },
  { label: 'Sundhedstilstande', description: 'Cyklus-appens sundhedsinfo om tilstande', href: '/admin/health/conditions', icon: HeartPulse, keywords: ['sundhed', 'cyklus', 'tilstand', 'health'], category: 'Side' },
  { label: 'Symptomordbog', description: 'Cyklus-appens symptombeskrivelser', href: '/admin/health/symptoms', icon: HeartPulse, keywords: ['symptom', 'cyklus', 'sundhed', 'health'], category: 'Side' },
  { label: 'Supportsager', description: 'Indkomne beskeder fra brugere', href: '/admin/tickets', icon: Inbox, keywords: ['support', 'besked', 'sag', 'kontakt', 'kunde'], category: 'Side' },
  { label: 'Venteliste', description: 'Tilmeldte til lanceringen', href: '/admin/waitlist', icon: Users, keywords: ['venteliste', 'tilmelding', 'email', 'ios', 'android'], category: 'Side' },
];

const CATEGORY_STYLE: Record<PaletteItem['category'] | ContentResult['category'], string> = {
  Side: 'bg-stone-100 text-stone-600 dark:bg-stone-800 dark:text-stone-300',
  Handling: 'bg-sky-100 text-sky-700 dark:bg-sky-500/15 dark:text-sky-400',
  Mad: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-400',
  Support: 'bg-rose-100 text-rose-700 dark:bg-rose-500/15 dark:text-rose-400',
};

export function CommandPalette({ role }: { role: AdminRole }) {
  const router = useRouter();
  const supabase = useMemo(() => createClient(), []);
  const [isOpen, setIsOpen] = useState(false);
  const [query, setQuery] = useState('');
  const debouncedQuery = useDebouncedValue(query, 250);
  const [activeIndex, setActiveIndex] = useState(0);
  const [contentResults, setContentResults] = useState<ContentResult[]>([]);
  const [isSearchingContent, setIsSearchingContent] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  // Paletten er en genvej til sider — den skal ikke tilbyde dem rollen ikke må åbne.
  const visibleItems = useMemo(
    () => [...QUICK_ACTIONS, ...ITEMS].filter((item) => canAccessPath(role, item.href)),
    [role]
  );
  const canSearchFood = canAccessPath(role, '/admin/food/prices');
  const canSearchSupport = canAccessPath(role, '/admin/tickets');

  const filteredPages = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return visibleItems.slice(0, 8);
    return visibleItems
      .map((item) => {
        const label = item.label.toLowerCase();
        const description = item.description.toLowerCase();
        const keywordHit = item.keywords.some((k) => k.includes(q));
        const score = label === q ? 0 : label.startsWith(q) ? 1 : label.includes(q) ? 2 : keywordHit ? 3 : description.includes(q) ? 4 : 99;
        return { item, score };
      })
      .filter((entry) => entry.score < 99)
      .sort((a, b) => a.score - b.score || a.item.label.localeCompare(b.item.label, 'da-DK'))
      .map((entry) => entry.item);
  }, [query, visibleItems]);

  // Søger på tværs af det faktiske indhold (priser, opskrifter, supportsager) — ikke kun
  // sidenavne — når man har skrevet nok til, at det giver mening.
  useEffect(() => {
    let cancelled = false;

    queueMicrotask(() => {
      const q = debouncedQuery.trim();
      if (cancelled) return;
      if (q.length < 2) {
        setContentResults([]);
        setIsSearchingContent(false);
        return;
      }

      setIsSearchingContent(true);

      (async () => {
        const searches: Promise<ContentResult[]>[] = [];

        if (canSearchFood) {
          searches.push(
            (async () => {
              const pricesRes = await supabase
                .from('products')
                .select('id, name, prices:global_standard_prices(id, store, price)')
                .ilike('name', `%${q}%`)
                .limit(4);

              return ((pricesRes.data ?? []) as PriceSearchRow[]).map((p) => {
                const stores = p.prices.map((price) => price.store);
                const lowestPrice = p.prices.reduce<number | null>(
                  (lowest, price) => (lowest === null || price.price < lowest ? price.price : lowest),
                  null
                );

                return {
                  label: p.name,
                  description: lowestPrice === null
                    ? 'Vare uden standardpris'
                    : `Standardpris · ${stores.slice(0, 2).join(', ')}${stores.length > 2 ? ` +${stores.length - 2}` : ''} · fra ${lowestPrice.toFixed(2)} kr.`,
                  href: '/admin/food/prices',
                  icon: Tag,
                  category: 'Mad' as const,
                };
              });
            })()
          );

          searches.push(
            (async () => {
              const recipesRes = await supabase
                .from('global_recipes')
                .select('id, name')
                .ilike('name', `%${q}%`)
                .limit(4);

              return (recipesRes.data ?? []).map((r) => ({
                  label: r.name,
                  description: 'Opskrift',
                  href: '/admin/food/recipes',
                  icon: BookOpen,
                  category: 'Mad' as const,
              }));
            })()
          );
        }

        if (canSearchSupport) {
          searches.push(
            (async () => {
              const ticketsRes = await supabase
                .from('support_tickets')
                .select('id, subject, name, status')
                .or(orIlikeFilter(['subject', 'name', 'email'], q))
                .limit(5);

              return (ticketsRes.data ?? []).map((t) => ({
                  label: t.subject,
                  description: `Supportsag · ${t.name} · ${t.status}`,
                  href: '/admin/tickets',
                  icon: Inbox,
                  category: 'Support' as const,
              }));
            })()
          );
        }

        const results = (await Promise.all(searches)).flat();
        if (cancelled) return;

        setContentResults(results);
        setIsSearchingContent(false);
      })();
    });

    return () => { cancelled = true; };
  }, [canSearchFood, canSearchSupport, debouncedQuery, supabase]);

  // Én flad liste til tastatur-navigation, men vist i to grupper.
  const combined = useMemo(
    () => [
      ...filteredPages.map((item) => ({ ...item, kind: 'page' as const })),
      ...contentResults.map((item) => ({ ...item, kind: 'content' as const })),
    ],
    [filteredPages, contentResults]
  );

  const selectedIndex = Math.min(activeIndex, Math.max(0, combined.length - 1));

  const close = () => {
    setIsOpen(false);
    setQuery('');
    setActiveIndex(0);
    setContentResults([]);
  };

  const navigateTo = (href: string) => {
    router.push(href);
    close();
  };

  useEffect(() => {
    function handleGlobalKeyDown(e: KeyboardEvent) {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        setIsOpen((prev) => !prev);
      }
      if (e.key === 'Escape') close();
    }
    window.addEventListener('keydown', handleGlobalKeyDown);
    return () => window.removeEventListener('keydown', handleGlobalKeyDown);
  }, []);

  useEffect(() => {
    if (isOpen) setTimeout(() => inputRef.current?.focus(), 10);
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[200] overflow-y-auto bg-stone-900/40 backdrop-blur-sm" onClick={close}>
      <div className="flex min-h-full items-start justify-center p-4 pt-[15vh]">
        <div
          className="w-full max-w-2xl overflow-hidden rounded-2xl bg-white shadow-2xl dark:bg-stone-900"
          onClick={(e) => e.stopPropagation()}
        >
          <div className="flex items-center gap-3 border-b border-stone-100 px-4 py-3 dark:border-stone-800">
            <Search size={16} className="text-stone-400" />
            <input
              ref={inputRef}
              value={query}
              onChange={(e) => {
                setQuery(e.target.value);
                setActiveIndex(0);
              }}
              placeholder="Søg sider, handlinger, priser, opskrifter, supportsager..."
              className="flex-1 bg-transparent text-sm text-stone-900 outline-none placeholder:text-stone-400 dark:text-stone-100"
              onKeyDown={(e) => {
                if (e.key === 'ArrowDown') {
                  e.preventDefault();
                  setActiveIndex((i) => Math.min(i + 1, Math.max(0, combined.length - 1)));
                } else if (e.key === 'ArrowUp') {
                  e.preventDefault();
                  setActiveIndex((i) => Math.max(i - 1, 0));
                } else if (e.key === 'Enter' && combined[selectedIndex]) {
                  navigateTo(combined[selectedIndex].href);
                }
              }}
            />
            {isSearchingContent && <Loader2 size={14} className="animate-spin text-stone-300" />}
            <kbd className="rounded border border-stone-200 px-1.5 py-0.5 text-[10px] font-medium text-stone-400 dark:border-stone-700">
              Esc
            </kbd>
          </div>

          <div className="max-h-96 overflow-y-auto p-2">
            {combined.length === 0 ? (
              <div className="px-3 py-10 text-center">
                <div className="mx-auto flex h-11 w-11 items-center justify-center rounded-full bg-stone-100 dark:bg-stone-800">
                  <Search size={18} className="text-stone-400" />
                </div>
                <p className="mt-3 text-sm font-semibold text-stone-600 dark:text-stone-300">Intet fundet</p>
                <p className="mt-1 text-xs text-stone-400">Prøv fx support, launch, audit, opskrift eller en vare.</p>
              </div>
            ) : (
              <>
                {filteredPages.length > 0 && (
                  <p className="px-3 pb-1 pt-2 text-[10px] font-bold uppercase tracking-wider text-stone-400">Genveje og sider</p>
                )}
                {filteredPages.map((item, i) => {
                  const Icon = item.icon;
                  const isActive = i === selectedIndex;
                  return (
                    <button
                      key={`${item.category}-${item.href}-${item.label}`}
                      onClick={() => navigateTo(item.href)}
                      onMouseEnter={() => setActiveIndex(i)}
                      className={`flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left transition ${
                        isActive ? 'bg-stone-100 dark:bg-stone-800' : ''
                      }`}
                    >
                      <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-stone-100 dark:bg-stone-800">
                        <Icon size={15} className="text-stone-600 dark:text-stone-300" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="flex min-w-0 items-center gap-2">
                          <p className="truncate text-sm font-medium text-stone-900 dark:text-stone-100">{item.label}</p>
                          <span className={`shrink-0 rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide ${CATEGORY_STYLE[item.category]}`}>
                            {item.category}
                          </span>
                        </div>
                        <p className="truncate text-xs text-stone-400">{item.description}</p>
                      </div>
                      {isActive && <CornerDownLeft size={14} className="text-stone-400" />}
                    </button>
                  );
                })}

                {contentResults.length > 0 && (
                  <p className="px-3 pb-1 pt-3 text-[10px] font-bold uppercase tracking-wider text-stone-400">Indhold</p>
                )}
                {contentResults.map((item, ci) => {
                  const i = filteredPages.length + ci;
                  const Icon = item.icon;
                  const isActive = i === selectedIndex;
                  return (
                    <button
                      key={`${item.href}-${item.label}-${ci}`}
                      onClick={() => navigateTo(item.href)}
                      onMouseEnter={() => setActiveIndex(i)}
                      className={`flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left transition ${
                        isActive ? 'bg-stone-100 dark:bg-stone-800' : ''
                      }`}
                    >
                      <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-rose-50 dark:bg-rose-500/10">
                        <Icon size={15} className="text-rose-600 dark:text-rose-400" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="flex min-w-0 items-center gap-2">
                          <p className="truncate text-sm font-medium text-stone-900 dark:text-stone-100">{item.label}</p>
                          <span className={`shrink-0 rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide ${CATEGORY_STYLE[item.category]}`}>
                            {item.category}
                          </span>
                        </div>
                        <p className="truncate text-xs text-stone-400">{item.description}</p>
                      </div>
                      {isActive && <CornerDownLeft size={14} className="text-stone-400" />}
                    </button>
                  );
                })}
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
