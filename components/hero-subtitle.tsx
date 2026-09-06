'use client';

import { useEffect, useRef, useState } from 'react';

const variants = [
  'Alt det, der plejer at leve i ti forskellige apps og alt for mange noter — samlet i én, bygget til at gøre hverdagen lettere.',
  'Madplan der rammer dit budget, automatisk.',
  'Opgaver fordelt retfærdigt, uden at nogen skal huske det.',
  'Garantier og kvitteringer, der aldrig går tabt igen.',
];

/**
 * Sætningerne skifter kun, mens afsnittet faktisk er på skærmen.
 *
 * Intervallet kørte før videre for evigt. Varianterne er meget forskellige i længde — den
 * første fylder tre linjer, de øvrige én — så hvert skift ændrer afsnittets højde. Er man
 * scrollet forbi heroen, betyder det, at hele siden nedenunder rykker sig hvert fjerde
 * sekund, midt i det man er ved at læse. Animationen kunne altså ikke ses, men kunne
 * mærkes.
 *
 * Rotationen pauser derfor, når afsnittet forlader skærmen, og når fanen lægges i
 * baggrunden, og genoptages hvor den slap.
 */
export function HeroSubtitle() {
  const ref = useRef<HTMLParagraphElement>(null);
  const [index, setIndex] = useState(0);
  const [isFading, setIsFading] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    let rotateTimer: ReturnType<typeof setInterval> | undefined;
    let fadeTimer: ReturnType<typeof setTimeout> | undefined;
    let onScreen = false;

    const stop = () => {
      clearInterval(rotateTimer);
      clearTimeout(fadeTimer);
      rotateTimer = undefined;
      fadeTimer = undefined;
      // Uden denne kan teksten blive stående usynlig, hvis pausen rammer midt i en fade.
      setIsFading(false);
    };

    const start = () => {
      if (rotateTimer) return;
      rotateTimer = setInterval(() => {
        setIsFading(true);
        fadeTimer = setTimeout(() => {
          setIndex((prev) => (prev + 1) % variants.length);
          setIsFading(false);
        }, 400);
      }, 4000);
    };

    const sync = () => {
      if (onScreen && document.visibilityState === 'visible') start();
      else stop();
    };

    const observer = new IntersectionObserver(([entry]) => {
      onScreen = entry.isIntersecting;
      sync();
    });
    observer.observe(el);

    document.addEventListener('visibilitychange', sync);

    return () => {
      observer.disconnect();
      document.removeEventListener('visibilitychange', sync);
      stop();
    };
  }, []);

  return (
    <p
      ref={ref}
      className={`mx-auto mt-6 max-w-md text-lg text-stone-300 transition-opacity duration-[400ms] ease-in-out lg:mx-0 ${
        isFading ? 'opacity-0' : 'opacity-100'
      }`}
    >
      {variants[index]}
    </p>
  );
}
