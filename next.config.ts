import type { NextConfig } from "next";
import { withSentryConfig } from "@sentry/nextjs/config";
import { buildCsp } from "./lib/csp";

const isDev = process.env.NODE_ENV !== "production";

/**
 * CSP'en for de offentlige, statiske sider.
 *
 * Hele politikken håndhæves nu. Den kørte før i Report-Only, hvor kun de direktiver der
 * ikke kan bryde en side blev håndhævet — resten blev udelukkende rapporteret.
 *
 * /admin får sin egen politik med en nonce fra proxy.ts og er derfor bevidst holdt UDE af
 * source-mønsteret nedenfor: to CSP-headere på samme svar håndhæves som fællesmængden af
 * begge, og det er ikke noget man skal gætte sig til.
 */
const publicPolicy = buildCsp({ isDev });

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
];

const nextConfig: NextConfig = {
  // Keep Turbopack scoped to this repo instead of the parent Documents folder.
  turbopack: {
    root: process.cwd(),
  },
  // Fortæller ellers hver besøgende hvilken teknologi der kører her. Det gør ingen
  // angreb mulige i sig selv, men det er gratis at lade være med at sige det.
  poweredByHeader: false,
  async headers() {
    return [
      { source: "/:path*", headers: securityHeaders },
      // Alt undtagen /admin, som får sin CSP sat i proxy.ts sammen med nonce'en.
      {
        source: "/((?!admin).*)",
        headers: [{ key: "Content-Security-Policy", value: publicPolicy }],
      },
    ];
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
