'use client';

import { createContext, useCallback, useContext, useRef, useState } from 'react';
import { CheckCircle2, XCircle, X, Undo2 } from 'lucide-react';

type ToastType = 'success' | 'error';
type Toast = { id: number; message: string; type: ToastType };
type UndoToast = { id: number; message: string; secondsLeft: number; onUndo: () => void };

const UNDO_WINDOW_MS = 5000;

const ToastContext = createContext<{
  showToast: (message: string, type?: ToastType) => void;
  /**
   * Viser en "Fortryd"-toast i UNDO_WINDOW_MS. Hvis brugeren ikke fortryder inden da,
   * køres `onCommit`. Klikker brugeren "Fortryd", køres `onUndo` i stedet, og `onCommit`
   * køres ALDRIG. Brug denne til destruktive handlinger der kan udskydes uden risiko
   * (fx sletning), ikke til handlinger der skal ske med det samme.
   */
  showUndoToast: (message: string, onCommit: () => void, onUndo: () => void) => void;
} | null>(null);

export function useToast() {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error('useToast skal bruges inden i ToastProvider');
  return ctx;
}

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);
  const [undoToasts, setUndoToasts] = useState<UndoToast[]>([]);
  const timersRef = useRef<Map<number, ReturnType<typeof setTimeout>>>(new Map());
  const intervalsRef = useRef<Map<number, ReturnType<typeof setInterval>>>(new Map());

  const showToast = useCallback((message: string, type: ToastType = 'success') => {
    const id = Date.now();
    setToasts((prev) => [...prev, { id, message, type }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 3000);
  }, []);

  const dismiss = (id: number) => setToasts((prev) => prev.filter((t) => t.id !== id));

  const showUndoToast = useCallback((message: string, onCommit: () => void, onUndo: () => void) => {
    const id = Date.now() + Math.random();
    setUndoToasts((prev) => [...prev, { id, message, secondsLeft: Math.ceil(UNDO_WINDOW_MS / 1000), onUndo }]);

    const interval = setInterval(() => {
      setUndoToasts((prev) =>
        prev.map((t) => (t.id === id ? { ...t, secondsLeft: Math.max(0, t.secondsLeft - 1) } : t))
      );
    }, 1000);
    intervalsRef.current.set(id, interval);

    const timer = setTimeout(() => {
      clearInterval(interval);
      intervalsRef.current.delete(id);
      timersRef.current.delete(id);
      setUndoToasts((prev) => prev.filter((t) => t.id !== id));
      onCommit();
    }, UNDO_WINDOW_MS);
    timersRef.current.set(id, timer);
  }, []);

  const handleUndoClick = (toast: UndoToast) => {
    const timer = timersRef.current.get(toast.id);
    const interval = intervalsRef.current.get(toast.id);
    if (timer) clearTimeout(timer);
    if (interval) clearInterval(interval);
    timersRef.current.delete(toast.id);
    intervalsRef.current.delete(toast.id);
    setUndoToasts((prev) => prev.filter((t) => t.id !== toast.id));
    toast.onUndo();
  };

  return (
    <ToastContext.Provider value={{ showToast, showUndoToast }}>
      {children}
      <div className="fixed bottom-6 right-6 z-[100] flex flex-col gap-2">
        {toasts.map((toast) => (
          <div
            key={toast.id}
            className={`flex items-center gap-2 rounded-xl px-4 py-3 text-sm font-medium text-white shadow-lg animate-in slide-in-from-bottom-2 ${
              toast.type === 'success' ? 'bg-stone-900' : 'bg-red-600'
            }`}
          >
            {toast.type === 'success' ? <CheckCircle2 size={16} /> : <XCircle size={16} />}
            {toast.message}
            <button onClick={() => dismiss(toast.id)} className="ml-2 opacity-60 hover:opacity-100">
              <X size={14} />
            </button>
          </div>
        ))}
        {undoToasts.map((toast) => (
          <div
            key={toast.id}
            className="flex items-center gap-3 rounded-xl bg-stone-900 px-4 py-3 text-sm font-medium text-white shadow-lg animate-in slide-in-from-bottom-2"
          >
            {toast.message}
            <button
              onClick={() => handleUndoClick(toast)}
              className="flex items-center gap-1 rounded-lg bg-white/15 px-2.5 py-1 text-xs font-semibold transition hover:bg-white/25"
            >
              <Undo2 size={12} />
              Fortryd ({toast.secondsLeft}s)
            </button>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}