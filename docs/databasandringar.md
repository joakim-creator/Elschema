# Databasändringar

Register över samtliga migrationer. **Varje migration ska ha en dokumenterad
återställning innan den körs skarpt.** Det är den här filen som gör det möjligt att
svara på "vad hände med databasen den 14:e" utan att gissa.

Migrationsfilerna namnges `<tidsstämpel>_<beskrivning>.sql` och **ändras aldrig efter
att de körts skarpt** — fel rättas med en ny migration.

## Ordningen som gäller

1. Skriv migrationen.
2. Skriv återställningen och fyll i raden i registret nedan.
3. Kör mot **dev**.
4. Kör mot **prod**.
5. Först därefter slås koden som förutsätter ändringen ihop till `main`.

Steg 5 är inte en formalitet. Kod som läser en kolumn som ännu inte finns tar ner
produktionen direkt, och felet syns inte i något prov — provmiljön har redan
migrationen.

Kontrollera alltid vilken miljö som är länkad innan något körs.

> **Läge 2026-08-31:** ingen prod-miljö finns ännu. Kolumnen *Körd i prod* fylls när
> [driftsattning.md](driftsattning.md) har en miljö. Dev är den lokala stacken på
> portblock 5442x ([B-014](beslutslogg.md)).

## Register

| Migration | Uppgift | Innehåll | Körd i dev | Körd i prod | Återställning |
|---|---|---|---|---|---|
| `20260831000100_grund` | F0-05 | `profiler`, `inbjudningskod`, `projekt`, trigger för `andrad` | 2026-08-31 | — | R-001 |
| `20260831000200_signaltyp` | F0-09 | `signaltyp` med 17 kärntyper som frödata | 2026-08-31 | — | R-002 |
| `20260831000300_enhetsmall` | F0-06 | `enhetsmall`, `kontaktdonsmall`, `stiftmall`, `portmall`, `portroll`, `portstift` | 2026-08-31 | — | R-003 |
| `20260831000400_komponent` | F0-07 | `komponentmall`, `komponentanslutningsmall`, `artikel` | 2026-08-31 | — | R-004 |
| `20260831000500_zon` | F0-10 | `zon` | 2026-08-31 | — | R-005 |
| `20260831000600_natlista` | F0-06/07/08 | `enhet`, `port`, `komponent`, `komponentanslutning`, `jordpunkt`, `skarvpunkt`, `nod`, `kabel` | 2026-08-31 | — | R-006 |
| `20260831000700_blad` | F0-10 | `blad`, `bladfilter_zon`, `bladfilter_enhet` | 2026-08-31 | — | R-007 |
| `20260831000800_villkor` | F0-11 | Unikt instansnummer, trigger för vald roll, trigger för projektgräns | 2026-08-31 | — | R-008 |
| `20260831000900_atkomst` | F0-12 | RLS och policyer på samtliga tabeller, tio hjälpfunktioner | 2026-08-31 | — | R-009 |
| `20260831001000_signaltyp_systemets_egna` | U-006 | Villkoret `karna_saknar_agare` gjorde varje icke-kärntyp privat | 2026-08-31 | — | R-010 |
| `20260831001100_maxxecu_race` | F1-03 | MaxxECU Race: 2 kontaktdon, 80 stift, 80 portar, 86 roller, 4 egna signaltyper | 2026-08-31 | — | R-011 |
| `20260831001200_barformaga` | F1-18 | `barformaga` med tio rader och funktionen `foreslagen_area` | 2026-08-31 | — | R-012 |
| `20260831001300_startbibliotek` | F1-09 | 18 komponentmallar, 54 anslutningar, 11 artiklar | 2026-08-31 | — | R-013 |
| `20260831001400_vyer` | F1-16 | Vyerna `nod_vy` och `kabel_vy`, båda `security_invoker` | 2026-08-31 | — | R-014 |
| `20260831001500_bladplacering` | F2-03 | `bladplacering` — flyttade lägen per blad och nod | 2026-08-31 | — | R-015 |
| `20260831001600_nod_vy_riktning` | F2-01 | `nod_vy` får `riktning` och `enhet_id` — ritningen behöver veta in från ut | 2026-08-31 | — | R-016 |
| `20260831001700_bladplacering_nyckel` | F2-11 | `bladplacering` byter från `nod_id` till `nyckel` — en ruta är en enhet eller komponent, inte en enskild nod | 2026-08-31 | — | R-017 |

> **Avsteg 2026-08-31.** Återställningarna R-010 till R-014 skrevs *efter* att
> migrationerna körts, inte före. Regeln i `CLAUDE.md` säger före, och skälet är
> att en migration utan återställning är en enkelriktad gata. Att det gick bra
> här beror på att miljön var lokal och kastbar — inte på att ordningen var
> oviktig. Se [lardomar.md](lardomar.md).

## Återställningar

Ordningen är omvänd mot registret: `R-009` först, `R-001` sist. Beroendena går nedåt,
så en återställning som hoppar över ett steg lämnar en främmande nyckel hängande.

**R-001** — grund

```sql
drop trigger if exists projekt_andrad on projekt;
drop function if exists satt_andrad();
drop table if exists projekt;
drop table if exists inbjudningskod;
drop table if exists profiler;
```

Allt försvinner. Inloggade konton finns kvar i `auth.users` men saknar profil, och
appen kan inte visa något alls.

**R-002** — signaltyp

```sql
drop table if exists signaltyp;
drop type if exists signalkategori;
```

Kräver att R-003 körts först — `portroll` pekar hit. Kärntyperna är frödata och
återskapas av migrationen, så inget som användaren skrivit går förlorat.

**R-003** — enhetsmall

```sql
drop table if exists portstift;
drop table if exists portroll;
drop table if exists portmall;
drop table if exists stiftmall;
drop table if exists kontaktdonsmall;
drop table if exists enhetsmall;
drop type if exists riktning;
drop type if exists enhetstyp;
```

Kräver att R-006 körts först. Samtliga inmatade pinouter försvinner — det är den
dyraste återställningen i registret, eftersom en pinout matas in för hand.

**R-004** — komponent

```sql
drop table if exists artikel;
drop table if exists komponentanslutningsmall;
drop table if exists komponentmall;
```

Kräver att R-006 körts först. Egna komponenter och artiklar går förlorade.

**R-005** — zon

```sql
drop table if exists zon;
```

Kräver att R-006 och R-007 körts först. Zontaggning försvinner; bladindelningen är
redan borta i det läget.

**R-006** — natlista

```sql
drop table if exists kabel;
drop table if exists nod;
drop table if exists skarvpunkt;
drop table if exists jordpunkt;
drop table if exists komponentanslutning;
drop table if exists komponent;
drop table if exists port;
drop table if exists enhet;
drop type if exists kabeltyp;
drop type if exists jordklass;
```

Kräver att R-007 och R-008 körts först. **Hela schemat försvinner** — det här är
återställningen som tar bort själva arbetet. Ta en dump först.

**R-007** — blad

```sql
drop table if exists bladfilter_enhet;
drop table if exists bladfilter_zon;
drop table if exists blad;
```

Bladindelning och pappersval försvinner. Nätlistan är orörd, så inget elektriskt
innehåll går förlorat — bara hur det var uppdelat på sidor.

**R-008** — villkor

```sql
drop trigger if exists kabel_projektgrans on kabel;
drop function if exists kabeln_stannar_i_projektet();
drop trigger if exists port_vald_roll_kontroll on port;
drop function if exists vald_roll_hor_till_porten();
drop index if exists komponent_nummer_unikt_idx;
```

Efter det kan en kabel kopplas mellan två projekt och en port kan bära en roll som
hör till en annan portmall. Data blir inte fel av återställningen i sig, men
ingenting hindrar att den blir det efteråt.

**R-009** — atkomst

```sql
do $block$
declare r record;
begin
  for r in
    select schemaname, tablename, policyname from pg_policies where schemaname = 'public'
  loop
    execute format('drop policy %I on %I.%I', r.policyname, r.schemaname, r.tablename);
  end loop;
  for r in
    select tablename from pg_tables where schemaname = 'public'
  loop
    execute format('alter table public.%I disable row level security', r.tablename);
  end loop;
end $block$;

drop function if exists projekt_for_blad(uuid);
drop function if exists projekt_for_komponent(uuid);
drop function if exists projekt_for_enhet(uuid);
drop function if exists agare_via_portmall(uuid);
drop function if exists agare_via_kontaktdonsmall(uuid);
drop function if exists agare_av_komponentmall(uuid);
drop function if exists agare_av_enhetsmall(uuid);
drop function if exists ager_bibliotekspost(uuid);
drop function if exists ser_bibliotekspost(uuid);
drop function if exists ager_projekt(uuid);
```

**Varning:** efter den här återställningen ser varje inloggad användare varje projekt.
Den får bara köras på en miljö som inte har andra användares data i sig.

**R-010** — signaltyp_systemets_egna

```sql
drop index if exists signaltyp_egen_nyckel_idx;
drop index if exists signaltyp_systemnyckel_idx;
alter table signaltyp drop constraint karna_saknar_agare;
alter table signaltyp add constraint karna_saknar_agare
  check (ar_karna = (agare is null));
create unique index signaltyp_egen_nyckel_idx
  on signaltyp (agare, nyckel) where not ar_karna;
```

Kräver att R-011 körts först: MaxxECU:s egna typer bryter mot det gamla
villkoret och migrationen faller annars på befintliga rader.

**R-011** — maxxecu_race

```sql
delete from portstift ps using portmall p, enhetsmall e
 where ps.portmall_id = p.id and p.enhetsmall_id = e.id
   and e.fabrikat = 'MaxxECU' and e.modell = 'Race';
delete from enhetsmall where agare is null and fabrikat = 'MaxxECU' and modell = 'Race';
delete from signaltyp where agare is null and nyckel in ('wbo2', 'egt', 'knack', 'knack_gnd');
```

Kaskaden tar kontaktdon, stift, portar och roller. **Varje fordon som använder
mallen tappar sina enheter** — främmande nyckeln från `enhet` är `restrict`, så
raderingen faller i stället för att tyst ta med sig ett projekt. Ta bort
enheterna först, medvetet.

**R-012** — barformaga

```sql
drop function if exists foreslagen_area(numeric, kabeltyp);
drop table if exists barformaga;
```

Areaförslaget slutar fungera. Kablarnas egna värden är orörda — appen tappar
bara sin åsikt om dem.

**R-013** — startbibliotek

```sql
delete from komponentmall where agare is null and namn in (
  'Injektor', 'Tändspole', 'Gaspedal (APP)', 'Trottelhus (DBW)',
  'Oljetrycksgivare', 'Kylvätsketempgivare', 'MAP-givare', 'MAF-givare',
  'Lambdagivare', 'Vevaxelgivare', 'Kamaxelgivare', 'Bränslepump',
  'Relä', 'Säkring', 'Batteri', 'Kylfläkt', 'Bromsljus', 'Varningslampa');
```

Kaskaden tar anslutningsmallar och artiklar. Komponenter i ett fordon pekar på
mallen med `restrict` och hindrar raderingen — vilket är avsikten.

**R-014** — vyer

```sql
drop view if exists kabel_vy;
drop view if exists nod_vy;
```

Kopplingslistan slutar gå att visa. Nätlistan är orörd; vyerna räknar bara fram
etiketter ur den.

**R-015** — bladplacering

```sql
drop table if exists bladplacering;
```

Handflyttade lägen försvinner och ritningen faller tillbaka på den automatiska
placeringen. Nätlistan är orörd — tabellen bär bara presentation, aldrig
elektrisk mening ([B-001](beslutslogg.md)). Det är därför den här
återställningen är ofarlig medan `R-011` inte är det.

**R-016** — nod_vy_riktning

```sql
drop view kabel_vy;
drop view nod_vy;
-- Kör därefter innehållet i migration 20260831001400 igen. Den definitionen är
-- den som gäller efter återställningen.
```

Ritningen kan då inte skilja ingång från utgång och placerar allt på samma
sida. Kopplingslistan påverkas inte — den använder inte kolumnerna.

**R-017** — bladplacering_nyckel

```sql
drop table if exists bladplacering;
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
```

Handflyttade lägen försvinner. Ofarligt av samma skäl som R-015: tabellen bär
presentation, aldrig elektrisk mening.
