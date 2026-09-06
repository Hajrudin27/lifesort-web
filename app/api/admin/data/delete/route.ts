import { NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { requireAdmin } from '@/lib/admin-auth';
import { CUSTOMER_DATA_ROLES } from '@/lib/admin-roles';
import { captureDatabaseError } from '@/lib/observability';
import { logActivity } from '@/lib/activity-log';
import { readJsonBody } from '@/lib/validation';

/**
 * Sletning af persondata indsamlet på hjemmesiden.
 *
 * Privatlivspolitikken lover "Få slettet dine oplysninger", men der fandtes ingen måde at
 * gøre det på: hverken supportsager eller ventelistetilmeldinger kunne fjernes fra
 * panelet. En sletteanmodning kunne kun efterkommes ved at gå direkte i databasen.
 *
 * Sletningen er endelig — der er ingen papirkurv — så den logges altid, med adressen den
 * angik. Det er selve pointen med et revisionsspor: bagefter skal man kunne dokumentere,
 * at anmodningen blev efterkommet, og af hvem.
 */

const DELETABLE = {
  ticket: { table: 'support_tickets', entityType: 'ticket' as const, label: 'supportsag' },
  waitlist: { table: 'waitlist_signups', entityType: 'waitlist_signup' as const, label: 'ventelistetilmelding' },
} as const;

type DeletableKind = keyof typeof DELETABLE;

function isDeletableKind(value: unknown): value is DeletableKind {
  return typeof value === 'string' && value in DELETABLE;
}

const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export async function POST(request: Request) {
  const auth = await requireAdmin(CUSTOMER_DATA_ROLES);
  if (!auth.ok) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }

  const parsed = await readJsonBody(request);
  if (!parsed.ok) {
    return NextResponse.json({ error: parsed.error }, { status: parsed.status });
  }

  const { kind, id } = (parsed.data ?? {}) as Record<string, unknown>;

  if (!isDeletableKind(kind)) {
    return NextResponse.json({ error: 'Ugyldig type' }, { status: 400 });
  }
  if (typeof id !== 'string' || !UUID_PATTERN.test(id)) {
    return NextResponse.json({ error: 'Ugyldigt id' }, { status: 400 });
  }

  const target = DELETABLE[kind];
  const adminClient = createAdminClient();

  // Rækken hentes først, så loggen kan skrive hvem sletningen angik. Efter delete er den
  // oplysning væk for altid.
  const { data: row, error: readError } = await adminClient
    .from(target.table)
    .select('id, email')
    .eq('id', id)
    .maybeSingle();

  if (readError) {
    captureDatabaseError(readError, { route: 'admin-data-delete-read' });
    return NextResponse.json({ error: `Kunne ikke hente den valgte ${target.label}` }, { status: 500 });
  }
  if (!row) {
    return NextResponse.json({ error: 'Rækken blev ikke fundet' }, { status: 404 });
  }

  const { error: deleteError } = await adminClient.from(target.table).delete().eq('id', id);

  if (deleteError) {
    captureDatabaseError(deleteError, { route: 'admin-data-delete' });
    return NextResponse.json({ error: `Kunne ikke slette den valgte ${target.label}` }, { status: 500 });
  }

  await logActivity(adminClient, {
    actorId: auth.admin.id,
    actorName: auth.admin.fullName,
    action: 'deleted',
    entityType: target.entityType,
    entityId: row.id,
    entityLabel: `${target.label}: ${row.email}`,
  });

  return NextResponse.json({ ok: true });
}
