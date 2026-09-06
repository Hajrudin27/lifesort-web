import Link from 'next/link';
import { ArrowRight, CalendarCheck, CheckCircle2, LayoutGrid, Sparkles } from 'lucide-react';
import { ScrollReveal } from '@/components/scroll-reveal';

const steps = [
  {
    icon: LayoutGrid,
    title: 'Vælg dine områder',
    description: 'Start med de moduler, der fylder mest i din hverdag lige nu.',
  },
  {
    icon: Sparkles,
    title: 'Få forslag og overblik',
    description: 'LifeSort samler dine valg og viser næste praktiske handling.',
  },
  {
    icon: CalendarCheck,
    title: 'Følg ugen ét sted',
    description: 'Madplan, budget, opgaver og mål bliver lettere at holde samlet.',
  },
];

const weekFlow = [
  'Mandag: vælg ugens fokus',
  'Tirsdag: madplan og indkøb',
  'Onsdag: budget og opgaver',
  'Fredag: status før weekenden',
];

export function HowItWorks() {
  return (
    <section className="bg-[#171411] text-white">
      <div className="mx-auto max-w-6xl px-6 py-20">
        <div className="grid grid-cols-1 gap-12 lg:grid-cols-[0.95fr_1.05fr] lg:items-center">
          <ScrollReveal>
            <p className="text-xs font-bold uppercase tracking-wide text-amber-300">Sådan virker det</p>
            <h2 className="font-display mt-3 text-3xl font-semibold leading-tight sm:text-4xl">
              Fra spredte apps til én rolig ugeplan.
            </h2>
            <p className="mt-3 max-w-xl text-sm leading-relaxed text-stone-300">
              LifeSort skal ikke føles som endnu et system, du skal holde ved lige. Det skal hjælpe dig med at se, hvad der betyder noget lige nu.
            </p>
            <Link
              href="/appcheck"
              className="mt-7 inline-flex items-center justify-center gap-2 rounded-xl bg-white px-5 py-3 text-sm font-semibold text-stone-950 transition hover:bg-stone-100"
            >
              Se hvad du kan samle
              <ArrowRight size={15} />
            </Link>
          </ScrollReveal>

          <div className="grid grid-cols-1 gap-3">
            {steps.map((step, index) => {
              const Icon = step.icon;
              return (
                <ScrollReveal key={step.title} delay={index * 80}>
                  <div className="flex gap-4 rounded-2xl border border-white/10 bg-white/[0.06] p-5 shadow-xl shadow-black/10">
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-white text-stone-950">
                      <Icon className="h-5 w-5" strokeWidth={2.2} />
                    </div>
                    <div>
                      <p className="text-xs font-bold uppercase tracking-wide text-stone-500">Trin {index + 1}</p>
                      <h3 className="mt-1 text-base font-bold">{step.title}</h3>
                      <p className="mt-1 text-sm leading-relaxed text-stone-300">{step.description}</p>
                    </div>
                  </div>
                </ScrollReveal>
              );
            })}
          </div>
        </div>

        <ScrollReveal delay={260} className="mt-12">
          <div className="grid grid-cols-1 gap-3 rounded-3xl border border-white/10 bg-white/[0.05] p-4 sm:grid-cols-4">
            {weekFlow.map((item) => (
              <div key={item} className="flex items-center gap-2 rounded-2xl bg-white/[0.06] px-4 py-3">
                <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-300" />
                <span className="text-sm font-medium text-stone-200">{item}</span>
              </div>
            ))}
          </div>
        </ScrollReveal>
      </div>
    </section>
  );
}
