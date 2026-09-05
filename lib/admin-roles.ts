// Rene konstanter/typer — ingen server-afhængigheder, så både klient- og servermoduler
// kan importere dem uden at trække next/headers med ind i klient-bundlen.

export const ADMIN_ROLES = ['owner', 'editor', 'support'] as const;
export type AdminRole = (typeof ADMIN_ROLES)[number];

export function isAdminRole(value: unknown): value is AdminRole {
  return typeof value === 'string' && (ADMIN_ROLES as readonly string[]).includes(value);
}
