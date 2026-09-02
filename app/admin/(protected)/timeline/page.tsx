'use client';

import { useEffect, useState, useCallback, useMemo } from 'react';
import {
  Milestone, Plus, X, Pencil, Trash2, CheckCircle2, CircleDashed,
  Clock3, AlertTriangle, Sparkles,
} from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import { useToast } from '@/components/toast-provider';
import { useConfirm } from '@/components/confirm-dialog';

type Owner = 'hajrudin' | 'walid' | 'begge';
type Status = 'upcoming' | 'in_progress' | 'done';
type ComputedStatus = 'done' | 'overdue' | 'in_progress' | 'upcoming';

type TimelineRow = {
  id: string;
  title: string;
  description: string | null;
  event_date: string; // YYYY-MM-DD
  status: Status;
  owner: Owner;
  created_at: string;
};

const OWNER_LABEL: Record<Owner, string> = {
  hajrudin: 'Hajrudin',
  walid: 'Walid',
  begge: 'Begge',
};

const OWNER_STYLE: Record<Owner, string> = {
  hajrudin: 'bg-sky-100 text-sky-700',
  walid: 'bg-violet-100 text-violet-700',
  begge: 'bg-stone-200 text-stone-700',
};

const STATUS_META: Record<ComputedStatus, { label: string; dot: string; ring: string; text: string; icon: typeof CheckCircle2 }> = {
  done: { label: 'Færdig', dot: 'bg-emerald-500', ring: 'ring-emerald-100', text: 'text-emerald-700', icon: CheckCircle2 },
  overdue: { label: 'Overskredet', dot: 'bg-rose-500', ring: 'ring-rose-100', text: 'text-rose-700', icon: AlertTriangle },
  in_progress: { label: 'I gang', dot: 'bg-amber-500', ring: 'ring-amber-100', text: 'text-amber-700', icon: Clock3 },
  upcoming: { label: 'Kommer', dot: 'bg-stone-300', ring: 'ring-stone-100', text: 'text-stone-500', icon: CircleDashed },
};

function todayStr() {
  return new Date().toISOString().split('T')[0];
}

function computeStatus(row: TimelineRow): ComputedStatus {
  if (row.status === 'done') return 'done';
  if (row.event_date < todayStr()) return 'overdue';
  if (row.status === 'in_progress') return 'in_progress';
  return 'upcoming';
}

function formatDate(dateStr: string) {
  return new Date(dateStr + 'T00:00:00').toLocaleDateString('da-DK', {
    day: 'numeric', month: 'short', year: 'numeric',
  });
}

type ListItem = { kind: 'event'; row: TimelineRow } | { kind: 'today' };

export default function TimelinePage() {
  const supabase = createClient();
  const { showToast } = useToast();
  const confirm = useConfirm();

  const [rows, setRows] = useState<TimelineRow[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [ownerFilter, setOwnerFilter] = useState<Owner | 'all'>('all');

  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formTitle, setFormTitle] = useState('');
  const [formDescription, setFormDescription] = useState('');
  const [formDate, setFormDate] = useState(todayStr());
  const [formStatus, setFormStatus] = useState<Status>('upcoming');
  const [formOwner, setFormOwner] = useState<Owner>('begge');
  const [isSaving, setIsSaving] = useState(false);

  const [detailRow, setDetailRow] = useState<TimelineRow | null>(null);

  const fetchRows = useCallback(async () => {
    setIsLoading(true);
    const { data, error } = await supabase
      .from('timeline_events')
      .select('*')
      .order('event_date', { ascending: true });

    if (!error) {
      setRows(data ?? []);
    } else {
      showToast('Kunne ikke hente tidslinjen.', 'error');
    }
    setIsLoading(false);
  }, [supabase, showToast]);

  useEffect(() => { fetchRows(); }, [fetchRows]);

  const filteredRows = useMemo(
    () => (ownerFilter === 'all' ? rows : rows.filter((r) => r.owner === ownerFilter)),
    [rows, ownerFilter]
  );

  // Weave a "today" marker into the sorted list, at its chronological position.
  const items = useMemo<ListItem[]>(() => {
    const today = todayStr();
    const result: ListItem[] = [];
    let inserted = false;

    filteredRows.forEach((row) => {
      if (!inserted && row.event_date >= today) {
        result.push({ kind: 'today' });
        inserted = true;
      }
      result.push({ kind: 'event', row });
    });
    if (!inserted) result.push({ kind: 'today' });

    return result;
  }, [filteredRows]);

  const resetForm = () => {
    setEditingId(null);
    setFormTitle('');
    setFormDescription('');
    setFormDate(todayStr());
    setFormStatus('upcoming');
    setFormOwner('begge');
  };

  const openCreateForm = () => {
    resetForm();
    setIsFormOpen(true);
  };

  const openEditForm = (row: TimelineRow) => {
    setEditingId(row.id);
    setFormTitle(row.title);
    setFormDescription(row.description ?? '');
    setFormDate(row.event_date);
    setFormStatus(row.status);
    setFormOwner(row.owner);
    setDetailRow(null);
    setIsFormOpen(true);
  };

  const closeForm = () => {
    setIsFormOpen(false);
    resetForm();
  };

  const canSave = formTitle.trim().length > 0 && formDate.length > 0;

  const handleSave = async () => {
    if (!canSave) return;
    setIsSaving(true);

    const payload = {
      title: formTitle.trim(),
      description: formDescription.trim() || null,
      event_date: formDate,
      status: formStatus,
      owner: formOwner,
    };

    const { error } = editingId
      ? await supabase.from('timeline_events').update(payload).eq('id', editingId)
      : await supabase.from('timeline_events').insert(payload);

    setIsSaving(false);
    if (error) { showToast('Kunne ikke gemme posten.', 'error'); return; }
    showToast(editingId ? 'Post opdateret.' : 'Post oprettet.');
    closeForm();
    fetchRows();
  };

  const handleDelete = async (row: TimelineRow) => {
    const ok = await confirm({ title: 'Slet post?', message: `"${row.title}" fjernes fra tidslinjen. Dette kan ikke fortrydes.` });
    if (!ok) return;
    const { error } = await supabase.from('timeline_events').delete().eq('id', row.id);
    if (error) { showToast('Kunne ikke slette posten.', 'error'); return; }
    showToast('Post slettet.');
    setDetailRow(null);
    fetchRows();
  };

  return (
    <div>
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-stone-800 to-stone-900">
            <Milestone className="h-5 w-5 text-white" strokeWidth={2.2} />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-stone-900">Tidslinje</h1>
            <p className="text-sm text-stone-500">{rows.length} {rows.length === 1 ? 'post' : 'poster'} i alt</p>
          </div>
        </div>
        <button onClick={openCreateForm}
          className="flex items-center gap-1.5 rounded-xl bg-stone-900 px-4 py-2 text-sm font-semibold text-white transition hover:bg-stone-800">
          <Plus size={15} />
          Tilføj post
        </button>
      </div>

      {/* Owner filter */}
      <div className="mt-6 flex flex-wrap gap-2">
        {(['all', 'hajrudin', 'walid', 'begge'] as const).map((o) => (
          <button
            key={o}
            onClick={() => setOwnerFilter(o)}
            className={`rounded-full px-3.5 py-1.5 text-xs font-semibold transition ${
              ownerFilter === o
                ? 'bg-stone-900 text-white'
                : 'bg-white text-stone-600 border border-stone-200 hover:bg-stone-50'
            }`}
          >
            {o === 'all' ? 'Alle' : OWNER_LABEL[o]}
          </button>
        ))}
      </div>

      {/* Timeline */}
      <div className="relative mt-10 pl-2">
        {isLoading ? (
          <div className="flex flex-col gap-6">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="flex gap-4">
                <div className="h-4 w-4 shrink-0 animate-pulse rounded-full bg-stone-200" />
                <div className="h-16 flex-1 animate-pulse rounded-2xl bg-stone-100" />
              </div>
            ))}
          </div>
        ) : items.length === 1 ? (
          <div className="rounded-2xl border border-dashed border-stone-200 bg-white py-16 text-center">
            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-stone-100">
              <Milestone className="h-5 w-5 text-stone-400" />
            </div>
            <p className="mt-3 text-sm font-medium text-stone-500">Ingen poster på tidslinjen endnu</p>
            <p className="text-xs text-stone-400">Tilføj jeres første milepæl eller deadline ovenfor.</p>
          </div>
        ) : (
          <div className="relative">
            {/* The spine */}
            <div className="absolute left-[7px] top-2 bottom-2 w-px bg-gradient-to-b from-stone-200 via-stone-200 to-transparent" />

            <div className="flex flex-col gap-6">
              {items.map((item) => {
                if (item.kind === 'today') {
                  return (
                    <div key="today" className="relative flex items-center gap-4 py-1">
                      <span className="relative z-10 flex h-4 w-4 shrink-0 items-center justify-center">
                        <span className="absolute h-4 w-4 animate-ping rounded-full bg-rose-400/60" />
                        <span className="relative h-2.5 w-2.5 rounded-full bg-rose-500" />
                      </span>
                      <div className="flex flex-1 items-center gap-3">
                        <span className="text-xs font-bold uppercase tracking-wide text-rose-600">I dag</span>
                        <div className="h-px flex-1 bg-rose-200" />
                      </div>
                    </div>
                  );
                }

                const row = item.row;
                const cs = computeStatus(row);
                const meta = STATUS_META[cs];
                const StatusIcon = meta.icon;

                return (
                  <div key={row.id} className="relative flex gap-4">
                    <span className={`relative z-10 mt-1.5 flex h-4 w-4 shrink-0 items-center justify-center rounded-full ${meta.dot} ring-4 ${meta.ring}`}>
                      {cs === 'in_progress' && (
                        <span className="absolute h-4 w-4 animate-ping rounded-full bg-amber-400/50" />
                      )}
                    </span>

                    <button
                      onClick={() => setDetailRow(row)}
                      className="flex-1 rounded-2xl border border-stone-200 bg-white p-4 text-left shadow-sm shadow-stone-900/5 transition hover:border-stone-300 hover:shadow-md"
                    >
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="text-xs font-medium text-stone-400">{formatDate(row.event_date)}</span>
                        <span className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-semibold ${meta.text} ${meta.ring} ring-1`}>
                          <StatusIcon size={11} />
                          {meta.label}
                        </span>
                        <span className={`rounded-full px-2 py-0.5 text-[11px] font-semibold ${OWNER_STYLE[row.owner]}`}>
                          {OWNER_LABEL[row.owner]}
                        </span>
                      </div>
                      <h3 className="mt-2 font-semibold text-stone-900">{row.title}</h3>
                      {row.description && (
                        <p className="mt-1 line-clamp-1 text-sm text-stone-500">{row.description}</p>
                      )}
                    </button>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>

      {/* Detail modal */}
      {detailRow && (() => {
        const cs = computeStatus(detailRow);
        const meta = STATUS_META[cs];
        const StatusIcon = meta.icon;
        return (
          <div className="fixed inset-0 z-50 overflow-y-auto bg-stone-900/40 backdrop-blur-sm" onClick={() => setDetailRow(null)}>
           <div className="flex min-h-full items-center justify-center p-4">
            <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl" onClick={(e) => e.stopPropagation()}>
              <div className="flex items-start justify-between gap-3">
                <div className="flex flex-wrap items-center gap-2">
                  <span className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-semibold ${meta.text} ${meta.ring} ring-1`}>
                    <StatusIcon size={11} />
                    {meta.label}
                  </span>
                  <span className={`rounded-full px-2 py-0.5 text-[11px] font-semibold ${OWNER_STYLE[detailRow.owner]}`}>
                    {OWNER_LABEL[detailRow.owner]}
                  </span>
                </div>
                <button onClick={() => setDetailRow(null)} className="text-stone-400 hover:text-stone-600">
                  <X size={18} />
                </button>
              </div>

              <h2 className="mt-3 text-xl font-bold text-stone-900">{detailRow.title}</h2>
              <p className="mt-1 text-sm text-stone-500">{formatDate(detailRow.event_date)}</p>

              {detailRow.description ? (
                <p className="mt-4 whitespace-pre-wrap text-sm leading-relaxed text-stone-700">{detailRow.description}</p>
              ) : (
                <p className="mt-4 text-sm italic text-stone-400">Ingen yderligere beskrivelse.</p>
              )}

              <div className="mt-6 flex items-center justify-between">
                <button onClick={() => handleDelete(detailRow)}
                  className="flex items-center gap-1.5 text-sm font-medium text-red-600 hover:underline">
                  <Trash2 size={14} /> Slet
                </button>
                <div className="flex gap-2">
                  <button onClick={() => setDetailRow(null)}
                    className="rounded-xl border border-stone-200 px-4 py-2 text-sm font-medium text-stone-600 hover:bg-stone-50">
                    Luk
                  </button>
                  <button onClick={() => openEditForm(detailRow)}
                    className="flex items-center gap-1.5 rounded-xl bg-stone-900 px-4 py-2 text-sm font-semibold text-white transition hover:bg-stone-800">
                    <Pencil size={14} /> Redigér
                  </button>
                </div>
              </div>
            </div>
           </div>
          </div>
        );
      })()}

      {/* Create/edit form modal */}
      {isFormOpen && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-stone-900/40 backdrop-blur-sm" onClick={closeForm}>
         <div className="flex min-h-full items-center justify-center p-4">
          <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center gap-2">
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-stone-100">
                <Sparkles size={16} className="text-stone-700" />
              </div>
              <h2 className="text-lg font-bold text-stone-900">{editingId ? 'Redigér post' : 'Ny post'}</h2>
            </div>

            <div className="mt-4 flex flex-col gap-3">
              <div>
                <label className="text-xs font-semibold text-stone-500">Overskrift</label>
                <input value={formTitle} onChange={(e) => setFormTitle(e.target.value)}
                  className="mt-1 w-full rounded-xl border border-stone-200 px-3 py-2 text-sm outline-none focus:border-stone-400 focus:ring-4 focus:ring-stone-100"
                  placeholder="Fx “Betalingsintegration live”" autoFocus />
              </div>
              <div>
                <label className="text-xs font-semibold text-stone-500">Beskrivelse</label>
                <textarea value={formDescription} onChange={(e) => setFormDescription(e.target.value)} rows={3}
                  className="mt-1 w-full rounded-xl border border-stone-200 px-3 py-2 text-sm outline-none focus:border-stone-400 focus:ring-4 focus:ring-stone-100"
                  placeholder="Detaljer, der vises i pop op'en..." />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-semibold text-stone-500">Dato</label>
                  <input type="date" value={formDate} onChange={(e) => setFormDate(e.target.value)}
                    className="mt-1 w-full rounded-xl border border-stone-200 px-3 py-2 text-sm outline-none focus:border-stone-400 focus:ring-4 focus:ring-stone-100" />
                </div>
                <div>
                  <label className="text-xs font-semibold text-stone-500">Status</label>
                  <select value={formStatus} onChange={(e) => setFormStatus(e.target.value as Status)}
                    className="mt-1 w-full rounded-xl border border-stone-200 px-3 py-2 text-sm outline-none focus:border-stone-400 focus:ring-4 focus:ring-stone-100">
                    <option value="upcoming">Kommer</option>
                    <option value="in_progress">I gang</option>
                    <option value="done">Færdig</option>
                  </select>
                </div>
              </div>
              <div>
                <label className="text-xs font-semibold text-stone-500">Hvem</label>
                <div className="mt-1 flex gap-2">
                  {(['hajrudin', 'walid', 'begge'] as const).map((o) => (
                    <button
                      key={o}
                      type="button"
                      onClick={() => setFormOwner(o)}
                      className={`flex-1 rounded-xl border px-3 py-2 text-sm font-medium transition ${
                        formOwner === o
                          ? 'border-stone-900 bg-stone-900 text-white'
                          : 'border-stone-200 bg-white text-stone-600 hover:bg-stone-50'
                      }`}
                    >
                      {OWNER_LABEL[o]}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            <div className="mt-6 flex justify-end gap-2">
              <button onClick={closeForm} className="rounded-xl border border-stone-200 px-4 py-2 text-sm font-medium text-stone-600 hover:bg-stone-50">
                Annullér
              </button>
              <button onClick={handleSave} disabled={!canSave || isSaving}
                className="rounded-xl bg-stone-900 px-4 py-2 text-sm font-semibold text-white transition hover:bg-stone-800 disabled:opacity-40">
                {isSaving ? 'Gemmer...' : editingId ? 'Gem ændringer' : 'Opret post'}
              </button>
            </div>
          </div>
         </div>
        </div>
      )}
    </div>
  );
}