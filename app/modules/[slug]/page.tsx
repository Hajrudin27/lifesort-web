import { notFound } from 'next/navigation';
import { ArrowLeft, Check } from 'lucide-react';
import Link from 'next/link';
import { PublicHeader } from '@/components/public-header';
import { PublicFooter } from '@/components/public-footer';
import { WaitlistCta } from '@/components/waitlist-cta';
import { modules, getModule } from '@/lib/modules-content';
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
  const otherModules = modules.filter((m) => m.slug !== mod.slug).slice(0, 3);

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
            <Link href="/" className="inline-flex items-center gap-1.5 text-sm font-medium text-stone-500 transition hover:text-stone-900">
              <ArrowLeft size={15} /> Alle moduler
            </Link>

            <div className={`mt-6 flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br ${mod.iconTint}`}>
              <Icon className="h-7 w-7 text-white" strokeWidth={2.2} />
            </div>

            <h1 className="mt-5 font-display text-3xl font-semibold text-stone-900 sm:text-4xl">{mod.title}</h1>
            <p className="mt-2 text-lg text-stone-600">{mod.tagline}</p>
            <p className="mt-6 text-sm leading-relaxed text-stone-600">{mod.description}</p>

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

        <section className="border-t border-stone-200 bg-white">
          <div className="mx-auto max-w-2xl px-6 py-14">
            <p className="text-xs font-semibold uppercase tracking-widest text-stone-400">Andre moduler</p>
            <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-3">
              {otherModules.map((m) => {
                const OtherIcon = m.icon;
                return (
                  <Link
                    key={m.slug}
                    href={`/modules/${m.slug}`}
                    className="flex flex-col gap-2 rounded-2xl border border-stone-200 p-4 transition hover:border-stone-300 hover:shadow-sm"
                  >
                    <div className={`flex h-8 w-8 items-center justify-center rounded-lg ${m.tint}`}>
                      <OtherIcon className="h-4 w-4" strokeWidth={2.2} />
                    </div>
                    <span className="text-sm font-semibold text-stone-900">{m.title}</span>
                  </Link>
                );
              })}
            </div>
          </div>
        </section>
      </main>
      <PublicFooter />
    </>
  );
}