import Link from 'next/link';
import {
  ArrowRight,
  BookOpenCheck,
  Clock,
  HelpCircle,
  MessageCircle,
  Search,
  ShieldCheck,
  Sparkles,
} from 'lucide-react';
import { PublicHeader } from '@/components/public-header';
import { PublicFooter } from '@/components/public-footer';
import { FaqAccordion } from '@/components/faq-accordion';
import { BackToTop } from '@/components/back-to-top';
import { ScrollReveal } from '@/components/scroll-reveal';
import { createPageMetadata } from '@/lib/seo';

export const metadata = createPageMetadata({
  title: 'FAQ',
  description: 'Svar på de mest almindelige spørgsmål om LifeSort — moduler, data, konto og venteliste.',
  path: '/faq',
  keywords: ['LifeSort FAQ', 'LifeSort spørgsmål', 'hverdagsapp hjælp'],
});

const quickPath = [
  { icon: Search, label: 'Søg først', detail: 'Find svar på tværs af moduler, konto og venteliste.', href: '#faq-search' },
  { icon: BookOpenCheck, label: 'Fold svaret ud', detail: 'Se kun det, du har brug for lige nu.', href: '#faq-search' },
  { icon: MessageCircle, label: 'Skriv videre', detail: 'Send os sagen direkte, hvis FAQ’en ikke rammer.', href: '/support?category=general#support-form' },
];

const highlights = [
  { icon: Sparkles, label: 'Opdateret løbende', detail: 'FAQ’en følger de features, vi bygger.' },
  { icon: ShieldCheck, label: 'Data forklaret roligt', detail: 'Klare svar om konto, eksport og privatliv.' },
  { icon: Clock, label: 'Support tæt på', detail: 'Mangler svaret, kan du skrive direkte videre.' },
];

export default function FaqPage() {
  return (
    <>
      <PublicHeader />
      <main id="main-content" className="flex-1">
        <section className="relative overflow-hidden bg-[#16130F]">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(244,63,94,0.22),transparent_34%),linear-gradient(135deg,rgba(255,255,255,0.08),transparent_42%)]" />

          <div className="relative mx-auto grid max-w-5xl grid-cols-1 items-end gap-10 px-6 py-16 sm:py-20 lg:grid-cols-[1fr_340px]">
            <div className="max-w-2xl text-center lg:text-left">
              <div className="mx-auto inline-flex items-center gap-1.5 rounded-full border border-white/10 bg-white/10 px-3 py-1 text-xs font-semibold text-rose-100 lg:mx-0">
                <HelpCircle size={13} />
                FAQ &amp; hjælp
              </div>
              <h1 className="font-display mt-6 text-4xl font-semibold leading-tight text-white sm:text-5xl">
                Find svaret, før det bliver en support-sag
              </h1>
              <p className="mx-auto mt-4 max-w-xl text-sm leading-7 text-stone-300 lg:mx-0">
                Søg i spørgsmål om moduler, konto, data og venteliste. Hvis svaret mangler, sender vi dig direkte videre til den rigtige supportkategori.
              </p>
            </div>

            <div className="rounded-2xl border border-white/10 bg-white/[0.06] p-5 shadow-2xl shadow-stone-950/20 backdrop-blur">
              <p className="text-sm font-bold text-white">Hurtigste vej</p>
              <div className="mt-4 flex flex-col gap-3">
                {quickPath.map((item) => {
                  const Icon = item.icon;
                  return (
                    <a key={item.label} href={item.href} className="group flex items-start gap-3 rounded-xl bg-white/10 p-3 transition hover:bg-white/[0.14]">
                      <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-white/10 text-rose-200">
                        <Icon size={15} />
                      </span>
                      <span>
                        <span className="block text-xs font-bold text-white">{item.label}</span>
                        <span className="mt-0.5 block text-[11px] leading-relaxed text-stone-400">{item.detail}</span>
                      </span>
                      <ArrowRight size={13} className="ml-auto mt-1 shrink-0 text-stone-500 transition group-hover:translate-x-0.5 group-hover:text-white" />
                    </a>
                  );
                })}
              </div>
            </div>
          </div>
        </section>

        <section className="border-b border-stone-200 bg-white">
          <div className="mx-auto grid max-w-5xl grid-cols-1 gap-3 px-6 py-5 sm:grid-cols-3">
            {highlights.map((item) => {
              const Icon = item.icon;
              return (
                <div key={item.label} className="flex items-start gap-3">
                  <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-stone-100 text-stone-600">
                    <Icon size={16} />
                  </div>
                  <div>
                    <p className="text-sm font-bold text-stone-900">{item.label}</p>
                    <p className="mt-0.5 text-xs leading-relaxed text-stone-500">{item.detail}</p>
                  </div>
                </div>
              );
            })}
          </div>
        </section>

        <div className="mx-auto grid max-w-5xl grid-cols-1 gap-8 px-6 py-12 lg:grid-cols-[minmax(0,1fr)_300px]">
          <div id="faq-search" className="scroll-mt-24">
            <ScrollReveal>
              <FaqAccordion />
            </ScrollReveal>
          </div>

          <ScrollReveal delay={100} className="flex flex-col gap-4">
            <div className="rounded-2xl border border-stone-200 bg-white p-5 shadow-sm shadow-stone-900/5">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-rose-50 text-rose-600">
                <MessageCircle size={17} />
              </div>
              <p className="mt-4 text-sm font-bold text-stone-900">Fandt du ikke svaret?</p>
              <p className="mt-1 text-xs leading-relaxed text-stone-600">
                Send spørgsmålet direkte til support. Vi har allerede gjort formularen klar til generelle spørgsmål.
              </p>
              <Link
                href="/support?category=general#support-form"
                className="mt-4 inline-flex w-full items-center justify-center gap-1.5 rounded-xl bg-stone-900 px-4 py-2.5 text-xs font-semibold text-white transition hover:bg-stone-800"
              >
                Kontakt support
                <ArrowRight size={13} />
              </Link>
            </div>

            <div className="rounded-2xl border border-stone-200 bg-gradient-to-br from-rose-50 via-stone-50 to-amber-50 p-5">
              <p className="text-xs font-bold uppercase tracking-wider text-stone-500">Tip</p>
              <p className="mt-2 text-sm font-bold text-stone-900">Søg kort og konkret</p>
              <p className="mt-1 text-xs leading-relaxed text-stone-600">
                Ord som “data”, “konto”, “pris” og “madplan” finder ofte de bedste svar hurtigst.
              </p>
            </div>
          </ScrollReveal>
        </div>
      </main>
      <BackToTop />
      <PublicFooter />
    </>
  );
}
