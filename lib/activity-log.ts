import type { SupabaseClient } from '@supabase/supabase-js';
import { captureDatabaseError } from '@/lib/observability';

export type ActivityAction = 'created' | 'updated' | 'deleted' | 'replied' | 'invited' | 'confirmed';
export type ActivityEntityType =
  | 'price'
  | 'offer'
  | 'recipe'
  | 'ticket'
  | 'timeline_event'
  | 'admin_user'
  | 'waitlist_signup';

/**
 * Logning må aldrig blokere eller fejle den handling, admin'en faktisk ville udføre — men
 * den må heller ikke fejle i stilhed.
 *
 * Tidligere blev fejlen fra insert() slet ikke læst (supabase-js returnerer den, den
 * kastes ikke), så en afvist logning var fuldstændig usynlig. Det blev opdaget da en
 * sletning gik igennem uden at efterlade et spor, fordi entity_type endnu ikke var
 * tilladt af databasens constraint. Ved netop sletninger er loggen det eneste der er
 * tilbage bagefter, så den slags skal kunne ses.
 */
export async function logActivity(
  supabase: SupabaseClient,
  params: {
    /** null når handlingen ikke kom fra et menneske, men fra en planlagt oprydning. */
    actorId: string | null;
    actorName: string;
    action: ActivityAction;
    entityType: ActivityEntityType;
    entityId?: string;
    entityLabel: string;
  }
) {
  try {
    const { error } = await supabase.from('activity_log').insert({
      actor_id: params.actorId,
      actor_name: params.actorName,
      action: params.action,
      entity_type: params.entityType,
      entity_id: params.entityId ?? null,
      entity_label: params.entityLabel,
    });

    if (error) {
      captureDatabaseError(error, {
        route: 'activity-log',
        extra: { action: params.action, entityType: params.entityType },
      });
    }
  } catch (err) {
    captureDatabaseError(err, {
      route: 'activity-log',
      extra: { action: params.action, entityType: params.entityType },
    });
  }
}
