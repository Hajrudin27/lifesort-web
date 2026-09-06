'use client';

import { useEffect, useRef, useState } from 'react';

export function ScrollReveal({
  children,
  className = '',
  delay = 0,
}: {
  children: React.ReactNode;
  className?: string;
  delay?: number;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    // Uden IntersectionObserver ville indholdet blive stående usynligt for evigt.
    // Så hellere springe animationen over end at skjule siden. queueMicrotask af
    // samme grund som i cookie-banneret: setState må ikke kaldes synkront her.
    if (typeof IntersectionObserver === 'undefined') {
      queueMicrotask(() => setIsVisible(true));
      return;
    }

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true);
          observer.unobserve(el);
        }
      },
      {
        /**
         * threshold var 0.15, altså "15% af elementet skal være synligt".
         *
         * Den andel kan et højt element aldrig nå: den maksimale synlige andel er
         * viewporthøjde / elementhøjde, så alt over ca. 6,7 gange viewporthøjden
         * udløser aldrig og bliver aldrig vist. FAQ-listen med 52 sammenklappede
         * spørgsmål er omkring 4400px — over grænsen på en 668px høj viewport, og
         * med god margin på mobil, hvor spørgsmålene ombrydes. Resultatet var en
         * side, der blev ved med at være tom, uanset hvor langt man scrollede.
         *
         * 0 betyder "så snart en enkelt pixel er inde", hvilket ikke kan afhænge af
         * elementets højde. rootMargin strækker rammen 120px ned under viewporten,
         * så indholdet er tonet ind, allerede når det når kanten af skærmen.
         */
        threshold: 0,
        rootMargin: '0px 0px 120px 0px',
      }
    );

    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  return (
    <div
      ref={ref}
      className={`transition-all duration-700 ease-out ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-6'} ${className}`}
      style={{ transitionDelay: `${delay}ms` }}
    >
      {children}
    </div>
  );
}
