import Link from 'next/link';
import { Tag, Percent, BookOpen, Store, Inbox, Milestone, Activity, ArrowRight, AlertTriangle } from 'lucide-react';
import { createClient } from '@/lib/supabase/server';

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

  const [
    pricesCount, offersCount, recipesCount, storesResult, openTicketsCount,
    upcomingDeadlines, recentActivity,
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
  ]);

  const uniqueStores = new Set((storesResult.data ?? []).map((r) => r.store)).size;

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
      <h1 className="text-2xl font-bold text-stone-900">Oversigt</h1>
      <p className="mt-1 text-sm text-stone-500">Velkommen til LifeSort Admin.</p>

      <div className="mt-8 grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-5">
        {stats.map((stat) => (
          <div
            key={stat.label}
            className="rounded-2xl border border-stone-200 bg-white p-5 shadow-sm shadow-stone-900/5"
          >
            <div className={`flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br ${stat.color}`}>
              <stat.icon className="h-5 w-5 text-white" strokeWidth={2.2} />
            </div>
            <p className="mt-4 text-2xl font-bold text-stone-900">{stat.value}</p>
            <p className="text-xs font-medium text-stone-500">{stat.label}</p>
          </div>
        ))}
      </div>

      <div className="mt-6 grid grid-cols-1 gap-4 lg:grid-cols-2">
        <div className="rounded-2xl border border-stone-200 bg-white p-5 shadow-sm shadow-stone-900/5">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Milestone size={16} className="text-stone-500" />
              <h2 className="text-sm font-bold text-stone-900">Kommende deadlines</h2>
            </div>
            <Link href="/admin/timeline" className="flex items-center gap-1 text-xs font-medium text-stone-500 hover:text-stone-700">
              Se alle <ArrowRight size={12} />
            </Link>
          </div>

          <div className="mt-4 flex flex-col gap-3">
            {(upcomingDeadlines.data ?? []).length === 0 ? (
              <p className="text-sm text-stone-400">Ingen kommende deadlines.</p>
            ) : (
              (upcomingDeadlines.data ?? []).map((event) => {
                const isOverdue = event.event_date < today;
                return (
                  <div key={event.id} className="flex items-center gap-3">
                    {isOverdue ? (
                      <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-rose-100 text-rose-600">
                        <AlertTriangle size={12} />
                      </span>
                    ) : (
                      <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-stone-100 text-xs font-semibold text-stone-500">
                        {formatShortDate(event.event_date).split('.')[0]}
                      </span>
                    )}
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-medium text-stone-800">{event.title}</p>
                      <p className={`text-xs ${isOverdue ? 'font-semibold text-rose-600' : 'text-stone-400'}`}>
                        {isOverdue ? 'Overskredet · ' : ''}{formatShortDate(event.event_date)} · {OWNER_LABEL[event.owner as TimelineOwner]}
                      </p>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        <div className="rounded-2xl border border-stone-200 bg-white p-5 shadow-sm shadow-stone-900/5">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Activity size={16} className="text-stone-500" />
              <h2 className="text-sm font-bold text-stone-900">Seneste aktivitet</h2>
            </div>
            <Link href="/admin/activity" className="flex items-center gap-1 text-xs font-medium text-stone-500 hover:text-stone-700">
              Se alle <ArrowRight size={12} />
            </Link>
          </div>

          <div className="mt-4 flex flex-col gap-3">
            {(recentActivity.data ?? []).length === 0 ? (
              <p className="text-sm text-stone-400">Ingen aktivitet endnu.</p>
            ) : (
              (recentActivity.data ?? []).map((item) => (
                <div key={item.id} className="flex items-start gap-3">
                  <span className="mt-1 h-1.5 w-1.5 shrink-0 rounded-full bg-stone-300" />
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm text-stone-700">
                      <span className="font-semibold text-stone-900">{item.actor_name}</span>{' '}
                      {ACTION_VERB[item.action] ?? item.action} {item.entity_label}
                    </p>
                    <p className="text-xs text-stone-400">{relativeTime(item.created_at)}</p>
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