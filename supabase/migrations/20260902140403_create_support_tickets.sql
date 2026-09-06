-- Denne migration var tom: tabellen blev oprettet direkte i produktion og aldrig skrevet
-- ned. Det betød at RLS på en tabel med navne, emails og fritekst fra brugere ikke kunne
-- auditeres i repoet, og at `supabase db reset` fejlede, fordi den senere migration
-- 20260905214336_enhance_support_tickets forsøgte at ALTER'e en tabel der ikke fandtes.
--
-- Indholdet her er rekonstrueret fra produktionsskemaet (supabase db dump) og svarer til
-- tabellen FØR enhance-migrationen — kolonnerne priority/category/internal_note/updated_at
-- tilføjes stadig af den. Alt er idempotent, så den er en no-op på databaser der allerede
-- har tabellen.

create table if not exists public.support_tickets (
  id          uuid primary key default gen_random_uuid(),
  name        text not null,
  email       text not null,
  subject     text not null,
  message     text not null,
  status      text not null default 'open' check (status in ('open', 'answered', 'closed')),
  admin_reply text,
  replied_at  timestamptz,
  created_at  timestamptz not null default now()
);

alter table public.support_tickets enable row level security;

-- Der er med vilje INGEN insert-policy: offentlige henvendelser oprettes udelukkende af
-- /api/submit-ticket med service role-nøglen, så anon aldrig kan skrive direkte i tabellen.
drop policy if exists "Admins can view tickets" on public.support_tickets;
create policy "Admins can view tickets"
  on public.support_tickets for select
  to authenticated
  using (exists (select 1 from public.admin_users where id = auth.uid()));

drop policy if exists "Admins can update tickets" on public.support_tickets;
create policy "Admins can update tickets"
  on public.support_tickets for update
  to authenticated
  using (exists (select 1 from public.admin_users where id = auth.uid()))
  with check (exists (select 1 from public.admin_users where id = auth.uid()));
