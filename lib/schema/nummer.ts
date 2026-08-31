/**
 * Förslag på beteckning och nummer för en ny komponent.
 *
 * Rena funktioner, samma skäl som layouten: de går att pröva utan databas, och
 * de får inte gissa olika vid två anrop.
 *
 * Numret följer en serie per kategori — jord 1xx, givare 2xx, bränsle 3xx och
 * så vidare. Serierna ligger i tabellen `nummerserie` och inte här, så att
 * indelningen går att ändra utan release. Det här är bara räkningen.
 */

/**
 * Lägsta lediga numret i serien. Luckor fylls igen: tar man bort injektor 302
 * och lägger till en ny blir den 302, inte 305. En numrering som bara växer
 * lämnar hål som ser ut att betyda något.
 */
export function foreslaNummer(serie: number, anvanda: readonly number[]): number {
  const golv = serie * 100
  const tak = golv + 99
  const iSerien = new Set(anvanda.filter((n) => n >= golv && n <= tak))
  for (let n = golv + 1; n <= tak; n++) {
    if (!iSerien.has(n)) return n
  }
  // Hundra i samma serie är en osannolik men möjlig sits. Hellre ett nummer
  // utanför serien än inget nummer alls — det syns, och går att rätta.
  return tak + 1
}

/**
 * Beteckningen är mallens namn med ett löpnummer inom just den mallen:
 * "Injektor 1", "Injektor 2". Den är ett förslag och skrivs över när något
 * annat är tydligare — "Bränslepump bak" säger mer än "Bränslepump 2".
 */
export function foreslaBeteckning(
  mallnamn: string,
  befintliga: readonly string[],
): string {
  const monster = new RegExp(`^${flykta(mallnamn)} (\\d+)$`)
  const tagna = new Set(
    befintliga.map((b) => Number(monster.exec(b)?.[1])).filter((n) => Number.isFinite(n)),
  )
  let i = 1
  while (tagna.has(i)) i++
  return `${mallnamn} ${i}`
}

function flykta(text: string): string {
  return text.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
}
