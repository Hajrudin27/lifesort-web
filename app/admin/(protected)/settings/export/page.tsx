import { redirect } from 'next/navigation';
import { requireAdmin } from '@/lib/admin-auth';
import { OWNER_ONLY } from '@/lib/admin-roles';
import { ExportDataClient } from './export-client';

export const metadata = {
  title: 'Eksport',
};

/**
 * Eksportsiden er owner-only, men selve siden er en klientkomponent og kan derfor ikke
 * selv slå rollen op. Adgangen lå kun i middleware; her ligger den også i en server-
 * komponent foran, så siden ikke afhænger af ét lag alene.
 *
 * Eksporten henter i øvrigt med anon-nøglen fra browseren, så RLS afgør stadig hvad der
 * rent faktisk kommer med i filen — dette tjek forhindrer blot at siden overhovedet vises.
 */
export default async function ExportDataPage() {
  const auth = await requireAdmin(OWNER_ONLY);
  if (!auth.ok) redirect('/admin/dashboard');

  return <ExportDataClient />;
}
