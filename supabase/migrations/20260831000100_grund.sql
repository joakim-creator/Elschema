-- F0-05  Konton, inbjudningskoder och projekt.
-- Sluten grupp: nya konton kräver en inbjudningskod (spec avsnitt 4, J4).

create table profiler (
  id          uuid primary key references auth.users (id) on delete cascade,
  namn        text not null check (length(trim(namn)) between 1 and 80),
  skapad      timestamptz not null default now()
);

create table inbjudningskod (
  kod         text primary key check (kod ~ '^[A-Z0-9-]{6,32}$'),
  skapad_av   uuid references profiler (id) on delete set null,
  anvand_av   uuid unique references profiler (id) on delete set null,
  anvand      timestamptz,
  skapad      timestamptz not null default now(),
  constraint anvand_av_och_tid_foljs_at check ((anvand_av is null) = (anvand is null))
);

create table projekt (
  id          uuid primary key default gen_random_uuid(),
  agare       uuid not null references profiler (id) on delete cascade,
  namn        text not null check (length(trim(namn)) between 1 and 120),
  fordon      text,
  skapad      timestamptz not null default now(),
  andrad      timestamptz not null default now()
);

create index projekt_agare_idx on projekt (agare);

-- Håller "andrad" sann utan att varje skrivväg behöver komma ihåg det.
create or replace function satt_andrad()
returns trigger
language plpgsql
as $$
begin
  new.andrad := now();
  return new;
end;
$$;

create trigger projekt_andrad
  before update on projekt
  for each row execute function satt_andrad();
