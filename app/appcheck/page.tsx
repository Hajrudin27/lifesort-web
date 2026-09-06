import { AppCheckClient } from '@/app/appcheck/app-check-client';
import { createPageMetadata } from '@/lib/seo';

export const metadata = createPageMetadata({
  title: 'App-tjek',
  description: 'Tjek hvor mange separate apps, noter og sedler LifeSort kan samle i én hverdagsapp.',
  path: '/appcheck',
  keywords: ['LifeSort app-tjek', 'hverdagsapp', 'samlet app'],
});

export default function AppCheckPage() {
  return <AppCheckClient />;
}
