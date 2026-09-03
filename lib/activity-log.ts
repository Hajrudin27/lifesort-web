import type { SupabaseClient } from '@supabase/supabase-js';

export type ActivityAction = 'created' | 'updated' | 'deleted' | 'replied' | 'invited';
export type ActivityEntityType = 'price' | 'offer' | 'recipe' | 'ticket' | 'timeline_event' | 'admin_user';

/**
 * Fire-and-forget: a logging failure should never block or surface an error
 * for the mutation the admin actually cares about completing.
 */
export async function logActivity(
  supabase: SupabaseClient,
  params: {
    actorId: string;
    actorName: string;
    action: ActivityAction;
    entityType: ActivityEntityType;
    entityLabel: string;
  }
) {
  try {
    await supabase.from('activity_log').insert({
      actor_id: params.actorId,
      actor_name: params.actorName,
      action: params.action,
      entity_type: params.entityType,
      entity_label: params.entityLabel,
    });
  } catch {
    // Swallow — logging is best-effort.
  }
}