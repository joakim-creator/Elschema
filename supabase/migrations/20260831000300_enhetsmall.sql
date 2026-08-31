-- F0-06  Enhetsmallar: styrenhet, PDM och expansionsmodul i samma modell.
-- B-011: strömgräns i tre nivåer (stift, port, enhet) och en port sitter på
-- flera stift. B-012: terminering hör till enheten, inte bussen.

create type enhetstyp as enum ('styrenhet', 'pdm', 'exp');
create type riktning as enum ('in', 'ut', 'dubbelriktad', 'matning', 'jord');

create table enhetsmall (
  id             uuid primary key default gen_random_uuid(),
  agare          uuid references profiler (id) on delete cascade,  -- null = systemets
  fabrikat       text not null,
  modell         text not null,
  typ            enhetstyp not null,
  max_strom_a    numeric(7, 2) check (max_strom_a > 0),  -- enhetstak, t.ex. PDM20:s 230 A
  can_terminerad boolean not null default false,          -- inbyggd 120 ohm?
  anteckning     text
);

create unique index enhetsmall_namn_idx
  on enhetsmall (coalesce(agare, '00000000-0000-0000-0000-000000000000'::uuid), fabrikat, modell);

create table kontaktdonsmall (
  id           uuid primary key default gen_random_uuid(),
  enhetsmall_id uuid not null references enhetsmall (id) on delete cascade,
  beteckning   text not null,             -- "Connector 1"
  poler        integer not null check (poler between 1 and 256),
  unique (enhetsmall_id, beteckning)
);

create table stiftmall (
  id                 uuid primary key default gen_random_uuid(),
  kontaktdonsmall_id uuid not null references kontaktdonsmall (id) on delete cascade,
  position           text not null,                        -- "A1", "M4"
  storlek            text,                                 -- "liten", "stor"
  max_strom_a        numeric(7, 2) check (max_strom_a > 0),
  unique (kontaktdonsmall_id, position)
);

create table portmall (
  id            uuid primary key default gen_random_uuid(),
  enhetsmall_id uuid not null references enhetsmall (id) on delete cascade,
  beteckning    text not null,                             -- "GP OUT 8", "INJ 1"
  riktning      riktning not null,
  max_strom_a   numeric(7, 2) check (max_strom_a > 0),
  anteckning    text,
  unique (enhetsmall_id, beteckning)
);

-- En port kan bära flera roller. C5: TACH / GP OUT 8 är samma stift.
create table portroll (
  id           uuid primary key default gen_random_uuid(),
  portmall_id  uuid not null references portmall (id) on delete cascade,
  signaltyp_id uuid not null references signaltyp (id) on delete restrict,
  ar_standard  boolean not null default false,
  unique (portmall_id, signaltyp_id)
);

-- Högst en standardroll per port.
create unique index portroll_en_standard_idx
  on portroll (portmall_id) where ar_standard;

-- B-011: relationen port -> stift är en-till-många. OUT 1 sitter på 1, 10 och 18.
create table portstift (
  portmall_id  uuid not null references portmall (id) on delete cascade,
  stiftmall_id uuid not null references stiftmall (id) on delete cascade,
  primary key (portmall_id, stiftmall_id)
);

-- Ett stift bär bara en port. Motsatt riktning är en-till-många, inte många-till-många.
create unique index portstift_stift_unikt_idx on portstift (stiftmall_id);
