'use client';

import { useEffect, useState } from 'react';

type TocItem = { id: string; label: string };

export function TableOfContents({ items }: { items: TocItem[] }) {
  const [activeId, setActiveId] = useState(items[0]?.id);

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) setActiveId(entry.target.id);
        });
      },
      { rootMargin: '-20% 0px -70% 0px' }
    );

    items.forEach((item) => {
      const el = document.getElementById(item.id);
      if (el) observer.observe(el);
    });

    return () => observer.disconnect();
  }, [items]);

  return (
    <nav className="sticky top-24 hidden max-h-[calc(100vh-8rem)] w-48 shrink-0 overflow-y-auto lg:block">
      <p className="text-xs font-bold uppercase tracking-wider text-stone-400">Indhold</p>
      <ul className="mt-3 flex flex-col gap-1 border-l border-stone-200">
        {items.map((item) => (
          <li key={item.id}>
            
             <a href={`#${item.id}`}
              className={`block border-l-2 py-1 pl-3 text-xs transition ${
                activeId === item.id
                  ? '-ml-px border-rose-500 font-semibold text-rose-600'
                  : 'border-transparent text-stone-500 hover:text-stone-900'
              }`}
            >
              {item.label}
            </a>
          </li>
        ))}
      </ul>
    </nav>
  );
}