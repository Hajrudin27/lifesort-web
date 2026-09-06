import { ScrollReveal } from '@/components/scroll-reveal';

/**
 * Fælles skelet for de juridiske sider (privatlivspolitik og vilkår).
 *
 * De to sider har samme opbygning — nummererede afsnit som kort, med ikon og
 * tabeller — og lå tidligere som to identiske kopier i hver sin fil. Ét sted
 * betyder også, at et layoutfix ikke kan nå at ramme den ene side og glemme
 * den anden.
 */

export const legalTints = {
  rose: 'bg-rose-100 text-rose-600',
  emerald: 'bg-emerald-100 text-emerald-600',
  amber: 'bg-amber-100 text-amber-600',
  sky: 'bg-sky-100 text-sky-600',
  violet: 'bg-violet-100 text-violet-600',
  stone: 'bg-stone-100 text-stone-600',
} as const;

export type LegalTint = keyof typeof legalTints;

export function LegalSection({
  id,
  number,
  icon: Icon,
  title,
  tint = 'stone',
  children,
}: {
  id: string;
  number: number;
  icon: React.ComponentType<{ className?: string; strokeWidth?: number }>;
  title: string;
  tint?: LegalTint;
  children: React.ReactNode;
}) {
  return (
    <ScrollReveal>
      <section id={id} className="scroll-mt-24 rounded-2xl border border-stone-200 bg-white p-6 shadow-sm shadow-stone-900/5 sm:p-7">
        <div className="flex items-start gap-4">
          <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${legalTints[tint]}`}>
            <Icon className="h-5 w-5" strokeWidth={2.2} />
          </div>
          <div className="min-w-0">
            <p className="text-[11px] font-bold uppercase tracking-wider text-stone-400">Afsnit {number}</p>
            <h2 className="font-display mt-0.5 text-xl font-semibold leading-snug text-stone-900">{title}</h2>
          </div>
        </div>
        <div className="mt-5 flex flex-col gap-3 text-sm leading-relaxed text-stone-600">{children}</div>
      </section>
    </ScrollReveal>
  );
}

export function LegalTable({ headers, rows }: { headers: string[]; rows: React.ReactNode[][] }) {
  return (
    <div className="-mx-1 overflow-x-auto">
      <table className="w-full min-w-[34rem] border-collapse text-left text-sm">
        <thead>
          <tr className="border-b border-stone-200">
            {headers.map((header) => (
              <th key={header} className="px-2 pb-2 text-xs font-bold uppercase tracking-wider text-stone-400">
                {header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-stone-100">
          {rows.map((row, index) => (
            <tr key={index} className="align-top">
              {row.map((cell, cellIndex) => (
                <td
                  key={cellIndex}
                  className={`px-2 py-3 leading-relaxed ${cellIndex === 0 ? 'font-semibold text-stone-900' : 'text-stone-600'}`}
                >
                  {cell}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
