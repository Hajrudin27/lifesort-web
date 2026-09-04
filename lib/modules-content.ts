import {
    Utensils, Wallet, Briefcase, HeartPulse, Repeat, Home as HomeIcon,
    Flag, CheckSquare, Plane, ShieldCheck, type LucideIcon,
  } from 'lucide-react';
  
  export type ModuleContent = {
    slug: string;
    icon: LucideIcon;
    title: string;
    tagline: string;
    tint: string;
    iconTint: string;
    description: string;
    highlights: string[];
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
    },
  ];
  
  export function getModule(slug: string) {
    return modules.find((m) => m.slug === slug);
  }