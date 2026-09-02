import Link from 'next/link';
import { Sparkles, Utensils, Wallet, Briefcase, HeartPulse, Repeat, Home as HomeIcon, Target, CheckSquare, Plane, ShieldCheck } from 'lucide-react';
import { PublicHeader } from '@/components/public-header';
import { PublicFooter } from '@/components/public-footer';
import { WaitlistCta } from '@/components/waitlist-cta';

const features = [
  { icon: Utensils, title: 'Madplan & indkøb', description: 'Automatisk ugentlig madplan der rammer dit budget, med opskrifter og tilbud fra dine butikker.' },
  { icon: Wallet, title: 'Økonomi', description: 'Overblik over udgifter, opsparingsmål og indkomst — samlet ét sted.' },
  { icon: Briefcase, title: 'Karriere', description: 'CV-builder, jobansøgninger og kompetenceoversigt til at holde styr på din jobsøgning.' },
  { icon: HeartPulse, title: 'Cyklus', description: 'Følg din cyklus med indsigt i mønstre og symptomer, privat og sikkert.' },
  { icon: Repeat, title: 'Vaner', description: 'Byg og hold fast i gode vaner med simpel, daglig opfølgning.' },
  { icon: HomeIcon, title: 'Hjemmet', description: 'Rengøringsplan, vedligeholdelse og indkøbsliste til hjemmet, samlet ét sted.' },
  { icon: Target, title: 'Livsmål', description: 'Sæt og følg dine personlige mål, store som små.' },
  { icon: CheckSquare, title: 'Gøremål', description: 'Hold styr på din to-do-liste, uden at noget falder mellem to stole.' },
  { icon: Plane, title: 'Rejser', description: 'Planlæg og hold styr på dine rejser, ét sted for sig.' },
  { icon: ShieldCheck, title: 'Garantier', description: 'Aldrig mere mistede kvitteringer — hold styr på garantiperioder på dine ting.' },
];

export default function Home() {
  return (
    <>
      <PublicHeader />
      <main className="flex-1">
        <section className="mx-auto max-w-5xl px-6 py-20 text-center sm:py-28">
          <div className="mx-auto mb-6 inline-flex items-center gap-1.5 rounded-full bg-rose-50 px-3 py-1 text-xs font-semibold text-rose-600">
            <Sparkles size={13} />
            Dit liv, samlet ét sted
          </div>
          <h1 className="text-4xl font-bold tracking-tight text-stone-900 sm:text-5xl">
            LifeSort holder styr på hverdagen, <span className="text-rose-600">så du ikke skal</span>
          </h1>
          <p className="mx-auto mt-5 max-w-xl text-lg text-stone-600">
            Madplan, økonomi, karriere og meget mere — samlet i én app, bygget til at gøre hverdagen lettere.
          </p>
          <WaitlistCta />
        </section>

        <section className="border-t border-stone-200 bg-white">
          <div className="mx-auto max-w-5xl px-6 py-16">
            <h2 className="text-center text-2xl font-bold text-stone-900">Alt det, du skal holde styr på</h2>
            <p className="mt-2 text-center text-sm text-stone-600">Ti moduler, én app.</p>
            <div className="mt-10 grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-5">
              {features.map((f) => (
                <div key={f.title} className="rounded-2xl border border-stone-200 p-5 shadow-sm shadow-stone-900/5">
                  <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-rose-500 to-rose-600">
                    <f.icon className="h-4 w-4 text-white" strokeWidth={2.2} />
                  </div>
                  <h3 className="mt-3 text-sm font-bold text-stone-900">{f.title}</h3>
                  <p className="mt-1 text-xs leading-relaxed text-stone-600">{f.description}</p>
                </div>
              ))}
            </div>
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