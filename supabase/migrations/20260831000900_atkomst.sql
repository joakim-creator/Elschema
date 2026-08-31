-- F0-12  Åtkomstkontroll på samtliga tabeller (spec avsnitt 6).
--
-- Två sorters tabeller:
--   projektinnehåll — syns bara för projektets ägare
--   bibliotek       — systemets rader syns för alla och ägs av ingen,
--                     egna rader syns bara för sin ägare
--
-- Hjälpfunktionerna är security definer för att slippa rekursion: en policy som
-- frågar projekt-tabellen skulle annars utvärdera projekt-tabellens egen policy.

create or replace function ager_projekt(p uuid)
returns boolean language sql stable security definer set search_path = public, pg_temp as $$
  select exists (select 1 from projekt where id = p and agare = auth.uid());
$$;

create or replace function ser_bibliotekspost(a uuid)
returns boolean language sql stable as $$
  select a is null or a = auth.uid();
$$;

create or replace function ager_bibliotekspost(a uuid)
returns boolean language sql stable as $$
  select a is not null and a = auth.uid();
$$;

create or replace function agare_av_enhetsmall(m uuid)
returns uuid language sql stable security definer set search_path = public, pg_temp as $$
  select agare from enhetsmall where id = m;
$$;

create or replace function agare_av_komponentmall(m uuid)
returns uuid language sql stable security definer set search_path = public, pg_temp as $$
  select agare from komponentmall where id = m;
$$;

create or replace function agare_via_kontaktdonsmall(k uuid)
returns uuid language sql stable security definer set search_path = public, pg_temp as $$
  select e.agare from kontaktdonsmall d join enhetsmall e on e.id = d.enhetsmall_id where d.id = k;
$$;

create or replace function agare_via_portmall(p uuid)
returns uuid language sql stable security definer set search_path = public, pg_temp as $$
  select e.agare from portmall m join enhetsmall e on e.id = m.enhetsmall_id where m.id = p;
$$;

create or replace function projekt_for_enhet(e uuid)
returns uuid language sql stable security definer set search_path = public, pg_temp as $$
  select projekt_id from enhet where id = e;
$$;

create or replace function projekt_for_komponent(k uuid)
returns uuid language sql stable security definer set search_path = public, pg_temp as $$
  select projekt_id from komponent where id = k;
$$;

create or replace function projekt_for_blad(b uuid)
returns uuid language sql stable security definer set search_path = public, pg_temp as $$
  select projekt_id from blad where id = b;
$$;

-- ---------- konton ----------

alter table profiler enable row level security;
create policy profil_ser_sig_sjalv on profiler for select using (id = auth.uid());
create policy profil_uppdaterar_sig_sjalv on profiler for update using (id = auth.uid());

-- Inga policyer: bara service_role kommer åt koderna.
alter table inbjudningskod enable row level security;

-- ---------- projekt och dess innehåll ----------

alter table projekt enable row level security;
create policy projekt_agare_ser on projekt for select using (agare = auth.uid());
create policy projekt_agare_skapar on projekt for insert with check (agare = auth.uid());
create policy projekt_agare_andrar on projekt for update using (agare = auth.uid());
create policy projekt_agare_raderar on projekt for delete using (agare = auth.uid());

do $block$
declare t text;
begin
  foreach t in array array['zon', 'enhet', 'komponent', 'jordpunkt', 'skarvpunkt', 'nod', 'kabel', 'blad']
  loop
    execute format('alter table %I enable row level security', t);
    execute format(
      'create policy %I on %I for all using (ager_projekt(projekt_id)) with check (ager_projekt(projekt_id))',
      t || '_agare', t);
  end loop;
end $block$;

alter table port enable row level security;
create policy port_agare on port for all
  using (ager_projekt(projekt_for_enhet(enhet_id)))
  with check (ager_projekt(projekt_for_enhet(enhet_id)));

alter table komponentanslutning enable row level security;
create policy komponentanslutning_agare on komponentanslutning for all
  using (ager_projekt(projekt_for_komponent(komponent_id)))
  with check (ager_projekt(projekt_for_komponent(komponent_id)));

alter table bladfilter_zon enable row level security;
create policy bladfilter_zon_agare on bladfilter_zon for all
  using (ager_projekt(projekt_for_blad(blad_id)))
  with check (ager_projekt(projekt_for_blad(blad_id)));

alter table bladfilter_enhet enable row level security;
create policy bladfilter_enhet_agare on bladfilter_enhet for all
  using (ager_projekt(projekt_for_blad(blad_id)))
  with check (ager_projekt(projekt_for_blad(blad_id)));

-- ---------- bibliotek ----------

do $block$
declare t text;
begin
  foreach t in array array['signaltyp', 'enhetsmall', 'komponentmall']
  loop
    execute format('alter table %I enable row level security', t);
    execute format('create policy %I on %I for select using (ser_bibliotekspost(agare))', t || '_las', t);
    execute format('create policy %I on %I for insert with check (ager_bibliotekspost(agare))', t || '_skapar', t);
    execute format('create policy %I on %I for update using (ager_bibliotekspost(agare))', t || '_andrar', t);
    execute format('create policy %I on %I for delete using (ager_bibliotekspost(agare))', t || '_raderar', t);
  end loop;
end $block$;

alter table artikel enable row level security;
create policy artikel_las on artikel for select using (ser_bibliotekspost(agare));
create policy artikel_skapar on artikel for insert with check (ager_bibliotekspost(agare));
create policy artikel_andrar on artikel for update using (ager_bibliotekspost(agare));
create policy artikel_raderar on artikel for delete using (ager_bibliotekspost(agare));

-- Barn till enhetsmall och komponentmall ärver sin förälders ägare.
do $block$
declare t text;
begin
  foreach t in array array['kontaktdonsmall', 'portmall']
  loop
    execute format('alter table %I enable row level security', t);
    execute format('create policy %I on %I for select using (ser_bibliotekspost(agare_av_enhetsmall(enhetsmall_id)))', t || '_las', t);
    execute format('create policy %I on %I for all using (ager_bibliotekspost(agare_av_enhetsmall(enhetsmall_id))) with check (ager_bibliotekspost(agare_av_enhetsmall(enhetsmall_id)))', t || '_agare', t);
  end loop;
end $block$;

alter table komponentanslutningsmall enable row level security;
create policy komponentanslutningsmall_las on komponentanslutningsmall for select
  using (ser_bibliotekspost(agare_av_komponentmall(komponentmall_id)));
create policy komponentanslutningsmall_agare on komponentanslutningsmall for all
  using (ager_bibliotekspost(agare_av_komponentmall(komponentmall_id)))
  with check (ager_bibliotekspost(agare_av_komponentmall(komponentmall_id)));

alter table stiftmall enable row level security;
create policy stiftmall_las on stiftmall for select
  using (ser_bibliotekspost(agare_via_kontaktdonsmall(kontaktdonsmall_id)));
create policy stiftmall_agare on stiftmall for all
  using (ager_bibliotekspost(agare_via_kontaktdonsmall(kontaktdonsmall_id)))
  with check (ager_bibliotekspost(agare_via_kontaktdonsmall(kontaktdonsmall_id)));

alter table portroll enable row level security;
create policy portroll_las on portroll for select
  using (ser_bibliotekspost(agare_via_portmall(portmall_id)));
create policy portroll_agare on portroll for all
  using (ager_bibliotekspost(agare_via_portmall(portmall_id)))
  with check (ager_bibliotekspost(agare_via_portmall(portmall_id)));

alter table portstift enable row level security;
create policy portstift_las on portstift for select
  using (ser_bibliotekspost(agare_via_portmall(portmall_id)));
create policy portstift_agare on portstift for all
  using (ager_bibliotekspost(agare_via_portmall(portmall_id)))
  with check (ager_bibliotekspost(agare_via_portmall(portmall_id)));
