# Intervju — underlag till projektspecifikationen

Arbetsdokument. Varje fråga har ett **förslag** — en gissning från min sida som du
kan bekräfta med "ja" eller skjuta ner. Svaren flyttas därefter in i
[projektspecifikationen](projektspecifikation.md) och frågan stryks här.

**Status:** `ÖPPEN` · `BESVARAD` · `ANTAGET` · `SKJUTS UPP`

`ANTAGET` betyder att förslaget står oemotsagt och att arbetet utgår från det — inte
att frågan är ställd och besvarad. Ett antagande är billigt att kasta om nu och dyrt
att kasta om senare; säg till om något av dem är fel.

---

## A. Syfte och användare

| # | Fråga | Förslag | Svar | Status |
|---|---|---|---|---|
| A1 | Vad ska appen göra som dagens verktyg inte gör? | Binder ihop *schemat* med *funktionen* — dagens ritverktyg drar streck men vet inte vad en injektorutgång är | Idag ritas det på papper eller i Excel. Att byta en ingång är tidsödande, och en textkolumn ger ingen överblick. Överblicken är det appen ska ge | BESVARAD |
| A2 | Vem ritar schemat? Du själv, en verkstad, eller en bredare publik? | Du själv och likasinnade — motorbyggare som kopplar egen styrenhet | ↤ enligt förslaget | ANTAGET |
| A3 | Hur många användare i första skedet? | Under tio. Egen användning först | ↤ enligt förslaget | ANTAGET |
| A4 | Vad kan användaren förväntas kunna? | Läser schema, men inte CAD. Verktyget får inte kräva elektrikerutbildning | ↤ enligt förslaget | ANTAGET |
| A5 | Vad är det första du själv skulle använda appen till, konkret? | — | Rita hela elsystemet på racebilen | BESVARAD |
| A6 | Ska det bli en produkt att sälja, eller ett verktyg för eget bruk? | Eget bruk först, produkt som öppen möjlighet | ↤ enligt förslaget | ANTAGET |

## B. Omfattning

| # | Fråga | Förslag | Svar | Status |
|---|---|---|---|---|
| B1 | Är det bara fordonsel, eller el i vidare mening? | Fordon och motorstyrning. Inte husinstallation, inte kretskortsdesign | **Hela fordonet**, inte bara motorstyrning: motorelektronik, CAN, instrument, belysning | BESVARAD |
| B2 | Ska appen kunna generera en **kabelstamsritning** (längder, skarvar, genomföringar)? | Nej i 1.0, men datamodellen ska inte utesluta det | ↤ enligt förslaget | ANTAGET |
| B3 | Ska appen räkna fram **area och säkring** utifrån last? | Ja — troligen en av de mer värdefulla funktionerna | ~~Nej~~ → **Ja för area, återtaget 2026-08-31.** Appen föreslår kabelarea utifrån last och varnar när vald area inte bär, tabellstyrt ur PDM-underlaget ([B-013](beslutslogg.md)). **Säkringar ingår inte** — de matas in och prövas bara mot port- och kanalgränser | BESVARAD |
| B4 | Ska befintliga scheman kunna importeras (PDF, bild, annat format)? | Nej i 1.0 | ↤ enligt förslaget | ANTAGET |
| B5 | Ska appen kunna generera **kod eller konfiguration** till styrenheten? | Nej — appen dokumenterar och prövar, den flashar inte | ↤ enligt förslaget | ANTAGET |

## C. Styrenheter och portar

| # | Fråga | Förslag | Svar | Status |
|---|---|---|---|---|
| C1 | Vilka styrenheter ska finnas färdiga från start? | En eller två du själv kör — namnge dem | **MaxxECU Race** och **MaxxECU PDM** som förval och mall. Andra styrenheter och uppsättningar ska gå att lägga till | BESVARAD |
| C2 | Hur beskrivs en port? | Nummer, kontaktdon, benämning, riktning (in/ut), signaltyp, max ström, intern pullup/pulldown | Enligt förslaget **plus stiftstorlek**. Strömgränsen sitter på både port och stift — lägsta gäller (litet stift 15 A, stort 25 A, GP-utgång 1,5 A) | BESVARAD |
| C3 | Vilka **signaltyper** måste stödjas? | Digital in/ut, analog in (0–5 V), frekvens/varvtal, PWM-ut, lågsidesdrivare, högsidesdrivare, H-brygga, CAN, matning, jord | **Fast kärna + egna tillägg.** Kärnan: sensorjord, VR-jord, skärmjord, chassi-/motorjord, 5 V sensormatning, 12 V matning, analog in, digital in, VR/frekvens in, PWM-ut, lågsidesdrivare, högsidesdrivare, tändutgång, injektorutgång, CAN H/L. Egna typer för udda fall (lambda COM/IP/RCAL/VS) tillåts och kontrolleras inte | BESVARAD |
| C4 | Har en styrenhet flera **kontaktdon** som ska ritas var för sig? | Ja — A/B/C-kontakt med egen stiftnumrering | ↤ enligt förslaget | ANTAGET |
| C5 | Kan samma port ha flera möjliga roller (digital in *eller* frekvensin)? | Ja, och appen ska hindra en koppling som vald roll inte tillåter | **Ja, och det är ett krav.** MaxxECU har `TACH / GP OUT 8`, `GP OUT 7 / Digital input 3`, `WBO2 HTR PIN 4 / GP OUT 9` — flera roller per port är hur enheten är byggd | BESVARAD |
| C6 | Var kommer styrenhetsdata ifrån — matar du in den för hand? | För hand först, ur tillverkarens pinout-tabell | ↤ enligt förslaget | ANTAGET |
| C7 | Ska en pinout kunna **versioneras** (firmware ändrar portens roll)? | Inte i 1.0 | ↤ enligt förslaget | ANTAGET |

## D. Komponenter

| # | Fråga | Förslag | Svar | Status |
|---|---|---|---|---|
| D1 | Vilka färdiga komponenter måste finnas vid första körbara version? | Injektor, tändspole, gaspedal (APP), trottelhus (DBW), oljetryck, kylvätsketemp, MAP, MAF, lambda, vevaxelgivare, kamaxelgivare, bränslepump, relä, säkring, jordpunkt, batteri | ↤ enligt förslaget | ANTAGET |
| D2 | Hur beskrivs en komponent? | Namn, kategori, anslutningar med funktion, strömförbrukning, spänningsområde, kontaktdon, symbol | ↤ enligt förslaget | ANTAGET |
| D3 | Ska komponenter ha **fabrikat och artikelnummer**, eller är de generiska? | Båda — en generisk mall som kan konkretiseras till en specifik artikel | **Tre nivåer: mall → artikel → instans.** "Injektor" → "Bosch 0280158123, 1000cc" → "Injektor 3". Byte av artikel slår igenom på alla instanser | BESVARAD |
| D4 | Egna komponenter — byggs de i ett formulär, eller genom att kopiera en befintlig? | Båda; kopiera-och-ändra är det som faktiskt används | ↤ enligt förslaget | ANTAGET |
| D5 | Ska egna komponenter kunna **delas** mellan användare? | Inte i 1.0 | ↤ enligt förslaget | ANTAGET |
| D6 | Behövs riktiga **elsymboler** (IEC/DIN), eller räcker egna ikoner? | Egna, tydliga symboler räcker. Standard är en senare fråga | ↤ enligt förslaget | ANTAGET |
| D7 | Hur hanteras en komponent i flera exemplar (sex injektorer)? | Instanser av samma mall, numrerade, med egen koppling per instans | ↤ enligt förslaget | ANTAGET |

## E. Kablar och koppling

| # | Fråga | Förslag | Svar | Status |
|---|---|---|---|---|
| E1 | Vad är en kabel i modellen — punkt till punkt, eller en ledare som kan förgrenas? | Punkt till punkt i 1.0; förgrening löses med skarvpunkt som egen nod | **Punkt till punkt.** Varje kabel bär egen area och längd; förgrening görs med skarvpunkt som eget objekt | BESVARAD |
| E2 | Vilka egenskaper bär en kabel? | Area, färg, längd, skärmad ja/nej, etikett, kontakttyp i vardera änden | ↤ enligt förslaget | ANTAGET |
| E3 | Ska appen **hindra** felaktiga kopplingar, eller bara varna? | Varna högt, hindra bara det som är fysiskt omöjligt | Enligt förslaget. **Jordarna är skilda nätklasser** — en hopkoppling av sensorjord och chassijord är möjlig men dum, alltså hög varning, inte hinder | BESVARAD |
| E4 | Hur dras kabeln visuellt — automatiskt eller för hand? | Automatisk dragning med flyttbara brytpunkter | ↤ enligt förslaget | ANTAGET |
| E5 | Ska jord och matning ritas som streck, eller som symboler? | Symboler, annars blir schemat oläsligt | ↤ enligt förslaget | ANTAGET |

## F. Flera styrenheter och CAN

| # | Fråga | Förslag | Svar | Status |
|---|---|---|---|---|
| F1 | Vad betyder "miljö" — ett fordon med flera styrenheter? | Ja: ett projekt = ett fordon = flera styrenheter på en eller flera bussar | ↤ enligt förslaget | ANTAGET |
| F2 | Hur djupt ska CAN modelleras? | Buss med hastighet, terminering och noder. Meddelanden och signaler (DBC-nivå) är senare fas | Buss och noder i 1.0 | BESVARAD |
| F3 | Ska DBC-filer kunna importeras? | Inte i 1.0, men F2 ska inte omöjliggöra det | Följer av L3: CAN-signaler bärs av signalbegreppet. DBC-import är fortsatt utanför 1.0 | BESVARAD |
| F4 | Ska appen varna för saknad terminering eller fel antal noder? | Ja | ↤ enligt förslaget | ANTAGET |

## G. Funktionsdiagram och förklaringar

| # | Fråga | Förslag | Svar | Status |
|---|---|---|---|---|
| G1 | Är funktionsdiagrammet en *andra vy* av samma data, eller något du ritar separat? | Andra vy: samma noder, grupperade efter funktion i stället för fysisk plats | Ja — andra vy. Ändras schemat följer diagrammet med | BESVARAD |
| G2 | Vad ska en funktionsförklaring innehålla? | Fritext plus genererad kedja: givare → port → styrenhet → utgång → ställdon | ↤ enligt förslaget | ANTAGET |
| G3 | Ska förklaringen skrivas av dig, eller genereras? | Genereras som utkast, redigeras för hand | ↤ enligt förslaget | ANTAGET |
| G4 | Ge ett exempel på en funktion du vill kunna förklara i appen | — | Fem fall, samtliga villkorsstyrda: fläkt 50 % PWM över 75 °C och 100 % över 80 °C · oljetryck under 2 bar ger mjuk varning, under 1 bar skyddsläge som bryter tändningen · bromsljus blinkar vid motorstopp tills motorn går igen · generatorlampa lyser när tändning är på men motorn står · 12 V-utgång fäller ner vingen över 100 km/h | BESVARAD |

## H. Elektrisk provning

| # | Fråga | Förslag | Svar | Status |
|---|---|---|---|---|
| H1 | Vad menar du med "testa elektriska flöden"? | Följ strömvägen från batteri via säkring och relä till last och åter till jord, och visa var den bryts | Ja, det är golvet | BESVARAD |
| H2 | Statisk kontroll eller simulering över tid? | Statisk kontroll av en tillståndsbild (tändning på/av, relä draget/ej) | **Tillståndslägen i 1.0, med riktig kretsberäkning som uttalat mål senare.** Datamodellen byggs som nätlista från dag ett så att steget dit inte kräver omskrivning | BESVARAD |
| H3 | Ska spänningsfall och strömmar räknas? | Ja på enkel nivå: last, area och längd ger fall i volt och varning över tröskel | **Nej i 1.0 — omprövat 2026-08-31 och står kvar.** Skälet är inte längre att appen saknar åsikt om dimensionering, utan att bärförmåga och spänningsfall är olika sorters frågor. Area och längd lagras ändå | BESVARAD |
| H4 | Ska felfall kunna simuleras (bruten kabel, kortslutning mot jord)? | **Utanför 1.0** — hör ihop med att köra reglerna, som sköts fram (L1) | ↤ enligt förslaget | ANTAGET |
| H5 | Vilka kontroller ska alltid gå att köra på ett färdigt schema? | Öppen ingång, dubbelbokad port, last utan säkring, saknad jord, överskriden portström | **Alla fyra:** kopplingsfel · ström över angiven gräns · regelfel · signaltypsfel | BESVARAD |

## I. Utdata

| # | Fråga | Förslag | Svar | Status |
|---|---|---|---|---|
| I1 | Vad ska kunna tas ut ur appen? | Schema som PDF, kopplingslista per kontaktdon, komponentlista, kabellista | Enligt förslaget. **Utskrift är uttalat krav** — schemat ska ut i pappersform | BESVARAD |
| I2 | Ska schemat kunna skrivas ut på A3 och tas med till garaget? | Ja — utskrift är krav, inte bonus | **Ja.** A4 och A3 som standardval, plus **fri storlek i mm**. Skalan är valbar | BESVARAD |
| I3 | Ska ett projekt kunna delas som länk? | Inte i 1.0 | ↤ enligt förslaget | ANTAGET |
| I4 | Behövs utskrivbara kabeletiketter? | Trevligt, men senare fas | ↤ enligt förslaget | ANTAGET |

## J. Plattform och teknik

| # | Fråga | Förslag | Svar | Status |
|---|---|---|---|---|
| J1 | Webb, skrivbord eller surfplatta? | Webb i webbläsare på dator; ska fungera på surfplatta i garaget | Webb. Ritas på dator, läses på surfplatta | BESVARAD |
| J2 | Måste den fungera **utan nät**? | Läsning offline är värdefullt i ett garage; redigering offline är dyrt | Nej. Online bara i 1.0 | BESVARAD |
| J3 | Var lagras data? | Samma uppsättning som dina andra projekt om inget talar emot — säg vilken | Samma som hälsoappen: Next.js, Supabase (Postgres + auth), Vercel | BESVARAD |
| J4 | Inloggning — behövs det i 1.0? | Ja, enklast möjliga; annars går data inte att skydda | **Supabase Auth**, e-post och lösenord, sluten grupp med inbjudan — samma mönster som hälsoappen | BESVARAD |
| J5 | Finns ett kostnadstak för drift? | Ryms i Supabase och Vercels gratisnivåer; inget tak byggs i 1.0 | ↤ enligt förslaget | ANTAGET |
| J6 | Personuppgifter utöver konto? | Nej | ↤ enligt förslaget | ANTAGET |

## K. Klart

| # | Fråga | Förslag | Svar | Status |
|---|---|---|---|---|
| K1 | Vad måste finnas för att version 1.0 ska kallas klar? | Ett fullständigt schema för *ett* riktigt motorprojekt, utskrivet och kontrollerat | Hela elsystemet på Evo 8 ritat, kontrollerat och utskrivet | BESVARAD |
| K2 | Vilket riktigt projekt är provfallet? | — | Mitsubishi Evo 8, racebil | BESVARAD |
| K3 | Finns en tidpunkt det ska vara klart till? | Ingen bestämd tidpunkt | ↤ enligt förslaget | ANTAGET |

## L. Funktionslogik — *ny efter svar på G4*

Exemplen i G4 är inte förklaringar av en koppling, de är **villkorsregler**: tröskel,
hysteres, tillstånd och tid. Det är ett eget område som inte fanns i den ursprungliga
beskrivningen och som styr både datamodell och omfattning.

| # | Fråga | Förslag | Svar | Status |
|---|---|---|---|---|
| L1 | Ska appen **köra** reglerna, eller bara beskriva dem? | Köra — sätt kylvätsketemp till 78 °C och se fläktutgången gå till 50 %, och strömvägen dit tändas i schemat. Det är samma provningsläge som H2 | **Beskriv strukturerat, kör inte.** Regeln lagras som villkor och tröskel kopplat till rätt port — sökbar, utskrivbar, kontrollerbar. Körning kan läggas till senare på samma data | BESVARAD |
| L2 | Hur uttrycksfull måste en regel vara? | Tröskel med hysteres, jämförelse mot signal, och/eller-villkor, tillstånd (motor går / står), tid (blinkfrekvens, fördröjning) | **Strukturerat skal, fritext i villkoret** — se dock motsägelsen mot H5 (regelfel), fråga L8 | BESVARAD* |
| L3 | Var kommer värden som "100 km/h" ifrån? | Ett **signalbegrepp**: namngivet värde med enhet och källa (givare på port, CAN, eller härlett). Utan det går G4-exemplen inte att uttrycka | **Namngiven signal med fri källa** — namn, enhet och källa (port, CAN eller härledd), utan att CAN-meddelanden modelleras | BESVARAD |
| L4 | Ska reglerna motsvara MaxxECU:s egna villkorsutgångar? | Ja i form — så att det du ritar går att känna igen i MTune. Men appen skriver ingen konfiguration | ↤ enligt förslaget | ANTAGET |
| L5 | "Motorn går" och "motorstopp" — hur vet appen det? | Härledd signal med egen definition (varvtal över tröskel), som du kan ändra | ↤ enligt förslaget | ANTAGET |
| L6 | Hur modelleras PDM-utgångar jämfört med säkring och relä? | En PDM-kanal är en utgång med programmerbar strömgräns — ersätter säkring *och* relä. Båda världarna måste finnas i samma schema | **Egen objekttyp** med kanaler, strömgränser och skyddslägen | BESVARAD |
| L7 | Ska en regel kunna hänga på en **säkerhetsfunktion** (skyddsläge bryter tändning)? | Ja, och den ska märkas ut i schemat som just skydd — inte som vilken utgång som helst | ↤ enligt förslaget | ANTAGET |

## M. Utseende och layout — *efter MaxxECU-bilden*

| # | Fråga | Förslag | Svar | Status |
|---|---|---|---|---|
| M1 | Är den ECU-centrerade layouten standardvyn? | Ja: styrenhet i mitten, ingångar till vänster, utgångar till höger, komponenter fläktade utåt | ↤ enligt förslaget | ANTAGET |
| M2 | Behövs detaljrutor i kanten, som i MaxxECU-bilden? | Ja — kontaktdonsstiftlägen, relädragning, kopplingsvarianter. Genereras ur den komponent de beskriver | ↤ enligt förslaget | ANTAGET |
| M3 | Ska kabelfärg och kabelmärkning skrivas ut vid strecket? | Ja, båda — färgen som ord vid strecket, märkningen i avvikande färg som i förlagan | ↤ enligt förslaget | ANTAGET |
| M4 | Ett blad per projekt, eller flera? | Flera: motorrum, kupé, bak, kraftfördelning. Samma nätlista, olika blad | **Både och — bladet är en filtrering av nätlistan.** Anslutningar och komponenter taggas med zon (motor, framparti, kupé, bakparti); ett blad är en sparad filtrering på zon *eller* på styrenhet | BESVARAD |
| M5 | Var lägger vi MaxxECU-bilden som referens? | `docs/referens/` i projektmappen — säg till så pekar jag ut den från specifikationen | ↤ enligt förslaget | ANTAGET |

### Motsägelse L2 ↔ H5

| # | Fråga | Förslag | Svar | Status |
|---|---|---|---|---|
| L8 | H5 valdes med *överlappande trösklar* bland regelfelen, men L2 lägger villkoret i fritext — då kan appen inte jämföra trösklar. Hur löser vi det? | Skalet bär `signal · jämförelse · värde · målport · målläge` som fält, fritext blir förklaringen bredvid. Då fungerar alla fyra kontroller och inmatningen är fortfarande fem fält | **Ja, kör på skalet.** `signal · jämförelse · värde · målport · målläge` som fält, fritext som förklaring bredvid | BESVARAD |

### Utskrift — *tillägg 2026-08-31*

| # | Fråga | Förslag | Svar | Status |
|---|---|---|---|---|
| I5 | Vilka format? | A4 och A3 som standardval, fri storlek i mm därutöver | **Ja.** Fri storlek täcker A2 och A1 för den som har plotter | BESVARAD |
| I6 | Vad händer när ett blad inte får plats i vald skala? | Du styr sidbrytningen själv; en kabel som lämnar sidan får en genererad hänvisning till sidan den fortsätter på. Automatisk delning finns som hjälp, inte som tvång | **Ja.** Vill kunna hålla mig inom A3 och hänvisa en kabel vidare till nästa sida. Delning ska vara valbar, inte påtvingad | BESVARAD |
| I7 | Är en utskriftssida samma sak som ett blad? | Ja — sidan *är* bladet. Samma filtrering, samma hänvisningsmekanik som mellan zoner | | ANTAGET |
