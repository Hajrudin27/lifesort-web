import Link from 'next/link';
import { ShieldCheck, Lock, UserCheck, Download, HeartPulse, ArrowRight } from 'lucide-react';
import { PublicHeader } from '@/components/public-header';
import { PublicFooter } from '@/components/public-footer';
import { ScrollReveal } from '@/components/scroll-reveal';

export const metadata = {
  title: 'Sikkerhed & privatliv',
  description: 'Sådan beskytter LifeSort dine data — konkret, ikke kun i småt skrevet jura.',
};

const points = [
  {
    icon: Lock,
    title: 'Kun dig kan se dine data',
    tint: 'bg-rose-100 text-rose-600',
    description:
      'Hver bruger er adskilt på database-niveau, ikke kun i appens brugerflade — dine gøremål, udgifter, garantier og cyklus-data er teknisk umulige for andre brugere at tilgå, uanset hvad de prøver.',
  },
  {
    icon: UserCheck,
    title: 'Vi kan ikke selv se dine personlige data',
    tint: 'bg-emerald-100 text-emerald-600',
    description:
      'Det admin-panel, vi selv styrer appen fra, har kun adgang til indhold som opskrifter, priser og supportsager — ikke til brugeres personlige gøremål, udgifter eller cyklus-oplysninger. Det er ikke et løfte, det er sådan systemet er bygget.',
  },
  {
    icon: Download,
    title: 'Dine data er altid dine at tage med',
    tint: 'bg-amber-100 text-amber-600',
    description:
      'Under Indstillinger i appen kan du downloade alle dine egne data som én fil, når som helst — uden at skulle bede os om noget først.',
  },
  {
    icon: HeartPulse,
    title: 'Ekstra varsomhed med sundhedsdata',
    tint: 'bg-violet-100 text-violet-600',
    description:
      'Cyklus- og symptomdata er en særlig kategori af personoplysninger under GDPR. De behandles kun med dit udtrykkelige samtykke og forbliver knyttet alene til din konto.',
  },
];

export default function SecurityPage() {
  return (
    <>
      <PublicHeader />
      <main id="main-content" className="flex-1">
        <section className="relative overflow-hidden bg-[#16130F]">
          <div className="pointer-events-none absolute -top-20 right-0 h-96 w-96 rounded-full bg-emerald-600/20 blur-[100px] [animation:drift_15s_ease-in-out_infinite]" />
          <div className="pointer-events-none absolute bottom-0 -left-16 h-56 w-56 rounded-full bg-rose-500/10 blur-[90px] [animation:drift_19s_ease-in-out_infinite_reverse]" />

          <div className="relative mx-auto max-w-2xl px-6 py-20 text-center">
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-white/10">
              <ShieldCheck className="h-7 w-7 text-emerald-300" strokeWidth={2.2} />
            </div>
            <h1 className="font-display mt-6 text-4xl font-semibold text-white sm:text-5xl">
              Din data er din
            </h1>
            <p className="mx-auto mt-4 max-w-md text-stone-300">
              Ikke bare et løfte i småt skrevet jura — sådan er LifeSort rent teknisk bygget.
            </p>
          </div>
        </section>

        <div className="mx-auto max-w-3xl px-6 py-14">
          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
            {points.map((p, i) => {
              const Icon = p.icon;
              return (
                <ScrollReveal key={p.title} delay={i * 80}>
                  <div className="h-full rounded-2xl border border-stone-200 bg-white p-6 shadow-sm shadow-stone-900/5">
                    <div className={`flex h-10 w-10 items-center justify-center rounded-xl ${p.tint}`}>
                      <Icon className="h-5 w-5" strokeWidth={2.2} />
                    </div>
                    <h2 className="mt-4 text-base font-bold text-stone-900">{p.title}</h2>
                    <p className="mt-1.5 text-sm leading-relaxed text-stone-600">{p.description}</p>
                  </div>
                </ScrollReveal>
              );
            })}
          </div>

          <ScrollReveal delay={340} className="mt-8 flex items-center gap-4 rounded-2xl border border-stone-200 bg-gradient-to-br from-emerald-50 via-stone-50 to-amber-50 p-6">
            <div className="flex-1">
              <p className="text-sm font-bold text-stone-900">Vil du have alle de juridiske detaljer?</p>
              <p className="text-xs text-stone-600">Vores fulde privatlivspolitik beskriver præcis, hvilke data vi behandler og hvorfor.</p>
            </div>
            <Link
              href="/privacy"
              className="flex shrink-0 items-center gap-1.5 rounded-xl bg-stone-900 px-4 py-2.5 text-xs font-semibold text-white transition hover:bg-stone-800"
            >
              Læs privatlivspolitik <ArrowRight size={13} />
            </Link>
          </ScrollReveal>
        </div>
      </main>
      <PublicFooter />
    </>
  );
}