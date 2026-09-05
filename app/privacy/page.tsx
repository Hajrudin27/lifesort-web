import { PublicHeader } from '@/components/public-header';
import { PublicFooter } from '@/components/public-footer';
import { TableOfContents } from '@/components/table-of-contents';
import { BackToTop } from '@/components/back-to-top';

export const metadata = {
  title: 'Privatlivspolitik',
};

const toc = [
  { id: 'dataansvarlig', label: '1. Dataansvarlig' },
  { id: 'indsamling', label: '2. Hvilke oplysninger' },
  { id: 'formaal', label: '3. Hvorfor vi behandler dem' },
  { id: 'opbevaring', label: '4. Hvor data opbevares' },
  { id: 'rettigheder', label: '5. Dine rettigheder' },
  { id: 'cookies', label: '6. Cookies' },
  { id: 'aendringer', label: '7. Ændringer' },
];

export default function PrivacyPage() {
  return (
    <>
      <PublicHeader />
      <main id="main-content" className="flex-1">
        <div className="mx-auto max-w-4xl px-6 py-16">
          <h1 className="text-3xl font-bold text-stone-900">Privatlivspolitik</h1>
          <p className="mt-2 text-sm text-stone-500">Sidst opdateret: {new Date().toLocaleDateString('da-DK', { day: 'numeric', month: 'long', year: 'numeric' })}</p>

          <div className="mt-8 flex flex-col gap-10 lg:flex-row">
            <TableOfContents items={toc} />

            <div className="prose-sm flex min-w-0 flex-1 flex-col gap-6 text-sm leading-relaxed text-stone-700">
              <section id="dataansvarlig">
                <h2 className="text-base font-bold text-stone-900">1. Dataansvarlig</h2>
                <p className="mt-2">LifeSort er ansvarlig for behandlingen af dine personoplysninger i forbindelse med din brug af appen og denne hjemmeside. Har du spørgsmål til denne politik, kan du kontakte os via <a href="/support" className="text-rose-600 underline">supportformularen</a>.</p>
              </section>

              <section id="indsamling">
                <h2 className="text-base font-bold text-stone-900">2. Hvilke oplysninger indsamler vi</h2>
                <p className="mt-2">Afhængigt af hvilke dele af appen du bruger, kan vi behandle:</p>
                <ul className="mt-2 list-disc space-y-1 pl-5">
                  <li><strong>Kontooplysninger:</strong> email og adgangskode (krypteret) til at oprette og logge ind på din konto.</li>
                  <li><strong>Cyklusdata:</strong> hvis du bruger cyklus-modulet, behandler vi oplysninger om din menstruationscyklus og symptomer. Dette er en særlig kategori af personoplysninger (helbredsdata) efter GDPR artikel 9, og vi behandler det kun med dit udtrykkelige samtykke.</li>
                  <li><strong>Økonomiske data:</strong> udgifter, indkomst og opsparingsmål du selv indtaster.</li>
                  <li><strong>Madplan- og indkøbsdata:</strong> dine opskrifter, indkøbslister og madbudget.</li>
                  <li><strong>Karrieredata:</strong> CV-oplysninger og jobansøgninger du opretter i karriere-modulet.</li>
                  <li><strong>Øvrige moduldata:</strong> oplysninger du selv indtaster i fx vaner, gøremål, rejser og garantier.</li>
                  <li><strong>Supporthenvendelser:</strong> navn, email og indholdet af din besked, hvis du kontakter os.</li>
                </ul>
              </section>

              <section id="formaal">
                <h2 className="text-base font-bold text-stone-900">3. Hvorfor behandler vi dine oplysninger</h2>
                <p className="mt-2">Vi behandler dine oplysninger for at kunne levere appens funktioner til dig (kontrakt), og — for cyklusdata specifikt — udelukkende på baggrund af dit samtykke, som du til enhver tid kan trække tilbage ved at slette dine data i appen eller kontakte os.</p>
              </section>

              <section id="opbevaring">
                <h2 className="text-base font-bold text-stone-900">4. Hvor opbevares dine data</h2>
                <p className="mt-2">Dine data opbevares hos vores databaseudbyder, Supabase. Vi deler ikke dine oplysninger med tredjeparter til markedsføringsformål.</p>
              </section>

              <section id="rettigheder">
                <h2 className="text-base font-bold text-stone-900">5. Dine rettigheder</h2>
                <p className="mt-2">Du har efter GDPR ret til at:</p>
                <ul className="mt-2 list-disc space-y-1 pl-5">
                  <li>Få indsigt i, hvilke oplysninger vi har om dig</li>
                  <li>Få rettet forkerte oplysninger</li>
                  <li>Få slettet dine oplysninger (&ldquo;retten til at blive glemt&rdquo;)</li>
                  <li>Få udleveret dine data i et maskinlæsbart format (dataportabilitet)</li>
                  <li>Trække et samtykke tilbage til enhver tid</li>
                  <li>Gøre indsigelse mod vores behandling</li>
                </ul>
                <p className="mt-2">Kontakt os via <a href="/support" className="text-rose-600 underline">supportformularen</a> for at gøre brug af dine rettigheder.</p>
              </section>

              <section id="cookies">
                <h2 className="text-base font-bold text-stone-900">6. Cookies</h2>
                <p className="mt-2">Hjemmesiden bruger kun nødvendige cookies til login og sikkerhed. Vi bruger ikke cookies til sporing eller markedsføring.</p>
              </section>

              <section id="aendringer">
                <h2 className="text-base font-bold text-stone-900">7. Ændringer</h2>
                <p className="mt-2">Vi kan opdatere denne privatlivspolitik løbende. Væsentlige ændringer vil blive kommunikeret i appen.</p>
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