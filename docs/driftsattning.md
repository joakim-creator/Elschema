# Driftsättning och manuella steg

## Miljöer

| Miljö | Namn | Adress | Referens |
|---|---|---|---|
| Utveckling | | | |
| Produktion | | | |

Migrationer körs **alltid mot dev först**. Produktion rörs bara av migrationer som
redan gått igenom dev och står i [databasandringar.md](databasandringar.md).

## Manuella steg

Sådant som kräver inloggning och inte kan automatiseras. Numrera dem och notera
vilken backloggpost de blockerar, så att det syns när något står stilla i väntan på
ett konto.

### 1. <tjänst>

1.
2.

**Blockerar:** F0-xx

## Miljövariabler

Sätts i driftsmiljön med **produktionens** värden — aldrig utvecklingens.

| Variabel | Källa | Exponeras mot klienten |
|---|---|---|
| | | |

Variabler som exponeras mot klienten ska vara ofarliga att exponera. Skyddet ligger
i åtkomstkontrollen på servern, inte i att nyckeln är svår att hitta.

## Utgiftstak

Varje tjänst som kostar per anrop ska ha **två spärrar**: ett tak i den egna koden
och ett tak på kontot hos leverantören. Appens tak är första försvaret; kontots är
det som inte kan gå sönder på grund av en bugg.

| Tjänst | Tak i koden | Tak på kontot |
|---|---|---|
| | | |

## Efter driftsättning

Gå igenom på riktig enhet, inte bara i utvecklingsläge:

- [ ] Inloggning och utloggning
- [ ] Det vanligaste flödet, från början till slut
- [ ] Något som skriver till databasen, och att värdet syns efteråt
- [ ] Kamera, fil eller annan enhetsfunktion som används
- [ ] En andra användare ser bara sitt eget

Det sista punkten är den som oftast avslöjar något.
