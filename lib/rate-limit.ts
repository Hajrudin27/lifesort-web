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

export function getClientIp(request: Request): string {
  const forwardedFor = request.headers.get('x-forwarded-for');
  if (forwardedFor) return forwardedFor.split(',')[0].trim();
  return 'unknown';
}