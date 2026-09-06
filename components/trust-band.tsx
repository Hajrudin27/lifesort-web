import Link from 'next/link';
import { ArrowRight, Cookie, LifeBuoy, LockKeyhole, ShieldCheck, UserCheck } from 'lucide-react';
import { ScrollReveal } from '@/components/scroll-reveal';

const trustPoints = [
  {
    icon: LockKeyhole,
    title: 'Private hverdagsdata',
    description: 'Gøremål, økonomi, cyklus og andre personlige moduler er knyttet til din egen konto.',
    tint: 'bg-rose-100 text-rose-600',
  },
  {
    icon: UserCheck,
    title: 'Adskilt admin-adgang',
    description: 'Admin-panelet er bygget til indhold og support, ikke til at bladre i brugernes private liv.',
    tint: 'bg-emerald-100 text-emerald-600',
  },
  {
    icon: Cookie,
    title: 'Ingen marketing-cookies',
    description: 'Hjemmesiden bruger kun nødvendige cookies til login og sikkerhed.',
    tint: 'bg-amber-100 text-amber-600',
  },
  {
    icon: LifeBuoy,
    title: 'Klar supportkanal',
    description: 'Du kan skrive direkte til os, hvis noget virker forkert, eller hvis du vil bruge dine datarettigheder.',
    tint: 'bg-sky-100 text-sky-600',
  },
];

export function TrustBand() {
  return (
    <section className="border-y border-stone-200 bg-white">
      <div className="mx-auto max-w-6xl px-6 py-20">
        <div className="grid grid-cols-1 gap-10 lg:grid-cols-[0.8fr_1.2fr] lg:items-center">
          <ScrollReveal>
            <div className="inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-stone-900 text-white">
              <ShieldCheck className="h-6 w-6" strokeWidth={2.2} />
            </div>
            <p className="mt-5 text-xs font-bold uppercase tracking-wide text-emerald-700">Tryg før launch</p>
            <h2 className="font-display mt-3 text-3xl font-semibold leading-tight text-stone-900 sm:text-4xl">
              Bygget til data, man ikke bare smider rundt med.
            </h2>
            <p className="mt-3 text-sm leading-relaxed text-stone-600">
              LifeSort samler følsomme dele af hverdagen, så tillid er en del af produktet fra starten.
            </p>
            <div className="mt-7 flex flex-col gap-3 sm:flex-row">
              <Link
                href="/sikkerhed"
                className="inline-flex items-center justify-center gap-2 rounded-xl bg-stone-900 px-5 py-3 text-sm font-semibold text-white transition hover:bg-stone-800"
              >
                Se sikkerhed
                <ArrowRight size={15} />
              </Link>
              <Link
                href="/privacy"
                className="inline-flex items-center justify-center rounded-xl border border-stone-200 bg-white px-5 py-3 text-sm font-semibold text-stone-700 transition hover:bg-stone-50"
              >
                Læs privatlivspolitik
              </Link>
            </div>
          </ScrollReveal>

          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            {trustPoints.map((point, index) => {
              const Icon = point.icon;
              return (
                <ScrollReveal key={point.title} delay={index * 70}>
                  <div className="h-full rounded-2xl border border-stone-200 bg-stone-50/70 p-5 shadow-sm shadow-stone-900/5">
                    <div className={`flex h-10 w-10 items-center justify-center rounded-xl ${point.tint}`}>
                      <Icon className="h-5 w-5" strokeWidth={2.2} />
                    </div>
                    <h3 className="mt-4 text-sm font-bold text-stone-900">{point.title}</h3>
                    <p className="mt-1.5 text-sm leading-relaxed text-stone-600">{point.description}</p>
                  </div>
                </ScrollReveal>
              );
            })}
          </div>
        </div>

        <ScrollReveal delay={320} className="mt-8">
          <div className="flex flex-col gap-4 rounded-2xl border border-emerald-200 bg-emerald-50/70 p-5 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="text-sm font-bold text-stone-900">Support og rettigheder er ikke gemt væk.</p>
              <p className="mt-1 text-sm leading-relaxed text-stone-600">
                Har du spørgsmål til data, adgang eller sletning, kan du skrive direkte gennem supportformularen.
              </p>
            </div>
            <Link
              href="/support"
              className="inline-flex shrink-0 items-center justify-center gap-2 rounded-xl bg-emerald-700 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-emerald-800"
            >
              Kontakt support
              <ArrowRight size={14} />
            </Link>
          </div>
        </ScrollReveal>
      </div>
    </section>
  );
}
