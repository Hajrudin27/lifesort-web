import Link from 'next/link';
import {
  ArrowRight,
  Ban,
  Baby,
  BrainCircuit,
  Building2,
  CalendarClock,
  CircleCheck,
  Clock,
  Cookie,
  Database,
  Download,
  Eye,
  FileText,
  Gavel,
  Globe,
  HeartPulse,
  KeyRound,
  Landmark,
  LockKeyhole,
  Mail,
  Pencil,
  RefreshCw,
  Scale,
  Server,
  ShieldCheck,
  Sparkles,
  Trash2,
  TriangleAlert,
} from 'lucide-react';
import { PublicHeader } from '@/components/public-header';
import { PublicFooter } from '@/components/public-footer';
import { TableOfContents } from '@/components/table-of-contents';
import { BackToTop } from '@/components/back-to-top';
import { ScrollReveal } from '@/components/scroll-reveal';
import { LegalSection, LegalTable } from '@/components/legal-section';
import { createPageMetadata } from '@/lib/seo';

export const metadata = createPageMetadata({
  title: 'Privatlivspolitik',
  description:
    'Læs hvordan LifeSort behandler personoplysninger, hvor data ligger, hvor længe vi gemmer dem, og hvordan du bruger dine GDPR-rettigheder.',
  path: '/privacy',
  keywords: ['LifeSort privatliv', 'LifeSort GDPR', 'LifeSort data', 'LifeSort persondata'],
});

/**
 * Datoen er bevidst en konstant og ikke `new Date()`.
 *
 * Før stod der "Sidst opdateret: <i dag>" på siden, uanset om teksten var rørt i månedsvis.
 * En privatlivspolitik er et dokument man skal kunne holdes op på — en dato der flytter sig
 * af sig selv gør det umuligt at se, hvornår vilkårene for ens data rent faktisk ændrede sig.
 * Opdatér både datoen og versionen, når indholdet nedenfor ændres.
 */
const LAST_UPDATED = new Date('2026-09-06T00:00:00Z');
const POLICY_VERSION = '1.1';

const lastUpdatedLabel = LAST_UPDATED.toLocaleDateString('da-DK', {
  day: 'numeric',
  month: 'long',
  year: 'numeric',
});

const toc = [
  { id: 'kort-fortalt', label: '1. Kort fortalt' },
  { id: 'dataansvarlig', label: '2. Dataansvarlig' },
  { id: 'indsamling', label: '3. Hvilke oplysninger' },
  { id: 'formaal', label: '4. Formål og retsgrundlag' },
  { id: 'helbredsdata', label: '5. Cyklus- og helbredsdata' },
  { id: 'databehandlere', label: '6. Databehandlere' },
  { id: 'sikkerhed', label: '7. Sådan beskytter vi data' },
  { id: 'opbevaring', label: '8. Opbevaringsperioder' },
  { id: 'rettigheder', label: '9. Dine rettigheder' },
  { id: 'sletning', label: '10. Eksport og sletning' },
  { id: 'cookies', label: '11. Cookies' },
  { id: 'boern', label: '12. Børn og unge' },
  { id: 'profilering', label: '13. Profilering' },
  { id: 'brud', label: '14. Sikkerhedsbrud' },
  { id: 'klage', label: '15. Klage' },
  { id: 'aendringer', label: '16. Ændringer' },
];

const heroPromises = [
  'Dine data opbevares og behandles inden for EU/EØS.',
  'Vi sælger aldrig dine data — og deler dem ikke til markedsføring.',
  'Du kan hente alt dit indhold og slette din konto selv, inde i appen.',
  'Cyklusdata behandles kun med dit udtrykkelige samtykke.',
  'Kun nødvendige cookies. Ingen sporing på tværs af sider.',
];

const trustStrip = [
  { icon: LockKeyhole, label: 'Adskilt pr. bruger', detail: 'Adgangen håndhæves i databasen, ikke kun i brugerfladen.' },
  { icon: CalendarClock, label: 'Sletter automatisk', detail: 'En daglig oprydning fjerner data, der har tjent sit formål.' },
  { icon: Globe, label: 'Hostet i EU', detail: 'Data ligger og behandles inden for EU/EØS.' },
];

const dataCategories = [
  {
    category: 'Kontooplysninger',
    examples: 'Email og adgangskode (gemt som et krypteret hash, aldrig i klartekst).',
    source: 'Dig, ved oprettelse',
  },
  {
    category: 'Cyklus- og symptomdata',
    examples: 'Menstruationscyklus, symptomer og noter i cyklus-modulet.',
    source: 'Dig, med samtykke',
  },
  {
    category: 'Økonomiske data',
    examples: 'Udgifter, indkomst, budgetter og opsparingsmål du selv indtaster.',
    source: 'Dig, i appen',
  },
  {
    category: 'Madplan og indkøb',
    examples: 'Opskrifter, madplaner, indkøbslister, priser og madbudget.',
    source: 'Dig, i appen',
  },
  {
    category: 'Karrieredata',
    examples: 'CV-oplysninger, jobansøgninger og noter i karriere-modulet.',
    source: 'Dig, i appen',
  },
  {
    category: 'Øvrige moduldata',
    examples: 'Vaner, gøremål, husstandsopgaver, rejser, garantier og tidslinje.',
    source: 'Dig, i appen',
  },
  {
    category: 'Filer du uploader',
    examples: 'Kvitteringer, billeder og vedhæftninger knyttet til dit indhold.',
    source: 'Dig, i appen',
  },
  {
    category: 'Supporthenvendelser',
    examples: 'Navn, email, emne, kategori og indholdet af din besked.',
    source: 'Dig, via supportformularen',
  },
  {
    category: 'Ventelistetilmelding',
    examples: 'Email og valgt platform (iOS eller Android).',
    source: 'Dig, på hjemmesiden',
  },
  {
    category: 'Tekniske oplysninger',
    examples:
      'IP-adresse brugt til at begrænse misbrug af formularerne, samt fejlrapporter og anonym besøgsstatistik uden cookies.',
    source: 'Automatisk',
  },
];

const legalBases = [
  {
    purpose: 'At levere appens funktioner og gemme det, du opretter',
    basis: 'Kontrakt',
    article: 'Art. 6(1)(b)',
  },
  {
    purpose: 'Cyklus- og symptomdata',
    basis: 'Udtrykkeligt samtykke',
    article: 'Art. 6(1)(a) + 9(2)(a)',
  },
  {
    purpose: 'At oprette din konto og logge dig ind sikkert',
    basis: 'Kontrakt',
    article: 'Art. 6(1)(b)',
  },
  {
    purpose: 'At besvare din supporthenvendelse',
    basis: 'Kontrakt / legitim interesse i at hjælpe dig',
    article: 'Art. 6(1)(b) og (f)',
  },
  {
    purpose: 'Venteliste og besked ved lancering',
    basis: 'Samtykke (du bekræfter selv tilmeldingen)',
    article: 'Art. 6(1)(a)',
  },
  {
    purpose: 'Driftssikkerhed, fejlretning og beskyttelse mod misbrug',
    basis: 'Legitim interesse i en app, der virker og ikke misbruges',
    article: 'Art. 6(1)(f)',
  },
  {
    purpose: 'Revisionsspor over administrative handlinger',
    basis: 'Retlig forpligtelse og legitim interesse i ansvarlighed',
    article: 'Art. 6(1)(c) og (f)',
  },
];

const processors = [
  {
    name: 'Supabase',
    role: 'Database, filer og login',
    detail: 'Her ligger alt det indhold, du opretter i appen, samt din konto.',
  },
  {
    name: 'Vercel',
    role: 'Hosting og besøgsstatistik',
    detail: 'Kører app-serveren og hjemmesiden. Statistikken er anonym og sætter ingen cookies.',
  },
  {
    name: 'Resend',
    role: 'Udsendelse af email',
    detail: 'Bekræftelser, supportsvar og ventelistemails sendes herigennem.',
  },
  {
    name: 'Sentry',
    role: 'Fejlovervågning',
    detail: 'Modtager tekniske fejlrapporter. Vi fjerner bevidst rækkeindholdet, før en databasefejl sendes afsted.',
  },
];

const securityMeasures = [
  {
    icon: LockKeyhole,
    tint: 'bg-rose-100 text-rose-600',
    title: 'Adgang håndhævet i databasen',
    detail:
      'Hver bruger er adskilt med row level security i selve databasen — ikke kun i brugerfladen. En anden bruger kan ikke hente dine rækker, uanset hvad der sendes til serveren.',
  },
  {
    icon: Eye,
    tint: 'bg-emerald-100 text-emerald-600',
    title: 'Admin-panelet kan ikke se dit indhold',
    detail:
      'Vores eget adminpanel har adgang til opskrifter, priser og supportsager — ikke til brugeres gøremål, økonomi eller cyklusdata. Det er afgrænset i systemet, ikke kun i en politik.',
  },
  {
    icon: KeyRound,
    tint: 'bg-amber-100 text-amber-600',
    title: 'Krypteret undervejs og i hvile',
    detail:
      'Al trafik går over HTTPS, og data krypteres i hvile hos vores databehandler. Adgangskoder gemmes som hash og kan ikke læses tilbage — heller ikke af os.',
  },
  {
    icon: FileText,
    tint: 'bg-sky-100 text-sky-600',
    title: 'Revisionsspor med maskerede oplysninger',
    detail:
      'Administrative handlinger logges, så det kan ses hvem der gjorde hvad. Emailadresser skrives maskeret i loggen sammen med et hashet id, så sporet kan følges uden at brede adresser ud.',
  },
];

const retention = [
  { data: 'Data du opretter i appen', period: 'Så længe du har en konto', note: 'Fjernes med det samme, når du sletter kontoen.' },
  { data: 'Kontooplysninger', period: 'Så længe kontoen findes', note: 'Sletning af kontoen fjerner også login.' },
  { data: 'Åbne supportsager', period: 'Indtil sagen er lukket', note: 'Røres ikke af den automatiske oprydning.' },
  { data: 'Lukkede supportsager', period: '12 måneder efter sidste ændring', note: 'Slettes automatisk.' },
  { data: 'Vedhæftede filer', period: 'Følger det indhold, de hører til', note: 'Filer uden ejer fjernes ved den daglige oprydning.' },
  { data: 'Ubekræftede ventelistetilmeldinger', period: '30 dage', note: 'Uden bekræftelse er der reelt ikke givet et samtykke.' },
  { data: 'Bekræftede ventelistetilmeldinger', period: 'Indtil lancering', note: 'Eller til du beder om at blive fjernet.' },
  { data: 'Fejlrapporter', period: '30 dage hos Sentry', note: 'Indeholder tekniske detaljer, ikke indholdet af dine data.' },
  { data: 'Revisionsspor i admin', period: 'Så længe det er nødvendigt for ansvarlighed', note: 'Indeholder maskerede emailadresser.' },
];

const rights = [
  { icon: Eye, title: 'Indsigt', detail: 'Få at vide hvilke oplysninger vi behandler om dig, og få en kopi.' },
  { icon: Pencil, title: 'Berigtigelse', detail: 'Få rettet oplysninger, der er forkerte eller ufuldstændige.' },
  { icon: Trash2, title: 'Sletning', detail: 'Få slettet dine oplysninger — “retten til at blive glemt”.' },
  { icon: Download, title: 'Dataportabilitet', detail: 'Få dine data udleveret i et almindeligt, maskinlæsbart format.' },
  { icon: Ban, title: 'Indsigelse', detail: 'Gøre indsigelse mod behandling, der sker på baggrund af legitim interesse.' },
  { icon: Clock, title: 'Begrænsning', detail: 'Bede om at behandlingen sættes på pause, mens en indsigelse afklares.' },
  { icon: KeyRound, title: 'Tilbagetrækning', detail: 'Trække et samtykke tilbage — det påvirker ikke behandlingen indtil da.' },
  { icon: Gavel, title: 'Klage', detail: 'Klage til Datatilsynet, hvis du mener, vi behandler dine data forkert.' },
];

const storageItems = [
  {
    name: 'sb-… (login)',
    type: 'Cookie',
    purpose: 'Holder dig logget ind og beskytter sessionen. Nødvendig — uden den kan du ikke være logget ind.',
  },
  {
    name: 'lifesort-cookie-consent',
    type: 'Lokal lagring',
    purpose: 'Husker at du har set cookiebeskeden, så den ikke vises igen. Forlader aldrig din browser.',
  },
  {
    name: 'Besøgsstatistik',
    type: 'Ingen cookie',
    purpose: 'Anonym optælling af sidevisninger uden cookies og uden profilering af den enkelte besøgende.',
  },
];

export default function PrivacyPage() {
  return (
    <>
      <PublicHeader />
      <main id="main-content" className="flex-1">
        <section className="relative overflow-hidden bg-[#16130F]">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(16,185,129,0.18),transparent_36%),linear-gradient(135deg,rgba(255,255,255,0.08),transparent_42%)]" />
          <div className="pointer-events-none absolute -bottom-28 -left-16 h-80 w-80 rounded-full bg-rose-500/10 blur-[100px] [animation:drift_18s_ease-in-out_infinite]" />

          <div className="relative mx-auto grid max-w-5xl grid-cols-1 items-end gap-10 px-6 py-16 sm:py-20 lg:grid-cols-[1fr_340px]">
            <div className="max-w-2xl text-center lg:text-left">
              <div className="mx-auto inline-flex items-center gap-1.5 rounded-full border border-white/10 bg-white/10 px-3 py-1 text-xs font-semibold text-emerald-100 lg:mx-0">
                <ShieldCheck size={13} />
                GDPR &amp; persondata
              </div>
              <h1 className="font-display mt-6 text-4xl font-semibold leading-tight text-white sm:text-5xl">
                Hvad vi gemmer — og hvad vi aldrig gør med det
              </h1>
              <p className="mx-auto mt-4 max-w-xl text-sm leading-7 text-stone-300 lg:mx-0">
                LifeSort samler nogle af de mest private dele af hverdagen. Derfor står der her helt konkret, hvilke oplysninger vi behandler, hvorfor vi må, hvor længe de bliver liggende, og hvordan du selv får dem ud igen.
              </p>

              <div className="mt-6 flex flex-wrap items-center justify-center gap-x-5 gap-y-2 text-xs text-stone-400 lg:justify-start">
                <span className="inline-flex items-center gap-1.5">
                  <CalendarClock size={13} />
                  Sidst opdateret {lastUpdatedLabel}
                </span>
                <span className="inline-flex items-center gap-1.5">
                  <FileText size={13} />
                  Version {POLICY_VERSION}
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
                {heroPromises.map((promise) => (
                  <li key={promise} className="flex items-start gap-2.5 text-[11px] leading-relaxed text-stone-300">
                    <CircleCheck size={14} className="mt-0.5 shrink-0 text-emerald-300" />
                    {promise}
                  </li>
                ))}
              </ul>
              <Link
                href="/sikkerhed"
                className="group mt-5 inline-flex w-full items-center justify-center gap-1.5 rounded-xl bg-white/10 px-4 py-2.5 text-xs font-semibold text-white transition hover:bg-white/[0.16]"
              >
                Se hvordan det er bygget
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
              <LegalSection id="kort-fortalt" number={1} icon={Sparkles} title="Kort fortalt" tint="emerald">
                <p>
                  Denne politik beskriver, hvordan LifeSort behandler personoplysninger i appen og på denne hjemmeside. Opsummeringen her er ikke jura — den fulde tekst nedenfor er den, der gælder.
                </p>
                <ul className="mt-1 grid grid-cols-1 gap-2 sm:grid-cols-2">
                  {[
                    'Du ejer dit indhold. Vi bruger det til at få appen til at virke — ikke til andet.',
                    'Vi sælger ikke data og deler dem ikke til markedsføring.',
                    'Alt ligger inden for EU/EØS hos leverandører, vi har en aftale med.',
                    'Cyklusdata behandles kun på dit udtrykkelige samtykke, som du kan trække tilbage.',
                    'Du kan hente alt dit indhold og slette din konto selv i appen.',
                    'Data, der ikke længere er brug for, slettes automatisk hver dag.',
                    'Kun nødvendige cookies. Ingen annoncesporing.',
                  ].map((item) => (
                    <li key={item} className="flex items-start gap-2 rounded-xl bg-stone-50 p-3 text-xs leading-relaxed text-stone-600">
                      <CircleCheck size={14} className="mt-0.5 shrink-0 text-emerald-600" />
                      {item}
                    </li>
                  ))}
                </ul>
              </LegalSection>

              <LegalSection id="dataansvarlig" number={2} icon={Building2} title="Dataansvarlig og kontakt" tint="stone">
                <p>
                  LifeSort er dataansvarlig for behandlingen af dine personoplysninger i forbindelse med din brug af appen og denne hjemmeside. Det betyder, at vi bestemmer, hvorfor og hvordan dine oplysninger behandles — og at det er os, du kan holde ansvarlig.
                </p>
                <p>
                  Har du spørgsmål til denne politik, eller vil du bruge dine rettigheder, kan du skrive til os via{' '}
                  <Link href="/support?category=account#support-form" className="font-semibold text-rose-600 underline decoration-rose-200 underline-offset-2 transition hover:decoration-rose-500">
                    supportformularen
                  </Link>
                  . Vi svarer typisk inden for 24 timer og altid senest inden for en måned, som GDPR kræver.
                </p>
                <div className="mt-1 flex items-start gap-3 rounded-xl border border-stone-200 bg-stone-50 p-4">
                  <Mail size={16} className="mt-0.5 shrink-0 text-stone-400" />
                  <p className="text-xs leading-relaxed text-stone-600">
                    Vi har ikke pligt til at have en databeskyttelsesrådgiver (DPO), og vi har ikke udpeget en. Henvendelser om persondata behandles af teamet bag LifeSort direkte.
                  </p>
                </div>
              </LegalSection>

              <LegalSection id="indsamling" number={3} icon={Database} title="Hvilke oplysninger vi behandler" tint="sky">
                <p>
                  Langt det meste af det, vi behandler, er noget du selv skriver ind i appen. Hvad der bliver behandlet, afhænger derfor af hvilke moduler du bruger — bruger du ikke cyklus-modulet, findes der ingen cyklusdata.
                </p>
                <LegalTable
                  headers={['Kategori', 'Eksempler', 'Kilde']}
                  rows={dataCategories.map((row) => [row.category, row.examples, row.source])}
                />
                <p className="text-xs text-stone-500">
                  Vi beder aldrig om CPR-nummer, betalingskortoplysninger eller adgang til din kontakt- eller kalenderdata for at kunne levere appens funktioner.
                </p>
              </LegalSection>

              <LegalSection id="formaal" number={4} icon={Scale} title="Formål og retsgrundlag" tint="violet">
                <p>
                  Vi må kun behandle personoplysninger, hvis vi har et lovligt grundlag for det. Her står grundlaget for hvert formål, så du kan se præcis hvad der hviler på en aftale, hvad der hviler på dit samtykke, og hvad der hviler på en interesseafvejning.
                </p>
                <LegalTable
                  headers={['Formål', 'Retsgrundlag', 'GDPR']}
                  rows={legalBases.map((row) => [
                    row.purpose,
                    row.basis,
                    <span key={row.article} className="whitespace-nowrap font-mono text-xs text-stone-500">
                      {row.article}
                    </span>,
                  ])}
                />
                <p className="text-xs text-stone-500">
                  Hviler en behandling på legitim interesse, har vi vurderet, at vores interesse i fx at holde tjenesten kørende ikke vejer tungere end dine rettigheder. Du kan altid gøre indsigelse mod den slags behandling.
                </p>
              </LegalSection>

              <LegalSection id="helbredsdata" number={5} icon={HeartPulse} title="Særligt om cyklus- og helbredsdata" tint="rose">
                <p>
                  Oplysninger om menstruationscyklus og symptomer er helbredsoplysninger og dermed en <strong className="font-semibold text-stone-900">særlig kategori af personoplysninger</strong> efter GDPR artikel 9. De behandles strengere end resten:
                </p>
                <ul className="ml-1 flex flex-col gap-2">
                  {[
                    'De behandles kun, hvis du udtrykkeligt giver samtykke ved at tage modulet i brug.',
                    'De bruges udelukkende til at vise dig dine egne oversigter og forudsigelser i appen.',
                    'De deles ikke med tredjeparter, indgår ikke i statistik og bruges aldrig til markedsføring.',
                    'De sendes ikke med i fejlrapporter til vores fejlovervågning.',
                    'Du kan trække samtykket tilbage ved at slette dine cyklusdata eller hele din konto i appen.',
                  ].map((item) => (
                    <li key={item} className="flex items-start gap-2 text-sm leading-relaxed">
                      <CircleCheck size={15} className="mt-0.5 shrink-0 text-rose-500" />
                      {item}
                    </li>
                  ))}
                </ul>
                <p className="rounded-xl border border-rose-100 bg-rose-50/70 p-4 text-xs leading-relaxed text-stone-600">
                  Trækker du samtykket tilbage, påvirker det ikke lovligheden af den behandling, der er sket indtil da — men behandlingen stopper fremadrettet, og data fjernes.
                </p>
              </LegalSection>

              <LegalSection id="databehandlere" number={6} icon={Server} title="Databehandlere og deling" tint="amber">
                <p>
                  Vi deler ikke dine oplysninger med tredjeparter til markedsføringsformål, og vi sælger dem ikke. Dine data ligger hos et lille antal leverandører, der behandler dem efter vores instruks som databehandlere, og som er bundet af en databehandleraftale. Alle behandler data inden for EU/EØS.
                </p>
                <LegalTable
                  headers={['Leverandør', 'Rolle', 'Hvad de behandler']}
                  rows={processors.map((row) => [row.name, row.role, row.detail])}
                />
                <div className="flex items-start gap-3 rounded-xl border border-emerald-200 bg-emerald-50/70 p-4">
                  <Globe size={16} className="mt-0.5 shrink-0 text-emerald-600" />
                  <div className="text-xs leading-relaxed text-stone-600">
                    <p className="font-semibold text-stone-900">Dine data bliver i EU</p>
                    <p className="mt-1">
                      Databasen, filerne og app-serveren er placeret inden for EU/EØS, og det er også her, dine oplysninger behandles. Skulle en leverandør undtagelsesvis have behov for at behandle data uden for EU/EØS, sker det kun på grundlag af EU-Kommissionens standardkontraktbestemmelser eller en afgørelse om tilstrækkeligt beskyttelsesniveau.
                    </p>
                    <p className="mt-2">
                      Vi videregiver derudover kun oplysninger til andre, hvis loven kræver det — fx ved en retskendelse.
                    </p>
                  </div>
                </div>
              </LegalSection>

              <LegalSection id="sikkerhed" number={7} icon={ShieldCheck} title="Sådan beskytter vi dine data" tint="emerald">
                <p>
                  Sikkerhed er ikke et løfte i teksten her — det er noget, der skal kunne holde, når nogen prøver. De vigtigste foranstaltninger:
                </p>
                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                  {securityMeasures.map((measure) => {
                    const Icon = measure.icon;
                    return (
                      <div key={measure.title} className="rounded-xl border border-stone-200 bg-stone-50/70 p-4">
                        <div className={`flex h-9 w-9 items-center justify-center rounded-lg ${measure.tint}`}>
                          <Icon className="h-4.5 w-4.5" strokeWidth={2.2} />
                        </div>
                        <p className="mt-3 text-sm font-bold text-stone-900">{measure.title}</p>
                        <p className="mt-1 text-xs leading-relaxed text-stone-600">{measure.detail}</p>
                      </div>
                    );
                  })}
                </div>
                <p className="text-xs text-stone-500">
                  Formularerne på hjemmesiden er desuden beskyttet mod misbrug med hastighedsbegrænsning pr. IP-adresse og emailadresse, så de ikke kan bruges til at sende uønsket post til andre.
                </p>
              </LegalSection>

              <LegalSection id="opbevaring" number={8} icon={CalendarClock} title="Hvor længe vi gemmer dine data" tint="stone">
                <p>
                  Vi gemmer ikke oplysninger længere end nødvendigt. En automatisk oprydning kører hver nat og fjerner det, der har tjent sit formål — det er ikke noget, nogen skal huske at gøre manuelt.
                </p>
                <LegalTable
                  headers={['Data', 'Opbevaringsperiode', 'Bemærkning']}
                  rows={retention.map((row) => [row.data, row.period, row.note])}
                />
              </LegalSection>

              <LegalSection id="rettigheder" number={9} icon={Gavel} title="Dine rettigheder" tint="violet">
                <p>
                  Efter databeskyttelsesforordningen har du en række rettigheder over dine egne oplysninger. De er gratis at bruge, og du skal ikke begrunde, hvorfor du gør det.
                </p>
                <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-2">
                  {rights.map((right) => {
                    const Icon = right.icon;
                    return (
                      <div key={right.title} className="flex items-start gap-3 rounded-xl border border-stone-200 bg-white p-3.5">
                        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-stone-100 text-stone-600">
                          <Icon className="h-4 w-4" strokeWidth={2.2} />
                        </div>
                        <div>
                          <p className="text-sm font-bold text-stone-900">{right.title}</p>
                          <p className="mt-0.5 text-xs leading-relaxed text-stone-600">{right.detail}</p>
                        </div>
                      </div>
                    );
                  })}
                </div>
                <p>
                  Skriv via{' '}
                  <Link href="/support?category=account#support-form" className="font-semibold text-rose-600 underline decoration-rose-200 underline-offset-2 transition hover:decoration-rose-500">
                    supportformularen
                  </Link>{' '}
                  for at bruge en rettighed. Vi svarer inden for en måned — og hurtigst muligt, hvis det haster.
                </p>
              </LegalSection>

              <LegalSection id="sletning" number={10} icon={Trash2} title="Sådan henter eller sletter du dine data" tint="rose">
                <p>
                  To af rettighederne behøver du slet ikke spørge om lov til at bruge. De ligger inde i appen, så du kan gøre det, når det passer dig:
                </p>
                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                  <div className="rounded-xl border border-stone-200 bg-stone-50/70 p-4">
                    <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-amber-100 text-amber-600">
                      <Download className="h-4.5 w-4.5" strokeWidth={2.2} />
                    </div>
                    <p className="mt-3 text-sm font-bold text-stone-900">Hent dine data</p>
                    <p className="mt-1 text-xs leading-relaxed text-stone-600">
                      Under <strong className="font-semibold text-stone-900">Indstillinger</strong> i appen kan du downloade alt dit eget indhold som én fil i et maskinlæsbart format — uden at skulle bede os om noget først.
                    </p>
                  </div>
                  <div className="rounded-xl border border-stone-200 bg-stone-50/70 p-4">
                    <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-rose-100 text-rose-600">
                      <Trash2 className="h-4.5 w-4.5" strokeWidth={2.2} />
                    </div>
                    <p className="mt-3 text-sm font-bold text-stone-900">Slet din konto</p>
                    <p className="mt-1 text-xs leading-relaxed text-stone-600">
                      Sletning under <strong className="font-semibold text-stone-900">Indstillinger</strong> fjerner kontoen og alt indhold i alle moduler i ét hug. Uploadede filer ryddes med, og en efterfølgende oprydning fanger eventuelle rester.
                    </p>
                  </div>
                </div>
                <p className="rounded-xl border border-stone-200 bg-stone-50 p-4 text-xs leading-relaxed text-stone-600">
                  Sletningen kan ikke fortrydes, og vi opbevarer ikke en skyggekopi bagefter. Har du brug for dine data, så hent dem, <em>inden</em> du sletter kontoen. Vil du hellere have os til at gøre det, kan du bede om det via supportformularen.
                </p>
              </LegalSection>

              <LegalSection id="cookies" number={11} icon={Cookie} title="Cookies og lokal lagring" tint="amber">
                <p>
                  Hjemmesiden bruger kun det, der er nødvendigt for at den virker. Vi bruger ikke cookies til sporing, profilering eller markedsføring, og vi deler ikke data med annoncenetværk.
                </p>
                <LegalTable
                  headers={['Navn', 'Type', 'Formål']}
                  rows={storageItems.map((row) => [row.name, row.type, row.purpose])}
                />
                <p className="text-xs text-stone-500">
                  Fordi vi udelukkende bruger nødvendige cookies, kræver de ikke dit samtykke. Cookiebeskeden på siden er derfor en oplysning, ikke et valg, du skal tage stilling til.
                </p>
              </LegalSection>

              <LegalSection id="boern" number={12} icon={Baby} title="Børn og unge" tint="sky">
                <p>
                  LifeSort er lavet til voksne, der vil have styr på hverdagen, og henvender sig ikke til børn under 13 år. Vi indsamler ikke bevidst oplysninger om børn under den alder.
                </p>
                <p>
                  Bliver vi opmærksomme på, at vi har oplysninger om et barn under 13 år uden fornødent samtykke fra en forælder, sletter vi dem. Er du forælder og har en mistanke om det, så skriv til os via supportformularen.
                </p>
              </LegalSection>

              <LegalSection id="profilering" number={13} icon={BrainCircuit} title="Profilering og automatiske afgørelser" tint="stone">
                <p>
                  Vi træffer ingen afgørelser om dig alene på grundlag af automatisk behandling, og vi laver ingen profilering med retsvirkning eller tilsvarende væsentlig betydning for dig.
                </p>
                <p>
                  Appen regner naturligvis på dine egne tal — den forudsiger fx din næste cyklus eller viser, hvor dit budget skrider. Det sker udelukkende for at vise dig dine egne data tilbage, det bliver på din konto, og det bruges ikke til at vurdere dig eller til at målrette noget mod dig.
                </p>
              </LegalSection>

              <LegalSection id="brud" number={14} icon={TriangleAlert} title="Hvis der sker et sikkerhedsbrud" tint="amber">
                <p>
                  Skulle der ske et brud på persondatasikkerheden, anmelder vi det til Datatilsynet uden unødig forsinkelse og senest 72 timer efter, at vi er blevet opmærksomme på det, medmindre bruddet er usandsynligt at medføre en risiko for dig.
                </p>
                <p>
                  Indebærer bruddet en høj risiko for dine rettigheder, giver vi dig direkte besked — med hvad der er sket, hvilke data det angår, og hvad du selv bør gøre.
                </p>
              </LegalSection>

              <LegalSection id="klage" number={15} icon={Landmark} title="Klage til Datatilsynet" tint="stone">
                <p>
                  Er du utilfreds med, hvordan vi behandler dine oplysninger, vil vi gerne høre det først — så kan vi som regel rette det hurtigt. Du har dog altid ret til at klage direkte til Datatilsynet:
                </p>
                <div className="rounded-xl border border-stone-200 bg-stone-50 p-4 text-sm leading-relaxed text-stone-600">
                  <p className="font-semibold text-stone-900">Datatilsynet</p>
                  <p className="mt-1">
                    Carl Jacobsens Vej 35, 2500 Valby
                    <br />
                    Telefon: 33 19 32 00
                    <br />
                    <a
                      href="https://www.datatilsynet.dk"
                      target="_blank"
                      rel="noreferrer noopener"
                      className="font-semibold text-rose-600 underline decoration-rose-200 underline-offset-2 transition hover:decoration-rose-500"
                    >
                      datatilsynet.dk
                    </a>
                  </p>
                </div>
              </LegalSection>

              <LegalSection id="aendringer" number={16} icon={RefreshCw} title="Ændringer i denne politik" tint="stone">
                <p>
                  Vi opdaterer politikken, når appen ændrer sig — nye moduler, nye leverandører eller nye måder at behandle data på. Datoen og versionsnummeret øverst på siden viser, hvornår teksten sidst blev ændret.
                </p>
                <p>
                  Ved væsentlige ændringer giver vi besked i appen, inden de træder i kraft. Kræver en ændring dit samtykke, beder vi om det på ny — vi antager det ikke bare, fordi du bliver ved med at bruge appen.
                </p>
                <div className="mt-1 flex items-center gap-3 rounded-xl border border-stone-200 bg-stone-50 p-4 text-xs text-stone-600">
                  <CalendarClock size={16} className="shrink-0 text-stone-400" />
                  <span>
                    Nuværende version: <strong className="font-semibold text-stone-900">{POLICY_VERSION}</strong> · gældende fra {lastUpdatedLabel}
                  </span>
                </div>
              </LegalSection>

              <ScrollReveal>
                <div className="flex flex-col gap-4 rounded-2xl border border-emerald-200 bg-gradient-to-br from-emerald-50 via-stone-50 to-amber-50 p-6 sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <p className="text-sm font-bold text-stone-900">Noget her, du gerne vil have uddybet?</p>
                    <p className="mt-1 text-xs leading-relaxed text-stone-600">
                      Spørgsmål om dine data, eksport eller sletning ryger direkte til teamet — ikke til en robot.
                    </p>
                  </div>
                  <Link
                    href="/support?category=account#support-form"
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
