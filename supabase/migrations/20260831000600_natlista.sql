-- F0-06, F0-07, F0-08  Nätlistan: instanser och de elektriska punkterna.
--
-- B-001: den här filen är sanningen om vad som är sammankopplat. Ingen tabell
-- här bär koordinater. Placering hör till bladet och kommer i fas 2.
-- Vaktprovet i tests/schema.test.ts faller om en koordinatkolumn smyger sig in.

create type jordklass as enum ('sensor', 'vr', 'skarm', 'chassi');
create type kabeltyp  as enum ('thin_wall', 'vanlig');

-- ---------- instanser ----------

create table enhet (
  id            uuid primary key default gen_random_uuid(),
  projekt_id    uuid not null references projekt (id) on delete cascade,
  enhetsmall_id uuid not null references enhetsmall (id) on delete restrict,
  beteckning    text not null,
  zon_id        uuid references zon (id) on delete set null,
  unique (projekt_id, beteckning)
);

create table port (
  id           uuid primary key default gen_random_uuid(),
  enhet_id     uuid not null references enhet (id) on delete cascade,
  portmall_id  uuid not null references portmall (id) on delete restrict,
  vald_roll_id uuid references portroll (id) on delete set null,
  unique (enhet_id, portmall_id)
);

create table komponent (
  id               uuid primary key default gen_random_uuid(),
  projekt_id       uuid not null references projekt (id) on delete cascade,
  komponentmall_id uuid not null references komponentmall (id) on delete restrict,
  artikel_id       uuid references artikel (id) on delete set null,  -- får saknas (B-008)
  beteckning       text not null,
  nummer           integer check (nummer > 0),
  zon_id           uuid references zon (id) on delete set null,
  unique (projekt_id, beteckning)
);

create table komponentanslutning (
  id                 uuid primary key default gen_random_uuid(),
  komponent_id       uuid not null references komponent (id) on delete cascade,
  anslutningsmall_id uuid not null references komponentanslutningsmall (id) on delete restrict,
  unique (komponent_id, anslutningsmall_id)
);

-- B-010: klassen räcker inte. ECU:ns sensorjord och PDM:ns är båda "sensor"
-- men får aldrig kopplas ihop, så punkten bär även sin ägande enhet.
-- Chassi- och motorjord är den enda gemensamma klassen och saknar ägare.
create table jordpunkt (
  id         uuid primary key default gen_random_uuid(),
  projekt_id uuid not null references projekt (id) on delete cascade,
  klass      jordklass not null,
  enhet_id   uuid references enhet (id) on delete cascade,
  beteckning text not null,
  zon_id     uuid references zon (id) on delete set null,
  unique (projekt_id, beteckning),
  constraint chassijord_saknar_agare check ((klass = 'chassi') = (enhet_id is null))
);

create table skarvpunkt (
  id         uuid primary key default gen_random_uuid(),
  projekt_id uuid not null references projekt (id) on delete cascade,
  beteckning text not null,
  zon_id     uuid references zon (id) on delete set null,
  unique (projekt_id, beteckning)
);

-- ---------- de elektriska punkterna ----------

create table nod (
  id                     uuid primary key default gen_random_uuid(),
  projekt_id             uuid not null references projekt (id) on delete cascade,
  port_id                uuid unique references port (id) on delete cascade,
  komponentanslutning_id uuid unique references komponentanslutning (id) on delete cascade,
  jordpunkt_id           uuid unique references jordpunkt (id) on delete cascade,
  skarvpunkt_id          uuid unique references skarvpunkt (id) on delete cascade,
  constraint noden_ar_exakt_en_sak check (
    (port_id is not null)::int
      + (komponentanslutning_id is not null)::int
      + (jordpunkt_id is not null)::int
      + (skarvpunkt_id is not null)::int = 1
  )
);

create index nod_projekt_idx on nod (projekt_id);

-- E1: punkt till punkt. Förgrening görs med en skarvpunkt, som är en nod.
create table kabel (
  id         uuid primary key default gen_random_uuid(),
  projekt_id uuid not null references projekt (id) on delete cascade,
  nod_a      uuid not null references nod (id) on delete cascade,
  nod_b      uuid not null references nod (id) on delete cascade,
  area_mm2   numeric(5, 2) check (area_mm2 > 0),
  typ        kabeltyp,                       -- avgör kolumn i bärförmågetabellen (B-013)
  farg       text,
  langd_mm   integer check (langd_mm > 0),
  skarmad    boolean not null default false,
  markning   text,
  constraint kabeln_gar_inte_till_sig_sjalv check (nod_a <> nod_b)
);

create index kabel_projekt_idx on kabel (projekt_id);
create index kabel_nod_a_idx on kabel (nod_a);
create index kabel_nod_b_idx on kabel (nod_b);

-- Samma par noder får bara kopplas en gång, oavsett vilken ände som skrevs först.
create unique index kabel_par_unikt_idx
  on kabel (least(nod_a, nod_b), greatest(nod_a, nod_b));
