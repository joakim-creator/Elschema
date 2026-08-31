# Bygglogg — fas 2, Ritvyn

**Datum:** 2026-08-31 · **Tagg:** `v0.2.0` · **Uppgifter:** F2-01 till F2-10, nio `KLAR`
och en `BLOCKERAD` · **Prov:** 83 gröna (14 nya) · **Migrationer:** 2 nya, totalt 16

Fasens mål var **överblicken** — den andra av de två sakerna som tar stopp i Excel. Ett
blad går nu att öppna och läsa, med styrenheten i mitten och komponenterna fläktade
utåt som i förlagan.

---

## Layouten är en ren funktion

`lib/schema/layout.ts` tar nätlistan och lämnar ifrån sig koordinater. Ingen
databasåtkomst, ingen slump, inga sidoeffekter. Två följder:

1. **Den prövas utan webbläsare.** Fjorton prov täcker sidplacering, hänvisningar,
   handflyttade lägen och att samma indata ger samma ritning — på under en sekund.
2. **Den kan inte ljuga.** Ritningen härleds ur nätlistan varje gång. Det finns ingen
   sparad ritning som kan hamna i otakt, vilket är vad [B-001](../beslutslogg.md)
   handlar om.

Handflyttade lägen sparas i `bladplacering` och läggs *ovanpå* den automatiska
placeringen som en förskjutning. Tabellen är avsiktligt inte en nätlistetabell, och
vaktprovet i `schema.test.ts` listar den inte — läget är presentation.

## Okopplade portar döljs men räknas

En MaxxECU Race har 80 portar. Ritas alla blir bladet oläsbart; utelämnas de tyst blir
ritningen en halvsanning. Ritvyn ritar bara portar som en kabel rör och skriver ut
*"79 okopplade portar döljs"* i verktygsraden.

## Ett fel som bara syntes i den riktiga ritningen

Bladet **Motorrum** filtrerar på zonen Motor. Injektorn ligger där, styrenheten i Kupé.
Kabeln mellan dem ritades **varken som streck eller som hänvisning** — den försvann
spårlöst från bladet.

Orsaken: layouten hanterade två fall — kablar som rör mittenhetens portar, och kablar
där båda ändarna syns. Kabeln med *en* synlig ände som inte var en port på mittenheten
föll mellan dem. Ett zonfilter skär rakt igenom sådana kopplingar, så fallet är inte
ovanligt utan det normala.

Ingen provsvit fångade det, eftersom alla prov utgick från noder som var kopplade till
mittenheten. Felet hittades genom att öppna ett riktigt blad och räkna strecken: sex
kablar i nätlistan, ett streck på skärmen.

Rättat, och två prov lades till: ett som kräver att kabeln ritas ut ur bladet med
hänvisning, och ett som kräver att en kabel med *båda* ändarna utanför inte ritas alls.
Båda sågs falla.

## Fel och avvägningar under vägen

**`create or replace view` kan inte skjuta in en kolumn.** `nod_vy` behövde `riktning`
och `enhet_id` för att kunna skilja ingång från utgång. Postgres svarade *"cannot change
name of view column"*. Båda vyerna släpps och skapas om i migration
`20260831001600`; `kabel_vy` hänger på `nod_vy` och måste tas först.

**Sidan gissades tidigare ur signaltypen.** Innan `riktning` fanns i vyn härleddes
vänster/höger ur vad porten var kopplad till, vilket blir fel för allt dubbelriktat.
Nu kommer riktningen från portmallen.

**Återställningarna skrevs före körning den här gången.** R-015 och R-016 stod i
registret innan migrationerna kördes — det var precis det som gick fel i fas 1, och
vaktprovet från den lärdomen bevakar det nu.

**Fel formulär träffades vid provkörning.** Ett skript som letade upp
`input[name=namn]` fick tag i projektets *inställningsformulär* i stället för
bladformuläret, och döpte om projektet till "Hela bilen". Upptäckt direkt, namnet
återställt. Två formulär med samma fältnamn på samma sida är ingen defekt för en
människa — etiketterna skiljer sig — men värt att veta för den som driver appen
automatiskt.

## F2-09 är blockerad, inte klar

Uppgiften är att märka ut skyddsfunktioner i schemat (L7). **Det finns inga
skyddsfunktioner förrän regler finns**, och regler kommer i fas 5. Att bygga en
utmärkning för något som inte kan uttryckas hade blivit en gissning om hur det kommer
att se ut. Uppgiften är flyttad dit den hör hemma.

Fasen är därmed klar på nio av tio uppgifter, och det är avsiktligt.

## Vad som prövades i den riktiga appen

- Bladet **Hela bilen** (utan filter): MaxxECU Race i mitten, `TRIGGER` till vänster med
  vevaxelgivaren, sex kablar ritade med färg, area och märkning, och *"79 okopplade
  portar döljs"* i verktygsraden.
- Bladet **Motorrum** (zonfilter): komponenterna i motorrummet, fem hänvisningar ut ur
  bladet — det var här felet ovan hittades.
- **Detaljrutorna** genereras ur bladets komponenter: `Injektor 1 · 1 → Skarv matning
  injektorer (12V INJ)`, `Injektor 1 · 2 → ECU · INJ 1 (INJ1)`, och så vidare.
- Skärmade kablar ritas streckade, grövre area ger tjockare streck, och jordpunkter får
  jordsymbol i sin klassfärg i stället för ett streck tvärs bladet.

## Kvarstår, och varför

- **Utskrift.** Det är fas 3, och den är nästa. Ritningen finns som SVG i webbläsaren
  men går ännu inte ut på papper.
- **Bandet under mitten blir trångt** när många kablar inte rör styrenheten. Radhöjden
  är höjd, men en riktig lösning är att gruppera per komponent i stället för per kabel.
  Noterat, inte gjort — det är inte i vägen för fas 3.
- **CI har fortfarande aldrig körts.** Ingen fjärrgren finns.

---

# Omtag efter provkörning — `v0.2.1`

**Datum:** 2026-08-31, samma dag · **Prov:** 85 gröna · **Migrationer:** 1 ny, totalt 17

Beställaren provkörde ritvyn och lämnade tre saker. Alla tre var riktiga.

## 1. En ruta per anslutning var fel

*"Jag skulle önska att ECU är en stor komponent med flera ingångar/utgångar. Nu
representeras varje utgång eller ingång av en egen ruta."*

Layouten grupperade inte. Varje port och varje komponentben blev sin egen låda, vilket
ser hanterligt ut med två noder och blir oläsligt vid trettio. Nu är **en ruta en enhet
eller en komponent**, med sina anslutningar som rader inuti. MaxxECU Race blir en låda
med åttio portrader, ingångar till vänster och utgångar till höger — som i förlagan.

## 2. Rutan hoppade iväg när man drog i den

Buggen var min egen och stod skriven i klartext i koden: `sparaPlacering` sparade
`ruta.x + förflyttning` — ett **absolut** läge — medan layouten lade på det sparade
värdet som en **förskjutning** ovanpå den automatiska placeringen. Varje drag räknades
alltså två gånger.

Rättningen blev tre saker, och de två sista hittades först när den första provats:

1. **Servern äger additionen.** `flyttaRuta` tar emot förflyttningen och lägger den till
   det som redan står. Klienten behöver aldrig känna till det tidigare värdet.
2. **Draget bär sin startpunkt**, inte sin senaste punkt. Första försöket ackumulerade i
   React-tillstånd och läste tillbaka det vid släpp — andra draget i rad blev noll,
   eftersom tillståndet inte hunnit committas.
3. **Den lokala förskjutningen jämförs mot sitt basläge.** När servern svarat har rutans
   läge i props ändrats, och då släpps förskjutningen av sig själv. Utan den jämförelsen
   får man antingen en ruta som hoppar tillbaka eller en som räknas dubbelt, beroende på
   vad som hinner först.

Prövat: dra 60 px → lagrat värde 67 (60 ÷ skalan 0,9) → rutan ligger kvar där den
släpptes efter serverns svar.

**En sidoupptäckt:** `setPointerCapture` kastar om pekaren inte längre är aktiv, och
kastet avbröt hela hanteraren så att draget aldrig startade. Nu inkapslat. Felet syns
som att ingenting händer när man drar, vilket är det svåraste slaget att felsöka.

## 3. Arbetssättet var bakvänt

*"Jag önskar att styrenheten ritas in först i bladet, därefter kan jag lägga till andra
komponenter från listan och därefter drar jag kabelkopplingarna."*

Se [B-015](../beslutslogg.md). Kort: ritningen är inmatningen, kopplingslistan är
utläsningen. Kabeln dras mellan två anslutningspunkter på duken och skapas **tom** —
area, färg och märkning fylls i efteråt.

Prövat hela vägen: drog från *Vevaxelgivare 1 · skärm* till *MaxxECU Race · GND SHIELD*,
kabeln skapades utan egenskaper, och raden dök upp i kopplingslistan som
`Vevaxelgivare 1 · skärm (Skärmjord) → MaxxECU Race · GND SHIELD (Skärmjord)`.

## Om provningen

Två av felsökningarna gick åt fel håll ett tag, av samma skäl: **provskriptet skickade
`pointerdown`, `pointermove` och `pointerup` i samma tick**. React hinner inte committa
tillstånd mellan dem, så draget såg trasigt ut i mätningen medan det fungerade för en
människa. Med 150 ms mellan händelserna stämde mätningen direkt.

Det ledde till minst en rättning som inte behövdes — men också till två som behövdes,
eftersom felet tvingade fram att draget inte får bero på när React committar.

**Vaktprovet från fas 1 gav sitt första riktiga utslag:** migration
`20260831001700_bladplacering_nyckel` saknades i registret i `databasandringar.md`.
Provet föll, raden skrevs. Det är precis vad lärdomen sa att det skulle göra.

---

# Andra omtaget — `v0.2.2`

**Datum:** 2026-08-31 · **Prov:** 96 gröna (11 nya) · **Migrationer:** 1 ny, totalt 18

Andra provkörningsomgången. Sex förbättringar och tre buggar, alla från beställaren.

## Vad som ändrades

**Stiftnumret står först.** Varje anslutning läses nu som `A2 · IGN 1`. Numret fanns i
`stiftmall` men syntes inte i vyn. En kanal som sitter på flera stift visar alla:
`B1, B2, B3 · OUT 1` — det är PDM-fallet från [B-011](../beslutslogg.md).

**Bladet fyller fönstret**, och har helskärmsläge. Projektlayouten är breddad till
120 rem och ritytan tar `100vh` minus rubrikerna.

**Beteckning och nummer föreslås.** Beteckningen är mallens namn med löpnummer inom
mallen; numret kommer ur en serie per kategori — se [B-016](../beslutslogg.md). Båda går
att skriva över. Räkningen är en ren funktion och prövas för sig.

**Detaljrutorna flyttade till egen sida.** De hörde inte hemma under ritningen: ritvyn
ska ha all plats, och detaljrutorna är en läslista man öppnar när man ska koppla. De
täcker nu enheter också, inte bara komponenter, och visar stiftnumret.

**Rutan går att vända.** Markera rubriken och tryck *Vänd stiften*. Automatiken vänder
dem mot styrenheten, men den som vill ha en snygg skiss måste kunna gå emot den.

## Tre buggar

**En nykopplad komponent flög ur bild.** Rutorna staplades uppifrån i sidokolumnen,
oberoende av vilken port de hängde på. En komponent kopplad till port 60 av 80 hamnade
längst upp medan kabeln gick åtta hundra bildpunkter nedåt — och just efter en koppling
såg det ut som att den försvann. Nu placeras rutan **i höjd med sin port** och trängs
undan nedåt bara om något annat redan står där. Prövat: vevaxelgivaren ligger 28 px från
sin `TRIGGER`-port i stället för 1 500 px ifrån.

**Nya komponenters stift låg alltid åt vänster.** En ruta utan kopplingar hade ingen
sida att vända sig ifrån, och föll tillbaka på `vanster`. Nu vänds de mot mitten, och
`vand`-flaggan låter en gå emot.

**Zoomen ändrade bara storleken.** Bilden växte medan rullningen stod still, så man
fortsatte titta på övre vänstra hörnet. Nu zoomas det kring ytans mitt.

Första rättningen satte rullningen direkt i `zooma()` med `requestAnimationFrame`, och
den fungerade inte: svg:n hade inte hunnit växa när återanropet kördes. Rullningen sätts
nu i `useLayoutEffect` på skalan — efter att DOM:en fått sin nya storlek. Prövat:
storleken växte 1,250 gånger och mittpunkten flyttade 1,250 gånger, alltså zoomas
skissen och inte bara bilden.

## Om ordningen

Migrationens återställning skrevs före körningen den här gången också. Vaktprovet gav
inget utslag, vilket är vad man vill av ett vaktprov när rutinen sitter.
