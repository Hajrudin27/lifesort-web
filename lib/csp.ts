/**
 * Content Security Policy, ét sted.
 *
 * Politikken kørte i Report-Only, fordi en CSP der rammer forkert bryder siden lydløst for
 * brugerne. Kun de direktiver der ikke kan bryde en side — base-uri, object-src,
 * frame-ancestors, form-action — blev håndhævet.
 *
 * Nu håndhæves hele politikken. Der er to varianter, og forskellen er bevidst:
 *
 *   OFFENTLIGT  script-src 'self' 'unsafe-inline'
 *   /ADMIN      script-src 'self' 'nonce-…' 'strict-dynamic'
 *
 * Hvorfor ikke nonces overalt? En nonce skal være unik pr. request og udstedes i proxy'en,
 * og Next.js kan ikke bage en per-request-værdi ind i en statisk side. Hele det offentlige
 * site er statisk (○ i build-outputtet), så nonces dér ville tvinge hver eneste side over i
 * dynamisk rendering — langsommere første besøg og et serverkald pr. sidevisning, på et
 * marketing-site der ikke har brug for det.
 *
 * Admin-panelet er allerede dynamisk hele vejen igennem, så dér koster nonces ingenting. Og
 * det er præcis dér, det betyder mest: sessionscookien fra @supabase/ssr sættes med
 * httpOnly: false og lever 400 dage, så en XSS i admin er en sessionsovertagelse.
 *
 * report-uri bliver stående på begge, så overtrædelser fortsat lander i Sentry — nu som
 * ting der rent faktisk blev blokeret.
 */

function originOf(value: string | undefined): string | null {
  if (!value) return null;
  try {
    return new URL(value).origin;
  } catch {
    return null;
  }
}

type CspOptions = {
  /** Sat for /admin. Uden nonce falder script-src tilbage på 'unsafe-inline'. */
  nonce?: string;
  isDev?: boolean;
};

export function buildCsp({ nonce, isDev = false }: CspOptions = {}): string {
  const supabaseOrigin = originOf(process.env.NEXT_PUBLIC_SUPABASE_URL);
  const supabaseSocket = supabaseOrigin?.replace(/^https:/, 'wss:').replace(/^http:/, 'ws:') ?? null;
  const sentryOrigin = originOf(process.env.NEXT_PUBLIC_SENTRY_DSN);

  const connectSrc = [
    "'self'",
    supabaseOrigin,
    supabaseSocket,
    sentryOrigin,
    // Vercel Analytics sender til samme origin (/_vercel/insights), så den behøver intet her.
  ].filter(Boolean) as string[];

  const imgSrc = ["'self'", 'data:', 'blob:', supabaseOrigin].filter(Boolean) as string[];

  // 'strict-dynamic' lader et script med gyldig nonce indlæse sine egne afhængigheder.
  // Uden det skulle hver enkelt chunk-URL stå i politikken.
  const scriptSrc = nonce
    ? ["'self'", `'nonce-${nonce}'`, "'strict-dynamic'"]
    : ["'self'", "'unsafe-inline'"];

  // Turbopack bruger eval i dev. Aldrig i produktion.
  if (isDev) scriptSrc.push("'unsafe-eval'");

  return [
    "default-src 'self'",
    "base-uri 'self'",
    "object-src 'none'",
    "frame-ancestors 'none'",
    "form-action 'self'",
    `img-src ${imgSrc.join(' ')}`,
    "font-src 'self' data:",
    // Tailwind og Next indsætter style-attributter under rendering. Inline style kan ikke
    // eksekvere kode, så 'unsafe-inline' her er en langt mindre indrømmelse end i script-src.
    "style-src 'self' 'unsafe-inline'",
    `script-src ${scriptSrc.join(' ')}`,
    `connect-src ${connectSrc.join(' ')}`,
    "worker-src 'self' blob:",
    "manifest-src 'self'",
    'upgrade-insecure-requests',
    'report-uri /api/csp-report',
  ].join('; ');
}
