/**
 * Placeringen av ett blad, räknad ur nätlistan.
 *
 * Ren funktion: samma nätlista ger samma ritning. Ingen databasåtkomst, ingen
 * slump, inga sidoeffekter, inget tillstånd mellan anrop — det är vad som gör
 * den prövbar utan att starta en webbläsare, och det är också vad B-001 kräver.
 * Ritningen är en vy av nätlistan; den bär ingen egen sanning.
 *
 * **En ruta är en enhet eller en komponent**, inte en enskild anslutning
 * ([B-015](../../docs/beslutslogg.md)).
 *
 * **Rutorna ligger i kolumner efter avstånd från mittenheten.** Styrenheten är
 * kolumn 0. Det som hänger direkt på den hamnar i kolumn ±1, det som hänger på
 * *dem* i ±2, och så vidare utåt. Tecknet säger sidan. Ett tidigare utkast la
 * allt som inte rörde mittenheten i ett band längst ned, och det gav två fel på
 * en gång: rutorna hamnade utanför bild när man kopplat dem, och deras stift
 * pekade bort från den ruta kabeln faktiskt gick till.
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
  /** Stiftposition, eller flera hopslagna om kanalen sitter på fler än ett. */
  stift: string | null
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
  /** Rutor vars anslutningar vänts för hand. */
  vanda: Set<string>
}

export type Anslutningspunkt = {
  nodId: string
  /** "A2 · IGN 1" — stiftnummer först, funktion sedan. */
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
  /** Ritningens hörn. Kan vara negativa när en ruta dragits utanför. */
  minX: number
  minY: number
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

/**
 * Marginal runt allt som ritats. Arbetsytan ska vara större än innehållet, så
 * att en ruta man dragit åt sidan fortfarande går att hitta när man zoomar ut.
 */
const MARGINAL = 400

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
  const { noder, kablar, synliga, annatBlad, placeringar, vanda } = indata
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

  const mittRader = mittNyckel ? radernaI(mittNyckel, grupper.get(mittNyckel)!) : []
  const radIndex = new Map(mittRader.map((n, i) => [n.id, i] as const))

  // ---------- grannskap mellan rutor ----------

  /**
   * rutnyckel -> grannrutor. `egenNodId` är den egna änden av kabeln och
   * `motNodId` den andra. Båda behövs: sidan avgörs av var *den egna* porten
   * sitter, höjden av var grannen hamnade.
   */
  const grannar = new Map<
    string,
    { nyckel: string; egenNodId: string; motNodId: string }[]
  >()
  for (const k of kablar) {
    const a = nodMap.get(k.nodA)
    const b = nodMap.get(k.nodB)
    if (!a || !b || !syns(a.id) || !syns(b.id)) continue
    const na = rutnyckel(a)
    const nb = rutnyckel(b)
    if (na === nb) continue
    if (!grannar.has(na)) grannar.set(na, [])
    if (!grannar.has(nb)) grannar.set(nb, [])
    grannar.get(na)!.push({ nyckel: nb, egenNodId: a.id, motNodId: b.id })
    grannar.get(nb)!.push({ nyckel: na, egenNodId: b.id, motNodId: a.id })
  }

  /**
   * Kolumn per ruta: 0 är mitten, negativa tal ligger till vänster och
   * positiva till höger. Bredden på steget är alltid ett — vandringen utåt
   * följer kablarna, så en komponent hamnar bredvid det den faktiskt är
   * kopplad till och inte i en hög längst ned.
   */
  const kolumn = new Map<string, number>()
  if (mittNyckel) kolumn.set(mittNyckel, 0)

  // Steg ett: det som hänger direkt på mittenheten. Sidan avgörs av vilken
  // sida av styrenheten porten sitter på.
  if (mittNyckel) {
    for (const { nyckel, egenNodId } of grannar.get(mittNyckel) ?? []) {
      if (kolumn.has(nyckel)) continue
      const port = nodMap.get(egenNodId)
      kolumn.set(nyckel, port && sidaForNod(port) === 'vanster' ? -1 : 1)
    }
  }

  // Steg två: vandra utåt. Tecknet ärvs, avståndet ökar.
  let ko = [...kolumn.keys()].filter((k) => k !== mittNyckel)
  while (ko.length) {
    const nasta: string[] = []
    for (const nyckel of ko) {
      const c = kolumn.get(nyckel)!
      for (const { nyckel: granne } of grannar.get(nyckel) ?? []) {
        if (kolumn.has(granne)) continue
        kolumn.set(granne, c + Math.sign(c))
        nasta.push(granne)
      }
    }
    ko = nasta
  }

  // Det som inte hänger ihop med mitten alls hamnar till vänster, i egen
  // kolumn. Det syns att de inte hör ihop, vilket är sant.
  const losa = [...grupper.keys()].filter((k) => !kolumn.has(k)).sort(ordna)
  for (const nyckel of losa) kolumn.set(nyckel, -1)

  // ---------- placera rutorna ----------

  const rutor: Ruta[] = []
  const punktPerNod = new Map<string, Anslutningspunkt>()
  const ankare = new Map<string, number>()

  const mittY = KANT
  const mittX = KANT + RUTBREDD + SPALT

  function kolumnX(c: number, bredd: number): number {
    if (c === 0) return mittX
    if (c > 0) return mittX + MITTBREDD + SPALT + (c - 1) * (RUTBREDD + SPALT)
    return mittX - (SPALT + bredd) - (-c - 1) * (RUTBREDD + SPALT)
  }

  function byggRuta(nyckel: string, x: number, y: number, arMitten: boolean): Ruta {
    const lista = grupper.get(nyckel)!
    const rader = radernaI(nyckel, lista)
    const forsta = lista[0]!
    const bredd = arMitten ? MITTBREDD : RUTBREDD
    const hojd = RUBRIKHOJD + Math.max(rader.length, 1) * RAD + 8
    const flytt = placeringar.get(nyckel) ?? { x: 0, y: 0 }
    const rx = x + flytt.x
    const ry = y + flytt.y

    // Stiften vänder in mot mitten. En ruta till höger har dem till vänster,
    // annars går kabeln bakom sin egen ruta — vilket var precis felet i
    // föregående version.
    const c = kolumn.get(nyckel) ?? -1
    const grund: Sida = c > 0 ? 'vanster' : 'hoger'

    const anslutningar: Anslutningspunkt[] = rader.map((n, i) => {
      const grundsida = arMitten ? sidaForNod(n) : grund
      const sida: Sida = vanda.has(nyckel)
        ? grundsida === 'vanster'
          ? 'hoger'
          : 'vanster'
        : grundsida
      return {
        nodId: n.id,
        etikett: n.stift
          ? `${n.stift} · ${n.anslutning ?? n.bararen}`
          : (n.anslutning ?? n.bararen),
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

  if (mittNyckel) {
    const ruta = byggRuta(mittNyckel, mittX, mittY, true)
    rutor.push(ruta)
    ankare.set(mittNyckel, ruta.y)
    for (const a of ruta.anslutningar) ankare.set(`nod:${a.nodId}`, a.y)
  }

  /**
   * Önskad höjd: mitt för de grannar som redan har en plats. Rutan hamnar
   * alltså i höjd med det den är kopplad till. Först när ingen granne är
   * placerad faller den tillbaka på toppen.
   */
  function onskadY(nyckel: string): number {
    const varden: number[] = []
    for (const { motNodId } of grannar.get(nyckel) ?? []) {
      const y = ankare.get(`nod:${motNodId}`)
      if (y !== undefined) varden.push(y)
    }
    if (!varden.length) {
      // Hänger den på mittenheten men utan placerad granne, används portens rad.
      for (const { nyckel: granne, motNodId } of grannar.get(nyckel) ?? []) {
        if (granne !== mittNyckel) continue
        const i = radIndex.get(motNodId)
        if (i !== undefined) varden.push(mittY + RUBRIKHOJD + i * RAD)
      }
    }
    if (!varden.length) return mittY
    return varden.reduce((a, b) => a + b, 0) / varden.length - RUBRIKHOJD
  }

  const kvar = [...grupper.keys()].filter((k) => k !== mittNyckel)
  const iOrdning = kvar.sort(
    (a, b) =>
      Math.abs(kolumn.get(a)!) - Math.abs(kolumn.get(b)!) ||
      onskadY(a) - onskadY(b) ||
      ordna(a, b),
  )

  const underkant = new Map<number, number>()
  for (const nyckel of iOrdning) {
    const c = kolumn.get(nyckel)!
    const x = kolumnX(c, RUTBREDD)
    const y = Math.max(onskadY(nyckel), underkant.get(c) ?? mittY)
    const ruta = byggRuta(nyckel, x, y, false)
    rutor.push(ruta)
    underkant.set(c, ruta.y + ruta.hojd + LUFT)
    ankare.set(nyckel, ruta.y)
    for (const a of ruta.anslutningar) ankare.set(`nod:${a.nodId}`, a.y)
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

  // ---------- ytans hörn ----------
  //
  // Räknas ur det som faktiskt ritats, inklusive handflyttade rutor som kan
  // ligga på negativa koordinater. Marginalen gör arbetsytan större än
  // innehållet, så att en ruta man dragit åt sidan går att hitta.

  const xs = [
    ...rutor.flatMap((r) => [r.x, r.x + r.bredd]),
    ...ledningar.flatMap((l) => l.punkter.map((p) => p.x)),
    ...hanvisningar.map((h) => h.x),
    0,
  ]
  const ys = [
    ...rutor.flatMap((r) => [r.y, r.y + r.hojd]),
    ...ledningar.flatMap((l) => l.punkter.map((p) => p.y)),
    ...hanvisningar.map((h) => h.y),
    0,
  ]

  const minX = Math.min(...xs) - MARGINAL
  const minY = Math.min(...ys) - MARGINAL

  return {
    minX,
    minY,
    bredd: Math.max(...xs) + MARGINAL - minX,
    hojd: Math.max(...ys) + MARGINAL - minY,
    rutor,
    ledningar,
    hanvisningar,
  }
}
