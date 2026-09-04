'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  Search, LayoutDashboard, Tag, BookOpen, Percent, Inbox, Users,
  Milestone, Activity, ShieldCheck, CornerDownLeft, ChefHat, HeartPulse,
} from 'lucide-react';

type PaletteItem = {
  label: string;
  description: string;
  href: string;
  icon: typeof Tag;
  keywords: string[];
};

const ITEMS: PaletteItem[] = [
  { label: 'Oversigt', description: 'Dashboard med nøgletal', href: '/admin/dashboard', icon: LayoutDashboard, keywords: ['dashboard', 'hjem', 'oversigt'] },
  { label: 'Tidslinje', description: 'Projekt-deadlines og milepæle', href: '/admin/timeline', icon: Milestone, keywords: ['deadline', 'milepæl', 'roadmap'] },
  { label: 'Aktivitet', description: 'Log over ændringer i panelet', href: '/admin/activity', icon: Activity, keywords: ['log', 'historik', 'aktivitetslog'] },
  { label: 'Admins', description: 'Hvem har adgang til panelet', href: '/admin/admins', icon: ShieldCheck, keywords: ['brugere', 'adgang', 'inviter'] },
  { label: 'Standardpriser', description: 'Priser på tværs af butikker', href: '/admin/food/prices', icon: Tag, keywords: ['pris', 'produkt', 'butik', 'mad'] },
  { label: 'Ugens tilbud', description: 'Aktive og kommende tilbud', href: '/admin/food/offers', icon: Percent, keywords: ['tilbud', 'rabat', 'mad'] },
  { label: 'Opskrifter', description: 'Madplanens opskriftsbibliotek', href: '/admin/food/recipes', icon: BookOpen, keywords: ['opskrift', 'mad', 'ingrediens'] },
  { label: 'Forhåndsvis madplan', description: 'Test madplan-algoritmen på jeres data', href: '/admin/food/preview', icon: ChefHat, keywords: ['madplan', 'preview', 'test', 'algoritme'] },
  { label: 'Sundhedstilstande', description: 'Cyklus-appens sundhedsinfo om tilstande', href: '/admin/health/conditions', icon: HeartPulse, keywords: ['sundhed', 'cyklus', 'tilstand', 'health'] },
  { label: 'Symptomordbog', description: 'Cyklus-appens symptombeskrivelser', href: '/admin/health/symptoms', icon: HeartPulse, keywords: ['symptom', 'cyklus', 'sundhed', 'health'] },
  { label: 'Supportsager', description: 'Indkomne beskeder fra brugere', href: '/admin/tickets', icon: Inbox, keywords: ['support', 'besked', 'sag', 'kontakt'] },
  { label: 'Venteliste', description: 'Tilmeldte til lanceringen', href: '/admin/waitlist', icon: Users, keywords: ['venteliste', 'tilmelding', 'email'] },
];

export function CommandPalette() {
  const router = useRouter();
  const [isOpen, setIsOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [activeIndex, setActiveIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return ITEMS;
    return ITEMS.filter(
      (item) =>
        item.label.toLowerCase().includes(q) ||
        item.description.toLowerCase().includes(q) ||
        item.keywords.some((k) => k.includes(q))
    );
  }, [query]);

  const close = () => {
    setIsOpen(false);
    setQuery('');
    setActiveIndex(0);
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

  useEffect(() => {
    setActiveIndex(0);
  }, [query]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[200] overflow-y-auto bg-stone-900/40 backdrop-blur-sm" onClick={close}>
      <div className="flex min-h-full items-start justify-center p-4 pt-[15vh]">
        <div
          className="w-full max-w-lg overflow-hidden rounded-2xl bg-white shadow-2xl dark:bg-stone-900"
          onClick={(e) => e.stopPropagation()}
        >
          <div className="flex items-center gap-3 border-b border-stone-100 px-4 py-3 dark:border-stone-800">
            <Search size={16} className="text-stone-400" />
            <input
              ref={inputRef}
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Spring til en sektion..."
              className="flex-1 bg-transparent text-sm text-stone-900 outline-none placeholder:text-stone-400 dark:text-stone-100"
              onKeyDown={(e) => {
                if (e.key === 'ArrowDown') {
                  e.preventDefault();
                  setActiveIndex((i) => Math.min(i + 1, filtered.length - 1));
                } else if (e.key === 'ArrowUp') {
                  e.preventDefault();
                  setActiveIndex((i) => Math.max(i - 1, 0));
                } else if (e.key === 'Enter' && filtered[activeIndex]) {
                  navigateTo(filtered[activeIndex].href);
                }
              }}
            />
            <kbd className="rounded border border-stone-200 px-1.5 py-0.5 text-[10px] font-medium text-stone-400 dark:border-stone-700">
              Esc
            </kbd>
          </div>

          <div className="max-h-80 overflow-y-auto p-2">
            {filtered.length === 0 ? (
              <p className="px-3 py-6 text-center text-sm text-stone-400">Intet fundet.</p>
            ) : (
              filtered.map((item, i) => {
                const Icon = item.icon;
                const isActive = i === activeIndex;
                return (
                  <button
                    key={item.href}
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
                      <p className="text-sm font-medium text-stone-900 dark:text-stone-100">{item.label}</p>
                      <p className="truncate text-xs text-stone-400">{item.description}</p>
                    </div>
                    {isActive && <CornerDownLeft size={14} className="text-stone-400" />}
                  </button>
                );
              })
            )}
          </div>
        </div>
      </div>
    </div>
  );
}