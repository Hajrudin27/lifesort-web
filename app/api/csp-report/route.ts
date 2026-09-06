import { NextResponse } from 'next/server';
import * as Sentry from '@sentry/nextjs';
import { checkRateLimit, getClientIp } from '@/lib/rate-limit';

/**
 * Modtager CSP-overtrædelser mens politikken kører i Report-Only. Uden et sted at sende
 * dem hen ville Report-Only kun skrive i den enkelte brugers browserkonsol, og vi ville
 * aldrig opdage hvad politikken ville have blokeret.
 *
 * Endpointet er offentligt — enhver kan poste til det — så det er bevidst holdt billigt:
 * hård størrelsesgrænse, rate limit, og aldrig andet end 204 tilbage.
 */
const MAX_BODY_BYTES = 8 * 1024;

type CspReport = {
  'csp-report'?: Record<string, unknown>;
};

export async function POST(request: Request) {
  const ip = getClientIp(request);
  const { allowed } = checkRateLimit(`csp-report:${ip}`, 20, 60 * 60 * 1000);
  if (!allowed) return new NextResponse(null, { status: 204 });

  let raw: string;
  try {
    raw = await request.text();
  } catch {
    return new NextResponse(null, { status: 204 });
  }

  if (raw.length === 0 || raw.length > MAX_BODY_BYTES) {
    return new NextResponse(null, { status: 204 });
  }

  let parsed: CspReport;
  try {
    parsed = JSON.parse(raw);
  } catch {
    return new NextResponse(null, { status: 204 });
  }

  const report = parsed['csp-report'];
  if (!report || typeof report !== 'object') {
    return new NextResponse(null, { status: 204 });
  }

  const directive = String(report['violated-directive'] ?? report['effective-directive'] ?? 'ukendt');
  const blocked = String(report['blocked-uri'] ?? 'ukendt');

  // Indholdet kommer udefra og kan være hvad som helst — det logges som data, aldrig
  // som noget der fortolkes, og klippes så en enkelt rapport ikke fylder unødigt.
  Sentry.captureMessage(`CSP-overtrædelse: ${directive.slice(0, 120)}`, {
    level: 'warning',
    extra: {
      blockedUri: blocked.slice(0, 300),
      documentUri: String(report['document-uri'] ?? '').slice(0, 300),
      sourceFile: String(report['source-file'] ?? '').slice(0, 300),
    },
  });

  return new NextResponse(null, { status: 204 });
}
