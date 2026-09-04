'use client';

import { useEffect, useState } from 'react';

const variants = [
  'Alt det, der plejer at leve i ti forskellige apps og alt for mange noter — samlet i én, bygget til at gøre hverdagen lettere.',
  'Madplan der rammer dit budget, automatisk.',
  'Opgaver fordelt retfærdigt, uden at nogen skal huske det.',
  'Garantier og kvitteringer, der aldrig går tabt igen.',
];

export function HeroSubtitle() {
  const [index, setIndex] = useState(0);
  const [isVisible, setIsVisible] = useState(true);

  useEffect(() => {
    const interval = setInterval(() => {
      setIsVisible(false);
      setTimeout(() => {
        setIndex((prev) => (prev + 1) % variants.length);
        setIsVisible(true);
      }, 400);
    }, 4000);
    return () => clearInterval(interval);
  }, []);

  return (
    <p
      className={`mx-auto mt-6 max-w-md text-lg text-stone-300 transition-opacity duration-[400ms] ease-in-out lg:mx-0 ${
        isVisible ? 'opacity-100' : 'opacity-0'
      }`}
    >
      {variants[index]}
    </p>
  );
}