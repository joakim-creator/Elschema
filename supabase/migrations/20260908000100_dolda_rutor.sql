-- F2-27: en ruta går att dölja på ett blad.
--
-- Hör hemma i bladplacering av samma skäl som x, y och vand: det är
-- presentation per blad, inte elektrisk mening. Nätlistan är oförändrad, och
-- samma komponent kan vara dold på ett blad och synlig på ett annat.
--
-- Återställning: R-019 i docs/databasandringar.md.

alter table bladplacering add column dold boolean not null default false;

comment on column bladplacering.dold is
  'Rutan ritas inte på det här bladet. Nätlistan påverkas inte.';
