import { createHash } from 'node:crypto';

export function maskEmail(email: string) {
  const normalized = email.trim().toLowerCase();
  const [local, domain] = normalized.split('@');
  if (!local || !domain) return 'maskeret email';

  const maskedLocal = local.length <= 2 ? `${local[0] ?? '*'}***` : `${local.slice(0, 2)}***${local.at(-1)}`;
  const [domainName, ...domainParts] = domain.split('.');
  const maskedDomain = domainName
    ? `${domainName[0]}***${domainParts.length > 0 ? `.${domainParts.join('.')}` : ''}`
    : '***';

  return `${maskedLocal}@${maskedDomain}`;
}

export function emailAuditId(email: string) {
  return createHash('sha256').update(email.trim().toLowerCase()).digest('hex').slice(0, 12);
}
