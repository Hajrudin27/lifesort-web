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
      className={`flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition ${
        isActive
          ? 'bg-stone-800 text-white'
          : 'text-stone-300 hover:bg-stone-800 hover:text-white'
      }`}
    >
      {icon}
      <span className="flex-1">{label}</span>
      {!!badge && (
        <span className="rounded-full bg-rose-500 px-1.5 py-0.5 text-[10px] font-bold text-white">{badge}</span>
      )}
    </Link>
  );
}