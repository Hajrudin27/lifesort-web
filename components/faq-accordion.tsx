'use client';

import Link from 'next/link';
import { useMemo, useState } from 'react';
import {
  ArrowRight, ChevronDown, LifeBuoy, Mail, Puzzle, Search, Shield, Sparkles, X,
} from 'lucide-react';

import { faqs, type FaqCategory as Category } from '@/lib/modules-content';

type SupportCategory = 'general' | 'bug' | 'billing' | 'feature' | 'account';

const CATEGORY_META: Record<Category, { label: string; icon: typeof Sparkles; tint: string; supportCategory: SupportCategory }> = {
  generelt: { label: 'Generelt', icon: Sparkles, tint: 'bg-rose-100 text-rose-600', supportCategory: 'general' },
  moduler: { label: 'Moduler & funktioner', icon: Puzzle, tint: 'bg-amber-100 text-amber-600', supportCategory: 'feature' },
  konto: { label: 'Konto & data', icon: Shield, tint: 'bg-emerald-100 text-emerald-600', supportCategory: 'account' },
  venteliste: { label: 'Venteliste & lancering', icon: Mail, tint: 'bg-violet-100 text-violet-600', supportCategory: 'general' },
};

const QUICK_SEARCHES = ['pris', 'madplan', 'data', 'venteliste', 'konto'];

function resultText(count: number, query: string) {
  if (query.trim().length > 0) return count === 1 ? '1 match' : `${count} matches`;
  return count === 1 ? '1 spørgsmål' : `${count} spørgsmål`;
}

export function FaqAccordion() {
  const [query, setQuery] = useState('');
  const [activeCategory, setActiveCategory] = useState<Category | 'all'>('all');
  const [openQuestion, setOpenQuestion] = useState<string | null>(faqs[0].question);

  const categoryCounts = useMemo(() => (
    Object.fromEntries(
      (Object.keys(CATEGORY_META) as Category[]).map((cat) => [
        cat,
        faqs.filter((faq) => faq.category === cat).length,
      ])
    ) as Record<Category, number>
  ), []);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return faqs.filter((f) => {
      const matchesCategory = activeCategory === 'all' || f.category === activeCategory;
      const searchable = `${f.question} ${f.answer} ${f.moduleSlug ?? ''}`.toLowerCase();
      const matchesQuery = !q || searchable.includes(q);
      return matchesCategory && matchesQuery;
    });
  }, [query, activeCategory]);

  const effectiveOpenQuestion = filtered.some((faq) => faq.question === openQuestion)
    ? openQuestion
    : filtered[0]?.question ?? null;
  const supportCategory = activeCategory === 'all' ? 'general' : CATEGORY_META[activeCategory].supportCategory;

  return (
    <div>
      <div className="relative">
        <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-stone-400" />
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Søg i spørgsmål og svar..."
          className="w-full rounded-2xl border border-stone-200 bg-white py-3.5 pl-11 pr-12 text-sm text-stone-900 shadow-sm shadow-stone-900/5 outline-none focus:border-rose-400 focus:ring-4 focus:ring-rose-100"
        />
        {query && (
          <button
            type="button"
            onClick={() => setQuery('')}
            className="absolute right-3 top-1/2 flex h-8 w-8 -translate-y-1/2 items-center justify-center rounded-full text-stone-400 transition hover:bg-stone-100 hover:text-stone-700"
            aria-label="Ryd søgning"
          >
            <X size={15} />
          </button>
        )}
      </div>

      <div className="mt-3 flex flex-wrap items-center gap-2">
        <span className="text-xs font-medium text-stone-400">Populært:</span>
        {QUICK_SEARCHES.map((term) => (
          <button
            key={term}
            type="button"
            onClick={() => setQuery(term)}
            className="rounded-full border border-stone-200 bg-white px-3 py-1.5 text-xs font-semibold text-stone-600 transition hover:bg-stone-50"
          >
            {term}
          </button>
        ))}
      </div>

      <div className="mt-4 flex flex-wrap gap-2">
        <button
          onClick={() => setActiveCategory('all')}
          className={`rounded-full px-4 py-2 text-xs font-semibold transition ${
            activeCategory === 'all' ? 'bg-stone-900 text-white' : 'border border-stone-200 bg-white text-stone-600 hover:bg-stone-50'
          }`}
        >
          Alle <span className="opacity-70">{faqs.length}</span>
        </button>
        {(Object.keys(CATEGORY_META) as Category[]).map((cat) => {
          const meta = CATEGORY_META[cat];
          const Icon = meta.icon;
          const isActive = activeCategory === cat;
          return (
            <button
              key={cat}
              onClick={() => setActiveCategory(cat)}
              className={`flex items-center gap-1.5 rounded-full px-4 py-2 text-xs font-semibold transition ${
                isActive ? 'bg-stone-900 text-white' : 'border border-stone-200 bg-white text-stone-600 hover:bg-stone-50'
              }`}
            >
              <Icon size={13} />
              {meta.label}
              <span className="opacity-70">{categoryCounts[cat]}</span>
            </button>
          );
        })}
      </div>

      <div className="mt-5 flex flex-wrap items-center justify-between gap-3">
        <p className="text-xs font-medium text-stone-500">{resultText(filtered.length, query)}</p>
        {(query || activeCategory !== 'all') && (
          <button
            type="button"
            onClick={() => {
              setQuery('');
              setActiveCategory('all');
            }}
            className="text-xs font-semibold text-stone-500 underline-offset-4 transition hover:text-stone-900 hover:underline"
          >
            Nulstil filter
          </button>
        )}
      </div>

      <div className="mt-6 flex flex-col gap-3">
        {filtered.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-stone-200 bg-white p-8 text-center">
            <div className="mx-auto flex h-11 w-11 items-center justify-center rounded-xl bg-stone-100 text-stone-500">
              <LifeBuoy size={18} />
            </div>
            <p className="mt-3 text-sm font-semibold text-stone-700">Intet fundet for &ldquo;{query}&rdquo;</p>
            <p className="mx-auto mt-1 max-w-sm text-xs leading-relaxed text-stone-400">
              Prøv et kortere søgeord, eller send spørgsmålet direkte til support med kategorien forudfyldt.
            </p>
            <Link
              href={`/support?category=${supportCategory}`}
              className="mt-5 inline-flex items-center gap-1.5 rounded-xl bg-stone-900 px-4 py-2.5 text-xs font-semibold text-white transition hover:bg-stone-800"
            >
              Kontakt support
              <ArrowRight size={13} />
            </Link>
          </div>
        ) : (
          filtered.map((faq) => {
            const isOpen = effectiveOpenQuestion === faq.question;
            const meta = CATEGORY_META[faq.category];
            const Icon = meta.icon;
            return (
              <div
                key={faq.question}
                className={`overflow-hidden rounded-2xl border bg-white shadow-sm shadow-stone-900/5 transition ${
                  isOpen ? 'border-rose-200' : 'border-stone-200'
                }`}
              >
                <button
                  onClick={() => setOpenQuestion(isOpen ? null : faq.question)}
                  className="flex w-full items-center gap-4 px-5 py-4 text-left"
                >
                  <div className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-xl ${meta.tint}`}>
                    <Icon size={15} />
                  </div>
                  <span className="flex-1 text-sm font-semibold text-stone-900">{faq.question}</span>
                  <ChevronDown size={16} className={`shrink-0 text-stone-400 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
                </button>
                {isOpen && (
                  <div className="px-5 pb-5 pl-[3.75rem] text-sm leading-relaxed text-stone-600">
                    <p>{faq.answer}</p>
                    {faq.moduleSlug && (
                      <Link
                        href={`/modules/${faq.moduleSlug}`}
                        className="mt-3 inline-flex items-center gap-1 text-xs font-semibold text-rose-600 underline-offset-4 hover:underline"
                      >
                        Se modulet
                        <ArrowRight size={12} />
                      </Link>
                    )}
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
