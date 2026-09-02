import * as Sentry from '@sentry/nextjs';

Sentry.init({
  dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,

  // Tracing is off in dev to avoid a known Next.js 16 + Turbopack dev-mode
  // issue (Sentry's span-ID generation trips Next's "Math.random() before
  // accessing uncached data" check). Light sampling in production.
  tracesSampleRate: process.env.NODE_ENV === 'production' ? 0.1 : 0,
});

// Instruments client-side router navigations for tracing.
export const onRouterTransitionStart = Sentry.captureRouterTransitionStart;