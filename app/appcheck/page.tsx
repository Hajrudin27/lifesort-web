'use client';

import { useState } from 'react';
import { Sparkles, Check } from 'lucide-react';
import { PublicHeader } from '@/components/public-header';
import { PublicFooter } from '@/components/public-footer';
import { WaitlistCta } from '@/components/waitlist-cta';
import { modules } from '@/lib/modules-content';

export default function AppCheckPage() {
  const [selected, setSelected] = useState<Set<string>>(new Set());

  const toggle = (slug: string) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(slug)) next.delete(slug);
      else next.add(slug);
      return next;
    });
  };

  const count = selected.size;
  const hasAnswered = count > 0;

  const resultText =
    count === 0
      ? 'Klik på det, du i dag bruger en separat app eller note til.'
      : count === 1
        ? 'Du bruger i dag 1 separat app til dette — allerede én for meget.'
        : `Du bruger i dag ${count} separate apps til det, LifeSort samler i én.`;

  return (
    <>
      <PublicHeader />
      <main id="main-content" className="flex-1">
        <section className="relative overflow-hidden bg-[#16130F]">
          <div className="pointer-events-none absolute -top-20 right-0 h-96 w-96 rounded-full bg-amber-500/20 blur-[100px] [animation:drift_15s_ease-in-out_infinite]" />
          <div className="pointer-events-none absolute bottom-0 -left-16 h-56 w-56 rounded-full bg-rose-600/10 blur-[90px] [animation:drift_19s_ease-in-out_infinite_reverse]" />

          <div className="relative mx-auto max-w-2xl px-6 py-20 text-center">
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-white/10">
              <Sparkles className="h-7 w-7 text-amber-300" strokeWidth={2.2} />
            </div>
            <h1 className="font-display mt-6 text-4xl font-semibold text-white sm:text-5xl">
              Hvor mange apps bruger du egentlig?
            </h1>
            <p className="mx-auto mt-4 max-w-md text-stone-300">
              Klik på det, du i dag holder styr på i en separat app, note eller seddel — så tæller vi med.
            </p>
          </div>
        </section>

        <div className="mx-auto max-w-3xl px-6 py-14">
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
            {modules.map((m) => {
              const Icon = m.icon;
              const isSelected = selected.has(m.slug);
              return (
                <button
                  key={m.slug}
                  onClick={() => toggle(m.slug)}
                  className={`relative flex flex-col items-center gap-2 rounded-2xl border p-4 text-center transition ${
                    isSelected
                      ? 'border-stone-900 bg-stone-900 shadow-md'
                      : 'border-stone-200 bg-white hover:border-stone-300'
                  }`}
                >
                  {isSelected && (
                    <span className="absolute right-2 top-2 flex h-5 w-5 items-center justify-center rounded-full bg-white">
                      <Check size={11} strokeWidth={3} className="text-stone-900" />
                    </span>
                  )}
                  <div className={`flex h-10 w-10 items-center justify-center rounded-xl ${isSelected ? 'bg-white/15' : m.tint}`}>
                    <Icon className={`h-5 w-5 ${isSelected ? 'text-white' : ''}`} strokeWidth={2.2} />
                  </div>
                  <span className={`text-xs font-semibold ${isSelected ? 'text-white' : 'text-stone-900'}`}>{m.title}</span>
                </button>
              );
            })}
          </div>

          <div
            className={`sticky bottom-4 mt-8 rounded-2xl border p-6 text-center shadow-lg transition ${
              hasAnswered
                ? 'border-rose-200 bg-gradient-to-br from-rose-50 via-stone-50 to-amber-50'
                : 'border-stone-200 bg-white'
            }`}
          >
            {hasAnswered && (
              <p className="font-display text-3xl font-semibold text-stone-900">{count}</p>
            )}
            <p className="mt-1 text-sm font-medium text-stone-700">{resultText}</p>
            {hasAnswered && (
              <div className="mt-5">
                <p className="text-xs text-stone-500">LifeSort samler dem i én app.</p>
                <WaitlistCta />
              </div>
            )}
          </div>
        </div>
      </main>
      <PublicFooter />
    </>
  );
}