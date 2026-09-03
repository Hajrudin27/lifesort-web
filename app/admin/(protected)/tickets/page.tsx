'use client';

import { useEffect, useState, useCallback } from 'react';
import { Inbox, Search, Mail, Clock, Archive, Send, RotateCw } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import { useToast } from '@/components/toast-provider';
import { logActivity } from '@/lib/activity-log';
import { useAdminUser } from '@/components/admin-user-context';

type TicketStatus = 'open' | 'answered' | 'closed';

type TicketRow = {
  id: string;
  name: string;
  email: string;
  subject: string;
  message: string;
  status: TicketStatus;
  admin_reply: string | null;
  replied_at: string | null;
  created_at: string;
};

const PAGE_SIZE = 20;

const STATUS_LABEL: Record<TicketStatus, string> = {
  open: 'Åben',
  answered: 'Besvaret',
  closed: 'Lukket',
};

const STATUS_STYLE: Record<TicketStatus, string> = {
  open: 'bg-amber-100 text-amber-700',
  answered: 'bg-emerald-100 text-emerald-700',
  closed: 'bg-stone-200 text-stone-600',
};

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString('da-DK', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' });
}

export default function TicketsPage() {
  const supabase = createClient();
  const { showToast } = useToast();
  const adminUser = useAdminUser();

  const [rows, setRows] = useState<TicketRow[]>([]);
  const [totalCount, setTotalCount] = useState(0);
  const [page, setPage] = useState(0);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<TicketStatus | 'all'>('open');
  const [isLoading, setIsLoading] = useState(true);

  const [activeTicket, setActiveTicket] = useState<TicketRow | null>(null);
  const [replyText, setReplyText] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  const fetchRows = useCallback(async () => {
    setIsLoading(true);
    let query = supabase
      .from('support_tickets')
      .select('*', { count: 'exact' })
      .order('created_at', { ascending: false });

    if (search.trim()) query = query.or(`name.ilike.%${search.trim()}%,email.ilike.%${search.trim()}%,subject.ilike.%${search.trim()}%`);
    if (statusFilter !== 'all') query = query.eq('status', statusFilter);

    const from = page * PAGE_SIZE;
    const to = from + PAGE_SIZE - 1;
    query = query.range(from, to);

    const { data, count, error } = await query;
    if (!error) {
      setRows(data ?? []);
      setTotalCount(count ?? 0);
    } else {
      showToast('Kunne ikke hente supportsager.', 'error');
    }
    setIsLoading(false);
  }, [supabase, search, statusFilter, page, showToast]);

  useEffect(() => { fetchRows(); }, [fetchRows]);
  useEffect(() => { setPage(0); }, [search, statusFilter]);

  const openTicket = (row: TicketRow) => {
    setActiveTicket(row);
    setReplyText(row.admin_reply ?? '');
  };

  const closeModal = () => {
    setActiveTicket(null);
    setReplyText('');
  };

  const handleSaveReply = async () => {
    if (!activeTicket || replyText.trim().length === 0) return;
    setIsSaving(true);
    const { error } = await supabase.from('support_tickets').update({
      admin_reply: replyText.trim(),
      status: 'answered',
      replied_at: new Date().toISOString(),
    }).eq('id', activeTicket.id);
    setIsSaving(false);
    if (error) { showToast('Kunne ikke gemme svaret.', 'error'); return; }

    logActivity(supabase, {
      actorId: adminUser.id, actorName: adminUser.name,
      action: 'replied', entityType: 'ticket',
      entityLabel: activeTicket.subject,
    });

    // Email sending is best-effort: the reply is already saved either way.
    try {
      const res = await fetch('/api/send-ticket-reply', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ticketId: activeTicket.id }),
      });
      if (res.ok) {
        showToast('Svar gemt og sendt til brugeren.');
      } else {
        showToast('Svar gemt, men email kunne ikke sendes.', 'error');
      }
    } catch {
      showToast('Svar gemt, men email kunne ikke sendes.', 'error');
    }

    closeModal();
    fetchRows();
  };

  const [isResending, setIsResending] = useState(false);

  const handleResendEmail = async () => {
    if (!activeTicket) return;
    setIsResending(true);
    try {
      const res = await fetch('/api/send-ticket-reply', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ticketId: activeTicket.id }),
      });
      showToast(res.ok ? 'Email sendt igen.' : 'Kunne ikke sende email.', res.ok ? undefined : 'error');
    } catch {
      showToast('Kunne ikke sende email.', 'error');
    }
    setIsResending(false);
  };

  const handleSetStatus = async (status: TicketStatus) => {
    if (!activeTicket) return;
    setIsSaving(true);
    const { error } = await supabase.from('support_tickets').update({ status }).eq('id', activeTicket.id);
    setIsSaving(false);
    if (error) { showToast('Kunne ikke opdatere status.', 'error'); return; }
    showToast(status === 'closed' ? 'Sag lukket.' : 'Sag genåbnet.');
    logActivity(supabase, {
      actorId: adminUser.id, actorName: adminUser.name,
      action: 'updated', entityType: 'ticket',
      entityLabel: `${activeTicket.subject} (${status === 'closed' ? 'lukket' : 'genåbnet'})`,
    });
    closeModal();
    fetchRows();
  };

  const totalPages = Math.max(1, Math.ceil(totalCount / PAGE_SIZE));

  return (
    <div>
      <div className="flex items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-sky-500 to-sky-600">
          <Inbox className="h-5 w-5 text-white" strokeWidth={2.2} />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-stone-900">Supportsager</h1>
          <p className="text-sm text-stone-500">{totalCount} sager i alt</p>
        </div>
      </div>

      <div className="mt-6 flex gap-3">
        <div className="relative flex-1">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-stone-400" />
          <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Søg navn, email eller emne..."
            className="w-full rounded-xl border border-stone-200 bg-white py-2 pl-10 pr-3 text-sm outline-none focus:border-rose-400 focus:ring-4 focus:ring-rose-100" />
        </div>
        <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value as TicketStatus | 'all')}
          className="rounded-xl border border-stone-200 bg-white px-3 py-2 text-sm outline-none focus:border-rose-400 focus:ring-4 focus:ring-rose-100">
          <option value="open">Åbne</option>
          <option value="answered">Besvarede</option>
          <option value="closed">Lukkede</option>
          <option value="all">Alle</option>
        </select>
      </div>

      <div className="mt-4 overflow-hidden rounded-2xl border border-stone-200 bg-white shadow-sm shadow-stone-900/5">
        <table className="w-full text-sm">
          <thead className="border-b border-stone-100 bg-stone-50/50 text-left text-xs font-semibold text-stone-500">
            <tr>
              <th className="px-5 py-3">Fra</th>
              <th className="px-5 py-3">Emne</th>
              <th className="px-5 py-3">Status</th>
              <th className="px-5 py-3">Modtaget</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-stone-100">
            {isLoading ? (
              <SkeletonRows columns={4} />
            ) : rows.length === 0 ? (
              <tr>
                <td colSpan={4} className="px-5 py-12 text-center">
                  <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-stone-100">
                    <Inbox className="h-5 w-5 text-stone-400" />
                  </div>
                  <p className="mt-3 text-sm font-medium text-stone-500">Ingen supportsager fundet</p>
                </td>
              </tr>
            ) : (
              rows.map((row) => (
                <tr key={row.id} onClick={() => openTicket(row)} className="cursor-pointer transition hover:bg-stone-50/50">
                  <td className="px-5 py-3.5">
                    <p className="font-medium text-stone-900">{row.name}</p>
                    <p className="text-xs text-stone-400">{row.email}</p>
                  </td>
                  <td className="max-w-xs truncate px-5 py-3.5 text-stone-600">{row.subject}</td>
                  <td className="px-5 py-3.5">
                    <span className={`inline-flex items-center rounded-full px-2.5 py-1 text-xs font-semibold ${STATUS_STYLE[row.status]}`}>
                      {STATUS_LABEL[row.status]}
                    </span>
                  </td>
                  <td className="px-5 py-3.5 text-xs text-stone-400">{formatDate(row.created_at)}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {totalPages > 1 && (
        <div className="mt-4 flex items-center justify-center gap-3 text-sm">
          <button onClick={() => setPage((p) => Math.max(0, p - 1))} disabled={page === 0}
            className="rounded-lg border border-stone-200 bg-white px-3 py-1.5 font-medium text-stone-600 transition hover:bg-stone-50 disabled:opacity-30">
            Forrige
          </button>
          <span className="text-stone-500">Side {page + 1} af {totalPages}</span>
          <button onClick={() => setPage((p) => Math.min(totalPages - 1, p + 1))} disabled={page >= totalPages - 1}
            className="rounded-lg border border-stone-200 bg-white px-3 py-1.5 font-medium text-stone-600 transition hover:bg-stone-50 disabled:opacity-30">
            Næste
          </button>
        </div>
      )}

      {activeTicket && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-stone-900/40 backdrop-blur-sm" onClick={closeModal}>
         <div className="flex min-h-full items-center justify-center p-4">
          <div className="w-full max-w-lg rounded-2xl bg-white p-6 shadow-2xl" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-start justify-between gap-3">
              <div>
                <h2 className="text-lg font-bold text-stone-900">{activeTicket.subject}</h2>
                <p className="mt-1 flex items-center gap-1.5 text-sm text-stone-500">
                  <Mail size={13} />
                  {activeTicket.name} · {activeTicket.email}
                </p>
                <p className="mt-0.5 flex items-center gap-1.5 text-xs text-stone-400">
                  <Clock size={12} />
                  {formatDate(activeTicket.created_at)}
                </p>
              </div>
              <span className={`inline-flex shrink-0 items-center rounded-full px-2.5 py-1 text-xs font-semibold ${STATUS_STYLE[activeTicket.status]}`}>
                {STATUS_LABEL[activeTicket.status]}
              </span>
            </div>

            <div className="mt-4 rounded-xl bg-stone-50 p-4 text-sm leading-relaxed text-stone-700">
              {activeTicket.message}
            </div>

            <div className="mt-4">
              <label className="text-xs font-semibold text-stone-500">
                {activeTicket.admin_reply ? 'Svar (redigér)' : 'Skriv svar'}
              </label>
              <textarea value={replyText} onChange={(e) => setReplyText(e.target.value)} rows={4}
                className="mt-1 w-full rounded-xl border border-stone-200 px-3 py-2 text-sm outline-none focus:border-emerald-400 focus:ring-4 focus:ring-emerald-100"
                placeholder="Skriv dit svar her..." />
            </div>

            <div className="mt-6 flex items-center justify-between">
              <div className="flex items-center gap-3">
                {activeTicket.status !== 'closed' ? (
                  <button onClick={() => handleSetStatus('closed')} disabled={isSaving}
                    className="flex items-center gap-1.5 text-sm font-medium text-stone-500 hover:text-stone-700">
                    <Archive size={14} /> Luk sag
                  </button>
                ) : (
                  <button onClick={() => handleSetStatus('open')} disabled={isSaving}
                    className="text-sm font-medium text-stone-500 hover:text-stone-700">
                    Genåbn sag
                  </button>
                )}
                {activeTicket.admin_reply && (
                  <button onClick={handleResendEmail} disabled={isResending}
                    className="flex items-center gap-1.5 text-sm font-medium text-stone-500 hover:text-stone-700 disabled:opacity-40">
                    <RotateCw size={13} />
                    {isResending ? 'Sender...' : 'Gensend email'}
                  </button>
                )}
              </div>
              <div className="flex gap-2">
                <button onClick={closeModal} className="rounded-xl border border-stone-200 px-4 py-2 text-sm font-medium text-stone-600 hover:bg-stone-50">
                  Annullér
                </button>
                <button onClick={handleSaveReply} disabled={replyText.trim().length === 0 || isSaving}
                  className="flex items-center gap-1.5 rounded-xl bg-emerald-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-emerald-700 disabled:opacity-40">
                  <Send size={14} />
                  {isSaving ? 'Gemmer...' : 'Gem svar'}
                </button>
              </div>
            </div>
          </div>
         </div>
        </div>
      )}
    </div>
  );
}

function SkeletonRows({ columns }: { columns: number }) {
  return (
    <>
      {Array.from({ length: 5 }).map((_, i) => (
        <tr key={i}>
          {Array.from({ length: columns }).map((_, j) => (
            <td key={j} className="px-5 py-4">
              <div className="h-3.5 w-full max-w-[120px] animate-pulse rounded bg-stone-100" />
            </td>
          ))}
        </tr>
      ))}
    </>
  );
}