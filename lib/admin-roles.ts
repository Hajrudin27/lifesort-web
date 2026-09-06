// Rene konstanter/typer — ingen server-afhængigheder, så både klient- og servermoduler
// kan importere dem uden at trække next/headers med ind i klient-bundlen.

export const ADMIN_ROLES = ['owner', 'editor', 'support'] as const;
export type AdminRole = (typeof ADMIN_ROLES)[number];

export function isAdminRole(value: unknown): value is AdminRole {
  return typeof value === 'string' && (ADMIN_ROLES as readonly string[]).includes(value);
}

/**
 * Streng least-privilege:
 *   owner    alt
 *   editor   indhold (priser, tilbud, produkter, opskrifter, sundhedsindhold, tidslinje)
 *   support  kundedata (supportsager, venteliste)
 *
 * Dette er UI- og route-laget. Den reelle håndhævelse ligger i RLS-policies i databasen
 * (se migrationen 20260906120000_role_based_admin_access.sql), fordi admin-panelet
 * skriver direkte fra browseren med anon-nøglen og derfor kan omgå enhver klientkontrol.
 */
export const CONTENT_ROLES: readonly AdminRole[] = ['owner', 'editor'];
export const CUSTOMER_DATA_ROLES: readonly AdminRole[] = ['owner', 'support'];
export const OWNER_ONLY: readonly AdminRole[] = ['owner'];

/** Længste præfiks vinder, så /admin/settings/export kan være strammere end /admin/settings. */
const ROUTE_ROLES: ReadonlyArray<{ prefix: string; roles: readonly AdminRole[] }> = [
  { prefix: '/admin/admins', roles: OWNER_ONLY },
  { prefix: '/admin/settings/export', roles: OWNER_ONLY },
  { prefix: '/admin/settings/health', roles: OWNER_ONLY },
  { prefix: '/admin/launch', roles: OWNER_ONLY },
  { prefix: '/admin/food', roles: CONTENT_ROLES },
  { prefix: '/admin/health', roles: CONTENT_ROLES },
  { prefix: '/admin/timeline', roles: CONTENT_ROLES },
  { prefix: '/admin/tickets', roles: CUSTOMER_DATA_ROLES },
  { prefix: '/admin/waitlist', roles: CUSTOMER_DATA_ROLES },
];

/** Roller der må se en given admin-sti. Sider uden regel (oversigt, aktivitet) er åbne for alle admins. */
export function rolesForPath(pathname: string): readonly AdminRole[] | null {
  const match = ROUTE_ROLES
    .filter((r) => pathname === r.prefix || pathname.startsWith(`${r.prefix}/`))
    .sort((a, b) => b.prefix.length - a.prefix.length)[0];
  return match?.roles ?? null;
}

export function canAccessPath(role: AdminRole, pathname: string): boolean {
  const roles = rolesForPath(pathname);
  return roles === null || roles.includes(role);
}
