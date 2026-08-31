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
