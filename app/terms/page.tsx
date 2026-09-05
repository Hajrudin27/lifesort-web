import { PublicHeader } from '@/components/public-header';
import { PublicFooter } from '@/components/public-footer';
import { TableOfContents } from '@/components/table-of-contents';
import { BackToTop } from '@/components/back-to-top';

export const metadata = {
  title: 'Vilkår og betingelser',
};

const toc = [
  { id: 'accept', label: '1. Accept af vilkår' },
  { id: 'beskrivelse', label: '2. Beskrivelse af tjenesten' },
  { id: 'konto', label: '3. Din konto' },
  { id: 'brug', label: '4. Acceptabel brug' },
  { id: 'rettigheder', label: '5. Immaterielle rettigheder' },
  { id: 'ansvarsfraskrivelse', label: '6. Ansvarsfraskrivelse' },
  { id: 'opsigelse', label: '7. Opsigelse' },
  { id: 'lovvalg', label: '8. Lovvalg' },
  { id: 'aendringer', label: '9. Ændringer' },
  { id: 'kontakt', label: '10. Kontakt' },
];

export default function TermsPage() {
  return (
    <>
      <PublicHeader />
      <main id="main-content" className="flex-1">
        <div className="mx-auto max-w-4xl px-6 py-16">
          <h1 className="text-3xl font-bold text-stone-900">Vilkår og betingelser</h1>
          <p className="mt-2 text-sm text-stone-500">Sidst opdateret: {new Date().toLocaleDateString('da-DK', { day: 'numeric', month: 'long', year: 'numeric' })}</p>

          <div className="mt-8 flex flex-col gap-10 lg:flex-row">
            <TableOfContents items={toc} />

            <div className="prose-sm flex min-w-0 flex-1 flex-col gap-6 text-sm leading-relaxed text-stone-700">
              <section id="accept">
                <h2 className="text-base font-bold text-stone-900">1. Accept af vilkår</h2>
                <p className="mt-2">Ved at oprette en konto og bruge LifeSort accepterer du disse vilkår. Accepterer du dem ikke, kan du ikke bruge appen.</p>
              </section>

              <section id="beskrivelse">
                <h2 className="text-base font-bold text-stone-900">2. Beskrivelse af tjenesten</h2>
                <p className="mt-2">LifeSort er en app der hjælper dig med at organisere hverdagen, herunder madplan, økonomi, karriere og andre personlige moduler. Funktioner kan ændres, tilføjes eller fjernes løbende.</p>
              </section>

              <section id="konto">
                <h2 className="text-base font-bold text-stone-900">3. Din konto</h2>
                <p className="mt-2">Du er ansvarlig for at holde dine login-oplysninger fortrolige og for al aktivitet på din konto. Kontakt os straks, hvis du mistænker uautoriseret adgang til din konto.</p>
              </section>

              <section id="brug">
                <h2 className="text-base font-bold text-stone-900">4. Acceptabel brug</h2>
                <p className="mt-2">Du må ikke bruge LifeSort til ulovlige formål, til at forsøge at få uautoriseret adgang til vores systemer, eller til at forstyrre tjenestens drift.</p>
              </section>

              <section id="rettigheder">
                <h2 className="text-base font-bold text-stone-900">5. Immaterielle rettigheder</h2>
                <p className="mt-2">LifeSort og alt indhold, design og kode tilhørende appen er beskyttet af ophavsret. Data du selv indtaster (opskrifter, noter, mv.) forbliver din ejendom.</p>
              </section>

              <section id="ansvarsfraskrivelse">
                <h2 className="text-base font-bold text-stone-900">6. Ansvarsfraskrivelse</h2>
                <p className="mt-2">LifeSort leveres &ldquo;som den er&rdquo;. Vi tilstræber høj oppetid og datakvalitet, men kan ikke garantere fejlfri drift. Appens indhold (fx madplaner eller økonomiske indsigter) er vejledende og erstatter ikke professionel rådgivning.</p>
              </section>

              <section id="opsigelse">
                <h2 className="text-base font-bold text-stone-900">7. Opsigelse</h2>
                <p className="mt-2">Du kan til enhver tid slette din konto. Vi forbeholder os retten til at lukke konti, der overtræder disse vilkår.</p>
              </section>

              <section id="lovvalg">
                <h2 className="text-base font-bold text-stone-900">8. Lovvalg</h2>
                <p className="mt-2">Disse vilkår er underlagt dansk ret.</p>
              </section>

              <section id="aendringer">
                <h2 className="text-base font-bold text-stone-900">9. Ændringer</h2>
                <p className="mt-2">Vi kan opdatere disse vilkår løbende. Væsentlige ændringer vil blive kommunikeret i appen.</p>
              </section>

              <section id="kontakt">
                <h2 className="text-base font-bold text-stone-900">10. Kontakt</h2>
                <p className="mt-2">Spørgsmål til vilkårene kan sendes via <a href="/support" className="text-rose-600 underline">supportformularen</a>.</p>
              </section>
            </div>
          </div>
        </div>
      </main>
      <BackToTop />
      <PublicFooter />
    </>
  );
}