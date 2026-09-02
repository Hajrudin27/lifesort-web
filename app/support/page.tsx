import { PublicHeader } from '@/components/public-header';
import { PublicFooter } from '@/components/public-footer';
import { SupportForm } from '@/components/support-form';

export const metadata = {
  title: 'Kontakt support',
};

export default function SupportPage() {
  return (
    <>
      <PublicHeader />
      <main className="flex-1">
        <div className="mx-auto max-w-xl px-6 py-16">
          <h1 className="text-3xl font-bold text-stone-900">Kontakt support</h1>
          <p className="mt-2 text-sm text-stone-600">Skriv til os, så vender vi tilbage hurtigst muligt.</p>
          <SupportForm />
        </div>
      </main>
      <PublicFooter />
    </>
  );
}