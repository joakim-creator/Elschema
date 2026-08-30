# Versionering och release

## Versionsnummer

Formatet är `<major>.<minor>.<rättning>`.

Under bygget löper minor-siffran med fasnumret: `0.1.0` när fas 1 är klar, `0.2.0`
när fas 2 är det. `1.0.0` sätts när allt i specifikationens avsnitt 8 finns **och
produkten används skarpt**. Därefter gäller vanlig semantisk versionering.

Räkna med att en fas tillkommer efter att produkten börjat användas på riktigt. Den
sortens fas syns inte i en plan, bara i användning — planera för den i stället för
att bli överraskad.

## Att göra ett släpp

Rutinen finns också som skill: skriv `/slapp`.

1. Alla uppgifter i fasen är `KLAR` i [BACKLOG.md](../BACKLOG.md).
2. `npm run verify` (lint + typkontroll + prov) går igenom.
3. Migrationer som ingår är körda i **både dev och prod** och står i
   [databasandringar.md](databasandringar.md) med återställning.
4. Flytta posterna i `CHANGELOG.md` från `[Ej släppt]` till en ny versionsrubrik
   med datum.
5. Höj versionen i `package.json`.
6. Commit: `chore(release): v<version>`
7. Tagga: `git tag -a v<version> -m "<vad släppet innehåller>"`
8. Driftsätt enligt [driftsattning.md](driftsattning.md).

Taggen är återställningspunkten. Går något fel senare ska det alltid gå att gå
tillbaka till senaste taggen och veta exakt vad som fanns där — både i koden och i
databasen.

## Commit-meddelanden

Formatet är `<typ>(<omfång>): <beskrivning> [<uppgifts-ID>]`.

```
feat(schema): passloggning med förifyllda värden [F2-03]
fix(mat): felaktig summering över midnatt [F4-04]
db(schema): tabeller för träning [F0-04]
sec(webhook): tak för antal anrop per token [U-022]
```

**Typer:** `feat`, `fix`, `db` (migration), `refactor`, `test`, `docs`, `chore`,
`sec` (säkerhetsrättning).

Uppgifts-ID:t binder ihop kedjan: backlogg → commit → changelog → tagg. En rad kod
ska alltid gå att spåra till en uppgift, och en uppgift till ett beslut.

## Grenar

`main` är alltid driftsättningsbar. Arbete sker på
`fas-<n>/<uppgifts-id>-<kort-namn>`. Slås ihop när fasens uppgift är klar och CI är
grön.

## Regler som inte förhandlas

- **Committa aldrig hemligheter.** Blir en nyckel exponerad ska den **roteras**
  omedelbart — det räcker inte att ta bort den ur historiken.
- **Migrationer ändras aldrig i efterhand.**
- **Databasen före koden.** Alltid.
- **`main` taggas vid varje fasavslut**, även om ingenting driftsätts. Taggen är
  billig och är det enda som gör "gå tillbaka till hur det var" möjligt.
