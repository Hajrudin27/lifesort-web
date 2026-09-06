import Link from 'next/link';
import {
  ArrowRight,
  BookOpen,
  Bug,
  CheckCircle2,
  Clock,
  CreditCard,
  Inbox,
  LifeBuoy,
  LockKeyhole,
  MessageCircle,
  ShieldCheck,
  Sparkles,
  UserCircle,
} from 'lucide-react';
import { PublicHeader } from '@/components/public-header';
import { PublicFooter } from '@/components/public-footer';
import { SupportForm } from '@/components/support-form';
import { ScrollReveal } from '@/components/scroll-reveal';
import { BackToTop } from '@/components/back-to-top';
import { createPageMetadata } from '@/lib/seo';

export const metadata = createPageMetadata({
  title: 'Kontakt support',
  description: 'Skriv til LifeSort-teamet — vi svarer typisk inden for 24 timer.',
  path: '/support',
  keywords: ['LifeSort support', 'kontakt LifeSort', 'hjælp til LifeSort'],
});

const steps = [
  { icon: Inbox, label: 'Vi modtager din besked', done: true },
  { icon: Clock, label: 'Vi gennemgår den, typisk inden for 24 timer', done: false },
  { icon: CheckCircle2, label: 'Du får svar direkte på din email', done: false },
];

const supportTopics = [
  { icon: MessageCircle, label: 'Generelt', detail: 'Spørgsmål, feedback eller noget der ikke passer i de andre felter.', href: '/support?category=general#support-form' },
  { icon: Bug, label: 'Fejl', detail: 'Noget virker ikke, eller du har fundet en bug.', href: '/support?category=bug#support-form' },
  { icon: CreditCard, label: 'Betaling', detail: 'Spørgsmål om pris, abonnement eller kvittering.', href: '/support?category=billing#support-form' },
  { icon: Sparkles, label: 'Feature', detail: 'Ideer til noget der kan gøre LifeSort bedre.', href: '/support?category=feature#support-form' },
  { icon: UserCircle, label: 'Konto', detail: 'Login, adgang, dataeksport eller sletning.', href: '/support?category=account#support-form' },
];

const trustItems = [
  { icon: ShieldCheck, label: 'Sikkert behandlet', detail: 'Din henvendelse lander i vores interne supportpanel.' },
  { icon: LockKeyhole, label: 'Privacy først', detail: 'Supportdata opbevares kun så længe det er nødvendigt.' },
  { icon: MessageCircle, label: 'Menneskeligt svar', detail: 'Du får svar fra teamet, ikke en automatisk støjmaskine.' },
];

export default function SupportPage() {
  return (
    <>
      <PublicHeader />
      <main id="main-content" className="flex-1">
        <section className="relative overflow-hidden bg-[#16130F]">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(244,63,94,0.22),transparent_34%),linear-gradient(135deg,rgba(255,255,255,0.08),transparent_42%)]" />
          <div className="relative mx-auto grid max-w-5xl grid-cols-1 items-end gap-10 px-6 py-16 sm:py-20 lg:grid-cols-[1fr_320px]">
            <div className="max-w-2xl text-center lg:text-left">
              <div className="mx-auto inline-flex items-center gap-1.5 rounded-full border border-white/10 bg-white/10 px-3 py-1 text-xs font-semibold text-rose-100 lg:mx-0">
                <Clock size={13} />
                Typisk svar inden for 24 timer
              </div>
              <h1 className="font-display mt-6 text-4xl font-semibold leading-tight text-white sm:text-5xl">
                Support, når noget skal føles trygt igen
              </h1>
              <p className="mx-auto mt-4 max-w-xl text-sm leading-7 text-stone-300 lg:mx-0">
                Skriv til os om fejl, konto, betaling, data eller ideer til LifeSort. Vi samler henvendelsen i supportpanelet og svarer direkte på din email.
              </p>
            </div>

            <div className="rounded-2xl border border-white/10 bg-white/[0.06] p-5 shadow-2xl shadow-stone-950/20 backdrop-blur">
              <div className="flex items-center gap-3">
                <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-rose-500 text-white shadow-lg shadow-rose-950/20">
                  <LifeBuoy className="h-5 w-5" strokeWidth={2.2} />
                </div>
                <div>
                  <p className="text-sm font-bold text-white">LifeSort Support</p>
                  <p className="text-xs text-stone-400">Fejl, konto og feedback</p>
                </div>
              </div>
              <div className="mt-5 grid grid-cols-2 gap-3 text-center">
                <div className="rounded-xl bg-white/10 p-3">
                  <p className="text-2xl font-bold text-white">24t</p>
                  <p className="text-[11px] font-medium text-stone-400">typisk svartid</p>
                </div>
                <div className="rounded-xl bg-white/10 p-3">
                  <p className="text-2xl font-bold text-white">5</p>
                  <p className="text-[11px] font-medium text-stone-400">kategorier</p>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section className="border-b border-stone-200 bg-white">
          <div className="mx-auto grid max-w-5xl grid-cols-1 gap-3 px-6 py-5 sm:grid-cols-3">
            {trustItems.map((item) => {
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

        <section id="support-topics" className="scroll-mt-24 mx-auto max-w-5xl px-6 pt-12">
          <ScrollReveal>
            <div className="mb-4">
              <p className="text-xs font-bold uppercase tracking-wider text-rose-500">Vælg kategori</p>
              <h2 className="mt-2 text-2xl font-bold text-stone-900">Hvad handler det om?</h2>
            </div>
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-5">
              {supportTopics.map((topic) => {
                const Icon = topic.icon;
                return (
                  <a
                    key={topic.label}
                    href={topic.href}
                    className="group rounded-2xl border border-stone-200 bg-white p-4 shadow-sm shadow-stone-900/5 transition hover:-translate-y-0.5 hover:border-rose-200 hover:shadow-md"
                  >
                    <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-rose-50 text-rose-600 transition group-hover:bg-rose-100">
                      <Icon size={18} />
                    </div>
                    <p className="mt-4 text-sm font-bold text-stone-900">{topic.label}</p>
                    <p className="mt-1 text-xs leading-relaxed text-stone-500">{topic.detail}</p>
                  </a>
                );
              })}
            </div>
          </ScrollReveal>
        </section>

        <div className="mx-auto grid max-w-5xl grid-cols-1 gap-8 px-6 py-12 lg:grid-cols-[minmax(0,1fr)_300px]">
          <div id="support-form" className="scroll-mt-24">
            <ScrollReveal>
              <SupportForm />
            </ScrollReveal>
          </div>

          <ScrollReveal delay={100} className="flex flex-col gap-4">
            <div className="rounded-2xl border border-stone-200 bg-white p-5">
              <p className="text-xs font-bold uppercase tracking-wider text-stone-400">Hvad sker der nu?</p>
              <div className="mt-4 flex flex-col">
                {steps.map((step, i) => {
                  const Icon = step.icon;
                  return (
                    <div key={step.label} className="flex items-start gap-3">
                      <div className="flex flex-col items-center">
                        <div className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full ${
                          step.done ? 'bg-rose-100 text-rose-600' : 'bg-stone-100 text-stone-400'
                        }`}>
                          <Icon size={14} />
                        </div>
                        {i < steps.length - 1 && <div className="my-1 h-6 w-px bg-stone-200" />}
                      </div>
                      <p className="mt-1.5 text-xs leading-relaxed text-stone-600">{step.label}</p>
                    </div>
                  );
                })}
              </div>
            </div>

            <Link
              href="/faq"
              className="group flex items-center gap-3 rounded-2xl border border-stone-200 bg-gradient-to-br from-rose-50 via-stone-50 to-amber-50 p-5 transition hover:border-rose-200"
            >
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-white shadow-sm">
                <BookOpen className="h-4 w-4 text-rose-600" />
              </div>
              <div className="flex-1">
                <p className="text-sm font-bold text-stone-900">Tjek FAQ først</p>
                <p className="text-xs text-stone-600">Måske står svaret der allerede</p>
              </div>
              <ArrowRight size={15} className="shrink-0 text-stone-400 transition group-hover:translate-x-0.5 group-hover:text-stone-900" />
            </Link>

            <div className="rounded-2xl border border-stone-200 bg-white p-5">
              <div className="flex items-start gap-3">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-stone-100 text-stone-600">
                  <ShieldCheck size={17} />
                </div>
                <div>
                  <p className="text-sm font-bold text-stone-900">Dine data i support</p>
                  <p className="mt-1 text-xs leading-relaxed text-stone-600">
                    Vi bruger kun oplysningerne til at behandle din henvendelse. Lukkede supportsager ryddes automatisk efter retention-perioden.
                  </p>
                  <Link href="/privacy" className="mt-3 inline-flex items-center gap-1 text-xs font-semibold text-rose-600 hover:text-rose-700">
                    Læs privatlivspolitik
                    <ArrowRight size={12} />
                  </Link>
                </div>
              </div>
            </div>
          </ScrollReveal>
        </div>
      </main>
      <BackToTop />
      <PublicFooter />
    </>
  );
}
