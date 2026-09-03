import Link from 'next/link';
import { Tag, Percent, BookOpen, Store, Inbox, Milestone, Activity, ArrowRight, AlertTriangle, TrendingUp } from 'lucide-react';
import { createClient } from '@/lib/supabase/server';
import { AnimatedNumber } from '@/components/animated-number';
import { DashboardChart } from '@/components/dashboard-chart';

type TimelineOwner = 'hajrudin' | 'walid' | 'begge';

function todayStr() {
  return new Date().toISOString().split('T')[0];
}

function formatShortDate(dateStr: string) {
  return new Date(dateStr + 'T00:00:00').toLocaleDateString('da-DK', { day: 'numeric', month: 'short' });
}

function relativeTime(iso: string) {
  const diffMin = Math.round((Date.now() - new Date(iso).getTime()) / 60000);
  if (diffMin < 1) return 'lige nu';
  if (diffMin < 60) return `${diffMin} min. siden`;
  const diffHours = Math.round(diffMin / 60);
  if (diffHours < 24) return `${diffHours} t. siden`;
  const diffDays = Math.round(diffHours / 24);
  return diffDays === 1 ? 'i går' : `${diffDays} dage siden`;
}

function daysAgoIso(days: number) {
  const d = new Date();
  d.setDate(d.getDate() - days);
  return d.toISOString();
}

function buildDailySeries(
  ticketRows: { created_at: string }[],
  waitlistRows: { created_at: string }[]
) {
  const counts = new Map<string, { tickets: number; waitlist: number }>();
  for (let i = 29; i >= 0; i--) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    counts.set(d.toISOString().split('T')[0], { tickets: 0, waitlist: 0 });
  }
  ticketRows.forEach((r) => {
    const key = r.created_at.split('T')[0];
    const bucket = counts.get(key);
    if (bucket) bucket.tickets++;
  });
  waitlistRows.forEach((r) => {
    const key = r.created_at.split('T')[0];
    const bucket = counts.get(key);
    if (bucket) bucket.waitlist++;
  });
  return Array.from(counts.entries()).map(([key, v]) => ({
    date: formatShortDate(key),
    tickets: v.tickets,
    waitlist: v.waitlist,
  }));
}

const OWNER_LABEL: Record<TimelineOwner, string> = { hajrudin: 'Hajrudin', walid: 'Walid', begge: 'Begge' };

const ACTION_VERB: Record<string, string> = {
  created: 'oprettede',
  updated: 'opdaterede',
  deleted: 'slettede',
  replied: 'besvarede',
  invited: 'inviterede',
};

export default async function DashboardPage() {
  const supabase = await createClient();
  const since30 = daysAgoIso(30);

  const [
    pricesCount, offersCount, recipesCount, storesResult, openTicketsCount,
    upcomingDeadlines, recentActivity, ticketSeries, waitlistSeries,
  ] = await Promise.all([
    supabase.from('global_standard_prices').select('id', { count: 'exact', head: true }),
    supabase.from('global_offers').select('id', { count: 'exact', head: true }),
    supabase.from('global_recipes').select('id', { count: 'exact', head: true }),
    supabase.from('global_standard_prices').select('store'),
    supabase.from('support_tickets').select('id', { count: 'exact', head: true }).eq('status', 'open'),
    supabase.from('timeline_events').select('id, title, event_date, owner').neq('status', 'done')
      .order('event_date', { ascending: true }).limit(4),
    supabase.from('activity_log').select('id, actor_name, action, entity_type, entity_label, created_at')
      .order('created_at', { ascending: false }).limit(5),
    supabase.from('support_tickets').select('created_at').gte('created_at', since30),
    supabase.from('waitlist_signups').select('created_at').gte('created_at', since30),
  ]);

  const uniqueStores = new Set((storesResult.data ?? []).map((r) => r.store)).size;
  const chartData = buildDailySeries(ticketSeries.data ?? [], waitlistSeries.data ?? []);

  const stats = [
    { label: 'Standardpriser', value: pricesCount.count ?? 0, icon: Tag, color: 'from-rose-500 to-rose-600' },
    { label: 'Ugens tilbud', value: offersCount.count ?? 0, icon: Percent, color: 'from-emerald-500 to-emerald-600' },
    { label: 'Opskrifter', value: recipesCount.count ?? 0, icon: BookOpen, color: 'from-amber-500 to-amber-600' },
    { label: 'Butikker', value: uniqueStores, icon: Store, color: 'from-sky-500 to-sky-600' },
    { label: 'Åbne supportsager', value: openTicketsCount.count ?? 0, icon: Inbox, color: 'from-stone-600 to-stone-700' },
  ];

  const today = todayStr();

  return (
    <div>
      <h1 className="text-2xl font-bold text-stone-900 dark:text-stone-100">Oversigt</h1>
      <p className="mt-1 text-sm text-stone-500 dark:text-stone-400">Velkommen til LifeSort Admin.</p>

      <div className="mt-8 grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-5">
        {stats.map((stat) => (
          <div
            key={stat.label}
            className="rounded-2xl border border-stone-200 bg-white p-5 shadow-sm shadow-stone-900/5 dark:border-stone-800 dark:bg-stone-900"
          >
            <div className={`flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br ${stat.color}`}>
              <stat.icon className="h-5 w-5 text-white" strokeWidth={2.2} />
            </div>
            <p className="mt-4 text-2xl font-bold text-stone-900 dark:text-stone-100">
              <AnimatedNumber value={stat.value} />
            </p>
            <p className="text-xs font-medium text-stone-500 dark:text-stone-400">{stat.label}</p>
          </div>
        ))}
      </div>

      <div className="mt-6 rounded-2xl border border-stone-200 bg-white p-5 shadow-sm shadow-stone-900/5 dark:border-stone-800 dark:bg-stone-900">
        <div className="flex items-center gap-2">
          <TrendingUp size={16} className="text-stone-500 dark:text-stone-400" />
          <h2 className="text-sm font-bold text-stone-900 dark:text-stone-100">Sidste 30 dage</h2>
        </div>
        <div className="mt-2 flex items-center gap-4 text-xs">
          <span className="flex items-center gap-1.5 text-stone-500 dark:text-stone-400">
            <span className="h-2 w-2 rounded-full bg-sky-500" /> Supportsager
          </span>
          <span className="flex items-center gap-1.5 text-stone-500 dark:text-stone-400">
            <span className="h-2 w-2 rounded-full bg-rose-500" /> Venteliste
          </span>
        </div>
        <div className="mt-2">
          <DashboardChart data={chartData} />
        </div>
      </div>

      <div className="mt-6 grid grid-cols-1 gap-4 lg:grid-cols-2">
        <div className="rounded-2xl border border-stone-200 bg-white p-5 shadow-sm shadow-stone-900/5 dark:border-stone-800 dark:bg-stone-900">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Milestone size={16} className="text-stone-500 dark:text-stone-400" />
              <h2 className="text-sm font-bold text-stone-900 dark:text-stone-100">Kommende deadlines</h2>
            </div>
            <Link href="/admin/timeline" className="flex items-center gap-1 text-xs font-medium text-stone-500 hover:text-stone-700 dark:text-stone-400 dark:hover:text-stone-200">
              Se alle <ArrowRight size={12} />
            </Link>
          </div>

          <div className="mt-4 flex flex-col gap-3">
            {(upcomingDeadlines.data ?? []).length === 0 ? (
              <p className="text-sm text-stone-400 dark:text-stone-500">Ingen kommende deadlines.</p>
            ) : (
              (upcomingDeadlines.data ?? []).map((event) => {
                const isOverdue = event.event_date < today;
                return (
                  <div key={event.id} className="flex items-center gap-3">
                    {isOverdue ? (
                      <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-rose-100 text-rose-600 dark:bg-rose-500/15 dark:text-rose-400">
                        <AlertTriangle size={12} />
                      </span>
                    ) : (
                      <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-stone-100 text-xs font-semibold text-stone-500 dark:bg-stone-800 dark:text-stone-400">
                        {formatShortDate(event.event_date).split('.')[0]}
                      </span>
                    )}
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-medium text-stone-800 dark:text-stone-200">{event.title}</p>
                      <p className={`text-xs ${isOverdue ? 'font-semibold text-rose-600 dark:text-rose-400' : 'text-stone-400 dark:text-stone-500'}`}>
                        {isOverdue ? 'Overskredet · ' : ''}{formatShortDate(event.event_date)} · {OWNER_LABEL[event.owner as TimelineOwner]}
                      </p>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        <div className="rounded-2xl border border-stone-200 bg-white p-5 shadow-sm shadow-stone-900/5 dark:border-stone-800 dark:bg-stone-900">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Activity size={16} className="text-stone-500 dark:text-stone-400" />
              <h2 className="text-sm font-bold text-stone-900 dark:text-stone-100">Seneste aktivitet</h2>
            </div>
            <Link href="/admin/activity" className="flex items-center gap-1 text-xs font-medium text-stone-500 hover:text-stone-700 dark:text-stone-400 dark:hover:text-stone-200">
              Se alle <ArrowRight size={12} />
            </Link>
          </div>

          <div className="mt-4 flex flex-col gap-3">
            {(recentActivity.data ?? []).length === 0 ? (
              <p className="text-sm text-stone-400 dark:text-stone-500">Ingen aktivitet endnu.</p>
            ) : (
              (recentActivity.data ?? []).map((item) => (
                <div key={item.id} className="flex items-start gap-3">
                  <span className="mt-1 h-1.5 w-1.5 shrink-0 rounded-full bg-stone-300 dark:bg-stone-600" />
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm text-stone-700 dark:text-stone-300">
                      <span className="font-semibold text-stone-900 dark:text-stone-100">{item.actor_name}</span>{' '}
                      {ACTION_VERB[item.action] ?? item.action} {item.entity_label}
                    </p>
                    <p className="text-xs text-stone-400 dark:text-stone-500">{relativeTime(item.created_at)}</p>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}