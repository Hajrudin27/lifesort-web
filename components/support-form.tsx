'use client';

import { useState } from 'react';
import { Send, CheckCircle2, User, Mail, MessageSquare, FileText } from 'lucide-react';

export function SupportForm() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [subject, setSubject] = useState('');
  const [message, setMessage] = useState('');
  const [company, setCompany] = useState(''); // honeypot — real visitors never fill this in
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const canSubmit = name.trim().length > 0 && email.trim().length > 0 && subject.trim().length > 0 && message.trim().length > 0;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!canSubmit) return;
    setIsSubmitting(true);
    setError(null);

    try {
      const res = await fetch('/api/submit-ticket', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: name.trim(),
          email: email.trim(),
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
      <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-8 text-center">
        <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-emerald-100">
          <CheckCircle2 className="h-7 w-7 text-emerald-600" />
        </div>
        <h2 className="mt-4 text-lg font-bold text-stone-900">Tak for din besked!</h2>
        <p className="mt-1.5 text-sm text-stone-600">Vi har modtaget din henvendelse og svarer på {email} hurtigst muligt.</p>
      </div>
    );
  }

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

      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
        <div>
          <label className="flex items-center gap-1.5 text-xs font-semibold text-stone-500">
            <User size={12} /> Navn
          </label>
          <input value={name} onChange={(e) => setName(e.target.value)}
            className="mt-1.5 w-full rounded-xl border border-stone-200 px-3.5 py-2.5 text-sm outline-none transition focus:border-rose-400 focus:ring-4 focus:ring-rose-100"
            placeholder="Dit navn" />
        </div>
        <div>
          <label className="flex items-center gap-1.5 text-xs font-semibold text-stone-500">
            <Mail size={12} /> Email
          </label>
          <input type="email" value={email} onChange={(e) => setEmail(e.target.value)}
            className="mt-1.5 w-full rounded-xl border border-stone-200 px-3.5 py-2.5 text-sm outline-none transition focus:border-rose-400 focus:ring-4 focus:ring-rose-100"
            placeholder="din@email.dk" />
        </div>
      </div>
      <div>
        <label className="flex items-center gap-1.5 text-xs font-semibold text-stone-500">
          <FileText size={12} /> Emne
        </label>
        <input value={subject} onChange={(e) => setSubject(e.target.value)}
          className="mt-1.5 w-full rounded-xl border border-stone-200 px-3.5 py-2.5 text-sm outline-none transition focus:border-rose-400 focus:ring-4 focus:ring-rose-100"
          placeholder="Hvad drejer det sig om?" />
      </div>
      <div>
        <label className="flex items-center gap-1.5 text-xs font-semibold text-stone-500">
          <MessageSquare size={12} /> Besked
        </label>
        <textarea value={message} onChange={(e) => setMessage(e.target.value)} rows={5}
          className="mt-1.5 w-full rounded-xl border border-stone-200 px-3.5 py-2.5 text-sm outline-none transition focus:border-rose-400 focus:ring-4 focus:ring-rose-100"
          placeholder="Beskriv dit spørgsmål eller problem..." />
      </div>

      {error && <p className="text-sm font-medium text-red-600">{error}</p>}

      <button type="submit" disabled={!canSubmit || isSubmitting}
        className="flex items-center justify-center gap-2 rounded-xl bg-rose-600 px-4 py-3.5 text-sm font-semibold text-white transition hover:bg-rose-700 disabled:opacity-40">
        <Send size={15} />
        {isSubmitting ? 'Sender...' : 'Send besked'}
      </button>
    </form>
  );
}