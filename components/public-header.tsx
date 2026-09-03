'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Menu, X } from 'lucide-react';

export function PublicHeader() {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <header className="sticky top-0 z-40 border-b border-stone-200 bg-white/80 backdrop-blur-sm">
      <div className="mx-auto flex max-w-5xl items-center justify-between px-6 py-4">
        <Link href="/" className="flex items-center gap-2" onClick={() => setIsOpen(false)}>
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-rose-500 to-rose-600">
            <span className="text-sm font-bold text-white">L</span>
          </div>
          <span className="text-sm font-bold text-stone-900">LifeSort</span>
        </Link>

        <nav className="hidden items-center gap-6 text-sm font-medium text-stone-600 sm:flex">
          <Link href="/" className="transition hover:text-stone-900">Forside</Link>
          <Link href="/faq" className="transition hover:text-stone-900">FAQ</Link>
          <Link href="/support" className="transition hover:text-stone-900">Support</Link>
        </nav>

        <button
          onClick={() => setIsOpen(true)}
          className="flex h-9 w-9 items-center justify-center rounded-lg text-stone-600 transition hover:bg-stone-100 sm:hidden"
          aria-label="Åbn menu"
        >
          <Menu size={20} />
        </button>
      </div>

      {isOpen && (
        <div className="fixed inset-0 z-50 sm:hidden">
          <div className="absolute inset-0 bg-stone-900/40 backdrop-blur-sm" onClick={() => setIsOpen(false)} />
          <div className="absolute right-0 top-0 flex h-full w-64 flex-col bg-white p-6 shadow-2xl [animation:slide-in_0.25s_ease-out]">
            <div className="flex items-center justify-between">
              <span className="text-sm font-bold text-stone-900">Menu</span>
              <button
                onClick={() => setIsOpen(false)}
                className="flex h-8 w-8 items-center justify-center rounded-lg text-stone-400 transition hover:bg-stone-100"
                aria-label="Luk menu"
              >
                <X size={18} />
              </button>
            </div>
            <nav className="mt-8 flex flex-col gap-1">
              <Link href="/" onClick={() => setIsOpen(false)} className="rounded-xl px-3 py-2.5 text-sm font-medium text-stone-700 transition hover:bg-stone-50">
                Forside
              </Link>
              <Link href="/faq" onClick={() => setIsOpen(false)} className="rounded-xl px-3 py-2.5 text-sm font-medium text-stone-700 transition hover:bg-stone-50">
                FAQ
              </Link>
              <Link href="/support" onClick={() => setIsOpen(false)} className="rounded-xl px-3 py-2.5 text-sm font-medium text-stone-700 transition hover:bg-stone-50">
                Support
              </Link>
            </nav>
          </div>
        </div>
      )}
    </header>
  );
}