import Link from 'next/link';
import { Compass, ArrowRight } from 'lucide-react';
import { PublicHeader } from '@/components/public-header';
import { PublicFooter } from '@/components/public-footer';

export const metadata = {
  title: 'Siden findes ikke',
};

export default function NotFound() {
  return (
    <>
      <PublicHeader />
      <main className="flex flex-1 items-center justify-center px-6 py-24">
        <div className="mx-auto max-w-sm text-center">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-rose-100">
            <Compass className="h-7 w-7 text-rose-600" />
          </div>
          <p className="mt-6 text-sm font-bold uppercase tracking-widest text-rose-500">404</p>
          <h1 className="mt-2 text-2xl font-bold text-stone-900">Denne side findes ikke</h1>
          <p className="mt-2 text-sm text-stone-600">
            Linket er enten forældet, eller også har du tastet forkert. Lad os finde dig tilbage på sporet.
          </p>

          <div className="mt-8 flex flex-col items-center gap-3 sm:flex-row sm:justify-center">
            <Link
              href="/"
              className="flex w-full items-center justify-center gap-1.5 rounded-xl bg-stone-900 px-6 py-3 text-sm font-semibold text-white transition hover:bg-stone-800 sm:w-auto"
            >
              Til forsiden <ArrowRight size={14} />
            </Link>
            <Link
              href="/faq"
              className="w-full rounded-xl border border-stone-200 bg-white px-6 py-3 text-sm font-semibold text-stone-700 transition hover:bg-stone-50 sm:w-auto"
            >
              Se FAQ
            </Link>
          </div>
        </div>
      </main>
      <PublicFooter />
    </>
  );
}