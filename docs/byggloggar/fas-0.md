# Bygglogg — fas 0, Fundament

**Datum:** 2026-08-31 · **Tagg:** `v0.0.1` · **Uppgifter:** F0-01 till F0-16, samtliga
`KLAR` · **Prov:** 41 gröna · **Kod skriven av:** Claude, ensam, natten mot den 31:a

Fasens mål var ett körbart projekt med datamodell, åtkomstkontroll och CI — ingen
affärslogik. Det målet är nått, och något går att köra och pröva.

---

## Vad som finns nu

| | |
|---|---|
| Ramverk | Next.js 16 (App Router), React 19, TypeScript i strikt läge |
| Databas | Supabase lokalt, Postgres 17, nio migrationer |
| Tabeller | 22 i `public`, samtliga med RLS |
| Inloggning | Supabase Auth, sluten grupp med inbjudningskod |
| Prov | 41 i tre filer: vaktprov, åtkomst, villkor |
| CI | GitHub Actions — lint, typkontroll, format, prov, bygge |
| Commits | 10, samtliga med uppgifts-ID |

## Beslut som fattades under vägen

Tre stycken, alla förda i [beslutsloggen](../beslutslogg.md) med skäl och konsekvens.

**B-014 — lokala stacken kör på portblock 5442x.** `supabase start` slog fel: port
54322 upptagen. `docker ps` visade hälsoappens stack på hela 54321–54327. Att stoppa
den hade gjort det omöjligt att arbeta i båda projekten samma dag, så Elschema flyttade
i stället. Ändringen ligger i `supabase/config.toml` och gäller därmed för alla som
klonar repot.

**Datamodellen växer med faserna, inte i förväg.** Fas 0:s mål säger "komplett
datamodell", men tabeller för signaler, regler och CAN-bussar finns inte. Skälet: en
tabell utan läsare går inte att pröva, och regeln "databasen före koden" betyder att
migrationen ska ligga före den kod som förutsätter den — inte att allt ska finnas från
början. Signaler och regler kommer i fas 5, bussar i fas 6. Noterat i backloggens
fasrubrik så att det inte läses som en lucka.

**Markdown är undantaget Prettier.** Dokumenten är handbrutna för läsbarhet. Prettier
flödar om stycken och slår sönder både tabeller och de radbrytningar som är satta med
avsikt. `*.md` ligger därför i `.prettierignore`.

## Fel som uppstod och vad de kostade

**ESLint startade inte alls.** Första `eslint.config.mjs` gick via `FlatCompat` mot
`next/core-web-vitals`, som är det mönster nästan all dokumentation visar. Det kastade
på en cirkulär referens i react-pluginens schema, mitt i `JSON.stringify`. Orsaken är
att eslint-config-next 16 redan levererar färdiga flat configs — bryggan behövs inte
och gör skada. `@eslint/eslintrc` avinstallerad. *Kostnad: två försök.*

**Inloggningen svarade "Database error querying schema".** Frödata skapade rader direkt
i `auth.users`, men GoTrue läser flera token-kolumner som `text` och kan inte hantera
`null` i dem, och kontot saknade dessutom rad i `auth.identities`. Båda rättade i
`seed.sql`. Felmeddelandet pekar på schemat och inte på raderna, vilket gjorde det
onödigt svårläst. *Kostnad: en omgång.*

**Typkontrollen föll på en rutt som fanns.** `typedRoutes` slog mot `/logga-in` med
"is not assignable to parameter of type RouteImpl". Rutten existerade — det var
typkartan som var äldre än filen. `typecheck` kör nu `next typegen` först. Hade det
inte fångats här hade CI fallit på det, eftersom CI kör typkontroll före bygget.
*Kostnad: en byggkörning.*

**Fel dev-server startade.** `preview_start` läser `launch.json` från sessionens
arbetsmapp, inte från projektmappen, och startade hälsoappen på port 3000. Servern
stoppades igen. `Sessions/.claude/launch.json` har nu en post `elschema-lokal` på port
**3001**, så båda projekten kan köra samtidigt. Det är en fil utanför repot — värd att
känna till.

## Proven har setts falla

Regeln i `CLAUDE.md` säger att ett prov man inte sett falla inte är ett prov. Fyra
avsiktliga sabotage kördes, ett i taget, med `supabase db reset` emellan:

| Sabotage | Utfall |
|---|---|
| `alter table kabel add column pos_x integer` | Koordinatvaktprovet rött: `expected [ 'kabel.pos_x' ] to deeply equal []` |
| `alter table kabel disable row level security` | RLS-vaktprovet rött: `expected [ 'kabel' ] to deeply equal []` |
| Policyn `projekt_agare_ser` ersatt med `using (true)` | Fyra åtkomstprov röda, inklusive "utan inloggning syns inga projekt" |
| `drop constraint chassijord_saknar_agare` | Två villkorsprov röda |

Att det tredje sabotaget fällde även provet **"Joakim ser sitt eget projekt"** är värt
att notera: det provet räknar rader och hade passerat om det bara frågat "syns mitt
projekt?". Det är den sortens prov som annars sover.

## Vad som prövades i den riktiga appen

Dev-servern startad, inloggning gjord som frödataanvändaren i webbläsaren:

- Anropet till `/` utan session omdirigerar till `/logga-in`. Middleware håller.
- Inloggning med `joakim@exempel.test` lyckas och sidan visar **Evo 8 racebil**.
- **Volvo 240-projektet syns inte.** RLS håller hela vägen ut till renderad sida, inte
  bara i provsviten.
- Inga fel i webbläsarkonsolen.

Det sista är poängen med att pröva i appen och inte bara i provsviten: åtkomstproven går
mot PostgREST, sidan går genom serverklienten och kakorna. Det är två olika vägar in.

## Modellval värda att känna till

**Kontaktdon instansieras inte.** En enhets kontaktdon och stift är rena mallar. Det som
behöver finnas som instans är porten, eftersom den bär vald roll och är en nod i
nätlistan. Att kopiera kontaktdonen per fordon hade lagt till rader utan att lägga till
något som går att veta.

**`nod` är en tabell med fyra möjliga innehåll och ett villkor som tillåter exakt ett.**
Alternativet — polymorfa `(typ, id)`-kolumner — hade gjort främmande nycklar omöjliga och
lämnat referensintegriteten åt applikationen.

**Kabelparet är unikt via `least`/`greatest`.** Samma två noder kan bara kopplas en gång,
oavsett i vilken ände man råkade börja rita.

**Två triggrar bevakar det främmande nycklar inte kan.** En kabel kan peka på noder i ett
annat projekt utan att någon nyckel protesterar, och en port kan tilldelas en roll som
hör till en annan portmall. Båda är nu fel vid skrivning, inte fel som upptäcks vid
kontrollkörning i fas 4.

## Kvarstår, och varför

- **Ingen prod-miljö.** `databasandringar.md` har en kolumn *Körd i prod* som står tom
  för samtliga nio migrationer. Den fylls när `driftsattning.md` har en miljö. Ingenting
  i fas 0 kräver det, men kolumnen ska inte glömmas bort.
- **CI har aldrig körts.** Det finns ingen fjärrgren att pusha till. Filen är skriven
  mot GitHub Actions och startar hela Supabase-stacken; att den fungerar är ett antagande
  tills den kört första gången.
- **Startbiblioteket är tunt.** Frödata har en påhittad "Prov Styrenhet 8" och en
  "Prov PDM 4" — inte MaxxECU. Det är F1-03 och F6-06, och de riktiga underlagen ligger
  i `docs/referens/`.

## Till den som tar vid

Kom igång med:

```bash
cd Elschema; npm install; npx supabase start; npm run db:reset; npm run verify
```

Inloggningsuppgifter i frödata: `joakim@exempel.test` / `provlosenord`, och
`annan@exempel.test` med samma lösenord. Den andra användaren finns **bara** för att
åtkomstproven ska ha något att inte se — ta inte bort den.
