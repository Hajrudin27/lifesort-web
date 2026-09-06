import * as Sentry from '@sentry/nextjs';

/**
 * Rapportering af databasefejl.
 *
 * Et fejlobjekt fra Supabase ser sådan her ud, målt mod en rigtig constraint-overtrædelse:
 *
 *   {
 *     "code": "23514",
 *     "message": "new row for relation \"support_tickets\" violates check constraint ...",
 *     "details": "Failing row contains (aeb80a77-..., Anna Hansen, anna.hansen@privat.dk,
 *                 Fortroligt emne, hemmelig besked ...)."
 *   }
 *
 * `details` er hele den række der blev afvist. Sendes objektet videre som det er, ryger
 * navnet, adressen og teksten fra en supportsag ud til en tredjepart — for en fejl der
 * intet har med indholdet at gøre.
 *
 * `code` og `message` navngiver relationen og den constraint der blev brudt, hvilket er
 * det man skal bruge for at rette fejlen. Postgres lægger de faktiske værdier i DETAIL,
 * ikke i MESSAGE, så beskeden kan tages med.
 */

type DatabaseErrorLike = {
  code?: string | null;
  message?: string | null;
  hint?: string | null;
};

function describe(error: unknown): { code: string; message: string; hint: string | null } {
  if (typeof error === 'object' && error !== null) {
    const e = error as DatabaseErrorLike;
    return {
      code: e.code ?? 'ukendt',
      message: e.message ?? 'ingen besked',
      hint: e.hint ?? null,
    };
  }
  return { code: 'ukendt', message: String(error), hint: null };
}

/**
 * Rapporterer en databasefejl til Sentry uden rækkeindholdet.
 *
 * Der bygges bevidst et nyt Error frem for at sende det oprindelige objekt videre: så kan
 * `details` ikke slippe med, heller ikke hvis Supabase en dag tilføjer flere felter.
 */
export function captureDatabaseError(
  error: unknown,
  context: { route: string; extra?: Record<string, unknown> }
): void {
  const { code, message, hint } = describe(error);

  const sanitized = new Error(`[${context.route}] ${code}: ${message}`);
  sanitized.name = 'DatabaseError';

  Sentry.captureException(sanitized, {
    tags: { route: context.route, db_code: code },
    extra: { hint, ...context.extra },
  });
}
