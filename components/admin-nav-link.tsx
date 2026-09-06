'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

export function AdminNavLink({
  href,
  icon,
  label,
  badge,
}: {
  href: string;
  icon: React.ReactNode;
  label: string;
  badge?: number;
}) {
  const pathname = usePathname();
  const isActive = pathname === href || pathname.startsWith(`${href}/`);

  return (
    <Link
      href={href}
      className={`group relative flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition ${
        isActive
          ? 'bg-white/10 text-white shadow-sm shadow-black/10'
          : 'text-stone-400 hover:bg-white/5 hover:text-stone-100'
      }`}
    >
      {isActive && <span className="absolute left-0 top-1/2 h-5 w-0.5 -translate-y-1/2 rounded-full bg-rose-400" />}
      <span className={`shrink-0 transition ${isActive ? 'text-rose-300' : 'text-stone-500 group-hover:text-stone-300'}`}>
        {icon}
      </span>
      <span className="flex-1">{label}</span>
      {!!badge && (
        <span className="rounded-full bg-rose-500 px-1.5 py-0.5 text-[10px] font-bold leading-none text-white shadow-sm shadow-rose-950/20">{badge}</span>
      )}
    </Link>
  );
}
