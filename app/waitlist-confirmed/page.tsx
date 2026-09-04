import { CheckCircle2, XCircle } from 'lucide-react';
import { PublicHeader } from '@/components/public-header';
import { PublicFooter } from '@/components/public-footer';

export const metadata = {
  title: 'Tilmelding bekræftet',
};

export default async function WaitlistConfirmedPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string }>;
}) {
  const { status } = await searchParams;
  const isOk = status === 'ok';

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
            </>
          ) : (
            <>
              <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-red-100">
                <XCircle className="h-7 w-7 text-red-600" />
              </div>
              <h1 className="mt-5 text-2xl font-bold text-stone-900">Linket virkede ikke</h1>
              <p className="mt-2 text-sm text-stone-600">
                Bekræftelseslinket er enten allerede brugt eller ugyldigt. Tilmeld dig gerne igen fra forsiden.
              </p>
            </>
          )}
        </div>
      </main>
      <PublicFooter />
    </>
  );
}