import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { checkRateLimit, getClientIp, emailKey, resetRateLimit } from '@/lib/rate-limit';
import { readJsonBody } from '@/lib/validation';

/**
 * Admin-login gik tidligere direkte fra browseren til Supabase. Vores server så derfor
 * aldrig et forsøg og kunne ikke tælle dem — brute force var kun begrænset af Supabase'
 * egne generelle grænser. Ved at lægge login her kan vi:
 *
 *   - begrænse forsøg pr. IP og pr. konto,
 *   - undlade at sætte en session overhovedet for en konto uden admin-adgang, i stedet for
 *     at logge ind først og rydde op bagefter i klienten.
 *
 * Grænsen pr. konto er vigtigst: den følger den konto der angribes, uanset hvor mange
 * IP-adresser angriberen har.
 */
const MAX_ATTEMPTS_PER_IP = 10;
const MAX_ATTEMPTS_PER_ACCOUNT = 5;
const WINDOW_MS = 15 * 60 * 1000;

const GENERIC_ERROR = 'Forkert email eller adgangskode.';

export async function POST(request: Request) {
  // Ruten kan ikke autentificere før den læser kroppen — den ER autentificeringen. Så meget
  // desto vigtigere er størrelsesgrænsen her: det er det eneste offentlige endpoint hvor en
  // uautentificeret kalder ellers kunne sende en vilkårligt stor krop gennem JSON.parse.
  const parsedBody = await readJsonBody(request);
  if (!parsedBody.ok) {
    const status = parsedBody.status === 413 ? 413 : 400;
    return NextResponse.json({ error: status === 413 ? parsedBody.error : GENERIC_ERROR }, { status });
  }

  const { email, password } = (parsedBody.data ?? {}) as Record<string, unknown>;
  if (typeof email !== 'string' || typeof password !== 'string' || !email.trim() || !password) {
    return NextResponse.json({ error: GENERIC_ERROR }, { status: 400 });
  }

  const ip = getClientIp(request);
  const accountKey = emailKey('login-account', email);
  const ipLimit = checkRateLimit(`login-ip:${ip}`, MAX_ATTEMPTS_PER_IP, WINDOW_MS);
  const accountLimit = checkRateLimit(accountKey, MAX_ATTEMPTS_PER_ACCOUNT, WINDOW_MS);

  if (!ipLimit.allowed || !accountLimit.allowed) {
    return NextResponse.json(
      { error: 'For mange loginforsøg. Prøv igen om et kvarter.' },
      { status: 429 }
    );
  }

  const supabase = await createClient();
  const { data, error } = await supabase.auth.signInWithPassword({
    email: email.trim(),
    password,
  });

  // Samme svar uanset om emailen findes eller adgangskoden var forkert.
  if (error || !data.user) {
    return NextResponse.json({ error: GENERIC_ERROR }, { status: 401 });
  }

  const { data: adminRow } = await supabase
    .from('admin_users')
    .select('id')
    .eq('id', data.user.id)
    .single();

  if (!adminRow) {
    // Loginnet lykkedes, men kontoen hører til app-siden. Sessionen ryddes med det samme,
    // så der aldrig ligger en gyldig admin-cookie for en ikke-admin.
    await supabase.auth.signOut();
    return NextResponse.json({ error: 'Denne konto har ikke admin-adgang.' }, { status: 403 });
  }

  resetRateLimit(accountKey);
  return NextResponse.json({ ok: true });
}
