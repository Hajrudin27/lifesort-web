-- Angrebs- og regressionstest for deling af ture.
-- Kør mod en lokal Supabase: supabase start && psql "$DB" -X -f supabase/tests/trip_sharing_rls_test.sql
\set ON_ERROR_STOP on
\set QUIET on
set client_min_messages = notice;

delete from auth.users where email in ('victim@test.local','attacker@test.local','accomplice@test.local');

insert into auth.users (id, instance_id, aud, role, email, encrypted_password, created_at, updated_at)
values
  ('11111111-1111-1111-1111-111111111111','00000000-0000-0000-0000-000000000000','authenticated','authenticated','victim@test.local','x',now(),now()),
  ('22222222-2222-2222-2222-222222222222','00000000-0000-0000-0000-000000000000','authenticated','authenticated','attacker@test.local','x',now(),now()),
  ('33333333-3333-3333-3333-333333333333','00000000-0000-0000-0000-000000000000','authenticated','authenticated','accomplice@test.local','x',now(),now());

insert into public.trips (id, user_id, name, start_date, end_date)
values ('trip-1','11111111-1111-1111-1111-111111111111','Offerets Rom-tur','2026-10-01','2026-10-08');
insert into public.trip_expenses (id, user_id, trip_id, name, amount, category)
values ('exp-1','11111111-1111-1111-1111-111111111111','trip-1','Hotel',4200,'ophold');
insert into public.trip_packing_items (id, user_id, trip_id, label)
values ('pack-1','11111111-1111-1111-1111-111111111111','trip-1','Pas');

do $$
declare
  victim   uuid := '11111111-1111-1111-1111-111111111111';
  attacker uuid := '22222222-2222-2222-2222-222222222222';
  n int;
  pass int := 0; fail int := 0;
begin
  raise notice '';
  raise notice '=== ANGREB (som "attacker") ===';

  perform set_config('request.jwt.claims', json_build_object('sub', attacker, 'role','authenticated')::text, true);
  execute 'set local role authenticated';

  -- A) direkte selv-invitation til en fremmed tur
  begin
    insert into public.trip_participants (trip_id, owner_id, user_id, invited_email, status)
    values ('trip-1', attacker, attacker, 'attacker@test.local', 'accepted');
    raise notice 'A) selv-invitation til fremmed tur ............... SÅRBAR'; fail := fail + 1;
  exception when insufficient_privilege or check_violation then
    raise notice 'A) selv-invitation til fremmed tur ............... BLOKERET'; pass := pass + 1;
  end;

  -- F) misbrug af RPC: inviter en konto man selv styrer til offerets tur
  begin
    perform public.invite_trip_participant('trip-1', 'accomplice@test.local');
    raise notice 'F) RPC-invitation til fremmed tur ............... SÅRBAR'; fail := fail + 1;
  exception when others then
    if sqlerrm like '%trip_not_found%' then
      raise notice 'F) RPC-invitation til fremmed tur ............... BLOKERET'; pass := pass + 1;
    else
      raise notice 'F) RPC-invitation til fremmed tur ............... UVENTET (%)', sqlerrm; fail := fail + 1;
    end if;
  end;

  -- G) kollision: opret egen tur med offerets tur-id
  begin
    insert into public.trips (id, user_id, name, start_date, end_date)
      values ('trip-1', attacker, 'Min egen tur', '2026-10-01','2026-10-08');
    raise notice 'G) oprette tur med offerets tur-id .............. SÅRBAR'; fail := fail + 1;
  exception when unique_violation then
    raise notice 'G) oprette tur med offerets tur-id .............. BLOKERET'; pass := pass + 1;
  end;

  -- E) fabrikeret accept på egen tur
  insert into public.trips (id, user_id, name, start_date, end_date)
    values ('trip-a', attacker, 'Angriberens tur', '2026-10-01','2026-10-08');
  begin
    insert into public.trip_participants (trip_id, owner_id, user_id, invited_email, status)
      values ('trip-a', attacker, victim, 'victim@test.local', 'accepted');
    raise notice 'E) fabrikere at offeret har accepteret .......... SÅRBAR'; fail := fail + 1;
  exception when insufficient_privilege or check_violation then
    raise notice 'E) fabrikere at offeret har accepteret .......... BLOKERET'; pass := pass + 1;
  end;

  -- C) læse/ændre offerets data
  select count(*) into n from public.trips where user_id = victim;
  if n = 0 then raise notice 'C1) læse offerets tur ........................... BLOKERET'; pass := pass + 1;
  else raise notice 'C1) læse offerets tur ........................... SÅRBAR (%)', n; fail := fail + 1; end if;

  select count(*) into n from public.trip_expenses where user_id = victim;
  if n = 0 then raise notice 'C2) læse offerets rejseudgifter ................. BLOKERET'; pass := pass + 1;
  else raise notice 'C2) læse offerets rejseudgifter ................. SÅRBAR (%)', n; fail := fail + 1; end if;

  select count(*) into n from public.trip_packing_items where user_id = victim;
  if n = 0 then raise notice 'C3) læse offerets pakkeliste .................... BLOKERET'; pass := pass + 1;
  else raise notice 'C3) læse offerets pakkeliste .................... SÅRBAR (%)', n; fail := fail + 1; end if;

  update public.trip_expenses set amount = 1 where user_id = victim;
  get diagnostics n = row_count;
  if n = 0 then raise notice 'C4) ændre offerets rejseudgift .................. BLOKERET'; pass := pass + 1;
  else raise notice 'C4) ændre offerets rejseudgift .................. SÅRBAR'; fail := fail + 1; end if;

  delete from public.trips where user_id = victim;
  get diagnostics n = row_count;
  if n = 0 then raise notice 'C5) slette offerets tur ......................... BLOKERET'; pass := pass + 1;
  else raise notice 'C5) slette offerets tur ......................... SÅRBAR'; fail := fail + 1; end if;

  execute 'reset role';
  delete from public.trip_participants where owner_id = attacker;
  delete from public.trips where user_id = attacker;

  -- ---------- legitim deling, præcis som appen gør det ----------
  raise notice '';
  raise notice '=== LEGITIM DELING ===';
  insert into public.trips (id, user_id, name, start_date, end_date)
    values ('trip-2', victim, 'Offerets Paris-tur', '2026-11-01','2026-11-05');

  perform set_config('request.jwt.claims', json_build_object('sub', victim, 'role','authenticated')::text, true);
  execute 'set local role authenticated';
  begin
    perform public.invite_trip_participant('trip-2', 'attacker@test.local');
    raise notice 'D1) ejer kan invitere via RPC ................... OK'; pass := pass + 1;
  exception when others then
    raise notice 'D1) ejer kan invitere via RPC ................... BRUDT (%)', sqlerrm; fail := fail + 1;
  end;
  execute 'reset role';

  perform set_config('request.jwt.claims', json_build_object('sub', attacker, 'role','authenticated')::text, true);
  execute 'set local role authenticated';

  update public.trip_participants set status = 'accepted'
   where trip_id = 'trip-2' and user_id = attacker;
  get diagnostics n = row_count;
  if n = 1 then raise notice 'D2) inviteret kan acceptere ..................... OK'; pass := pass + 1;
  else raise notice 'D2) inviteret kan acceptere ..................... BRUDT'; fail := fail + 1; end if;

  -- B) flytte den accepterede invitation over på en anden tur
  begin
    update public.trip_participants set trip_id = 'trip-1'
     where trip_id = 'trip-2' and user_id = attacker;
    raise notice 'B) flytte invitation til anden tur .............. SÅRBAR'; fail := fail + 1;
  exception when insufficient_privilege then
    raise notice 'B) flytte invitation til anden tur .............. BLOKERET'; pass := pass + 1;
  end;

  select count(*) into n from public.trips where id = 'trip-2';
  if n = 1 then raise notice 'D3) delt tur er synlig for deltager ............. OK'; pass := pass + 1;
  else raise notice 'D3) delt tur er synlig for deltager ............. BRUDT'; fail := fail + 1; end if;

  begin
    insert into public.trip_expenses (id, user_id, trip_id, name, amount, category)
      values ('exp-2', attacker, 'trip-2', 'Togbillet', 300, 'transport');
    raise notice 'D4) deltager kan tilføje udgift ................. OK'; pass := pass + 1;
  exception when others then
    raise notice 'D4) deltager kan tilføje udgift ................. BRUDT (%)', sqlerrm; fail := fail + 1;
  end;

  select count(*) into n from public.trip_expenses where trip_id = 'trip-2' and user_id = victim;
  execute 'reset role';

  perform set_config('request.jwt.claims', json_build_object('sub', victim, 'role','authenticated')::text, true);
  execute 'set local role authenticated';
  select count(*) into n from public.trips where id = 'trip-1' and user_id = victim;
  if n = 1 then raise notice 'D5) ejer ser stadig sin egen tur ................ OK'; pass := pass + 1;
  else raise notice 'D5) ejer ser stadig sin egen tur ................ BRUDT'; fail := fail + 1; end if;

  select count(*) into n from public.trip_expenses where trip_id = 'trip-2';
  raise notice '    (info) ejer ser % udgift(er) på den delte tur — appen henter i dag kun sine egne', n;

  execute 'reset role';
  raise notice '';
  if fail = 0 then
    raise notice '=== RESULTAT: alle % tests bestået ===', pass;
  else
    raise notice '=== RESULTAT: % bestået, % FEJLET ===', pass, fail;
  end if;
end $$;

delete from auth.users where email in ('victim@test.local','attacker@test.local','accomplice@test.local');
