# Lärdomar från tidigare bygge

Fullständig genomgång: **[Tysta fel](https://claude.ai/code/artifact/fcbe3573-d8a4-4637-90fe-b2943315f24f)**
— sjutton lärdomar från hälsoappsbygget, var och en förankrad i den defekt som lärde
ut den.

Läs den innan ett nytt projekt planeras. Det som följer här är sammandraget som
[CLAUDE.md](../CLAUDE.md) bygger på.

## Genomgående mönster

Av 56 rapporterade defekter var de dyraste de som **inte gav någon signal alls**.
Ingen krasch, inget rött i loggen — bara ett värde som såg rimligt ut och var fel.
Tjugo hittades av en människa i skarp användning, och de var genomgående de
allvarligaste.

Två slutsatser styr det mesta i mallen:

1. **Grönt betyder inte rätt.** Ett prov som aldrig setts falla bevisar ingenting.
2. **Skarp användning hittar det proven inte kan.** Få något användbart i händerna
   på en riktig användare tidigt, även om det är fult.

## Vaktprov

Regler som annars glöms bort skrivs som prov mot koden och schemat i stället för som
text i ett dokument. Under förra bygget fällde de återfall fyra gånger — varje gång
innan felet nådde produktion.

Sorter som visade sig löna sig:

| Vakt | Prövar |
|---|---|
| Schemavakt | Att migrationerna ger de kolumner och villkor koden förutsätter |
| Åtkomstvakt | Att var och en ser sitt eget och inte andras — med **rader i tabellen** |
| Raderingsvakt | Att raderingslistan täcker alla tabeller som finns i schemat |
| Konventionsvakt | Att namngivning och exportregler följs i hela kodbasen |

Den fjärde sorten är den billigaste och den mest underskattade. Ett prov som läser
källkoden och faller på ett namn som avviker kostar tjugo rader och sparar en
felsökning.

## Fällor som kostade mest

- **Åtkomstprov utan data** passerar i båda riktningarna och sover tyst. Seed-data
  i varje delad tabell är en förutsättning, inte en trevlighet.
- **Kod driftsatt före sin migration** tar ner produktionen direkt, och inget prov
  fångar det eftersom provmiljön redan har migrationen.
- **Prov som raderar andras testdata** går igenom på en tom databas och faller på en
  använd. Städa bara det du själv skapade — och städa både underliggande och
  härledda tabeller.
- **`git add -A`** committade produktionsnycklar. Nycklarna fick roteras och all
  åtkomst till produktionsdata gick förlorad.
- **Tvetydig indata** ledde till tre allt smartare gissare i rad, alla fel.
  Lösningen var en inställning i källan som gjorde gissandet onödigt.
- **Ett beroendes gränser** — storleksgräns, anropstak — räknades på först efter att
  rekommendationen redan var given.

## Återställningen skrevs efter körningen, inte före (2026-08-31)

Fem migrationer i fas 1 kördes innan deras återställning fanns nedskriven.
Reglerna i `CLAUDE.md` säger uttryckligen tvärtom, och de sa det redan då.

Vad som gick fel i huvudet: fas 0:s migrationer skrevs i ett svep och
dokumenterades i ett svep, vilket kändes som att regeln var avklarad. Fas 1:s
migrationer kom en i taget under arbetets gång, och varje enskild kändes för
liten för att motivera ett stopp.

**Regeln gäller per migration, inte per fas.** Att det inte kostade något den
här gången beror på att miljön var lokal och kastbar. I en miljö med data hade
`R-011` varit precis den återställning man vill ha skriven i förväg: den
raderar en pinout som matats in för hand.

Signalen som saknades: ingenting hindrar `supabase db reset`. Ett vaktprov som
jämför migrationsfilerna i `supabase/migrations/` mot raderna i registret i
`databasandringar.md` skulle fånga det — och det provet är billigare att skriva
än den här texten.
