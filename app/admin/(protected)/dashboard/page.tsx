import { Tag, Percent, BookOpen, Store, Inbox } from 'lucide-react';
import { createClient } from '@/lib/supabase/server';

export default async function DashboardPage() {
  const supabase = await createClient();

  const [pricesCount, offersCount, recipesCount, storesResult, openTicketsCount] = await Promise.all([
    supabase.from('global_standard_prices').select('id', { count: 'exact', head: true }),
    supabase.from('global_offers').select('id', { count: 'exact', head: true }),
    supabase.from('global_recipes').select('id', { count: 'exact', head: true }),
    supabase.from('global_standard_prices').select('store'),
    supabase.from('support_tickets').select('id', { count: 'exact', head: true }).eq('status', 'open'),
  ]);

  const uniqueStores = new Set((storesResult.data ?? []).map((r) => r.store)).size;

  const stats = [
    { label: 'Standardpriser', value: pricesCount.count ?? 0, icon: Tag, color: 'from-rose-500 to-rose-600' },
    { label: 'Ugens tilbud', value: offersCount.count ?? 0, icon: Percent, color: 'from-emerald-500 to-emerald-600' },
    { label: 'Opskrifter', value: recipesCount.count ?? 0, icon: BookOpen, color: 'from-amber-500 to-amber-600' },
    { label: 'Butikker', value: uniqueStores, icon: Store, color: 'from-sky-500 to-sky-600' },
    { label: 'Åbne supportsager', value: openTicketsCount.count ?? 0, icon: Inbox, color: 'from-stone-600 to-stone-700' },
  ];

  return (
    <div>
      <h1 className="text-2xl font-bold text-stone-900">Oversigt</h1>
      <p className="mt-1 text-sm text-stone-500">Velkommen til LifeSort Admin.</p>

      <div className="mt-8 grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-5">
        {stats.map((stat) => (
          <div
            key={stat.label}
            className="rounded-2xl border border-stone-200 bg-white p-5 shadow-sm shadow-stone-900/5"
          >
            <div className={`flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br ${stat.color}`}>
              <stat.icon className="h-5 w-5 text-white" strokeWidth={2.2} />
            </div>
            <p className="mt-4 text-2xl font-bold text-stone-900">{stat.value}</p>
            <p className="text-xs font-medium text-stone-500">{stat.label}</p>
          </div>
        ))}
      </div>
    </div>
  );
}