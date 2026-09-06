import { captureDatabaseError } from '@/lib/observability';
import { createAdminClient } from '@/lib/supabase/admin';

export const CLOSED_TICKET_MONTHS = 12;
export const UNCONFIRMED_WAITLIST_DAYS = 30;
export const ORPHANED_ATTACHMENT_LIMIT = 500;

type AdminClient = ReturnType<typeof createAdminClient>;

type RetentionCount = {
  count: number;
  error: string | null;
};

export type DataRetentionPreview = {
  wouldDelete: {
    tickets: number;
    waitlistSignups: number;
    orphanedAttachments: number;
  };
  failed: {
    tickets: boolean;
    waitlistSignups: boolean;
    orphanedAttachments: boolean;
  };
  errors: {
    tickets: string | null;
    waitlistSignups: string | null;
    orphanedAttachments: string | null;
  };
  cutoffs: {
    tickets: string;
    waitlist: string;
  };
};

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

export function dataRetentionCutoffs() {
  return {
    tickets: monthsAgo(CLOSED_TICKET_MONTHS),
    waitlist: daysAgo(UNCONFIRMED_WAITLIST_DAYS),
  };
}

export async function getDataRetentionPreview(supabase: AdminClient): Promise<DataRetentionPreview> {
  const cutoffs = dataRetentionCutoffs();

  const [tickets, waitlist, orphanedAttachments] = await Promise.all([
    countClosedTickets(supabase, cutoffs.tickets),
    countUnconfirmedWaitlist(supabase, cutoffs.waitlist),
    countOrphanedAttachments(supabase),
  ]);

  return {
    wouldDelete: {
      tickets: tickets.count,
      waitlistSignups: waitlist.count,
      orphanedAttachments: orphanedAttachments.count,
    },
    failed: {
      tickets: Boolean(tickets.error),
      waitlistSignups: Boolean(waitlist.error),
      orphanedAttachments: Boolean(orphanedAttachments.error),
    },
    errors: {
      tickets: tickets.error,
      waitlistSignups: waitlist.error,
      orphanedAttachments: orphanedAttachments.error,
    },
    cutoffs,
  };
}

async function countClosedTickets(supabase: AdminClient, cutoff: string): Promise<RetentionCount> {
  const { count, error } = await supabase
    .from('support_tickets')
    .select('id', { count: 'exact', head: true })
    .eq('status', 'closed')
    .lt('updated_at', cutoff);

  if (error) {
    captureDatabaseError(error, { route: 'data-retention-preview-tickets' });
    return { count: 0, error: error.message };
  }

  return { count: count ?? 0, error: null };
}

async function countUnconfirmedWaitlist(supabase: AdminClient, cutoff: string): Promise<RetentionCount> {
  const { count, error } = await supabase
    .from('waitlist_signups')
    .select('id', { count: 'exact', head: true })
    .eq('confirmed', false)
    .lt('created_at', cutoff);

  if (error) {
    captureDatabaseError(error, { route: 'data-retention-preview-waitlist' });
    return { count: 0, error: error.message };
  }

  return { count: count ?? 0, error: null };
}

async function countOrphanedAttachments(supabase: AdminClient): Promise<RetentionCount> {
  const { data, error } = await supabase.rpc('orphaned_attachment_paths', { p_limit: ORPHANED_ATTACHMENT_LIMIT });

  if (error) {
    captureDatabaseError(error, { route: 'data-retention-preview-orphans' });
    return { count: 0, error: error.message };
  }

  return { count: (data ?? []).length, error: null };
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
export async function sweepOrphanedAttachments(supabase: AdminClient) {
  const { data: orphans, error } = await supabase.rpc('orphaned_attachment_paths', {
    p_limit: ORPHANED_ATTACHMENT_LIMIT,
  });

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

/**
 * Rydder udløbne rate limit-tællere.
 *
 * Tabellen får én række pr. IP og emailadresse der rammer et begrænset endpoint, og
 * rækkerne har ingen værdi efter vinduet er udløbet. Uden denne oprydning vokser den for
 * altid — og indeholder samtidig persondata i form af IP- og emailadresser i nøglerne.
 */
export async function purgeExpiredRateLimits(supabase: AdminClient): Promise<{ removed: number; failed: boolean }> {
  const { data, error } = await supabase.rpc('purge_expired_rate_limits');

  if (error) {
    captureDatabaseError(error, { route: 'cron-data-retention-rate-limits' });
    return { removed: 0, failed: true };
  }

  return { removed: typeof data === 'number' ? data : 0, failed: false };
}
