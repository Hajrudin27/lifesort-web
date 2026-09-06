import { createAdminClient } from '@/lib/supabase/admin';
import { captureDatabaseError } from '@/lib/observability';

/**
 * Rate limiting med en tæller alle instanser deler.
 *
 * Tidligere lå tællerne i en Map i hukommelsen. På Vercel har hver lambda-instans sin egen,
 * så "5 forsøg pr. kvarter" i praksis var 5 forsøg pr. instans — og instanser skaleres med
 * samtidighed, så parallelle kald gav et mangefold. En kold start nulstillede den også.
 * Grænsen så altså strengere ud, end den var, hvilket er værre end ingen grænse, fordi man
 * regner med den.
 *
 * Optællingen ligger nu i databasen som ét atomisk statement (se
 * 20260907140000_shared_rate_limit_store.sql). Det koster en rundtur pr. kald — en pris det
 * er værd at betale på de håndfulde offentlige endpoints der bruger den.
 */

export type RateLimitResult = { allowed: boolean; remaining: number };

/** PostgREST svarer PGRST202, når en RPC ikke findes i schema-cachen. */
function isMissingFunction(error: { code?: string | null } | null): boolean {
  return error?.code === 'PGRST202';
}

/**
 * Fejler LUKKET. Kan tælleren ikke læses, afvises kaldet.
 *
 * Overvejelsen: fejler den åbent, kan enhver der kan fremkalde en databasefejl omgå
 * grænsen helt — og det er netop brute force mod admin-login, grænsen er der for. Prisen er
 * lav, for alle ruter der bruger den, skal alligevel bruge den samme database et øjeblik
 * senere. Er Supabase nede, virker de ikke uanset hvad.
 */
export async function checkRateLimit(
  key: string,
  limit: number,
  windowMs: number
): Promise<RateLimitResult> {
  const supabase = createAdminClient();

  const { data, error } = await supabase
    .rpc('check_rate_limit', { p_key: key, p_limit: limit, p_window_ms: windowMs })
    .maybeSingle<RateLimitResult>();

  if (error || !data) {
    captureDatabaseError(error ?? new Error('check_rate_limit gav intet svar'), {
      route: 'rate-limit',
      extra: { limitKeyPrefix: key.split(':')[0] },
    });

    // Ét tilfælde fejler bevidst ÅBENT: funktionen findes slet ikke. PostgREST svarer
    // PGRST202, og det sker kun i ét scenarie — koden er deployet før migrationen er kørt.
    // Uden denne undtagelse ville netop det deploy afvise hver eneste henvendelse på
    // supportformularen og ventelisten, indtil nogen opdagede det. En angriber kan ikke
    // fremkalde tilstanden, for det kræver at kunne fjerne funktionen fra databasen.
    // Fejlen står i Sentry, og enhver ANDEN fejl fejler fortsat lukket.
    if (isMissingFunction(error)) {
      return { allowed: true, remaining: limit };
    }

    return { allowed: false, remaining: 0 };
  }

  return { allowed: data.allowed, remaining: data.remaining };
}

/**
 * Nulstiller en tæller. Bruges efter et vellykket login: en admin der taster forkert et par
 * gange og så rammer rigtigt, skal ikke gå rundt med et næsten opbrugt budget resten af
 * vinduet. Det svækker ikke beskyttelsen — for at nulstille skal man kende adgangskoden.
 *
 * En fejl her må ikke vælte et login der ellers lykkedes, så den logges og sluges.
 */
export async function resetRateLimit(key: string): Promise<void> {
  const supabase = createAdminClient();
  const { error } = await supabase.rpc('reset_rate_limit', { p_key: key });
  if (error) {
    captureDatabaseError(error, { route: 'rate-limit-reset' });
  }
}

/**
 * Klientens IP, som den kan bruges til rate limiting.
 *
 * Den gamle udgave tog FØRSTE værdi i x-forwarded-for. Den værdi kan klienten selv sætte:
 * sender man `X-Forwarded-For: 1.2.3.4` får man sin egen bucket, og med en ny værdi pr.
 * forsøg er enhver IP-baseret grænse reelt væk.
 *
 * Kun headere der sættes af platformens egen proxy bruges, fordi de overskrives på vej ind
 * og derfor ikke kan forfalskes af klienten. x-forwarded-for bruges bevidst IKKE: uden at
 * kende antallet af betroede proxyer foran os kan ingen del af den header stoles på — og
 * en grænse man kan spoofe sig udenom er værre end ingen, fordi den ser ud til at virke.
 *
 * Findes ingen af dem — lokalt, eller hvis appen flyttes til en anden hosting — falder alt
 * ned i én fælles 'unknown'-bucket. Det er en bevidst afvejning: så rammer grænsen for
 * hårdt frem for slet ikke. Flyttes appen væk fra Vercel, skal denne funktion opdateres med
 * den nye platforms header, ellers deler alle besøgende én kvote.
 */
export function getClientIp(request: Request): string {
  const vercelIp = request.headers.get('x-vercel-forwarded-for')?.trim();
  if (vercelIp) return vercelIp;

  const realIp = request.headers.get('x-real-ip')?.trim();
  if (realIp) return realIp;

  return 'unknown';
}

/** Normaliseret nøgle, så Foo@Bar.dk og foo@bar.dk ikke får hver sin bucket. */
export function emailKey(prefix: string, email: string): string {
  return `${prefix}:${email.trim().toLowerCase()}`;
}
