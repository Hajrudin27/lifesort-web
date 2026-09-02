'use client';

import { useState } from 'react';
import { ChevronDown } from 'lucide-react';

const faqs = [
  { question: 'Hvad er LifeSort?', answer: 'LifeSort er en app der samler flere dele af hverdagen — madplan, økonomi, karriere, cyklus og mere — i ét sted, så du slipper for at bruge en app til hver ting.' },
  { question: 'Er mine data sikre?', answer: 'Ja. Dine data er knyttet til din personlige konto og er ikke tilgængelige for andre brugere.' },
  { question: 'Koster LifeSort noget?', answer: 'Opdateres når prismodellen er endeligt fastlagt.' },
  { question: 'Hvilke platforme understøttes?', answer: 'LifeSort er bygget til iOS og Android.' },
  { question: 'Hvordan sletter jeg min konto?', answer: 'Skriv til os via supportformularen, så hjælper vi dig med at slette din konto og alle tilknyttede data.' },
  { question: 'Kan jeg bruge appen på flere sprog?', answer: 'Ja, LifeSort understøtter både dansk og engelsk. Du kan skifte sprog under Indstillinger i appen.' },
];

export function FaqAccordion() {
  const [openIndex, setOpenIndex] = useState<number | null>(0);

  return (
    <div className="mt-8 divide-y divide-stone-200 rounded-2xl border border-stone-200 bg-white shadow-sm shadow-stone-900/5">
      {faqs.map((faq, i) => {
        const isOpen = openIndex === i;
        return (
          <div key={faq.question}>
            <button
              onClick={() => setOpenIndex(isOpen ? null : i)}
              className="flex w-full items-center justify-between gap-4 px-6 py-4 text-left"
            >
              <span className="text-sm font-semibold text-stone-900">{faq.question}</span>
              <ChevronDown size={16} className={`shrink-0 text-stone-400 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
            </button>
            {isOpen && (
              <div className="px-6 pb-4 text-sm leading-relaxed text-stone-600">{faq.answer}</div>
            )}
          </div>
        );
      })}
    </div>
  );
}