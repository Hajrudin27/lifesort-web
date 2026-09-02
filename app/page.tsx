import Link from 'next/link';
import { Rocket, Utensils, Wallet, Briefcase, HeartPulse } from 'lucide-react';
import { PublicHeader } from '@/components/public-header';
import { PublicFooter } from '@/components/public-footer';
import { WaitlistCta } from '@/components/waitlist-cta';
import { PhoneMockup } from '@/components/phone-mockup';

const heroFeatures = [
  { icon: Utensils, title: 'Madplan & indkøb', description: 'Automatisk ugentlig madplan der rammer dit budget, med opskrifter og tilbud fra dine butikker.', tint: 'bg-amber-100 text-amber-600' },
  { icon: Wallet, title: 'Økonomi', description: 'Overblik over udgifter, opsparingsmål og indkomst — samlet ét sted.', tint: 'bg-emerald-100 text-emerald-600' },
  { icon: Briefcase, title: 'Karriere', description: 'CV-builder, jobansøgninger og kompetenceoversigt til at holde styr på din jobsøgning.', tint: 'bg-violet-100 text-violet-600' },
  { icon: HeartPulse, title: 'Cyklus', description: 'Følg din cyklus med indsigt i mønstre og symptomer, privat og sikkert.', tint: 'bg-rose-100 text-rose-600' },
];

const moreFeatures = ['Vaner', 'Hjemmet', 'Livsmål', 'Gøremål', 'Rejser', 'Garantier'];

export default function Home() {
  return (
    <>
      <PublicHeader />
      <main className="flex-1">
        {/* Hero — dark anchor moment */}
        <section className="relative overflow-hidden bg-[#16130F]">
          <div className="pointer-events-none absolute -top-24 right-0 h-[32rem] w-[32rem] rounded-full bg-rose-600/20 blur-[100px]" />

          <div className="relative mx-auto grid max-w-6xl grid-cols-1 items-center gap-16 px-6 py-20 sm:py-28 lg:grid-cols-2 lg:py-32">
            <div className="text-center lg:text-left">
              <div className="mx-auto inline-flex items-center gap-1.5 rounded-full bg-white/10 px-3 py-1 text-xs font-semibold text-rose-200 lg:mx-0">
                <Rocket size={13} />
                Kommer snart
              </div>

              <h1 className="font-display mt-6 text-5xl font-semibold leading-[1.05] text-white sm:text-6xl">
                Dit liv,<br />samlet ét sted.
              </h1>

              <p className="mx-auto mt-6 max-w-md text-lg text-stone-300 lg:mx-0">
                Alt det, der plejer at leve i ti forskellige apps og alt for mange noter — samlet i én, bygget til at gøre hverdagen lettere.
              </p>

              <WaitlistCta variant="dark" />

              <p className="mt-4 text-xs text-stone-500">
                Ingen forpligtelser — bare besked, den dag vi lancerer.
              </p>
            </div>

            <div className="lg:justify-self-end">
              <PhoneMockup />
            </div>
          </div>
        </section>

        {/* Features */}
        <section className="bg-[#FBF7F1]">
          <div className="mx-auto max-w-5xl px-6 py-20">
            <h2 className="font-display text-center text-3xl font-semibold text-stone-900 sm:text-4xl">
              Ti dele af din hverdag. Én app.
            </h2>

            <div className="mt-12 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
              {heroFeatures.map((f) => (
                <div key={f.title} className="rounded-2xl bg-white p-6">
                  <div className={`flex h-10 w-10 items-center justify-center rounded-xl ${f.tint}`}>
                    <f.icon className="h-5 w-5" strokeWidth={2.2} />
                  </div>
                  <h3 className="mt-4 text-base font-bold text-stone-900">{f.title}</h3>
                  <p className="mt-1.5 text-sm text-stone-600">{f.description}</p>
                </div>
              ))}
            </div>

            <div className="mt-8 flex flex-wrap items-center justify-center gap-2">
              <span className="text-sm font-medium text-stone-500">...og meget mere:</span>
              {moreFeatures.map((f) => (
                <span key={f} className="rounded-full border border-stone-200 bg-white px-3 py-1.5 text-xs font-medium text-stone-600">
                  {f}
                </span>
              ))}
            </div>
          </div>
        </section>

        {/* Closing CTA */}
        <section className="border-t border-stone-200 bg-gradient-to-br from-rose-50 via-stone-50 to-amber-50">
          <div className="mx-auto max-w-2xl px-6 py-20 text-center">
            <h2 className="font-display text-3xl font-semibold text-stone-900">Klar til at prøve LifeSort?</h2>
            <p className="mt-2 text-sm text-stone-600">Vær blandt de første til at få adgang, når vi lancerer.</p>
            <WaitlistCta />
          </div>
        </section>

        {/* FAQ / support teaser */}
        <section className="mx-auto max-w-5xl px-6 py-16 text-center">
          <h2 className="text-2xl font-bold text-stone-900">Har du spørgsmål?</h2>
          <p className="mt-2 text-sm text-stone-600">Tjek vores ofte stillede spørgsmål, eller skriv til os direkte.</p>
          <div className="mt-6 flex flex-col items-center justify-center gap-3 sm:flex-row">
            <Link href="/faq" className="w-full rounded-xl border border-stone-200 bg-white px-6 py-3 text-sm font-semibold text-stone-700 transition hover:bg-stone-50 sm:w-auto">
              Se FAQ
            </Link>
            <Link href="/support" className="w-full rounded-xl bg-rose-600 px-6 py-3 text-sm font-semibold text-white transition hover:bg-rose-700 sm:w-auto">
              Kontakt support
            </Link>
          </div>
        </section>
      </main>
      <PublicFooter />
    </>
  );
}