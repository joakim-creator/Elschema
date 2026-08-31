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
