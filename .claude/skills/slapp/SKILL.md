---
name: slapp
description: >
  Genomför ett släpp (release) av projektet — kontrollerar backlogg, prov och
  migrationer, uppdaterar changelog och version, taggar och driftsätter. Använd
  den här skillen så snart användaren nämner släpp, release, driftsättning,
  deploy, "tagga versionen", "stänga fasen" eller "lägga ut det i produktion",
  även när de inte ber om en checklista. Använd den också när en fas ska
  avslutas, eller när användaren frågar om något är redo att driftsättas.
---

# Släpp

Ett släpp går fel på förutsägbara ställen. De här stegen finns för att fånga
just dem — särskilt steg 3, som är det som tar ner produktionen när det hoppas
över.

Kör stegen i ordning och **stanna vid varje som inte går igenom**. Ett släpp som
avbryts halvvägs är billigt; ett som går igenom med en trasig förutsättning är
det inte.

## 1. Är fasen klar?

Läs `BACKLOG.md`. Alla uppgifter i fasen ska vara `KLAR`.

Finns något `PÅGÅR` eller `BLOCKERAD` — fråga användaren om det ska flyttas till
nästa fas eller strykas. Gissa inte. Ett halvfärdigt släpp med en uppgift som
"nog är klar" är hur en fas tyst blir två.

## 2. Går proven igenom?

```bash
npm run verify
```

Rött här stoppar släppet. Om ett prov är trasigt snarare än att koden är det —
laga provet, hoppa inte över det.

## 3. Är databasen före koden?

**Det här steget är skälet till att skillen finns.**

Läs `docs/databasandringar.md`. För varje migration som ingår i släppet,
kontrollera att den är körd i **både dev och prod** och att den har en
dokumenterad återställning.

Kod som läser en kolumn innan migrationen körts tar ner produktionen direkt. Det
fångas inte av något prov, eftersom provmiljön redan har migrationen — därför
måste det kontrolleras för hand.

Saknas en körning: kör migrationen först, invänta bekräftelse, och fortsätt
sedan. Aldrig i omvänd ordning, aldrig samtidigt.

## 4. Vad innehåller släppet?

Flytta posterna i `CHANGELOG.md` från `[Ej släppt]` till en ny versionsrubrik med
dagens datum.

Läs igenom dem som användaren, inte som utvecklaren. En post som bara betyder
något för den som skrev koden ska skrivas om.

## 5. Höj versionen

Uppdatera `package.json`. Numreringen står i `docs/versionering.md` — under bygget
följer minor-siffran fasnumret, efter `1.0.0` gäller semantisk versionering.

## 6. Commit och tagg

```bash
git add CHANGELOG.md package.json
git commit -m "chore(release): v<version>"
git tag -a v<version> -m "<vad släppet innehåller>"
```

Namngivna filer i `git add`. Aldrig `-A`.

Taggen är återställningspunkten — den är det enda som gör "gå tillbaka till hur
det var" möjligt, och den är billig även när ingenting driftsätts.

## 7. Driftsätt

Följ `docs/driftsattning.md`. Ett steg i taget, och invänta bekräftelse från
användaren mellan stegen när produktionen berörs.

## 8. Gå igenom på riktig enhet

Checklistan står sist i `docs/driftsattning.md`. Den tar två minuter och har
hittat sådant som ingen provsvit gjorde — det mesta som gick fel under förra
bygget hittades av en människa som tittade på en siffra och tyckte att den såg
konstig ut.

Hittas något: skriv en `U-`-post i backloggen med **hur det upptäcktes**. Ett fel
som ingen signal fångade är en lucka i proven, inte bara en bugg.

## Om något går fel efter släppet

1. Gå tillbaka till föregående tagg.
2. Kontrollera i `docs/databasandringar.md` om en migration behöver återställas —
   koden går bakåt av sig själv, databasen gör det inte.
3. Skriv en `U-`-post innan rättningen börjar, så att skälet finns kvar.
