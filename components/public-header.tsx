import Link from 'next/link';

export function PublicHeader() {
  return (
    <header className="sticky top-0 z-40 border-b border-stone-200 bg-white/80 backdrop-blur-sm">
      <div className="mx-auto flex max-w-5xl items-center justify-between px-6 py-4">
        <Link href="/" className="flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-rose-500 to-rose-600">
            <span className="text-sm font-bold text-white">L</span>
          </div>
          <span className="text-sm font-bold text-stone-900">LifeSort</span>
        </Link>
        <nav className="flex items-center gap-6 text-sm font-medium text-stone-600">
          <Link href="/" className="transition hover:text-stone-900">Forside</Link>
          <Link href="/faq" className="transition hover:text-stone-900">FAQ</Link>
          <Link href="/support" className="transition hover:text-stone-900">Support</Link>
        </nav>
      </div>
    </header>
  );
}