import Link from 'next/link';
import { AlertTriangle, ArrowRight, CheckCircle2, XCircle } from 'lucide-react';
import { PublicHeader } from '@/components/public-header';
import { PublicFooter } from '@/components/public-footer';
import { createPageMetadata } from '@/lib/seo';

export const metadata = createPageMetadata({
  title: 'Tilmelding bekræftet',
  description: 'Statusside for bekræftelse af din LifeSort venteliste-tilmelding.',
  path: '/waitlist-confirmed',
});

export default async function WaitlistConfirmedPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string }>;
}) {
  const { status } = await searchParams;
  const isOk = status === 'ok';
  const isError = status === 'error';

  return (
    <>
      <PublicHeader />
      <main id="main-content" className="flex flex-1 items-center justify-center px-6 py-24">
        <div className="mx-auto max-w-sm text-center">
          {isOk ? (
            <>
              <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-emerald-100">
                <CheckCircle2 className="h-7 w-7 text-emerald-600" />
              </div>
              <h1 className="mt-5 text-2xl font-bold text-stone-900">Du er bekræftet!</h1>
              <p className="mt-2 text-sm text-stone-600">
                Din email er nu bekræftet på ventelisten til LifeSort. Vi skriver til dig, så snart appen er klar.
              </p>
              <Link
                href="/"
                className="mt-6 inline-flex items-center gap-1.5 rounded-xl bg-stone-900 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-stone-800"
              >
                Til forsiden <ArrowRight size={14} />
              </Link>
            </>
          ) : (
            <>
              <div className={`mx-auto flex h-14 w-14 items-center justify-center rounded-full ${isError ? 'bg-amber-100' : 'bg-red-100'}`}>
                {isError ? (
                  <AlertTriangle className="h-7 w-7 text-amber-600" />
                ) : (
                  <XCircle className="h-7 w-7 text-red-600" />
                )}
              </div>
              <h1 className="mt-5 text-2xl font-bold text-stone-900">
                {isError ? 'Vi kunne ikke bekræfte lige nu' : 'Linket virkede ikke'}
              </h1>
              <p className="mt-2 text-sm text-stone-600">
                {isError
                  ? 'Der opstod en midlertidig fejl. Prøv linket igen om lidt, eller skriv til support hvis det fortsætter.'
                  : 'Bekræftelseslinket er enten allerede brugt eller ugyldigt. Tilmeld dig gerne igen fra forsiden.'}
              </p>
              <div className="mt-6 flex flex-col items-center justify-center gap-3 sm:flex-row">
                <Link
                  href="/"
                  className="inline-flex w-full items-center justify-center gap-1.5 rounded-xl bg-stone-900 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-stone-800 sm:w-auto"
                >
                  Til forsiden <ArrowRight size={14} />
                </Link>
                <Link
                  href="/support?category=account"
                  className="inline-flex w-full items-center justify-center rounded-xl border border-stone-200 bg-white px-4 py-2.5 text-sm font-semibold text-stone-700 transition hover:bg-stone-50 sm:w-auto"
                >
                  Kontakt support
                </Link>
              </div>
            </>
          )}
        </div>
      </main>
      <PublicFooter />
    </>
  );
}
