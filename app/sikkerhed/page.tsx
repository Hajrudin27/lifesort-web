import Link from 'next/link';
import {
  ArrowRight,
  Ban,
  Bug,
  CircleCheck,
  Database,
  Download,
  Eye,
  EyeOff,
  FileCheck,
  Globe,
  HeartPulse,
  ImageOff,
  KeyRound,
  Layers,
  Lock,
  Network,
  ScanSearch,
  Server,
  ShieldCheck,
  Siren,
  Trash2,
  UserCheck,
  Users,
  X,
} from 'lucide-react';
import { PublicHeader } from '@/components/public-header';
import { PublicFooter } from '@/components/public-footer';
import { ScrollReveal } from '@/components/scroll-reveal';
import { BackToTop } from '@/components/back-to-top';
import { createPageMetadata } from '@/lib/seo';

export const metadata = createPageMetadata({
  title: 'Sikkerhed & privatliv',
  description:
    'Sådan beskytter LifeSort dine data — lag for lag, fra forbindelsen til databasen. Konkret, ikke kun i småt skrevet jura.',
  path: '/sikkerhed',
  keywords: ['LifeSort sikkerhed', 'LifeSort privatliv', 'hverdagsapp datasikkerhed', 'LifeSort kryptering'],
});

const cannotDo = [
  'Vi kan ikke læse dine cyklusdata, din økonomi eller dine gøremål.',
  'Vi kan ikke se din adgangskode — heller ikke hvis vi ville.',
  'Vi kan ikke hente din konto tilbage, når du har slettet den.',
  'Vi kan ikke sælge data videre, fordi vi ikke deler dem med nogen.',
];

const trustStrip = [
  { icon: Database, label: 'Adskilt i databasen', detail: 'Ikke kun i brugerfladen, hvor det er let at komme udenom.' },
  { icon: Globe, label: 'Hostet i EU', detail: 'Data ligger og behandles inden for EU/EØS.' },
  { icon: Trash2, label: 'Sletning er en garanti', detail: 'Én knap fjerner kontoen og alt indhold i alle moduler.' },
];

const points = [
  {
    icon: Lock,
    title: 'Kun dig kan se dine data',
    tint: 'bg-rose-100 text-rose-600',
    description:
      'Hver bruger er adskilt på database-niveau, ikke kun i appens brugerflade — dine gøremål, udgifter, garantier og cyklus-data er teknisk umulige for andre brugere at tilgå, uanset hvad de prøver.',
  },
  {
    icon: UserCheck,
    title: 'Vi kan ikke selv se dine personlige data',
    tint: 'bg-emerald-100 text-emerald-600',
    description:
      'Det admin-panel, vi selv styrer appen fra, har kun adgang til indhold som opskrifter, priser og supportsager — ikke til brugeres personlige gøremål, udgifter eller cyklus-oplysninger. Det er ikke et løfte, det er sådan systemet er bygget.',
  },
  {
    icon: Download,
    title: 'Dine data er altid dine at tage med',
    tint: 'bg-amber-100 text-amber-600',
    description:
      'Under Indstillinger i appen kan du downloade alle dine egne data som én fil, når som helst — uden at skulle bede os om noget først.',
  },
  {
    icon: HeartPulse,
    title: 'Ekstra varsomhed med sundhedsdata',
    tint: 'bg-violet-100 text-violet-600',
    description:
      'Cyklus- og symptomdata er en særlig kategori af personoplysninger under GDPR. De behandles kun med dit udtrykkelige samtykke og forbliver knyttet alene til din konto.',
  },
];

/**
 * Lagene beskriver den faktiske kæde fra browser til database. Rækkefølgen er bevidst
 * den vej et angreb ville komme fra — ikke den vi synes ser bedst ud.
 */
const layers = [
  {
    icon: Network,
    tint: 'bg-sky-100 text-sky-600',
    title: 'Forbindelsen',
    lead: 'Intet går ukrypteret over nettet.',
    items: [
      'Al trafik kører over HTTPS, og browseren får besked på at nægte at bruge andet i to år frem (HSTS).',
      'Data krypteres også i hvile hos vores databehandler, ikke kun undervejs.',
    ],
  },
  {
    icon: ShieldCheck,
    tint: 'bg-emerald-100 text-emerald-600',
    title: 'Hjemmesiden',
    lead: 'Siden kan ikke misbruges som ramme om et angreb.',
    items: [
      'Siden må ikke lægges i en iframe, så et falsk lag ikke kan narre dig til at klikke på noget andet, end du tror.',
      'Formularer kan kun sende til vores eget domæne, og browseren må ikke gætte filtyper.',
      'Kamera, mikrofon, placering og betaling er slået fra på sidens niveau.',
      'En fuld Content Security Policy kører i rapporteringstilstand, mens vi verificerer, at den ikke bryder noget. De dele, der ikke kan gå galt, håndhæves allerede.',
    ],
  },
  {
    icon: FileCheck,
    tint: 'bg-amber-100 text-amber-600',
    title: 'Det, du sender ind',
    lead: 'Serveren stoler aldrig på det, browseren siger.',
    items: [
      'Alle felter valideres på serveren: længde, format og ugyldige styretegn — ikke kun i browseren, hvor kontrollen ligger på afsenderens egen maskine.',
      'Formularerne er begrænset pr. IP-adresse og pr. emailadresse, så de ikke kan bruges til at sende uønsket post til andre.',
      'Skjulte honeypot-felter fanger de bots, der udfylder alt, uden at genere rigtige brugere med captchas.',
    ],
  },
  {
    icon: Database,
    tint: 'bg-rose-100 text-rose-600',
    title: 'Databasen',
    lead: 'Her ligger den regel, alt andet hviler på.',
    items: [
      'Row level security afgør pr. række, hvem der må læse og skrive. Reglen håndhæves af databasen selv — den kan ikke omgås ved at sende noget andet til serveren.',
      'Den offentlige API-nøgle ligger i både web- og mobil-appen og behandles derfor som alment kendt: alt, den må, må enhver. Derfor må den næsten intet.',
      'Revisionssporet kan ikke skrives fra en browser. Kun serveren skriver i det, og den udleder altid aktøren fra den verificerede session.',
    ],
  },
  {
    icon: ImageOff,
    tint: 'bg-violet-100 text-violet-600',
    title: 'Filer og billeder',
    lead: 'En upload er også et angreb, hvis man lader den være det.',
    items: [
      'Dine vedhæftninger ligger privat med en mappe pr. bruger og kan ikke hentes af andre.',
      'Billeder til det fælles opskriftskatalog må kun være JPEG, PNG eller WebP. SVG er bevidst udeladt — det er det eneste billedformat, der kan indeholde kode, der kører.',
      'Størrelsesgrænserne håndhæves i serveren, ikke kun i browseren.',
    ],
  },
];

const adminCanSee = [
  'Opskrifter, priser, tilbud og andet indhold, vi selv har lavet',
  'Supportsager, du selv har sendt til os',
  'Ventelistetilmeldinger, mens ventelisten er åben',
  'Maskerede emailadresser i revisionssporet',
];

const adminCannotSee = [
  'Dine gøremål, vaner og husstandsopgaver',
  'Din økonomi, dine budgetter og opsparingsmål',
  'Dine cyklus- og symptomdata',
  'Din madplan, dine rejser og dine garantier',
  'Dine uploadede filer og kvitteringer',
  'Din adgangskode — den findes kun som et hash',
];

const roles = [
  {
    role: 'Owner',
    access: 'Alt, inklusive at give og fjerne adgang',
    note: 'Databasen nægter at fjerne den sidste owner, så adgangen ikke kan låses ude ved et uheld.',
  },
  {
    role: 'Editor',
    access: 'Indhold: priser, tilbud, produkter, opskrifter og tidslinje',
    note: 'Ingen adgang til supportsager eller venteliste.',
  },
  {
    role: 'Support',
    access: 'Kundedata: supportsager og venteliste',
    note: 'Ingen adgang til at redigere appens indhold.',
  },
];

const controls = [
  {
    icon: Download,
    tint: 'bg-amber-100 text-amber-600',
    title: 'Hent alt dit indhold',
    detail: 'Én fil med alle dine data, i et format du kan læse og tage med videre. Ligger under Indstillinger.',
  },
  {
    icon: Trash2,
    tint: 'bg-rose-100 text-rose-600',
    title: 'Slet din konto',
    detail: 'Fjerner kontoen og alt indhold i alle moduler i ét hug. Filer ryddes med, og en oprydning fanger resterne.',
  },
  {
    icon: Ban,
    tint: 'bg-violet-100 text-violet-600',
    title: 'Træk et samtykke tilbage',
    detail: 'Slet dine cyklusdata, og behandlingen stopper. Du skal ikke spørge os om lov først.',
  },
  {
    icon: Eye,
    tint: 'bg-sky-100 text-sky-600',
    title: 'Se, hvad vi har',
    detail: 'Bed om indsigt via supporten, så samler vi det, der er registreret om dig.',
  },
];

const practices = [
  {
    icon: ScanSearch,
    title: 'Fejl rapporteres uden dit indhold',
    detail:
      'En databasefejl bærer normalt hele den afviste række med sig. Vi bygger bevidst en ny, renset fejl, før den sendes til vores fejlovervågning, så navne og fritekst ikke slipper med ud.',
  },
  {
    icon: Trash2,
    title: 'Oprydningen kører af sig selv',
    detail:
      'En automatisk opgave sletter hver nat det, der har tjent sit formål — lukkede supportsager, ubekræftede tilmeldinger og filer uden ejer. Det er ikke noget, nogen skal huske.',
  },
  {
    icon: KeyRound,
    title: 'Login er beskyttet mod gættelege',
    detail:
      'Adgangen til admin-panelet er begrænset både pr. IP-adresse og pr. konto, og svaret røber aldrig, om det var emailen eller adgangskoden, der var forkert.',
  },
  {
    icon: FileCheck,
    title: 'Reglerne er testet, ikke antaget',
    detail:
      'Adgangsreglerne i databasen har deres egne tests, så en fremtidig ændring ikke kan åbne noget i stilhed. Vi skriver også ned, hvad der faktisk blev målt, når et hul lukkes.',
  },
];

export default function SecurityPage() {
  return (
    <>
      <PublicHeader />
      <main id="main-content" className="flex-1">
        <section className="relative overflow-hidden bg-[#16130F]">
          <div className="pointer-events-none absolute -top-20 right-0 h-96 w-96 rounded-full bg-emerald-600/20 blur-[100px] [animation:drift_15s_ease-in-out_infinite]" />
          <div className="pointer-events-none absolute bottom-0 -left-16 h-56 w-56 rounded-full bg-rose-500/10 blur-[90px] [animation:drift_19s_ease-in-out_infinite_reverse]" />

          <div className="relative mx-auto grid max-w-5xl grid-cols-1 items-end gap-10 px-6 py-16 sm:py-20 lg:grid-cols-[1fr_340px]">
            <div className="max-w-2xl text-center lg:text-left">
              <div className="mx-auto inline-flex items-center gap-1.5 rounded-full border border-white/10 bg-white/10 px-3 py-1 text-xs font-semibold text-emerald-100 lg:mx-0">
                <ShieldCheck size={13} />
                Sikkerhed &amp; privatliv
              </div>
              <h1 className="font-display mt-6 text-4xl font-semibold leading-tight text-white sm:text-5xl">
                Din data er din
              </h1>
              <p className="mx-auto mt-4 max-w-xl text-sm leading-7 text-stone-300 lg:mx-0">
                Ikke bare et løfte i småt skrevet jura. Her står, hvordan LifeSort rent teknisk er bygget — lag for lag, fra forbindelsen på din telefon til den enkelte række i databasen.
              </p>
              <div className="mt-7 flex flex-col gap-3 sm:flex-row sm:justify-center lg:justify-start">
                <a
                  href="#lag"
                  className="inline-flex items-center justify-center gap-2 rounded-xl bg-white px-5 py-3 text-sm font-semibold text-stone-900 transition hover:bg-stone-100"
                >
                  Se hvordan det er bygget
                  <ArrowRight size={15} />
                </a>
                <Link
                  href="/privacy"
                  className="inline-flex items-center justify-center rounded-xl border border-white/15 bg-white/5 px-5 py-3 text-sm font-semibold text-white transition hover:bg-white/10"
                >
                  Læs privatlivspolitikken
                </Link>
              </div>
            </div>

            <div className="rounded-2xl border border-white/10 bg-white/[0.06] p-5 shadow-2xl shadow-stone-950/20 backdrop-blur">
              <div className="flex items-center gap-2">
                <EyeOff size={15} className="text-emerald-300" />
                <p className="text-sm font-bold text-white">Det kan vi ikke</p>
              </div>
              <p className="mt-2 text-[11px] leading-relaxed text-stone-400">
                Den mest troværdige sikkerhed er den, vi selv er låst ude af.
              </p>
              <ul className="mt-4 flex flex-col gap-3">
                {cannotDo.map((item) => (
                  <li key={item} className="flex items-start gap-2.5 text-[11px] leading-relaxed text-stone-300">
                    <X size={14} className="mt-0.5 shrink-0 text-rose-300" />
                    {item}
                  </li>
                ))}
              </ul>
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

        <div className="mx-auto max-w-5xl px-6 py-14">
          <ScrollReveal>
            <p className="text-xs font-bold uppercase tracking-wider text-emerald-700">Fire løfter</p>
            <h2 className="font-display mt-2 text-3xl font-semibold leading-tight text-stone-900">
              Det vigtigste først
            </h2>
          </ScrollReveal>

          <div className="mt-6 grid grid-cols-1 gap-5 sm:grid-cols-2">
            {points.map((p, i) => {
              const Icon = p.icon;
              return (
                <ScrollReveal key={p.title} delay={i * 80}>
                  <div className="h-full rounded-2xl border border-stone-200 bg-white p-6 shadow-sm shadow-stone-900/5">
                    <div className={`flex h-10 w-10 items-center justify-center rounded-xl ${p.tint}`}>
                      <Icon className="h-5 w-5" strokeWidth={2.2} />
                    </div>
                    <h3 className="mt-4 text-base font-bold text-stone-900">{p.title}</h3>
                    <p className="mt-1.5 text-sm leading-relaxed text-stone-600">{p.description}</p>
                  </div>
                </ScrollReveal>
              );
            })}
          </div>
        </div>

        <section id="lag" className="scroll-mt-24 border-y border-stone-200 bg-white">
          <div className="mx-auto max-w-5xl px-6 py-16">
            <ScrollReveal>
              <div className="flex items-center gap-2">
                <Layers size={15} className="text-stone-400" />
                <p className="text-xs font-bold uppercase tracking-wider text-stone-500">Lag for lag</p>
              </div>
              <h2 className="font-display mt-2 max-w-2xl text-3xl font-semibold leading-tight text-stone-900">
                Fem lag mellem din hverdag og alle andre
              </h2>
              <p className="mt-3 max-w-2xl text-sm leading-relaxed text-stone-600">
                Ét enkelt forsvar er ikke et forsvar — det er et enkelt punkt, der kan svigte. Rækkefølgen her er den vej, et angreb ville komme fra: udefra og ind mod dine data.
              </p>
            </ScrollReveal>

            <div className="mt-10 flex flex-col gap-4">
              {layers.map((layer, index) => {
                const Icon = layer.icon;
                return (
                  <ScrollReveal key={layer.title} delay={index * 60}>
                    <div className="grid grid-cols-1 gap-5 rounded-2xl border border-stone-200 bg-stone-50/70 p-6 sm:grid-cols-[220px_minmax(0,1fr)]">
                      <div>
                        <div className="flex items-center gap-3">
                          <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${layer.tint}`}>
                            <Icon className="h-5 w-5" strokeWidth={2.2} />
                          </div>
                          <span className="font-mono text-xs font-semibold text-stone-400">
                            Lag {index + 1}
                          </span>
                        </div>
                        <h3 className="mt-3 text-base font-bold text-stone-900">{layer.title}</h3>
                        <p className="mt-1 text-xs leading-relaxed text-stone-500">{layer.lead}</p>
                      </div>

                      <ul className="flex flex-col gap-2.5 sm:border-l sm:border-stone-200 sm:pl-6">
                        {layer.items.map((item) => (
                          <li key={item} className="flex items-start gap-2.5 text-sm leading-relaxed text-stone-600">
                            <CircleCheck size={15} className="mt-0.5 shrink-0 text-emerald-600" />
                            {item}
                          </li>
                        ))}
                      </ul>
                    </div>
                  </ScrollReveal>
                );
              })}
            </div>
          </div>
        </section>

        <div className="mx-auto max-w-5xl px-6 py-16">
          <ScrollReveal>
            <p className="text-xs font-bold uppercase tracking-wider text-rose-500">Indefra</p>
            <h2 className="font-display mt-2 max-w-2xl text-3xl font-semibold leading-tight text-stone-900">
              Hvad vi selv kan se — og hvad vi aldrig kan
            </h2>
            <p className="mt-3 max-w-2xl text-sm leading-relaxed text-stone-600">
              De fleste databrud handler ikke om avancerede angreb, men om at nogen indefra kunne se mere, end de havde brug for. Derfor er vores eget panel skåret ned til det, driften faktisk kræver.
            </p>
          </ScrollReveal>

          <div className="mt-8 grid grid-cols-1 gap-5 lg:grid-cols-2">
            <ScrollReveal>
              <div className="h-full rounded-2xl border border-stone-200 bg-white p-6 shadow-sm shadow-stone-900/5">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-stone-100 text-stone-600">
                    <Eye className="h-5 w-5" strokeWidth={2.2} />
                  </div>
                  <h3 className="text-base font-bold text-stone-900">Det ser vi</h3>
                </div>
                <ul className="mt-5 flex flex-col gap-3">
                  {adminCanSee.map((item) => (
                    <li key={item} className="flex items-start gap-2.5 text-sm leading-relaxed text-stone-600">
                      <CircleCheck size={15} className="mt-0.5 shrink-0 text-stone-400" />
                      {item}
                    </li>
                  ))}
                </ul>
              </div>
            </ScrollReveal>

            <ScrollReveal delay={90}>
              <div className="h-full rounded-2xl border border-emerald-200 bg-emerald-50/50 p-6 shadow-sm shadow-emerald-900/5">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-100 text-emerald-700">
                    <EyeOff className="h-5 w-5" strokeWidth={2.2} />
                  </div>
                  <h3 className="text-base font-bold text-stone-900">Det ser vi aldrig</h3>
                </div>
                <ul className="mt-5 flex flex-col gap-3">
                  {adminCannotSee.map((item) => (
                    <li key={item} className="flex items-start gap-2.5 text-sm leading-relaxed text-stone-700">
                      <X size={15} className="mt-0.5 shrink-0 text-emerald-600" />
                      {item}
                    </li>
                  ))}
                </ul>
                <p className="mt-5 rounded-xl bg-white/70 p-3 text-xs leading-relaxed text-stone-600">
                  Det er ikke en indstilling, nogen kan slå fra i panelet. Adgangen findes ikke i databasens regler, så der er ikke noget at slå til.
                </p>
              </div>
            </ScrollReveal>
          </div>

          <ScrollReveal delay={140} className="mt-5">
            <div className="rounded-2xl border border-stone-200 bg-white p-6 shadow-sm shadow-stone-900/5">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-sky-100 text-sky-600">
                  <Users className="h-5 w-5" strokeWidth={2.2} />
                </div>
                <div>
                  <h3 className="text-base font-bold text-stone-900">Mindst mulig adgang, også internt</h3>
                  <p className="text-xs text-stone-500">Rollerne håndhæves i databasen — ikke kun i menuen.</p>
                </div>
              </div>

              <div className="mt-5 -mx-1 overflow-x-auto">
                <table className="w-full min-w-[34rem] border-collapse text-left text-sm">
                  <thead>
                    <tr className="border-b border-stone-200">
                      {['Rolle', 'Adgang', 'Bemærkning'].map((header) => (
                        <th key={header} className="px-2 pb-2 text-xs font-bold uppercase tracking-wider text-stone-400">
                          {header}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-stone-100">
                    {roles.map((row) => (
                      <tr key={row.role} className="align-top">
                        <td className="px-2 py-3 font-semibold text-stone-900">{row.role}</td>
                        <td className="px-2 py-3 leading-relaxed text-stone-600">{row.access}</td>
                        <td className="px-2 py-3 leading-relaxed text-stone-600">{row.note}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <p className="mt-4 text-xs leading-relaxed text-stone-500">
                Hver administrativ handling efterlader et spor med hvem, hvad og hvornår. Emailadresser skrives maskeret i sporet, så det kan følges uden at brede adresser ud.
              </p>
            </div>
          </ScrollReveal>
        </div>

        <section className="border-y border-stone-200 bg-white">
          <div className="mx-auto max-w-5xl px-6 py-16">
            <ScrollReveal>
              <p className="text-xs font-bold uppercase tracking-wider text-amber-600">Dine kontroller</p>
              <h2 className="font-display mt-2 max-w-2xl text-3xl font-semibold leading-tight text-stone-900">
                Du skal ikke bede om lov
              </h2>
              <p className="mt-3 max-w-2xl text-sm leading-relaxed text-stone-600">
                Rettigheder, der kræver en supportsag og fjorten dages ventetid, er rettigheder på papiret. De vigtigste ligger derfor som knapper i appen.
              </p>
            </ScrollReveal>

            <div className="mt-8 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
              {controls.map((control, index) => {
                const Icon = control.icon;
                return (
                  <ScrollReveal key={control.title} delay={index * 70}>
                    <div className="h-full rounded-2xl border border-stone-200 bg-stone-50/70 p-5">
                      <div className={`flex h-10 w-10 items-center justify-center rounded-xl ${control.tint}`}>
                        <Icon className="h-5 w-5" strokeWidth={2.2} />
                      </div>
                      <p className="mt-4 text-sm font-bold text-stone-900">{control.title}</p>
                      <p className="mt-1.5 text-xs leading-relaxed text-stone-600">{control.detail}</p>
                    </div>
                  </ScrollReveal>
                );
              })}
            </div>

            <ScrollReveal delay={300} className="mt-5">
              <div className="flex items-start gap-3 rounded-2xl border border-rose-100 bg-rose-50/60 p-5">
                <Siren size={17} className="mt-0.5 shrink-0 text-rose-500" />
                <p className="text-xs leading-relaxed text-stone-600">
                  <strong className="font-semibold text-stone-900">Sletning kan ikke fortrydes.</strong> Vi gemmer ingen skyggekopi bagefter — det er hele pointen. Hent derfor dine data, <em>inden</em> du sletter kontoen.
                </p>
              </div>
            </ScrollReveal>
          </div>
        </section>

        <div className="mx-auto max-w-5xl px-6 py-16">
          <ScrollReveal>
            <p className="text-xs font-bold uppercase tracking-wider text-stone-500">Sådan arbejder vi</p>
            <h2 className="font-display mt-2 max-w-2xl text-3xl font-semibold leading-tight text-stone-900">
              Sikkerhed er vedligehold, ikke en milepæl
            </h2>
          </ScrollReveal>

          <div className="mt-8 grid grid-cols-1 gap-4 sm:grid-cols-2">
            {practices.map((practice, index) => {
              const Icon = practice.icon;
              return (
                <ScrollReveal key={practice.title} delay={index * 70}>
                  <div className="flex h-full items-start gap-4 rounded-2xl border border-stone-200 bg-white p-5 shadow-sm shadow-stone-900/5">
                    <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-stone-100 text-stone-600">
                      <Icon className="h-4.5 w-4.5" strokeWidth={2.2} />
                    </div>
                    <div>
                      <p className="text-sm font-bold text-stone-900">{practice.title}</p>
                      <p className="mt-1.5 text-sm leading-relaxed text-stone-600">{practice.detail}</p>
                    </div>
                  </div>
                </ScrollReveal>
              );
            })}
          </div>

          <ScrollReveal delay={300} className="mt-5">
            <div className="flex items-start gap-3 rounded-2xl border border-stone-200 bg-stone-50 p-5">
              <Server size={17} className="mt-0.5 shrink-0 text-stone-400" />
              <p className="text-xs leading-relaxed text-stone-600">
                <strong className="font-semibold text-stone-900">Vi lover ikke, at intet nogensinde går galt.</strong> Ingen kan det. Vi lover, at der er lag nok til, at én fejl ikke bliver til et brud — og at du får direkte besked, hvis noget alligevel rammer dine data.
              </p>
            </div>
          </ScrollReveal>
        </div>

        <section className="border-t border-stone-200 bg-white">
          <div className="mx-auto max-w-5xl px-6 py-16">
            <ScrollReveal>
              <div className="grid grid-cols-1 gap-8 rounded-2xl border border-stone-200 bg-[#16130F] p-8 lg:grid-cols-[1fr_320px] lg:items-center">
                <div>
                  <div className="inline-flex items-center gap-1.5 rounded-full border border-white/10 bg-white/10 px-3 py-1 text-xs font-semibold text-amber-100">
                    <Bug size={13} />
                    Fundet et hul?
                  </div>
                  <h2 className="font-display mt-5 text-2xl font-semibold leading-tight text-white sm:text-3xl">
                    Sig til, før nogen andre finder det
                  </h2>
                  <p className="mt-3 max-w-xl text-sm leading-relaxed text-stone-300">
                    Finder du en sårbarhed, vil vi hellere høre det fra dig end fra vores brugere. Skriv til os gennem supportformularen med kategorien <strong className="font-semibold text-white">Fejl</strong>, og beskriv hvad du fandt, og hvordan det kan genskabes.
                  </p>
                  <Link
                    href="/support?category=bug#support-form"
                    className="mt-6 inline-flex items-center gap-1.5 rounded-xl bg-white px-5 py-3 text-sm font-semibold text-stone-900 transition hover:bg-stone-100"
                  >
                    Rapportér en sårbarhed
                    <ArrowRight size={15} />
                  </Link>
                </div>

                <div className="rounded-2xl border border-white/10 bg-white/[0.06] p-5">
                  <p className="text-xs font-bold uppercase tracking-wider text-stone-400">Spillereglerne</p>
                  <ul className="mt-4 flex flex-col gap-3 text-[11px] leading-relaxed text-stone-300">
                    <li className="flex items-start gap-2.5">
                      <CircleCheck size={14} className="mt-0.5 shrink-0 text-emerald-300" />
                      Vi kvitterer for din henvendelse og holder dig opdateret, indtil forholdet er lukket.
                    </li>
                    <li className="flex items-start gap-2.5">
                      <CircleCheck size={14} className="mt-0.5 shrink-0 text-emerald-300" />
                      Vi retter ikke juridiske skridt mod dig, når du undersøger i god tro og følger reglerne her.
                    </li>
                    <li className="flex items-start gap-2.5">
                      <X size={14} className="mt-0.5 shrink-0 text-rose-300" />
                      Gå ikke i andres data, og lav ikke ændringer eller sletninger, du ikke selv ejer.
                    </li>
                    <li className="flex items-start gap-2.5">
                      <X size={14} className="mt-0.5 shrink-0 text-rose-300" />
                      Ingen belastningstest, spam eller angreb mod vores leverandører.
                    </li>
                  </ul>
                </div>
              </div>
            </ScrollReveal>
          </div>
        </section>

        <div className="mx-auto max-w-5xl px-6 pb-16">
          <ScrollReveal>
            <div className="flex flex-col gap-4 rounded-2xl border border-stone-200 bg-gradient-to-br from-emerald-50 via-stone-50 to-amber-50 p-6 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <p className="text-sm font-bold text-stone-900">Vil du have alle de juridiske detaljer?</p>
                <p className="mt-1 text-xs leading-relaxed text-stone-600">
                  Privatlivspolitikken beskriver præcis hvilke data vi behandler, på hvilket retsgrundlag, og hvor længe vi gemmer dem.
                </p>
              </div>
              <Link
                href="/privacy"
                className="inline-flex shrink-0 items-center justify-center gap-1.5 rounded-xl bg-stone-900 px-4 py-2.5 text-xs font-semibold text-white transition hover:bg-stone-800"
              >
                Læs privatlivspolitik
                <ArrowRight size={13} />
              </Link>
            </div>
          </ScrollReveal>
        </div>
      </main>
      <BackToTop />
      <PublicFooter />
    </>
  );
}
