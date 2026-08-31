# Backlogg

Enda källan till vad som ska göras och vad som är gjort. Varje uppgift har ett ID
(`F<fas>-<nr>`) som används i commit-meddelanden, migrationsnamn och i
[CHANGELOG.md](CHANGELOG.md), så att en ändring alltid går att spåra tillbaka till
varför den gjordes.

**Status:** `TODO` · `PÅGÅR` · `KLAR` · `BLOCKERAD` · `STRUKEN`

Faserna följer [leveransordningen](docs/projektspecifikation.md#9-leveransordning). En
fas är klar först när alla dess uppgifter är `KLAR` och versionen taggats enligt
[versionering.md](docs/versionering.md).

---

## Fas 0 — Fundament

Mål: ett körbart projekt med komplett datamodell, åtkomstkontroll och CI. Ingen
affärslogik. Fasen är klar när något går att köra och pröva.

**KLAR 2026-08-31**, taggad `v0.0.1`. Se [byggloggen](docs/byggloggar/fas-0.md).
Datamodellen omfattar det faserna 0–3 behöver. Tabeller för signaler, regler och
bussar läggs till i fas 5 respektive 6 — en tabell utan läsare går inte att pröva,
och "databasen före koden" gäller per fas, inte per projekt.

| ID | Uppgift | Status | Anteckning |
|---|---|---|---|
| F0-01 | Repo, `.gitignore`, `.env.example` | KLAR | Eget repo i projektmappen |
| F0-02 | Spårbarhetsdokument på plats | KLAR | Backlogg, changelog, beslutslogg, databaslogg — delvis gjort |
| F0-03 | Next.js (App Router), TypeScript, lint, formatering | KLAR | |
| F0-04 | Supabase-projekt, EU-region, lokal utveckling via CLI | KLAR | |
| F0-05 | Autentisering: Supabase Auth, sluten grupp med inbjudningskod | KLAR | J4 |
| F0-06 | Tabeller: projekt, styrenhet, kontaktdon, stift, port, portroll | KLAR | Porten äger sina stift, en-till-många. Gräns i tre nivåer ([B-011](docs/beslutslogg.md)). Se U-001, U-002 |
| F0-07 | Tabeller: komponentmall, artikel, instans, anslutning | KLAR | Tre nivåer ([B-008](docs/beslutslogg.md)). Instans utan artikel måste vara giltig |
| F0-08 | Tabeller: nod, kabel, skarvpunkt, jordpunkt med klass **och ägande enhet** | KLAR | Klass räcker inte ([B-010](docs/beslutslogg.md)). Se U-003 |
| F0-09 | Tabeller: signaltyp — fast kärna plus egna | KLAR | Egna lagras men kontrolleras inte ([B-006](docs/beslutslogg.md)) |
| F0-10 | Tabeller: zon, blad | KLAR | Bladet är en filtrering ([B-003](docs/beslutslogg.md)) |
| F0-11 | Index och villkor | KLAR | Unikt: port per kontaktdon, stiftnummer per don, instansnummer per projekt |
| F0-12 | Åtkomstkontroll (RLS) på samtliga tabeller | KLAR | Projekt är privat; systembibliotek läsbart för alla |
| F0-13 | `seed.sql` med testdata — **rader i varje delad tabell** | KLAR | Utan rader sover åtkomstproven |
| F0-14 | Testuppsättning + vaktprov för schema och åtkomst | KLAR | |
| F0-15 | **Vaktprov:** ingen koordinat bär elektrisk mening | KLAR | Faller om en tabell låter läge avgöra vad som är sammankopplat ([B-001](docs/beslutslogg.md)) |
| F0-16 | CI: lint, typkontroll, prov vid varje push | KLAR | |

## Fas 1 — Nätlistan

Mål: **ersätta Excel.** Ett stift som flyttas ska slå igenom överallt. Ingen ritning
ännu — en tabellvy räcker för att fasen ska vara till nytta.

| ID | Uppgift | Status | Anteckning |
|---|---|---|---|
| F1-01 | Projekt: skapa, lista, byt namn, radera | TODO | Ett projekt = ett fordon |
| F1-02 | Styrenhetsmall: kontaktdon, stift, portar | TODO | Data, inte kod (C1) |
| F1-03 | MaxxECU Race inmatad som mall | TODO | Underlaget finns: connector 1 (48-pin, delad med V1/PRO) och connector 2 (32-pin svart, EGT och knack) |
| F1-04 | Port: nummer, benämning, riktning, max ström | TODO | |
| F1-05 | Portroller — flera per port, en vald | TODO | `TACH / GP OUT 8` m.fl. (C5) |
| F1-06 | Stift: storlek och strömgräns, kopplat till port | TODO | Litet 15 A, stort 25 A |
| F1-07 | Komponentmall: kategori, anslutningar med funktion | TODO | |
| F1-08 | Artikel: fabrikat, artikelnummer, ström, spänningsområde | TODO | |
| F1-09 | Startbibliotek som seed-data | TODO | D1: injektor, tändspole, gaspedal, trottelhus, oljetryck, kylvätsketemp, MAP, MAF, lambda, vev- och kamgivare, bränslepump, relä, säkring, jordpunkt, batteri |
| F1-10 | Komponentinstans: numrering, val av artikel | TODO | Artikeln får saknas — instansen är ändå giltig |
| F1-11 | Kopiera-och-ändra för egna mallar och artiklar | TODO | D4 |
| F1-12 | Kabel: nod → nod, area, **kabeltyp**, färg, längd, skärmad, märkning, kontakttyp per ände | TODO | Punkt till punkt (E1). Kabeltyp krävs för att välja rätt kolumn i bärförmågetabellen ([B-013](docs/beslutslogg.md)) |
| F1-13 | Skarvpunkt som eget objekt | TODO | Förgrening görs här |
| F1-14 | Jordpunkt med klass | TODO | |
| F1-15 | Zontagg på noder och komponenter | TODO | Motor, framparti, kupé, bakparti |
| F1-16 | Tabellvy över kopplingar | TODO | **Det som ersätter Excel** |
| F1-17 | Flytta ett stift och se det slå igenom överallt | TODO | Smärtpunkt 1 av 2. Uppgiften är inte klar förrän det är prövat på riktig data |
| F1-18 | Bärförmågetabell som frödata — area, AWG, thin-wall, vanlig kabel | TODO | Ur sida 2 i `maxxecu-pdm-kanaler.pdf`. Utbytbar utan kodändring ([B-013](docs/beslutslogg.md)) |
| F1-19 | Förslag på kabelarea utifrån ansluten last | TODO | **Det som gör kabeldragningen enklare.** Förslaget går alltid att köra över |
| F1-20 | Brasklappen från underlaget syns vid förslaget | TODO | Varm miljö och tätt packade stammar kräver större area. Utan den läses ett förslag som ett löfte |

## Fas 2 — Ritvyn

Mål: **överblicken.** Layouten följer [förlagan](docs/projektspecifikation.md#11-förlaga)
— styrenheten i mitten, ingångar till vänster, utgångar till höger.

| ID | Uppgift | Status | Anteckning |
|---|---|---|---|
| F2-01 | Renderare: ECU-centrerad layout ur nätlistan | TODO | M1 |
| F2-02 | Komponentsymboler | TODO | Egna, tydliga — inte IEC/DIN (D6) |
| F2-03 | Automatisk kabeldragning med flyttbara brytpunkter | TODO | E4 |
| F2-04 | Jord och matning som symboler, inte streck tvärs bladet | TODO | E5 |
| F2-05 | Kabelfärg som ord vid strecket, märkning i avvikande färg | TODO | M3 |
| F2-06 | Blad: sparad filtrering på zon och/eller styrenhet | TODO | [B-003](docs/beslutslogg.md) |
| F2-07 | Kabel som lämnar bladet: genererad hänvisning i vardera änden | TODO | Samma mekanik som fas 3 använder ([B-009](docs/beslutslogg.md)) |
| F2-08 | Detaljrutor genererade ur komponenten de beskriver | TODO | M2 — relädragning, stiftlägen, kopplingsvarianter |
| F2-09 | Skyddsfunktion utmärkt i schemat | TODO | L7 |
| F2-10 | Panorering, zoom, läsläge för surfplatta | TODO | J1 |

## Fas 3 — Utskrift

Mål: **papper i garaget.** Använder samma renderare som fas 2.

| ID | Uppgift | Status | Anteckning |
|---|---|---|---|
| F3-01 | PDF-rendering ur samma vy som skärmen | TODO | Ingen extern tjänst |
| F3-02 | Pappersformat: A4 och A3 som standardval, fri storlek i mm | TODO | I5 |
| F3-03 | Valbar skala | TODO | |
| F3-04 | Sidhänvisning för kabel som lämnar sidan — sida och position | TODO | Återanvänder F2-07 |
| F3-05 | Passkontroll **före** export: vad får inte plats, och var | TODO | Alternativet är tyst krympning, och då är F3-03 meningslös |
| F3-06 | Automatisk delning som förslag att justera | TODO | Förslag, aldrig tvång (I6) |
| F3-07 | Ramtext: projekt, blad, datum, version | TODO | |
| F3-08 | Utskrift prövad på riktigt papper i A3 | TODO | Fasen är inte klar förrän något faktiskt skrivits ut |

## Fas 4 — Kontroller på nätlistan

Mål: ett schema går att lita på. Tre av de fyra kontrollerna i
[avsnitt 8](docs/projektspecifikation.md#8-vad-klart-betyder); regelfelen kommer i fas 5.

| ID | Uppgift | Status | Anteckning |
|---|---|---|---|
| F4-01 | Kontrollmotor: kör en uppsättning kontroller, samla resultat | TODO | |
| F4-02 | Kopplingsfel | TODO | Två kablar på samma port, anslutning utan kabel, kabel utan ände, last utan jord |
| F4-03 | Jordklasser eller enheter hopkopplade → hög varning | TODO | Hindrar inte. Både kopplingsbilden och EXP-underlaget har uttryckliga varningar ([B-010](docs/beslutslogg.md)) |
| F4-04 | Ström över gräns — stift, kanal och **enhetstak** | TODO | Tre jämförelser ([B-011](docs/beslutslogg.md)). Enhetstaket slår till även när varje kanal är inom sin gräns |
| F4-05 | Ej kontrollerade poster redovisas separat | TODO | Instans utan artikel saknar strömvärde. Får aldrig räknas som godkänd |
| F4-06 | Signaltypsfel mot vald portroll | TODO | |
| F4-07 | Egna signaltyper visas som okontrollerade | TODO | Annars förväxlas tystnad med godkänt ([B-006](docs/beslutslogg.md)) |
| F4-08 | Resultatvy: klicka på fel, markera i schemat | TODO | |
| F4-09 | Varning: vald kabelarea bär inte lasten | TODO | Varningen anger vilken tabellrad den bygger på ([B-013](docs/beslutslogg.md)) |

## Fas 5 — Signaler och regler

Mål: de fem funktionerna i G4 går att skriva in och kontrollera. Appen **kör** dem inte
([B-004](docs/beslutslogg.md)).

| ID | Uppgift | Status | Anteckning |
|---|---|---|---|
| F5-01 | Signal: namn, enhet, källa (port, CAN, härledd) | TODO | L3 |
| F5-02 | Härledd signal med redigerbar definition | TODO | "Motorn går" = varvtal över tröskel (L5) |
| F5-03 | Regel: signal · jämförelse · värde · målport · målläge | TODO | Fem fält, inte fritext (L8) |
| F5-04 | Flera nivåer per regel | TODO | 75 °C → 50 %, 80 °C → 100 % |
| F5-05 | Fritextförklaring bredvid regeln | TODO | Komplement, inte ersättning |
| F5-06 | Regelfel: dubbel utgång, port som inte är utgång, signal utan källa, överlappande trösklar | TODO | Fjärde kontrollen i avsnitt 8 |
| F5-07 | Regelvy per utgång | TODO | Vad styr den här porten? |
| F5-08 | De fem funktionerna ur G4 inmatade som provfall | TODO | Fläkt, oljetryck, bromsljus, generatorlampa, vinge. Faller någon av dem är regelmodellen för snäv |

## Fas 6 — PDM och CAN

Mål: kraftfördelningen på Evo:n går att rita, och EXP-modulen går att koppla in även om
den inte sitter på bilen idag. *Fasen får flyttas fram om Evo-bygget kräver
kraftfördelningen tidigare — den enda fasordning som är osäker.*

| ID | Uppgift | Status | Anteckning |
|---|---|---|---|
| F6-01 | PDM som egen typ: kanaler, strömgräns, skyddsläge | TODO | L6 |
| F6-02 | PDM-kanal som mål för en regel | TODO | Kanalen är programmerbar — det är skälet till egen typ |
| F6-03 | CAN-buss: hastighet och noder. **Terminering på noden** | TODO | [B-012](docs/beslutslogg.md). Se U-004 |
| F6-04 | Varning: en buss ska ha exakt två terminerade ändar | TODO | MaxxECU har inbyggd 120 Ω, EXP-modulen ingen |
| F6-05 | CAN som signalkälla utan meddelandemodell | TODO | Löser "över 100 km/h" utan DBC |
| F6-06 | MaxxECU **PDM20** inmatad som mall | TODO | Underlaget finns. 20 utgångar: 25 A × 8, 15 A × 8, 8 A × 4, tak 230 A. Out 3–8 är H-bryggor |
| F6-07 | EXP-modul som enhetstyp | TODO | Valbara pullups per analog ingång, pulsingång som VR eller digital, H-bryggeutgång, egna referenser, CAN utan inbyggd terminering |
| F6-08 | EXP-modul inmatad som mall | TODO | Ur `MaxxECU Expansion Module - Wiring-en.pdf`. Sitter inte på Evo:n — stöd, inte provfall |

## Fas 7 — Funktionsvy

Mål: ett schema går att förklara för någon annan.

| ID | Uppgift | Status | Anteckning |
|---|---|---|---|
| F7-01 | Funktion: gruppera noder och regler | TODO | |
| F7-02 | Funktionsvy som andra vy av samma nätlista | TODO | Inga egna objekt att hålla i synk (G1) |
| F7-03 | Genererad kedja givare → port → styrenhet → utgång → ställdon | TODO | G2, G3 |
| F7-04 | Fritext ovanpå den genererade kedjan | TODO | |
| F7-05 | Funktionsvyn med i utskriften | TODO | Återanvänder fas 3 |

## Fas 8 — Listor

Mål: det går att beställa material efter schemat.

| ID | Uppgift | Status | Anteckning |
|---|---|---|---|
| F8-01 | Kopplingslista per kontaktdon | TODO | I1 |
| F8-02 | Komponentlista med valda artiklar | TODO | Instanser utan artikel listas som ovalda |
| F8-03 | Kabellista med area, längd, färg, märkning | TODO | |
| F8-04 | Listorna med i PDF-exporten | TODO | Annat filformat är inte beställt — fråga innan det byggs |

## Fas 9 — Evo 8

Mål: **version 1.0.** Provfallet är styrande — det som inte går att rita här är inte
klart, oavsett vad koden kan.

| ID | Uppgift | Status | Anteckning |
|---|---|---|---|
| F9-01 | Motorelektronik inmatad | TODO | |
| F9-02 | Kraftfördelning: PDM, säkringar, reläer | TODO | |
| F9-03 | Instrument | TODO | |
| F9-04 | Belysning | TODO | |
| F9-05 | CAN-bussar med noder och terminering | TODO | |
| F9-06 | Funktionerna ur G4 inmatade | TODO | |
| F9-07 | Samtliga kontroller körda utan kvarvarande fel | TODO | Kvarvarande varningar ska vara medvetet accepterade, inte oförklarade |
| F9-08 | Hela schemat utskrivet i A3 och läst på papper | TODO | |
| F9-09 | Version `1.0.0` taggad | TODO | Enligt [versionering.md](docs/versionering.md) |

---

## Upptäckt under arbetet

Sådant som inte fanns i planen. Numreras `U-<nr>` löpande och stängs på samma sätt
som fasuppgifter.

Var noga med att notera **hur** felet upptäcktes. Ett fel som ingen signal fångade
är en lucka i proven, inte bara en bugg.

| ID | Uppgift | Upptäckt | Status |
|---|---|---|---|
| U-001 | Strömgräns även på **enhetsnivå** — PDM20 har taket 230 A, medan kanalernas summerade märkström är väsentligt högre | Vid genomläsning av `maxxecu-pdm-kanaler.pdf`. Ingen signal hade fångat det — modellen kände bara port och stift | TODO |
| U-002 | En kanal sitter på **flera stift** — `OUT 1` ligger på stift 1, 10 och 18. Relationen är en-till-många, inte en-till-en | Samma genomläsning. F0-06 hade skrivit fel främmande nyckel | TODO |
| U-003 | Jordklassen räcker inte utan **ägande enhet** — PDM:ns sensorjord och ECU:ns är båda "sensorjord" men får aldrig kopplas ihop | Samma genomläsning, plus samma anvisning i EXP-underlaget | TODO |
| U-004 | **Terminering hör till noden**, inte bussen — MaxxECU har inbyggd 120 Ω, EXP-modulen har ingen | Vid jämförelse av kopplingsbilden och EXP-underlaget | TODO |
| U-005 | EXP-modulen finns i referensmaterialet men i ingen fas | Filen låg i `docs/referens/` utan att vara efterfrågad | KLAR — införd som F6-07 och F6-08. Sitter inte på Evo:n, men stöd byggs |
