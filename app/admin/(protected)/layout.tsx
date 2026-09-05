import { redirect } from 'next/navigation';
import { LayoutDashboard, Tag, BookOpen, Percent, Inbox, Users, Milestone, Activity, ShieldCheck, ChefHat, HeartPulse, DatabaseBackup, Copy } from 'lucide-react';
import { createClient } from '@/lib/supabase/server';
import SignOutButton from './sign-out-button';
import { AdminUserProvider } from '@/components/admin-user-context';
import { ThemeProvider } from '@/components/theme-provider';
import { ThemeToggle } from '@/components/theme-toggle';
import { AdminNavLink } from '@/components/admin-nav-link';
import { CommandPalette } from '@/components/command-palette';
import { SearchTriggerButton } from '@/components/search-trigger-button';

export const metadata = {
  title: 'Admin',
};

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) redirect('/admin/login');

  const { data: adminRow } = await supabase
    .from('admin_users')
    .select('full_name, role')
    .eq('id', user.id)
    .single();

  if (!adminRow) redirect('/admin/login');

  const { count: openTicketsCount } = await supabase
    .from('support_tickets')
    .select('id', { count: 'exact', head: true })
    .eq('status', 'open');

  const initials = adminRow.full_name
    .split(' ')
    .map((n: string) => n[0])
    .slice(0, 2)
    .join('')
    .toUpperCase();

  return (
    <ThemeProvider>
      <CommandPalette />
      <aside className="flex w-60 flex-col bg-stone-900 p-4 text-stone-300">
        <div className="mb-8 flex items-center gap-2 px-2 pt-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-rose-500 to-rose-600">
            <span className="text-sm font-bold text-white">L</span>
          </div>
          <span className="text-sm font-bold text-white">LifeSort Admin</span>
        </div>

        <SearchTriggerButton />

        <nav className="flex-1 space-y-1">
          <AdminNavLink href="/admin/dashboard" icon={<LayoutDashboard size={17} />} label="Oversigt" />

          <p className="mt-5 mb-2 px-3 text-[11px] font-semibold tracking-wider text-stone-500 uppercase">
            Projekt
          </p>
          <AdminNavLink href="/admin/timeline" icon={<Milestone size={17} />} label="Tidslinje" />
          <AdminNavLink href="/admin/activity" icon={<Activity size={17} />} label="Aktivitet" />
          <AdminNavLink href="/admin/admins" icon={<ShieldCheck size={17} />} label="Admins" />
          <AdminNavLink href="/admin/settings/health" icon={<Activity size={17} />} label="Sundhedstjek" />
          <AdminNavLink href="/admin/settings/export" icon={<DatabaseBackup size={17} />} label="Eksportér data" />

          <p className="mt-5 mb-2 px-3 text-[11px] font-semibold tracking-wider text-stone-500 uppercase">
            Mad
          </p>
          <AdminNavLink href="/admin/food/prices" icon={<Tag size={17} />} label="Standardpriser" />
          <AdminNavLink href="/admin/food/duplicates" icon={<Copy size={17} />} label="Dublet-tjek" />
          <AdminNavLink href="/admin/food/offers" icon={<Percent size={17} />} label="Ugens tilbud" />
          <AdminNavLink href="/admin/food/recipes" icon={<BookOpen size={17} />} label="Opskrifter" />
          <AdminNavLink href="/admin/food/preview" icon={<ChefHat size={17} />} label="Forhåndsvis madplan" />

          <p className="mt-5 mb-2 px-3 text-[11px] font-semibold tracking-wider text-stone-500 uppercase">
            Sundhed
          </p>
          <AdminNavLink href="/admin/health/conditions" icon={<HeartPulse size={17} />} label="Tilstande" />
          <AdminNavLink href="/admin/health/symptoms" icon={<HeartPulse size={17} />} label="Symptomordbog" />

          <p className="mt-5 mb-2 px-3 text-[11px] font-semibold tracking-wider text-stone-500 uppercase">
            Support
          </p>
          <AdminNavLink href="/admin/tickets" icon={<Inbox size={17} />} label="Supportsager" badge={openTicketsCount ?? 0} />

          <p className="mt-5 mb-2 px-3 text-[11px] font-semibold tracking-wider text-stone-500 uppercase">
            Hjemmeside
          </p>
          <AdminNavLink href="/admin/waitlist" icon={<Users size={17} />} label="Venteliste" />
        </nav>

        <div className="mt-6 flex items-center gap-3 rounded-xl bg-stone-800/70 p-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-full bg-rose-500/20 text-xs font-bold text-rose-300">
            {initials}
          </div>
          <div className="min-w-0 flex-1">
            <p className="truncate text-xs font-semibold text-white">{adminRow.full_name}</p>
            <p className="text-[11px] capitalize text-stone-400">{adminRow.role}</p>
          </div>
          <ThemeToggle />
          <SignOutButton />
        </div>
      </aside>

      <main className="flex-1 overflow-y-auto p-8">
        <div className="mx-auto max-w-5xl">
          <AdminUserProvider user={{ id: user.id, name: adminRow.full_name }}>
            {children}
          </AdminUserProvider>
        </div>
      </main>
    </ThemeProvider>
  );
}