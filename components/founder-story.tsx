import { CheckCircle2, Layers3, LockKeyhole, Sparkles } from 'lucide-react';
import { ScrollReveal } from '@/components/scroll-reveal';

const principles = [
  {
    icon: Layers3,
    title: 'Hverdagen skal hænge sammen',
    text: 'Madplan, økonomi, opgaver og mål skal ikke leve i hver sin app, når beslutningerne i virkeligheden påvirker hinanden.',
  },
  {
    icon: LockKeyhole,
    title: 'Private data skal behandles derefter',
    text: 'LifeSort bygges med tydelig rollefordeling, databeskyttelse og admin-begrænsninger som en del af fundamentet.',
  },
  {
    icon: Sparkles,
    title: 'Små moduler, mærkbar ro',
    text: 'Vi bygger modul for modul, så hver del kan blive praktisk, forståelig og nyttig før næste lag lægges ovenpå.',
  },
];

export function FounderStory() {
  return (
    <section className="border-t border-stone-200 bg-white">
      <ScrollReveal className="mx-auto max-w-5xl px-6 py-20">
        <div className="mx-auto max-w-3xl text-center">
          <p className="text-xs font-semibold uppercase tracking-widest text-rose-500">Hvorfor LifeSort</p>
          <h2 className="mt-3 font-display text-3xl font-semibold text-stone-900">
            Bygget til den hverdag, der sjældent passer ned i én kategori
          </h2>
          <p className="mt-4 text-sm leading-relaxed text-stone-600">
            LifeSort begyndte med en enkel frustration: de fleste hverdagsapps løser én ting ad gangen,
            men hverdagen fungerer ikke sådan. Ugens madplan hænger sammen med budgettet. Rejser,
            opgaver, garantier og mål ligger ofte spredt i noter, regneark og små påmindelser.
          </p>
        </div>

        <div className="mt-10 grid grid-cols-1 gap-4 md:grid-cols-3">
          {principles.map((principle) => {
            const Icon = principle.icon;
            return (
              <div key={principle.title} className="rounded-2xl border border-stone-200 bg-stone-50/70 p-5">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-white text-rose-600 shadow-sm shadow-stone-900/5">
                  <Icon className="h-5 w-5" strokeWidth={2.2} />
                </div>
                <h3 className="mt-4 text-sm font-bold text-stone-900">{principle.title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-stone-600">{principle.text}</p>
              </div>
            );
          })}
        </div>

        <div className="mt-10 rounded-2xl border border-stone-200 bg-gradient-to-br from-stone-950 via-stone-900 to-stone-800 p-6 text-white shadow-sm shadow-stone-900/10">
          <div className="flex flex-col gap-5 sm:flex-row sm:items-start">
            <div className="flex shrink-0 -space-x-3">
              <div className="flex h-14 w-14 items-center justify-center rounded-full border-4 border-stone-900 bg-gradient-to-br from-sky-400 to-sky-600 text-lg font-bold text-white shadow-sm">
                H
              </div>
              <div className="flex h-14 w-14 items-center justify-center rounded-full border-4 border-stone-900 bg-gradient-to-br from-violet-400 to-violet-600 text-lg font-bold text-white shadow-sm">
                W
              </div>
            </div>
            <div>
              <div className="inline-flex items-center gap-1.5 rounded-full bg-white/10 px-3 py-1 text-xs font-semibold text-rose-100">
                <CheckCircle2 size={13} />
                Bygges åbent, modul for modul
              </div>
              <p className="mt-4 text-sm leading-relaxed text-stone-200">
                Målet er ikke at lave endnu en app, der bare samler skærme. Målet er at skabe et sted,
                hvor de små beslutninger i hverdagen bliver lettere at overskue, fordi de ligger i samme system.
              </p>
              <p className="mt-4 text-sm font-semibold text-white">Hajrudin &amp; Walid</p>
            </div>
          </div>
        </div>
      </ScrollReveal>
    </section>
  );
}
