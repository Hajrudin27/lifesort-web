import { NextResponse } from 'next/server';
import * as Sentry from '@sentry/nextjs';
import { createAdminClient } from '@/lib/supabase/admin';
import { requireAdmin, isAdminRole, type AdminRole } from '@/lib/admin-auth';
import { logActivity } from '@/lib/activity-log';
import { checkRateLimit } from '@/lib/rate-limit';
import { siteUrl } from '@/lib/site-config';
import { cleanText, cleanEmail, readJsonBody, FIELD_LIMITS } from '@/lib/validation';

// At oprette en admin er den mest privilegerede handling i panelet — kun ejere må det.
// Ellers kunne enhver 'support'- eller 'editor'-admin invitere sig selv en ny 'owner'-konto
// på en email de kontrollerer og dermed eskalere sine rettigheder.
const ROLES_THAT_MAY_INVITE: readonly AdminRole[] = ['owner'];

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

  const parsedBody = await readJsonBody(request);
  if (!parsedBody.ok) {
    return NextResponse.json({ error: parsedBody.error }, { status: parsedBody.status });
  }
  const { email, fullName, role } = (parsedBody.data ?? {}) as Record<string, unknown>;

  const validName = cleanText(fullName, { label: 'Navn', max: FIELD_LIMITS.name });
  if (!validName.ok) return NextResponse.json({ error: validName.error }, { status: 400 });

  const validEmail = cleanEmail(email);
  if (!validEmail.ok) return NextResponse.json({ error: validEmail.error }, { status: 400 });

  const cleanEmailValue = validEmail.value;
  const cleanNameValue = validName.value;

  // Rollen valideres mod whitelisten FØR brugeren oprettes. Ellers ville en ugyldig rolle
  // først blive afvist af databasens check-constraint — efter at auth-brugeren var
  // oprettet — og efterlade en konto der kan logge ind uden at stå i admin_users.
  if (role !== undefined && !isAdminRole(role)) {
    return NextResponse.json({ error: 'Ugyldig rolle' }, { status: 400 });
  }
  const newRole: AdminRole = isAdminRole(role) ? role : 'editor';

  const adminClient = createAdminClient();

  const { data: invited, error: inviteError } = await adminClient.auth.admin.inviteUserByEmail(
    cleanEmailValue,
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
    full_name: cleanNameValue,
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
    entityLabel: `${cleanNameValue} (${cleanEmailValue}) som ${newRole}`,
  });

  return NextResponse.json({ ok: true });
}
