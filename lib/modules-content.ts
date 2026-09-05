import {
  Utensils, Wallet, Briefcase, HeartPulse, Repeat, Home as HomeIcon,
  Flag, CheckSquare, Plane, ShieldCheck, type LucideIcon,
} from 'lucide-react';

export type ModuleStep = { title: string; description: string };
export type PreviewLine = { label: string; value: string };

export type ModuleContent = {
  slug: string;
  icon: LucideIcon;
  title: string;
  tagline: string;
  tint: string;
  iconTint: string;
  description: string;
  highlights: string[];
  steps: ModuleStep[];
  before: string[];
  after: string[];
  previewLines: PreviewLine[];
  previewBar?: number;
};

export const modules: ModuleContent[] = [
  {
    slug: 'madplan',
    icon: Utensils,
    title: 'Madplan & indkøb',
    tagline: 'En ugentlig madplan, der rammer dit budget',
    tint: 'bg-amber-100 text-amber-600',
    iconTint: 'from-amber-500 to-amber-600',
    description:
      'LifeSort sammensætter en ugentlig madplan ud fra dit budget, aktuelle tilbud i dine butikker og en opskriftssamling — så du ikke selv skal regne på, om ugens mad kan holdes inden for det, du har sat af.',
    highlights: [
      'Automatisk plan for hele ugen, tilpasset dit budget',
      'Bruger aktuelle tilbud fra dine valgte butikker først',
      'Genererer en indkøbsliste sorteret efter butik',
      'Byt enkelte måltider ud, uden at hele planen skal regnes om',
    ],
    steps: [
      { title: 'Sæt dit budget', description: 'Fortæl LifeSort, hvad ugens mad må koste, og hvilke butikker du handler i.' },
      { title: 'Vi finder tilbud og opskrifter', description: 'Algoritmen matcher aktuelle tilbud med opskriftssamlingen, og prioriterer det billigste først.' },
      { title: 'Du får en plan og en liste', description: 'En færdig plan for ugen, plus en indkøbsliste sorteret efter butik — klar til at handle efter.' },
    ],
    before: [
      'Et Excel-ark med sidste uges tilbudsaviser',
      'Opskrifter gemt i browser-bogmærker, sjældent åbnet',
      'Indkøbslisten skrevet i farten, lige inden man går ud ad døren',
    ],
    after: [
      'Automatisk plan, der matcher ugens tilbud',
      'Opskriftssamling der altid er lige ved hånden',
      'Færdig indkøbsliste, sorteret efter butik',
    ],
    previewLines: [
      { label: 'I dag', value: 'Kylling i karry' },
      { label: 'Ugens budget brugt', value: '420/600 kr.' },
    ],
    previewBar: 70,
  },
  {
    slug: 'oekonomi',
    icon: Wallet,
    title: 'Økonomi',
    tagline: 'Udgifter, opsparing og indkomst — samlet ét sted',
    tint: 'bg-emerald-100 text-emerald-600',
    iconTint: 'from-emerald-500 to-emerald-600',
    description:
      'Hold styr på faste og tilbagevendende udgifter, sæt budgetter pr. kategori, og følg opsparingsmål — uden at skulle holde styr på det i et separat regneark.',
    highlights: [
      'Tilbagevendende udgifter oprettes én gang, dukker op hver måned',
      'Kategori-budgetter med besked, hvis du er ved at ramme loftet',
      'Opsparingsmål med fremdrift, du kan følge over tid',
      'Vedhæft foto af kvitteringer direkte til den enkelte udgift',
    ],
    steps: [
      { title: 'Opret dine udgifter', description: 'Faste og tilbagevendende udgifter oprettes én gang og dukker automatisk op hver måned.' },
      { title: 'Sæt kategori-budgetter', description: 'Fastsæt et loft pr. kategori, og få besked, hvis du er ved at ramme det.' },
      { title: 'Følg din opsparing', description: 'Se fremdriften på dine opsparingsmål, og hold styr på det hele fra ét overblik.' },
    ],
    before: [
      'Et regneark der ikke er opdateret siden sidste måned',
      'Kvitteringer i en skuffe, ingen ved hvor',
      'Opsparingsmål der kun findes i hovedet',
    ],
    after: [
      'Tilbagevendende udgifter der styrer sig selv',
      'Kvitteringsfoto gemt sammen med hver udgift',
      'Opsparingsmål med synlig fremdrift',
    ],
    previewLines: [{ label: 'Budget denne måned', value: '68% brugt' }],
    previewBar: 68,
  },
  {
    slug: 'karriere',
    icon: Briefcase,
    title: 'Karriere',
    tagline: 'Hold styr på din jobsøgning, ét sted',
    tint: 'bg-violet-100 text-violet-600',
    iconTint: 'from-violet-500 to-violet-600',
    description:
      'Saml jobansøgninger, CV og kompetencer, så du altid ved, hvor du søgte hvad, og hvornår du sidst hørte noget.',
    highlights: [
      'Overblik over aktive ansøgninger og deres status',
      'Kompetenceoversigt, du kan holde opdateret løbende',
      'Noter og opfølgningsdatoer pr. ansøgning',
    ],
    steps: [
      { title: 'Opret en ansøgning', description: 'Registrér stilling, virksomhed og dato, så snart du har sendt en ansøgning.' },
      { title: 'Følg status', description: 'Opdatér status, når du hører noget — samtale booket, afslag, eller tilbud.' },
      { title: 'Se det hele samlet', description: 'Ét overblik over alle aktive ansøgninger, i stedet for spredte emails og noter.' },
    ],
    before: [
      'Ansøgninger sendt fra tre forskellige emails',
      'Ingen anelse om, hvornår man sidst hørte fra hvem',
      'CV\'et findes i fem forskellige versioner',
    ],
    after: [
      'Ét samlet overblik over alle ansøgninger',
      'Status og opfølgningsdato pr. ansøgning',
      'Kompetenceoversigt der holdes opdateret ét sted',
    ],
    previewLines: [
      { label: 'Aktive ansøgninger', value: '3' },
      { label: 'Seneste', value: 'Frontend-udvikler — afventer svar' },
    ],
  },
  {
    slug: 'cyklus',
    icon: HeartPulse,
    title: 'Cyklus',
    tagline: 'Følg din cyklus privat og sikkert',
    tint: 'bg-rose-100 text-rose-600',
    iconTint: 'from-rose-500 to-rose-600',
    description:
      'Registrér cyklus og symptomer, og få indsigt i dine egne mønstre over tid — samt et opslagsværk om almindelige tilstande og symptomer, hvis du vil vide mere.',
    highlights: [
      'Forudsigelse af næste cyklus baseret på din egen historik',
      'Symptom-log der viser mønstre over flere måneder',
      'Indbygget opslagsværk om cyklus-relaterede tilstande',
      'Data forbliver private — kun du kan se dem',
    ],
    steps: [
      { title: 'Registrér din cyklus', description: 'Log start, slut og symptomer i det tempo, der passer dig.' },
      { title: 'Se dine egne mønstre', description: 'LifeSort viser mønstre over tid, baseret udelukkende på din egen historik.' },
      { title: 'Slå op, hvis du er i tvivl', description: 'Et indbygget opslagsværk om tilstande og symptomer, lige ved hånden.' },
    ],
    before: [
      'En kalender-app der ikke er bygget til formålet',
      'Symptomer man glemmer at skrive ned',
      'Google-søgninger sent om aftenen for at forstå noget',
    ],
    after: [
      'Cyklus og symptomer samlet ét sted',
      'Mønstre der bliver tydeligere, jo længere du bruger det',
      'Et roligt opslagsværk, når du vil vide mere',
    ],
    previewLines: [
      { label: 'Cyklusdag', value: '14' },
      { label: 'Fase', value: 'Normal' },
    ],
  },
  {
    slug: 'vaner',
    icon: Repeat,
    title: 'Vaner',
    tagline: 'Byg vaner, der rent faktisk holder',
    tint: 'bg-sky-100 text-sky-600',
    iconTint: 'from-sky-500 to-sky-600',
    description:
      'Sæt de vaner op, du gerne vil bygge eller bryde, og følg din streak dag for dag — den slags lille, synlig fremdrift, der gør det lettere at blive ved.',
    highlights: [
      'Daglig afkrydsning med løbende streak-tælling',
      'Både vaner du vil opbygge, og dem du vil aflægge',
      'Enkelt overblik over, hvor du står lige nu',
    ],
    steps: [
      { title: 'Opret en vane', description: 'Vælg om du vil opbygge noget nyt, eller aflægge noget gammelt.' },
      { title: 'Kryds af hver dag', description: 'Én daglig handling — LifeSort holder styr på streaken for dig.' },
      { title: 'Se din fremgang', description: 'En synlig streak gør det lettere at blive ved, dag efter dag.' },
    ],
    before: [
      'Gode intentioner, ingen måde at følge dem på',
      'En vane-app, man glemmer findes efter en uge',
      'Ingen synlig fremdrift, så motivationen daler',
    ],
    after: [
      'Vaner sat op på under et minut',
      'Streak der gør det synligt, at det virker',
      'Både opbygning og aflæggelse i samme overblik',
    ],
    previewLines: [{ label: 'Læs 10 minutter', value: '🔥 12 dage i træk' }],
  },
  {
    slug: 'hjemmet',
    icon: HomeIcon,
    title: 'Hjemmet',
    tagline: 'Rengøring, vedligehold og indkøb — fordelt retfærdigt',
    tint: 'bg-teal-100 text-teal-600',
    iconTint: 'from-teal-500 to-teal-600',
    description:
      'Hold styr på tilbagevendende rengørings- og vedligeholdelsesopgaver, en delt indkøbsliste, og fordel opgaverne mellem jer to — med automatisk rotation, hvis I vil have skiftevis tur.',
    highlights: [
      'Opgaver kan tildeles og roterer automatisk mellem to personer',
      'Delt indkøbsliste, alle kan krydse af på',
      'Tjekliste til flytning, med de typiske ting man glemmer',
    ],
    steps: [
      { title: 'Opret jeres opgaver', description: 'Tilbagevendende rengørings- og vedligeholdelsesopgaver, oprettet én gang.' },
      { title: 'Fordel eller rotér', description: 'Tildel en fast person, eller lad opgaven skifte automatisk, hver gang den markeres som færdig.' },
      { title: 'Ingen tvivl om hvis tur det er', description: 'Begge kan altid se, hvem der har opgaven lige nu.' },
    ],
    before: [
      'Uenighed om, hvis tur det egentlig var',
      'En indkøbsliste på en seddel, den ene aldrig ser',
      'Ting der bare ikke bliver gjort, fordi ingen ejer det',
    ],
    after: [
      'Opgaver der roterer automatisk mellem jer',
      'Delt indkøbsliste, begge kan opdatere',
      'Altid klart, hvis tur det er',
    ],
    previewLines: [{ label: 'Denne uges opgave', value: 'Støvsuge — Walids tur' }],
  },
  {
    slug: 'livsmaal',
    icon: Flag,
    title: 'Livsmål',
    tagline: 'De større mål, ikke bare dagens huskeliste',
    tint: 'bg-indigo-100 text-indigo-600',
    iconTint: 'from-indigo-500 to-indigo-600',
    description:
      'Sæt de mål, der rækker længere end en uge, bryd dem ned i delmål, og følg fremdriften — så de ikke drukner i alt det andet.',
    highlights: [
      'Store mål brudt ned i konkrete delmål',
      'Visuel fremdrift, du kan følge over tid',
      'Adskilt fra den daglige huskeliste, så det ikke drukner',
    ],
    steps: [
      { title: 'Sæt et mål', description: 'Det store, der rækker længere end en uge eller to.' },
      { title: 'Bryd det ned', description: 'Del målet op i konkrete delmål, du reelt kan handle på.' },
      { title: 'Følg fremdriften', description: 'Se hvor langt du er, uden at målet drukner i dagens huskeliste.' },
    ],
    before: [
      'Store mål der lever kun som en tanke',
      'Ingen måde at se, om man rykker sig',
      'Drukner i den daglige huskeliste',
    ],
    after: [
      'Mål brudt ned i konkrete delmål',
      'Synlig fremdrift over tid',
      'Sit eget rum, adskilt fra dagens gøremål',
    ],
    previewLines: [{ label: 'Spar op til rejse', value: '72% i mål' }],
    previewBar: 72,
  },
  {
    slug: 'goeremaal',
    icon: CheckSquare,
    title: 'Gøremål',
    tagline: 'Den daglige huskeliste, med prioritet og deadline',
    tint: 'bg-orange-100 text-orange-600',
    iconTint: 'from-orange-500 to-orange-600',
    description:
      'Almindelige gøremål med prioritet og forfaldsdato — den slags, der ellers lever i en note-app eller på en seddel på køleskabet.',
    highlights: [
      'Prioritet og forfaldsdato på hvert gøremål',
      'Se kun det aktive, eller tjek det du allerede har klaret',
      'Findes på tværs af hele appen via global søgning',
    ],
    steps: [
      { title: 'Skriv det ned', description: 'Et gøremål, med prioritet og en forfaldsdato, hvis det haster.' },
      { title: 'Se kun det aktive', description: 'De vigtigste ting øverst, resten samlet nedenunder.' },
      { title: 'Kryds af og se historikken', description: 'Færdige gøremål forsvinder ikke — du kan altid se, hvad du har klaret.' },
    ],
    before: [
      'Post-its der falder af køleskabet',
      'En note-app fyldt med gamle, glemte punkter',
      'Ingen prioritet — alt ser lige vigtigt ud',
    ],
    after: [
      'Ét sted, med prioritet og deadline',
      'Kun det aktive vist, resten gemt væk',
      'Søgbart på tværs af hele appen',
    ],
    previewLines: [{ label: 'I dag', value: '2 af 5 gøremål klaret' }],
    previewBar: 40,
  },
  {
    slug: 'rejser',
    icon: Plane,
    title: 'Rejser',
    tagline: 'Planlægning og pakkelister, samlet pr. tur',
    tint: 'bg-cyan-100 text-cyan-600',
    iconTint: 'from-cyan-500 to-cyan-600',
    description:
      'Hold styr på kommende rejser med pakkelister og de praktiske detaljer, i stedet for at det spredes ud over noter og screenshots.',
    highlights: [
      'Én oversigt pr. rejse, med dato og pakkeliste',
      'Automatisk påmindelse om at pakke, før turen starter',
    ],
    steps: [
      { title: 'Opret rejsen', description: 'Dato og destination — resten bygger du på løbende.' },
      { title: 'Lav pakkelisten', description: 'Krydses af, efterhånden som tingene ryger i kufferten.' },
      { title: 'Få en påmindelse', description: 'En pakke-påmindelse i god tid, før turen starter.' },
    ],
    before: [
      'Pakkelister i noter, screenshots og hovedet',
      'Man opdager for sent, at man har glemt noget',
      'Ingen samlet oversigt over kommende rejser',
    ],
    after: [
      'Én oversigt pr. rejse',
      'Pakkeliste der krydses af undervejs',
      'Automatisk påmindelse i god tid',
    ],
    previewLines: [
      { label: 'Næste rejse', value: 'Om 12 dage' },
      { label: 'Pakkeliste', value: '6/10 pakket' },
    ],
  },
  {
    slug: 'garantier',
    icon: ShieldCheck,
    title: 'Garantier',
    tagline: 'Kvitteringer og garantibeviser, aldrig væk igen',
    tint: 'bg-fuchsia-100 text-fuchsia-600',
    iconTint: 'from-fuchsia-500 to-fuchsia-600',
    description:
      'Fotografér kvitteringer og garantibeviser direkte i appen, og få en påmindelse i god tid, før garantien udløber — i stedet for en skuffe fuld af papir.',
    highlights: [
      'Foto af kvittering/garantibevis gemt sammen med produktet',
      'Automatisk påmindelse før udløb',
      'Ét sted at slå op, når noget går i stykker',
    ],
    steps: [
      { title: 'Fotografér kvitteringen', description: 'Direkte i appen, i samme øjeblik du køber noget.' },
      { title: 'LifeSort holder styr på datoen', description: 'Ingen grund til selv at huske, hvornår garantien udløber.' },
      { title: 'Slå op, når du har brug for det', description: 'Ét sted at finde beviset, den dag noget går i stykker.' },
    ],
    before: [
      'En skuffe fuld af kvitteringer, ingen kan finde igen',
      'Garantier der udløber, uden man opdager det',
      'Ingen anelse om, hvor beviset egentlig er',
    ],
    after: [
      'Foto af kvitteringen, gemt med det samme',
      'Automatisk påmindelse før udløb',
      'Ét sted at slå op, når uheldet er ude',
    ],
    previewLines: [
      { label: 'Næste udløb', value: 'Om 45 dage' },
      { label: 'Produkt', value: 'Vaskemaskine' },
    ],
  },
];

export function getModule(slug: string) {
  return modules.find((m) => m.slug === slug);
}

export function getAdjacentModules(slug: string) {
  const index = modules.findIndex((m) => m.slug === slug);
  const prev = index > 0 ? modules[index - 1] : modules[modules.length - 1];
  const next = index < modules.length - 1 ? modules[index + 1] : modules[0];
  return { prev, next, position: index + 1, total: modules.length };
}

// Delt med FAQ-siden — samme spørgsmål/svar, nu med en valgfri tag til det modul,
// spørgsmålet hører til, så modul-siderne kan vise de relevante 1-2 spørgsmål.
export type FaqCategory = 'generelt' | 'moduler' | 'konto' | 'venteliste';

export type FaqEntry = {
  category: FaqCategory;
  question: string;
  answer: string;
  moduleSlug?: string;
};

export const faqs: FaqEntry[] = [
  {
    category: 'generelt',
    question: 'Hvad er LifeSort?',
    answer:
      'LifeSort er en app, der samler ti dele af hverdagen — madplan, økonomi, karriere, cyklus, vaner, hjemmet, livsmål, gøremål, rejser og garantier — i ét sted, så du slipper for at bruge en app til hver ting.',
  },
  {
    category: 'generelt',
    question: 'Hvilke platforme understøttes?',
    answer: 'LifeSort er bygget til både iOS og Android, med samme funktioner på begge platforme.',
  },
  {
    category: 'generelt',
    question: 'Kan jeg bruge appen på flere sprog?',
    answer: 'Ja, LifeSort understøtter både dansk og engelsk. Du kan skifte sprog under Indstillinger i appen.',
  },
  {
    category: 'generelt',
    question: 'Koster LifeSort noget?',
    answer: 'Prismodellen er endnu ikke endeligt fastlagt. Vi opdaterer denne side, så snart den er på plads.',
  },
  {
    category: 'moduler',
    question: 'Hvordan virker madplan-modulet?',
    answer:
      'Du sætter et ugentligt budget og vælger dine faste butikker — LifeSort sammensætter så automatisk en plan for ugen ud fra aktuelle tilbud og en opskriftssamling, og genererer en indkøbsliste sorteret efter butik.',
    moduleSlug: 'madplan',
  },
  {
    category: 'moduler',
    question: 'Kan jeg dele huslige opgaver med min partner?',
    answer:
      'Ja — i Hjemmet-modulet kan opgaver tildeles skiftevis mellem to personer, med automatisk rotation, hver gang en opgave markeres som færdig, hvis I ønsker det.',
    moduleSlug: 'hjemmet',
  },
  {
    category: 'moduler',
    question: 'Er mine cyklus-data private?',
    answer: 'Ja. Cyklus- og symptomdata er knyttet til din personlige konto og er aldrig synlige for andre — heller ikke os.',
    moduleSlug: 'cyklus',
  },
  {
    category: 'moduler',
    question: 'Kan jeg vedhæfte kvitteringer og garantibeviser?',
    answer:
      'Ja, både i Økonomi- og Garanti-modulet kan du fotografere kvitteringer direkte i appen og få en påmindelse, før en garanti udløber.',
    moduleSlug: 'garantier',
  },
  {
    category: 'konto',
    question: 'Er mine data sikre?',
    answer: 'Ja. Dine data er knyttet til din personlige konto og er ikke tilgængelige for andre brugere.',
  },
  {
    category: 'konto',
    question: 'Kan jeg eksportere mine egne data?',
    answer:
      'Ja — under Indstillinger i appen kan du downloade alle dine egne data som én fil, når som helst du ønsker det.',
  },
  {
    category: 'konto',
    question: 'Hvordan sletter jeg min konto?',
    answer: 'Skriv til os via supportformularen nedenfor, så hjælper vi dig med at slette din konto og alle tilknyttede data.',
  },
  {
    category: 'venteliste',
    question: 'Hvad sker der, når jeg tilmelder mig ventelisten?',
    answer:
      'Du modtager en bekræftelses-email med det samme. Når du har bekræftet, er du officielt på listen, og vi skriver til dig igen, den dag appen er klar til din platform.',
  },
  {
    category: 'venteliste',
    question: 'Hvornår lancerer LifeSort?',
    answer: 'Vi bygger appen åbent, modul for modul, og har endnu ikke en fast lanceringsdato — ventelisten er den bedste måde at få besked først.',
  },
  {
    category: 'venteliste',
    question: 'Jeg fik ikke en bekræftelses-email — hvad gør jeg?',
    answer: 'Tjek lige dit spam-filter først. Kommer den stadig ikke frem efter et par minutter, så skriv til os via supportformularen, så undersøger vi det.',
  },
];
