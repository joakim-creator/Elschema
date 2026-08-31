# Elschema

Verktyg för att rita elscheman kring en styrenhet, koppla komponenter till portar och
förklara vad kopplingen gör. Bygger på [projektmallen](../Projektmall).

**Läge:** faserna 0, 1 och 2 klara — `v0.2.0`. Nätlistan, kopplingslistan och
ritvyn fungerar. Nästa fas är utskrift.
Provfall för 1.0 är hela elsystemet på en Mitsubishi Evo 8.

35 frågor är besvarade av beställaren och 37 är `ANTAGET` — förslag som står
oemotsagda. Vilka som är vilka framgår av [`docs/intervju.md`](docs/intervju.md).

## Nästa steg

1. De antaganden som sitter i datamodellen är genomgångna. Kvarvarande 37 rör
   användare, uteslutningar, utdata och drift — billiga att kasta om.
2. Backloggen är nedbruten: tio faser, 91 uppgifter med ID.
3. Lägg förlagorna i [`docs/referens/`](docs/referens/) — **F1-03 och F6-06 är
   blockerade utan dem.**
4. Nästa uppgift är F3-01. Byggloggar per fas i [`docs/byggloggar/`](docs/byggloggar/).

## Vad som ligger var

| Fil | Roll |
|---|---|
| `CLAUDE.md` | Regler som laddas automatiskt varje session |
| `docs/intervju.md` | Intervjun: 69 frågor med svar eller antagande |
| `docs/referens/` | Förlagor — MaxxECU-bilden, pinouter |
| `docs/projektspecifikation.md` | Vad som byggs och varför |
| `BACKLOG.md` | Enda källan till vad som ska göras och vad som är gjort |
| `CHANGELOG.md` | Vad varje släpp innehöll |
| `docs/beslutslogg.md` | Tekniska beslut med sitt skäl |
| `docs/databasandringar.md` | Migrationsregister med återställningar |
| `docs/versionering.md` | Versionsnummer, commit-format, grenar |
| `docs/driftsattning.md` | Miljöer och manuella steg |
| `docs/lardomar.md` | Vad tidigare bygge lärde ut |
| `docs/byggloggar/` | En logg per avslutad fas |
| `.claude/skills/slapp/` | Släpprutinen som skill |

## Spårbarhetskedjan

```
specifikation → backloggpost (ID) → gren → commit → changelog → tagg → migration
```
