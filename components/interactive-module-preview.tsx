'use client';

import Link from 'next/link';
import { useState } from 'react';
import { ArrowRight, CheckCircle2, ChevronRight } from 'lucide-react';
import { modules } from '@/lib/modules-content';

const SCREEN_DETAILS: Record<string, { eyebrow: string; headline: string; metric: string; subMetric: string; tasks: string[] }> = {
  madplan: {
    eyebrow: 'Uge 38',
    headline: 'Madplan klar',
    metric: '420 kr.',
    subMetric: 'af 600 kr. brugt',
    tasks: ['Kylling i karry', 'Indkøb sorteret efter butik', '2 tilbud brugt automatisk'],
  },
  oekonomi: {
    eyebrow: 'September',
    headline: 'Budget i balance',
    metric: '68%',
    subMetric: 'af månedens budget',
    tasks: ['Husleje betalt', 'Kvittering gemt', '+420 kr. mod opsparing'],
  },
  karriere: {
    eyebrow: 'Jobsøgning',
    headline: '3 aktive spor',
    metric: '2',
    subMetric: 'opfølgninger denne uge',
    tasks: ['Frontend-udvikler afventer svar', 'CV opdateret', 'Samtale på torsdag'],
  },
  cyklus: {
    eyebrow: 'Privat log',
    headline: 'Mønster fundet',
    metric: 'Dag 14',
    subMetric: 'normal fase',
    tasks: ['Symptomer logget', 'Næste cyklus estimeret', 'Opslagsværk klar'],
  },
  vaner: {
    eyebrow: 'I dag',
    headline: 'Streak holder',
    metric: '12',
    subMetric: 'dage i træk',
    tasks: ['Læs 10 minutter', 'Drik vand', 'Skærmfri aften'],
  },
  hjemmet: {
    eyebrow: 'Hjemmet',
    headline: 'Opgaver fordelt',
    metric: '4/6',
    subMetric: 'opgaver klaret',
    tasks: ['Støvsuge - Walids tur', 'Indkøbsliste delt', 'Rotering aktiv'],
  },
  livsmaal: {
    eyebrow: 'Livsmål',
    headline: 'Målet tager form',
    metric: '72%',
    subMetric: 'af opsparingsmålet',
    tasks: ['Delmål: billetter booket', 'Fremdrift følges over tid', 'Adskilt fra dagens liste'],
  },
  goeremaal: {
    eyebrow: 'I dag',
    headline: '2 af 5 klaret',
    metric: '2/5',
    subMetric: 'gøremål i dag',
    tasks: ['Ring til tandlægen — høj', 'Aflever pakke — i morgen', 'Resten venter pænt'],
  },
  rejser: {
    eyebrow: 'Om 12 dage',
    headline: 'Turen er planlagt',
    metric: '6/10',
    subMetric: 'pakket',
    tasks: ['Pas og billetter tjekket', 'Pakkeliste delt', 'Påmindelse før afgang'],
  },
  garantier: {
    eyebrow: 'Garantier',
    headline: 'Udløb om 45 dage',
    metric: '45',
    subMetric: 'dage til udløb',
    tasks: ['Vaskemaskine — kvittering gemt', 'Påmindelse før udløb', 'Ét sted at slå op'],
  },
};

export function InteractiveModulePreview() {
  const [activeSlug, setActiveSlug] = useState(modules[0].slug);
  const active = modules.find((module) => module.slug === activeSlug) ?? modules[0];
  const Icon = active.icon;
  const screen = SCREEN_DETAILS[active.slug] ?? {
    eyebrow: 'LifeSort',
    headline: active.title,
    metric: active.previewLines[0]?.value ?? 'Klar',
    subMetric: active.tagline,
    tasks: active.highlights.slice(0, 3),
  };
  const progress = active.previewBar ?? 64;

  return (
    <section className="bg-[#FBF7F1]">
      <div className="mx-auto max-w-6xl px-6 py-20">
        <div className="grid grid-cols-1 items-center gap-12 lg:grid-cols-[1.05fr_0.95fr]">
          <div>
            <p className="text-xs font-bold uppercase tracking-wide text-rose-600">Modulerne</p>
            <h2 className="font-display mt-3 text-3xl font-semibold leading-tight text-stone-900 sm:text-4xl">
              Se hvordan LifeSort samler hverdagen, modul for modul.
            </h2>
            <p className="mt-3 max-w-2xl text-sm leading-relaxed text-stone-600">
              Vælg et modul for at se, hvordan det føles i brug — og klik videre, hvis du vil læse mere om netop det.
            </p>

            <div className="mt-8 grid grid-cols-1 gap-3 sm:grid-cols-2">
              {modules.map((module) => {
                const ModuleIcon = module.icon;
                const isActive = module.slug === active.slug;

                return (
                  <button
                    key={module.slug}
                    type="button"
                    onClick={() => setActiveSlug(module.slug)}
                    className={`group flex min-h-24 items-start gap-3 rounded-2xl border p-4 text-left transition ${
                      isActive
                        ? 'border-stone-900 bg-white shadow-lg shadow-stone-900/10'
                        : 'border-stone-200 bg-white/60 hover:border-stone-300 hover:bg-white'
                    }`}
                    aria-pressed={isActive}
                  >
                    <span className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${module.tint}`}>
                      <ModuleIcon size={18} />
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="block text-sm font-bold text-stone-900">{module.title}</span>
                      <span className="mt-1 block text-xs leading-relaxed text-stone-500">{module.tagline}</span>
                    </span>
                    <ChevronRight
                      size={16}
                      className={`mt-1 shrink-0 transition ${isActive ? 'text-stone-900' : 'text-stone-300 group-hover:text-stone-500'}`}
                    />
                  </button>
                );
              })}
            </div>

            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
              <Link
                href={`/modules/${active.slug}`}
                className="inline-flex items-center justify-center gap-2 rounded-xl bg-stone-900 px-5 py-3 text-sm font-semibold text-white transition hover:bg-stone-800"
              >
                Se {active.title}
                <ArrowRight size={15} />
              </Link>
              <Link
                href="/appcheck"
                className="inline-flex items-center justify-center rounded-xl border border-stone-200 bg-white px-5 py-3 text-sm font-semibold text-stone-700 transition hover:bg-stone-50"
              >
                Tjek dit app-overblik
              </Link>
            </div>
          </div>

          <div className="relative mx-auto w-full max-w-sm">
            <div className="relative mx-auto w-[275px]">
              <div className="rounded-[2.6rem] border-[7px] border-stone-900 bg-stone-900 shadow-2xl shadow-stone-900/30">
                <div className="overflow-hidden rounded-[2rem] bg-stone-50">
                  <div className="flex items-center justify-between px-5 pt-3 text-[10px] font-semibold text-stone-500">
                    <span>9:41</span>
                    <span>●●●</span>
                  </div>

                  <div className="px-5 pb-6 pt-5">
                    <div className={`inline-flex h-11 w-11 items-center justify-center rounded-2xl bg-gradient-to-br ${active.iconTint}`}>
                      <Icon className="h-5 w-5 text-white" strokeWidth={2.2} />
                    </div>
                    <p className="mt-4 text-xs font-semibold uppercase tracking-wide text-stone-400">{screen.eyebrow}</p>
                    <h3 className="font-display mt-1 text-2xl font-semibold leading-tight text-stone-950">{screen.headline}</h3>
                    <p className="mt-2 text-xs leading-relaxed text-stone-500">{active.tagline}</p>

                    <div className="mt-5 rounded-2xl bg-white p-4 shadow-sm shadow-stone-900/5">
                      <div className="flex items-end justify-between gap-3">
                        <div>
                          <p className="text-[11px] font-semibold uppercase tracking-wide text-stone-400">Status</p>
                          <p className="mt-1 text-3xl font-bold text-stone-950">{screen.metric}</p>
                          <p className="text-xs text-stone-500">{screen.subMetric}</p>
                        </div>
                        <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-stone-100 text-stone-500">
                          <CheckCircle2 size={20} />
                        </div>
                      </div>
                      <div className="mt-4 h-2 overflow-hidden rounded-full bg-stone-100">
                        <div className={`h-full rounded-full bg-gradient-to-r ${active.iconTint}`} style={{ width: `${progress}%` }} />
                      </div>
                    </div>

                    <div className="mt-3 space-y-2.5">
                      {screen.tasks.map((task) => (
                        <div key={task} className="flex items-center gap-2 rounded-xl bg-white px-3 py-2.5 shadow-sm shadow-stone-900/5">
                          <span className={`h-2 w-2 shrink-0 rounded-full bg-gradient-to-br ${active.iconTint}`} />
                          <span className="truncate text-xs font-medium text-stone-700">{task}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>

              <div className="absolute -right-28 top-48 hidden w-32 rounded-2xl bg-white p-3 shadow-xl shadow-stone-900/10 xl:block">
                <p className="text-[10px] font-bold uppercase tracking-wide text-stone-400">Næste</p>
                <p className="mt-1 text-xs font-semibold leading-snug text-stone-800">{active.highlights[0]}</p>
              </div>
              <div className="absolute -left-28 bottom-28 hidden w-32 rounded-2xl bg-white p-3 shadow-xl shadow-stone-900/10 xl:block">
                <p className="text-[10px] font-bold uppercase tracking-wide text-stone-400">Samlet</p>
                <p className="mt-1 text-xs font-semibold leading-snug text-stone-800">{active.previewLines[0]?.label ?? 'Overblik'}</p>
              </div>
            </div>
          </div>
        </div>

      </div>
    </section>
  );
}
