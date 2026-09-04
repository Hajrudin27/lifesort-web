import { ScrollReveal } from '@/components/scroll-reveal';

// Dette er STARTER-tekst, ikke jeres rigtige historie — jeg kan ikke opfinde
// jeres personlige baggrund for jer. Erstat teksten nedenfor med jeres egne ord:
// hvorfor I begyndte på LifeSort, hvad der frustrerede jer ved eksisterende apps,
// og hvad I håber, det bliver til. Et par ærlige sætninger slår altid en generisk
// "om os"-tekst.
export function FounderStory() {
  return (
    <section className="border-t border-stone-200 bg-white">
      <ScrollReveal className="mx-auto max-w-3xl px-6 py-20">
        <p className="text-center text-xs font-semibold uppercase tracking-widest text-rose-500">Hvorfor LifeSort</p>
        <h2 className="mt-3 text-center font-display text-3xl font-semibold text-stone-900">
          Bygget af to, der var trætte af ti apps
        </h2>

        <div className="mt-10 flex flex-col items-center gap-6 sm:flex-row sm:items-start">
          <div className="flex shrink-0 -space-x-3">
            <div className="flex h-14 w-14 items-center justify-center rounded-full border-4 border-white bg-gradient-to-br from-sky-400 to-sky-600 text-lg font-bold text-white shadow-sm">
              H
            </div>
            <div className="flex h-14 w-14 items-center justify-center rounded-full border-4 border-white bg-gradient-to-br from-violet-400 to-violet-600 text-lg font-bold text-white shadow-sm">
              W
            </div>
          </div>
          <div className="text-center sm:text-left">
            <p className="text-sm leading-relaxed text-stone-600">
              {/* TODO: erstat med jeres egen historie */}
              Vi begyndte på LifeSort, fordi vores egen hverdag var spredt ud over alt for mange apps —
              én til madplan, én til økonomi, én til huskesedler. Ingen af dem talte sammen, og vi endte
              altid med at holde styr på det hele i hovedet alligevel.
            </p>
            <p className="mt-3 text-sm leading-relaxed text-stone-600">
              {/* TODO: erstat med jeres egen historie */}
              Så vi byggede den app, vi selv ledte efter — ét sted, der rent faktisk hænger sammen.
              LifeSort er stadig i gang med at blive født, og vi bygger den åbent, modul for modul.
            </p>
            <p className="mt-4 text-sm font-semibold text-stone-900">Hajrudin &amp; Walid</p>
          </div>
        </div>
      </ScrollReveal>
    </section>
  );
}