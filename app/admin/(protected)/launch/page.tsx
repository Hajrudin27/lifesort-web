import Link from 'next/link';
import {
  AlertTriangle,
  ArrowRight,
  CheckCircle2,
  ClipboardCheck,
  Inbox,
  Rocket,
  ShieldCheck,
  Tag,
  Users,
  XCircle,
} from 'lucide-react';
import { createClient } from '@/lib/supabase/server';

type CheckStatus = 'ready' | 'warning' | 'critical';

type LaunchCheck = {
  label: string;
  detail: string;
  status: CheckStatus;
  href: string;
  action: string;
};

const STATUS_META: Record<CheckStatus, { label: string; icon: typeof CheckCircle2; badge: string; iconWrap: string }> = {
  ready: {
    label: 'Klar',
    icon: CheckCircle2,
    badge: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-400',
    iconWrap: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-400',
  },
  warning: {
    label: 'Tjek',
    icon: AlertTriangle,
    badge: 'bg-amber-100 text-amber-700 dark:bg-amber-500/15 dark:text-amber-400',
    iconWrap: 'bg-amber-100 text-amber-700 dark:bg-amber-500/15 dark:text-amber-400',
  },
  critical: {
    label: 'Mangler',
    icon: XCircle,
    badge: 'bg-red-100 text-red-700 dark:bg-red-500/15 dark:text-red-400',
    iconWrap: 'bg-red-100 text-red-700 dark:bg-red-500/15 dark:text-red-400',
  },
};

function countStatus(count: number, warningAt: number, readyAt: number): CheckStatus {
  if (count >= readyAt) return 'ready';
  if (count >= warningAt) return 'warning';
  return 'critical';
}

function envReady(requiredNames: string[]) {
  return requiredNames.every((name) => Boolean(process.env[name]?.trim()));
}

function todayStr() {
  return new Date().toISOString().split('T')[0];
}

function pct(part: number, total: number) {
  if (total === 0) return 0;
  return Math.round((part / total) * 100);
}

function CheckRow({ check }: { check: LaunchCheck }) {
  const meta = STATUS_META[check.status];
  const Icon = meta.icon;

  return (
    <Link
      href={check.href}
      className="group flex items-center gap-3 rounded-2xl border border-stone-200 bg-white p-4 shadow-sm shadow-stone-900/5 transition hover:border-stone-300 hover:shadow-md dark:border-stone-800 dark:bg-stone-900 dark:hover:border-stone-700"
    >
      <div className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-xl ${meta.iconWrap}`}>
        <Icon size={17} />
      </div>
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2">
          <p className="truncate text-sm font-semibold text-stone-900 dark:text-stone-100">{check.label}</p>
          <span className={`shrink-0 rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide ${meta.badge}`}>
            {meta.label}
          </span>
        </div>
        <p className="mt-0.5 truncate text-xs text-stone-500 dark:text-stone-400">{check.detail}</p>
      </div>
      <div className="hidden items-center gap-1 text-xs font-semibold text-stone-400 transition group-hover:text-stone-700 dark:group-hover:text-stone-200 sm:flex">
        {check.action}
        <ArrowRight size={13} />
      </div>
    </Link>
  );
}

function SummaryCard({
  label,
  value,
  icon: Icon,
  tone,
}: {
  label: string;
  value: string;
  icon: typeof Users;
  tone: string;
}) {
  return (
    <div className="rounded-2xl border border-stone-200 bg-white p-5 shadow-sm shadow-stone-900/5 dark:border-stone-800 dark:bg-stone-900">
      <div className={`flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br ${tone}`}>
        <Icon className="h-5 w-5 text-white" strokeWidth={2.2} />
      </div>
      <p className="mt-4 text-2xl font-bold text-stone-900 dark:text-stone-100">{value}</p>
      <p className="text-xs font-medium text-stone-500 dark:text-stone-400">{label}</p>
    </div>
  );
}

export default async function LaunchPage() {
  const supabase = await createClient();
  const today = todayStr();

  const [
    waitlistTotal,
    waitlistConfirmed,
    productsCount,
    pricesCount,
    recipesCount,
    publishedRecipesCount,
    activeOffersCount,
    openTicketsCount,
    overdueTimelineCount,
    healthConditionsCount,
    symptomsCount,
  ] = await Promise.all([
    supabase.from('waitlist_signups').select('id', { count: 'exact', head: true }),
    supabase.from('waitlist_signups').select('id', { count: 'exact', head: true }).eq('confirmed', true),
    supabase.from('products').select('id', { count: 'exact', head: true }),
    supabase.from('global_standard_prices').select('id', { count: 'exact', head: true }),
    supabase.from('global_recipes').select('id', { count: 'exact', head: true }),
    supabase.from('global_recipes').select('id', { count: 'exact', head: true }).eq('published', true),
    supabase.from('global_offers').select('id', { count: 'exact', head: true }).lte('valid_from', today).gte('valid_to', today),
    supabase.from('support_tickets').select('id', { count: 'exact', head: true }).eq('status', 'open'),
    supabase.from('timeline_events').select('id', { count: 'exact', head: true }).neq('status', 'done').lt('event_date', today),
    supabase.from('health_conditions').select('id', { count: 'exact', head: true }),
    supabase.from('symptom_glossary').select('id', { count: 'exact', head: true }),
  ]);

  const waitlist = waitlistTotal.count ?? 0;
  const confirmed = waitlistConfirmed.count ?? 0;
  const products = productsCount.count ?? 0;
  const prices = pricesCount.count ?? 0;
  const recipes = recipesCount.count ?? 0;
  const publishedRecipes = publishedRecipesCount.count ?? 0;
  const activeOffers = activeOffersCount.count ?? 0;
  const openTickets = openTicketsCount.count ?? 0;
  const overdueTimeline = overdueTimelineCount.count ?? 0;
  const healthConditions = healthConditionsCount.count ?? 0;
  const symptoms = symptomsCount.count ?? 0;

  const checks: { title: string; items: LaunchCheck[] }[] = [
    {
      title: 'Publikum',
      items: [
        {
          label: 'Venteliste',
          detail: `${waitlist} tilmeldte · ${confirmed} bekræftede (${pct(confirmed, waitlist)}%)`,
          status: confirmed > 0 ? 'ready' : waitlist > 0 ? 'warning' : 'critical',
          href: '/admin/waitlist',
          action: 'Åbn',
        },
        {
          label: 'Supportsager',
          detail: openTickets === 0 ? 'Ingen åbne sager' : `${openTickets} åbne sager bør besvares før launch`,
          status: openTickets === 0 ? 'ready' : openTickets <= 3 ? 'warning' : 'critical',
          href: '/admin/tickets',
          action: 'Ryd op',
        },
      ],
    },
    {
      title: 'App-indhold',
      items: [
        {
          label: 'Varer og standardpriser',
          detail: `${products} varer · ${prices} butikspriser`,
          status: products === 0 || prices === 0 ? 'critical' : countStatus(Math.min(products, prices), 20, 50),
          href: '/admin/food/prices',
          action: 'Supplér',
        },
        {
          label: 'Opskrifter',
          detail: `${publishedRecipes} publicerede · ${recipes - publishedRecipes} kladder`,
          status: countStatus(publishedRecipes, 5, 15),
          href: '/admin/food/recipes',
          action: 'Redigér',
        },
        {
          label: 'Aktive tilbud',
          detail: activeOffers === 0 ? 'Ingen aktive tilbud i dag' : `${activeOffers} aktive tilbud i dag`,
          status: activeOffers > 0 ? 'ready' : 'warning',
          href: '/admin/food/offers',
          action: 'Tilføj',
        },
        {
          label: 'Sundhedsindhold',
          detail: `${healthConditions} tilstande · ${symptoms} symptomer`,
          status: healthConditions === 0 || symptoms === 0 ? 'critical' : countStatus(Math.min(healthConditions, symptoms), 5, 10),
          href: '/admin/health/conditions',
          action: 'Gennemgå',
        },
      ],
    },
    {
      title: 'Drift',
      items: [
        {
          label: 'Projekt-tidslinje',
          detail: overdueTimeline === 0 ? 'Ingen overskredne deadlines' : `${overdueTimeline} overskredne deadlines`,
          status: overdueTimeline === 0 ? 'ready' : 'warning',
          href: '/admin/timeline',
          action: 'Planlæg',
        },
        {
          label: 'Backup',
          detail: 'Admin-styret indhold kan eksporteres som JSON',
          status: 'ready',
          href: '/admin/settings/export',
          action: 'Eksportér',
        },
      ],
    },
    {
      title: 'Teknisk',
      items: [
        {
          label: 'Miljøvariabler',
          detail: envReady(['NEXT_PUBLIC_SUPABASE_URL', 'NEXT_PUBLIC_SUPABASE_ANON_KEY', 'SUPABASE_SERVICE_ROLE_KEY', 'RESEND_API_KEY', 'CRON_SECRET'])
            ? 'Kritiske nøgler er sat'
            : 'En eller flere kritiske nøgler mangler',
          status: envReady(['NEXT_PUBLIC_SUPABASE_URL', 'NEXT_PUBLIC_SUPABASE_ANON_KEY', 'SUPABASE_SERVICE_ROLE_KEY', 'RESEND_API_KEY', 'CRON_SECRET'])
            ? 'ready'
            : 'critical',
          href: '/admin/settings/health',
          action: 'Tjek',
        },
        {
          label: 'Sentry og email-afsender',
          detail: process.env.NEXT_PUBLIC_SENTRY_DSN && process.env.RESEND_FROM_EMAIL
            ? 'Fejlsporing og afsender er sat'
            : 'Sentry DSN eller verificeret afsender mangler',
          status: process.env.NEXT_PUBLIC_SENTRY_DSN && process.env.RESEND_FROM_EMAIL ? 'ready' : 'warning',
          href: '/admin/settings/health',
          action: 'Tjek',
        },
      ],
    },
  ];

  const flatChecks = checks.flatMap((group) => group.items);
  const readyCount = flatChecks.filter((check) => check.status === 'ready').length;
  const warningCount = flatChecks.filter((check) => check.status === 'warning').length;
  const criticalCount = flatChecks.filter((check) => check.status === 'critical').length;
  const readiness = Math.round((readyCount / flatChecks.length) * 100);

  return (
    <div>
      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-rose-500 to-amber-500">
            <Rocket className="h-5 w-5 text-white" strokeWidth={2.2} />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-stone-900 dark:text-stone-100">Launch-overblik</h1>
            <p className="text-sm text-stone-500 dark:text-stone-400">
              {criticalCount > 0
                ? `${criticalCount} ting mangler før hjemmesiden føles launch-klar`
                : warningCount > 0
                  ? `${warningCount} ting bør tjekkes inden launch`
                  : 'Alt på launchlisten ser klar ud'}
            </p>
          </div>
        </div>
        <div className="rounded-2xl border border-stone-200 bg-white px-5 py-3 text-right shadow-sm shadow-stone-900/5 dark:border-stone-800 dark:bg-stone-900">
          <p className="text-2xl font-bold text-stone-900 dark:text-stone-100">{readiness}%</p>
          <p className="text-xs font-medium text-stone-500 dark:text-stone-400">klarhed</p>
        </div>
      </div>

      <div className="mt-8 grid grid-cols-2 gap-4 lg:grid-cols-4">
        <SummaryCard label="Klar" value={readyCount.toString()} icon={CheckCircle2} tone="from-emerald-500 to-emerald-600" />
        <SummaryCard label="Bør tjekkes" value={warningCount.toString()} icon={AlertTriangle} tone="from-amber-500 to-amber-600" />
        <SummaryCard label="Mangler" value={criticalCount.toString()} icon={XCircle} tone="from-red-500 to-red-600" />
        <SummaryCard label="Tilmeldinger" value={waitlist.toString()} icon={Users} tone="from-violet-500 to-violet-600" />
      </div>

      <div className="mt-6 h-2 overflow-hidden rounded-full bg-stone-100 dark:bg-stone-800">
        <div className="h-full rounded-full bg-gradient-to-r from-rose-500 via-amber-500 to-emerald-500" style={{ width: `${readiness}%` }} />
      </div>

      <div className="mt-8 grid grid-cols-1 gap-5 lg:grid-cols-2">
        {checks.map((group) => (
          <section key={group.title}>
            <div className="mb-3 flex items-center gap-2">
              {group.title === 'Publikum' && <Users size={16} className="text-stone-400" />}
              {group.title === 'App-indhold' && <Tag size={16} className="text-stone-400" />}
              {group.title === 'Drift' && <ClipboardCheck size={16} className="text-stone-400" />}
              {group.title === 'Teknisk' && <ShieldCheck size={16} className="text-stone-400" />}
              <h2 className="text-sm font-bold text-stone-900 dark:text-stone-100">{group.title}</h2>
            </div>
            <div className="flex flex-col gap-2">
              {group.items.map((check) => <CheckRow key={check.label} check={check} />)}
            </div>
          </section>
        ))}
      </div>

      <div className="mt-8 rounded-2xl border border-stone-200 bg-white p-5 shadow-sm shadow-stone-900/5 dark:border-stone-800 dark:bg-stone-900">
        <div className="flex items-start gap-3">
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-stone-100 text-stone-600 dark:bg-stone-800 dark:text-stone-300">
            <Inbox size={17} />
          </div>
          <div>
            <p className="text-sm font-semibold text-stone-900 dark:text-stone-100">Brug siden som launch-ritual</p>
            <p className="mt-1 text-sm leading-relaxed text-stone-500 dark:text-stone-400">
              Når noget står som mangler eller tjek, kan du gå direkte til den relevante adminside, rette data og vende tilbage hertil. Første version bruger kun eksisterende data, så den er hurtig at vedligeholde og kræver ingen ekstra databasefelter.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
