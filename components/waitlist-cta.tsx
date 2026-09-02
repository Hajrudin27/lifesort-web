'use client';

import { useState } from 'react';
import { Apple, Smartphone, X, CheckCircle2 } from 'lucide-react';

type Platform = 'ios' | 'android';

export function WaitlistCta() {
  const [activePlatform, setActivePlatform] = useState<Platform | null>(null);
  const [email, setEmail] = useState('');
  const [company, setCompany] = useState(''); // honeypot — real visitors never fill this in
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const openModal = (platform: Platform) => {
    setActivePlatform(platform);
    setEmail('');
    setCompany('');
    setIsSubmitted(false);
    setError(null);
  };

  const closeModal = () => setActivePlatform(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activePlatform || email.trim().length === 0) return;
    setIsSubmitting(true);
    setError(null);

    try {
      const res = await fetch('/api/join-waitlist', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: email.trim(), platform: activePlatform, company }),
      });

      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        setError(body.error ?? 'Der gik noget galt. Prøv igen om lidt.');
        setIsSubmitting(false);
        return;
      }

      setIsSubmitted(true);
    } catch {
      setError('Der gik noget galt. Prøv igen om lidt.');
    }
    setIsSubmitting(false);
  };

  return (
    <>
      <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
        <button
          onClick={() => openModal('ios')}
          className="flex w-full items-center justify-center gap-2 rounded-xl bg-stone-900 px-6 py-3 text-sm font-semibold text-white transition hover:bg-stone-800 sm:w-auto"
        >
          <Apple size={16} />
          Hent til iOS
        </button>
        <button
          onClick={() => openModal('android')}
          className="flex w-full items-center justify-center gap-2 rounded-xl border border-stone-200 bg-white px-6 py-3 text-sm font-semibold text-stone-700 transition hover:bg-stone-50 sm:w-auto"
        >
          <Smartphone size={16} />
          Hent til Android
        </button>
      </div>

      {activePlatform && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-stone-900/40 backdrop-blur-sm" onClick={closeModal}>
         <div className="flex min-h-full items-center justify-center p-4">
          <div className="w-full max-w-sm rounded-2xl bg-white p-6 shadow-2xl" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-start justify-between gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-rose-500 to-rose-600">
                {activePlatform === 'ios' ? <Apple size={18} className="text-white" /> : <Smartphone size={18} className="text-white" />}
              </div>
              <button onClick={closeModal} className="text-stone-400 hover:text-stone-600">
                <X size={18} />
              </button>
            </div>

            {isSubmitted ? (
              <div className="mt-4 text-center">
                <CheckCircle2 className="mx-auto h-8 w-8 text-emerald-600" />
                <h2 className="mt-3 text-base font-bold text-stone-900">Du er på listen!</h2>
                <p className="mt-1 text-sm text-stone-600">Vi skriver til dig, så snart LifeSort er klar til {activePlatform === 'ios' ? 'iOS' : 'Android'}.</p>
              </div>
            ) : (
              <>
                <h2 className="mt-3 text-lg font-bold text-stone-900">LifeSort er på vej</h2>
                <p className="mt-1 text-sm text-stone-600">
                  Appen er ikke udgivet endnu. Skriv din email, så giver vi dig besked med det samme den lander på {activePlatform === 'ios' ? 'App Store' : 'Google Play'}.
                </p>

                <form onSubmit={handleSubmit} className="mt-4 flex flex-col gap-3">
                  <div className="absolute left-[-9999px] top-auto h-0 w-0 overflow-hidden" aria-hidden="true">
                    <label htmlFor="wl-company">Company</label>
                    <input
                      id="wl-company"
                      name="company"
                      type="text"
                      tabIndex={-1}
                      autoComplete="off"
                      value={company}
                      onChange={(e) => setCompany(e.target.value)}
                    />
                  </div>
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="din@email.dk"
                    className="w-full rounded-xl border border-stone-200 px-3 py-2 text-sm outline-none focus:border-rose-400 focus:ring-4 focus:ring-rose-100"
                    autoFocus
                  />
                  {error && <p className="text-sm font-medium text-red-600">{error}</p>}
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="rounded-xl bg-rose-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-rose-700 disabled:opacity-40"
                  >
                    {isSubmitting ? 'Tilmelder...' : 'Tilmeld venteliste'}
                  </button>
                </form>
              </>
            )}
          </div>
         </div>
        </div>
      )}
    </>
  );
}