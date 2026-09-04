import Link from 'next/link';
import { HelpCircle, MessageCircle } from 'lucide-react';
import { PublicHeader } from '@/components/public-header';
import { PublicFooter } from '@/components/public-footer';
import { FaqAccordion } from '@/components/faq-accordion';
import { ScrollReveal } from '@/components/scroll-reveal';

export const metadata = {
  title: 'FAQ',
  description: 'Svar på de mest almindelige spørgsmål om LifeSort — moduler, data, konto og venteliste.',
};

export default function FaqPage() {
  return (
    <>
      <PublicHeader />
      <main className="flex-1">
        <section className="relative overflow-hidden bg-[#16130F]">
        <div className="pointer-events-none absolute -top-20 right-0 h-96 w-96 rounded-full bg-rose-600/20 blur-[100px] [animation:drift_14s_ease-in-out_infinite]" />
        <div className="pointer-events-none absolute bottom-0 -left-16 h-56 w-56 rounded-full bg-amber-500/10 blur-[90px] [animation:drift_18s_ease-in-out_infinite_reverse]" />

          <div className="relative mx-auto max-w-2xl px-6 py-20 text-center">
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-white/10">
              <HelpCircle className="h-7 w-7 text-rose-300" strokeWidth={2.2} />
            </div>
            <h1 className="font-display mt-6 text-4xl font-semibold text-white sm:text-5xl">
              Spørgsmål &amp; svar
            </h1>
            <p className="mx-auto mt-4 max-w-md text-stone-300">
              Alt hvad du har brug for at vide om LifeSort — søg direkte, eller kig efter kategori.
            </p>
          </div>
        </section>

        <div className="mx-auto max-w-2xl px-6 py-14">
          <ScrollReveal>
            <FaqAccordion />
          </ScrollReveal>

          <ScrollReveal delay={100} className="mt-10 flex items-center gap-4 rounded-2xl border border-stone-200 bg-gradient-to-br from-rose-50 via-stone-50 to-amber-50 p-6">
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-white shadow-sm">
              <MessageCircle className="h-5 w-5 text-rose-600" />
            </div>
            <div className="flex-1">
              <p className="text-sm font-bold text-stone-900">Fandt du ikke svaret?</p>
              <p className="text-xs text-stone-600">Skriv til os direkte, så vender vi tilbage hurtigst muligt.</p>
            </div>
            <Link
              href="/support"
              className="shrink-0 rounded-xl bg-stone-900 px-4 py-2.5 text-xs font-semibold text-white transition hover:bg-stone-800"
            >
              Kontakt support
            </Link>
          </ScrollReveal>
        </div>
      </main>
      <PublicFooter />
    </>
  );
}