import { createHash, timingSafeEqual } from 'node:crypto';

/**
 * Autentificering af de planlagte kald.
 *
 * Sammenligningen lå tidligere som `header !== \`Bearer ${secret}\``. To ting ved den:
 *
 * 1. `!==` på strenge stopper ved første tegn der ikke passer, så tiden afhænger af hvor
 *    langt man er nået. Over netværk med varierende latens er det svært at udnytte, men
 *    en konstanttids-sammenligning koster ingenting.
 *
 * 2. Længden på den forventede værdi kunne aflæses af samme grund. Derfor hashes begge
 *    sider først: SHA-256 giver altid 32 bytes, så timingSafeEqual kan bruges uden at
 *    kaste på forskellig længde, og selve længden lækker ikke.
 *
 * Hvad det IKKE løser: hemmeligheden er en statisk streng uden nonce eller tidsstempel, så
 * et opsnappet kald kan gentages frit. Vercel Cron sender ikke en signatur vi kan verificere
 * imod, så en rigtig replay-beskyttelse kræver, at kaldene selv holder styr på hvornår de
 * sidst kørte. Vær opmærksom på det ved /api/cron/weekly-digest, hvor et gentaget kald
 * sender mails til alle admins igen.
 */
function sha256(value: string): Buffer {
  return createHash('sha256').update(value).digest();
}

/** True hvis Authorization-headeren bærer den rigtige CRON_SECRET. */
export function isAuthorizedCronRequest(request: Request): boolean {
  const secret = process.env.CRON_SECRET;
  if (!secret) return false;

  const header = request.headers.get('authorization');
  if (!header) return false;

  return timingSafeEqual(sha256(header), sha256(`Bearer ${secret}`));
}
