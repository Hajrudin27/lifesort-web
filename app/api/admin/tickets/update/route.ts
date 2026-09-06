import { NextResponse } from 'next/server';
import { captureDatabaseError } from '@/lib/observability';
import { createAdminClient } from '@/lib/supabase/admin';
import { requireAdmin } from '@/lib/admin-auth';
import { CUSTOMER_DATA_ROLES } from '@/lib/admin-roles';

const STATUSES = ['open', 'waiting', 'answered', 'closed'] as const;
const PRIORITIES = ['low', 'normal', 'high', 'urgent'] as const;
const CATEGORIES = ['general', 'bug', 'billing', 'feature', 'account'] as const;

type TicketStatus = (typeof STATUSES)[number];
type TicketPriority = (typeof PRIORITIES)[number];
type TicketCategory = (typeof CATEGORIES)[number];

type SupabaseError = {
  code?: string;
  message?: string;
};

function isOneOf<T extends readonly string[]>(value: unknown, options: T): value is T[number] {
  return typeof value === 'string' && options.includes(value);
}

function isMissingSchemaError(error: SupabaseError | null) {
  if (!error) return false;
  return (
    error.code === '42703' ||
    error.code === 'PGRST204' ||
    /column .* does not exist|could not find .* column|schema cache/i.test(error.message ?? '')
  );
}

async function logTicketActivity({
  actorId,
  actorName,
  action,
  ticketId,
  ticketSubject,
}: {
  actorId: string;
  actorName: string;
  action: 'updated';
  ticketId: string;
  ticketSubject: string | null;
}) {
  const adminClient = createAdminClient();
  const { error } = await adminClient.from('activity_log').insert({
    actor_id: actorId,
    actor_name: actorName,
    action,
    entity_type: 'ticket',
    entity_id: ticketId,
    entity_label: ticketSubject,
  });

  if (error) {
    captureDatabaseError(error, { route: 'admin-ticket-update-activity-log' });
  }
}

export async function POST(request: Request) {
  const body = await request.json();
  const { id, status, priority, category, internalNote, adminReply } = body;

  if (!id || typeof id !== 'string') {
    return NextResponse.json({ error: 'id mangler' }, { status: 400 });
  }

  if (status !== undefined && !isOneOf(status, STATUSES)) {
    return NextResponse.json({ error: 'Ugyldig status' }, { status: 400 });
  }
  if (priority !== undefined && !isOneOf(priority, PRIORITIES)) {
    return NextResponse.json({ error: 'Ugyldig prioritet' }, { status: 400 });
  }
  if (category !== undefined && !isOneOf(category, CATEGORIES)) {
    return NextResponse.json({ error: 'Ugyldig kategori' }, { status: 400 });
  }
  if (internalNote !== undefined && typeof internalNote !== 'string') {
    return NextResponse.json({ error: 'Ugyldig intern note' }, { status: 400 });
  }
  if (adminReply !== undefined && (typeof adminReply !== 'string' || adminReply.trim().length === 0)) {
    return NextResponse.json({ error: 'Svar mangler' }, { status: 400 });
  }

  const auth = await requireAdmin(CUSTOMER_DATA_ROLES);
  if (!auth.ok) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }
  const now = new Date().toISOString();
  const needsEnhancedSchema =
    priority !== undefined || category !== undefined || internalNote !== undefined || status === 'waiting';

  const baseUpdate: {
    status?: Exclude<TicketStatus, 'waiting'>;
    admin_reply?: string;
    replied_at?: string;
  } = {};

  const enhancedUpdate: {
    status?: TicketStatus;
    priority?: TicketPriority;
    category?: TicketCategory;
    internal_note?: string | null;
    admin_reply?: string;
    replied_at?: string;
    updated_at: string;
  } = { updated_at: now };

  if (status !== undefined) {
    enhancedUpdate.status = status;
    if (status !== 'waiting') baseUpdate.status = status;
  }
  if (priority !== undefined) enhancedUpdate.priority = priority;
  if (category !== undefined) enhancedUpdate.category = category;
  if (internalNote !== undefined) enhancedUpdate.internal_note = internalNote.trim() || null;
  if (adminReply !== undefined) {
    const reply = adminReply.trim();
    enhancedUpdate.admin_reply = reply;
    enhancedUpdate.status = 'answered';
    enhancedUpdate.replied_at = now;
    baseUpdate.admin_reply = reply;
    baseUpdate.status = 'answered';
    baseUpdate.replied_at = now;
  }

  const adminClient = createAdminClient();

  if (!needsEnhancedSchema) {
    const { data, error } = await adminClient
      .from('support_tickets')
      .update(baseUpdate)
      .eq('id', id)
      .select('id, name, email, subject, message, status, admin_reply, replied_at, created_at')
      .maybeSingle();

    if (error) {
      captureDatabaseError(error, { route: 'admin-ticket-update-base' });
      // Databasens egen besked navngiver relationer og constraints — den hører hjemme i
      // fejlloggen, ikke i et svar til browseren.
      return NextResponse.json({ error: 'Kunne ikke opdatere supportsagen' }, { status: 500 });
    }

    if (!data) {
      return NextResponse.json({ error: 'Supportsag ikke fundet' }, { status: 404 });
    }

    await logTicketActivity({
      actorId: auth.admin.id,
      actorName: auth.admin.fullName,
      action: 'updated',
      ticketId: id,
      ticketSubject: data.subject,
    });

    return NextResponse.json({
      ok: true,
      row: {
        ...data,
        priority: 'normal',
        category: 'general',
        internal_note: null,
        updated_at: null,
      },
    });
  }

  const { data, error } = await adminClient
    .from('support_tickets')
    .update(enhancedUpdate)
    .eq('id', id)
    .select('id, name, email, subject, message, status, priority, category, internal_note, admin_reply, replied_at, created_at, updated_at')
    .maybeSingle();

  if (error) {
    captureDatabaseError(error, { route: 'admin-ticket-update' });
    if (isMissingSchemaError(error)) {
      return NextResponse.json(
        { error: 'Support-migrationen mangler i databasen. Kør supabase db push, eller indsæt migrationen i Supabase SQL Editor, og prøv igen.' },
        { status: 500 }
      );
    }
    return NextResponse.json({ error: 'Kunne ikke opdatere supportsagen' }, { status: 500 });
  }

  if (!data) {
    return NextResponse.json({ error: 'Supportsag ikke fundet' }, { status: 404 });
  }

  await logTicketActivity({
    actorId: auth.admin.id,
    actorName: auth.admin.fullName,
    action: 'updated',
    ticketId: id,
    ticketSubject: data.subject,
  });

  return NextResponse.json({ ok: true, row: data });
}
