/**
 * Fælles validering af det brugere sender ind.
 *
 * Reglerne lå tidligere spredt i hver rute som "er det en ikke-tom streng?", hvilket lod
 * alt andet passere: en besked på flere megabyte, en emailadresse der slet ikke var en
 * adresse, eller kontroltegn midt i en tekst. Ét sted at rette betyder også at reglerne
 * ikke kan drive fra hinanden mellem ruterne.
 */

export const FIELD_LIMITS = {
  name: 120,
  email: 254, // øvre grænse for en emailadresse i praksis (RFC 5321)
  subject: 200,
  message: 5000,
} as const;

/** Bevidst løs: den afviser det åbenlyst forkerte uden at afvise sjældne, gyldige adresser. */
const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/**
 * Kontroltegn hører ikke hjemme i et tekstfelt. Tab (09), linjeskift (0A) og
 * vognretur (0D) er undtaget, så flerlinjede beskeder stadig virker.
 */
const CONTROL_CHARS = /[\u0000-\u0008\u000B\u000C\u000E-\u001F]/;

export type FieldResult = { ok: true; value: string } | { ok: false; error: string };

export function cleanText(
  value: unknown,
  options: { label: string; max: number; min?: number }
): FieldResult {
  const { label, max, min = 1 } = options;

  if (typeof value !== 'string') return { ok: false, error: `${label} mangler` };

  const trimmed = value.trim();
  if (trimmed.length < min) return { ok: false, error: `${label} mangler` };
  if (trimmed.length > max) return { ok: false, error: `${label} må højst være ${max} tegn` };
  if (CONTROL_CHARS.test(trimmed)) return { ok: false, error: `${label} indeholder ugyldige tegn` };

  return { ok: true, value: trimmed };
}

export function cleanEmail(value: unknown, label = 'Email'): FieldResult {
  const text = cleanText(value, { label, max: FIELD_LIMITS.email });
  if (!text.ok) return text;

  // Mønsteret udelukker mellemrum og linjeskift, så adressen ikke kan bære andet med sig
  // ind i den mail vi sender bagefter.
  const email = text.value.toLowerCase();
  if (!EMAIL_PATTERN.test(email)) return { ok: false, error: `${label} er ikke en gyldig adresse` };

  return { ok: true, value: email };
}

export type JsonBodyResult =
  | { ok: true; data: unknown }
  | { ok: false; error: string; status: 400 | 413 };

/**
 * Læser en JSON-krop med en øvre grænse. Uden den ville request.json() gladeligt parse
 * alt hvad klienten sender — arbejde vi laver for en fremmed, før vi overhovedet har
 * kigget på indholdet.
 */
export async function readJsonBody(request: Request, maxBytes = 64 * 1024): Promise<JsonBodyResult> {
  const declared = Number(request.headers.get('content-length'));
  if (Number.isFinite(declared) && declared > maxBytes) {
    return { ok: false, error: 'Anmodningen er for stor', status: 413 };
  }

  let raw: string;
  try {
    raw = await request.text();
  } catch {
    return { ok: false, error: 'Ugyldig anmodning', status: 400 };
  }

  if (raw.length > maxBytes) return { ok: false, error: 'Anmodningen er for stor', status: 413 };

  try {
    return { ok: true, data: JSON.parse(raw) };
  } catch {
    return { ok: false, error: 'Ugyldig anmodning', status: 400 };
  }
}
