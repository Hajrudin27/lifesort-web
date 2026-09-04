import Link from 'next/link';
import { Rocket } from 'lucide-react';
import { PublicHeader } from '@/components/public-header';
import { PublicFooter } from '@/components/public-footer';
import { WaitlistCta } from '@/components/waitlist-cta';
import { PhoneMockup } from '@/components/phone-mockup';
import { ScrollReveal } from '@/components/scroll-reveal';
import { FounderStory } from '@/components/founder-story';
import { modules } from '@/lib/modules-content';

const moreFeatures = ['Vaner', 'Hjemmet', 'Livsmål', 'Gøremål', 'Rejser', 'Garantier'];

export default function Home() {
  return (
    <>
      <PublicHeader />
      <main className="flex-1">
        {/* Hero — dark anchor moment */}
        <section className="relative overflow-hidden bg-[#16130F]">
          <div className="pointer-events-none absolute -top-24 right-0 h-[32rem] w-[32rem] rounded-full bg-rose-600/20 blur-[100px] [animation:drift_14s_ease-in-out_infinite]" />
          <div className="pointer-events-none absolute -bottom-32 -left-16 h-[26rem] w-[26rem] rounded-full bg-amber-500/10 blur-[100px] [animation:drift_18s_ease-in-out_infinite_reverse]" />

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
            <ScrollReveal>
              <h2 className="font-display text-center text-3xl font-semibold text-stone-900 sm:text-4xl">
                Ti dele af din hverdag. Én app.
              </h2>
              <p className="mt-2 text-center text-sm text-stone-500">Klik på et modul for at læse mere</p>
            </ScrollReveal>

            <div className="mt-12 grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-5">
              {modules.map((m, i) => {
                const Icon = m.icon;
                return (
                  <ScrollReveal key={m.slug} delay={i * 60}>
                    <Link
                      href={`/modules/${m.slug}`}
                      className="group flex h-full flex-col rounded-2xl bg-white p-5 transition hover:shadow-md"
                    >
                      <div className={`flex h-10 w-10 items-center justify-center rounded-xl ${m.tint}`}>
                        <Icon className="h-5 w-5" strokeWidth={2.2} />
                      </div>
                      <h3 className="mt-4 text-sm font-bold text-stone-900">{m.title}</h3>
                      <p className="mt-1.5 flex-1 text-xs leading-relaxed text-stone-500">{m.tagline}</p>
                      <span className="mt-3 text-xs font-semibold text-stone-400 transition group-hover:text-stone-900">
                        Læs mere →
                      </span>
                    </Link>
                  </ScrollReveal>
                );
              })}
            </div>
          </div>
        </section>
        <FounderStory />

        {/* Closing CTA */}
        <section className="border-t border-stone-200 bg-gradient-to-br from-rose-50 via-stone-50 to-amber-50">
          <ScrollReveal className="mx-auto max-w-2xl px-6 py-20 text-center">
            <h2 className="font-display text-3xl font-semibold text-stone-900">Klar til at prøve LifeSort?</h2>
            <p className="mt-2 text-sm text-stone-600">Vær blandt de første til at få adgang, når vi lancerer.</p>
            <WaitlistCta />
          </ScrollReveal>
        </section>

        {/* FAQ / support teaser */}
        <ScrollReveal className="mx-auto max-w-5xl px-6 py-16 text-center">
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
        </ScrollReveal>
      </main>
      <PublicFooter />
    </>
  );
}