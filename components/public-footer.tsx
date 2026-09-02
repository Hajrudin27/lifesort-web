import Link from 'next/link';
import { CookieBanner } from '@/components/cookie-banner';

export function PublicFooter() {
  return (
    <>
      <footer className="border-t border-stone-200 bg-white">
        <div className="mx-auto max-w-5xl px-6 py-8 text-center text-xs text-stone-400">
          <p>© {new Date().getFullYear()} LifeSort. Alle rettigheder forbeholdes.</p>
          <div className="mt-3 flex items-center justify-center gap-4">
            <Link href="/privacy" className="transition hover:text-stone-500">Privatlivspolitik</Link>
            <Link href="/terms" className="transition hover:text-stone-500">Vilkår</Link>
            <Link href="/admin/login" className="text-stone-300 transition hover:text-stone-500">Admin</Link>
          </div>
        </div>
      </footer>
      <CookieBanner />
    </>
  );
}