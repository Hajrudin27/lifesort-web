import Link from 'next/link';
import { Rocket, Utensils, Wallet, Briefcase, HeartPulse } from 'lucide-react';
import { PublicHeader } from '@/components/public-header';
import { PublicFooter } from '@/components/public-footer';
import { WaitlistCta } from '@/components/waitlist-cta';

const heroFeatures = [
  { icon: Utensils, title: 'Madplan & indkøb', description: 'Automatisk ugentlig madplan der rammer dit budget, med opskrifter og tilbud fra dine butikker.' },
  { icon: Wallet, title: 'Økonomi', description: 'Overblik over udgifter, opsparingsmål og indkomst — samlet ét sted.' },
  { icon: Briefcase, title: 'Karriere', description: 'CV-builder, jobansøgninger og kompetenceoversigt til at holde styr på din jobsøgning.' },
  { icon: HeartPulse, title: 'Cyklus', description: 'Følg din cyklus med indsigt i mønstre og symptomer, privat og sikkert.' },
];

const moreFeatures = ['Vaner', 'Hjemmet', 'Livsmål', 'Gøremål', 'Rejser', 'Garantier'];

export default function Home() {
  return (
    <>
      <PublicHeader />
      <main className="flex-1">
        <section className="mx-auto max-w-5xl px-6 py-20 text-center sm:py-28">
          <div className="mx-auto mb-6 inline-flex items-center gap-1.5 rounded-full bg-rose-50 px-3 py-1 text-xs font-semibold text-rose-600">
            <Rocket size={13} />
            På vej — tilmeld dig ventelisten
          </div>
          <h1 className="text-4xl font-bold tracking-tight text-stone-900 sm:text-5xl">
            LifeSort holder styr på hverdagen, <span className="text-rose-600">så du ikke skal</span>
          </h1>
          <p className="mx-auto mt-5 max-w-xl text-lg text-stone-600">
            Madplan, økonomi, karriere og meget mere — samlet i én app, bygget til at gøre hverdagen lettere.
          </p>
          <WaitlistCta />
        </section>

        <section className="mx-auto max-w-2xl px-6 pb-4 text-center">
          <p className="text-lg font-medium text-stone-700">
            Madplan i én app. Økonomi i en anden. Cyklus i en tredje.
          </p>
          <p className="mt-1 text-lg text-stone-400">
            Lyder det bekendt?
          </p>
        </section>

        <section className="border-t border-stone-200 bg-white">
          <div className="mx-auto max-w-5xl px-6 py-16">
            <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
              {heroFeatures.map((f) => (
                <div key={f.title} className="rounded-2xl border border-stone-200 p-6 shadow-sm shadow-stone-900/5">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-rose-500 to-rose-600">
                    <f.icon className="h-5 w-5 text-white" strokeWidth={2.2} />
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

        <section className="border-t border-stone-200 bg-gradient-to-br from-rose-50 via-stone-50 to-amber-50">
          <div className="mx-auto max-w-2xl px-6 py-16 text-center">
            <h2 className="text-2xl font-bold text-stone-900">Klar til at prøve LifeSort?</h2>
            <p className="mt-2 text-sm text-stone-600">Vær blandt de første til at få adgang, når vi lancerer.</p>
            <WaitlistCta />
          </div>
        </section>

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