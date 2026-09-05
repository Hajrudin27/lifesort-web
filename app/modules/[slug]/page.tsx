import { notFound } from 'next/navigation';
import { ArrowLeft, ArrowRight, Check, X } from 'lucide-react';
import Link from 'next/link';
import { PublicHeader } from '@/components/public-header';
import { PublicFooter } from '@/components/public-footer';
import { WaitlistCta } from '@/components/waitlist-cta';
import { modules, getModule, getAdjacentModules, faqs } from '@/lib/modules-content';
import { siteUrl } from '@/lib/site-config';

export function generateStaticParams() {
  return modules.map((m) => ({ slug: m.slug }));
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const mod = getModule(slug);
  if (!mod) return {};
  return {
    title: `${mod.title} — LifeSort`,
    description: mod.description,
  };
}

export default async function ModulePage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const mod = getModule(slug);
  if (!mod) notFound();

  const Icon = mod.icon;
  const { prev, next, position, total } = getAdjacentModules(mod.slug);
  const relatedFaqs = faqs.filter((f) => f.moduleSlug === mod.slug).slice(0, 2);

  const breadcrumbJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [
      { '@type': 'ListItem', position: 1, name: 'LifeSort', item: siteUrl },
      { '@type': 'ListItem', position: 2, name: mod.title, item: `${siteUrl}/modules/${mod.slug}` },
    ],
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbJsonLd) }}
      />
      <PublicHeader />
      <main id="main-content" className="flex-1">
        <section className="bg-[#FBF7F1]">
          <div className="mx-auto max-w-2xl px-6 py-16">
            <div className="flex items-center justify-between">
              <Link href="/" className="inline-flex items-center gap-1.5 text-sm font-medium text-stone-500 transition hover:text-stone-900">
                <ArrowLeft size={15} /> Alle moduler
              </Link>
              <span className="text-xs font-semibold text-stone-400">Modul {position} af {total}</span>
            </div>

            <div className={`mt-6 flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br ${mod.iconTint}`}>
              <Icon className="h-7 w-7 text-white" strokeWidth={2.2} />
            </div>

            <h1 className="mt-5 font-display text-3xl font-semibold text-stone-900 sm:text-4xl">{mod.title}</h1>
            <p className="mt-2 text-lg text-stone-600">{mod.tagline}</p>
            <p className="mt-6 text-sm leading-relaxed text-stone-600">{mod.description}</p>

            {/* Mini preview card — "show, don't tell" */}
            <div className="mt-8 rounded-2xl border border-stone-200 bg-white p-5 shadow-sm shadow-stone-900/5">
              <p className="text-[11px] font-bold uppercase tracking-wider text-stone-400">Sådan kan det se ud</p>
              <div className="mt-3 flex flex-col gap-2.5">
                {mod.previewLines.map((line) => (
                  <div key={line.label} className="flex items-center justify-between text-sm">
                    <span className="text-stone-500">{line.label}</span>
                    <span className="font-semibold text-stone-900">{line.value}</span>
                  </div>
                ))}
              </div>
              {typeof mod.previewBar === 'number' && (
                <div className="mt-3 h-2 w-full overflow-hidden rounded-full bg-stone-100">
                  <div className={`h-full rounded-full bg-gradient-to-r ${mod.iconTint}`} style={{ width: `${mod.previewBar}%` }} />
                </div>
              )}
            </div>

            <ul className="mt-8 flex flex-col gap-3">
              {mod.highlights.map((h) => (
                <li key={h} className="flex items-start gap-3 text-sm text-stone-700">
                  <span className={`mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full ${mod.tint}`}>
                    <Check size={12} strokeWidth={3} />
                  </span>
                  {h}
                </li>
              ))}
            </ul>

            <div className="mt-10 rounded-2xl bg-white p-6 text-center">
              <p className="text-sm font-semibold text-stone-900">Vær blandt de første til at prøve det</p>
              <WaitlistCta />
            </div>
          </div>
        </section>

        {/* 3-step walkthrough */}
        <section className="border-t border-stone-200 bg-white">
          <div className="mx-auto max-w-2xl px-6 py-14">
            <p className="text-xs font-semibold uppercase tracking-widest text-stone-400">Sådan virker det</p>
            <div className="mt-6 flex flex-col gap-6">
              {mod.steps.map((step, i) => (
                <div key={step.title} className="flex gap-4">
                  <div className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-sm font-bold ${mod.tint}`}>
                    {i + 1}
                  </div>
                  <div>
                    <p className="text-sm font-bold text-stone-900">{step.title}</p>
                    <p className="mt-1 text-sm leading-relaxed text-stone-600">{step.description}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Before / after */}
        <section className="border-t border-stone-200 bg-[#FBF7F1]">
          <div className="mx-auto max-w-2xl px-6 py-14">
            <p className="text-xs font-semibold uppercase tracking-widest text-stone-400">Uden LifeSort / Med LifeSort</p>
            <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div className="rounded-2xl border border-stone-200 bg-white p-5">
                <p className="text-xs font-bold uppercase tracking-wide text-stone-400">Uden LifeSort</p>
                <ul className="mt-3 flex flex-col gap-2.5">
                  {mod.before.map((b) => (
                    <li key={b} className="flex items-start gap-2.5 text-sm text-stone-500">
                      <X size={14} className="mt-0.5 shrink-0 text-stone-300" />
                      {b}
                    </li>
                  ))}
                </ul>
              </div>
              <div className="rounded-2xl border-2 border-emerald-200 bg-white p-5">
                <p className="text-xs font-bold uppercase tracking-wide text-emerald-700">Med LifeSort</p>
                <ul className="mt-3 flex flex-col gap-2.5">
                  {mod.after.map((a) => (
                    <li key={a} className="flex items-start gap-2.5 text-sm text-stone-700">
                      <span className={`mt-0.5 flex h-4 w-4 shrink-0 items-center justify-center rounded-full ${mod.tint}`}>
                        <Check size={9} strokeWidth={3} />
                      </span>
                      {a}
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        </section>

        {/* Related FAQ */}
        {relatedFaqs.length > 0 && (
          <section className="border-t border-stone-200 bg-white">
            <div className="mx-auto max-w-2xl px-6 py-14">
              <p className="text-xs font-semibold uppercase tracking-widest text-stone-400">Spurgt om {mod.title.toLowerCase()}</p>
              <div className="mt-5 flex flex-col gap-3">
                {relatedFaqs.map((faq) => (
                  <div key={faq.question} className="rounded-2xl border border-stone-200 p-5">
                    <p className="text-sm font-semibold text-stone-900">{faq.question}</p>
                    <p className="mt-1.5 text-sm leading-relaxed text-stone-600">{faq.answer}</p>
                  </div>
                ))}
              </div>
              <Link href="/faq" className="mt-4 inline-block text-sm font-semibold text-rose-600 underline-offset-4 hover:underline">
                Se alle spørgsmål og svar →
              </Link>
            </div>
          </section>
        )}

        {/* Prev / next module navigation */}
        <section className="border-t border-stone-200 bg-[#FBF7F1]">
          <div className="mx-auto grid max-w-2xl grid-cols-2 gap-4 px-6 py-10">
            <Link href={`/modules/${prev.slug}`} className="group flex items-center gap-3 rounded-2xl border border-stone-200 bg-white p-4 transition hover:border-stone-300">
              <ArrowLeft size={16} className="shrink-0 text-stone-400 transition group-hover:-translate-x-0.5" />
              <div className="min-w-0">
                <p className="text-[10px] font-semibold uppercase tracking-wide text-stone-400">Forrige</p>
                <p className="truncate text-sm font-bold text-stone-900">{prev.title}</p>
              </div>
            </Link>
            <Link href={`/modules/${next.slug}`} className="group flex items-center justify-end gap-3 rounded-2xl border border-stone-200 bg-white p-4 text-right transition hover:border-stone-300">
              <div className="min-w-0">
                <p className="text-[10px] font-semibold uppercase tracking-wide text-stone-400">Næste</p>
                <p className="truncate text-sm font-bold text-stone-900">{next.title}</p>
              </div>
              <ArrowRight size={16} className="shrink-0 text-stone-400 transition group-hover:translate-x-0.5" />
            </Link>
          </div>
        </section>
      </main>
      <PublicFooter />
    </>
  );
}
