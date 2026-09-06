type SendEmailInput = {
  to: string;
  subject: string;
  html: string;
};

export type EmailErrorCode =
  | 'missing_api_key'
  | 'missing_from_email'
  | 'resend_rejected'
  | 'resend_unreachable';

export type EmailResult =
  | { ok: true }
  | {
      ok: false;
      code: EmailErrorCode;
      error: string;
      status?: number;
      setupHint?: string;
    };

type ResendDomain = {
  name?: string;
  status?: string;
};

export type ResendSetupStatus = {
  hasApiKey: boolean;
  hasFromEmail: boolean;
  fromDomain: string | null;
  verifiedDomains: string[];
  status: 'ok' | 'missing' | 'warning';
  detail: string;
};

const RESEND_SETUP_HINT =
  'Tilføj et verificeret domæne i Resend og sæt RESEND_FROM_EMAIL, fx LifeSort Support <support@lifesort.app>.';

function fromEmail() {
  return process.env.RESEND_FROM_EMAIL?.trim() || null;
}

function extractAddress(value: string) {
  const bracketMatch = value.match(/<([^>]+)>/);
  return (bracketMatch?.[1] ?? value).trim().toLowerCase();
}

function domainFromEmail(value: string | null) {
  if (!value) return null;
  const address = extractAddress(value);
  const domain = address.split('@')[1];
  return domain || null;
}

function publicResendError(status: number, body: string) {
  if (/domain.*not.*verified|verify a domain|onboarding@resend\.dev|testing emails/i.test(body)) {
    return 'Resend mangler en verificeret afsenderadresse til rigtige modtagere.';
  }
  if (status === 403 || status === 401) {
    return 'Resend API-nøglen blev afvist.';
  }
  return 'Resend afviste emailen.';
}

export async function getResendSetupStatus(): Promise<ResendSetupStatus> {
  const apiKey = process.env.RESEND_API_KEY;
  const configuredFrom = fromEmail();
  const fromDomain = domainFromEmail(configuredFrom);

  if (!apiKey) {
    return {
      hasApiKey: false,
      hasFromEmail: Boolean(configuredFrom),
      fromDomain,
      verifiedDomains: [],
      status: 'missing',
      detail: 'RESEND_API_KEY mangler.',
    };
  }

  if (!configuredFrom) {
    return {
      hasApiKey: true,
      hasFromEmail: false,
      fromDomain,
      verifiedDomains: [],
      status: 'missing',
      detail: `RESEND_FROM_EMAIL mangler. ${RESEND_SETUP_HINT}`,
    };
  }

  try {
    const response = await fetch('https://api.resend.com/domains', {
      headers: { Authorization: `Bearer ${apiKey}` },
      cache: 'no-store',
    });

    if (!response.ok) {
      return {
        hasApiKey: true,
        hasFromEmail: true,
        fromDomain,
        verifiedDomains: [],
        status: 'warning',
        detail: 'Kunne ikke hente Resend-domæner. Tjek Resend dashboard manuelt.',
      };
    }

    const body = await response.json().catch(() => ({}));
    const domains = Array.isArray(body.data) ? body.data as ResendDomain[] : [];
    const verifiedDomains = domains
      .filter((domain) => domain.status === 'verified' && domain.name)
      .map((domain) => domain.name!);
    const fromDomainVerified = Boolean(fromDomain && verifiedDomains.includes(fromDomain));

    return {
      hasApiKey: true,
      hasFromEmail: true,
      fromDomain,
      verifiedDomains,
      status: fromDomainVerified ? 'ok' : 'missing',
      detail: fromDomainVerified
        ? `Afsenderdomænet ${fromDomain} er verificeret i Resend.`
        : `Afsenderdomænet ${fromDomain ?? 'ukendt'} er ikke verificeret i Resend. ${RESEND_SETUP_HINT}`,
    };
  } catch {
    return {
      hasApiKey: true,
      hasFromEmail: true,
      fromDomain,
      verifiedDomains: [],
      status: 'warning',
      detail: 'Kunne ikke kontakte Resend lige nu. Tjek Resend dashboard manuelt.',
    };
  }
}

export async function sendEmail({ to, subject, html }: SendEmailInput): Promise<EmailResult> {
  const resendApiKey = process.env.RESEND_API_KEY;
  if (!resendApiKey) {
    return {
      ok: false,
      code: 'missing_api_key',
      error: 'RESEND_API_KEY er ikke konfigureret på serveren.',
      setupHint: RESEND_SETUP_HINT,
    };
  }

  const configuredFrom = fromEmail();
  if (!configuredFrom) {
    return {
      ok: false,
      code: 'missing_from_email',
      error: 'RESEND_FROM_EMAIL mangler, så LifeSort har ingen verificeret afsenderadresse.',
      setupHint: RESEND_SETUP_HINT,
    };
  }

  let response: Response;
  try {
    response = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${resendApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: configuredFrom,
        to,
        subject,
        html,
      }),
    });
  } catch {
    return {
      ok: false,
      code: 'resend_unreachable',
      error: 'Kunne ikke kontakte Resend.',
    };
  }

  if (!response.ok) {
    const body = await response.text();
    return {
      ok: false,
      code: 'resend_rejected',
      status: response.status,
      error: publicResendError(response.status, body),
      setupHint: RESEND_SETUP_HINT,
    };
  }

  return { ok: true };
}

/**
 * Escaper tekst til brug i HTML-mails.
 *
 * Citationstegn er med, selvom alle nuværende kaldesteder indsætter i tekstindhold hvor de
 * er harmløse: første gang nogen bruger den inde i en attribut — href, style, alt — ville
 * en manglende escaping af " eller ' lade værdien bryde ud af attributten. Det er billigere
 * at dække det nu end at huske reglen hver gang.
 */
export function escapeHtml(str: string) {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}
