import Link from 'next/link';
import { LifeBuoy, Clock, BookOpen, Inbox, CheckCircle2, ArrowRight } from 'lucide-react';
import { PublicHeader } from '@/components/public-header';
import { PublicFooter } from '@/components/public-footer';
import { SupportForm } from '@/components/support-form';
import { ScrollReveal } from '@/components/scroll-reveal';

export const metadata = {
  title: 'Kontakt support',
  description: 'Skriv til LifeSort-teamet — vi svarer typisk inden for 24 timer.',
};

const steps = [
  { icon: Inbox, label: 'Vi modtager din besked', done: true },
  { icon: Clock, label: 'Vi gennemgår den, typisk inden for 24 timer', done: false },
  { icon: CheckCircle2, label: 'Du får svar direkte på din email', done: false },
];

export default function SupportPage() {
  return (
    <>
      <PublicHeader />
      <main className="flex-1">
        <section className="relative overflow-hidden bg-[#16130F]">
        <div className="pointer-events-none absolute -top-20 left-0 h-96 w-96 rounded-full bg-rose-600/20 blur-[100px] [animation:drift_16s_ease-in-out_infinite]" />
        <div className="pointer-events-none absolute bottom-0 right-0 h-56 w-56 rounded-full bg-amber-500/10 blur-[90px] [animation:drift_20s_ease-in-out_infinite_reverse]" />

          <div className="relative mx-auto max-w-2xl px-6 py-20 text-center">
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-white/10">
              <LifeBuoy className="h-7 w-7 text-rose-300" strokeWidth={2.2} />
            </div>
            <h1 className="font-display mt-6 text-4xl font-semibold text-white sm:text-5xl">
              Vi er her for at hjælpe
            </h1>
            <p className="mx-auto mt-4 max-w-md text-stone-300">
              Skriv til os om alt fra en fejl, du er stødt på, til et generelt spørgsmål — vi svarer så hurtigt, vi kan.
            </p>
          </div>
        </section>

        <div className="mx-auto grid max-w-4xl grid-cols-1 gap-8 px-6 py-14 lg:grid-cols-[1fr_260px]">
          <ScrollReveal>
            <SupportForm />
          </ScrollReveal>

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
          </ScrollReveal>
        </div>
      </main>
      <PublicFooter />
    </>
  );
}