import type { NextConfig } from "next";
import { withSentryConfig } from "@sentry/nextjs/config";

/** Origin fra en URL, eller null hvis den mangler/er ugyldig. Bruges til at bygge CSP'en. */
function originOf(value: string | undefined): string | null {
  if (!value) return null;
  try {
    return new URL(value).origin;
  } catch {
    return null;
  }
}

const supabaseOrigin = originOf(process.env.NEXT_PUBLIC_SUPABASE_URL);
const supabaseSocket = supabaseOrigin?.replace(/^https:/, "wss:").replace(/^http:/, "ws:") ?? null;
const sentryOrigin = originOf(process.env.NEXT_PUBLIC_SENTRY_DSN);
const isDev = process.env.NODE_ENV !== "production";

const connectSrc = [
  "'self'",
  supabaseOrigin,
  supabaseSocket,
  sentryOrigin,
  // Vercel Analytics sender til samme origin (/_vercel/insights), så den behøver intet her.
].filter(Boolean) as string[];

const imgSrc = ["'self'", "data:", "blob:", supabaseOrigin].filter(Boolean) as string[];

/**
 * Fuld politik. Køres foreløbig i Report-Only, fordi en CSP der rammer forkert bryder
 * siden lydløst for brugerne — først når rapporterne er tomme, kan den håndhæves.
 *
 * script-src har 'unsafe-inline' fordi Next.js' egne bootstrap-scripts er inline. Den
 * rigtige løsning er nonces udstedt i proxy.ts; det er næste skridt, når basispolitikken
 * er bekræftet i praksis.
 */
const reportOnlyPolicy = [
  "default-src 'self'",
  "base-uri 'self'",
  "object-src 'none'",
  "frame-ancestors 'none'",
  "form-action 'self'",
  `img-src ${imgSrc.join(" ")}`,
  "font-src 'self' data:",
  "style-src 'self' 'unsafe-inline'",
  `script-src 'self' 'unsafe-inline'${isDev ? " 'unsafe-eval'" : ""}`,
  `connect-src ${connectSrc.join(" ")}`,
  "worker-src 'self' blob:",
  "manifest-src 'self'",
  "upgrade-insecure-requests",
  "report-uri /api/csp-report",
].join("; ");

/**
 * Disse direktiver kan ikke bryde en normal Next-side, så de håndhæves med det samme:
 * de handler om hvem der må ramme os udefra, ikke om hvordan siden selv indlæses.
 */
const enforcedPolicy = [
  "base-uri 'self'",
  "object-src 'none'",
  "frame-ancestors 'none'",
  "form-action 'self'",
].join("; ");

const securityHeaders = [
  // Klikjacking: uden den kan admin-panelet lægges i en usynlig iframe, og en indlogget
  // owner narres til at klikke på fx "Fjern adgang". X-Frame-Options for ældre browsere,
  // frame-ancestors for resten.
  { key: "X-Frame-Options", value: "DENY" },
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  // Bevidst UDEN "preload": preload-listen er svær at komme af igen, og det er jeres valg.
  { key: "Strict-Transport-Security", value: "max-age=63072000; includeSubDomains" },
  {
    key: "Permissions-Policy",
    value: "camera=(), microphone=(), geolocation=(), payment=(), usb=(), interest-cohort=()",
  },
  { key: "Content-Security-Policy", value: enforcedPolicy },
  { key: "Content-Security-Policy-Report-Only", value: reportOnlyPolicy },
];

const nextConfig: NextConfig = {
  // Keep Turbopack scoped to this repo instead of the parent Documents folder.
  turbopack: {
    root: process.cwd(),
  },
  async headers() {
    return [{ source: "/:path*", headers: securityHeaders }];
  },
};

export default withSentryConfig(nextConfig, {
  // Sæt SENTRY_ORG i miljøvariablerne, når I har oprettet jeres Sentry-projekt
  // (findes under Settings i sentry.io) — uden den bliver source maps aldrig uploadet.
  org: process.env.SENTRY_ORG || "din-org-slug",
  project: "lifesort-web",

  // Only print logs for uploading source maps in CI
  silent: !process.env.CI,
});
