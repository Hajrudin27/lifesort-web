'use client';

import { useEffect, useState } from 'react';
import { Cookie } from 'lucide-react';

const STORAGE_KEY = 'lifesort-cookie-consent';

export function CookieBanner() {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const consent = window.localStorage.getItem(STORAGE_KEY);
    if (!consent) setIsVisible(true);
  }, []);

  const accept = () => {
    window.localStorage.setItem(STORAGE_KEY, 'accepted');
    setIsVisible(false);
  };

  if (!isVisible) return null;

  return (
    <div className="fixed inset-x-0 bottom-0 z-50 border-t border-stone-200 bg-white/95 backdrop-blur-sm">
      <div className="mx-auto flex max-w-5xl flex-col items-center gap-3 px-6 py-4 text-center sm:flex-row sm:text-left">
        <Cookie className="hidden h-5 w-5 shrink-0 text-stone-400 sm:block" />
        <p className="flex-1 text-xs text-stone-600">
          Vi bruger kun nødvendige cookies til login og sikkerhed. Ingen sporing eller markedsføring.
        </p>
        <button
          onClick={accept}
          className="shrink-0 rounded-xl bg-stone-900 px-4 py-2 text-xs font-semibold text-white transition hover:bg-stone-800"
        >
          Forstået
        </button>
      </div>
    </div>
  );
}

/**
 * Helper for future use: check this before loading any non-essential
 * script (analytics, ads, etc.). Right now the site only uses essential
 * auth cookies, so nothing is gated on it yet.
 */
export function hasCookieConsent() {
  if (typeof window === 'undefined') return false;
  return window.localStorage.getItem(STORAGE_KEY) === 'accepted';
}