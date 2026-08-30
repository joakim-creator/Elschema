# Databasändringar

Register över samtliga migrationer. **Varje migration ska ha en dokumenterad
återställning innan den körs skarpt.** Det är den här filen som gör det möjligt att
svara på "vad hände med databasen den 14:e" utan att gissa.

Migrationsfilerna namnges `<tidsstämpel>_<beskrivning>.sql` och **ändras aldrig efter
att de körts skarpt** — fel rättas med en ny migration.

## Ordningen som gäller

1. Skriv migrationen.
2. Skriv återställningen och fyll i raden i registret nedan.
3. Kör mot **dev**.
4. Kör mot **prod**.
5. Först därefter slås koden som förutsätter ändringen ihop till `main`.

Steg 5 är inte en formalitet. Kod som läser en kolumn som ännu inte finns tar ner
produktionen direkt, och felet syns inte i något prov — provmiljön har redan
migrationen.

Kontrollera alltid vilken miljö som är länkad innan något körs.

## Register

| Migration | Uppgift | Innehåll | Körd i dev | Körd i prod | Återställning |
|---|---|---|---|---|---|
| | | | | | |

## Återställningar

**R-001** — <namn>

```sql
-- SQL som tar tillbaka ändringen
```

Vad som slutar fungera när återställningen körts, och vad som därutöver måste
göras i koden.
