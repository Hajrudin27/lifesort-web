import type { NextConfig } from "next";
import { withSentryConfig } from "@sentry/nextjs/config";

const nextConfig: NextConfig = {
  /* config options here */
};

export default withSentryConfig(nextConfig, {
  // TODO: udfyld med jeres org/project-slug fra Sentry (Settings i sentry.io)
  org: "din-org-slug",
  project: "lifesort-web",

  // Only print logs for uploading source maps in CI
  silent: !process.env.CI,
});