import { NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { captureDatabaseError } from '@/lib/observability';
import { logActivity } from '@/lib/activity-log';

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

const CLOSED_TICKET_MONTHS = 12;
const UNCONFIRMED_WAITLIST_DAYS = 30;

function monthsAgo(months: number): string {
  const d = new Date();
  d.setMonth(d.getMonth() - months);
  return d.toISOString();
}

function daysAgo(days: number): string {
  const d = new Date();
  d.setDate(d.getDate() - days);
  return d.toISOString();
}

export async function GET(request: Request) {
  const authHeader = request.headers.get('authorization');
  if (!process.env.CRON_SECRET || authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const dryRun = new URL(request.url).searchParams.get('dryRun') === '1';
  const supabase = createAdminClient();

  const ticketCutoff = monthsAgo(CLOSED_TICKET_MONTHS);
  const waitlistCutoff = daysAgo(UNCONFIRMED_WAITLIST_DAYS);

  if (dryRun) {
    const [tickets, waitlist] = await Promise.all([
      supabase
        .from('support_tickets')
        .select('id', { count: 'exact', head: true })
        .eq('status', 'closed')
        .lt('updated_at', ticketCutoff),
      supabase
        .from('waitlist_signups')
        .select('id', { count: 'exact', head: true })
        .eq('confirmed', false)
        .lt('created_at', waitlistCutoff),
    ]);

    return NextResponse.json({
      ok: true,
      dryRun: true,
      wouldDelete: { tickets: tickets.count ?? 0, waitlistSignups: waitlist.count ?? 0 },
      cutoffs: { tickets: ticketCutoff, waitlist: waitlistCutoff },
    });
  }

  // Sletningerne køres hver for sig, så en fejl i den ene ikke aflyser den anden.
  const { data: deletedTickets, error: ticketError } = await supabase
    .from('support_tickets')
    .delete()
    .eq('status', 'closed')
    .lt('updated_at', ticketCutoff)
    .select('id');

  if (ticketError) {
    captureDatabaseError(ticketError, { route: 'cron-data-retention-tickets' });
  }

  const { data: deletedSignups, error: waitlistError } = await supabase
    .from('waitlist_signups')
    .delete()
    .eq('confirmed', false)
    .lt('created_at', waitlistCutoff)
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

  return NextResponse.json({
    ok: true,
    deleted: { tickets: ticketCount, waitlistSignups: signupCount },
    failed: { tickets: Boolean(ticketError), waitlistSignups: Boolean(waitlistError) },
  });
}
