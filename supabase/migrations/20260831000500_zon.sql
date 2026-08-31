-- F0-10  Zoner. Taggar noder och komponenter; ett blad filtrerar på dem (B-003).

create table zon (
  id         uuid primary key default gen_random_uuid(),
  projekt_id uuid not null references projekt (id) on delete cascade,
  namn       text not null check (length(trim(namn)) between 1 and 60),
  ordning    integer not null default 0,
  unique (projekt_id, namn)
);

create index zon_projekt_idx on zon (projekt_id);
