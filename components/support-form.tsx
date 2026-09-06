'use client';

import { useEffect, useState } from 'react';
import {
  Bug,
  CheckCircle2,
  CreditCard,
  FileText,
  Lightbulb,
  MessageSquare,
  Send,
  User,
  UserCircle,
  Mail,
  ShieldCheck,
} from 'lucide-react';
import { FIELD_LIMITS } from '@/lib/validation';

type SupportCategory = 'general' | 'bug' | 'billing' | 'feature' | 'account';

const CATEGORY_VALUES: SupportCategory[] = ['general', 'bug', 'billing', 'feature', 'account'];

const CATEGORY_OPTIONS: {
  value: SupportCategory;
  label: string;
  hint: string;
  placeholder: string;
  icon: typeof MessageSquare;
}[] = [
  {
    value: 'general',
    label: 'Generelt',
    hint: 'Spørgsmål og feedback',
    placeholder: 'Beskriv dit spørgsmål eller din feedback...',
    icon: MessageSquare,
  },
  {
    value: 'bug',
    label: 'Fejl',
    hint: 'Noget virker ikke',
    placeholder: 'Beskriv hvad der skete, og hvilken enhed eller browser du brugte...',
    icon: Bug,
  },
  {
    value: 'billing',
    label: 'Betaling',
    hint: 'Pris, abonnement eller kvittering',
    placeholder: 'Beskriv hvad betalingen handler om...',
    icon: CreditCard,
  },
  {
    value: 'feature',
    label: 'Feature',
    hint: 'Ideer til LifeSort',
    placeholder: 'Fortæl hvilken funktion du savner, og hvordan den ville hjælpe...',
    icon: Lightbulb,
  },
  {
    value: 'account',
    label: 'Konto',
    hint: 'Login, adgang eller data',
    placeholder: 'Beskriv hvad du har brug for hjælp til på din konto...',
    icon: UserCircle,
  },
];

function isSupportCategory(value: string | null): value is SupportCategory {
  return CATEGORY_VALUES.includes(value as SupportCategory);
}

function defaultPriority(category: SupportCategory, isUrgent: boolean) {
  if (isUrgent) return 'urgent';
  if (category === 'bug' || category === 'billing') return 'high';
  return 'normal';
}

export function SupportForm() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [category, setCategory] = useState<SupportCategory | null>(null);
  const [subject, setSubject] = useState('');
  const [message, setMessage] = useState('');
  const [isUrgent, setIsUrgent] = useState(false);
  const [company, setCompany] = useState(''); // honeypot — real visitors never fill this in
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const selectedCategory = CATEGORY_OPTIONS.find((option) => option.value === category) ?? null;
  const canSubmit = Boolean(category) && name.trim().length > 0 && email.trim().length > 0 && subject.trim().length > 0 && message.trim().length > 0;

  useEffect(() => {
    queueMicrotask(() => {
      const requestedCategory = new URLSearchParams(window.location.search).get('category');
      if (isSupportCategory(requestedCategory)) setCategory(requestedCategory);
    });
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!canSubmit || !category) return;
    setIsSubmitting(true);
    setError(null);

    try {
      const res = await fetch('/api/submit-ticket', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: name.trim(),
          email: email.trim(),
          category,
          priority: defaultPriority(category, isUrgent),
          subject: subject.trim(),
          message: message.trim(),
          company,
        }),
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

  if (isSubmitted) {
    return (
      <div className="rounded-2xl border border-emerald-200 bg-gradient-to-br from-emerald-50 to-white p-8 text-center shadow-sm shadow-emerald-900/5">
        <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-emerald-100">
          <CheckCircle2 className="h-7 w-7 text-emerald-600" />
        </div>
        <h2 className="mt-4 text-lg font-bold text-stone-900">Tak for din besked!</h2>
        <p className="mx-auto mt-1.5 max-w-sm text-sm leading-relaxed text-stone-600">
          Vi har modtaget din henvendelse og svarer på {email} hurtigst muligt.
        </p>
      </div>
    );
  }

  if (!selectedCategory) {
    return (
      <div className="rounded-3xl border border-dashed border-stone-300 bg-white p-8 text-center shadow-sm shadow-stone-900/5">
        <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-rose-50 text-rose-600">
          <MessageSquare className="h-6 w-6" strokeWidth={2.2} />
        </div>
        <h2 className="mt-4 text-xl font-bold text-stone-900">Vælg en kategori først</h2>
        <p className="mx-auto mt-2 max-w-sm text-sm leading-relaxed text-stone-500">
          Start med en af boksene ovenfor, så tilpasser formularen sig automatisk til din henvendelse.
        </p>
      </div>
    );
  }
  const SelectedCategoryIcon = selectedCategory.icon;

  return (
    <form onSubmit={handleSubmit} className="relative flex flex-col gap-5 rounded-3xl border border-stone-200 bg-white p-6 shadow-sm shadow-stone-900/5 sm:p-8">
      {/* Honeypot field: hidden from real users via CSS, but visible to most bots that fill in every field. */}
      <div className="absolute left-[-9999px] top-auto h-0 w-0 overflow-hidden" aria-hidden="true">
        <label htmlFor="company">Company</label>
        <input
          id="company"
          name="company"
          type="text"
          tabIndex={-1}
          autoComplete="off"
          value={company}
          onChange={(e) => setCompany(e.target.value)}
        />
      </div>

      <div>
        <p className="text-xs font-bold uppercase tracking-wider text-rose-500">Kontakt teamet</p>
        <h2 className="mt-2 text-2xl font-bold text-stone-900">Send en besked</h2>
        <div className="mt-3 flex flex-wrap items-center gap-2">
          <span className="inline-flex items-center gap-2 rounded-full bg-rose-50 px-3 py-1.5 text-xs font-semibold text-rose-700">
            <SelectedCategoryIcon size={13} />
            {selectedCategory.label}
          </span>
          <a href="#support-topics" className="text-xs font-semibold text-stone-500 transition hover:text-stone-900">
            Skift kategori
          </a>
        </div>
        <p className="mt-3 text-sm leading-relaxed text-stone-500">Jo mere konkret du er, jo hurtigere kan vi hjælpe.</p>
      </div>

      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
        <div>
          <label className="flex items-center gap-1.5 text-xs font-semibold text-stone-500">
            <User size={12} /> Navn
          </label>
          <input value={name} onChange={(e) => setName(e.target.value)} maxLength={FIELD_LIMITS.name}
            className="mt-1.5 w-full rounded-xl border border-stone-200 px-3.5 py-2.5 text-sm outline-none transition focus:border-rose-400 focus:ring-4 focus:ring-rose-100"
            placeholder="Dit navn" />
        </div>
        <div>
          <label className="flex items-center gap-1.5 text-xs font-semibold text-stone-500">
            <Mail size={12} /> Email
          </label>
          <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} maxLength={FIELD_LIMITS.email}
            className="mt-1.5 w-full rounded-xl border border-stone-200 px-3.5 py-2.5 text-sm outline-none transition focus:border-rose-400 focus:ring-4 focus:ring-rose-100"
            placeholder="din@email.dk" />
        </div>
      </div>

      <div>
        <label className="flex items-center gap-1.5 text-xs font-semibold text-stone-500">
          <FileText size={12} /> Emne
        </label>
        <input value={subject} onChange={(e) => setSubject(e.target.value)} maxLength={FIELD_LIMITS.subject}
          className="mt-1.5 w-full rounded-xl border border-stone-200 px-3.5 py-2.5 text-sm outline-none transition focus:border-rose-400 focus:ring-4 focus:ring-rose-100"
          placeholder="Hvad drejer det sig om?" />
      </div>
      <div>
        <div className="flex items-center justify-between gap-3">
          <label className="flex items-center gap-1.5 text-xs font-semibold text-stone-500">
            <MessageSquare size={12} /> Besked
          </label>
          <label className="flex items-center gap-1.5 text-xs font-semibold text-stone-500">
            <input
              type="checkbox"
              checked={isUrgent}
              onChange={(e) => setIsUrgent(e.target.checked)}
              className="h-3.5 w-3.5 rounded border-stone-300 text-rose-600 focus:ring-rose-500"
            />
            Haster
          </label>
        </div>
        <textarea value={message} onChange={(e) => setMessage(e.target.value)} rows={6} maxLength={FIELD_LIMITS.message}
          className="mt-1.5 w-full rounded-xl border border-stone-200 px-3.5 py-2.5 text-sm outline-none transition focus:border-rose-400 focus:ring-4 focus:ring-rose-100"
          placeholder={selectedCategory.placeholder} />
        <p className="mt-1.5 text-right text-[11px] font-medium text-stone-400">
          {message.length}/{FIELD_LIMITS.message}
        </p>
      </div>

      {error && <p className="text-sm font-medium text-red-600">{error}</p>}

      <div className="flex items-start gap-2 rounded-xl border border-stone-200 bg-stone-50 px-3.5 py-3 text-xs leading-relaxed text-stone-600">
        <ShieldCheck className="mt-0.5 h-4 w-4 shrink-0 text-stone-400" />
        <p>Vi bruger kun oplysningerne til at behandle din henvendelse og svarer på den email, du skriver her.</p>
      </div>

      <button type="submit" disabled={!canSubmit || isSubmitting}
        className="flex items-center justify-center gap-2 rounded-xl bg-rose-600 px-4 py-3.5 text-sm font-semibold text-white shadow-sm shadow-rose-900/15 transition hover:bg-rose-700 disabled:opacity-40">
        <Send size={15} />
        {isSubmitting ? 'Sender...' : 'Send besked'}
      </button>
    </form>
  );
}
