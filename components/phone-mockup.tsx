import { Utensils, Wallet, HeartPulse } from 'lucide-react';

/**
 * Stand-in for a real product screenshot. Everything inside the "screen" div
 * is fake UI built with plain markup — swap it for an <Image src="..."> of
 * an actual app screenshot once one exists, and this frame still works as-is.
 */
export function PhoneMockup() {
  return (
    <div className="relative mx-auto w-[260px] sm:w-[280px]">
      {/* Phone frame */}
      <div className="rounded-[2.5rem] border-[6px] border-stone-800 bg-stone-800 shadow-2xl shadow-black/40">
        <div className="overflow-hidden rounded-[2rem] bg-[#FBF7F1]">
          {/* Fake status bar */}
          <div className="flex items-center justify-between px-5 pt-3 text-[10px] font-semibold text-stone-500">
            <span>9:41</span>
            <span>●●●</span>
          </div>

          {/* Fake app header */}
          <div className="px-5 pt-4">
            <p className="text-xs text-stone-400">God morgen,</p>
            <p className="font-display text-lg font-semibold text-stone-900">Hajro</p>
          </div>

          {/* Fake content cards */}
          <div className="flex flex-col gap-2.5 px-4 pb-6 pt-4">
            <div className="rounded-xl bg-white p-3 shadow-sm shadow-stone-900/5">
              <div className="flex items-center gap-2">
                <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-amber-100">
                  <Utensils size={13} className="text-amber-600" />
                </div>
                <div className="min-w-0">
                  <p className="truncate text-xs font-semibold text-stone-800">Madplan i dag</p>
                  <p className="truncate text-[11px] text-stone-400">Kylling i karry</p>
                </div>
              </div>
            </div>

            <div className="rounded-xl bg-white p-3 shadow-sm shadow-stone-900/5">
              <div className="flex items-center gap-2">
                <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-emerald-100">
                  <Wallet size={13} className="text-emerald-600" />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-xs font-semibold text-stone-800">Budget denne måned</p>
                  <div className="mt-1.5 h-1.5 w-full overflow-hidden rounded-full bg-stone-100">
                    <div className="h-full w-[68%] rounded-full bg-emerald-500" />
                  </div>
                </div>
              </div>
            </div>

            <div className="rounded-xl bg-white p-3 shadow-sm shadow-stone-900/5">
              <div className="flex items-center gap-2">
                <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-rose-100">
                  <HeartPulse size={13} className="text-rose-600" />
                </div>
                <div className="min-w-0">
                  <p className="truncate text-xs font-semibold text-stone-800">Cyklus</p>
                  <p className="truncate text-[11px] text-stone-400">Dag 14 · normal fase</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Peeking card: Madplan */}
      <div className="absolute -left-10 top-16 hidden w-40 rounded-xl bg-white p-3 shadow-xl shadow-black/10 sm:block">
        <div className="flex items-center gap-2">
          <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-amber-100">
            <Utensils size={13} className="text-amber-600" />
          </div>
          <div className="min-w-0">
            <p className="truncate text-[11px] font-semibold text-stone-800">Ugens madplan</p>
            <p className="truncate text-[10px] text-stone-400">Klar til tirsdag</p>
          </div>
        </div>
      </div>

      {/* Peeking card: Budget */}
      <div className="absolute -right-8 bottom-24 hidden w-36 rounded-xl bg-white p-3 shadow-xl shadow-black/10 sm:block">
        <p className="text-[11px] font-semibold text-stone-800">Opsparing</p>
        <p className="mt-0.5 text-[10px] text-stone-400">+420 kr. denne uge</p>
      </div>
    </div>
  );
}