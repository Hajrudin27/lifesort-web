'use client';

import { useEffect, useState, useCallback, useMemo } from 'react';
import {
  Activity, Tag, Percent, BookOpen, Inbox, Milestone, ShieldCheck,
  ChevronDown, Plus, Pencil, Trash2, Reply, UserPlus, CheckCircle2, Search, X, Users,
} from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import { useToast } from '@/components/toast-provider';
import type { ActivityAction, ActivityEntityType } from '@/lib/activity-log';

type DateFilter = 'all' | '24h' | '7d' | '30d';

type ActivityRow = {
  id: string;
  actor_id: string | null;
  actor_name: string;
  action: ActivityAction;
  entity_type: ActivityEntityType;
  entity_id: string | null;
  entity_label: string;
  created_at: string;
};

const FETCH_LIMIT = 300;
const GROUP_WINDOW_MS = 5 * 60 * 1000; // 5 minutes

const ENTITY_ICON: Record<ActivityEntityType, typeof Tag> = {
  price: Tag,
  offer: Percent,
  recipe: BookOpen,
  ticket: Inbox,
  timeline_event: Milestone,
  admin_user: ShieldCheck,
  waitlist_signup: Users,
};

const ENTITY_NOUN: Record<ActivityEntityType, { singular: string; plural: string }> = {
  price: { singular: 'en pris', plural: 'priser' },
  offer: { singular: 'et tilbud', plural: 'tilbud' },
  recipe: { singular: 'en opskrift', plural: 'opskrifter' },
  ticket: { singular: 'en supportsag', plural: 'supportsager' },
  timeline_event: { singular: 'en tidslinje-post', plural: 'tidslinje-poster' },
  admin_user: { singular: 'en admin', plural: 'admins' },
  waitlist_signup: { singular: 'en venteliste-tilmelding', plural: 'venteliste-tilmeldinger' },
};

const ACTION_VERB: Record<ActivityAction, string> = {
  created: 'oprettede',
  updated: 'opdaterede',
  deleted: 'slettede',
  replied: 'besvarede',
  invited: 'inviterede',
  confirmed: 'bekræftede',
};

const ACTION_ICON: Record<ActivityAction, typeof Plus> = {
  created: Plus,
  updated: Pencil,
  deleted: Trash2,
  replied: Reply,
  invited: UserPlus,
  confirmed: CheckCircle2,
};

const ACTION_STYLE: Record<ActivityAction, string> = {
  created: 'bg-emerald-100 text-emerald-600 dark:bg-emerald-500/15 dark:text-emerald-400',
  updated: 'bg-sky-100 text-sky-600 dark:bg-sky-500/15 dark:text-sky-400',
  deleted: 'bg-rose-100 text-rose-600 dark:bg-rose-500/15 dark:text-rose-400',
  replied: 'bg-violet-100 text-violet-600 dark:bg-violet-500/15 dark:text-violet-400',
  invited: 'bg-amber-100 text-amber-600 dark:bg-amber-500/15 dark:text-amber-400',
  confirmed: 'bg-emerald-100 text-emerald-600 dark:bg-emerald-500/15 dark:text-emerald-400',
};

const ENTITY_FILTERS: { value: ActivityEntityType | 'all'; label: string }[] = [
  { value: 'all', label: 'Alle typer' },
  { value: 'price', label: 'Priser' },
  { value: 'offer', label: 'Tilbud' },
  { value: 'recipe', label: 'Opskrifter' },
  { value: 'ticket', label: 'Supportsager' },
  { value: 'waitlist_signup', label: 'Venteliste' },
  { value: 'timeline_event', label: 'Tidslinje' },
  { value: 'admin_user', label: 'Admins' },
];

const ACTION_FILTERS: { value: ActivityAction | 'all'; label: string }[] = [
  { value: 'all', label: 'Alle handlinger' },
  { value: 'created', label: 'Oprettet' },
  { value: 'updated', label: 'Opdateret' },
  { value: 'deleted', label: 'Slettet' },
  { value: 'replied', label: 'Besvaret' },
  { value: 'confirmed', label: 'Bekræftet' },
  { value: 'invited', label: 'Inviteret' },
];

const DATE_FILTERS: { value: DateFilter; label: string }[] = [
  { value: 'all', label: 'Al tid' },
  { value: '24h', label: 'Seneste 24 timer' },
  { value: '7d', label: 'Seneste 7 dage' },
  { value: '30d', label: 'Seneste 30 dage' },
];

const AVATAR_PALETTE = ['bg-rose-500', 'bg-sky-500', 'bg-violet-500', 'bg-amber-500', 'bg-emerald-500'];

function avatarColor(name: string) {
  let hash = 0;
  for (let i = 0; i < name.length; i++) hash = name.charCodeAt(i) + ((hash << 5) - hash);
  return AVATAR_PALETTE[Math.abs(hash) % AVATAR_PALETTE.length];
}

function initials(name: string) {
  return name.split(' ').map((n) => n[0]).slice(0, 2).join('').toUpperCase();
}

function relativeTime(iso: string) {
  const diffMs = Date.now() - new Date(iso).getTime();
  const diffMin = Math.round(diffMs / 60000);
  if (diffMin < 1) return 'lige nu';
  if (diffMin < 60) return `for ${diffMin} min. siden`;
  const diffHours = Math.round(diffMin / 60);
  if (diffHours < 24) return `for ${diffHours} ${diffHours === 1 ? 'time' : 'timer'} siden`;
  const diffDays = Math.round(diffHours / 24);
  if (diffDays === 1) return 'i går';
  if (diffDays < 7) return `for ${diffDays} dage siden`;
  return new Date(iso).toLocaleDateString('da-DK', { day: 'numeric', month: 'short', year: 'numeric' });
}

function dateCutoff(filter: DateFilter) {
  if (filter === 'all') return null;
  const hours = filter === '24h' ? 24 : filter === '7d' ? 24 * 7 : 24 * 30;
  return Date.now() - hours * 60 * 60 * 1000;
}

type Group = {
  key: string;
  actorName: string;
  action: ActivityAction;
  entityType: ActivityEntityType;
  items: ActivityRow[];
};

function groupActivity(rows: ActivityRow[]): Group[] {
  const groups: Group[] = [];
  for (const row of rows) {
    const last = groups[groups.length - 1];
    const withinWindow = last
      ? Math.abs(new Date(last.items[last.items.length - 1].created_at).getTime() - new Date(row.created_at).getTime()) < GROUP_WINDOW_MS
      : false;
    if (last && last.actorName === row.actor_name && last.action === row.action && last.entityType === row.entity_type && withinWindow) {
      last.items.push(row);
    } else {
      groups.push({
        key: row.id,
        actorName: row.actor_name,
        action: row.action,
        entityType: row.entity_type,
        items: [row],
      });
    }
  }
  return groups;
}

function describeGroup(group: Group) {
  const verb = ACTION_VERB[group.action];
  const noun = group.items.length > 1
    ? `${group.items.length} ${ENTITY_NOUN[group.entityType].plural}`
    : ENTITY_NOUN[group.entityType].singular;
  return `${verb} ${noun}`;
}

export default function ActivityPage() {
  const supabase = createClient();
  const { showToast } = useToast();

  const [rows, setRows] = useState<ActivityRow[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [actorFilter, setActorFilter] = useState<string>('all');
  const [entityFilter, setEntityFilter] = useState<ActivityEntityType | 'all'>('all');
  const [actionFilter, setActionFilter] = useState<ActivityAction | 'all'>('all');
  const [dateFilter, setDateFilter] = useState<DateFilter>('all');
  const [search, setSearch] = useState('');
  const [expandedGroups, setExpandedGroups] = useState<Set<string>>(new Set());

  const fetchRows = useCallback(async () => {
    setIsLoading(true);
    const { data, error } = await supabase
      .from('activity_log')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(FETCH_LIMIT);

    if (!error) {
      setRows(data ?? []);
    } else {
      showToast('Kunne ikke hente aktivitetslog.', 'error');
    }
    setIsLoading(false);
  }, [supabase, showToast]);

  useEffect(() => {
    queueMicrotask(() => {
      fetchRows();
    });
  }, [fetchRows]);

  const actors = useMemo(() => Array.from(new Set(rows.map((r) => r.actor_name))), [rows]);

  const filteredRows = useMemo(() => rows.filter((r) => {
    const q = search.trim().toLowerCase();
    const cutoff = dateCutoff(dateFilter);
    if (actorFilter !== 'all' && r.actor_name !== actorFilter) return false;
    if (entityFilter !== 'all' && r.entity_type !== entityFilter) return false;
    if (actionFilter !== 'all' && r.action !== actionFilter) return false;
    if (cutoff && new Date(r.created_at).getTime() < cutoff) return false;
    if (q && !`${r.actor_name} ${r.entity_label} ${r.action} ${r.entity_type}`.toLowerCase().includes(q)) return false;
    return true;
  }), [rows, actorFilter, entityFilter, actionFilter, dateFilter, search]);

  const groups = useMemo(() => groupActivity(filteredRows), [filteredRows]);

  const hasActiveFilters =
    actorFilter !== 'all' ||
    entityFilter !== 'all' ||
    actionFilter !== 'all' ||
    dateFilter !== 'all' ||
    search.trim().length > 0;

  const clearFilters = () => {
    setActorFilter('all');
    setEntityFilter('all');
    setActionFilter('all');
    setDateFilter('all');
    setSearch('');
  };

  const toggleExpanded = (key: string) => {
    setExpandedGroups((prev) => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key); else next.add(key);
      return next;
    });
  };

  return (
    <div>
      <div className="flex items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-sky-500 to-sky-600">
          <Activity className="h-5 w-5 text-white" strokeWidth={2.2} />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-stone-900 dark:text-stone-100">Aktivitet</h1>
          <p className="text-sm text-stone-500 dark:text-stone-400">Alt hvad der sker i admin-panelet, ét sted</p>
        </div>
      </div>

      <div className="mt-6 rounded-2xl border border-stone-200 bg-white p-4 shadow-sm shadow-stone-900/5 dark:border-stone-800 dark:bg-stone-900">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-center">
          <label className="relative flex-1">
            <Search size={15} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-stone-400" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Søg efter admin, sag, email eller handling..."
              className="w-full rounded-xl border border-stone-200 bg-white py-2 pl-9 pr-3 text-sm text-stone-900 outline-none transition placeholder:text-stone-400 focus:border-sky-400 focus:ring-4 focus:ring-sky-100 dark:border-stone-700 dark:bg-stone-950 dark:text-stone-100 dark:focus:ring-sky-900/30"
            />
          </label>

          <div className="flex flex-wrap gap-2">
            <select value={entityFilter} onChange={(e) => setEntityFilter(e.target.value as ActivityEntityType | 'all')}
              className="rounded-xl border border-stone-200 bg-white px-3 py-2 text-xs font-medium text-stone-900 outline-none focus:border-sky-400 focus:ring-4 focus:ring-sky-100 dark:border-stone-700 dark:bg-stone-950 dark:text-stone-100 dark:focus:ring-sky-900/30">
              {ENTITY_FILTERS.map((option) => (
                <option key={option.value} value={option.value}>{option.label}</option>
              ))}
            </select>
            <select value={actionFilter} onChange={(e) => setActionFilter(e.target.value as ActivityAction | 'all')}
              className="rounded-xl border border-stone-200 bg-white px-3 py-2 text-xs font-medium text-stone-900 outline-none focus:border-sky-400 focus:ring-4 focus:ring-sky-100 dark:border-stone-700 dark:bg-stone-950 dark:text-stone-100 dark:focus:ring-sky-900/30">
              {ACTION_FILTERS.map((option) => (
                <option key={option.value} value={option.value}>{option.label}</option>
              ))}
            </select>
            <select value={dateFilter} onChange={(e) => setDateFilter(e.target.value as DateFilter)}
              className="rounded-xl border border-stone-200 bg-white px-3 py-2 text-xs font-medium text-stone-900 outline-none focus:border-sky-400 focus:ring-4 focus:ring-sky-100 dark:border-stone-700 dark:bg-stone-950 dark:text-stone-100 dark:focus:ring-sky-900/30">
              {DATE_FILTERS.map((option) => (
                <option key={option.value} value={option.value}>{option.label}</option>
              ))}
            </select>
            {hasActiveFilters && (
              <button onClick={clearFilters}
                className="inline-flex items-center gap-1.5 rounded-xl border border-stone-200 bg-white px-3 py-2 text-xs font-semibold text-stone-600 transition hover:bg-stone-50 dark:border-stone-700 dark:bg-stone-950 dark:text-stone-300 dark:hover:bg-stone-800">
                <X size={13} />
                Ryd
              </button>
            )}
          </div>
        </div>

        <div className="mt-4 flex flex-wrap items-center gap-2">
        <button onClick={() => setActorFilter('all')}
          className={`rounded-full px-3.5 py-1.5 text-xs font-semibold transition ${actorFilter === 'all' ? 'bg-stone-900 text-white dark:bg-stone-700' : 'border border-stone-200 bg-white text-stone-600 hover:bg-stone-50 dark:border-stone-700 dark:bg-stone-900 dark:text-stone-300 dark:hover:bg-stone-800'}`}>
          Alle
        </button>
        {actors.map((a) => (
          <button key={a} onClick={() => setActorFilter(a)}
            className={`rounded-full px-3.5 py-1.5 text-xs font-semibold transition ${actorFilter === a ? 'bg-stone-900 text-white dark:bg-stone-700' : 'border border-stone-200 bg-white text-stone-600 hover:bg-stone-50 dark:border-stone-700 dark:bg-stone-900 dark:text-stone-300 dark:hover:bg-stone-800'}`}>
            {a}
          </button>
        ))}
          <span className="ml-auto text-xs font-medium text-stone-400 dark:text-stone-500">
            Viser {filteredRows.length} af {rows.length} seneste loglinjer
          </span>
        </div>
      </div>

      <div className="mt-6 flex flex-col gap-2">
        {isLoading ? (
          Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="h-16 animate-pulse rounded-2xl bg-stone-100 dark:bg-stone-800" />
          ))
        ) : groups.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-stone-200 bg-white py-16 text-center dark:border-stone-800 dark:bg-stone-900">
            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-stone-100 dark:bg-stone-800">
              <Activity className="h-5 w-5 text-stone-400" />
            </div>
            <p className="mt-3 text-sm font-medium text-stone-500 dark:text-stone-400">Ingen aktivitet endnu</p>
          </div>
        ) : (
          groups.map((group) => {
            const EntityIcon = ENTITY_ICON[group.entityType];
            const ActionIcon = ACTION_ICON[group.action];
            const isExpanded = expandedGroups.has(group.key);
            const isMulti = group.items.length > 1;
            const latest = group.items[0];

            return (
              <div key={group.key} className="rounded-2xl border border-stone-200 bg-white p-4 shadow-sm shadow-stone-900/5 dark:border-stone-800 dark:bg-stone-900">
                <div className="flex items-start gap-3">
                  <span className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-xs font-bold text-white ${avatarColor(group.actorName)}`}>
                    {initials(group.actorName)}
                  </span>

                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-x-1.5 gap-y-1 text-sm">
                      <span className="font-semibold text-stone-900 dark:text-stone-100">{group.actorName}</span>
                      <span className="text-stone-600 dark:text-stone-400">{describeGroup(group)}</span>
                      <span className={`ml-1 inline-flex h-5 w-5 items-center justify-center rounded-full ${ACTION_STYLE[group.action]}`}>
                        <ActionIcon size={11} />
                      </span>
                    </div>

                    {!isMulti && (
                      <p className="mt-0.5 flex items-center gap-1.5 text-xs text-stone-500 dark:text-stone-400">
                        <EntityIcon size={12} />
                        {latest.entity_label}
                      </p>
                    )}

                    <p className="mt-1 text-xs text-stone-400 dark:text-stone-500">{relativeTime(latest.created_at)}</p>

                    {isMulti && (
                      <button onClick={() => toggleExpanded(group.key)}
                        className="mt-2 flex items-center gap-1 text-xs font-medium text-sky-600 hover:underline dark:text-sky-400">
                        <ChevronDown size={13} className={`transition-transform ${isExpanded ? 'rotate-180' : ''}`} />
                        {isExpanded ? 'Skjul detaljer' : `Vis alle ${group.items.length}`}
                      </button>
                    )}

                    {isMulti && isExpanded && (
                      <ul className="mt-2 flex flex-col gap-1 border-l-2 border-stone-100 pl-3 dark:border-stone-800">
                        {group.items.map((item) => (
                          <li key={item.id} className="flex items-center gap-1.5 text-xs text-stone-500 dark:text-stone-400">
                            <EntityIcon size={11} />
                            {item.entity_label}
                          </li>
                        ))}
                      </ul>
                    )}
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
