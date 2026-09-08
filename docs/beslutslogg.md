# Beslutslogg

Tekniska beslut som fattas under arbetets gång, och **varför** de togs.
Produktbesluten står i [projektspecifikationen](projektspecifikation.md).

Ett beslut ändras inte i efterhand — det ersätts av ett nytt som hänvisar tillbaka.
Då syns det i loggen att något ändrades och varför, i stället för att historien
skrivs om. Ett ersatt beslut som står kvar är inte pinsamt; det är den enda
kvarvarande förklaringen till varför den uppenbara lösningen inte fungerade.

**Status:** `GÄLLER` · `ERSATT AV B-xxx` · `ÅTERTAGET`

---

## B-001 — Nätlistan är sanningen, ritningen är en vy

**Datum:** 2026-08-30 · **Status:** GÄLLER

Provningen börjar på tillståndsnivå (följ strömvägen, slå om tändning och reläer),
men riktig kretsberäkning är ett uttalat mål längre fram. Ett ritverktyg som lagrar
streck med koordinater och hänger på elektriska egenskaper i efterhand kan inte växa
dit — nätlistan går inte att härleda ur en ritning där två streck som ser ut att mötas
inte behöver vara samma nod.

**Beslut:** datamodellen är en **nätlista**. Noder är elektriska punkter, element är
kablar och komponenter med resistans, last och spänningsområde. Skärmläget är en vy
som renderas ur nätlistan. Koordinater lagras som presentationsdata bredvid, aldrig
som bärare av elektrisk mening.

**Konsekvens:** en koppling som inte går att uttrycka som nätlista går inte att rita —
det tvingar fram tydlighet tidigt och gör ritläget något styvare än ett fritt
ritprogram. I gengäld kan kretsberäkning läggas till utan att röra lagringen, och
kontroller som "saknad jord" och "öppen ingång" faller ut av grafen i stället för att
behöva egen logik.

## B-002 — Samma stack som hälsoappen

**Datum:** 2026-08-30 · **Status:** GÄLLER

Projektet kan välja fritt, men arbetsreglerna i `CLAUDE.md` förutsätter versionerade
migrationer och åtkomstkontroll på tabellnivå, och de rutinerna finns redan inkörda.

**Beslut:** Next.js (App Router), Supabase (Postgres + auth), Vercel. Migrationer via
Supabase CLI, versionerade i git.

**Konsekvens:** ingen ny verktygskedja att lära in, släpprutinen och
[databasandringar.md](databasandringar.md) fungerar som de gör i hälsoappen. Priset är
att appen kräver nät i 1.0 — se avsnitt 4 i specifikationen — och att ritläget måste
klara att hålla ett stort schema i klienten mellan sparningar.

## B-003 — Ett blad är en filtrering, inte en ritning

**Datum:** 2026-08-30 · **Status:** GÄLLER

Provfallet är ett helt fordon. Allt på en yta blir oläsligt på papper, men separata
ritningar per zon innebär att samma kabel finns på två ställen och kan gå isär.

**Beslut:** anslutningar och komponenter bär **zontagg** (motor, framparti, kupé,
bakparti, …). Ett blad är en **sparad filtrering** av nätlistan — på zon, på styrenhet,
eller på båda. Ingen ritning existerar utanför nätlistan.

**Konsekvens:** en kabel som korsar en bladgräns syns automatiskt som avbruten i
vardera änden och behöver en genererad hänvisning, precis som i ett verkstadsschema.
Det är merarbete i renderaren. I gengäld kan ingen zonvy visa något som schemat inte
innehåller, och en ny bladindelning kostar ingenting att införa. Följer av
[B-001](#b-001--nätlistan-är-sanningen-ritningen-är-en-vy).

## B-004 — Regler beskrivs strukturerat, men körs inte i 1.0

**Datum:** 2026-08-30 · **Status:** GÄLLER

Funktionsexemplen är villkorsregler med tröskel, hysteres, tillstånd och tid. Att köra
dem är ett eget maskineri; att inte lagra dem strukturerat gör att appen aldrig kan
upptäcka att två regler tar samma utgång.

**Beslut:** en regel lagras strukturerat — villkor på namngiven signal, tröskel,
måltillstånd på en utpekad port. Appen räknar **inte** ut vad som händer. Fritext finns
kvar som komplement, inte som ersättning.

**Konsekvens:** kontroller som "två regler styr samma utgång" och "regel pekar på port
som inte är utgång" går att köra redan i 1.0. Att lägga till körning senare blir en ny
läsare av samma data, inte en ny datamodell. Priset är att inmatningen blir mer styrd
än ett fritextfält.

## B-005 — Jord är fyra nätklasser, inte en

**Datum:** 2026-08-31 · **Status:** ERSATT AV B-010

MaxxECU:s egen kopplingsbild skiljer på `SENSOR GND`, `VR GND`, `SHIELD GND` och
`ENGINE GROUND`, och har en röd varningsruta om att sensorjord aldrig får kopplas till
chassijord. En modell med en enda jordnod kan inte uttrycka den skillnaden och kan
därför aldrig fånga felet.

**Beslut:** jord är **klassad** i nätlistan — sensorjord, VR-jord, skärmjord,
chassi-/motorjord. Att koppla ihop två klasser är tillåtet men ger hög varning.

**Konsekvens:** varje jordpunkt måste få en klass vid inmatning, vilket är ett fält till
att fylla i. I gengäld fångas ett fel som ger svårfelsökt störning i verkligheten, och
skärmhantering går att kontrollera. Varning och inte hinder följer
[E3](intervju.md) — en hopkoppling är fysiskt möjlig, bara olämplig.

## B-006 — Signaltyper: fast kärna, egna tillägg tillåtna

**Datum:** 2026-08-31 · **Status:** GÄLLER

Styrenheter ska vara data och inte kod ([B-002](#b-002--samma-stack-som-hälsoappen),
avsnitt 4 i specifikationen). En låst typlista bryter mot det så snart en styrenhet har
en port som inte passar in — MaxxECU:s lambdaportar COM, IP, RCAL och VS är redan ett
sådant fall.

**Beslut:** en fast kärna av signaltyper som appen kan resonera om, plus egna typer som
lagras men inte kontrolleras.

**Konsekvens:** kontrollen "signaltypsfel" är tyst om egna typer. Det är avsiktligt —
alternativet är att antingen låsa ute udda portar eller låtsas kontrollera något appen
inte förstår. Egna typer bör synas som okontrollerade i gränssnittet så att tystnaden
inte förväxlas med godkänt.

## B-007 — Strömgräns på både port och stift, lägsta gäller

**Datum:** 2026-08-31 · **Status:** ERSATT AV B-011

Förlagan anger *"Small pin = max 15A, Big pin = max 25A"* på det 12-poliga
matningsdonet, och samtidigt *"load (max 1.5A)"* på en GP-utgång. Gränsen sitter alltså
på två ställen samtidigt.

**Beslut:** både porten och kontaktdonets stift bär en strömgräns. Kontrollen "ström
över gräns" jämför mot den lägsta av dem.

**Konsekvens:** kontaktdonet blir ett objekt med egna stift och egenskaper, inte bara en
etikett på porten. Utan det blir kontrollen fel på matningssidan, där gränsen enbart är
mekanisk.

## B-008 — Komponenter i tre nivåer

**Datum:** 2026-08-31 · **Status:** GÄLLER

Provfallet har sex injektorer av samma sort. Med värdena på mallen blir "byt till en
annan injektor" sex ändringar; med värdena på instansen blir biblioteket en hög av
nästan likadana poster.

**Beslut:** **mall → artikel → instans**. Mallen är generisk ("injektor") och bär
anslutningarnas funktion. Artikeln är verklig ("Bosch 0280158123, 1000cc") och bär
mätbara värden. Instansen är exemplaret i fordonet ("injektor 3") och bär koppling och
zon.

**Konsekvens:** ett begrepp mer att förklara i gränssnittet, och en instans måste kunna
finnas innan artikeln är vald — man vet att det sitter en injektor där innan man
bestämt vilken. Strömvärden får därför saknas utan att schemat är trasigt; kontrollen
"ström över gräns" hoppar över det som saknar värde och säger det högt.

## B-009 — Sidan är ett blad, och hänvisningen genereras

**Datum:** 2026-08-31 · **Status:** GÄLLER

Hela Evo:n får inte plats på ett A3 i läsbar skala. Automatisk kaklning ger ark som
måste tejpas ihop; automatisk krympning ger en oläslig ritning. Beställaren vill i
stället kunna hålla sig inom A3 och hänvisa en kabel vidare till nästa sida.

**Beslut:** en utskriftssida **är** ett blad i den mening
[B-003](#b-003--ett-blad-är-en-filtrering-inte-en-ritning) redan definierat — en sparad
filtrering. Du styr vad som hamnar var. En kabel som lämnar sidan får en **genererad
hänvisning** i vardera änden, till sida och position. Automatisk delning finns som
förslag att justera, aldrig som tvång.

**Konsekvens:** hänvisningsmekaniken behövs bara en gång och tjänar både zonfiltret och
utskriften — den var redan förutsatt av B-003. Priset är att appen måste kunna säga
*innan* export att något inte får plats, och peka ut vad, i stället för att tyst krympa.
Format: A4 och A3 som standardval, fri storlek i mm därutöver, skalan valbar.

## B-010 — Jordklassen är enhetsbunden (ersätter B-005)

**Datum:** 2026-08-31 · **Status:** GÄLLER · **Ersätter:** B-005

B-005 gav jord fyra klasser i hela projektet. Genomläsningen av PDM- och EXP-underlaget
visar att det inte räcker. PDM20 har *egen* sensorjord och *egen* 5 V-referens, med en
uttrycklig anvisning om att inte blanda dem med ECU:ns. EXP-modulen har samma
anvisning. Två punkter kan alltså båda vara "sensorjord" och ändå aldrig få kopplas
ihop — vilket B-005 saknar språk för.

**Beslut:** en jord- eller referenspunkt bär **både klass och ägande enhet**. Regeln är
att två punkter får kopplas ihop endast om klass *och* enhet stämmer. Chassi- och
motorjord är den enda klass som är gemensam och saknar ägare.

**Konsekvens:** kontrollen i F4-03 blir starkare och fångar även "PDM:ns sensorjord
ihopkopplad med ECU:ns", vilket är ett fel som annars ger svårfelsökt störning.
Modellen behöver en enhetsreferens på varje jord- och referensnod. Samma regel täcker
5 V-matningarna utan att de behöver egen logik.

## B-011 — Strömgräns i tre nivåer, och en kanal sitter på flera stift (ersätter B-007)

**Datum:** 2026-08-31 · **Status:** GÄLLER · **Ersätter:** B-007

B-007 satte gränsen på port och stift. PDM20-underlaget visar två saker som inte får
plats i den modellen:

- Enheten har ett **eget tak** — 230 A totalt — utöver varje kanals gräns. Summan av
  kanalernas märkström (25 A × 8 + 15 A × 8 + 8 A × 4) är väsentligt högre än taket.
- En utgång sitter på **flera stift**: `OUT 1` ligger på stift 1, 10 och 18. B-007
  förutsatte en port per stift.

**Beslut:** strömgränsen gäller i tre nivåer — **stift, kanal/port och enhet** — och
kontrollen prövar alla tre. Relationen kanal → stift är en-till-många.

**Konsekvens:** kontrollen "ström över gräns" blir tre jämförelser i stället för en, och
enhetstaket kan slå till även när varje enskild kanal är inom sin gräns. Det är just det
fall som bränner en PDM i verkligheten. Kontaktdonets stift kan inte längre bära porten
som främmande nyckel åt andra hållet — porten äger sina stift.

## B-012 — Terminering hör till noden, inte till bussen

**Datum:** 2026-08-31 · **Status:** GÄLLER

Datamodellen lade `terminering` på bussen. Underlaget visar att den sitter i enheten:
MaxxECU har *"CAN-bus 1. 120Ω termination resistor built-in"*, medan EXP-modulen
uttryckligen har *"no built-in terminating resistor"*.

**Beslut:** terminering är en egenskap på **noden** — enheten på bussen — inte på
bussen. Bussen bär hastighet.

**Konsekvens:** F6-04 kan kontrollera det som faktiskt gäller: en buss ska ha exakt två
terminerade ändar. Utan det hade kontrollen bara kunnat fråga om bussen är "terminerad"
som helhet, vilket inte är en meningsfull fråga.

## B-013 — Appen dimensionerar kabelarea, tabellstyrt

**Datum:** 2026-08-31 · **Status:** GÄLLER

Produktbeslutet 2026-08-30 sa att appen registrerar vald area utan att ha en åsikt,
med skälet att en app som tycker något måste ha rätt. Beställaren har tagit tillbaka
det: dimensioneringen gör det enklare att dra kabel, och underlaget finns redan —
PDM-dokumentets tabell över bärförmåga per area och kabeltyp.

Det ursprungliga skälet står kvar men besvaras annorlunda: appen har rätt så länge den
säger **var siffran kommer ifrån** och inte låtsas veta mer än tabellen.

**Beslut:** bärförmågan är **frödata**, inte formel — tabellen matas in som rader
(area i mm², AWG, bärförmåga för thin-wall respektive vanlig kabel). Appen föreslår
area utifrån ansluten last och varnar när vald area inte bär den. Förslaget går alltid
att köra över, och varningen anger vilken tabellrad den bygger på.

**Avgränsning:** beslutet gäller **kabelarea och ingenting annat**. Säkringsdimensionering
och spänningsfall omprövades samma dag och lämnades utanför 1.0 — säkringen matas in och
prövas bara mot port- och kanalgränser, och spänningsfall väntar på kretsberäkningen.

**Konsekvens:** kabeln får ett fält till — **kabeltyp** (thin-wall eller vanlig), utan
vilken rätt kolumn inte går att välja. Tabellen är utbytbar utan kodändring, vilket
behövs eftersom den bara gäller MaxxECU:s förutsättningar. Underlagets egen brasklapp
— att varm miljö och tätt packade stammar kräver större area — måste följa med till
gränssnittet, annars läses ett förslag som ett löfte.

## B-014 — Lokala stacken kör på eget portblock

**Datum:** 2026-08-31 · **Status:** GÄLLER

`supabase start` slog fel: port 54322 var upptagen. `docker ps` visade att hälsoappens
lokala stack äger hela 54321–54327. Att stoppa den för att få igång den här hade gjort
det omöjligt att arbeta i båda projekten samma dag.

**Beslut:** Elschema kör på **5442x** — API 54421, databas 54422, studio 54423,
Mailpit 54424, analytics 54427, skuggdatabas 54420, pooler 54429. Ändringen ligger i
`supabase/config.toml` och är därmed samma för alla som klonar repot.

**Konsekvens:** `DATABASE_URL` och `NEXT_PUBLIC_SUPABASE_URL` avviker från vad
Supabases dokumentation visar, vilket förvirrar den som klistrar in ett exempel
därifrån. `.env.example` säger därför uttryckligen varför. Ett tredje projekt får ta
5452x.

## B-015 — Ritningen är inmatningen, tabellen är utläsningen

**Datum:** 2026-08-31 · **Status:** GÄLLER

Första versionen av fas 2 hade det bakvänt. Kablar skapades i ett formulär genom att
välja två punkter ur två rullgardiner, och ritningen visade resultatet. Beställaren
provkörde och sa det rakt ut: *"jag skriver i text vilka komponenter som kopplas ihop
och får en bild av hur det ser ut"* — han ville tvärtom.

Han hade rätt, och skälet är inte bara smak. En rullgardin med nittio punkter tvingar
en att veta namnet på det man letar efter innan man ser det. På ritningen ser man
porten, och kopplingen är en handrörelse.

**Beslut:** ritningen är där kopplingar görs.

- **En ruta är en enhet eller en komponent**, aldrig en enskild anslutning. Styrenheten
  ritas som en låda med sina portar i, injektorn som en låda med sina ben i.
- **Mittenheten visar alla sina portar**, även okopplade — annars går det inte att dra
  en kabel från en port som ännu inte används.
- **Kabeln skapas tom** när man släpper. Area, färg och märkning fylls i efteråt. Att
  fråga vid varje släpp bryter flytet när man drar åtta injektorer i rad.
- **Kopplingslistan är en utläsning** av vad ritningen visar. Formuläret för att skapa
  en kabel utan att rita står kvar men är omdöpt och nedflyttat.

**Konsekvens:** ritvyn blir appens tyngdpunkt och måste tåla mer — åttio portar i en
låda, dragna kablar, handflyttade rutor. Placeringen hänger nu på rutan i stället för
på noden, vilket krävde att `bladplacering` byggdes om (R-017). Kopplingslistan blir
enklare: den behöver inte längre vara ett inmatningsgränssnitt, bara läsbar och
utskrivbar. Det ursprungliga upplägget överlevde exakt en provkörning, vilket är
ungefär vad ett upplägg som ingen prövat brukar göra.

## B-016 — Nummerserier är data, inte kod

**Datum:** 2026-08-31 · **Status:** GÄLLER

Komponentnumret ska följa en serie: jord 1xx, givare 2xx, injektorer 3xx. Beställaren
gav de tre exemplen och bad om en rekommendation för resten.

En serieindelning är en **konvention**, och konventioner ändras. Att gjuta den i en
uppräkning i koden hade betytt en release varje gång en kategori ska flytta.

**Beslut:** serierna ligger i tabellen `nummerserie`, en rad per kategori, läsbar för
alla och skrivbar för ingen från appen. Räkningen — vilket nummer som är ledigt — är en
ren funktion i `lib/schema/nummer.ts`.

| Serie | Kategori |
|---|---|
| 1xx | Jordpunkter |
| 2xx | Givare |
| 3xx | Bränsle — injektorer och pump |
| 4xx | Tändning |
| 5xx | Ställdon |
| 6xx | Belysning |
| 7xx | Instrument och lampor |
| 8xx | Kraft — relä, säkring, batteri |
| 9xx | Skarvpunkter |

**Konsekvens:** kategorin på en komponentmall styr numret. Byter man kategori på en mall
byter nya instanser serie, medan gamla behåller sitt nummer — vilket är rätt: numret är
satt och sitter i bilen. **Luckor fylls igen**: tar man bort injektor 302 blir nästa nya
302 igen. En numrering som bara växer lämnar hål som ser ut att betyda något.

Bränslepumpen ligger i samma serie som injektorerna, eftersom båda är kategorin
`bransle`. Vill man ha den bland ställdonen är det mallens kategori som ska ändras, inte
serietabellen.

## B-017 — Stacken behålls: ritningen är ett layoutproblem, inte ett språkproblem

**Datum:** 2026-09-08 · **Status:** GÄLLER · **Prövar om** [B-002](#b-002--samma-stack-som-hälsoappen)

Frågan ställdes rakt: är TypeScript, React och en handskriven SVG-renderare rätt
verktyg för ett komplext grafiskt verktyg, och vore det lättare att bygga lokalt på
datorn? Underlaget är de tre omtagen av ritvyn som finns i
[byggloggen för fas 2](byggloggar/fas-2.md) och de två lärdomarna i
[lardomar.md](lardomar.md).

**Vad som faktiskt kostade tid.** Elva fel eller omtag finns dokumenterade i fas 2.
Två av dem är React-specifika: `<title>` i SVG som hydreringsfel, och en förflyttning
som lästes ur ett tillstånd som inte hunnit committas. Ett är serverspecifikt: zoomen
justerade rullningen innan svg:n vuxit. De övriga åtta handlar om **vad ett elschema
ska se ut som** — bandet längst ned, stiften åt fel håll, rutan som inte hamnade i höjd
med sin port, två prov med fel förutsättningar. De felen hade uppstått likadant i C#,
Qt eller Java. Språket var inte inblandat.

**Vad som ligger framför.** Faserna 3–8 är utskrift, kontroller, regler, CAN,
funktionsvy och listor. Sju av åtta är tabell- och formulärarbete, inte grafik. Den
enda tunga grafikuppgiften som återstår är automatisk kabeldragning utan överlapp —
och det är ett rent algoritmproblem som redan bor i `lib/schema/layout.ts` som en ren
funktion, prövbar utan webbläsare. Att den ligger där är ett argument för
arkitekturen, inte emot den.

**Skalan.** Ett blad är en filtrering, inte hela bilen. MaxxECU Race har 80 portar;
ett tätt blad landar på några hundra SVG-element. SVG börjar bli trögt först runt tio
tusen. Skalan är inte en risk i det här projektet.

**Alternativen, med sin kostnad:**

| Alternativ | Vad det ger | Vad det kostar |
|---|---|---|
| Canvas eller WebGL i stället för SVG | Prestanda vi inte behöver | Vektorutskriften i fas 3 faller — canvas ger pixlar. Egen textlayout och egen träffdetektering |
| Diagrambibliotek (React Flow, Konva) | Dra, panorera, markera färdigt | Vi har redan byggt det. React Flow ritar noder som HTML i en transformerad behållare, vilket är sämre underlag för A3-utskrift än SVG. Kantdragningen löser inte parallella kablar heller |
| Tauri eller Electron lokalt | Ingen serverrundtur, funkar i garaget utan nät | **Byter inte språk** — samma TypeScript, React och SVG. Det är ett driftbeslut, inte ett språkbeslut |
| Skrivbordsapp i C#/WPF, Avalonia, Qt | Mogen utskrift, retained-mode grafik | Allt annat skrivs om: 18 migrationer, åtkomstkontrollen, 102 prov, alla listvyer. Surfplattan i garaget (J1) försvinner. Åttio procent av appen är CRUD, och där är webben starkare |

**Beslut:** stacken behålls oförändrad. SVG behålls som renderare, uttryckligen därför
att fas 3 ska ge vektor-PDF i A3 ur samma vy som skärmen — samma element, samma
koordinater, ingen andra renderare att hålla i synk.

**Konsekvens och gräns.** Beslutet omprövas om något av två inträffar: ett blad
passerar ungefär två tusen element och blir märkbart trögt att dra i, eller
kabeldragningen visar sig kräva tillstånd som inte går att uttrycka som en ren
funktion. Inget av det är nära idag.

**Det som ändå ska rättas, och som är den riktiga lärdomen:** friktionen kom från att
ritläget speglar servertillstånd vid varje drag. Den lokala förskjutningen mot
serverns läge är i dag tre sammanflätade rader i `ritning.tsx`. Nästa gång ritläget
rörs bör den ersättas av `useOptimistic`, som gör samma sak med ett anrop. Det är en
förenkling, inte ett arkitekturbyte.
