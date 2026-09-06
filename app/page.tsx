import Link from 'next/link';
import { Rocket } from 'lucide-react';
import { PublicHeader } from '@/components/public-header';
import { PublicFooter } from '@/components/public-footer';
import { WaitlistCta } from '@/components/waitlist-cta';
import { PhoneMockup } from '@/components/phone-mockup';
import { HeroSubtitle } from '@/components/hero-subtitle';
import { ScrollReveal } from '@/components/scroll-reveal';
import { FounderStory } from '@/components/founder-story';
import { InteractiveModulePreview } from '@/components/interactive-module-preview';
import { absoluteUrl, createPageMetadata, defaultDescription, defaultTitle, siteName } from '@/lib/seo';

export const metadata = createPageMetadata({
  title: defaultTitle,
  description: defaultDescription,
  path: '/',
  absoluteTitle: true,
  keywords: ['LifeSort', 'hverdagsapp', 'madplan', 'økonomi', 'karriere', 'to do'],
});

const websiteJsonLd = {
  '@context': 'https://schema.org',
  '@type': 'WebSite',
  name: siteName,
  url: absoluteUrl('/'),
  description: defaultDescription,
  inLanguage: 'da-DK',
};

const softwareJsonLd = {
  '@context': 'https://schema.org',
  '@type': 'SoftwareApplication',
  name: siteName,
  applicationCategory: 'LifestyleApplication',
  operatingSystem: 'iOS, Android',
  url: absoluteUrl('/'),
  description: defaultDescription,
  offers: {
    '@type': 'Offer',
    price: '0',
    priceCurrency: 'DKK',
    availability: 'https://schema.org/PreOrder',
  },
};

export default function Home() {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(websiteJsonLd) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(softwareJsonLd) }}
      />
      <PublicHeader />
      <main id="main-content" className="flex-1">
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

              <HeroSubtitle />

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

        <InteractiveModulePreview />
        
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
