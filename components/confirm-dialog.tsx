'use client';

import { createContext, useCallback, useContext, useState } from 'react';
import { AlertTriangle } from 'lucide-react';

type ConfirmOptions = { title: string; message: string };

const ConfirmContext = createContext<{
  confirm: (options: ConfirmOptions) => Promise<boolean>;
} | null>(null);

export function useConfirm() {
  const ctx = useContext(ConfirmContext);
  if (!ctx) throw new Error('useConfirm skal bruges inden i ConfirmProvider');
  return ctx.confirm;
}

export function ConfirmProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState<{
    options: ConfirmOptions;
    resolve: (value: boolean) => void;
  } | null>(null);

  const confirm = useCallback((options: ConfirmOptions) => {
    return new Promise<boolean>((resolve) => {
      setState({ options, resolve });
    });
  }, []);

  const handle = (value: boolean) => {
    state?.resolve(value);
    setState(null);
  };

  return (
    <ConfirmContext.Provider value={{ confirm }}>
      {children}
      {state && (
        <div className="fixed inset-0 z-[110] flex items-center justify-center bg-stone-900/40 backdrop-blur-sm" onClick={() => handle(false)}>
          <div className="w-full max-w-sm rounded-2xl bg-white p-6 shadow-2xl" onClick={(e) => e.stopPropagation()}>
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-red-100">
              <AlertTriangle size={18} className="text-red-600" />
            </div>
            <h2 className="mt-3 text-lg font-bold text-stone-900">{state.options.title}</h2>
            <p className="mt-1 text-sm text-stone-600">{state.options.message}</p>
            <div className="mt-5 flex justify-end gap-2">
              <button onClick={() => handle(false)} className="rounded-xl border border-stone-200 px-4 py-2 text-sm font-medium text-stone-600 hover:bg-stone-50">
                Annullér
              </button>
              <button onClick={() => handle(true)} className="rounded-xl bg-red-600 px-4 py-2 text-sm font-semibold text-white hover:bg-red-700">
                Slet
              </button>
            </div>
          </div>
        </div>
      )}
    </ConfirmContext.Provider>
  );
}