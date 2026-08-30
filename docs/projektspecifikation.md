# Projektspecifikation

> Skrivs först och ändras medvetet. Backloggen bryter ner den här filen; går de isär
> är det specifikationen som gäller tills den ändras.
>
> **Status 2026-08-31:** intervjun är genomgången, inklusive antagandena i
> datamodellen. Av 72 frågor är 35 besvarade av beställaren och 37 `ANTAGET` — förslag
> som står oemotsagda och som arbetet utgår från tills någon säger emot. Vilka som är
> vilka framgår av [intervjun](intervju.md).

## 1. Vad som byggs

Ett verktyg för att rita ett fordons elsystem som nätlista kring dess styrenheter,
förklara vad varje funktion gör och pröva vad som händer när ett villkor slår om.

## 2. Vem det är för

Byggaren själv först, därefter likasinnade motorbyggare som kopplar egen styrenhet.
Under tio användare i första skedet. De läser schema men inte CAD — verktyget får inte
kräva ritvana. (A2–A4, `ANTAGET`)

Idag ritas det på papper och i Excel. Det tar stopp vid två saker, och båda är skälet
till att appen finns:

1. **Att byta en ingång är tidsödande.** Ett stift som flyttas ska slå igenom överallt.
2. **En textkolumn ger ingen överblick.** Excel vet inte att sex rader är samma
   kabelstam.

Eget bruk först. Att det blir en produkt är en öppen möjlighet, inte ett krav som får
styra 1.0. (A6, `ANTAGET`)

## 3. Vad som uttryckligen inte ingår

- **Spänningsfall.** Omprövat 2026-08-31 när dimensioneringen kom in, och nejet står
  kvar: bärförmåga och spänningsfall är olika sorters frågor. Area och längd lagras
  ändå, så beräkningen kan läggas till med kretsberäkningen. (H3)
- **Säkringsdimensionering.** Appen har åsikt om kabeln, inte om säkringen. Säkringens
  värde matas in och prövas bara mot port- och kanalgränser. (B3)
- **Att köra reglerna.** Regler lagras strukturerat men appen räknar inte ut vad som
  händer när temperaturen stiger. ([B-004](beslutslogg.md))
- **Felfallssimulering** — bryt en kabel och se vad som slocknar. Hör ihop med att köra
  reglerna och följer med den. (H4, `ANTAGET`)
- **Offlineläge.** (J2)
- **Kabelstamsritning**, import av befintliga scheman, konfiguration eller flashning av
  styrenheten, DBC-import, delning mellan användare, delningslänkar, utskrivbara
  kabeletiketter. (B2, B4, B5, F3, D5, I3, I4)

Utanför i vidare mening: husinstallation och kretskortsdesign. Omfattningen är
**hela fordonet** — motorelektronik, CAN, instrument, belysning, kraftfördelning — inte
bara motorstyrning. (B1)

## 4. Krav som styr tekniken

- **Webb.** Ritas på dator, läses på surfplatta i garaget. (J1)
- **Nätlista, inte ritning.** Provningen börjar på tillståndsnivå men ska kunna växa
  till riktig kretsberäkning. Kravet gäller *datamodellen från dag ett*: kablar och
  komponenter är elektriska element, ritningen är en vy. (H2,
  [B-001](beslutslogg.md))
- **Stack:** Next.js, Supabase (Postgres + auth), Vercel — samma som hälsoappen.
  (J3, [B-002](beslutslogg.md))
- **Kräver nät.** (J2)
- **Inloggning:** Supabase Auth, e-post och lösenord, sluten grupp med inbjudan. (J4)
- **Appen dimensionerar kabelarea — och bara den.** Tabellstyrt ur PDM-underlagets
  bärförmågetabell: förslag utifrån last, varning när vald area inte bär. Förslaget går
  att köra över och varningen anger sin tabellrad. Säkringar och spänningsfall ingår
  inte. (B3 delvis återtagen, [B-013](beslutslogg.md))
- **Utskrift är krav, inte bonus.** Schemat ska ut i pappersform: PDF med A4 och A3 som
  standardval, fri storlek i mm därutöver, och valbar skala. (I1, I2, I5,
  [B-009](beslutslogg.md))
- **Styrenheter är data, inte kod.** MaxxECU Race och MaxxECU PDM är förval och mall;
  andra fabrikat och uppsättningar ska gå att lägga till utan kodändring. (C1)
- Kostnadstak: ryms i gratisnivåerna, inget tak byggs i 1.0. Inga personuppgifter
  utöver kontot. (J5, J6, `ANTAGET`)

## 5. Datamodell

Grovskiss. Tabellerna skrivs i fas 0 och förs in i
[databasandringar.md](databasandringar.md) i takt med migrationerna.

```
Projekt (fordon)
 ├── Enhet (styrenhet, PDM, EXP) ─── tak för hela enheten, t.ex. 230 A
 │     ├── Kontaktdon ─── Stift (storlek, max ström)
 │     ├── Port / kanal (nr, riktning, roller, max ström) ─── 1..N stift
 │     └── CAN-nod (terminerad ja/nej)
 ├── Komponentmall ─── Artikel ─── Komponentinstans ─── Anslutning
 ├── Signaltyp (kärna: kontrolleras · egen: lagras men kontrolleras inte)
 ├── Nod (elektrisk punkt: port, kanal, anslutning, skarv, jordpunkt)
 │      jord/referens bär klass **och ägande enhet** — ECU:ns sensorjord
 │      och PDM:ns är båda "sensorjord" men får aldrig kopplas ihop
 ├── Kabel: nod → nod  (area, **kabeltyp**, färg, längd, skärmad, märkning,
 │                       kontakttyp/ände)
 ├── Bärförmåga (area · AWG · thin-wall A · vanlig kabel A)   frödata, utbytbar
 ├── Buss (CAN) ─── noder. Hastighet på bussen, terminering på noden
 ├── Signal (namn, enhet, källa: port | CAN | härledd)
 ├── Regel (signal · jämförelse · värde · målport · målläge + förklaring)
 ├── Zon (motor, framparti, kupé, bakparti, …)  taggar noder och komponenter
 ├── Blad = sparad filtrering på zon och/eller styrenhet
 └── Funktion ─── ingående noder och regler + förklaring
```

Avgjort:

- **Kabeln går punkt till punkt** och bär egen area och längd. Förgrening görs med en
  skarvpunkt som är ett eget objekt i nätlistan. (E1)
- **Regeln har fem fält** — signal, jämförelse, värde, målport, målläge — och fritexten
  är förklaringen bredvid, inte villkoret. Det är vad kontrollen "överlappande
  trösklar" kräver för att gå att bygga. (L2, L8)
- **Signalen** bär namn, enhet och källa. En CAN-buren signal går att använda i en
  regel utan att CAN-meddelanden modelleras — det löser "över 100 km/h" utan
  DBC-modell. (F2, L3)
- **PDM är en egen objekttyp** med kanaler, strömgränser och skyddslägen, inte en
  säkring med relä, eftersom gränsen är programmerbar och kanalen kan styras av en
  regel. (L6)
- **Blad är filtreringar**, inte ritningar. ([B-003](beslutslogg.md))
- Funktionsdiagrammet är en **vy** av samma noder, grupperade efter funktion. (G1)
- **En port kan bära flera roller** — och det är ett krav, inte en bekvämlighet.
  Förlagan har `TACH / GP OUT 8`, `GP OUT 7 / Digital input 3` och
  `WBO2 HTR PIN 4 / GP OUT 9`. Vald roll avgör vad som får kopplas dit. (C5)
- **Jord och referens bär klass *och* ägande enhet.** Två punkter får kopplas ihop
  bara om båda stämmer. Chassi- och motorjord är den enda gemensamma klassen.
  Hopkoppling är tillåten men ger hög varning. ([B-010](beslutslogg.md), ersätter
  B-005)
- **Signaltyper har en fast kärna** som appen kontrollerar, plus egna typer som lagras
  men lämnas okontrollerade. ([B-006](beslutslogg.md))
- **Strömgränsen gäller i tre nivåer** — stift, kanal och enhet. PDM20 har ett tak på
  230 A som ligger långt under summan av kanalernas märkström. En kanal sitter på
  flera stift (`OUT 1` → stift 1, 10, 18). ([B-011](beslutslogg.md), ersätter B-007)
- **Terminering hör till noden**, inte bussen. MaxxECU har inbyggd 120 Ω,
  EXP-modulen har ingen. ([B-012](beslutslogg.md))
- **Komponenter i tre nivåer:** mall → artikel → instans.
  ([B-008](beslutslogg.md))
- **Skyddsfunktioner märks ut** i schemat, inte som vilken utgång som helst. (L7,
  `ANTAGET`)

## 6. Åtkomstregler

Sluten grupp. Ett projekt ägs av den som skapat det och syns inte för andra. Egna
komponentmallar är privata; systembiblioteket är läsbart för alla och skrivbart för
ingen. Row Level Security på samtliga tabeller, med rader i varje delad tabell i
`seed.sql` så att åtkomstproven faktiskt prövar något.

## 7. Externa beroenden

| Beroende | Gräns att räkna på |
|---|---|
| Supabase (Postgres, auth) | Gratisnivå. Ett fordonsschema är några tusen rader — ryms med marginal |
| Vercel | Gratisnivå |
| PDF-generering | Ingen extern tjänst. Renderas ur samma vy som skärmen |

Inga API:er med anropstak eller kostnad per anrop. Beroendelistan är kort med avsikt.

## 8. Vad "klart" betyder

Version 1.0 är klar när **hela elsystemet på en Mitsubishi Evo 8 racebil** — motor-
elektronik, CAN, instrument och belysning — går att rita, kontrollera och skriva ut i
appen. (K1, K2)

Provfallet är styrande: det avgör vilka komponenter, portar och funktioner som måste
finnas, och vilka som får vänta. Ingen bestämd tidpunkt. (K3, `ANTAGET`)

Fyra kontroller ska gå att köra på det färdiga schemat (H5):

1. **Kopplingsfel** — två kablar på samma port, anslutning utan kabel, kabel som slutar
   i tomma intet, last utan jord, **jordklasser hopkopplade**.
2. **Ström över gräns** — prövas i tre nivåer: stift, kanal och enhetstak. Enhetstaket
   kan slå till även när varje enskild kanal är inom sin gräns. Jämförelse mot angivet värde, inte
   dimensionering. Instanser utan vald artikel saknar strömvärde; de hoppas över och
   räknas upp som *ej kontrollerade*, aldrig som godkända.
3. **Regelfel** — två regler på samma utgång, regel på en port som inte är utgång,
   regel på en signal utan källa, överlappande trösklar.
4. **Signaltypsfel** — komponent på en port vars valda roll inte passar.

## 9. Leveransordning

Varje fas slutar med något som går att använda. Det är först i användning felen syns.

| Fas | Innehåll | Vad som går att använda efteråt |
|---|---|---|
| **0 — Fundament** | Repo, stack, datamodell som nätlista, RLS, seed, CI | Något går att köra och pröva |
| **1 — Nätlistan** | MaxxECU Race pinout, kontaktdon med stift, portar med roller, komponentbibliotek i tre nivåer, kablar punkt till punkt | **Ersätter Excel.** Ett stift som flyttas slår igenom överallt — den första av de två smärtpunkterna är borta |
| **2 — Ritvyn** | ECU-centrerad rendering ur nätlistan, zontaggar, blad som filtrering, jord och matning som symboler | **Överblicken.** Den andra smärtpunkten är borta |
| **3 — Utskrift** | PDF, A4 och A3 som standardval plus fri storlek i mm, valbar skala, sidhänvisningar för kablar som lämnar sidan, besked *före* export om något inte får plats | **Papper i garaget.** Schemat går att ta med till bilen |
| **4 — Kontroller på nätlistan** | Kopplingsfel inklusive hopkopplade jordklasser, ström över gräns, signaltypsfel | Ett schema går att lita på |
| **5 — Signaler och regler** | Signalbegrepp, regelskalets fem fält, regelfelkontrollerna | Funktionerna i G4 går att skriva in och kontrollera |
| **6 — PDM och CAN** | PDM som egen typ med kanaler, buss med terminering och nodvarning | Kraftfördelningen på Evo:n går att rita |
| **7 — Funktionsvy** | Funktionsgruppering, genererad kedja givare → port → styrenhet → utgång → ställdon | Ett schema går att förklara för någon annan |
| **8 — Listor** | Kopplingslista per kontaktdon, komponentlista, kabellista | Det går att beställa material efter schemat |
| **9 — Evo 8** | Hela fordonet inmatat, kontrollerat och utskrivet | **1.0** |

Fas 1 och 2 är valda i den ordningen med avsikt: de motsvarar exakt de två sakerna som
tar stopp idag, och båda går att använda innan någon kontroll eller regel finns.

**Fas 3 flyttades fram** (2026-08-31) från att ha legat sist ihop med listorna.
Utskriften använder i allt väsentligt samma renderare som fas 2, så den kostar lite där
och ger papper flera faser tidigare. Listorna ligger kvar sent i fas 8 — de behöver
ingen renderare och tjänar inget på att komma före.

PDM ligger i fas 6 men får flyttas fram om Evo-bygget kräver kraftfördelningen tidigare
än ritvyn — det är den enda fasordning som är osäker.

## 10. Produktbeslut

| Datum | Beslut | Skäl |
|---|---|---|
| 2026-08-30 | MaxxECU Race + MaxxECU PDM är förval och mall, men styrenheter är utbytbara data | Det är vad provfallet kör. En inbyggd MaxxECU-modell hade gjort andra uppsättningar omöjliga (C1) |
| 2026-08-30 | Provfallet är Evo 8 i sin helhet, inte bara motorstyrningen | "Klart" måste gå att avgöra utan smaksak (K1, K2) |
| 2026-08-30 | ~~Appen dimensionerar inte~~ | ~~Byggaren väljer area och säkring; en app som har åsikt om det skulle behöva ha rätt (B3)~~ **Återtaget 2026-08-31** |
| 2026-08-31 | Appen dimensionerar kabelarea, tabellstyrt — men inte säkring och inte spänningsfall | Underlaget fanns redan i PDM-dokumentet, och det gör kabeldragningen enklare. Båda de andra omprövades samma dag och lämnades utanför ([B-013](beslutslogg.md)) |
| 2026-08-31 | Stöd för EXP-modulen byggs, trots att den inte sitter på Evo:n | Underlaget finns, och modulen delar allt som är nytt i fas 6 — egna referenser, H-bryggor, CAN utan terminering (U-005) |
| 2026-08-30 | Regelvillkoret är fält, inte fritext | Fritext gör kontrollen "överlappande trösklar" omöjlig, och den kontrollen var beställd (L8) |

## 11. Förlaga

MaxxECU:s egen kopplingsbild (REV9+, 2021-03-03) är riktmärke för layouten: styrenheten
i mitten, ingångar till vänster, utgångar till höger, kabelfärg som ord vid strecket,
kabelmärkning i avvikande färg, och detaljrutor i kanten för det som behöver egen
förklaring — relädragning, kontaktdonsstiftlägen, kopplingsvarianter.

Vad förlagan *inte* klarar, och som är hela skälet till projektet: den är en bild. Den
går inte att ändra, den vet inte vad den visar, och den kan inte svara på en fråga.

Bildfilen läggs i [`referens/`](referens/) — se mappens `README.md`.
