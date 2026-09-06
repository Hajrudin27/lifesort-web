import Link from 'next/link';
import {
  AlertTriangle,
  ArrowRight,
  CheckCircle2,
  ClipboardCheck,
  Clock3,
  Database,
  Gauge,
  Globe2,
  Inbox,
  MailCheck,
  Rocket,
  Tag,
  Users,
  XCircle,
} from 'lucide-react';
import { createClient } from '@/lib/supabase/server';
import { getResendSetupStatus } from '@/lib/resend';
import { siteUrl } from '@/lib/site-config';
import { redirect } from 'next/navigation';
import { requireAdmin } from '@/lib/admin-auth';
import { OWNER_ONLY } from '@/lib/admin-roles';

type CheckStatus = 'ready' | 'warning' | 'critical';

type LaunchCheck = {
  label: string;
  detail: string;
  status: CheckStatus;
  href: string;
  action: string;
  owner?: string;
};

type CountResult = {
  count: number;
  error: string | null;
};

type CountResponse = {
  count: number | null;
  error: { message: string } | null;
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

function queryCount(result: CountResponse): CountResult {
  return {
    count: result.count ?? 0,
    error: result.error?.message ?? null,
  };
}

function queryErrorStatus(result: CountResult, fallback: CheckStatus): CheckStatus {
  return result.error ? 'critical' : fallback;
}

function queryDetail(result: CountResult, detail: string) {
  return result.error ? `Kunne ikke hente data: ${result.error}` : detail;
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

function statusScore(status: CheckStatus) {
  if (status === 'ready') return 1;
  if (status === 'warning') return 0.5;
  return 0;
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
        {check.owner && (
          <p className="mt-1 text-[11px] font-medium uppercase tracking-wide text-stone-400 dark:text-stone-500">
            {check.owner}
          </p>
        )}
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
  // Siden er owner-only, og middleware afviser de øvrige roller. Tjekket gentages her,
  // så adgangen ikke afhænger af ét lag alene.
  const auth = await requireAdmin(OWNER_ONLY);
  if (!auth.ok) redirect('/admin/dashboard');

  const supabase = await createClient();
  const resendSetup = await getResendSetupStatus();
  const today = todayStr();
  const since7 = new Date();
  since7.setDate(since7.getDate() - 7);

  const [
    waitlistTotal,
    waitlistConfirmed,
    waitlistLast7,
    productsCount,
    pricesCount,
    recipesCount,
    publishedRecipesCount,
    activeOffersCount,
    openTicketsCount,
    waitingTicketsCount,
    urgentTicketsCount,
    overdueTimelineCount,
    activityLast7Count,
    healthConditionsCount,
    symptomsCount,
  ] = await Promise.all([
    supabase.from('waitlist_signups').select('id', { count: 'exact', head: true }),
    supabase.from('waitlist_signups').select('id', { count: 'exact', head: true }).eq('confirmed', true),
    supabase.from('waitlist_signups').select('id', { count: 'exact', head: true }).gte('created_at', since7.toISOString()),
    supabase.from('products').select('id', { count: 'exact', head: true }),
    supabase.from('global_standard_prices').select('id', { count: 'exact', head: true }),
    supabase.from('global_recipes').select('id', { count: 'exact', head: true }),
    supabase.from('global_recipes').select('id', { count: 'exact', head: true }).eq('published', true),
    supabase.from('global_offers').select('id', { count: 'exact', head: true }).lte('valid_from', today).gte('valid_to', today),
    supabase.from('support_tickets').select('id', { count: 'exact', head: true }).eq('status', 'open'),
    supabase.from('support_tickets').select('id', { count: 'exact', head: true }).eq('status', 'waiting'),
    supabase.from('support_tickets').select('id', { count: 'exact', head: true }).in('priority', ['high', 'urgent']).neq('status', 'closed'),
    supabase.from('timeline_events').select('id', { count: 'exact', head: true }).neq('status', 'done').lt('event_date', today),
    supabase.from('activity_log').select('id', { count: 'exact', head: true }).gte('created_at', since7.toISOString()),
    supabase.from('health_conditions').select('id', { count: 'exact', head: true }),
    supabase.from('symptom_glossary').select('id', { count: 'exact', head: true }),
  ]);

  const waitlistResult = queryCount(waitlistTotal);
  const confirmedResult = queryCount(waitlistConfirmed);
  const waitlistLast7Result = queryCount(waitlistLast7);
  const productsResult = queryCount(productsCount);
  const pricesResult = queryCount(pricesCount);
  const recipesResult = queryCount(recipesCount);
  const publishedRecipesResult = queryCount(publishedRecipesCount);
  const activeOffersResult = queryCount(activeOffersCount);
  const openTicketsResult = queryCount(openTicketsCount);
  const waitingTicketsResult = queryCount(waitingTicketsCount);
  const urgentTicketsResult = queryCount(urgentTicketsCount);
  const overdueTimelineResult = queryCount(overdueTimelineCount);
  const activityLast7Result = queryCount(activityLast7Count);
  const healthConditionsResult = queryCount(healthConditionsCount);
  const symptomsResult = queryCount(symptomsCount);

  const waitlist = waitlistResult.count;
  const confirmed = confirmedResult.count;
  const waitlistLast7Count = waitlistLast7Result.count;
  const products = productsResult.count;
  const prices = pricesResult.count;
  const recipes = recipesResult.count;
  const publishedRecipes = publishedRecipesResult.count;
  const activeOffers = activeOffersResult.count;
  const openTickets = openTicketsResult.count;
  const waitingTickets = waitingTicketsResult.count;
  const urgentTickets = urgentTicketsResult.count;
  const overdueTimeline = overdueTimelineResult.count;
  const activityLast7 = activityLast7Result.count;
  const healthConditions = healthConditionsResult.count;
  const symptoms = symptomsResult.count;
  const criticalEnvReady = envReady([
    'NEXT_PUBLIC_SUPABASE_URL',
    'NEXT_PUBLIC_SUPABASE_ANON_KEY',
    'SUPABASE_SERVICE_ROLE_KEY',
    'RESEND_API_KEY',
    'CRON_SECRET',
  ]);
  const productionDomainReady = siteUrl.startsWith('https://') && !siteUrl.includes('localhost');

  const checks: { title: string; items: LaunchCheck[] }[] = [
    {
      title: 'Publikum',
      items: [
        {
          label: 'Venteliste',
          detail: queryDetail(waitlistResult, `${waitlist} tilmeldte · ${confirmed} bekræftede (${pct(confirmed, waitlist)}%) · ${waitlistLast7Count} nye på 7 dage`),
          status: queryErrorStatus(waitlistResult, confirmed > 0 ? 'ready' : waitlist > 0 ? 'warning' : 'critical'),
          href: '/admin/waitlist',
          action: 'Åbn',
          owner: 'Marketing / website',
        },
        {
          label: 'Supportsager',
          detail: queryDetail(openTicketsResult, openTickets === 0
            ? `${waitingTickets} venter på bruger · ${urgentTickets} høj prioritet`
            : `${openTickets} åbne · ${waitingTickets} venter · ${urgentTickets} høj prioritet`),
          status: queryErrorStatus(openTicketsResult, urgentTickets > 0 || openTickets > 3 ? 'critical' : openTickets > 0 ? 'warning' : 'ready'),
          href: '/admin/tickets',
          action: 'Ryd op',
          owner: 'Support',
        },
      ],
    },
    {
      title: 'Hjemmeside',
      items: [
        {
          label: 'Produktionsdomæne',
          detail: productionDomainReady ? `${siteUrl} bruges som canonical domæne` : 'siteUrl skal pege på et https-produktionsdomæne',
          status: productionDomainReady ? 'ready' : 'critical',
          href: '/',
          action: 'Se site',
          owner: 'Website',
        },
        {
          label: 'SEO og deling',
          detail: 'Sitemap, robots.txt, canonical tags og OG-image er sat op',
          status: 'ready',
          href: '/sitemap.xml',
          action: 'Åbn',
          owner: 'Website',
        },
      ],
    },
    {
      title: 'App-indhold',
      items: [
        {
          label: 'Varer og standardpriser',
          detail: queryDetail(productsResult, `${products} varer · ${prices} butikspriser`),
          status: queryErrorStatus(productsResult, products === 0 || prices === 0 ? 'critical' : countStatus(Math.min(products, prices), 20, 50)),
          href: '/admin/food/prices',
          action: 'Supplér',
          owner: 'Indhold',
        },
        {
          label: 'Opskrifter',
          detail: queryDetail(recipesResult, `${publishedRecipes} publicerede · ${recipes - publishedRecipes} kladder`),
          status: queryErrorStatus(recipesResult, countStatus(publishedRecipes, 5, 15)),
          href: '/admin/food/recipes',
          action: 'Redigér',
          owner: 'Indhold',
        },
        {
          label: 'Aktive tilbud',
          detail: queryDetail(activeOffersResult, activeOffers === 0 ? 'Ingen aktive tilbud i dag' : `${activeOffers} aktive tilbud i dag`),
          status: queryErrorStatus(activeOffersResult, activeOffers > 0 ? 'ready' : 'warning'),
          href: '/admin/food/offers',
          action: 'Tilføj',
          owner: 'Indhold',
        },
        {
          label: 'Sundhedsindhold',
          detail: queryDetail(healthConditionsResult, `${healthConditions} tilstande · ${symptoms} symptomer`),
          status: queryErrorStatus(healthConditionsResult, healthConditions === 0 || symptoms === 0 ? 'critical' : countStatus(Math.min(healthConditions, symptoms), 5, 10)),
          href: '/admin/health/conditions',
          action: 'Gennemgå',
          owner: 'Indhold',
        },
      ],
    },
    {
      title: 'Drift',
      items: [
        {
          label: 'Projekt-tidslinje',
          detail: queryDetail(overdueTimelineResult, overdueTimeline === 0 ? 'Ingen overskredne deadlines' : `${overdueTimeline} overskredne deadlines`),
          status: queryErrorStatus(overdueTimelineResult, overdueTimeline === 0 ? 'ready' : 'warning'),
          href: '/admin/timeline',
          action: 'Planlæg',
          owner: 'Projekt',
        },
        {
          label: 'Backup',
          detail: 'Admin-styret indhold kan eksporteres som JSON',
          status: 'ready',
          href: '/admin/settings/export',
          action: 'Eksportér',
          owner: 'Drift',
        },
        {
          label: 'Audit trail',
          detail: queryDetail(activityLast7Result, activityLast7 === 0 ? 'Ingen admin-aktivitet de sidste 7 dage' : `${activityLast7} admin-handlinger de sidste 7 dage`),
          status: queryErrorStatus(activityLast7Result, activityLast7 > 0 ? 'ready' : 'warning'),
          href: '/admin/activity',
          action: 'Åbn',
          owner: 'Drift',
        },
        {
          label: 'Data-retention',
          detail: process.env.CRON_SECRET
            ? 'Daglig oprydning af gammel persondata og forældreløse attachments er konfigureret'
            : 'CRON_SECRET mangler, så data-retention cron kan ikke køres sikkert',
          status: process.env.CRON_SECRET ? 'ready' : 'critical',
          href: '/admin/settings/health',
          action: 'Tjek',
          owner: 'Privacy',
        },
      ],
    },
    {
      title: 'Teknisk',
      items: [
        {
          label: 'Miljøvariabler',
          detail: criticalEnvReady
            ? 'Kritiske nøgler er sat'
            : 'En eller flere kritiske nøgler mangler',
          status: criticalEnvReady ? 'ready' : 'critical',
          href: '/admin/settings/health',
          action: 'Tjek',
          owner: 'Teknik',
        },
        {
          label: 'Email-afsender',
          detail: resendSetup.detail,
          status: resendSetup.status === 'ok' ? 'ready' : resendSetup.status === 'warning' ? 'warning' : 'critical',
          href: '/admin/settings/health',
          action: 'Tjek',
          owner: 'Teknik',
        },
        {
          label: 'Fejlsporing',
          detail: process.env.NEXT_PUBLIC_SENTRY_DSN
            ? 'Sentry DSN er sat'
            : 'Sentry DSN mangler. Fejl bliver ikke samlet centralt.',
          status: process.env.NEXT_PUBLIC_SENTRY_DSN ? 'ready' : 'warning',
          href: '/admin/settings/health',
          action: 'Tjek',
          owner: 'Teknik',
        },
      ],
    },
  ];

  const flatChecks = checks.flatMap((group) => group.items);
  const readyCount = flatChecks.filter((check) => check.status === 'ready').length;
  const warningCount = flatChecks.filter((check) => check.status === 'warning').length;
  const criticalCount = flatChecks.filter((check) => check.status === 'critical').length;
  const readiness = Math.round((flatChecks.reduce((sum, check) => sum + statusScore(check.status), 0) / flatChecks.length) * 100);
  const nextActions = flatChecks
    .filter((check) => check.status !== 'ready')
    .sort((a, b) => (a.status === 'critical' ? 0 : 1) - (b.status === 'critical' ? 0 : 1))
    .slice(0, 4);
  const checkedAt = new Date().toLocaleString('da-DK', { dateStyle: 'medium', timeStyle: 'short' });

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-4">
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
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1.5 rounded-xl border border-stone-200 bg-white px-3 py-2 text-xs font-medium text-stone-500 shadow-sm shadow-stone-900/5 dark:border-stone-800 dark:bg-stone-900 dark:text-stone-400">
            <Clock3 size={14} />
            {checkedAt}
          </div>
          <div className="rounded-2xl border border-stone-200 bg-white px-5 py-3 text-right shadow-sm shadow-stone-900/5 dark:border-stone-800 dark:bg-stone-900">
            <p className="text-2xl font-bold text-stone-900 dark:text-stone-100">{readiness}%</p>
            <p className="text-xs font-medium text-stone-500 dark:text-stone-400">klarhed</p>
          </div>
        </div>
      </div>

      <div className="mt-8 grid grid-cols-2 gap-4 lg:grid-cols-5">
        <SummaryCard label="Klar" value={readyCount.toString()} icon={CheckCircle2} tone="from-emerald-500 to-emerald-600" />
        <SummaryCard label="Bør tjekkes" value={warningCount.toString()} icon={AlertTriangle} tone="from-amber-500 to-amber-600" />
        <SummaryCard label="Mangler" value={criticalCount.toString()} icon={XCircle} tone="from-red-500 to-red-600" />
        <SummaryCard label="Tilmeldinger" value={waitlist.toString()} icon={Users} tone="from-violet-500 to-violet-600" />
        <SummaryCard label="Kritiske sager" value={urgentTickets.toString()} icon={Inbox} tone="from-rose-500 to-rose-600" />
      </div>

      <div className="mt-6 h-2 overflow-hidden rounded-full bg-stone-100 dark:bg-stone-800">
        <div className="h-full rounded-full bg-gradient-to-r from-rose-500 via-amber-500 to-emerald-500" style={{ width: `${readiness}%` }} />
      </div>

      {nextActions.length > 0 && (
        <section className="mt-8 rounded-2xl border border-amber-200 bg-amber-50/70 p-5 shadow-sm shadow-stone-900/5 dark:border-amber-500/20 dark:bg-amber-500/10">
          <div className="flex items-center gap-2">
            <Gauge size={17} className="text-amber-700 dark:text-amber-400" />
            <h2 className="text-sm font-bold text-stone-900 dark:text-stone-100">Næste vigtigste handlinger</h2>
          </div>
          <div className="mt-4 grid grid-cols-1 gap-2 md:grid-cols-2">
            {nextActions.map((check) => (
              <CheckRow key={`next-${check.label}`} check={check} />
            ))}
          </div>
        </section>
      )}

      <div className="mt-8 grid grid-cols-1 gap-5 lg:grid-cols-2">
        {checks.map((group) => (
          <section key={group.title}>
            <div className="mb-3 flex items-center gap-2">
              {group.title === 'Publikum' && <Users size={16} className="text-stone-400" />}
              {group.title === 'Hjemmeside' && <Globe2 size={16} className="text-stone-400" />}
              {group.title === 'App-indhold' && <Tag size={16} className="text-stone-400" />}
              {group.title === 'Drift' && <Database size={16} className="text-stone-400" />}
              {group.title === 'Teknisk' && <MailCheck size={16} className="text-stone-400" />}
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
            <ClipboardCheck size={17} />
          </div>
          <div>
            <p className="text-sm font-semibold text-stone-900 dark:text-stone-100">Brug siden som launch-ritual</p>
            <p className="mt-1 text-sm leading-relaxed text-stone-500 dark:text-stone-400">
              Når noget står som mangler eller tjek, kan du gå direkte til den relevante adminside, rette data og vende tilbage hertil. Siden bruger eksisterende data og driftstjek, så den kan fungere som jeres faste kontrolrum før website-launch.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
