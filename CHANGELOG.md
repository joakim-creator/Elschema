# Ändringslogg

Formatet följer [Keep a Changelog](https://keepachangelog.com/sv/1.1.0/) och
versionerna [semantisk versionering](https://semver.org/lang/sv/).

Varje post slutar med sitt uppgifts-ID från [BACKLOG.md](BACKLOG.md). Det är den
länken som gör det möjligt att svara på *varför* en rad finns.

Rubriker som används: `Tillagt`, `Ändrat`, `Rättat`, `Borttaget`, `Säkerhet`.

## [Ej släppt]

### Tillagt

-

---

## [0.2.1] — 2026-08-31

Omtag av ritvyn efter provkörning. Se [byggloggen](docs/byggloggar/fas-2.md).

### Ändrat

- **En ruta är en enhet eller en komponent**, inte en enskild anslutning.
  Styrenheten ritas som en låda med sina portar i [F2-11]
- Mittenheten visar alla sina portar, även okopplade [F2-12]
- **Ritningen är inmatningen, kopplingslistan är utläsningen.** Kablar dras
  mellan anslutningspunkter på duken [F2-13, B-015]
- Komponenter kan läggas till direkt på bladet [F2-14]
- `bladplacering` hänger på rutan i stället för på noden

### Rättat

- En flyttad ruta hoppade iväg. Läget sparades absolut men lades på som en
  förskjutning, så varje drag räknades två gånger [U-009]
- Andra draget i rad blev noll: förflyttningen lästes ur React-tillstånd som
  inte hunnit committas. Draget bär nu sin startpunkt [U-009]
- `setPointerCapture` kunde kasta och avbryta hela draget innan det startat
- Sessionskakan överlevde databasen och gav AuthApiError vid varje anrop [U-008]

---

## [0.2.0] — 2026-08-31

Fas 2, Ritvyn. **Överblicken.** Se [byggloggen](docs/byggloggar/fas-2.md).

### Tillagt

- ECU-centrerad ritvy räknad ur nätlistan — ingångar vänster, utgångar höger [F2-01]
- Komponentsymboler, jordsymbol per jordklass och skarvpunkt som nod [F2-02, F2-04]
- Handflyttade lägen per blad, sparade i `bladplacering` [F2-03]
- Kabelfärg och area vid strecket, märkning i avvikande färg, skärm som streckad linje [F2-05]
- Blad som sparad filtrering på zon och/eller enhet [F2-06]
- Hänvisning för kablar som lämnar bladet, med målbladets namn [F2-07]
- Detaljrutor genererade ur bladets komponenter [F2-08]
- Panorering, zoom och läsläge [F2-10]
- `nod_vy` bär nu portens riktning och enhetens id

### Rättat

- En kabel med bara ena änden på bladet ritades varken som streck eller
  hänvisning — den försvann spårlöst. Hittat genom att räkna strecken på ett
  riktigt blad, inte av provsviten

### Uppskjutet

- Utmärkning av skyddsfunktioner flyttad till fas 5. Det finns inga
  skyddsfunktioner förrän regler finns [F2-09]

---

## [0.1.0] — 2026-08-31

Fas 1, Nätlistan. **Ersätter Excel.** Se [byggloggen](docs/byggloggar/fas-1.md).

### Tillagt

- Projekt: skapa, lista, byt namn, ta bort [F1-01]
- Egna enhetsmallar med kontaktdon, genererade stift, portar och roller [F1-02]
- MaxxECU Race ur tillverkarens pinout: 80 stift, 80 portar, 86 roller [F1-03]
- Enheter läggs till ur biblioteket med samtliga portar instansierade [F1-04, F1-06]
- Rollval per port, för portar som bär flera [F1-05]
- Egna komponentmallar med anslutningar, och artiklar med mätbara värden [F1-07, F1-08]
- Startbibliotek: 18 komponentmallar, 54 anslutningar, 11 artiklar [F1-09]
- Komponentinstanser med numrering och valfri artikel [F1-10]
- Kopiera-och-ändra för komponentmallar [F1-11]
- Kablar punkt till punkt med area, kabeltyp, färg, längd och märkning [F1-12]
- Skarvpunkter för förgrening [F1-13]
- Jordpunkter med klass och ägande enhet [F1-14]
- Zontaggning av enheter, komponenter och punkter [F1-15]
- **Kopplingslistan** — en rad per kabel med båda ändarna namngivna [F1-16]
- Bärförmågetabell ur MaxxECU:s underlag och funktionen `foreslagen_area` [F1-18]
- Areaförslag utifrån ansluten last, med varning när vald area inte bär [F1-19]
- Underlagets egen brasklapp visas vid förslaget [F1-20]
- Typade Supabase-klienter genererade ur databasen (`npm run db:types`)

### Ändrat

- `middleware.ts` heter nu `proxy.ts`. Next 16 varnar för det gamla namnet.

### Rättat

- Villkoret `karna_saknar_agare` gjorde varje icke-kärntyp privat, vilket
  omöjliggjorde systemgemensamma typer som WBO2 och EGT [U-006]
- Fem migrationer saknade dokumenterad återställning. Skrivna, och två vaktprov
  faller nu om det upprepas [U-007]

---

## [0.0.1] — 2026-08-31

Fas 0, Fundament. Ingen affärslogik — men något går att köra och pröva.
Se [byggloggen](docs/byggloggar/fas-0.md).

### Tillagt

- Eget repo i projektmappen, ignorering av hemligheter och miljömall [F0-01]
- Spårbarhetsdokument: specifikation, beslutslogg, backlogg, referensmaterial [F0-02]
- Next.js 16 med App Router, TypeScript i strikt läge, ESLint, Prettier, Tailwind [F0-03]
- Lokal Supabase-stack på eget portblock 5442x, så att hälsoappen kan köra samtidigt [F0-04]
- Inloggning med Supabase Auth, sluten grupp med inbjudningskod [F0-05]
- Datamodellen som nätlista: enheter, kontaktdon, stift, portar med flera roller [F0-06]
- Komponenter i tre nivåer — mall, artikel, instans [F0-07]
- Noder, kablar, skarvpunkter och jordpunkter med klass och ägande enhet [F0-08]
- Signaltyper: 17 kärntyper som systemet kontrollerar, egna tillåts [F0-09]
- Zoner och blad, där bladet är en sparad filtrering [F0-10]
- Villkor och triggrar: unikt instansnummer, vald roll hör till porten, kabeln stannar i sitt projekt [F0-11]
- Row Level Security med policyer på samtliga 22 tabeller [F0-12]
- Frödata med två ägare och rader i varje skyddad tabell [F0-13]
- 41 prov: vaktprov, åtkomst och villkor — samtliga sedda falla [F0-14]
- Vaktprov som faller om nätlistan får en koordinatkolumn [F0-15]
- CI som kör lint, typkontroll, format, prov och bygge mot en riktig databas [F0-16]

### Säkerhet

- Tjänsteklienten importerar `server-only`. Bygget faller om tjänstenyckeln dras
  in i en klientbunt [F0-05]
- `inbjudningskod` har RLS påslaget helt utan policyer. Bara `service_role` når
  tabellen [F0-12]
