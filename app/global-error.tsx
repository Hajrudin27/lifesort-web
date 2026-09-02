'use client';

import * as Sentry from '@sentry/nextjs';
import NextError from 'next/error';
import { useEffect } from 'react';

export default function GlobalError({
  error,
}: {
  error: Error & { digest?: string };
}) {
  useEffect(() => {
    Sentry.captureException(error);
  }, [error]);

  return (
    <html>
      <body>
        {/* NextError is the default Next.js error page component. Its type
        definition requires a statusCode prop, but the App Router doesn't
        expose status codes for errors, so we pass 0 for a generic message. */}
        <NextError statusCode={0} />
      </body>
    </html>
  );
}