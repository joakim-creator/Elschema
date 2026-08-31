/**
 * Placeringen av ett blad, räknad ur nätlistan.
 *
 * Ren funktion: samma nätlista ger samma ritning. Ingen databasåtkomst, ingen
 * slump, inga sidoeffekter, inget tillstånd mellan anrop — det är vad som gör
 * den prövbar utan att starta en webbläsare, och det är också vad B-001 kräver.
 * Ritningen är en vy av nätlistan; den bär ingen egen sanning.
 *
 * **En ruta är en enhet eller en komponent**, inte en enskild anslutning.
 * Styrenheten ritas som en låda med sina portar i, injektorn som en låda med
 * sina ben i. Första utkastet ritade en ruta per anslutning, vilket blir
 * oläsbart så fort något har fler än två ben ([B-015](../../docs/beslutslogg.md)).
 *
 * Layouten följer förlagan i specifikationens avsnitt 11: styrenheten i mitten,
 * ingångar till vänster, utgångar till höger, komponenterna fläktade utåt.
 */

export type Nodsort = 'port' | 'komponent' | 'jord' | 'skarv'
export type Sida = 'vanster' | 'hoger'

export type Nod = {
  id: string
  sort: Nodsort
  /** Enheten eller komponenten noden sitter på. */
  bararen: string
  /** Portens eller benets beteckning. */
  anslutning: string | null
  signaltyp: string | null
  enhetId: string | null
  jordklass: string | null
  riktning: string | null
}

export type Kabel = {
  id: string
  nodA: string
  nodB: string
  farg: string | null
  markning: string | null
  area: number | null
  skarmad: boolean
}

export type Indata = {
  noder: Nod[]
  kablar: Kabel[]
  /** Noder som bladets filter släpper igenom. null betyder hela projektet. */
  synliga: Set<string> | null
  /** Nod -> namnet på det blad kabeln fortsätter på, för hänvisningar. */
  annatBlad: Map<string, string>
  /** Handflyttade förskjutningar per rutnyckel. */
  placeringar: Map<string, { x: number; y: number }>
}

export type Anslutningspunkt = {
  nodId: string
  etikett: string
  sida: Sida
  x: number
  y: number
  kopplad: boolean
  signaltyp: string | null
}

export type Ruta = {
  nyckel: string
  rubrik: string
  underrubrik: string | null
  sort: Nodsort
  jordklass: string | null
  x: number
  y: number
  bredd: number
  hojd: number
  arMitten: boolean
  anslutningar: Anslutningspunkt[]
}

export type Ledning = {
  kabelId: string
  punkter: { x: number; y: number }[]
  farg: string | null
  markning: string | null
  area: number | null
  skarmad: boolean
}

export type Hanvisning = {
  kabelId: string
  x: number
  y: number
  riktning: Sida
  text: string
  blad: string | null
}

export type Ritning = {
  bredd: number
  hojd: number
  rutor: Ruta[]
  ledningar: Ledning[]
  hanvisningar: Hanvisning[]
}

const RAD = 20
const RUTBREDD = 210
const MITTBREDD = 300
const KANT = 60
const SPALT = 170
const LUFT = 26
const RUBRIKHOJD = 30
const OKOPPLAD = Number.POSITIVE_INFINITY

/** Ingångar och jord till vänster, allt annat till höger — som i förlagan. */
function sidaForNod(nod: Nod): Sida {
  return nod.riktning === 'in' || nod.riktning === 'jord' ? 'vanster' : 'hoger'
}

/**
 * Grupperingsnyckeln, och tillika nyckeln ett handflyttat läge sparas under.
 * Portar hör till sin enhet, komponentben till sin komponent. Jord- och
 * skarvpunkter är sig själva — de har ingen bärare att samlas under.
 */
export function rutnyckel(nod: Nod): string {
  if (nod.sort === 'port') return `enhet:${nod.enhetId ?? nod.bararen}`
  if (nod.sort === 'komponent') return `komponent:${nod.bararen}`
  return `${nod.sort}:${nod.id}`
}

function ordna(a: string, b: string): number {
  return a.localeCompare(b, 'sv', { numeric: true })
}

export function raknaRitning(indata: Indata): Ritning {
  const { noder, kablar, synliga, annatBlad, placeringar } = indata
  const nodMap = new Map(noder.map((n) => [n.id, n]))
  const syns = (id: string) => synliga === null || synliga.has(id)

  const kablarPerNod = new Map<string, Kabel[]>()
  for (const k of kablar) {
    for (const id of [k.nodA, k.nodB]) {
      if (!kablarPerNod.has(id)) kablarPerNod.set(id, [])
      kablarPerNod.get(id)!.push(k)
    }
  }
  const kopplad = (n: Nod) => (kablarPerNod.get(n.id) ?? []).length > 0

  // ---------- gruppera noderna i rutor ----------

  const grupper = new Map<string, Nod[]>()
  for (const n of noder) {
    if (!syns(n.id)) continue
    const nyckel = rutnyckel(n)
    if (!grupper.has(nyckel)) grupper.set(nyckel, [])
    grupper.get(nyckel)!.push(n)
  }
  for (const lista of grupper.values()) {
    lista.sort((a, b) => ordna(a.anslutning ?? '', b.anslutning ?? ''))
  }

  // Mitten är enheten med flest portar. Ett blad utan enhet — bara belysning,
  // till exempel — får ingen mitt och allt hamnar i bandet.
  const mittNyckel =
    [...grupper.entries()]
      .filter(([k]) => k.startsWith('enhet:'))
      .sort((a, b) => b[1].length - a[1].length || ordna(a[0], b[0]))[0]?.[0] ?? null

  /**
   * Mittenheten visar **alla** sina portar, även okopplade. Man ska kunna dra
   * en kabel från en port som ännu inte används — annars går det inte att rita
   * först och koppla sedan. Övriga enheter visar bara det som är kopplat, för
   * att inte lägga en andra åttiostiftslåda på bladet.
   */
  function radernaI(nyckel: string, lista: Nod[]): Nod[] {
    if (nyckel === mittNyckel || nyckel.startsWith('komponent:')) return lista
    return lista.filter(kopplad)
  }

  const mittLista = mittNyckel ? (grupper.get(mittNyckel) ?? []) : []
  const mittRader = mittNyckel ? radernaI(mittNyckel, mittLista) : []
  const radIndex = new Map(mittRader.map((n, i) => [n.id, i] as const))

  // ---------- vilken sida hör varje ruta hemma på? ----------

  const sidoval = new Map<string, Sida>()
  const ordningsvarde = new Map<string, number>()

  for (const [nyckel, lista] of grupper) {
    if (nyckel === mittNyckel) continue
    let vanster = 0
    let hoger = 0
    let summa = 0
    let antal = 0
    for (const n of lista) {
      for (const k of kablarPerNod.get(n.id) ?? []) {
        const motId = k.nodA === n.id ? k.nodB : k.nodA
        const mot = nodMap.get(motId)
        if (!mot || rutnyckel(mot) !== mittNyckel) continue
        if (sidaForNod(mot) === 'vanster') vanster++
        else hoger++
        const i = radIndex.get(motId)
        if (i !== undefined) {
          summa += i
          antal++
        }
      }
    }
    sidoval.set(nyckel, vanster > hoger ? 'vanster' : 'hoger')
    ordningsvarde.set(nyckel, antal ? summa / antal : OKOPPLAD)
  }

  // ---------- placera rutorna ----------

  const rutor: Ruta[] = []
  const punktPerNod = new Map<string, Anslutningspunkt>()

  function byggRuta(nyckel: string, x: number, y: number, arMitten: boolean): Ruta {
    const lista = grupper.get(nyckel)!
    const rader = radernaI(nyckel, lista)
    const forsta = lista[0]!
    const bredd = arMitten ? MITTBREDD : RUTBREDD
    const hojd = RUBRIKHOJD + Math.max(rader.length, 1) * RAD + 8
    const flytt = placeringar.get(nyckel) ?? { x: 0, y: 0 }
    const rx = x + flytt.x
    const ry = y + flytt.y

    // Rutorna till vänster om mitten vänder sina anslutningar åt höger, och
    // tvärtom. Annars går varje kabel bakom sin egen ruta.
    const utat: Sida = sidoval.get(nyckel) === 'vanster' ? 'hoger' : 'vanster'

    const anslutningar: Anslutningspunkt[] = rader.map((n, i) => {
      const sida = arMitten ? sidaForNod(n) : utat
      return {
        nodId: n.id,
        etikett: n.anslutning ?? n.bararen,
        sida,
        x: sida === 'vanster' ? rx : rx + bredd,
        y: ry + RUBRIKHOJD + i * RAD + RAD / 2,
        kopplad: kopplad(n),
        signaltyp: n.signaltyp,
      }
    })

    for (const a of anslutningar) punktPerNod.set(a.nodId, a)

    return {
      nyckel,
      rubrik: forsta.bararen,
      underrubrik: forsta.sort === 'jord' ? forsta.jordklass : null,
      sort: forsta.sort,
      jordklass: forsta.jordklass,
      x: rx,
      y: ry,
      bredd,
      hojd,
      arMitten,
      anslutningar,
    }
  }

  const mittHojd = RUBRIKHOJD + Math.max(mittRader.length, 1) * RAD + 8
  const mittY = KANT
  const mittX = KANT + RUTBREDD + SPALT

  const efterOrdning = (a: string, b: string) =>
    (ordningsvarde.get(a) ?? 0) - (ordningsvarde.get(b) ?? 0) || ordna(a, b)

  const ovriga = [...grupper.keys()].filter((k) => k !== mittNyckel)
  const vanstra = ovriga
    .filter((k) => sidoval.get(k) === 'vanster' && ordningsvarde.get(k) !== OKOPPLAD)
    .sort(efterOrdning)
  const hogra = ovriga
    .filter((k) => sidoval.get(k) === 'hoger' && ordningsvarde.get(k) !== OKOPPLAD)
    .sort(efterOrdning)
  const losa = ovriga.filter((k) => ordningsvarde.get(k) === OKOPPLAD).sort(ordna)

  if (mittNyckel) rutor.push(byggRuta(mittNyckel, mittX, mittY, true))

  function stapla(nycklar: string[], x: number): number {
    let y = mittY
    for (const nyckel of nycklar) {
      const ruta = byggRuta(nyckel, x, y, false)
      rutor.push(ruta)
      y += ruta.hojd + LUFT
    }
    return y
  }

  const vansterSlut = stapla(vanstra, KANT)
  const hogerSlut = stapla(hogra, mittX + MITTBREDD + SPALT)
  const bandY = Math.max(vansterSlut, hogerSlut, mittY + mittHojd) + 40

  let losX = KANT
  let losY = bandY
  let radHojd = 0
  for (const nyckel of losa) {
    const ruta = byggRuta(nyckel, losX, losY, false)
    rutor.push(ruta)
    radHojd = Math.max(radHojd, ruta.hojd)
    losX += RUTBREDD + SPALT
    if (losX + RUTBREDD > mittX + MITTBREDD + SPALT + RUTBREDD) {
      losX = KANT
      losY += radHojd + LUFT
      radHojd = 0
    }
  }

  // ---------- dra ledningarna ----------

  const ledningar: Ledning[] = []
  const hanvisningar: Hanvisning[] = []

  for (const k of kablar) {
    const a = punktPerNod.get(k.nodA)
    const b = punktPerNod.get(k.nodB)

    if (a && b) {
      const brytX = (a.x + b.x) / 2
      ledningar.push({
        kabelId: k.id,
        punkter: [
          { x: a.x, y: a.y },
          { x: brytX, y: a.y },
          { x: brytX, y: b.y },
          { x: b.x, y: b.y },
        ],
        farg: k.farg,
        markning: k.markning,
        area: k.area,
        skarmad: k.skarmad,
      })
      continue
    }

    // Bara ena änden syns: kabeln lämnar bladet och får en hänvisning. Att
    // tyst utelämna den vore en halvsanning — nätlistan har den ju.
    const har = a ?? b
    if (!har) continue
    const bortaId = a ? k.nodB : k.nodA
    const borta = nodMap.get(bortaId)
    const ut = har.sida === 'vanster' ? har.x - SPALT / 2 : har.x + SPALT / 2
    ledningar.push({
      kabelId: k.id,
      punkter: [
        { x: har.x, y: har.y },
        { x: ut, y: har.y },
      ],
      farg: k.farg,
      markning: k.markning,
      area: k.area,
      skarmad: k.skarmad,
    })
    hanvisningar.push({
      kabelId: k.id,
      x: ut,
      y: har.y,
      riktning: har.sida,
      text: borta
        ? `${borta.bararen}${borta.anslutning ? ` · ${borta.anslutning}` : ''}`
        : '?',
      blad: annatBlad.get(bortaId) ?? null,
    })
  }

  const bredd = Math.max(
    mittX + MITTBREDD + SPALT + RUTBREDD + KANT,
    ...rutor.map((r) => r.x + r.bredd + KANT),
  )
  const hojd =
    Math.max(mittY + mittHojd, bandY + radHojd, ...rutor.map((r) => r.y + r.hojd)) + KANT

  return { bredd, hojd, rutor, ledningar, hanvisningar }
}
