-- F1-18  Bärförmåga per area och kabeltyp. Frödata, inte formel (B-013).
--
-- Källa: docs/referens/maxxecu-pdm-kanaler.pdf, sida 2, "Cable size and current
-- rating".
--
-- LÄS DETTA INNAN SIFFRORNA LITAS PÅ. Tabellen i PDF:en är satt i två spalter
-- där strömkolumnerna ligger en halv rad förskjutna mot areakolumnen. Raderna
-- är därför parade i ordning: tio areor mot tio strömpar, vilket är den enda
-- läsning där varje area får ett värde och värdena växer med arean. Den
-- alternativa läsningen — para ihop det som står på samma rad — lämnar tre
-- strömpar herrelösa och tre areor tomma.
--
-- AWG lämnas null där underlaget inte anger något. 0,75, 1,5 och 6 mm² saknas
-- i källan; att fylla i 18, 15 och 9 hade varit en gissning, inte en avläsning.

create table barformaga (
  id            uuid primary key default gen_random_uuid(),
  area_mm2      numeric(5, 2) not null unique check (area_mm2 > 0),
  awg           integer check (awg between 0 and 40),
  thin_wall_a   numeric(6, 2) not null check (thin_wall_a > 0),
  vanlig_a      numeric(6, 2) not null check (vanlig_a > 0),
  kalla         text not null,
  constraint thin_wall_bar_mer check (thin_wall_a >= vanlig_a)
);

comment on table barformaga is
  'Utbytbar frödata. Gäller MaxxECU:s förutsättningar; se kalla-kolumnen.';

insert into barformaga (area_mm2, awg, thin_wall_a, vanlig_a, kalla) values
  (0.50, 20, 11.00,  5.00, 'MaxxECU PDM20 wiring, sida 2'),
  (0.75, null, 14.00,  7.50, 'MaxxECU PDM20 wiring, sida 2'),
  (1.00, 17, 16.00, 10.00, 'MaxxECU PDM20 wiring, sida 2'),
  (1.50, null, 21.00, 15.00, 'MaxxECU PDM20 wiring, sida 2'),
  (2.50, 13, 29.00, 25.00, 'MaxxECU PDM20 wiring, sida 2'),
  (4.00, 11, 39.00, 30.00, 'MaxxECU PDM20 wiring, sida 2'),
  (6.00, null, 50.00, 40.00, 'MaxxECU PDM20 wiring, sida 2'),
  (8.00,  8, 60.00, 50.00, 'MaxxECU PDM20 wiring, sida 2'),
  (10.00, 7, 70.00, 60.00, 'MaxxECU PDM20 wiring, sida 2'),
  (16.00, 5, 90.00, 80.00, 'MaxxECU PDM20 wiring, sida 2');

-- Tabellen är systemets och läses av alla. Ingen skriver i den från appen.
alter table barformaga enable row level security;
create policy barformaga_las on barformaga for select using (true);

/**
 * Minsta area som bär strömmen, för vald kabeltyp. Null om ingen area räcker.
 * Underlagets egen brasklapp gäller: varm miljö och tätt packade stammar
 * kräver mer än tabellen anger. Den visas vid förslaget (F1-20).
 */
create or replace function foreslagen_area(strom numeric, sort kabeltyp)
returns numeric
language sql
stable
as $$
  select min(area_mm2) from barformaga
   where strom is not null
     and case when sort = 'thin_wall' then thin_wall_a else vanlig_a end >= strom;
$$;
