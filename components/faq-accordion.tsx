'use client';

import { useMemo, useState } from 'react';
import {
  ChevronDown, Search, Sparkles, Shield, Puzzle, Mail,
} from 'lucide-react';

type Category = 'generelt' | 'moduler' | 'konto' | 'venteliste';

const CATEGORY_META: Record<Category, { label: string; icon: typeof Sparkles; tint: string }> = {
  generelt: { label: 'Generelt', icon: Sparkles, tint: 'bg-rose-100 text-rose-600' },
  moduler: { label: 'Moduler & funktioner', icon: Puzzle, tint: 'bg-amber-100 text-amber-600' },
  konto: { label: 'Konto & data', icon: Shield, tint: 'bg-emerald-100 text-emerald-600' },
  venteliste: { label: 'Venteliste & lancering', icon: Mail, tint: 'bg-violet-100 text-violet-600' },
};

const faqs: { category: Category; question: string; answer: string }[] = [
  {
    category: 'generelt',
    question: 'Hvad er LifeSort?',
    answer:
      'LifeSort er en app, der samler ti dele af hverdagen — madplan, økonomi, karriere, cyklus, vaner, hjemmet, livsmål, gøremål, rejser og garantier — i ét sted, så du slipper for at bruge en app til hver ting.',
  },
  {
    category: 'generelt',
    question: 'Hvilke platforme understøttes?',
    answer: 'LifeSort er bygget til både iOS og Android, med samme funktioner på begge platforme.',
  },
  {
    category: 'generelt',
    question: 'Kan jeg bruge appen på flere sprog?',
    answer: 'Ja, LifeSort understøtter både dansk og engelsk. Du kan skifte sprog under Indstillinger i appen.',
  },
  {
    category: 'generelt',
    question: 'Koster LifeSort noget?',
    answer: 'Prismodellen er endnu ikke endeligt fastlagt. Vi opdaterer denne side, så snart den er på plads.',
  },
  {
    category: 'moduler',
    question: 'Hvordan virker madplan-modulet?',
    answer:
      'Du sætter et ugentligt budget og vælger dine faste butikker — LifeSort sammensætter så automatisk en plan for ugen ud fra aktuelle tilbud og en opskriftssamling, og genererer en indkøbsliste sorteret efter butik.',
  },
  {
    category: 'moduler',
    question: 'Kan jeg dele huslige opgaver med min partner?',
    answer:
      'Ja — i Hjemmet-modulet kan opgaver tildeles skiftevis mellem to personer, med automatisk rotation, hver gang en opgave markeres som færdig, hvis I ønsker det.',
  },
  {
    category: 'moduler',
    question: 'Er mine cyklus-data private?',
    answer: 'Ja. Cyklus- og symptomdata er knyttet til din personlige konto og er aldrig synlige for andre — heller ikke os.',
  },
  {
    category: 'moduler',
    question: 'Kan jeg vedhæfte kvitteringer og garantibeviser?',
    answer:
      'Ja, både i Økonomi- og Garanti-modulet kan du fotografere kvitteringer direkte i appen og få en påmindelse, før en garanti udløber.',
  },
  {
    category: 'konto',
    question: 'Er mine data sikre?',
    answer: 'Ja. Dine data er knyttet til din personlige konto og er ikke tilgængelige for andre brugere.',
  },
  {
    category: 'konto',
    question: 'Kan jeg eksportere mine egne data?',
    answer:
      'Ja — under Indstillinger i appen kan du downloade alle dine egne data som én fil, når som helst du ønsker det.',
  },
  {
    category: 'konto',
    question: 'Hvordan sletter jeg min konto?',
    answer: 'Skriv til os via supportformularen nedenfor, så hjælper vi dig med at slette din konto og alle tilknyttede data.',
  },
  {
    category: 'venteliste',
    question: 'Hvad sker der, når jeg tilmelder mig ventelisten?',
    answer:
      'Du modtager en bekræftelses-email med det samme. Når du har bekræftet, er du officielt på listen, og vi skriver til dig igen, den dag appen er klar til din platform.',
  },
  {
    category: 'venteliste',
    question: 'Hvornår lancerer LifeSort?',
    answer: 'Vi bygger appen åbent, modul for modul, og har endnu ikke en fast lanceringsdato — ventelisten er den bedste måde at få besked først.',
  },
  {
    category: 'venteliste',
    question: 'Jeg fik ikke en bekræftelses-email — hvad gør jeg?',
    answer: 'Tjek lige dit spam-filter først. Kommer den stadig ikke frem efter et par minutter, så skriv til os via supportformularen, så undersøger vi det.',
  },
];

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