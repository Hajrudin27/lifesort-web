type Entry = { count: number; resetAt: number };

const store = new Map<string, Entry>();
let callsSinceCleanup = 0;

/**
 * In-memory sliding-window-ish rate limiter. Good enough for a low-traffic
 * site or a single-instance deployment.
 *
 * IMPORTANT: on serverless platforms (Vercel, etc.) each function instance
 * has its own memory, so this does NOT share state across concurrent
 * instances or regions — a determined attacker distributed across many
 * invocations could get around it. If abuse becomes a real problem after
 * launch, swap this for @upstash/ratelimit (Redis-backed, works correctly
 * across serverless instances) — same call signature, just backed by a
 * shared store instead of this Map.
 */
export function checkRateLimit(
  key: string,
  limit: number,
  windowMs: number
): { allowed: boolean; remaining: number } {
  const now = Date.now();

  // Opportunistic cleanup so the Map doesn't grow forever.
  callsSinceCleanup++;
  if (callsSinceCleanup > 500) {
    callsSinceCleanup = 0;
    for (const [k, v] of store) {
      if (v.resetAt < now) store.delete(k);
    }
  }

  const entry = store.get(key);
  if (!entry || entry.resetAt < now) {
    store.set(key, { count: 1, resetAt: now + windowMs });
    return { allowed: true, remaining: limit - 1 };
  }

  if (entry.count >= limit) {
    return { allowed: false, remaining: 0 };
  }

  entry.count++;
  return { allowed: true, remaining: limit - entry.count };
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

/**
 * Nulstiller en tæller. Bruges efter et vellykket login: en admin der taster forkert et par
 * gange og så rammer rigtigt, skal ikke gå rundt med et næsten opbrugt budget resten af
 * vinduet. Det svækker ikke beskyttelsen — for at nulstille skal man kende adgangskoden.
 */
export function resetRateLimit(key: string): void {
  store.delete(key);
}

/** Normaliseret nøgle, så Foo@Bar.dk og foo@bar.dk ikke får hver sin bucket. */
export function emailKey(prefix: string, email: string): string {
  return `${prefix}:${email.trim().toLowerCase()}`;
}