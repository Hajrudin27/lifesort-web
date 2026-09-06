import type { NextConfig } from "next";
import { withSentryConfig } from "@sentry/nextjs/config";

const nextConfig: NextConfig = {
  // Keep Turbopack scoped to this repo instead of the parent Documents folder.
  turbopack: {
    root: process.cwd(),
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
