'use client';

import { Search } from 'lucide-react';

export function SearchTriggerButton() {
  return (
    <button
      onClick={() => window.dispatchEvent(new KeyboardEvent('keydown', { key: 'k', metaKey: true }))}
      className="mb-5 flex items-center gap-2 rounded-xl border border-stone-700 bg-stone-800/50 px-3 py-2 text-sm text-stone-400 transition hover:bg-stone-800"
    >
      <Search size={14} />
      <span className="flex-1 text-left">Søg...</span>
      <kbd className="rounded border border-stone-700 px-1.5 py-0.5 text-[10px] font-medium">⌘K</kbd>
    </button>
  );
}