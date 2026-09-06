'use client';

import { useEffect, useState, useCallback } from 'react';
import {
  AlertTriangle,
  Archive,
  Bug,
  CheckCircle2,
  Clock,
  CreditCard,
  History,
  Inbox,
  Lightbulb,
  Mail,
  RotateCw,
  Save,
  Search,
  Send,
  StickyNote,
  UserCircle,
} from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import { orIlikeFilter } from '@/lib/postgrest';
import { useToast } from '@/components/toast-provider';
import { SkeletonRows } from '@/components/skeleton-rows';
import { useDebouncedValue } from '@/hooks/useDebouncedValue';
import { EntityHistoryModal } from '@/components/entity-history-modal';

const TICKET_SEARCH_COLUMNS = ['name', 'email', 'subject'] as const;

type TicketStatus = 'open' | 'waiting' | 'answered' | 'closed';
type TicketPriority = 'low' | 'normal' | 'high' | 'urgent';
type TicketCategory = 'general' | 'bug' | 'billing' | 'feature' | 'account';

type TicketRow = {
  id: string;
  name: string;
  email: string;
  subject: string;
  message: string;
  status: TicketStatus;
  priority: TicketPriority;
  category: TicketCategory;
  internal_note: string | null;
  admin_reply: string | null;
  replied_at: string | null;
  created_at: string;
  updated_at: string | null;
};

type TicketStats = {
  open: number;
  waiting: number;
  urgent: number;
  answeredToday: number;
};

type TicketUpdateResponse = {
  error?: string;
  row?: TicketRow;
};

type EmailSendResponse = {
  error?: string;
  setupHint?: string;
};

const PAGE_SIZE = 20;

const STATUS_LABEL: Record<TicketStatus, string> = {
  open: 'Åben',
  waiting: 'Venter på bruger',
  answered: 'Besvaret',
  closed: 'Lukket',
};

const STATUS_STYLE: Record<TicketStatus, string> = {
  open: 'bg-amber-100 text-amber-700 dark:bg-amber-500/15 dark:text-amber-400',
  waiting: 'bg-sky-100 text-sky-700 dark:bg-sky-500/15 dark:text-sky-400',
  answered: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-400',
  closed: 'bg-stone-200 text-stone-600 dark:bg-stone-800 dark:text-stone-400',
};

const PRIORITY_LABEL: Record<TicketPriority, string> = {
  low: 'Lav',
  normal: 'Normal',
  high: 'Høj',
  urgent: 'Haster',
};

const PRIORITY_STYLE: Record<TicketPriority, string> = {
  low: 'bg-stone-100 text-stone-600 dark:bg-stone-800 dark:text-stone-300',
  normal: 'bg-sky-100 text-sky-700 dark:bg-sky-500/15 dark:text-sky-400',
  high: 'bg-amber-100 text-amber-700 dark:bg-amber-500/15 dark:text-amber-400',
  urgent: 'bg-red-100 text-red-700 dark:bg-red-500/15 dark:text-red-400',
};

const CATEGORY_LABEL: Record<TicketCategory, string> = {
  general: 'Generelt',
  bug: 'Fejl',
  billing: 'Betaling',
  feature: 'Feature',
  account: 'Konto',
};

const CATEGORY_ICON: Record<TicketCategory, typeof Inbox> = {
  general: Inbox,
  bug: Bug,
  billing: CreditCard,
  feature: Lightbulb,
  account: UserCircle,
};

const REPLY_TEMPLATES = [
  {
    label: 'Modtaget',
    text: 'Hej,\n\nTak for din besked. Vi har modtaget den og kigger på det hurtigst muligt.\n\nMvh\nLifeSort Support',
  },
  {
    label: 'Mere info',
    text: 'Hej,\n\nTak for din besked. Kan du sende lidt mere information om, hvad der skete, og hvilken enhed/browser du brugte?\n\nMvh\nLifeSort Support',
  },
  {
    label: 'Løst',
    text: 'Hej,\n\nTak for din besked. Det er rettet nu. Skriv endelig igen, hvis du stadig oplever problemet.\n\nMvh\nLifeSort Support',
  },
];

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString('da-DK', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' });
}

function todayStartIso() {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  return d.toISOString();
}

function isMissingSupportSchema(error: { code?: string; message?: string } | null) {
  if (!error) return false;
  return (
    error.code === '42703' ||
    error.code === 'PGRST204' ||
    /column .* does not exist|could not find .* column|schema cache/i.test(error.message ?? '')
  );
}

async function emailErrorMessage(res: Response, fallback: string) {
  const body = await res.json().catch(() => ({})) as EmailSendResponse;
  if (!body.error) return fallback;
  return body.setupHint ? `${body.error} ${body.setupHint}` : body.error;
}

function StatCard({
  label,
  value,
  detail,
  icon: Icon,
  tone,
}: {
  label: string;
  value: string;
  detail: string;
  icon: typeof Inbox;
  tone: string;
}) {
  return (
    <div className="rounded-2xl border border-stone-200 bg-white p-5 shadow-sm shadow-stone-900/5 dark:border-stone-800 dark:bg-stone-900">
      <div className={`flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br ${tone}`}>
        <Icon className="h-5 w-5 text-white" strokeWidth={2.2} />
      </div>
      <p className="mt-4 text-2xl font-bold text-stone-900 dark:text-stone-100">{value}</p>
      <p className="text-xs font-medium text-stone-500 dark:text-stone-400">{label}</p>
      <p className="mt-2 text-xs text-stone-400 dark:text-stone-500">{detail}</p>
    </div>
  );
}

export default function TicketsPage() {
  const supabase = createClient();
  const { showToast } = useToast();

  const [rows, setRows] = useState<TicketRow[]>([]);
  const [totalCount, setTotalCount] = useState(0);
  const [stats, setStats] = useState<TicketStats>({ open: 0, waiting: 0, urgent: 0, answeredToday: 0 });
  const [page, setPage] = useState(0);
  const [search, setSearch] = useState('');
  const debouncedSearch = useDebouncedValue(search, 300);
  const [statusFilter, setStatusFilter] = useState<TicketStatus | 'all'>('open');
  const [priorityFilter, setPriorityFilter] = useState<TicketPriority | 'all'>('all');
  const [categoryFilter, setCategoryFilter] = useState<TicketCategory | 'all'>('all');
  const [isLoading, setIsLoading] = useState(true);
  const [isEnhancedSupportReady, setIsEnhancedSupportReady] = useState(true);

  const [activeTicket, setActiveTicket] = useState<TicketRow | null>(null);
  const [replyText, setReplyText] = useState('');
  const [priorityValue, setPriorityValue] = useState<TicketPriority>('normal');
  const [categoryValue, setCategoryValue] = useState<TicketCategory>('general');
  const [internalNote, setInternalNote] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [isSavingMeta, setIsSavingMeta] = useState(false);
  const [showHistory, setShowHistory] = useState(false);
  const [emailError, setEmailError] = useState<string | null>(null);

  const fetchStats = useCallback(async () => {
    const [openRes, waitingRes, urgentRes, answeredTodayRes] = await Promise.all([
      supabase.from('support_tickets').select('id', { count: 'exact', head: true }).eq('status', 'open'),
      supabase.from('support_tickets').select('id', { count: 'exact', head: true }).eq('status', 'waiting'),
      supabase.from('support_tickets').select('id', { count: 'exact', head: true }).in('priority', ['high', 'urgent']).neq('status', 'closed'),
      supabase.from('support_tickets').select('id', { count: 'exact', head: true }).eq('status', 'answered').gte('replied_at', todayStartIso()),
    ]);

    const enhancedReady = !isMissingSupportSchema(urgentRes.error);
    setIsEnhancedSupportReady(enhancedReady);

    setStats({
      open: openRes.count ?? 0,
      waiting: enhancedReady ? waitingRes.count ?? 0 : 0,
      urgent: enhancedReady ? urgentRes.count ?? 0 : 0,
      answeredToday: answeredTodayRes.count ?? 0,
    });
  }, [supabase]);

  const fetchRows = useCallback(async () => {
    await Promise.resolve();
    setIsLoading(true);
    let query = supabase
      .from('support_tickets')
      .select('*', { count: 'exact' })
      .order('created_at', { ascending: false });

    if (debouncedSearch.trim()) query = query.or(orIlikeFilter(TICKET_SEARCH_COLUMNS, debouncedSearch.trim()));
    if (statusFilter !== 'all') query = query.eq('status', statusFilter);
    if (isEnhancedSupportReady && priorityFilter !== 'all') query = query.eq('priority', priorityFilter);
    if (isEnhancedSupportReady && categoryFilter !== 'all') query = query.eq('category', categoryFilter);

    const from = page * PAGE_SIZE;
    const to = from + PAGE_SIZE - 1;
    query = query.range(from, to);

    const { data, count, error } = await query;
    if (!error) {
      setRows((data ?? []).map((row) => ({
        ...row,
        priority: row.priority ?? 'normal',
        category: row.category ?? 'general',
        internal_note: row.internal_note ?? null,
        updated_at: row.updated_at ?? null,
      })));
      setTotalCount(count ?? 0);
    } else {
      showToast('Kunne ikke hente supportsager.', 'error');
    }
    setIsLoading(false);
  }, [supabase, debouncedSearch, statusFilter, priorityFilter, categoryFilter, isEnhancedSupportReady, page, showToast]);

  useEffect(() => {
    queueMicrotask(() => {
      fetchRows();
      fetchStats();
    });
  }, [fetchRows, fetchStats]);

  const openTicket = (row: TicketRow) => {
    setActiveTicket(row);
    setReplyText(row.admin_reply ?? '');
    setPriorityValue(row.priority ?? 'normal');
    setCategoryValue(row.category ?? 'general');
    setInternalNote(row.internal_note ?? '');
    setEmailError(null);
  };

  const closeModal = () => {
    setActiveTicket(null);
    setReplyText('');
    setPriorityValue('normal');
    setCategoryValue('general');
    setInternalNote('');
    setShowHistory(false);
    setEmailError(null);
  };

  const updateTicket = async (payload: {
    id: string;
    status?: TicketStatus;
    priority?: TicketPriority;
    category?: TicketCategory;
    internalNote?: string;
    adminReply?: string;
  }) => {
    const res = await fetch('/api/admin/tickets/update', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    const body = await res.json().catch(() => ({})) as TicketUpdateResponse;
    if (!res.ok || !body.row) {
      throw new Error(body.error ?? 'Kunne ikke opdatere supportsagen.');
    }
    return body.row;
  };

  const handleSaveReply = async () => {
    if (!activeTicket || replyText.trim().length === 0) return;
    setIsSaving(true);
    setEmailError(null);
    try {
      await updateTicket({ id: activeTicket.id, adminReply: replyText.trim() });
    } catch (err) {
      setIsSaving(false);
      showToast(err instanceof Error ? err.message : 'Kunne ikke gemme svaret.', 'error');
      return;
    }

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
        const message = await emailErrorMessage(res, 'Email kunne ikke sendes.');
        setEmailError(message);
        showToast('Svar gemt, men email kunne ikke sendes.', 'error');
      }
    } catch {
      setEmailError('Kunne ikke kontakte email-endpointet.');
      showToast('Svar gemt, men email kunne ikke sendes.', 'error');
    }
    setIsSaving(false);

    closeModal();
    fetchRows();
    fetchStats();
  };

  const [isResending, setIsResending] = useState(false);

  const handleResendEmail = async () => {
    if (!activeTicket) return;
    setIsResending(true);
    setEmailError(null);
    try {
      const res = await fetch('/api/send-ticket-reply', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ticketId: activeTicket.id }),
      });
      if (res.ok) {
        showToast('Email sendt igen.');
      } else {
        const message = await emailErrorMessage(res, 'Kunne ikke sende email.');
        setEmailError(message);
        showToast('Kunne ikke sende email.', 'error');
      }
    } catch {
      setEmailError('Kunne ikke kontakte email-endpointet.');
      showToast('Kunne ikke sende email.', 'error');
    }
    setIsResending(false);
  };

  const handleSetStatus = async (status: TicketStatus) => {
    if (!activeTicket) return;
    const previousStatus = activeTicket.status;
    const updatedTicket = { ...activeTicket, status, updated_at: new Date().toISOString() };
    setRows((prev) => prev.map((r) => (r.id === activeTicket.id ? { ...r, status } : r)));
    setActiveTicket(updatedTicket);

    try {
      const savedTicket = await updateTicket({ id: activeTicket.id, status });
      setActiveTicket(savedTicket);
      setRows((prev) => prev.map((r) => (r.id === savedTicket.id ? savedTicket : r)));
    } catch (err) {
      setRows((prev) => prev.map((r) => (r.id === activeTicket.id ? { ...r, status: previousStatus } : r)));
      setActiveTicket({ ...activeTicket, status: previousStatus });
      showToast(err instanceof Error ? err.message : 'Kunne ikke opdatere status.', 'error');
      return;
    }
    showToast(status === 'closed' ? 'Sag lukket.' : status === 'waiting' ? 'Sag sat til venter på bruger.' : 'Status opdateret.');
    fetchRows();
    fetchStats();
  };

  const handleSaveMeta = async () => {
    if (!activeTicket) return;
    setIsSavingMeta(true);
    const payload = {
      priority: priorityValue,
      category: categoryValue,
      internal_note: internalNote.trim() || null,
      updated_at: new Date().toISOString(),
    };

    let savedTicket: TicketRow;
    try {
      savedTicket = await updateTicket({
        id: activeTicket.id,
        priority: payload.priority,
        category: payload.category,
        internalNote: internalNote,
      });
    } catch (err) {
      setIsSavingMeta(false);
      showToast(err instanceof Error ? err.message : 'Kunne ikke gemme interne felter.', 'error');
      return;
    }
    setIsSavingMeta(false);

    setActiveTicket(savedTicket);
    setRows((prev) => prev.map((r) => (r.id === activeTicket.id ? savedTicket : r)));
    showToast('Interne felter gemt.');
    fetchRows();
    fetchStats();
  };

  const totalPages = Math.max(1, Math.ceil(totalCount / PAGE_SIZE));

  return (
    <div>
      <div className="flex items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-sky-500 to-sky-600">
          <Inbox className="h-5 w-5 text-white" strokeWidth={2.2} />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-stone-900 dark:text-stone-100">Supportsager</h1>
          <p className="text-sm text-stone-500 dark:text-stone-400">{totalCount} sager i alt</p>
        </div>
      </div>

      <div className="mt-8 grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatCard label="Åbne" value={stats.open.toString()} detail="Sager der kræver svar" icon={Inbox} tone="from-amber-500 to-amber-600" />
        <StatCard label="Venter" value={stats.waiting.toString()} detail="Afventer svar fra bruger" icon={Clock} tone="from-sky-500 to-sky-600" />
        <StatCard label="Høj prioritet" value={stats.urgent.toString()} detail="Høj eller haster, ikke lukket" icon={AlertTriangle} tone="from-red-500 to-red-600" />
        <StatCard label="Besvaret i dag" value={stats.answeredToday.toString()} detail="Svar sendt siden midnat" icon={CheckCircle2} tone="from-emerald-500 to-emerald-600" />
      </div>

      {!isEnhancedSupportReady && (
        <div className="mt-4 flex gap-3 rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-800 dark:border-amber-500/30 dark:bg-amber-500/10 dark:text-amber-200">
          <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
          <div>
            <p className="font-semibold">Support-migrationen mangler i databasen.</p>
            <p className="mt-1">Svar, luk/genåbn og emails kan gemmes nu. Prioritet, kategori, intern note og “venter på bruger” virker, når migrationen er kørt.</p>
          </div>
        </div>
      )}

      <div className="mt-6 flex flex-wrap gap-3">
        <div className="relative flex-1">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-stone-400" />
          <input
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(0);
            }}
            placeholder="Søg navn, email eller emne..."
            className="w-full rounded-xl border border-stone-200 bg-white py-2 pl-10 pr-3 text-sm text-stone-900 outline-none focus:border-rose-400 focus:ring-4 focus:ring-rose-100 dark:border-stone-700 dark:bg-stone-900 dark:text-stone-100 dark:focus:ring-rose-900/30" />
        </div>
        <select
          value={statusFilter}
          onChange={(e) => {
            setStatusFilter(e.target.value as TicketStatus | 'all');
            setPage(0);
          }}
          className="rounded-xl border border-stone-200 bg-white px-3 py-2 text-sm text-stone-900 outline-none focus:border-rose-400 focus:ring-4 focus:ring-rose-100 dark:border-stone-700 dark:bg-stone-900 dark:text-stone-100 dark:focus:ring-rose-900/30">
          <option value="open">Åbne</option>
          <option value="waiting" disabled={!isEnhancedSupportReady}>Venter på bruger</option>
          <option value="answered">Besvarede</option>
          <option value="closed">Lukkede</option>
          <option value="all">Alle</option>
        </select>
        <select
          value={priorityFilter}
          onChange={(e) => {
            setPriorityFilter(e.target.value as TicketPriority | 'all');
            setPage(0);
          }}
          disabled={!isEnhancedSupportReady}
          className="rounded-xl border border-stone-200 bg-white px-3 py-2 text-sm text-stone-900 outline-none focus:border-rose-400 focus:ring-4 focus:ring-rose-100 disabled:opacity-50 dark:border-stone-700 dark:bg-stone-900 dark:text-stone-100 dark:focus:ring-rose-900/30">
          <option value="all">Alle prioriteter</option>
          <option value="urgent">Haster</option>
          <option value="high">Høj</option>
          <option value="normal">Normal</option>
          <option value="low">Lav</option>
        </select>
        <select
          value={categoryFilter}
          onChange={(e) => {
            setCategoryFilter(e.target.value as TicketCategory | 'all');
            setPage(0);
          }}
          disabled={!isEnhancedSupportReady}
          className="rounded-xl border border-stone-200 bg-white px-3 py-2 text-sm text-stone-900 outline-none focus:border-rose-400 focus:ring-4 focus:ring-rose-100 disabled:opacity-50 dark:border-stone-700 dark:bg-stone-900 dark:text-stone-100 dark:focus:ring-rose-900/30">
          <option value="all">Alle kategorier</option>
          <option value="general">Generelt</option>
          <option value="bug">Fejl</option>
          <option value="billing">Betaling</option>
          <option value="feature">Feature</option>
          <option value="account">Konto</option>
        </select>
      </div>

      <div className="mt-4 overflow-hidden rounded-2xl border border-stone-200 bg-white shadow-sm shadow-stone-900/5 dark:border-stone-800 dark:bg-stone-900">
        <table className="w-full text-sm">
          <thead className="border-b border-stone-100 bg-stone-50/50 text-left text-xs font-semibold text-stone-500 dark:border-stone-800 dark:bg-stone-800/50 dark:text-stone-400">
            <tr>
              <th className="px-5 py-3">Fra</th>
              <th className="px-5 py-3">Emne</th>
              <th className="px-5 py-3">Prioritet</th>
              <th className="px-5 py-3">Kategori</th>
              <th className="px-5 py-3">Status</th>
              <th className="px-5 py-3">Modtaget</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-stone-100 dark:divide-stone-800">
            {isLoading ? (
              <SkeletonRows columns={6} />
            ) : rows.length === 0 ? (
              <tr>
                <td colSpan={6} className="px-5 py-12 text-center">
                  <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-stone-100 dark:bg-stone-800">
                    <Inbox className="h-5 w-5 text-stone-400" />
                  </div>
                  <p className="mt-3 text-sm font-medium text-stone-500 dark:text-stone-400">Ingen supportsager fundet</p>
                </td>
              </tr>
            ) : (
              rows.map((row) => (
                <tr key={row.id} onClick={() => openTicket(row)} className="cursor-pointer transition hover:bg-stone-50/50 dark:hover:bg-stone-800/50">
                  <td className="px-5 py-3.5">
                    <p className="font-medium text-stone-900 dark:text-stone-100">{row.name}</p>
                    <p className="text-xs text-stone-400 dark:text-stone-500">{row.email}</p>
                  </td>
                  <td className="max-w-xs truncate px-5 py-3.5 text-stone-600 dark:text-stone-400">{row.subject}</td>
                  <td className="px-5 py-3.5">
                    <span className={`inline-flex items-center rounded-full px-2.5 py-1 text-xs font-semibold ${PRIORITY_STYLE[row.priority]}`}>
                      {PRIORITY_LABEL[row.priority]}
                    </span>
                  </td>
                  <td className="px-5 py-3.5">
                    <span className="inline-flex items-center gap-1.5 rounded-full bg-stone-100 px-2.5 py-1 text-xs font-semibold text-stone-600 dark:bg-stone-800 dark:text-stone-300">
                      {(() => {
                        const Icon = CATEGORY_ICON[row.category];
                        return <Icon size={12} />;
                      })()}
                      {CATEGORY_LABEL[row.category]}
                    </span>
                  </td>
                  <td className="px-5 py-3.5">
                    <span className={`inline-flex items-center rounded-full px-2.5 py-1 text-xs font-semibold ${STATUS_STYLE[row.status]}`}>
                      {STATUS_LABEL[row.status]}
                    </span>
                  </td>
                  <td className="px-5 py-3.5 text-xs text-stone-400 dark:text-stone-500">{formatDate(row.created_at)}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {totalPages > 1 && (
        <div className="mt-4 flex items-center justify-center gap-3 text-sm">
          <button onClick={() => setPage((p) => Math.max(0, p - 1))} disabled={page === 0}
            className="rounded-lg border border-stone-200 bg-white px-3 py-1.5 font-medium text-stone-600 transition hover:bg-stone-50 disabled:opacity-30 dark:border-stone-700 dark:bg-stone-900 dark:text-stone-300 dark:hover:bg-stone-800">
            Forrige
          </button>
          <span className="text-stone-500 dark:text-stone-400">Side {page + 1} af {totalPages}</span>
          <button onClick={() => setPage((p) => Math.min(totalPages - 1, p + 1))} disabled={page >= totalPages - 1}
            className="rounded-lg border border-stone-200 bg-white px-3 py-1.5 font-medium text-stone-600 transition hover:bg-stone-50 disabled:opacity-30 dark:border-stone-700 dark:bg-stone-900 dark:text-stone-300 dark:hover:bg-stone-800">
            Næste
          </button>
        </div>
      )}

      {activeTicket && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-stone-900/40 backdrop-blur-sm" onClick={closeModal}>
         <div className="flex min-h-full items-center justify-center p-4">
          <div className="w-full max-w-lg rounded-2xl bg-white p-6 shadow-2xl dark:bg-stone-900" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-start justify-between gap-3">
              <div>
                <h2 className="text-lg font-bold text-stone-900 dark:text-stone-100">{activeTicket.subject}</h2>
                <p className="mt-1 flex items-center gap-1.5 text-sm text-stone-500 dark:text-stone-400">
                  <Mail size={13} />
                  {activeTicket.name} · {activeTicket.email}
                </p>
                <p className="mt-0.5 flex items-center gap-1.5 text-xs text-stone-400 dark:text-stone-500">
                  <Clock size={12} />
                  {formatDate(activeTicket.created_at)}
                </p>
              </div>
              <span className={`inline-flex shrink-0 items-center rounded-full px-2.5 py-1 text-xs font-semibold ${STATUS_STYLE[activeTicket.status]}`}>
                {STATUS_LABEL[activeTicket.status]}
              </span>
            </div>

            <div className="mt-4 rounded-xl bg-stone-50 p-4 text-sm leading-relaxed text-stone-700 dark:bg-stone-800 dark:text-stone-300">
              {activeTicket.message}
            </div>

            <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2">
              <div>
                <label className="text-xs font-semibold text-stone-500 dark:text-stone-400">Prioritet</label>
                <select
                  value={priorityValue}
                  onChange={(e) => setPriorityValue(e.target.value as TicketPriority)}
                  disabled={!isEnhancedSupportReady}
                  className="mt-1 w-full rounded-xl border border-stone-200 bg-white px-3 py-2 text-sm text-stone-900 outline-none focus:border-rose-400 focus:ring-4 focus:ring-rose-100 disabled:opacity-50 dark:border-stone-700 dark:bg-stone-800 dark:text-stone-100 dark:focus:ring-rose-900/30"
                >
                  <option value="low">Lav</option>
                  <option value="normal">Normal</option>
                  <option value="high">Høj</option>
                  <option value="urgent">Haster</option>
                </select>
              </div>
              <div>
                <label className="text-xs font-semibold text-stone-500 dark:text-stone-400">Kategori</label>
                <select
                  value={categoryValue}
                  onChange={(e) => setCategoryValue(e.target.value as TicketCategory)}
                  disabled={!isEnhancedSupportReady}
                  className="mt-1 w-full rounded-xl border border-stone-200 bg-white px-3 py-2 text-sm text-stone-900 outline-none focus:border-rose-400 focus:ring-4 focus:ring-rose-100 disabled:opacity-50 dark:border-stone-700 dark:bg-stone-800 dark:text-stone-100 dark:focus:ring-rose-900/30"
                >
                  <option value="general">Generelt</option>
                  <option value="bug">Fejl</option>
                  <option value="billing">Betaling</option>
                  <option value="feature">Feature</option>
                  <option value="account">Konto</option>
                </select>
              </div>
            </div>

            <div className="mt-4">
              <label className="flex items-center gap-1.5 text-xs font-semibold text-stone-500 dark:text-stone-400">
                <StickyNote size={13} />
                Intern note
              </label>
              <textarea
                value={internalNote}
                onChange={(e) => setInternalNote(e.target.value)}
                rows={3}
                disabled={!isEnhancedSupportReady}
                className="mt-1 w-full rounded-xl border border-stone-200 bg-white px-3 py-2 text-sm text-stone-900 outline-none focus:border-rose-400 focus:ring-4 focus:ring-rose-100 disabled:opacity-50 dark:border-stone-700 dark:bg-stone-800 dark:text-stone-100 dark:focus:ring-rose-900/30"
                placeholder="Kun synlig i adminpanelet..."
              />
            </div>

            <div className="mt-3 flex flex-wrap items-center gap-2">
              <button
                onClick={handleSaveMeta}
                disabled={isSavingMeta || !isEnhancedSupportReady}
                className="flex items-center gap-1.5 rounded-lg border border-stone-200 bg-white px-3 py-1.5 text-xs font-semibold text-stone-700 transition hover:bg-stone-50 disabled:opacity-40 dark:border-stone-700 dark:bg-stone-800 dark:text-stone-200 dark:hover:bg-stone-700"
              >
                <Save size={13} />
                {isSavingMeta ? 'Gemmer...' : 'Gem interne felter'}
              </button>
              {(['open', 'waiting', 'answered', 'closed'] as TicketStatus[]).map((status) => (
                <button
                  key={status}
                  onClick={() => handleSetStatus(status)}
                  disabled={activeTicket.status === status || (status === 'waiting' && !isEnhancedSupportReady)}
                  className={`rounded-lg px-3 py-1.5 text-xs font-semibold transition disabled:cursor-default ${activeTicket.status === status
                    ? STATUS_STYLE[status]
                    : 'border border-stone-200 bg-white text-stone-600 hover:bg-stone-50 dark:border-stone-700 dark:bg-stone-800 dark:text-stone-300 dark:hover:bg-stone-700'
                  }`}
                >
                  {STATUS_LABEL[status]}
                </button>
              ))}
            </div>

            <div className="mt-4">
              <label className="text-xs font-semibold text-stone-500 dark:text-stone-400">
                {activeTicket.admin_reply ? 'Svar (redigér)' : 'Skriv svar'}
              </label>
              <div className="mt-2 flex flex-wrap gap-2">
                {REPLY_TEMPLATES.map((template) => (
                  <button
                    key={template.label}
                    onClick={() => setReplyText(template.text)}
                    className="rounded-lg bg-stone-100 px-3 py-1.5 text-xs font-semibold text-stone-600 transition hover:bg-stone-200 dark:bg-stone-800 dark:text-stone-300 dark:hover:bg-stone-700"
                  >
                    {template.label}
                  </button>
                ))}
              </div>
              <textarea value={replyText} onChange={(e) => setReplyText(e.target.value)} rows={4}
                className="mt-1 w-full rounded-xl border border-stone-200 bg-white px-3 py-2 text-sm text-stone-900 outline-none focus:border-emerald-400 focus:ring-4 focus:ring-emerald-100 dark:border-stone-700 dark:bg-stone-800 dark:text-stone-100 dark:focus:ring-emerald-900/30"
                placeholder="Skriv dit svar her..." />
            </div>

            {emailError && (
              <div className="mt-4 flex gap-2 rounded-xl border border-amber-200 bg-amber-50 p-3 text-xs leading-relaxed text-amber-800 dark:border-amber-500/30 dark:bg-amber-500/10 dark:text-amber-200">
                <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
                <p>{emailError}</p>
              </div>
            )}

            <div className="mt-6 flex items-center justify-between">
              <div className="flex items-center gap-3">
                {activeTicket.status !== 'closed' ? (
                  <button onClick={() => handleSetStatus('closed')} disabled={isSaving}
                    className="flex items-center gap-1.5 text-sm font-medium text-stone-500 hover:text-stone-700 dark:text-stone-400 dark:hover:text-stone-200">
                    <Archive size={14} /> Luk sag
                  </button>
                ) : (
                  <button onClick={() => handleSetStatus('open')} disabled={isSaving}
                    className="text-sm font-medium text-stone-500 hover:text-stone-700 dark:text-stone-400 dark:hover:text-stone-200">
                    Genåbn sag
                  </button>
                )}
                {activeTicket.admin_reply && (
                  <button onClick={handleResendEmail} disabled={isResending}
                    className="flex items-center gap-1.5 text-sm font-medium text-stone-500 hover:text-stone-700 disabled:opacity-40 dark:text-stone-400 dark:hover:text-stone-200">
                    <RotateCw size={13} />
                    {isResending ? 'Sender...' : 'Gensend email'}
                  </button>
                )}
                <button onClick={() => setShowHistory(true)}
                  className="flex items-center gap-1.5 text-sm font-medium text-stone-500 hover:text-stone-700 dark:text-stone-400 dark:hover:text-stone-200">
                  <History size={13} /> Historik
                </button>
              </div>
              <div className="flex gap-2">
                <button onClick={closeModal} className="rounded-xl border border-stone-200 px-4 py-2 text-sm font-medium text-stone-600 hover:bg-stone-50 dark:border-stone-700 dark:text-stone-300 dark:hover:bg-stone-800">
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

      {showHistory && activeTicket && (
        <EntityHistoryModal
          entityType="ticket"
          entityId={activeTicket.id}
          title={activeTicket.subject}
          onClose={() => setShowHistory(false)}
        />
      )}
    </div>
  );
}
