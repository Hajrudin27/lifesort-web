import { NextResponse } from 'next/server';
import * as Sentry from '@sentry/nextjs';
import { createAdminClient } from '@/lib/supabase/admin';
import { requireAdmin, isAdminRole, type AdminRole } from '@/lib/admin-auth';
import { logActivity } from '@/lib/activity-log';
import { checkRateLimit } from '@/lib/rate-limit';
import { siteUrl } from '@/lib/site-config';

// At oprette en admin er den mest privilegerede handling i panelet — kun ejere må det.
// Ellers kunne enhver 'support'- eller 'editor'-admin invitere sig selv en ny 'owner'-konto
// på en email de kontrollerer og dermed eskalere sine rettigheder.
const ROLES_THAT_MAY_INVITE: readonly AdminRole[] = ['owner'];

const MAX_NAME_LENGTH = 120;
const MAX_EMAIL_LENGTH = 254;
const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export async function POST(request: Request) {
  const auth = await requireAdmin(ROLES_THAT_MAY_INVITE);
  if (!auth.ok) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }
  const { admin } = auth;

  // Nøglet på den kaldende admin, ikke på IP: kalderen er allerede autentificeret, og
  // IP-headeren kan spoofes.
  const { allowed } = checkRateLimit(`invite-admin:${admin.id}`, 5, 60 * 60 * 1000);
  if (!allowed) {
    return NextResponse.json(
      { error: 'For mange invitationer på kort tid. Prøv igen om lidt.' },
      { status: 429 }
    );
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Ugyldig anmodning' }, { status: 400 });
  }
  const { email, fullName, role } = (body ?? {}) as Record<string, unknown>;

  if (typeof email !== 'string' || typeof fullName !== 'string') {
    return NextResponse.json({ error: 'Navn og email skal udfyldes' }, { status: 400 });
  }

  const cleanEmail = email.trim().toLowerCase();
  const cleanName = fullName.trim();

  if (cleanName.length === 0 || cleanName.length > MAX_NAME_LENGTH) {
    return NextResponse.json({ error: 'Navn mangler eller er for langt' }, { status: 400 });
  }
  if (cleanEmail.length === 0 || cleanEmail.length > MAX_EMAIL_LENGTH || !EMAIL_PATTERN.test(cleanEmail)) {
    return NextResponse.json({ error: 'Ugyldig email' }, { status: 400 });
  }

  // Rollen valideres mod whitelisten FØR brugeren oprettes. Ellers ville en ugyldig rolle
  // først blive afvist af databasens check-constraint — efter at auth-brugeren var
  // oprettet — og efterlade en konto der kan logge ind uden at stå i admin_users.
  if (role !== undefined && !isAdminRole(role)) {
    return NextResponse.json({ error: 'Ugyldig rolle' }, { status: 400 });
  }
  const newRole: AdminRole = isAdminRole(role) ? role : 'editor';

  const adminClient = createAdminClient();

  const { data: invited, error: inviteError } = await adminClient.auth.admin.inviteUserByEmail(
    cleanEmail,
    { redirectTo: `${siteUrl}/admin/dashboard` }
  );
  if (inviteError || !invited?.user) {
    Sentry.captureMessage(`Invite admin failed: ${inviteError?.message}`, 'warning');
    return NextResponse.json(
      { error: inviteError?.message ?? 'Kunne ikke invitere brugeren' },
      { status: 500 }
    );
  }

  const { error: insertError } = await adminClient.from('admin_users').insert({
    id: invited.user.id,
    full_name: cleanName,
    role: newRole,
  });

  if (insertError) {
    // Rul invitationen tilbage. Uden det ville der stå en auth-bruger tilbage, som kan
    // logge ind, men ikke har en admin_users-række — en konto i et udefineret mellemland.
    const { error: rollbackError } = await adminClient.auth.admin.deleteUser(invited.user.id);
    Sentry.captureException(insertError, {
      tags: { route: 'invite-admin' },
      extra: { rollbackFailed: rollbackError?.message ?? null },
    });
    return NextResponse.json(
      {
        error: rollbackError
          ? 'Brugeren blev inviteret, men kunne ikke tilføjes som admin, og invitationen kunne ikke rulles tilbage. Tjek auth.users og admin_users manuelt.'
          : 'Kunne ikke tilføje brugeren som admin. Invitationen er annulleret — prøv igen.',
      },
      { status: 500 }
    );
  }

  await logActivity(adminClient, {
    actorId: admin.id,
    actorName: admin.fullName,
    action: 'invited',
    entityType: 'admin_user',
    entityLabel: `${cleanName} (${cleanEmail}) som ${newRole}`,
  });

  return NextResponse.json({ ok: true });
}
