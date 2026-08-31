-- F2-11  En ruta på ritningen är en *enhet* eller en *komponent*, inte en
-- enskild nod. Styrenheten ritas som en låda med sina portar i, injektorn som
-- en låda med sina anslutningar i — det var återkopplingen från första
-- provkörningen, och den är riktig: en ruta per anslutning gör ett schema
-- oläsbart så fort en komponent har fler än två ben.
--
-- Placeringen måste därför hänga på gruppen, inte på noden. Nyckeln är
-- "enhet:<uuid>" eller "komponent:<beteckning>" och räknas fram av layouten.
--
-- Tabellen skapades i går och innehåller inga handflyttade lägen värda att
-- rädda. Den byggs om i stället för att kompletteras.

drop table bladplacering;

create table bladplacering (
  blad_id uuid not null references blad (id) on delete cascade,
  nyckel  text not null check (length(nyckel) between 1 and 200),
  x       integer not null,
  y       integer not null,
  primary key (blad_id, nyckel)
);

alter table bladplacering enable row level security;

create policy bladplacering_agare on bladplacering for all
  using (ager_projekt(projekt_for_blad(blad_id)))
  with check (ager_projekt(projekt_for_blad(blad_id)));
