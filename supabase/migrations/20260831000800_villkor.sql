-- F0-11  Villkor som inte hörde hemma i en enskild tabells definition.

-- Instansnummer är unikt per projekt och mall: "injektor 3" finns en gång.
create unique index komponent_nummer_unikt_idx
  on komponent (projekt_id, komponentmall_id, nummer)
  where nummer is not null;

-- En vald roll måste tillhöra portens egen mall. Utan det kan en port ärva en
-- roll från en annan port, och signaltypskontrollen prövar då fel sak.
create or replace function vald_roll_hor_till_porten()
returns trigger
language plpgsql
as $$
begin
  if new.vald_roll_id is null then
    return new;
  end if;
  if not exists (
    select 1 from portroll
    where id = new.vald_roll_id and portmall_id = new.portmall_id
  ) then
    raise exception 'vald roll % hör inte till portmall %', new.vald_roll_id, new.portmall_id;
  end if;
  return new;
end;
$$;

create trigger port_vald_roll_kontroll
  before insert or update on port
  for each row execute function vald_roll_hor_till_porten();

-- En kabel får inte korsa projektgränsen. Främmande nycklar hindrar det inte:
-- nod_a och nod_b pekar på nod, som i sin tur kan tillhöra ett annat projekt.
create or replace function kabeln_stannar_i_projektet()
returns trigger
language plpgsql
as $$
declare
  projekt_a uuid;
  projekt_b uuid;
begin
  select projekt_id into projekt_a from nod where id = new.nod_a;
  select projekt_id into projekt_b from nod where id = new.nod_b;
  if projekt_a is distinct from new.projekt_id or projekt_b is distinct from new.projekt_id then
    raise exception 'kabeln kopplar noder utanför sitt projekt';
  end if;
  return new;
end;
$$;

create trigger kabel_projektgrans
  before insert or update on kabel
  for each row execute function kabeln_stannar_i_projektet();
