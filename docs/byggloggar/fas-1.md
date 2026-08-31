# Bygglogg — fas 1, Nätlistan

**Datum:** 2026-08-31 · **Tagg:** `v0.1.0` · **Uppgifter:** F1-01 till F1-20, samtliga
`KLAR` · **Prov:** 69 gröna (41 från fas 0, 28 nya) · **Migrationer:** 5 nya, totalt 14

Fasens mål var att **ersätta Excel**: ett stift som flyttas ska slå igenom överallt, och
det ska gå att se helheten utan att läsa en textkolumn. Båda är uppfyllda och prövade i
appen, inte bara i provsviten.

---

## Vad som går att göra nu

Logga in, skapa ett projekt, lägga till en MaxxECU Race ur biblioteket och få dess 80
portar instansierade, lägga till komponenter ur ett bibliotek på 18 mallar, dra kablar
mellan namngivna punkter, och se hela kopplingslistan i en tabell där varje rad har
båda ändarna utskrivna med signaltyp — plus ett areaförslag när lasten är känd.

Egna styrenheter, PDM:er och komponentmallar går att bygga i gränssnittet.

## MaxxECU Race matades in ur källan, inte för hand

80 stift, 80 portar, 86 roller. Genererad ur den sparade pinout-sidan med ett skript som
låg utanför repot; migrationen den skrev ligger i repot.

Sex portar bär två roller — `TRIGGER`, `HOME`, `DIN/VR 1`, `DIN/VR 2`, `DIN/VR 4`,
`DIN/VR5`. Det bekräftar C5: flera roller per port är inte en bekvämlighet utan hur
enheten är byggd.

**Stiftstorleken lämnades tom.** Underlaget anger hur många stift av varje storlek som
ingår, men inte vilka positioner som är vilka. En gissning där hade blivit fel
strömgräns i fas 4, och felet hade sett ut som ett svar. Kontrollen redovisar dem som
*ej kontrollerade*.

## Bärförmågetabellen är den mest osäkra siffran i bygget

Tabellen står i PDM-underlagets sida 2, satt i två spalter där **strömkolumnen ligger en
halv rad förskjuten mot areakolumnen**. Två läsningar är möjliga:

- **Sekventiell** — tio areor mot tio strömpar i ordning. Varje area får ett värde och
  värdena växer monotont med arean.
- **Radvis** — para ihop det som står på samma rad. Lämnar tre strömpar herrelösa och
  tre areor tomma.

Den sekventiella är den enda som går ihop, och den är vald. Motiveringen står i
migrationen och ett prov faller om värdena slutar växa monotont.

**Det bör ändå ögnas mot originalet.** Det är den enda siffran i bygget som är en
tolkning och inte en avläsning, och den styr ett förslag om kabelarea.

AWG lämnades tom för 0,75, 1,5 och 6 mm² — källan anger dem inte, och 18, 15 och 9 hade
varit gissningar.

## Beslut som fattades under vägen

**Typade Supabase-klienter.** `npm run db:types` genererar `lib/databas.types.ts` ur den
lokala databasen och klienterna är typade mot den. Det var inte kosmetika: utan typerna
gissade supabase-js fel kardinalitet på inbäddade relationer — en `enhetsmall(...)` blev
en array — och 23 typfel var i själva verket ett och samma missförstånd. Med typerna på
plats föll kontrollen i stället på tre ställen där en uppräkning behandlades som fri
text, vilket var riktiga fel.

**Vyer i stället för etiketter i koden.** `nod_vy` och `kabel_vy` räknar fram en läsbar
etikett för varje punkt på ett ställe. Alternativet — att varje rullgardin, tabell och
senare ritning bygger sin egen variant — slutar med att de inte stämmer överens. Båda
vyerna är `security_invoker`.

**Kontaktdon instansieras fortfarande inte.** Se fas 0. Fas 1 gav ingen anledning att
ändra på det.

## Fel som uppstod och vad de kostade

**Villkoret gjorde varje icke-kärntyp privat (U-006).** `karna_saknar_agare` skrevs i fas
0 som `ar_karna = (agare is null)`, vilket också betyder att en typ utan ägare *måste*
vara kärna. MaxxECU:s WBO2-, EGT- och knackportar behöver systemgemensamma typer som
appen inte kontrollerar — och de gick inte att lägga in. Migrationen föll på sitt eget
villkor. Rättat med en ny migration, aldrig genom att ändra den gamla.

**Frödata krockade med startbiblioteket.** Fröfilen skapade `Injektor` och
`Kylvätsketempgivare`; migrationen skapade samma namn. Fröfilens heter nu `Provinjektor`
och `Provgivare temp`. Det är dessutom rätt i sak: provdata ska inte falla för att någon
byter namn på en riktig komponentmall.

**Variabelnamn krockade med kolumnnamn i PL/pgSQL.** `declare enhet_id uuid` mot
kolumnen `port.enhet_id` gav *"column reference enhet_id is ambiguous"*. Döpt till
`ny_enhet`.

**Klick nådde inte fram i den automatiserade webbläsaren.** Ett klick på inloggningens
knapp registrerades men utlöste ingen inskickning; `form.requestSubmit()` fungerade
direkt. Det är ett verktygsproblem, inte ett appfel — men värt att veta för nästa gång
något ska provköras.

## Avsteg från arbetsreglerna

**Fem migrationer kördes innan sin återställning fanns skriven.** `CLAUDE.md` säger
uttryckligen före, inte efter. Fas 0:s migrationer skrevs och dokumenterades i ett svep,
vilket kändes som att regeln var avklarad; fas 1:s kom en i taget och varje enskild kändes
för liten för att motivera ett stopp.

Regeln gäller per migration. Att det inte kostade något beror på att miljön var lokal och
kastbar — `R-011` är annars precis den återställning man vill ha skriven i förväg, eftersom
den raderar en pinout som matats in för hand.

Åtgärdat: återställningarna är skrivna, lärdomen är förd i
[lardomar.md](../lardomar.md), och **två vaktprov** faller nu om en migrationsfil saknas i
registret eller om registret hänvisar till en återställning som inte finns.

## Proven har setts falla

| Sabotage | Utfall |
|---|---|
| Standardrollen på `IGN 1` bytt till digital ingång | Stickprovet mot kopplingsbilden rött |
| `security_invoker` borttaget på `kabel_vy` | Vaktprovet rött |
| En rad i bärförmågetabellen satt till 99 A | Monotoniprovet och två areaförslag röda |
| En migrationsfil borttagen ur registret | Registervaktprovet rött |

Ett försök att flytta `IGN 1` till fel stift **gick inte att genomföra** — det unika
indexet `portstift_stift_unikt_idx` avvisade skrivningen. Sabotaget misslyckades därför
att en annan garanti höll, vilket är ett svar i sig.

Ett fynd värt att notera: när `security_invoker` togs bort från `kabel_vy` **läckte vyn
inte**. `postgres` är inte superuser i Supabase, så policyerna gällde ändå. Läckageprovet
ensamt hade alltså sagt "grönt" om en riktig felkonfiguration. Det är vaktprovet som
läser `reloptions` som faktiskt fångar det — och det hade inte funnits om proven bara
prövat beteende.

## Vad som prövades i den riktiga appen

- MaxxECU Race lades till i Evo-projektet. 80 portar instansierades, sex med två roller,
  standardrollerna satta.
- En vevaxelgivare lades till och kopplades till `TRIGGER`. Kopplingslistan visade
  *VR- eller frekvensingång* i båda ändar.
- **Rollen på `TRIGGER` byttes till digital ingång.** Kopplingslistan visade omedelbart
  *Digital ingång* i den änden — och därmed en givare av fel typ på ingången, vilket är
  precis vad signaltypskontrollen i fas 4 ska larma om. Det är F1-17 demonstrerad.
- En egen enhetsmall, `Link G4X`, skapades i gränssnittet: 32-poligt don med genererade
  stift A1–H4, och en port `OUT 1` på tre stift med högsidesdrivare som standardroll.

## Kvarstår, och varför

- **Ingen ritning.** Det är fas 2, och den är nästa.
- **Ingen kontroll.** Underdimensionerad area *visas* gult i tabellen, men det är
  presentation, inte den kontrollmotor F4-01 beskriver.
- **CI har fortfarande aldrig körts.** Ingen fjärrgren finns.
- **Bärförmågetabellen bör ögnas mot originalet.** Se ovan.
