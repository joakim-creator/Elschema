-- U-006  Villkoret karna_saknar_agare gjorde varje icke-kärntyp privat.
--
-- B-006 säger att kärnan kontrolleras och egna typer bara lagras. Villkoret i
-- 20260831000200 skrev det som "ar_karna = (agare is null)", vilket också
-- betyder att en typ utan ägare *måste* vara kärna. MaxxECU:s WBO2-, EGT- och
-- knackportar behöver systemgemensamma typer som appen inte kontrollerar, och
-- de gick därför inte att lägga in.
--
-- Migrationen ändras inte i efterhand; villkoret ersätts här.

alter table signaltyp drop constraint karna_saknar_agare;

alter table signaltyp add constraint karna_saknar_agare
  check (not ar_karna or agare is null);

-- Unikhetsindexen förutsatte samma tolkning: "egen" betydde "har ägare".
-- Systemets icke-kärntyper har ingen ägare och måste ändå vara unika.
drop index signaltyp_egen_nyckel_idx;

create unique index signaltyp_systemnyckel_idx
  on signaltyp (nyckel) where agare is null;

create unique index signaltyp_egen_nyckel_idx
  on signaltyp (agare, nyckel) where agare is not null;
