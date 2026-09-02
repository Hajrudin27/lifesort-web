import { PublicHeader } from '@/components/public-header';
import { PublicFooter } from '@/components/public-footer';
import { FaqAccordion } from '@/components/faq-accordion';

export const metadata = {
  title: 'FAQ',
};

export default function FaqPage() {
  return (
    <>
      <PublicHeader />
      <main className="flex-1">
        <div className="mx-auto max-w-3xl px-6 py-16">
          <h1 className="text-3xl font-bold text-stone-900">Ofte stillede spørgsmål</h1>
          <p className="mt-2 text-sm text-stone-600">Finder du ikke svaret her, er du velkommen til at kontakte os.</p>
          <FaqAccordion />
        </div>
      </main>
      <PublicFooter />
    </>
  );
}