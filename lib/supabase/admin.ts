import { createClient as createSupabaseClient } from '@supabase/supabase-js';

/**
 * Uses the service role key — bypasses Row Level Security entirely.
 * NEVER import this into a client component or expose SUPABASE_SERVICE_ROLE_KEY
 * with a NEXT_PUBLIC_ prefix. Server-only (API routes, Server Components, Server Actions).
 */
export function createAdminClient() {
  return createSupabaseClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    }
  );
}