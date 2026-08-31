-- F2-03  Handflyttade lägen. Ren presentation.
--
-- B-001: nätlistan är sanningen och ritningen en vy. Läget hör därför hemma i
-- en egen tabell, kopplad till *bladet* — samma nod kan ligga olika på två
-- blad utan att något elektriskt ändras. Vaktprovet i tests/schema.test.ts
-- listar nätlistetabellerna, och den här är inte en av dem.

create table bladplacering (
  blad_id uuid not null references blad (id) on delete cascade,
  nod_id  uuid not null references nod (id) on delete cascade,
  x       integer not null,
  y       integer not null,
  primary key (blad_id, nod_id)
);

alter table bladplacering enable row level security;

create policy bladplacering_agare on bladplacering for all
  using (ager_projekt(projekt_for_blad(blad_id)))
  with check (ager_projekt(projekt_for_blad(blad_id)));
