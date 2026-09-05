'use client';

import { useMemo, useState } from 'react';
import {
  ChevronDown, Search, Sparkles, Shield, Puzzle, Mail,
} from 'lucide-react';

import { faqs, type FaqCategory as Category } from '@/lib/modules-content';

const CATEGORY_META: Record<Category, { label: string; icon: typeof Sparkles; tint: string }> = {
  generelt: { label: 'Generelt', icon: Sparkles, tint: 'bg-rose-100 text-rose-600' },
  moduler: { label: 'Moduler & funktioner', icon: Puzzle, tint: 'bg-amber-100 text-amber-600' },
  konto: { label: 'Konto & data', icon: Shield, tint: 'bg-emerald-100 text-emerald-600' },
  venteliste: { label: 'Venteliste & lancering', icon: Mail, tint: 'bg-violet-100 text-violet-600' },
};

export function FaqAccordion() {
  const [query, setQuery] = useState('');
  const [activeCategory, setActiveCategory] = useState<Category | 'all'>('all');
  const [openQuestion, setOpenQuestion] = useState<string | null>(faqs[0].question);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return faqs.filter((f) => {
      const matchesCategory = activeCategory === 'all' || f.category === activeCategory;
      const matchesQuery = !q || f.question.toLowerCase().includes(q) || f.answer.toLowerCase().includes(q);
      return matchesCategory && matchesQuery;
    });
  }, [query, activeCategory]);

  return (
    <div>
      <div className="relative">
        <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-stone-400" />
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Søg i spørgsmål og svar..."
          className="w-full rounded-2xl border border-stone-200 bg-white py-3.5 pl-11 pr-4 text-sm text-stone-900 shadow-sm shadow-stone-900/5 outline-none focus:border-rose-400 focus:ring-4 focus:ring-rose-100"
        />
      </div>

      <div className="mt-4 flex flex-wrap gap-2">
        <button
          onClick={() => setActiveCategory('all')}
          className={`rounded-full px-4 py-2 text-xs font-semibold transition ${
            activeCategory === 'all' ? 'bg-stone-900 text-white' : 'border border-stone-200 bg-white text-stone-600 hover:bg-stone-50'
          }`}
        >
          Alle
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
            </button>
          );
        })}
      </div>

      <div className="mt-6 flex flex-col gap-3">
        {filtered.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-stone-200 bg-white py-12 text-center">
            <p className="text-sm font-medium text-stone-500">Intet fundet for &ldquo;{query}&rdquo;</p>
            <p className="mt-1 text-xs text-stone-400">Prøv et andet ord, eller skriv til os direkte.</p>
          </div>
        ) : (
          filtered.map((faq) => {
            const isOpen = openQuestion === faq.question;
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
                  <div className="px-5 pb-5 pl-[3.75rem] text-sm leading-relaxed text-stone-600">{faq.answer}</div>
                )}
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
