-- F0-07  Komponenter i tre nivåer: mall -> artikel -> instans (B-008).
-- Instansen måste vara giltig utan vald artikel: man vet att det sitter en
-- injektor på porten innan man bestämt vilken.

create table komponentmall (
  id        uuid primary key default gen_random_uuid(),
  agare     uuid references profiler (id) on delete cascade,   -- null = systemets
  namn      text not null,
  kategori  text not null
);

create unique index komponentmall_namn_idx
  on komponentmall (coalesce(agare, '00000000-0000-0000-0000-000000000000'::uuid), namn);

create table komponentanslutningsmall (
  id               uuid primary key default gen_random_uuid(),
  komponentmall_id uuid not null references komponentmall (id) on delete cascade,
  beteckning       text not null,        -- "1", "2", "signal"
  funktion         text not null,        -- "matning", "styrning", "retur"
  signaltyp_id     uuid references signaltyp (id) on delete set null,
  unique (komponentmall_id, beteckning)
);

create table artikel (
  id               uuid primary key default gen_random_uuid(),
  komponentmall_id uuid not null references komponentmall (id) on delete cascade,
  agare            uuid references profiler (id) on delete cascade,
  fabrikat         text not null,
  artikelnummer    text,
  strom_a          numeric(7, 2) check (strom_a >= 0),
  spanning_min_v   numeric(6, 2),
  spanning_max_v   numeric(6, 2),
  anteckning       text,
  constraint spanning_i_ordning check (
    spanning_min_v is null or spanning_max_v is null or spanning_min_v <= spanning_max_v
  )
);

create index artikel_mall_idx on artikel (komponentmall_id);
