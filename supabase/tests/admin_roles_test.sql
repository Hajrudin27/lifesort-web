-- Verificerer at admin_users.role håndhæves i DATABASEN, ikke kun i UI'et.
-- Kør: supabase start && psql "$DB" -X -f supabase/tests/admin_roles_test.sql
\set ON_ERROR_STOP on
\set QUIET on
set client_min_messages = notice;

delete from public.admin_users where full_name like 'Rolletest%';
delete from auth.users where email like '%@roletest.local';

insert into auth.users (id, instance_id, aud, role, email, encrypted_password, created_at, updated_at)
values
  ('aaaaaaaa-0000-0000-0000-000000000001','00000000-0000-0000-0000-000000000000','authenticated','authenticated','owner@roletest.local','x',now(),now()),
  ('aaaaaaaa-0000-0000-0000-000000000002','00000000-0000-0000-0000-000000000000','authenticated','authenticated','editor@roletest.local','x',now(),now()),
  ('aaaaaaaa-0000-0000-0000-000000000003','00000000-0000-0000-0000-000000000000','authenticated','authenticated','support@roletest.local','x',now(),now());

insert into public.admin_users (id, role, full_name) values
  ('aaaaaaaa-0000-0000-0000-000000000001','owner','Rolletest Owner'),
  ('aaaaaaaa-0000-0000-0000-000000000002','editor','Rolletest Editor'),
  ('aaaaaaaa-0000-0000-0000-000000000003','support','Rolletest Support');

insert into public.support_tickets (id, name, email, subject, message)
values ('bbbbbbbb-0000-0000-0000-000000000001','Kunde','kunde@example.dk','Emne','Fortrolig besked');
insert into public.waitlist_signups (email, platform) values ('venter@example.dk','ios');
insert into public.timeline_events (title, event_date, owners) values ('Milepæl','2026-12-01', array['hajrudin']);
insert into public.products (id, name) values ('cccccccc-0000-0000-0000-000000000001','Testprodukt');

do $$
declare
  owner_id   uuid := 'aaaaaaaa-0000-0000-0000-000000000001';
  editor_id  uuid := 'aaaaaaaa-0000-0000-0000-000000000002';
  support_id uuid := 'aaaaaaaa-0000-0000-0000-000000000003';
  n int; pass int := 0; fail int := 0;
begin
  ---------------------------------------------------------------- EDITOR
  raise notice '';
  raise notice '=== EDITOR ===';
  perform set_config('request.jwt.claims', json_build_object('sub', editor_id, 'role','authenticated')::text, true);
  execute 'set local role authenticated';

  begin
    insert into public.products (name) values ('Editor-produkt');
    raise notice 'må oprette produkter ....................... OK'; pass := pass + 1;
  exception when others then
    raise notice 'må oprette produkter ....................... BRUDT (%)', sqlerrm; fail := fail + 1;
  end;

  begin
    insert into public.timeline_events (title, event_date, owners) values ('Editor-milepæl','2026-12-02', array['walid']);
    raise notice 'må oprette tidslinjepunkter ................ OK'; pass := pass + 1;
  exception when others then
    raise notice 'må oprette tidslinjepunkter ................ BRUDT (%)', sqlerrm; fail := fail + 1;
  end;

  select count(*) into n from public.support_tickets;
  if n = 0 then raise notice 'kan IKKE læse supportsager ................. BLOKERET'; pass := pass + 1;
  else raise notice 'kan IKKE læse supportsager ................. SÅRBAR (% rækker)', n; fail := fail + 1; end if;

  update public.support_tickets set internal_note = 'hacked';
  get diagnostics n = row_count;
  if n = 0 then raise notice 'kan IKKE ændre supportsager ................ BLOKERET'; pass := pass + 1;
  else raise notice 'kan IKKE ændre supportsager ................ SÅRBAR'; fail := fail + 1; end if;

  select count(*) into n from public.waitlist_signups;
  if n = 0 then raise notice 'kan IKKE læse ventelisten .................. BLOKERET'; pass := pass + 1;
  else raise notice 'kan IKKE læse ventelisten .................. SÅRBAR (% rækker)', n; fail := fail + 1; end if;

  execute 'reset role';

  ---------------------------------------------------------------- SUPPORT
  raise notice '';
  raise notice '=== SUPPORT ===';
  perform set_config('request.jwt.claims', json_build_object('sub', support_id, 'role','authenticated')::text, true);
  execute 'set local role authenticated';

  select count(*) into n from public.support_tickets;
  if n >= 1 then raise notice 'må læse supportsager ....................... OK'; pass := pass + 1;
  else raise notice 'må læse supportsager ....................... BRUDT'; fail := fail + 1; end if;

  update public.support_tickets set status = 'answered' where email = 'kunde@example.dk';
  get diagnostics n = row_count;
  if n = 1 then raise notice 'må besvare supportsager .................... OK'; pass := pass + 1;
  else raise notice 'må besvare supportsager .................... BRUDT'; fail := fail + 1; end if;

  select count(*) into n from public.waitlist_signups;
  if n >= 1 then raise notice 'må læse ventelisten ........................ OK'; pass := pass + 1;
  else raise notice 'må læse ventelisten ........................ BRUDT'; fail := fail + 1; end if;

  begin
    insert into public.products (name) values ('Support-produkt');
    raise notice 'kan IKKE oprette produkter ................. SÅRBAR'; fail := fail + 1;
  exception when insufficient_privilege then
    raise notice 'kan IKKE oprette produkter ................. BLOKERET'; pass := pass + 1;
  end;

  begin
    insert into public.global_recipes (name, meal_type) values ('Support-opskrift','dinner');
    raise notice 'kan IKKE oprette opskrifter ................ SÅRBAR'; fail := fail + 1;
  exception when insufficient_privilege then
    raise notice 'kan IKKE oprette opskrifter ................ BLOKERET'; pass := pass + 1;
  end;

  begin
    insert into public.health_conditions (id, name_da, name_en, summary_da, summary_en, what_it_is_da, what_it_is_en, what_helps_da, what_helps_en, when_to_see_doctor_da, when_to_see_doctor_en)
    values ('x','a','a','a','a','a','a','a','a','a','a');
    raise notice 'kan IKKE oprette sundhedsindhold ........... SÅRBAR'; fail := fail + 1;
  exception when insufficient_privilege then
    raise notice 'kan IKKE oprette sundhedsindhold ........... BLOKERET'; pass := pass + 1;
  end;

  update public.products set name = 'kapret' where id = 'cccccccc-0000-0000-0000-000000000001';
  get diagnostics n = row_count;
  if n = 0 then raise notice 'kan IKKE ændre produkter ................... BLOKERET'; pass := pass + 1;
  else raise notice 'kan IKKE ændre produkter ................... SÅRBAR'; fail := fail + 1; end if;

  select count(*) into n from public.timeline_events;
  if n = 0 then raise notice 'kan IKKE læse tidslinjen ................... BLOKERET'; pass := pass + 1;
  else raise notice 'kan IKKE læse tidslinjen ................... SÅRBAR (% rækker)', n; fail := fail + 1; end if;

  execute 'reset role';

  ---------------------------------------------------------------- OWNER
  raise notice '';
  raise notice '=== OWNER ===';
  perform set_config('request.jwt.claims', json_build_object('sub', owner_id, 'role','authenticated')::text, true);
  execute 'set local role authenticated';

  select count(*) into n from public.support_tickets;
  if n >= 1 then raise notice 'må læse supportsager ....................... OK'; pass := pass + 1;
  else raise notice 'må læse supportsager ....................... BRUDT'; fail := fail + 1; end if;

  begin
    insert into public.products (name) values ('Owner-produkt');
    raise notice 'må oprette produkter ....................... OK'; pass := pass + 1;
  exception when others then
    raise notice 'må oprette produkter ....................... BRUDT (%)', sqlerrm; fail := fail + 1;
  end;

  select count(*) into n from public.timeline_events;
  if n >= 1 then raise notice 'må læse tidslinjen ......................... OK'; pass := pass + 1;
  else raise notice 'må læse tidslinjen ......................... BRUDT'; fail := fail + 1; end if;

  execute 'reset role';
  raise notice '';
  if fail = 0 then raise notice '=== RESULTAT: alle % tests bestået ===', pass;
  else raise notice '=== RESULTAT: % bestået, % FEJLET ===', pass, fail; end if;
end $$;

delete from public.admin_users where full_name like 'Rolletest%';
delete from auth.users where email like '%@roletest.local';
