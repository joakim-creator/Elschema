# Arbetsregler

Läses automatiskt varje session. Håll den kort — det som står här ska vara sant och
gälla alltid. Regler som bara gäller ibland hör hemma i `docs/`, inte här.

Varje regel nedan finns för att den kostade något. Referenserna pekar på
[lärdomarna](docs/lardomar.md).

## Miljön

- Terminalen är **PowerShell 5.1**. `&&` finns inte — separera med `;` eller
  `if ($?) { ... }`. Kör `npx.cmd`, inte `npx`.
- Git-kommandon körs **från projektmappen**, aldrig från hemkatalogen.

## Innan något körs skarpt

- **Databasen före koden.** En migration som en driftsatt kodrad förutsätter körs
  *innan* koden slås ihop. Aldrig samtidigt, aldrig efter.
- **Varje migration har en dokumenterad återställning** i
  [databasandringar.md](docs/databasandringar.md) *innan* den körs. Ingen återställning,
  ingen körning.
- **Migrationer ändras aldrig i efterhand.** En körd migration är historik. Fel rättas
  med en ny migration.
- `npm run verify` ska gå igenom innan sammanslagning till `main`.
- Vid produktionsändringar: **ett steg i taget**, invänta bekräftelse mellan stegen.

## Hemligheter

- **Aldrig `git add -A`.** Lägg till namngivna filer. Inget undantag.
- Temporära filer, skript och datautdrag hör hemma **utanför repot**.
- Maskera nycklar och tokens i all utdata, även i felmeddelanden och loggar.
- En exponerad nyckel är komprometterad. Den **roteras** — att ta bort den ur
  historiken räcker inte.

## Prov

- **Ett prov du inte sett falla är inte ett prov.** Bryt det avsiktligt och se
  det bli rött innan du litar på att det är grönt.
- Ett prov som prövar åtkomst kräver **data i tabellen**. Utan rader passerar både
  "syns" och "syns inte", och sviten sover.
- Ett prov får aldrig radera data som andra prov förutsätter, och ska städa både
  underliggande och härledda tabeller.
- Påståenden av typen `antal > 0` passerar på skräp från förra körningen. Pröva det
  faktiska värdet.
- Regler som inte kan glömmas bort skrivs som **vaktprov** — ett prov som läser
  schemat eller koden och faller vid återfall. Se `tests/`-konventionen i
  [lardomar.md](docs/lardomar.md).

## Ändringar i kod

- **Skriptade ersättningar över större block räknar identifierare före och efter.**
  Ett `sed`-spann som råkar täcka en rad för mycket tar bort funktioner tyst.
- Efter en större omskrivning: kör bygget. Oanvänd import är ofta det enda spåret
  efter något som försvunnit.

## Påståenden

- **Säg inte att något är fallet utan att ha kört kommandot som visar det.** Ett
  kommando som ger tomt svar betyder inte alltid att det är tomt.
- Siffror i dokument hämtas ur källan vid skrivtillfället, aldrig ur minnet.
- Rekommendera ingen ändring vars kostnad inte är räknad på.

## Vid oklar indata

Gör indatan entydig hellre än att bygga en smartare gissare. Tre allt mer
avancerade tolkningar av tvetydig data slog fel; en inställning i källan löste det.
