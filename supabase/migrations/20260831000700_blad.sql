-- F0-10  Blad. B-003 och B-009: ett blad är en sparad filtrering, inte en
-- ritning, och en utskriftssida är samma sak. Därför bär bladet både filtret
-- och pappersvalet.

create table blad (
  id            uuid primary key default gen_random_uuid(),
  projekt_id    uuid not null references projekt (id) on delete cascade,
  namn          text not null check (length(trim(namn)) between 1 and 80),
  ordning       integer not null default 0,
  format        text not null default 'A3' check (format in ('A4', 'A3', 'fri')),
  bredd_mm      integer check (bredd_mm between 50 and 2000),
  hojd_mm       integer check (hojd_mm between 50 and 2000),
  skala         numeric(5, 3) not null default 1.000 check (skala between 0.05 and 10),
  unique (projekt_id, namn),
  constraint fritt_format_kraver_matt check (
    format <> 'fri' or (bredd_mm is not null and hojd_mm is not null)
  )
);

-- Filtret. Ett blad utan rader här visar hela projektet.
create table bladfilter_zon (
  blad_id uuid not null references blad (id) on delete cascade,
  zon_id  uuid not null references zon (id) on delete cascade,
  primary key (blad_id, zon_id)
);

create table bladfilter_enhet (
  blad_id  uuid not null references blad (id) on delete cascade,
  enhet_id uuid not null references enhet (id) on delete cascade,
  primary key (blad_id, enhet_id)
);
