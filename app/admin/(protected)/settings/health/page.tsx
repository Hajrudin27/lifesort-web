import {
  AlertTriangle,
  CheckCircle2,
  Clock3,
  Database,
  ImageIcon,
  MailCheck,
  ServerCog,
  ShieldCheck,
  Table2,
  XCircle,
} from 'lucide-react';
import { createAdminClient } from '@/lib/supabase/admin';
import { createClient } from '@/lib/supabase/server';
import { getResendSetupStatus } from '@/lib/resend';
import {
  CLOSED_TICKET_MONTHS,
  UNCONFIRMED_WAITLIST_DAYS,
  getDataRetentionPreview,
  type DataRetentionPreview,
} from '@/lib/data-retention';

type CheckStatus = 'ok' | 'missing' | 'warning';

type Check = {
  label: string;
  status: CheckStatus;
  detail: string;
};

type CheckGroup = {
  title: string;
  description: string;
  icon: typeof ShieldCheck;
  checks: Check[];
};

const STATUS_META: Record<CheckStatus, { label: string; icon: typeof CheckCircle2; text: string; bg: string; badge: string }> = {
  ok: {
    label: 'Klar',
    icon: CheckCircle2,
    text: 'text-emerald-700 dark:text-emerald-400',
    bg: 'bg-emerald-100 dark:bg-emerald-500/15',
    badge: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-400',
  },
  missing: {
    label: 'Mangler',
    icon: XCircle,
    text: 'text-red-700 dark:text-red-400',
    bg: 'bg-red-100 dark:bg-red-500/15',
    badge: 'bg-red-100 text-red-700 dark:bg-red-500/15 dark:text-red-400',
  },
  warning: {
    label: 'Tjek',
    icon: AlertTriangle,
    text: 'text-amber-700 dark:text-amber-400',
    bg: 'bg-amber-100 dark:bg-amber-500/15',
    badge: 'bg-amber-100 text-amber-700 dark:bg-amber-500/15 dark:text-amber-400',
  },
};

function envCheck(name: string, label: string, required = true): Check {
  const value = process.env[name];
  if (!value || value.trim().length === 0) {
    return { label, status: required ? 'missing' : 'warning', detail: `${name} er ikke sat` };
  }
  return { label, status: 'ok', detail: `${name} er sat` };
}

function boolCheck(label: string, ok: boolean, okDetail: string, missingDetail: string, missingStatus: CheckStatus = 'missing'): Check {
  return {
    label,
    status: ok ? 'ok' : missingStatus,
    detail: ok ? okDetail : missingDetail,
  };
}

function countCheck(label: string, count: number | null, warningAt = 1): Check {
  const value = count ?? 0;
  return {
    label,
    status: value >= warningAt ? 'ok' : 'warning',
    detail: `${value} rækker fundet`,
  };
}

function CheckRow({ check }: { check: Check }) {
  const meta = STATUS_META[check.status];
  const Icon = meta.icon;

  return (
    <div className="flex items-center gap-3 rounded-xl border border-stone-200 bg-white p-4 shadow-sm shadow-stone-900/5 dark:border-stone-800 dark:bg-stone-900">
      <div className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-xl ${meta.bg}`}>
        <Icon size={17} className={meta.text} />
      </div>
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2">
          <p className="text-sm font-semibold text-stone-900 dark:text-stone-100">{check.label}</p>
          <span className={`shrink-0 rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide ${meta.badge}`}>
            {meta.label}
          </span>
        </div>
        <p className="mt-0.5 text-xs leading-relaxed text-stone-500 dark:text-stone-400">{check.detail}</p>
      </div>
    </div>
  );
}

function SummaryCard({
  label,
  value,
  detail,
  icon: Icon,
  tone,
}: {
  label: string;
  value: string;
  detail: string;
  icon: typeof ShieldCheck;
  tone: string;
}) {
  return (
    <div className="rounded-2xl border border-stone-200 bg-white p-5 shadow-sm shadow-stone-900/5 dark:border-stone-800 dark:bg-stone-900">
      <div className={`flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br ${tone}`}>
        <Icon className="h-5 w-5 text-white" strokeWidth={2.2} />
      </div>
      <p className="mt-4 text-2xl font-bold text-stone-900 dark:text-stone-100">{value}</p>
      <p className="text-xs font-medium text-stone-500 dark:text-stone-400">{label}</p>
      <p className="mt-2 text-xs text-stone-400 dark:text-stone-500">{detail}</p>
    </div>
  );
}

function formatDate(value: string) {
  return new Intl.DateTimeFormat('da-DK', { dateStyle: 'medium' }).format(new Date(value));
}

function RetentionPreviewPanel({ preview }: { preview: DataRetentionPreview | null }) {
  const hasFailures = preview ? Object.values(preview.failed).some(Boolean) : true;
  const total = preview
    ? preview.wouldDelete.tickets + preview.wouldDelete.waitlistSignups + preview.wouldDelete.orphanedAttachments
    : 0;
  const metrics = preview
    ? [
        {
          label: 'Lukkede supportsager',
          value: preview.wouldDelete.tickets,
          detail: `Ældre end ${CLOSED_TICKET_MONTHS} måneder · før ${formatDate(preview.cutoffs.tickets)}`,
          failed: preview.failed.tickets,
          error: preview.errors.tickets,
        },
        {
          label: 'Ubekræftet venteliste',
          value: preview.wouldDelete.waitlistSignups,
          detail: `Ældre end ${UNCONFIRMED_WAITLIST_DAYS} dage · før ${formatDate(preview.cutoffs.waitlist)}`,
          failed: preview.failed.waitlistSignups,
          error: preview.errors.waitlistSignups,
        },
        {
          label: 'Forældreløse attachments',
          value: preview.wouldDelete.orphanedAttachments,
          detail: 'Filer uden ejerkonto i attachments-bucket',
          failed: preview.failed.orphanedAttachments,
          error: preview.errors.orphanedAttachments,
        },
      ]
    : [];

  return (
    <section className="mt-6 rounded-2xl border border-stone-200 bg-white p-5 shadow-sm shadow-stone-900/5 dark:border-stone-800 dark:bg-stone-900">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-stone-100 text-stone-600 dark:bg-stone-800 dark:text-stone-300">
              <Database size={15} />
            </div>
            <h2 className="text-sm font-bold text-stone-900 dark:text-stone-100">Data-retention dry run</h2>
          </div>
          <p className="mt-2 max-w-2xl text-xs leading-relaxed text-stone-500 dark:text-stone-400">
            Viser hvad den daglige oprydning ville slette lige nu, uden at fjerne noget.
          </p>
        </div>
        <div
          className={`rounded-xl px-3 py-2 text-right ${
            hasFailures
              ? 'bg-red-100 text-red-700 dark:bg-red-500/15 dark:text-red-400'
              : 'bg-emerald-100 text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-400'
          }`}
        >
          <p className="text-2xl font-bold leading-none">{total}</p>
          <p className="mt-1 text-[10px] font-bold uppercase tracking-wide">
            {hasFailures ? 'Kræver tjek' : 'Ville blive slettet'}
          </p>
        </div>
      </div>

      {preview ? (
        <div className="mt-4 grid grid-cols-1 gap-3 lg:grid-cols-3">
          {metrics.map((metric) => {
            const MetricIcon = metric.failed ? AlertTriangle : CheckCircle2;
            const tone = metric.failed
              ? 'bg-red-100 text-red-700 dark:bg-red-500/15 dark:text-red-400'
              : metric.value > 0
                ? 'bg-amber-100 text-amber-700 dark:bg-amber-500/15 dark:text-amber-400'
                : 'bg-emerald-100 text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-400';

            return (
              <div key={metric.label} className="rounded-xl border border-stone-200 bg-stone-50 p-4 dark:border-stone-800 dark:bg-stone-950/40">
                <div className="flex items-center justify-between gap-3">
                  <p className="text-sm font-semibold text-stone-900 dark:text-stone-100">{metric.label}</p>
                  <div className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg ${tone}`}>
                    <MetricIcon size={15} />
                  </div>
                </div>
                <p className="mt-3 text-3xl font-bold text-stone-900 dark:text-stone-100">{metric.value}</p>
                <p className="mt-1 text-xs leading-relaxed text-stone-500 dark:text-stone-400">
                  {metric.error ?? metric.detail}
                </p>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="mt-4 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700 dark:border-red-500/20 dark:bg-red-500/10 dark:text-red-300">
          Data-retention kunne ikke forhåndsvises, fordi Supabase service role eller URL mangler.
        </div>
      )}
    </section>
  );
}

export default async function EnvironmentHealthPage() {
  const resendSetup = await getResendSetupStatus();
  const envChecks: Check[] = [
    envCheck('NEXT_PUBLIC_SUPABASE_URL', 'Supabase URL'),
    envCheck('NEXT_PUBLIC_SUPABASE_ANON_KEY', 'Supabase anon-nøgle'),
    envCheck('SUPABASE_SERVICE_ROLE_KEY', 'Supabase service role-nøgle'),
    envCheck('RESEND_API_KEY', 'Resend API-nøgle'),
    envCheck('CRON_SECRET', 'Cron-secret (digests og data-retention)'),
    envCheck('NEXT_PUBLIC_SENTRY_DSN', 'Sentry DSN', false),
  ];

  // RESEND_FROM_EMAIL har en fallback i koden, så den mangler aldrig teknisk set —
  // men uden den sender I stadig kun til jeres egen Resend-konto.
  const fromEmail = process.env.RESEND_FROM_EMAIL;
  envChecks.push({
    label: 'Verificeret afsenderadresse',
    status: fromEmail ? 'ok' : 'missing',
    detail: fromEmail
      ? 'RESEND_FROM_EMAIL er sat'
      : 'RESEND_FROM_EMAIL er ikke sat. Support-mails kan ikke sendes til rigtige modtagere.',
  });

  const sentryOrg = process.env.SENTRY_ORG;
  envChecks.push({
    label: 'Sentry-organisation',
    status: sentryOrg ? 'ok' : 'warning',
    detail: sentryOrg ? 'SENTRY_ORG er sat' : 'SENTRY_ORG er ikke sat. Source maps uploades ikke.',
  });

  // Rigtig forbindelsestest, ikke kun om nøglerne er sat.
  let supabaseLive: Check;
  let databaseChecks: Check[] = [];
  let contentChecks: Check[] = [];
  let storageChecks: Check[] = [];
  let dataRetentionPreview: DataRetentionPreview | null = null;
  try {
    const supabase = await createClient();
    const { error } = await supabase.from('admin_users').select('id', { count: 'exact', head: true });
    supabaseLive = error
      ? { label: 'Supabase-forbindelse', status: 'missing', detail: `Forespørgsel fejlede: ${error.message}` }
      : { label: 'Supabase-forbindelse', status: 'ok', detail: 'Forespørgsel til admin_users lykkedes' };

    if (process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.SUPABASE_SERVICE_ROLE_KEY) {
      const admin = createAdminClient();
      const [
        supportSchema,
        waitlistSchema,
        activitySchema,
        productsSchema,
        recipeImagesBucket,
        waitlistCount,
        ticketsCount,
        recipesCount,
        productsCount,
        pricesCount,
        conditionsCount,
        symptomsCount,
        retentionPreview,
      ] = await Promise.all([
        admin.from('support_tickets').select('id, status, priority, category, internal_note, updated_at').limit(1),
        admin.from('waitlist_signups').select('id, email, platform, confirmed, confirm_token, created_at').limit(1),
        admin.from('activity_log').select('id, entity_id, entity_type, entity_label').limit(1),
        admin.from('products').select('id, name, created_at').limit(1),
        admin.storage.getBucket('recipe-images'),
        admin.from('waitlist_signups').select('id', { count: 'exact', head: true }),
        admin.from('support_tickets').select('id', { count: 'exact', head: true }),
        admin.from('global_recipes').select('id', { count: 'exact', head: true }),
        admin.from('products').select('id', { count: 'exact', head: true }),
        admin.from('global_standard_prices').select('id', { count: 'exact', head: true }),
        admin.from('health_conditions').select('id', { count: 'exact', head: true }),
        admin.from('symptom_glossary').select('id', { count: 'exact', head: true }),
        getDataRetentionPreview(admin),
      ]);

      dataRetentionPreview = retentionPreview;

      databaseChecks = [
        boolCheck(
          'Support-schema',
          !supportSchema.error,
          'Prioritet, kategori, intern note og updated_at er tilgængelige',
          supportSchema.error?.message ?? 'Support-schema kunne ikke tjekkes'
        ),
        boolCheck(
          'Venteliste-schema',
          !waitlistSchema.error,
          'Bekræftelsesstatus og confirm_token er tilgængelige',
          waitlistSchema.error?.message ?? 'Venteliste-schema kunne ikke tjekkes'
        ),
        boolCheck(
          'Aktivitetslog lookup',
          !activitySchema.error,
          'entity_id kan bruges til historik på konkrete sager',
          activitySchema.error?.message ?? 'Aktivitetslog-schema kunne ikke tjekkes'
        ),
        boolCheck(
          'Varer-schema',
          !productsSchema.error,
          'Produkter kan kobles til standardpriser og CSV-import',
          productsSchema.error?.message ?? 'Varer-schema kunne ikke tjekkes'
        ),
      ];

      storageChecks = [
        recipeImagesBucket.error
          ? {
              label: 'Opskriftsbilleder',
              status: 'missing',
              detail: `Storage bucket recipe-images mangler eller kan ikke læses: ${recipeImagesBucket.error.message}`,
            }
          : {
              label: 'Opskriftsbilleder',
              status: recipeImagesBucket.data.public ? 'ok' : 'warning',
              detail: recipeImagesBucket.data.public
                ? 'recipe-images bucket findes og er public, så billed-URLs kan vises'
                : 'recipe-images bucket findes, men er privat. Upload virker måske, men billeder kan ikke vises via public URL.',
            },
      ];

      contentChecks = [
        countCheck('Venteliste', waitlistCount.count),
        countCheck('Supportsager', ticketsCount.count, 0),
        countCheck('Opskrifter', recipesCount.count, 5),
        countCheck('Varer', productsCount.count, 20),
        countCheck('Standardpriser', pricesCount.count, 20),
        countCheck('Sundhedstilstande', conditionsCount.count, 3),
        countCheck('Symptomordbog', symptomsCount.count, 3),
      ];
    } else {
      databaseChecks = [
        { label: 'Service role schema-tjek', status: 'missing', detail: 'SUPABASE_SERVICE_ROLE_KEY eller URL mangler' },
      ];
      storageChecks = [
        { label: 'Opskriftsbilleder', status: 'missing', detail: 'SUPABASE_SERVICE_ROLE_KEY eller URL mangler' },
      ];
    }
  } catch (err) {
    supabaseLive = {
      label: 'Supabase-forbindelse',
      status: 'missing',
      detail: err instanceof Error ? err.message : 'Ukendt fejl',
    };
    storageChecks = [
      { label: 'Opskriftsbilleder', status: 'missing', detail: 'Storage kunne ikke tjekkes, fordi Supabase-forbindelsen fejlede' },
    ];
  }
  envChecks.splice(3, 0, supabaseLive);

  const cronChecks: Check[] = [
    boolCheck(
      'Ugentlig digest',
      Boolean(process.env.CRON_SECRET && resendSetup.status === 'ok'),
      'Cron-secret og Resend-afsender er klar',
      'CRON_SECRET eller Resend-afsender mangler'
    ),
    boolCheck(
      'Data-retention',
      Boolean(process.env.CRON_SECRET),
      'Daglig oprydning af gamle lukkede supportsager, ubekræftede ventelister og forældreløse attachments er klar',
      'CRON_SECRET mangler. /api/cron/data-retention kan ikke køres sikkert.'
    ),
    {
      label: 'Resend-domæne',
      status: resendSetup.status,
      detail: resendSetup.detail,
    },
    boolCheck(
      'Email-afsender',
      resendSetup.hasFromEmail,
      'Afsenderdomæne er sat via RESEND_FROM_EMAIL',
      'RESEND_FROM_EMAIL mangler. Support-mails kan ikke sendes til rigtige modtagere.'
    ),
    boolCheck(
      'Fejlsporing',
      Boolean(process.env.NEXT_PUBLIC_SENTRY_DSN),
      'Sentry DSN er sat',
      'Sentry DSN mangler. Fejl bliver ikke samlet centralt.',
      'warning'
    ),
  ];

  const groups: CheckGroup[] = [
    {
      title: 'Miljø',
      description: 'Servernøgler, email og fejlsporing',
      icon: ServerCog,
      checks: envChecks,
    },
    {
      title: 'Database',
      description: 'Forbindelse og schema for de nyeste adminfeatures',
      icon: Database,
      checks: databaseChecks,
    },
    {
      title: 'Indhold',
      description: 'Datagrundlag for hjemmeside, launch og admin',
      icon: Table2,
      checks: contentChecks,
    },
    {
      title: 'Storage',
      description: 'Buckets og filadgang til admin-indhold',
      icon: ImageIcon,
      checks: storageChecks,
    },
    {
      title: 'Automatik',
      description: 'Email, data-retention og ugentlige admin-digests',
      icon: MailCheck,
      checks: cronChecks,
    },
  ];

  const allChecks = groups.flatMap((group) => group.checks);
  const okCount = allChecks.filter((c) => c.status === 'ok').length;
  const missingCount = allChecks.filter((c) => c.status === 'missing').length;
  const warningCount = allChecks.filter((c) => c.status === 'warning').length;
  const checkedAt = new Date().toLocaleString('da-DK', { dateStyle: 'medium', timeStyle: 'short' });

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-stone-800 to-stone-900">
            <ShieldCheck className="h-5 w-5 text-white" strokeWidth={2.2} />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-stone-900 dark:text-stone-100">Sundhedstjek</h1>
            <p className="text-sm text-stone-500 dark:text-stone-400">
              {missingCount > 0
                ? `${missingCount} kritiske ting kræver handling`
                : warningCount > 0
                  ? `${warningCount} ting bør tjekkes`
                  : 'Alt ser klar ud'}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-1.5 rounded-xl border border-stone-200 bg-white px-3 py-2 text-xs font-medium text-stone-500 shadow-sm shadow-stone-900/5 dark:border-stone-800 dark:bg-stone-900 dark:text-stone-400">
          <Clock3 size={14} />
          {checkedAt}
        </div>
      </div>

      <div className="mt-8 grid grid-cols-1 gap-4 sm:grid-cols-3">
        <SummaryCard label="Klar" value={okCount.toString()} detail="Tjek der er grønne" icon={CheckCircle2} tone="from-emerald-500 to-emerald-600" />
        <SummaryCard label="Bør tjekkes" value={warningCount.toString()} detail="Ikke blokerende, men værd at rydde op" icon={AlertTriangle} tone="from-amber-500 to-amber-600" />
        <SummaryCard label="Kritisk" value={missingCount.toString()} detail="Kan blokere features eller drift" icon={XCircle} tone="from-red-500 to-red-600" />
      </div>

      <RetentionPreviewPanel preview={dataRetentionPreview} />

      <div className="mt-6 grid grid-cols-1 gap-4 lg:grid-cols-2">
        {groups.map((group) => {
          const Icon = group.icon;
          return (
            <section key={group.title} className="rounded-2xl border border-stone-200 bg-stone-50/60 p-4 dark:border-stone-800 dark:bg-stone-950/40">
              <div className="mb-3 flex items-center gap-2">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-white text-stone-500 shadow-sm shadow-stone-900/5 dark:bg-stone-900 dark:text-stone-400">
                  <Icon size={15} />
                </div>
                <div>
                  <h2 className="text-sm font-bold text-stone-900 dark:text-stone-100">{group.title}</h2>
                  <p className="text-xs text-stone-500 dark:text-stone-400">{group.description}</p>
                </div>
              </div>
              <div className="flex flex-col gap-2">
                {group.checks.map((check) => <CheckRow key={`${group.title}-${check.label}`} check={check} />)}
              </div>
            </section>
          );
        })}
      </div>

      <p className="mt-6 text-xs text-stone-400 dark:text-stone-500">
        Denne side viser kun om nøgler er sat, aldrig deres faktiske værdi — sikkert at have tilgængeligt for jer begge.
      </p>
    </div>
  );
}
