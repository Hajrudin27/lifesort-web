import { redirect } from 'next/navigation';
import { LayoutDashboard, Tag, BookOpen, Percent, Inbox, Users, Milestone, Activity, ShieldCheck, ChefHat, HeartPulse, DatabaseBackup, Copy, Rocket } from 'lucide-react';
import { createClient } from '@/lib/supabase/server';
import { isAdminRole, CONTENT_ROLES, CUSTOMER_DATA_ROLES } from '@/lib/admin-roles';
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

const ROLE_LABEL = {
  owner: 'Owner',
  editor: 'Editor',
  support: 'Support',
} as const;

function NavSection({ label }: { label: string }) {
  return (
    <div className="mt-6 mb-2 flex items-center gap-2 px-3">
      <span className="h-px flex-1 bg-white/10" />
      <p className="text-[10px] font-bold uppercase tracking-wider text-stone-500">{label}</p>
      <span className="h-px flex-1 bg-white/10" />
    </div>
  );
}

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) redirect('/admin/login');

  const { data: adminRow } = await supabase
    .from('admin_users')
    .select('full_name, role')
    .eq('id', user.id)
    .single();

  if (!adminRow || !isAdminRole(adminRow.role)) redirect('/admin/login');

  const role = adminRow.role;
  const isOwner = role === 'owner';
  const canEditContent = CONTENT_ROLES.includes(role);
  const canSeeCustomerData = CUSTOMER_DATA_ROLES.includes(role);

  // Tælleren hentes kun hvis rollen må se supportsager — ellers ville badgen vise 0 og
  // give indtryk af at indbakken var tom.
  const { count: openTicketsCount } = canSeeCustomerData
    ? await supabase
        .from('support_tickets')
        .select('id', { count: 'exact', head: true })
        .eq('status', 'open')
    : { count: null };

  const initials = adminRow.full_name
    .split(' ')
    .map((n: string) => n[0])
    .slice(0, 2)
    .join('')
    .toUpperCase();

  return (
    <ThemeProvider>
      <CommandPalette role={role} />
      <aside className="sticky top-0 flex h-screen w-64 shrink-0 flex-col border-r border-white/10 bg-stone-950 p-4 text-stone-300 shadow-2xl shadow-stone-950/10">
        <div className="mb-6 rounded-2xl border border-white/10 bg-white/[0.04] p-3 shadow-inner shadow-white/[0.03]">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-rose-500 to-rose-600 shadow-lg shadow-rose-950/30">
              <span className="text-sm font-bold text-white">L</span>
            </div>
            <div className="min-w-0">
              <span className="block text-sm font-bold text-white">LifeSort</span>
              <span className="block text-[11px] font-medium text-stone-500">Admin control</span>
            </div>
          </div>
        </div>

        <SearchTriggerButton />

        <nav className="min-h-0 flex-1 space-y-1 overflow-y-auto pr-1">
          <AdminNavLink href="/admin/dashboard" icon={<LayoutDashboard size={17} />} label="Oversigt" />
          {isOwner && <AdminNavLink href="/admin/launch" icon={<Rocket size={17} />} label="Launch" />}

          <NavSection label="Projekt" />
          {canEditContent && <AdminNavLink href="/admin/timeline" icon={<Milestone size={17} />} label="Tidslinje" />}
          <AdminNavLink href="/admin/activity" icon={<Activity size={17} />} label="Aktivitet" />
          {isOwner && (
            <>
              <AdminNavLink href="/admin/admins" icon={<ShieldCheck size={17} />} label="Admins" />
              <AdminNavLink href="/admin/settings/health" icon={<Activity size={17} />} label="Sundhedstjek" />
              <AdminNavLink href="/admin/settings/export" icon={<DatabaseBackup size={17} />} label="Eksportér data" />
            </>
          )}

          {canEditContent && (
            <>
              <NavSection label="Mad" />
              <AdminNavLink href="/admin/food/prices" icon={<Tag size={17} />} label="Standardpriser" />
              <AdminNavLink href="/admin/food/duplicates" icon={<Copy size={17} />} label="Dublet-tjek" />
              <AdminNavLink href="/admin/food/offers" icon={<Percent size={17} />} label="Ugens tilbud" />
              <AdminNavLink href="/admin/food/recipes" icon={<BookOpen size={17} />} label="Opskrifter" />
              <AdminNavLink href="/admin/food/preview" icon={<ChefHat size={17} />} label="Forhåndsvis madplan" />

              <NavSection label="Sundhed" />
              <AdminNavLink href="/admin/health/conditions" icon={<HeartPulse size={17} />} label="Tilstande" />
              <AdminNavLink href="/admin/health/symptoms" icon={<HeartPulse size={17} />} label="Symptomordbog" />
            </>
          )}

          {canSeeCustomerData && (
            <>
              <NavSection label="Support" />
              <AdminNavLink href="/admin/tickets" icon={<Inbox size={17} />} label="Supportsager" badge={openTicketsCount ?? 0} />

              <NavSection label="Hjemmeside" />
              <AdminNavLink href="/admin/waitlist" icon={<Users size={17} />} label="Venteliste" />
            </>
          )}
        </nav>

        <div className="mt-4 rounded-2xl border border-white/10 bg-white/[0.04] p-3 shadow-inner shadow-white/[0.03]">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-rose-500/15 text-xs font-bold text-rose-200 ring-1 ring-rose-400/20">
              {initials}
            </div>
            <div className="min-w-0 flex-1">
              <p className="truncate text-xs font-semibold text-white">{adminRow.full_name}</p>
              <p className="mt-0.5 text-[11px] text-stone-500">{ROLE_LABEL[role]}</p>
            </div>
          </div>
          <div className="mt-3 flex items-center justify-between border-t border-white/10 pt-2">
            <span className="text-[10px] font-medium uppercase tracking-wider text-stone-600">Session</span>
            <div className="flex items-center gap-1">
              <ThemeToggle />
              <SignOutButton />
            </div>
          </div>
        </div>
      </aside>

      <main className="min-w-0 flex-1 overflow-y-auto bg-stone-100/80 dark:bg-stone-950">
        <div className="mx-auto min-h-screen max-w-6xl px-6 py-8 lg:px-8">
          <AdminUserProvider user={{ id: user.id, name: adminRow.full_name }}>
            {children}
          </AdminUserProvider>
        </div>
      </main>
    </ThemeProvider>
  );
}
