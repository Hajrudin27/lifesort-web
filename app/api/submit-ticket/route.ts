import { NextResponse } from 'next/server';
import * as Sentry from '@sentry/nextjs';
import { createAdminClient } from '@/lib/supabase/admin';
import { checkRateLimit, getClientIp, emailKey } from '@/lib/rate-limit';
import { sendEmail, escapeHtml } from '@/lib/resend';
import { cleanText, cleanEmail, readJsonBody, FIELD_LIMITS } from '@/lib/validation';

const CATEGORIES = ['general', 'bug', 'billing', 'feature', 'account'] as const;
const PRIORITIES = ['low', 'normal', 'high', 'urgent'] as const;

type SupportCategory = (typeof CATEGORIES)[number];
type SupportPriority = (typeof PRIORITIES)[number];

const CATEGORY_LABEL: Record<SupportCategory, string> = {
  general: 'Generelt',
  bug: 'Fejl',
  billing: 'Betaling',
  feature: 'Feature',
  account: 'Konto',
};

const PRIORITY_LABEL: Record<SupportPriority, string> = {
  low: 'Lav',
  normal: 'Normal',
  high: 'Høj',
  urgent: 'Haster',
};

function isOneOf<T extends readonly string[]>(value: unknown, options: T): value is T[number] {
  return typeof value === 'string' && options.includes(value);
}

export async function POST(request: Request) {
  const parsedBody = await readJsonBody(request);
  if (!parsedBody.ok) {
    return NextResponse.json({ error: parsedBody.error }, { status: parsedBody.status });
  }
  const body = (parsedBody.data ?? {}) as Record<string, unknown>;
  const { name, email, subject, message, company } = body;
  const category: SupportCategory = isOneOf(body.category, CATEGORIES) ? body.category : 'general';
  const priority: SupportPriority = isOneOf(body.priority, PRIORITIES) ? body.priority : 'normal';

  // Honeypot: bots that fill in every field trip this. Pretend success, insert nothing.
  if (typeof company === 'string' && company.trim().length > 0) {
    return NextResponse.json({ ok: true });
  }

  const cleanName = cleanText(name, { label: 'Navn', max: FIELD_LIMITS.name });
  const cleanSubject = cleanText(subject, { label: 'Emne', max: FIELD_LIMITS.subject });
  const cleanMessage = cleanText(message, { label: 'Beskeden', max: FIELD_LIMITS.message });
  const cleanFrom = cleanEmail(email);

  if (!cleanName.ok) return NextResponse.json({ error: cleanName.error }, { status: 400 });
  if (!cleanFrom.ok) return NextResponse.json({ error: cleanFrom.error }, { status: 400 });
  if (!cleanSubject.ok) return NextResponse.json({ error: cleanSubject.error }, { status: 400 });
  if (!cleanMessage.ok) return NextResponse.json({ error: cleanMessage.error }, { status: 400 });

  const ip = getClientIp(request);
  const { allowed } = checkRateLimit(`ticket:${ip}`, 5, 15 * 60 * 1000); // 5 per 15 min
  if (!allowed) {
    return NextResponse.json(
      { error: 'For mange henvendelser. Prøv igen om lidt.' },
      { status: 429 }
    );
  }

  // Kvitteringsmailen sendes til den adresse, afsenderen selv skriver. Uden en grænse pr.
  // adresse kan formularen bruges til at bombardere en tredjepart med mails fra vores
  // domæne — en IP-grænse alene stopper det ikke, hvis afsenderen skifter IP.
  const { allowed: emailAllowed } = checkRateLimit(emailKey('ticket-email', cleanFrom.value), 3, 60 * 60 * 1000);
  if (!emailAllowed) {
    return NextResponse.json(
      { error: 'For mange henvendelser fra denne email. Prøv igen senere.' },
      { status: 429 }
    );
  }

  const supabase = createAdminClient();
  const { error } = await supabase.from('support_tickets').insert({
    name: cleanName.value,
    email: cleanFrom.value,
    subject: cleanSubject.value,
    message: cleanMessage.value,
    category,
    priority,
  });

  if (error) {
    Sentry.captureException(error, { tags: { route: 'submit-ticket' } });
    return NextResponse.json({ error: 'Kunne ikke oprette sagen' }, { status: 500 });
  }

  // Confirmation email is best-effort: the ticket is already saved either way.
  const emailResult = await sendEmail({
    to: cleanFrom.value,
    subject: 'Vi har modtaget din henvendelse',
    html: `
      <p>Hej ${escapeHtml(cleanName.value)},</p>
      <p>Tak for din besked — vi har modtaget den og svarer hurtigst muligt.</p>
      <p style="color: #78716c; font-size: 13px; margin-top: 24px;">
        Kategori: <strong>${CATEGORY_LABEL[category]}</strong><br>
        Prioritet: <strong>${PRIORITY_LABEL[priority]}</strong><br><br>
        Din besked:<br>
        <strong>${escapeHtml(cleanSubject.value)}</strong><br>
        <em>${escapeHtml(cleanMessage.value).replace(/\n/g, '<br>')}</em>
      </p>
      <p>Mvh<br>LifeSort Support</p>
    `,
  });
  if (!emailResult.ok) {
    Sentry.captureMessage(`Ticket confirmation email failed: ${emailResult.error}`, 'warning');
  }

  return NextResponse.json({ ok: true });
}
