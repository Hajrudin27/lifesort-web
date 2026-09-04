import { CheckCircle2, XCircle, AlertTriangle, ShieldCheck } from 'lucide-react';
import { createClient } from '@/lib/supabase/server';

type CheckStatus = 'ok' | 'missing' | 'warning';

type Check = {
  label: string;
  status: CheckStatus;
  detail: string;
};

const STATUS_META: Record<CheckStatus, { icon: typeof CheckCircle2; text: string; bg: string }> = {
  ok: { icon: CheckCircle2, text: 'text-emerald-700 dark:text-emerald-400', bg: 'bg-emerald-100 dark:bg-emerald-500/15' },
  missing: { icon: XCircle, text: 'text-red-700 dark:text-red-400', bg: 'bg-red-100 dark:bg-red-500/15' },
  warning: { icon: AlertTriangle, text: 'text-amber-700 dark:text-amber-400', bg: 'bg-amber-100 dark:bg-amber-500/15' },
};

function envCheck(name: string, label: string, required = true): Check {
  const value = process.env[name];
  if (!value || value.trim().length === 0) {
    return { label, status: required ? 'missing' : 'warning', detail: `${name} er ikke sat` };
  }
  return { label, status: 'ok', detail: `${name} er sat` };
}

export default async function EnvironmentHealthPage() {
  const checks: Check[] = [
    envCheck('NEXT_PUBLIC_SUPABASE_URL', 'Supabase URL'),
    envCheck('NEXT_PUBLIC_SUPABASE_ANON_KEY', 'Supabase anon-nøgle'),
    envCheck('SUPABASE_SERVICE_ROLE_KEY', 'Supabase service role-nøgle'),
    envCheck('RESEND_API_KEY', 'Resend API-nøgle'),
    envCheck('CRON_SECRET', 'Cron-secret (ugentlig digest)'),
    envCheck('NEXT_PUBLIC_SENTRY_DSN', 'Sentry DSN', false),
  ];

  // RESEND_FROM_EMAIL har en fallback i koden, så den mangler aldrig teknisk set —
  // men uden den sender I stadig kun til jeres egen Resend-konto.
  const fromEmail = process.env.RESEND_FROM_EMAIL;
  checks.push({
    label: 'Verificeret afsenderadresse',
    status: fromEmail ? 'ok' : 'warning',
    detail: fromEmail
      ? `Sender fra ${fromEmail}`
      : 'RESEND_FROM_EMAIL er ikke sat — sender stadig kun til jeres egen Resend-konto (onboarding@resend.dev)',
  });

  const sentryOrg = process.env.SENTRY_ORG;
  checks.push({
    label: 'Sentry-organisation',
    status: sentryOrg ? 'ok' : 'warning',
    detail: sentryOrg ? `Org sat til ${sentryOrg}` : 'SENTRY_ORG er ikke sat — source maps uploades ikke',
  });

  // Rigtig forbindelsestest, ikke kun om nøglerne er sat.
  let supabaseLive: Check;
  try {
    const supabase = await createClient();
    const { error } = await supabase.from('admin_users').select('id', { count: 'exact', head: true });
    supabaseLive = error
      ? { label: 'Supabase-forbindelse', status: 'missing', detail: `Forespørgsel fejlede: ${error.message}` }
      : { label: 'Supabase-forbindelse', status: 'ok', detail: 'Forespørgsel til admin_users lykkedes' };
  } catch (err) {
    supabaseLive = {
      label: 'Supabase-forbindelse',
      status: 'missing',
      detail: err instanceof Error ? err.message : 'Ukendt fejl',
    };
  }
  checks.splice(3, 0, supabaseLive);

  const missingCount = checks.filter((c) => c.status === 'missing').length;
  const warningCount = checks.filter((c) => c.status === 'warning').length;

  return (
    <div>
      <div className="flex items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-stone-800 to-stone-900">
          <ShieldCheck className="h-5 w-5 text-white" strokeWidth={2.2} />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-stone-900 dark:text-stone-100">Miljø-sundhedstjek</h1>
          <p className="text-sm text-stone-500 dark:text-stone-400">
            {missingCount > 0
              ? `${missingCount} kritiske ting mangler`
              : warningCount > 0
                ? `${warningCount} ting er ikke helt sat op`
                : 'Alt ser korrekt konfigureret ud'}
          </p>
        </div>
      </div>

      <div className="mt-6 flex flex-col gap-2">
        {checks.map((check) => {
          const meta = STATUS_META[check.status];
          const Icon = meta.icon;
          return (
            <div key={check.label}
              className="flex items-center gap-3 rounded-2xl border border-stone-200 bg-white p-4 shadow-sm shadow-stone-900/5 dark:border-stone-800 dark:bg-stone-900">
              <div className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-xl ${meta.bg}`}>
                <Icon size={17} className={meta.text} />
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-sm font-semibold text-stone-900 dark:text-stone-100">{check.label}</p>
                <p className="truncate text-xs text-stone-500 dark:text-stone-400">{check.detail}</p>
              </div>
            </div>
          );
        })}
      </div>

      <p className="mt-6 text-xs text-stone-400 dark:text-stone-500">
        Denne side viser kun om nøgler er sat, aldrig deres faktiske værdi — sikkert at have tilgængeligt for jer begge.
      </p>
    </div>
  );
}