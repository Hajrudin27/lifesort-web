import Link from 'next/link';
import {
  ArrowRight,
  Ban,
  Building2,
  CalendarClock,
  CircleCheck,
  Clock,
  Copyright,
  FileSignature,
  Gavel,
  Handshake,
  HeartPulse,
  Landmark,
  LayoutGrid,
  Mail,
  PiggyBank,
  Power,
  RefreshCw,
  Scale,
  ServerCog,
  ShieldAlert,
  Smartphone,
  Sparkles,
  TriangleAlert,
  UserCircle,
  Users,
  UtensilsCrossed,
  X,
} from 'lucide-react';
import { PublicHeader } from '@/components/public-header';
import { PublicFooter } from '@/components/public-footer';
import { TableOfContents } from '@/components/table-of-contents';
import { BackToTop } from '@/components/back-to-top';
import { ScrollReveal } from '@/components/scroll-reveal';
import { LegalSection, LegalTable } from '@/components/legal-section';
import { createPageMetadata } from '@/lib/seo';

export const metadata = createPageMetadata({
  title: 'Vilkår og betingelser',
  description:
    'Vilkår for brug af LifeSort — din konto, dit indhold, acceptabel brug, vigtige forbehold om sundheds- og økonomifunktioner, ansvar og opsigelse.',
  path: '/terms',
  keywords: ['LifeSort vilkår', 'LifeSort betingelser', 'LifeSort terms', 'LifeSort brugsvilkår'],
});

/**
 * Samme begrundelse som i privatlivspolitikken: datoen skal vise, hvornår teksten sidst
 * blev ændret, ikke hvornår siden blev åbnet. Opdatér dato og version sammen med indholdet.
 */
const LAST_UPDATED = new Date('2026-09-06T00:00:00Z');
const TERMS_VERSION = '1.1';

const lastUpdatedLabel = LAST_UPDATED.toLocaleDateString('da-DK', {
  day: 'numeric',
  month: 'long',
  year: 'numeric',
});

const toc = [
  { id: 'kort-fortalt', label: '1. Kort fortalt' },
  { id: 'accept', label: '2. Accept af vilkårene' },
  { id: 'tjenesten', label: '3. Tjenesten' },
  { id: 'udvikling', label: '4. Under udvikling' },
  { id: 'konto', label: '5. Din konto' },
  { id: 'brug', label: '6. Acceptabel brug' },
  { id: 'indhold', label: '7. Dit indhold' },
  { id: 'deling', label: '8. Deling med andre' },
  { id: 'forbehold', label: '9. Vigtige forbehold' },
  { id: 'rettigheder', label: '10. Vores rettigheder' },
  { id: 'tredjeparter', label: '11. Tredjeparter' },
  { id: 'tilgaengelighed', label: '12. Tilgængelighed' },
  { id: 'ansvar', label: '13. Ansvar' },
  { id: 'opsigelse', label: '14. Opsigelse' },
  { id: 'aendringer', label: '15. Ændringer' },
  { id: 'lovvalg', label: '16. Lovvalg' },
  { id: 'kontakt', label: '17. Kontakt' },
];

const heroPoints = [
  'Det, du skriver ind, er dit. Vi bruger det ikke til andet end at drive appen.',
  'Appen er et værktøj til overblik — ikke rådgivning om helbred eller økonomi.',
  'Du kan sige op når som helst ved at slette din konto i appen.',
  'Vi kan ændre og fjerne funktioner, mens LifeSort stadig bygges.',
];

const trustStrip = [
  { icon: Handshake, label: 'Skrevet til at blive læst', detail: 'Almindeligt dansk først, det juridiske bagefter.' },
  { icon: Scale, label: 'Dansk ret', detail: 'Dine ufravigelige forbrugerrettigheder gælder uanset hvad her.' },
  { icon: Power, label: 'Ingen binding', detail: 'Slet kontoen i appen, så er aftalen slut.' },
];

const modules = [
  { name: 'Madplan & indkøb', purpose: 'Ugeplan, indkøbslister og madbudget' },
  { name: 'Økonomi', purpose: 'Udgifter, budgetter og opsparingsmål' },
  { name: 'Cyklus', purpose: 'Cyklus- og symptomlog med opslagsværk' },
  { name: 'Karriere', purpose: 'Overblik over jobansøgninger' },
  { name: 'Gøremål & vaner', purpose: 'Daglige opgaver og vaner over tid' },
  { name: 'Hjemmet', purpose: 'Husstandsopgaver, fordelt eller roterende' },
  { name: 'Livsmål', purpose: 'Større mål brudt ned i delmål' },
  { name: 'Rejser', purpose: 'Rejseplanlægning og pakkelister' },
  { name: 'Garantier', purpose: 'Kvitteringer og udløbsdatoer' },
];

const allowed = [
  'Bruge appen til dit eget — og din husstands — hverdagsoverblik',
  'Gemme dine egne opskrifter, tal, noter og filer',
  'Dele en rejse eller husstandsopgaver med en person, du selv inviterer',
  'Hente dine data ud og bruge dem, hvor du vil',
];

const forbidden = [
  'Bruge appen til noget ulovligt eller til at skade andre',
  'Forsøge at få adgang til andre brugeres data eller til vores systemer',
  'Skrabe, kopiere eller videresælge indhold fra appen i større omfang',
  'Belaste eller forstyrre driften bevidst, fx med automatiserede kald',
  'Lægge ulovligt, krænkende eller skadeligt materiale op',
  'Udgive dig for at være en anden, eller oprette konti automatisk',
];

const disclaimers = [
  {
    icon: HeartPulse,
    tint: 'bg-rose-100 text-rose-600',
    title: 'Cyklus er ikke lægefaglig rådgivning',
    detail:
      'Forudsigelser bygger udelukkende på din egen historik og kan tage fejl. Appen må ikke bruges som prævention, til at fastslå graviditet eller som grundlag for at vurdere et helbredsproblem. Det indbyggede opslagsværk er generel information, ikke en diagnose. Er du i tvivl om noget, der handler om dit helbred, så kontakt din læge.',
  },
  {
    icon: PiggyBank,
    tint: 'bg-emerald-100 text-emerald-600',
    title: 'Økonomi er ikke finansiel rådgivning',
    detail:
      'Budgetter, oversigter og opsparingsmål er regnestykker på de tal, du selv har indtastet. De tager ikke højde for din samlede situation, og de er hverken rådgivning om lån, investering, pension eller skat. Beslutninger truffet på baggrund af tallene er dine egne.',
  },
  {
    icon: UtensilsCrossed,
    tint: 'bg-amber-100 text-amber-600',
    title: 'Opskrifter, priser og allergener',
    detail:
      'Priser og tilbud i madplanen kan være ændret eller udløbet, siden de blev indsamlet, og de er ikke et tilbud fra butikken. Ingredienslister kan være ufuldstændige — har du en allergi eller intolerance, så tjek altid selv varens egen mærkning.',
  },
  {
    icon: CalendarClock,
    tint: 'bg-sky-100 text-sky-600',
    title: 'Påmindelser er en hjælp, ikke en garanti',
    detail:
      'Påmindelser om garantiudløb, pakning og opgaver kan udeblive, fx hvis en notifikation ikke når frem. Ansvaret for en frist er dit. Appen ændrer i øvrigt intet ved dine rettigheder efter købeloven — den hjælper dig kun med at finde kvitteringen.',
  },
];

const termination = [
  {
    who: 'Dig',
    how: 'Slet din konto under Indstillinger i appen, når som helst',
    effect: 'Kontoen og alt dit indhold fjernes med det samme. Det kan ikke fortrydes.',
  },
  {
    who: 'Os',
    how: 'Ved væsentlig eller gentagen overtrædelse af disse vilkår',
    effect: 'Vi kan begrænse eller lukke adgangen. Vi varsler først, medmindre det haster.',
  },
  {
    who: 'Begge',
    how: 'Hvis vi lukker tjenesten helt ned',
    effect: 'Du får besked i god tid, så du kan nå at hente dine data ud.',
  },
];

export default function TermsPage() {
  return (
    <>
      <PublicHeader />
      <main id="main-content" className="flex-1">
        <section className="relative overflow-hidden bg-[#16130F]">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(245,158,11,0.18),transparent_36%),linear-gradient(135deg,rgba(255,255,255,0.08),transparent_42%)]" />
          <div className="pointer-events-none absolute -bottom-28 -left-16 h-80 w-80 rounded-full bg-rose-500/10 blur-[100px] [animation:drift_18s_ease-in-out_infinite]" />

          <div className="relative mx-auto grid max-w-5xl grid-cols-1 items-end gap-10 px-6 py-16 sm:py-20 lg:grid-cols-[1fr_340px]">
            <div className="max-w-2xl text-center lg:text-left">
              <div className="mx-auto inline-flex items-center gap-1.5 rounded-full border border-white/10 bg-white/10 px-3 py-1 text-xs font-semibold text-amber-100 lg:mx-0">
                <FileSignature size={13} />
                Vilkår for brug
              </div>
              <h1 className="font-display mt-6 text-4xl font-semibold leading-tight text-white sm:text-5xl">
                Aftalen mellem dig og LifeSort
              </h1>
              <p className="mx-auto mt-4 max-w-xl text-sm leading-7 text-stone-300 lg:mx-0">
                Hvad du kan forvente af os, hvad vi forventer af dig, og hvor grænserne går for et værktøj, der rører ved både helbred, økonomi og hverdag. Skrevet til at blive læst — ikke til at blive scrollet forbi.
              </p>

              <div className="mt-6 flex flex-wrap items-center justify-center gap-x-5 gap-y-2 text-xs text-stone-400 lg:justify-start">
                <span className="inline-flex items-center gap-1.5">
                  <CalendarClock size={13} />
                  Sidst opdateret {lastUpdatedLabel}
                </span>
                <span className="inline-flex items-center gap-1.5">
                  <FileSignature size={13} />
                  Version {TERMS_VERSION}
                </span>
                <span className="inline-flex items-center gap-1.5">
                  <Clock size={13} />
                  Ca. 8 minutters læsning
                </span>
              </div>
            </div>

            <div className="rounded-2xl border border-white/10 bg-white/[0.06] p-5 shadow-2xl shadow-stone-950/20 backdrop-blur">
              <p className="text-sm font-bold text-white">Kort fortalt</p>
              <ul className="mt-4 flex flex-col gap-3">
                {heroPoints.map((point) => (
                  <li key={point} className="flex items-start gap-2.5 text-[11px] leading-relaxed text-stone-300">
                    <CircleCheck size={14} className="mt-0.5 shrink-0 text-amber-300" />
                    {point}
                  </li>
                ))}
              </ul>
              <Link
                href="/privacy"
                className="group mt-5 inline-flex w-full items-center justify-center gap-1.5 rounded-xl bg-white/10 px-4 py-2.5 text-xs font-semibold text-white transition hover:bg-white/[0.16]"
              >
                Se hvordan vi behandler data
                <ArrowRight size={13} className="transition group-hover:translate-x-0.5" />
              </Link>
            </div>
          </div>
        </section>

        <section className="border-b border-stone-200 bg-white">
          <div className="mx-auto grid max-w-5xl grid-cols-1 gap-3 px-6 py-5 sm:grid-cols-3">
            {trustStrip.map((item) => {
              const Icon = item.icon;
              return (
                <div key={item.label} className="flex items-start gap-3">
                  <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-stone-100 text-stone-600">
                    <Icon size={16} />
                  </div>
                  <div>
                    <p className="text-sm font-bold text-stone-900">{item.label}</p>
                    <p className="mt-0.5 text-xs leading-relaxed text-stone-500">{item.detail}</p>
                  </div>
                </div>
              );
            })}
          </div>
        </section>

        <div className="mx-auto max-w-5xl px-6 py-12">
          <div className="flex flex-col gap-10 lg:flex-row">
            <TableOfContents items={toc} />

            <div className="flex min-w-0 flex-1 flex-col gap-4">
              <LegalSection id="kort-fortalt" number={1} icon={Sparkles} title="Kort fortalt" tint="amber">
                <p>
                  Opsummeringen her er en hjælp til at komme igennem, ikke en erstatning for teksten. Er der forskel på de to, er det afsnittene nedenfor, der gælder.
                </p>
                <ul className="mt-1 grid grid-cols-1 gap-2 sm:grid-cols-2">
                  {[
                    'Du opretter en konto og bruger appen til din egen hverdag.',
                    'Det, du skriver ind, er dit — vi hoster det bare for dig.',
                    'Appen giver overblik, ikke rådgivning om helbred eller penge.',
                    'LifeSort er stadig under udvikling, og funktioner kan ændre sig.',
                    'Du kan sige op når som helst ved at slette kontoen i appen.',
                    'Dansk ret gælder, og dine forbrugerrettigheder står ved magt.',
                  ].map((item) => (
                    <li key={item} className="flex items-start gap-2 rounded-xl bg-stone-50 p-3 text-xs leading-relaxed text-stone-600">
                      <CircleCheck size={14} className="mt-0.5 shrink-0 text-amber-600" />
                      {item}
                    </li>
                  ))}
                </ul>
              </LegalSection>

              <LegalSection id="accept" number={2} icon={Handshake} title="Accept af vilkårene" tint="stone">
                <p>
                  Ved at oprette en konto og bruge LifeSort indgår du en aftale med os på disse vilkår. Accepterer du dem ikke, kan du ikke bruge appen — og så er den rigtige handling at lade være med at oprette en konto, eller at slette den, du har.
                </p>
                <p>
                  Vilkårene gælder både appen og denne hjemmeside. Sammen med{' '}
                  <Link href="/privacy" className="font-semibold text-rose-600 underline decoration-rose-200 underline-offset-2 transition hover:decoration-rose-500">
                    privatlivspolitikken
                  </Link>{' '}
                  udgør de hele aftalen mellem dig og os. Privatlivspolitikken beskriver behandlingen af dine personoplysninger; den er ikke en del af vilkårene her, men gælder ved siden af.
                </p>
              </LegalSection>

              <LegalSection id="tjenesten" number={3} icon={LayoutGrid} title="Hvad tjenesten er" tint="sky">
                <p>
                  LifeSort er en app, der samler forskellige dele af hverdagen i ét overblik. Du vælger selv, hvilke moduler du tager i brug — bruger du ikke et modul, opretter du ingen data i det.
                </p>
                <LegalTable
                  headers={['Modul', 'Hvad det bruges til']}
                  rows={modules.map((row) => [row.name, row.purpose])}
                />
                <p className="text-xs text-stone-500">
                  Appen er et redskab til at holde styr på oplysninger, du selv indtaster. Den udfører ikke handlinger på dine vegne over for tredjeparter — den bestiller ikke varer, flytter ikke penge og sender ikke ansøgninger.
                </p>
              </LegalSection>

              <LegalSection id="udvikling" number={4} icon={ServerCog} title="LifeSort er stadig under udvikling" tint="amber">
                <p>
                  LifeSort er endnu ikke udgivet i sin endelige form. Det betyder noget for, hvad du kan forvente, og det siger vi hellere klart end i småt:
                </p>
                <ul className="ml-1 flex flex-col gap-2">
                  {[
                    'Funktioner kan blive ændret, erstattet eller fjernet undervejs.',
                    'Der kan forekomme fejl, nedetid og perioder med begrænset funktionalitet.',
                    'Appen er gratis at bruge i den nuværende form. Indfører vi betalte funktioner, får du besked først, og eksisterende funktioner bliver ikke pludselig låst bag en betaling uden varsel.',
                    'En tilmelding til ventelisten er ikke en aftale om køb og forpligter dig ikke til noget.',
                  ].map((item) => (
                    <li key={item} className="flex items-start gap-2 text-sm leading-relaxed">
                      <CircleCheck size={15} className="mt-0.5 shrink-0 text-amber-600" />
                      {item}
                    </li>
                  ))}
                </ul>
                <p className="rounded-xl border border-amber-100 bg-amber-50/70 p-4 text-xs leading-relaxed text-stone-600">
                  Netop fordi appen er under udvikling, bør den ikke være dit eneste sted at opbevare noget, du ikke kan undvære. Du kan altid hente alt dit indhold ud som én fil under Indstillinger.
                </p>
              </LegalSection>

              <LegalSection id="konto" number={5} icon={UserCircle} title="Din konto" tint="violet">
                <p>
                  Du skal oprette en konto for at bruge appen, og du er ansvarlig for det, der sker på den.
                </p>
                <ul className="ml-1 flex flex-col gap-2">
                  {[
                    'Oplysningerne, du opretter kontoen med, skal være rigtige — særligt emailadressen, som er den eneste vej til at få adgang igen.',
                    'Du skal holde din adgangskode fortrolig og ikke dele din konto med andre.',
                    'Mistænker du uautoriseret adgang, skal du kontakte os hurtigst muligt og skifte kode.',
                    'Du skal være mindst 13 år for at oprette en konto. Er du under 18, bør du bruge appen med en forælders viden og accept.',
                  ].map((item) => (
                    <li key={item} className="flex items-start gap-2 text-sm leading-relaxed">
                      <CircleCheck size={15} className="mt-0.5 shrink-0 text-violet-600" />
                      {item}
                    </li>
                  ))}
                </ul>
              </LegalSection>

              <LegalSection id="brug" number={6} icon={Gavel} title="Acceptabel brug" tint="stone">
                <p>
                  Rammen er enkel: brug appen til din egen hverdag, og lad være med at gå efter andres.
                </p>
                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                  <div className="rounded-xl border border-emerald-200 bg-emerald-50/50 p-4">
                    <p className="text-sm font-bold text-stone-900">Det må du gerne</p>
                    <ul className="mt-3 flex flex-col gap-2.5">
                      {allowed.map((item) => (
                        <li key={item} className="flex items-start gap-2 text-xs leading-relaxed text-stone-700">
                          <CircleCheck size={14} className="mt-0.5 shrink-0 text-emerald-600" />
                          {item}
                        </li>
                      ))}
                    </ul>
                  </div>
                  <div className="rounded-xl border border-stone-200 bg-stone-50 p-4">
                    <p className="text-sm font-bold text-stone-900">Det må du ikke</p>
                    <ul className="mt-3 flex flex-col gap-2.5">
                      {forbidden.map((item) => (
                        <li key={item} className="flex items-start gap-2 text-xs leading-relaxed text-stone-600">
                          <X size={14} className="mt-0.5 shrink-0 text-rose-500" />
                          {item}
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
                <p className="text-xs text-stone-500">
                  Undersøger du sikkerheden i god tro og efter reglerne på{' '}
                  <Link href="/sikkerhed" className="font-semibold text-rose-600 underline decoration-rose-200 underline-offset-2 transition hover:decoration-rose-500">
                    siden om sikkerhed
                  </Link>
                  , betragter vi det ikke som en overtrædelse — tværtimod.
                </p>
              </LegalSection>

              <LegalSection id="indhold" number={7} icon={Copyright} title="Dit indhold" tint="emerald">
                <p>
                  Alt, hvad du selv opretter — opskrifter, tal, noter, billeder og filer — <strong className="font-semibold text-stone-900">forbliver dit</strong>. Vi overtager ikke ejerskabet, og vi bruger det ikke til at træne modeller, til statistik om dig eller til markedsføring.
                </p>
                <p>
                  For at appen overhovedet kan virke, giver du os en snæver, teknisk tilladelse til at opbevare, kopiere og vise dit indhold — udelukkende med det formål at levere tjenesten til dig og dem, du selv deler med. Tilladelsen er gratis, den kan opsiges, og den ophører, når du sletter indholdet eller din konto.
                </p>
                <p>
                  Du er ansvarlig for det, du lægger op: at du har ret til det, og at det ikke krænker andres rettigheder eller er ulovligt.
                </p>
              </LegalSection>

              <LegalSection id="deling" number={8} icon={Users} title="Når du deler med andre" tint="sky">
                <p>
                  Nogle dele af appen kan deles — en rejse eller husstandens opgaver. Deling sker kun, når du selv inviterer en person, og den kan trækkes tilbage igen.
                </p>
                <ul className="ml-1 flex flex-col gap-2">
                  {[
                    'Den, du inviterer, kan se og redigere det, I deler — men intet andet på din konto.',
                    'Del kun oplysninger om andre, som de er indforstået med at få delt.',
                    'Indhold, en anden har oprettet i et delt rum, tilhører den person og forsvinder ikke, blot fordi du sletter din egen konto.',
                    'Fjerner du delingen, mister den anden adgangen fremadrettet.',
                  ].map((item) => (
                    <li key={item} className="flex items-start gap-2 text-sm leading-relaxed">
                      <CircleCheck size={15} className="mt-0.5 shrink-0 text-sky-600" />
                      {item}
                    </li>
                  ))}
                </ul>
              </LegalSection>

              <LegalSection id="forbehold" number={9} icon={TriangleAlert} title="Vigtige forbehold" tint="rose">
                <p>
                  LifeSort er et værktøj til overblik. Det er <strong className="font-semibold text-stone-900">ikke</strong> rådgivning, og det er ikke bygget til at træffe beslutninger på dine vegne. Fire steder er det særligt vigtigt:
                </p>
                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                  {disclaimers.map((item) => {
                    const Icon = item.icon;
                    return (
                      <div key={item.title} className="rounded-xl border border-stone-200 bg-stone-50/70 p-4">
                        <div className={`flex h-9 w-9 items-center justify-center rounded-lg ${item.tint}`}>
                          <Icon className="h-4.5 w-4.5" strokeWidth={2.2} />
                        </div>
                        <p className="mt-3 text-sm font-bold text-stone-900">{item.title}</p>
                        <p className="mt-1 text-xs leading-relaxed text-stone-600">{item.detail}</p>
                      </div>
                    );
                  })}
                </div>
                <div className="flex items-start gap-3 rounded-xl border border-rose-200 bg-rose-50/70 p-4">
                  <ShieldAlert size={17} className="mt-0.5 shrink-0 text-rose-500" />
                  <p className="text-xs leading-relaxed text-stone-600">
                    Har du akut brug for hjælp til dit helbred, så ring 112 eller kontakt lægevagten. LifeSort er ikke et sted at søge hjælp i en nødsituation.
                  </p>
                </div>
              </LegalSection>

              <LegalSection id="rettigheder" number={10} icon={Building2} title="Vores rettigheder" tint="stone">
                <p>
                  LifeSort — navnet, designet, koden, teksterne og det indhold, vi selv har lavet, som opskrifter og opslagsværket — tilhører os og er beskyttet af ophavsret. Du får ret til at bruge appen, ikke til at eje den.
                </p>
                <p>
                  Du må derfor ikke kopiere, videresælge, dekompilere eller bygge et konkurrerende produkt på vores indhold. Din egen brug af appen og dine egne data er selvfølgelig ikke omfattet af det.
                </p>
                <p>
                  Sender du os ideer eller forslag, må vi bruge dem frit til at forbedre LifeSort, uden at det udløser betaling eller giver dig rettigheder til produktet. Vi siger til gengæld tak — forslag er en stor del af, hvordan appen bliver bedre.
                </p>
              </LegalSection>

              <LegalSection id="tredjeparter" number={11} icon={Smartphone} title="App-butikker og tredjeparter" tint="violet">
                <p>
                  Når appen er udgivet, hentes den gennem App Store eller Google Play. Din brug af butikkerne er underlagt deres egne vilkår, og de er ikke part i aftalen her. Betalte funktioner vil i givet fald blive håndteret af butikken, ikke af os.
                </p>
                <p>
                  Vi bruger desuden leverandører til drift, hosting, email og fejlovervågning. De er beskrevet i{' '}
                  <Link href="/privacy#databehandlere" className="font-semibold text-rose-600 underline decoration-rose-200 underline-offset-2 transition hover:decoration-rose-500">
                    privatlivspolitikkens afsnit om databehandlere
                  </Link>
                  . Links til andres hjemmesider er en bekvemmelighed — vi har ikke kontrol over deres indhold og hæfter ikke for det.
                </p>
              </LegalSection>

              <LegalSection id="tilgaengelighed" number={12} icon={RefreshCw} title="Tilgængelighed og ændringer af tjenesten" tint="stone">
                <p>
                  Vi tilstræber høj oppetid, men vi garanterer den ikke. Der kan være planlagt vedligehold, uforudset nedetid og fejl hos vores leverandører, som vi ikke selv råder over.
                </p>
                <p>
                  Vi kan ændre, tilføje og fjerne funktioner. Fjerner vi noget væsentligt, som du har data i, varsler vi det i appen i rimelig tid, så du kan nå at hente dit indhold ud.
                </p>
              </LegalSection>

              <LegalSection id="ansvar" number={13} icon={Scale} title="Ansvar" tint="amber">
                <p>
                  LifeSort leveres, som den er og forefindes. Vi giver ingen garanti for, at appen er fejlfri, altid tilgængelig, eller at beregninger og forudsigelser er præcise.
                </p>
                <p>
                  Vi er ikke ansvarlige for indirekte tab eller følgeskader — herunder tabt fortjeneste, mistede besparelser, tabt arbejdstid eller tab af data — der opstår som følge af din brug af appen, eller af at du ikke kunne bruge den.
                </p>
                <div className="rounded-xl border border-stone-200 bg-stone-50 p-4 text-xs leading-relaxed text-stone-600">
                  <p className="font-semibold text-stone-900">Det, vi ikke kan fraskrive os</p>
                  <p className="mt-1">
                    Intet i disse vilkår begrænser vores ansvar for forsæt eller grov uagtsomhed, for personskade, eller for noget andet, som efter dansk ret ikke kan fraskrives. Er du forbruger, gælder dine ufravigelige rettigheder efter dansk lov uanset, hvad der står her.
                  </p>
                </div>
              </LegalSection>

              <LegalSection id="opsigelse" number={14} icon={Power} title="Opsigelse" tint="rose">
                <p>
                  Aftalen løber, indtil en af os afslutter den. Der er ingen bindingsperiode og intet opsigelsesvarsel fra din side.
                </p>
                <LegalTable
                  headers={['Hvem', 'Hvordan', 'Hvad der sker']}
                  rows={termination.map((row) => [row.who, row.how, row.effect])}
                />
                <div className="flex items-start gap-3 rounded-xl border border-rose-100 bg-rose-50/60 p-4">
                  <Ban size={16} className="mt-0.5 shrink-0 text-rose-500" />
                  <p className="text-xs leading-relaxed text-stone-600">
                    Sletning kan ikke fortrydes, og vi gemmer ingen skyggekopi bagefter. Hent dine data, <em>inden</em> du sletter kontoen.
                  </p>
                </div>
              </LegalSection>

              <LegalSection id="aendringer" number={15} icon={FileSignature} title="Ændringer af vilkårene" tint="stone">
                <p>
                  Vi kan opdatere disse vilkår, når appen eller lovgivningen ændrer sig. Datoen og versionsnummeret øverst viser, hvornår teksten sidst blev ændret.
                </p>
                <p>
                  Væsentlige ændringer varsler vi i appen, før de træder i kraft. Vil du ikke acceptere dem, er den rigtige reaktion at stoppe med at bruge appen og slette din konto — det er dit frie valg, og du kan tage dine data med dig.
                </p>
                <div className="mt-1 flex items-center gap-3 rounded-xl border border-stone-200 bg-stone-50 p-4 text-xs text-stone-600">
                  <CalendarClock size={16} className="shrink-0 text-stone-400" />
                  <span>
                    Nuværende version: <strong className="font-semibold text-stone-900">{TERMS_VERSION}</strong> · gældende fra {lastUpdatedLabel}
                  </span>
                </div>
              </LegalSection>

              <LegalSection id="lovvalg" number={16} icon={Landmark} title="Lovvalg og tvister" tint="sky">
                <p>
                  Disse vilkår er underlagt dansk ret, og tvister afgøres ved de danske domstole. Er du forbruger, kan du altid anlægge sag der, hvor du bor, hvis reglerne giver dig ret til det.
                </p>
                <p>
                  Skulle en enkelt bestemmelse i vilkårene vise sig ugyldig, gælder resten fortsat. Vi vil altid hellere løse en uenighed ved at skrive sammen først — skriv til os, før det bliver til en sag.
                </p>
              </LegalSection>

              <LegalSection id="kontakt" number={17} icon={Mail} title="Kontakt" tint="emerald">
                <p>
                  Spørgsmål til vilkårene, eller noget der virker uklart? Skriv til os via{' '}
                  <Link href="/support?category=general#support-form" className="font-semibold text-rose-600 underline decoration-rose-200 underline-offset-2 transition hover:decoration-rose-500">
                    supportformularen
                  </Link>
                  . Vi svarer typisk inden for 24 timer.
                </p>
                <p className="text-xs text-stone-500">
                  Handler dit spørgsmål om personoplysninger, dine data eller sletning, står svarene i{' '}
                  <Link href="/privacy" className="font-semibold text-rose-600 underline decoration-rose-200 underline-offset-2 transition hover:decoration-rose-500">
                    privatlivspolitikken
                  </Link>
                  .
                </p>
              </LegalSection>

              <ScrollReveal>
                <div className="flex flex-col gap-4 rounded-2xl border border-amber-200 bg-gradient-to-br from-amber-50 via-stone-50 to-rose-50 p-6 sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <p className="text-sm font-bold text-stone-900">Noget her, der ikke giver mening?</p>
                    <p className="mt-1 text-xs leading-relaxed text-stone-600">
                      Vilkår, ingen forstår, er ingen aftale. Sig til, hvis en formulering er uklar — så skriver vi den om.
                    </p>
                  </div>
                  <Link
                    href="/support?category=general#support-form"
                    className="inline-flex shrink-0 items-center justify-center gap-1.5 rounded-xl bg-stone-900 px-4 py-2.5 text-xs font-semibold text-white transition hover:bg-stone-800"
                  >
                    Skriv til os
                    <ArrowRight size={13} />
                  </Link>
                </div>
              </ScrollReveal>
            </div>
          </div>
        </div>
      </main>
      <BackToTop />
      <PublicFooter />
    </>
  );
}
