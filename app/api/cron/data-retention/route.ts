import { NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { captureDatabaseError } from '@/lib/observability';
import { logActivity } from '@/lib/activity-log';
import { isAuthorizedCronRequest } from '@/lib/cron-auth';
import {
  CLOSED_TICKET_MONTHS,
  UNCONFIRMED_WAITLIST_DAYS,
  dataRetentionCutoffs,
  getDataRetentionPreview,
  purgeExpiredRateLimits,
  sweepOrphanedAttachments,
} from '@/lib/data-retention';

export const dynamic = 'force-dynamic';

/**
 * Automatisk sletning af persondata der har tjent sit formål.
 *
 * GDPR artikel 5(1)(e) siger at personoplysninger ikke må opbevares længere end nødvendigt.
 * Der var ingen grænse og intet der slettede noget, så supportsager og ventelistetilmeldinger
 * blev liggende for altid — inklusive navne, adresser og fritekst fra folk der skrev én gang
 * for år siden.
 *
 * Perioderne er:
 *   - Lukkede supportsager: 12 måneder efter sidste ændring. Åbne sager røres aldrig.
 *   - Ubekræftede ventelistetilmeldinger: 30 dage. Har man ikke bekræftet inden for en
 *     måned, er der reelt ikke givet et samtykke. Bekræftede tilmeldinger røres ikke —
 *     de er hele pointen med listen.
 *
 * Kald med ?dryRun=1 for at se hvad der ville blive slettet uden at slette noget.
 */

export async function GET(request: Request) {
  if (!isAuthorizedCronRequest(request)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const dryRun = new URL(request.url).searchParams.get('dryRun') === '1';
  const supabase = createAdminClient();

  if (dryRun) {
    const preview = await getDataRetentionPreview(supabase);

    return NextResponse.json({
      ok: true,
      dryRun: true,
      ...preview,
    });
  }

  const cutoffs = dataRetentionCutoffs();

  // Sletningerne køres hver for sig, så en fejl i den ene ikke aflyser den anden.
  const { data: deletedTickets, error: ticketError } = await supabase
    .from('support_tickets')
    .delete()
    .eq('status', 'closed')
    .lt('updated_at', cutoffs.tickets)
    .select('id');

  if (ticketError) {
    captureDatabaseError(ticketError, { route: 'cron-data-retention-tickets' });
  }

  const { data: deletedSignups, error: waitlistError } = await supabase
    .from('waitlist_signups')
    .delete()
    .eq('confirmed', false)
    .lt('created_at', cutoffs.waitlist)
    .select('id');

  if (waitlistError) {
    captureDatabaseError(waitlistError, { route: 'cron-data-retention-waitlist' });
  }

  const ticketCount = deletedTickets?.length ?? 0;
  const signupCount = deletedSignups?.length ?? 0;

  // Oprydningen efterlader et spor på linje med en manuel sletning. Uden det ville data
  // forsvinde uden at nogen kunne se hvornår eller hvorfor.
  if (ticketCount > 0) {
    await logActivity(supabase, {
      actorId: null,
      actorName: 'Automatisk oprydning',
      action: 'deleted',
      entityType: 'ticket',
      entityLabel: `${ticketCount} lukkede supportsager ældre end ${CLOSED_TICKET_MONTHS} måneder`,
    });
  }
  if (signupCount > 0) {
    await logActivity(supabase, {
      actorId: null,
      actorName: 'Automatisk oprydning',
      action: 'deleted',
      entityType: 'waitlist_signup',
      entityLabel: `${signupCount} ubekræftede tilmeldinger ældre end ${UNCONFIRMED_WAITLIST_DAYS} dage`,
    });
  }

  const orphaned = await sweepOrphanedAttachments(supabase);

  // Rate limit-tællerne er ikke persondata vi har lovet at gemme, men nøglerne indeholder
  // IP- og emailadresser, og rækkerne er værdiløse når vinduet er udløbet. De ryddes her,
  // så tabellen ikke vokser i det uendelige.
  const rateLimits = await purgeExpiredRateLimits(supabase);

  return NextResponse.json({
    ok: true,
    deleted: {
      tickets: ticketCount,
      waitlistSignups: signupCount,
      orphanedAttachments: orphaned.removed,
      expiredRateLimits: rateLimits.removed,
    },
    failed: {
      tickets: Boolean(ticketError),
      waitlistSignups: Boolean(waitlistError),
      orphanedAttachments: orphaned.failed,
      expiredRateLimits: rateLimits.failed,
    },
  });
}
