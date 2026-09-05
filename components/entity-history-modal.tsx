'use client';

import { useEffect, useState } from 'react';
import { X, History, Plus, Pencil, Trash2, Send, UserPlus } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import type { ActivityEntityType } from '@/lib/activity-log';

type HistoryEntry = {
  id: string;
  action: string;
  actor_name: string;
  entity_label: string;
  created_at: string;
};

const ACTION_META: Record<string, { label: string; icon: typeof Plus; color: string }> = {
  created: { label: 'Oprettet', icon: Plus, color: 'text-emerald-600 bg-emerald-100 dark:bg-emerald-500/15 dark:text-emerald-400' },
  updated: { label: 'Opdateret', icon: Pencil, color: 'text-amber-600 bg-amber-100 dark:bg-amber-500/15 dark:text-amber-400' },
  deleted: { label: 'Slettet', icon: Trash2, color: 'text-red-600 bg-red-100 dark:bg-red-500/15 dark:text-red-400' },
  replied: { label: 'Besvaret', icon: Send, color: 'text-sky-600 bg-sky-100 dark:bg-sky-500/15 dark:text-sky-400' },
  invited: { label: 'Inviteret', icon: UserPlus, color: 'text-violet-600 bg-violet-100 dark:bg-violet-500/15 dark:text-violet-400' },
};

function formatWhen(iso: string) {
  return new Date(iso).toLocaleString('da-DK', {
    day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit',
  });
}

export function EntityHistoryModal({
  entityType,
  entityId,
  title,
  onClose,
}: {
  entityType: ActivityEntityType;
  entityId: string;
  title: string;
  onClose: () => void;
}) {
  const supabase = createClient();
  const [entries, setEntries] = useState<HistoryEntry[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const { data } = await supabase
        .from('activity_log')
        .select('id, action, actor_name, entity_label, created_at')
        .eq('entity_type', entityType)
        .eq('entity_id', entityId)
        .order('created_at', { ascending: false });
      if (!cancelled) {
        setEntries(data ?? []);
        setIsLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, [supabase, entityType, entityId]);

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-stone-900/40 backdrop-blur-sm" onClick={onClose}>
      <div className="flex min-h-full items-center justify-center p-4">
        <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl dark:bg-stone-900" onClick={(e) => e.stopPropagation()}>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-stone-100 dark:bg-stone-800">
                <History size={16} className="text-stone-700 dark:text-stone-300" />
              </div>
              <div>
                <h2 className="text-sm font-bold text-stone-900 dark:text-stone-100">Historik</h2>
                <p className="max-w-[220px] truncate text-xs text-stone-500 dark:text-stone-400">{title}</p>
              </div>
            </div>
            <button onClick={onClose} className="text-stone-400 hover:text-stone-600 dark:hover:text-stone-300">
              <X size={18} />
            </button>
          </div>

          <div className="mt-4 max-h-80 overflow-y-auto">
            {isLoading ? (
              <div className="flex flex-col gap-2">
                {Array.from({ length: 3 }).map((_, i) => (
                  <div key={i} className="h-12 animate-pulse rounded-xl bg-stone-100 dark:bg-stone-800" />
                ))}
              </div>
            ) : entries.length === 0 ? (
              <p className="py-8 text-center text-sm text-stone-400 dark:text-stone-500">Ingen historik endnu.</p>
            ) : (
              <div className="relative pl-2">
                <div className="absolute bottom-2 left-[15px] top-2 w-px bg-stone-100 dark:bg-stone-800" />
                <div className="flex flex-col gap-4">
                  {entries.map((entry) => {
                    const meta = ACTION_META[entry.action] ?? ACTION_META.updated;
                    const Icon = meta.icon;
                    return (
                      <div key={entry.id} className="relative flex gap-3">
                        <span className={`relative z-10 flex h-7 w-7 shrink-0 items-center justify-center rounded-full ${meta.color}`}>
                          <Icon size={12} />
                        </span>
                        <div className="pb-1">
                          <p className="text-xs font-semibold text-stone-800 dark:text-stone-200">
                            {meta.label} af {entry.actor_name}
                          </p>
                          <p className="text-[11px] text-stone-400 dark:text-stone-500">{formatWhen(entry.created_at)}</p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
