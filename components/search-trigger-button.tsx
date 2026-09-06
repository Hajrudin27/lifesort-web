'use client';

import { Search } from 'lucide-react';

export function SearchTriggerButton() {
  return (
    <button
      onClick={() => window.dispatchEvent(new KeyboardEvent('keydown', { key: 'k', metaKey: true }))}
      className="mb-5 flex w-full items-center gap-2 rounded-lg border border-white/10 bg-white/[0.04] px-3 py-2.5 text-sm text-stone-400 shadow-inner shadow-white/[0.03] transition hover:border-white/15 hover:bg-white/[0.07] hover:text-stone-200"
    >
      <Search size={14} />
      <span className="flex-1 text-left">Søg...</span>
      <kbd className="rounded border border-white/10 bg-stone-950/30 px-1.5 py-0.5 text-[10px] font-medium text-stone-500">⌘K</kbd>
    </button>
  );
}
