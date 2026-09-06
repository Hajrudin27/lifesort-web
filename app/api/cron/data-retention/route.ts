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

/**
 * Filer i attachments-bucket'en hvis ejer ikke længere findes.
 *
 * Databasen rydder sig selv når en konto slettes, men storage er et separat lag: rækken i
 * public.attachments forsvinder, filen gør ikke. Appen sletter sine egne filer inden den
 * beder om at få kontoen slettet, men det er klientens ansvar og kan fejle halvvejs. Her
 * er det serveren der garanterer, at der ikke ligger private dokumenter tilbage fra en
 * bruger der har bedt om at blive glemt.
 */
async function sweepOrphanedAttachments(supabase: ReturnType<typeof createAdminClient>) {
  const { data: orphans, error } = await supabase.rpc('orphaned_attachment_paths', { p_limit: 500 });

  if (error) {
    captureDatabaseError(error, { route: 'cron-data-retention-orphan-lookup' });
    return { removed: 0, failed: true };
  }

  const paths = (orphans ?? []).map((row: { path: string }) => row.path);
  if (paths.length === 0) return { removed: 0, failed: false };

  const { error: removeError } = await supabase.storage.from('attachments').remove(paths);
  if (removeError) {
    captureDatabaseError(removeError, { route: 'cron-data-retention-orphan-remove' });
    return { removed: 0, failed: true };
  }

  return { removed: paths.length, failed: false };
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

    const { data: orphans } = await supabase.rpc('orphaned_attachment_paths', { p_limit: 500 });

    return NextResponse.json({
      ok: true,
      dryRun: true,
      wouldDelete: {
        tickets: tickets.count ?? 0,
        waitlistSignups: waitlist.count ?? 0,
        orphanedAttachments: (orphans ?? []).length,
      },
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

  const orphaned = await sweepOrphanedAttachments(supabase);

  return NextResponse.json({
    ok: true,
    deleted: {
      tickets: ticketCount,
      waitlistSignups: signupCount,
      orphanedAttachments: orphaned.removed,
    },
    failed: {
      tickets: Boolean(ticketError),
      waitlistSignups: Boolean(waitlistError),
      orphanedAttachments: orphaned.failed,
    },
  });
}
