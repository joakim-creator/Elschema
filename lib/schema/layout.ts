/**
 * Placeringen av ett blad, räknad ur nätlistan.
 *
 * Ren funktion: samma nätlista ger samma ritning. Ingen databasåtkomst, ingen
 * slump, inga sidoeffekter — det är vad som gör den prövbar utan att starta en
 * webbläsare, och det är också vad B-001 kräver. Ritningen är en vy av
 * nätlistan; den bär ingen egen sanning.
 *
 * Layouten följer förlagan i specifikationens avsnitt 11: styrenheten i mitten,
 * ingångar till vänster, utgångar till höger, komponenterna fläktade utåt.
 */

export type Nodsort = 'port' | 'komponent' | 'jord' | 'skarv'

export type Nod = {
  id: string
  sort: Nodsort
  bararen: string
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
  /** Noder som bladets filter släpper igenom. Tom mängd betyder hela projektet. */
  synliga: Set<string> | null
  /** Nod -> namnet på det blad kabeln fortsätter på, för hänvisningar. */
  annatBlad: Map<string, string>
  /** Handflyttade lägen, relativt den automatiska placeringen. */
  placeringar: Map<string, { x: number; y: number }>
}

export type Ruta = {
  nodId: string
  x: number
  y: number
  bredd: number
  hojd: number
  rubrik: string
  underrad: string | null
  sort: Nodsort
  jordklass: string | null
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
  riktning: 'vanster' | 'hoger'
  text: string
  blad: string | null
}

export type Ritning = {
  bredd: number
  hojd: number
  mitten: { x: number; y: number; bredd: number; hojd: number; rubrik: string } | null
  portrader: {
    nodId: string
    x: number
    y: number
    sida: 'vanster' | 'hoger'
    text: string
  }[]
  rutor: Ruta[]
  ledningar: Ledning[]
  hanvisningar: Hanvisning[]
  /** Portar på mittenheten som ingen kabel rör. Räknas, ritas inte. */
  okopplade: number
}

const RADHOJD = 34
const RUTBREDD = 190
const RUTHOJD = 26
const MITTBREDD = 230
const KANT = 60
const SPALT = 150
// Bandet under mitten behöver mer luft än portraderna: där ligger rutor på båda
// sidor och etiketterna hamnar annars ovanpå varandra.
const BANDRAD = 48

/** Ingångar och jord till vänster, allt annat till höger — som i förlagan. */
function sida(nod: Nod): 'vanster' | 'hoger' {
  return nod.riktning === 'in' || nod.riktning === 'jord' ? 'vanster' : 'hoger'
}

function ordna(a: string, b: string): number {
  return a.localeCompare(b, 'sv', { numeric: true })
}

export function raknaRitning(indata: Indata): Ritning {
  const { noder, kablar, synliga, annatBlad, placeringar } = indata
  const nodMap = new Map(noder.map((n) => [n.id, n]))
  const syns = (id: string) => synliga === null || synliga.has(id)

  // Mittenheten är den enhet som flest synliga portar tillhör. Ett blad utan
  // enhet — bara belysning, till exempel — får ingen mitt och ritas som band.
  const antalPerEnhet = new Map<string, number>()
  for (const n of noder) {
    if (n.sort === 'port' && n.enhetId && syns(n.id)) {
      antalPerEnhet.set(n.enhetId, (antalPerEnhet.get(n.enhetId) ?? 0) + 1)
    }
  }
  const mittEnhet =
    [...antalPerEnhet.entries()].sort((a, b) => b[1] - a[1])[0]?.[0] ?? null

  const kablarPerNod = new Map<string, Kabel[]>()
  for (const k of kablar) {
    for (const id of [k.nodA, k.nodB]) {
      if (!kablarPerNod.has(id)) kablarPerNod.set(id, [])
      kablarPerNod.get(id)!.push(k)
    }
  }

  const mittPortar = noder
    .filter((n) => n.sort === 'port' && n.enhetId === mittEnhet && syns(n.id))
    .sort((a, b) => ordna(a.anslutning ?? '', b.anslutning ?? ''))

  const kopplade = mittPortar.filter((p) => (kablarPerNod.get(p.id) ?? []).length > 0)
  const okopplade = mittPortar.length - kopplade.length

  const vanster = kopplade.filter((p) => sida(p) === 'vanster')
  const hoger = kopplade.filter((p) => sida(p) === 'hoger')

  // Kablar som inte rör mittenheten alls ritas i ett band under. De finns —
  // att utelämna dem hade gjort ritningen till en halvsanning.
  const rord = new Set(kopplade.map((p) => p.id))
  const ovriga = kablar.filter(
    (k) => syns(k.nodA) && syns(k.nodB) && !rord.has(k.nodA) && !rord.has(k.nodB),
  )

  // Och kablar där bara den ena änden syns, utan att den änden är en port på
  // mittenheten. Ett filter på zon skär rakt igenom sådana: injektorn ligger i
  // motorrummet, styrenheten i kupén. Utan det här steget försvann kabeln helt
  // från bladet — den ritades varken som streck eller som hänvisning.
  const hangande = kablar.filter((k) => {
    const a = syns(k.nodA)
    const b = syns(k.nodB)
    if (a === b) return false
    const synligEnde = a ? k.nodA : k.nodB
    return !rord.has(synligEnde)
  })

  const rader = Math.max(vanster.length, hoger.length, 1)
  const mittHojd = rader * RADHOJD + 40
  const mittY = KANT
  const mittX = KANT + SPALT + RUTBREDD
  const bredd = mittX + MITTBREDD + SPALT + RUTBREDD + KANT
  const bandY = mittY + mittHojd + 70
  const hojd = bandY + (ovriga.length + hangande.length) * BANDRAD + KANT

  const portrader: Ritning['portrader'] = []
  const rutor: Ruta[] = []
  const ledningar: Ledning[] = []
  const hanvisningar: Hanvisning[] = []

  function placera(nodId: string, x: number, y: number) {
    const flyttad = placeringar.get(nodId)
    return flyttad ? { x: x + flyttad.x, y: y + flyttad.y } : { x, y }
  }

  function rutetiketter(n: Nod): { rubrik: string; underrad: string | null } {
    if (n.sort === 'jord') return { rubrik: n.bararen, underrad: n.jordklass }
    if (n.sort === 'skarv') return { rubrik: n.bararen, underrad: 'skarv' }
    return { rubrik: n.bararen, underrad: n.anslutning }
  }

  function ritaSida(portar: Nod[], vansterSida: boolean) {
    portar.forEach((port, i) => {
      const y = mittY + 30 + i * RADHOJD
      const portX = vansterSida ? mittX : mittX + MITTBREDD
      portrader.push({
        nodId: port.id,
        x: portX,
        y,
        sida: vansterSida ? 'vanster' : 'hoger',
        text: port.anslutning ?? port.bararen,
      })

      const kablarHar = kablarPerNod.get(port.id) ?? []
      kablarHar.forEach((k, j) => {
        const motId = k.nodA === port.id ? k.nodB : k.nodA
        const mot = nodMap.get(motId)
        const yj = y + j * 14
        const stubb = vansterSida ? portX - 40 : portX + 40

        if (!mot || !syns(motId)) {
          hanvisningar.push({
            kabelId: k.id,
            x: stubb,
            y: yj,
            riktning: vansterSida ? 'vanster' : 'hoger',
            text: mot
              ? `${mot.bararen}${mot.anslutning ? ` · ${mot.anslutning}` : ''}`
              : '?',
            blad: annatBlad.get(motId) ?? null,
          })
          ledningar.push({
            kabelId: k.id,
            punkter: [
              { x: portX, y },
              { x: stubb, y: yj },
            ],
            farg: k.farg,
            markning: k.markning,
            area: k.area,
            skarmad: k.skarmad,
          })
          return
        }

        const rutX = vansterSida ? KANT : mittX + MITTBREDD + SPALT
        const lage = placera(motId, rutX, yj - RUTHOJD / 2)
        if (!rutor.some((r) => r.nodId === motId)) {
          const { rubrik, underrad } = rutetiketter(mot)
          rutor.push({
            nodId: motId,
            x: lage.x,
            y: lage.y,
            bredd: RUTBREDD,
            hojd: RUTHOJD,
            rubrik,
            underrad,
            sort: mot.sort,
            jordklass: mot.jordklass,
          })
        }
        const ruta = rutor.find((r) => r.nodId === motId)!
        const anslutX = vansterSida ? ruta.x + ruta.bredd : ruta.x
        const anslutY = ruta.y + ruta.hojd / 2
        const brytX = vansterSida ? portX - SPALT / 2 : portX + SPALT / 2
        ledningar.push({
          kabelId: k.id,
          punkter: [
            { x: portX, y },
            { x: brytX, y },
            { x: brytX, y: anslutY },
            { x: anslutX, y: anslutY },
          ],
          farg: k.farg,
          markning: k.markning,
          area: k.area,
          skarmad: k.skarmad,
        })
      })
    })
  }

  ritaSida(vanster, true)
  ritaSida(hoger, false)

  ovriga.forEach((k, i) => {
    const y = bandY + i * BANDRAD
    const a = nodMap.get(k.nodA)
    const b = nodMap.get(k.nodB)
    if (!a || !b) return
    for (const [nod, x] of [
      [a, KANT],
      [b, KANT + RUTBREDD + SPALT],
    ] as const) {
      if (!rutor.some((r) => r.nodId === nod.id)) {
        const lage = placera(nod.id, x, y - RUTHOJD / 2)
        const { rubrik, underrad } = rutetiketter(nod)
        rutor.push({
          nodId: nod.id,
          x: lage.x,
          y: lage.y,
          bredd: RUTBREDD,
          hojd: RUTHOJD,
          rubrik,
          underrad,
          sort: nod.sort,
          jordklass: nod.jordklass,
        })
      }
    }
    const ra = rutor.find((r) => r.nodId === a.id)!
    const rb = rutor.find((r) => r.nodId === b.id)!
    ledningar.push({
      kabelId: k.id,
      punkter: [
        { x: ra.x + ra.bredd, y: ra.y + ra.hojd / 2 },
        { x: rb.x, y: rb.y + rb.hojd / 2 },
      ],
      farg: k.farg,
      markning: k.markning,
      area: k.area,
      skarmad: k.skarmad,
    })
  })

  hangande.forEach((k, i) => {
    const y = bandY + (ovriga.length + i) * BANDRAD
    const synligId = syns(k.nodA) ? k.nodA : k.nodB
    const bortaId = syns(k.nodA) ? k.nodB : k.nodA
    const synlig = nodMap.get(synligId)
    const borta = nodMap.get(bortaId)
    if (!synlig) return

    if (!rutor.some((r) => r.nodId === synligId)) {
      const lage = placera(synligId, KANT, y - RUTHOJD / 2)
      const { rubrik, underrad } = rutetiketter(synlig)
      rutor.push({
        nodId: synligId,
        x: lage.x,
        y: lage.y,
        bredd: RUTBREDD,
        hojd: RUTHOJD,
        rubrik,
        underrad,
        sort: synlig.sort,
        jordklass: synlig.jordklass,
      })
    }
    const ruta = rutor.find((r) => r.nodId === synligId)!
    const slut = ruta.x + ruta.bredd + SPALT
    ledningar.push({
      kabelId: k.id,
      punkter: [
        { x: ruta.x + ruta.bredd, y: ruta.y + ruta.hojd / 2 },
        { x: slut, y: ruta.y + ruta.hojd / 2 },
      ],
      farg: k.farg,
      markning: k.markning,
      area: k.area,
      skarmad: k.skarmad,
    })
    hanvisningar.push({
      kabelId: k.id,
      x: slut,
      y: ruta.y + ruta.hojd / 2,
      riktning: 'hoger',
      text: borta
        ? `${borta.bararen}${borta.anslutning ? ` · ${borta.anslutning}` : ''}`
        : '?',
      blad: annatBlad.get(bortaId) ?? null,
    })
  })

  const mittNamn = mittEnhet
    ? (noder.find((n) => n.enhetId === mittEnhet)?.bararen ?? 'Enhet')
    : ''

  return {
    bredd,
    hojd,
    mitten: mittEnhet
      ? { x: mittX, y: mittY, bredd: MITTBREDD, hojd: mittHojd, rubrik: mittNamn }
      : null,
    portrader,
    rutor,
    ledningar,
    hanvisningar,
    okopplade,
  }
}
