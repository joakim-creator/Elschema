import { describe, expect, it } from 'vitest'
import {
  hittaKorsningar,
  raknaRitning,
  rutnyckel,
  type Indata,
  type Kabel,
  type Nod,
  type Ruta,
} from '@/lib/schema/layout'
import { foreslaBeteckning, foreslaNummer } from '@/lib/schema/nummer'

/**
 * Layouten är en ren funktion och prövas som en. Inget här rör databasen — det
 * är hela poängen med att räkna ritningen ur nätlistan i stället för att lagra
 * den (B-001).
 */

function nod(over: Partial<Nod> & { id: string }): Nod {
  return {
    sort: 'port',
    bararen: 'ECU',
    anslutning: null,
    stift: null,
    signaltyp: null,
    enhetId: 'e1',
    jordklass: null,
    riktning: null,
    ...over,
  }
}

function komponent(id: string, namn: string, ben: string): Nod {
  return nod({ id, sort: 'komponent', bararen: namn, anslutning: ben, enhetId: null })
}

function kabel(id: string, a: string, b: string, over: Partial<Kabel> = {}): Kabel {
  return {
    id,
    nodA: a,
    nodB: b,
    farg: null,
    markning: null,
    area: null,
    skarmad: false,
    ...over,
  }
}

function bas(over: Partial<Indata> = {}): Indata {
  return {
    noder: [],
    kablar: [],
    synliga: null,
    annatBlad: new Map(),
    placeringar: new Map(),
    vanda: new Set(),
    dolda: new Set(),
    ...over,
  }
}

const hitta = (rutor: Ruta[], nyckel: string) => rutor.find((r) => r.nyckel === nyckel)!

describe('en ruta är en enhet eller en komponent [B-015]', () => {
  const noder = [
    nod({ id: 'p1', anslutning: 'AIN 1', riktning: 'in' }),
    nod({ id: 'p2', anslutning: 'INJ 1', riktning: 'ut' }),
    komponent('k1', 'Injektor 1', '1'),
    komponent('k2', 'Injektor 1', '2'),
  ]
  const kablar = [kabel('c', 'p2', 'k2')]

  it('injektorns två ben hamnar i samma ruta', () => {
    const r = raknaRitning(bas({ noder, kablar }))
    const rutor = r.rutor.filter((x) => x.rubrik === 'Injektor 1')
    expect(rutor).toHaveLength(1)
    expect(rutor[0]!.anslutningar.map((a) => a.etikett).sort()).toEqual(['1', '2'])
  })

  it('styrenhetens portar hamnar i en enda ruta', () => {
    const r = raknaRitning(bas({ noder, kablar }))
    const ecu = hitta(r.rutor, 'enhet:e1')
    expect(ecu.arMitten).toBe(true)
    expect(ecu.anslutningar.map((a) => a.etikett)).toEqual(['AIN 1', 'INJ 1'])
  })

  it('rutnyckeln är stabil och beskriver bäraren', () => {
    expect(rutnyckel(noder[0]!)).toBe('enhet:e1')
    expect(rutnyckel(noder[2]!)).toBe('komponent:Injektor 1')
  })

  it('samma indata ger samma ritning — ingen tillstånd mellan anrop', () => {
    const a = raknaRitning(bas({ noder, kablar }))
    const b = raknaRitning(bas({ noder, kablar }))
    expect(JSON.stringify(a)).toBe(JSON.stringify(b))
  })
})

describe('mittenheten visar alla sina portar [F2-12]', () => {
  /**
   * Man ska kunna dra en kabel från en port som ännu inte används. Döljer man
   * okopplade portar går det inte att rita först och koppla sedan, vilket är
   * hela arbetssättet i B-015.
   */
  it('åttio portar ger åttio anslutningspunkter även utan kablar', () => {
    const manga = Array.from({ length: 80 }, (_, i) =>
      nod({ id: `p${i}`, anslutning: `PORT ${i}`, riktning: i % 2 ? 'in' : 'ut' }),
    )
    const r = raknaRitning(bas({ noder: manga }))
    const ecu = hitta(r.rutor, 'enhet:e1')
    expect(ecu.anslutningar).toHaveLength(80)
    expect(ecu.anslutningar.every((a) => !a.kopplad)).toBe(true)
  })

  it('en andra enhet visar bara det som är kopplat', () => {
    const noder = [
      nod({ id: 'p1', anslutning: 'INJ 1', riktning: 'ut' }),
      nod({ id: 'p2', anslutning: 'INJ 2', riktning: 'ut' }),
      nod({ id: 'p3', anslutning: 'INJ 3', riktning: 'ut' }),
      nod({
        id: 'q1',
        bararen: 'PDM',
        enhetId: 'e2',
        anslutning: 'OUT 1',
        riktning: 'ut',
      }),
      nod({
        id: 'q2',
        bararen: 'PDM',
        enhetId: 'e2',
        anslutning: 'OUT 2',
        riktning: 'ut',
      }),
      komponent('k', 'Injektor 1', '1'),
    ]
    const r = raknaRitning(bas({ noder, kablar: [kabel('c', 'q1', 'k')] }))
    const pdm = hitta(r.rutor, 'enhet:e2')
    expect(pdm.arMitten).toBe(false)
    expect(pdm.anslutningar.map((a) => a.etikett)).toEqual(['OUT 1'])
  })
})

describe('sidplacering följer förlagan [F2-01]', () => {
  const noder = [
    nod({ id: 'p_in', anslutning: 'AIN 1', riktning: 'in' }),
    nod({ id: 'p_ut', anslutning: 'INJ 1', riktning: 'ut' }),
    komponent('givare', 'CLT-givare', 'signal'),
    komponent('inj', 'Injektor 1', '2'),
  ]
  const kablar = [kabel('c1', 'givare', 'p_in'), kabel('c2', 'p_ut', 'inj')]

  it('ingången ligger på mittenhetens vänsterkant, utgången på högerkanten', () => {
    const r = raknaRitning(bas({ noder, kablar }))
    const ecu = hitta(r.rutor, 'enhet:e1')
    const sidor = Object.fromEntries(ecu.anslutningar.map((a) => [a.etikett, a.sida]))
    expect(sidor).toEqual({ 'AIN 1': 'vanster', 'INJ 1': 'hoger' })
  })

  it('komponenten på ingången ritas till vänster om enheten', () => {
    const r = raknaRitning(bas({ noder, kablar }))
    const ecu = hitta(r.rutor, 'enhet:e1')
    const vanster = hitta(r.rutor, 'komponent:CLT-givare')
    const hoger = hitta(r.rutor, 'komponent:Injektor 1')
    expect(vanster.x).toBeLessThan(ecu.x)
    expect(hoger.x).toBeGreaterThan(ecu.x + ecu.bredd)
  })

  it('en ruta till vänster vänder sina anslutningar åt höger', () => {
    const r = raknaRitning(bas({ noder, kablar }))
    expect(hitta(r.rutor, 'komponent:CLT-givare').anslutningar[0]!.sida).toBe('hoger')
    expect(hitta(r.rutor, 'komponent:Injektor 1').anslutningar[0]!.sida).toBe('vanster')
  })
})

describe('kablar som lämnar bladet får en hänvisning [F2-07]', () => {
  const noder = [
    nod({ id: 'p', anslutning: 'INJ 1', riktning: 'ut' }),
    komponent('bortom', 'Injektor 1', '2'),
  ]
  const kablar = [kabel('c', 'p', 'bortom')]

  it('hänvisningen namnger bladet kabeln fortsätter på', () => {
    const r = raknaRitning(
      bas({
        noder,
        kablar,
        synliga: new Set(['p']),
        annatBlad: new Map([['bortom', 'Motorrum']]),
      }),
    )
    expect(r.hanvisningar).toHaveLength(1)
    expect(r.hanvisningar[0]).toMatchObject({ blad: 'Motorrum', text: 'Injektor 1 · 2' })
    expect(r.rutor.map((x) => x.nyckel)).not.toContain('komponent:Injektor 1')
  })

  /**
   * Hittades genom att räkna strecken på ett riktigt blad: zonfiltret släppte
   * igenom injektorn men inte styrenheten, och kabeln mellan dem försvann helt.
   */
  it('gäller även när den synliga änden inte är mittenhetens port', () => {
    const r = raknaRitning(
      bas({
        noder,
        kablar,
        synliga: new Set(['bortom']),
        annatBlad: new Map([['p', 'Kupé']]),
      }),
    )
    expect(r.ledningar).toHaveLength(1)
    expect(r.hanvisningar[0]).toMatchObject({ blad: 'Kupé', text: 'ECU · INJ 1' })
  })

  it('en kabel med båda ändarna utanför bladet ritas inte alls', () => {
    const r = raknaRitning(
      bas({
        noder: [...noder, komponent('c', 'Annan', '1')],
        kablar,
        synliga: new Set(['c']),
      }),
    )
    expect(r.ledningar).toHaveLength(0)
    expect(r.hanvisningar).toHaveLength(0)
  })
})

describe('jord och skarv ritas som symboler [F2-04]', () => {
  it('jordpunkten blir en egen ruta med sin klass och en anslutningspunkt', () => {
    const noder = [
      nod({ id: 'p', anslutning: 'SENSOR GND', riktning: 'jord' }),
      nod({
        id: 'j',
        sort: 'jord',
        bararen: 'ECU sensorjord',
        enhetId: null,
        jordklass: 'sensor',
      }),
    ]
    const r = raknaRitning(bas({ noder, kablar: [kabel('c', 'p', 'j')] }))
    const jord = hitta(r.rutor, 'jord:j')
    expect(jord.sort).toBe('jord')
    expect(jord.jordklass).toBe('sensor')
    expect(jord.anslutningar).toHaveLength(1)
    expect(jord.anslutningar[0]!.kopplad).toBe(true)
  })
})

describe('handflyttade lägen är förskjutningar [F2-11]', () => {
  /**
   * Buggen som gav upphov till provet: läget sparades absolut men lades på som
   * en förskjutning, så rutan hoppade dubbelt vid varje drag.
   */
  it('förskjutningen läggs på den automatiska placeringen, en gång', () => {
    const noder = [
      nod({ id: 'p', anslutning: 'INJ 1', riktning: 'ut' }),
      komponent('k', 'Injektor 1', '2'),
    ]
    const kablar = [kabel('c', 'p', 'k')]
    const utan = raknaRitning(bas({ noder, kablar }))
    const med = raknaRitning(
      bas({
        noder,
        kablar,
        placeringar: new Map([['komponent:Injektor 1', { x: 40, y: -12 }]]),
      }),
    )
    const a = hitta(utan.rutor, 'komponent:Injektor 1')
    const b = hitta(med.rutor, 'komponent:Injektor 1')
    expect(b.x - a.x).toBe(40)
    expect(b.y - a.y).toBe(-12)
    // Anslutningspunkterna flyttar med rutan, annars pekar kablarna fel.
    expect(b.anslutningar[0]!.x - a.anslutningar[0]!.x).toBe(40)
    expect(b.anslutningar[0]!.y - a.anslutningar[0]!.y).toBe(-12)
  })
})

describe('kabelns egenskaper följer med till ritningen [F2-05]', () => {
  it('ledningen bär färg, märkning, area och skärm', () => {
    const noder = [
      nod({ id: 'p', anslutning: 'INJ 1', riktning: 'ut' }),
      komponent('k', 'Injektor 1', '2'),
    ]
    const r = raknaRitning(
      bas({
        noder,
        kablar: [
          kabel('c', 'p', 'k', {
            farg: 'grå',
            markning: 'INJ1',
            area: 0.75,
            skarmad: true,
          }),
        ],
      }),
    )
    expect(r.ledningar[0]).toMatchObject({
      farg: 'grå',
      markning: 'INJ1',
      area: 0.75,
      skarmad: true,
    })
  })
})

describe('ett blad utan enhet ritas ändå [F2-06]', () => {
  it('bara belysning ger rutor och streck men ingen mitt', () => {
    const noder = [
      komponent('a', 'Bromsljus', '+12V'),
      nod({
        id: 'b',
        sort: 'jord',
        bararen: 'Chassijord bak',
        enhetId: null,
        jordklass: 'chassi',
      }),
    ]
    const r = raknaRitning(bas({ noder, kablar: [kabel('c', 'a', 'b')] }))
    expect(r.rutor.some((x) => x.arMitten)).toBe(false)
    expect(r.rutor).toHaveLength(2)
    expect(r.ledningar).toHaveLength(1)
  })
})

describe('nummerserier och beteckningsförslag [F2-17, F2-18]', () => {
  it('första numret i serien är serie*100 + 1', () => {
    expect(foreslaNummer(3, [])).toBe(301)
    expect(foreslaNummer(1, [])).toBe(101)
  })

  it('nästa lediga nummer inom serien tas', () => {
    expect(foreslaNummer(3, [301, 302, 304])).toBe(303)
  })

  it('nummer i andra serier stör inte', () => {
    expect(foreslaNummer(3, [101, 102, 201, 999])).toBe(301)
  })

  it('luckor fylls igen — en numrering som bara växer lämnar hål', () => {
    expect(foreslaNummer(2, [201, 203, 204])).toBe(202)
  })

  it('beteckningen får löpnummer inom sin mall', () => {
    expect(foreslaBeteckning('Injektor', [])).toBe('Injektor 1')
    expect(foreslaBeteckning('Injektor', ['Injektor 1', 'Injektor 2'])).toBe('Injektor 3')
  })

  it('egna namn räknas inte som löpnummer', () => {
    expect(foreslaBeteckning('Bränslepump', ['Bränslepump bak', 'Bränslepump 1'])).toBe(
      'Bränslepump 2',
    )
  })

  it('mallnamn med regexbetydelse hanteras', () => {
    expect(foreslaBeteckning('Gaspedal (APP)', ['Gaspedal (APP) 1'])).toBe(
      'Gaspedal (APP) 2',
    )
  })
})

describe('stiftnumret står före funktionen [F2-15]', () => {
  it('etiketten blir "A2 · IGN 1"', () => {
    const r = raknaRitning(
      bas({
        noder: [nod({ id: 'p', anslutning: 'IGN 1', stift: 'A2', riktning: 'ut' })],
      }),
    )
    expect(hitta(r.rutor, 'enhet:e1').anslutningar[0]!.etikett).toBe('A2 · IGN 1')
  })

  it('en kanal på flera stift visar alla', () => {
    const r = raknaRitning(
      bas({
        noder: [
          nod({ id: 'p', anslutning: 'OUT 1', stift: 'B1, B2, B3', riktning: 'ut' }),
        ],
      }),
    )
    expect(hitta(r.rutor, 'enhet:e1').anslutningar[0]!.etikett).toBe('B1, B2, B3 · OUT 1')
  })
})

describe('rutan kan vändas för hand [F2-16]', () => {
  it('vänd ruta får sina anslutningar på motsatt sida', () => {
    const noder = [
      nod({ id: 'p', anslutning: 'INJ 1', riktning: 'ut' }),
      komponent('k', 'Injektor 1', '2'),
    ]
    const kablar = [kabel('c', 'p', 'k')]
    const rak = raknaRitning(bas({ noder, kablar }))
    const vand = raknaRitning(
      bas({ noder, kablar, vanda: new Set(['komponent:Injektor 1']) }),
    )
    expect(hitta(rak.rutor, 'komponent:Injektor 1').anslutningar[0]!.sida).toBe('vanster')
    expect(hitta(vand.rutor, 'komponent:Injektor 1').anslutningar[0]!.sida).toBe('hoger')
  })
})

describe('rutan hamnar i höjd med sin port [F2-19]', () => {
  /**
   * Buggen: en komponent kopplad till port 60 av 80 hamnade längst upp medan
   * dess kabel gick åtta hundra bildpunkter nedåt. Nykopplad såg den ut att
   * flyga ur bild.
   */
  it('en komponent på en sen port ligger långt ned, inte högst upp', () => {
    const portar = Array.from({ length: 40 }, (_, i) =>
      nod({
        id: `p${i}`,
        anslutning: `UT ${String(i).padStart(2, '0')}`,
        riktning: 'ut',
      }),
    )
    const noder = [...portar, komponent('k', 'Injektor 1', '2')]
    const r = raknaRitning(bas({ noder, kablar: [kabel('c', 'p39', 'k')] }))
    const ecu = hitta(r.rutor, 'enhet:e1')
    const ruta = hitta(r.rutor, 'komponent:Injektor 1')
    const port = ecu.anslutningar.find((a) => a.etikett === 'UT 39')!
    // Rutan ska ligga i närheten av sin port, inte i toppen av bladet.
    expect(Math.abs(ruta.y - port.y)).toBeLessThan(80)
    expect(ruta.y).toBeGreaterThan(ecu.y + 400)
  })
})

describe('kolumner efter avstånd från mitten [F2-22]', () => {
  /**
   * Buggarna som gav upphov till provet: batteriet hänger på PDM:en och inte
   * på styrenheten. Det hamnade då i ett band längst ned — utanför bild när man
   * just kopplat det — och fick stiften åt fel håll så att kabeln gick bakom
   * sin egen ruta.
   */
  // Styrenheten måste ha flest portar för att bli mitten — annars vinner PDM:en,
  // och provet skulle mäta något annat än det påstår.
  const noder = [
    nod({ id: 'p_ut', anslutning: 'OUT', riktning: 'ut' }),
    nod({ id: 'p_a', anslutning: 'AIN 1', riktning: 'in' }),
    nod({ id: 'p_b', anslutning: 'AIN 2', riktning: 'in' }),
    nod({
      id: 'pdm_in',
      bararen: 'PDM',
      enhetId: 'e2',
      anslutning: 'IN',
      riktning: 'in',
    }),
    nod({
      id: 'pdm_ut',
      bararen: 'PDM',
      enhetId: 'e2',
      anslutning: 'OUT 1',
      riktning: 'ut',
    }),
    komponent('batt', 'Batteri', '+'),
  ]
  const kablar = [kabel('c1', 'p_ut', 'pdm_in'), kabel('c2', 'pdm_ut', 'batt')]

  it('batteriet hamnar bortom PDM:en, inte i ett band längst ned', () => {
    const r = raknaRitning(bas({ noder, kablar }))
    const ecu = hitta(r.rutor, 'enhet:e1')
    const pdm = hitta(r.rutor, 'enhet:e2')
    const batt = hitta(r.rutor, 'komponent:Batteri')
    expect(pdm.x).toBeGreaterThan(ecu.x + ecu.bredd)
    expect(batt.x).toBeGreaterThan(pdm.x + pdm.bredd)
  })

  it('stiften vänder in mot mitten på båda sidor', () => {
    const r = raknaRitning(bas({ noder, kablar }))
    // Allt till höger om mitten har stiften till vänster, annars går kabeln
    // bakom sin egen ruta.
    for (const nyckel of ['enhet:e2', 'komponent:Batteri']) {
      expect(hitta(r.rutor, nyckel).anslutningar.every((a) => a.sida === 'vanster')).toBe(
        true,
      )
    }
  })

  it('batteriet ligger i höjd med den PDM-port det hänger på', () => {
    const r = raknaRitning(bas({ noder, kablar }))
    const pdm = hitta(r.rutor, 'enhet:e2')
    const batt = hitta(r.rutor, 'komponent:Batteri')
    const port = pdm.anslutningar.find((a) => a.etikett === 'OUT 1')!
    expect(Math.abs(batt.anslutningar[0]!.y - port.y)).toBeLessThan(60)
  })

  it('en komponent som inte hänger ihop med mitten hamnar till vänster', () => {
    const ensam = komponent('los', 'Bromsljus', '+12V')
    const r = raknaRitning(bas({ noder: [...noder, ensam], kablar }))
    const ecu = hitta(r.rutor, 'enhet:e1')
    expect(hitta(r.rutor, 'komponent:Bromsljus').x).toBeLessThan(ecu.x)
  })
})

describe('arbetsytan är större än innehållet [F2-23]', () => {
  it('marginal finns runt om, så att en undanflyttad ruta går att hitta', () => {
    const noder = [
      nod({ id: 'p', anslutning: 'INJ 1', riktning: 'ut' }),
      komponent('k', 'Injektor 1', '2'),
    ]
    const r = raknaRitning(bas({ noder, kablar: [kabel('c', 'p', 'k')] }))
    const vanstraKanten = Math.min(...r.rutor.map((x) => x.x))
    const hograKanten = Math.max(...r.rutor.map((x) => x.x + x.bredd))
    expect(r.minX).toBeLessThan(vanstraKanten - 100)
    expect(r.minX + r.bredd).toBeGreaterThan(hograKanten + 100)
  })

  it('en ruta dragen till negativa koordinater ryms i ytan', () => {
    const noder = [
      nod({ id: 'p', anslutning: 'INJ 1', riktning: 'ut' }),
      komponent('k', 'Injektor 1', '2'),
    ]
    const r = raknaRitning(
      bas({
        noder,
        kablar: [kabel('c', 'p', 'k')],
        placeringar: new Map([['komponent:Injektor 1', { x: -1500, y: -700 }]]),
      }),
    )
    const ruta = hitta(r.rutor, 'komponent:Injektor 1')
    expect(ruta.x).toBeLessThan(0)
    expect(r.minX).toBeLessThan(ruta.x)
    expect(r.minY).toBeLessThan(ruta.y)
  })
})

describe('kablarna får egna banor i mellanrummet [F2-24]', () => {
  /** Fyra utgångar på ECU:n, var och en till sin injektor. */
  function fyra() {
    const noder: Nod[] = []
    const kablar: Kabel[] = []
    for (let i = 1; i <= 4; i++) {
      noder.push(nod({ id: `p${i}`, anslutning: `INJ ${i}`, riktning: 'ut' }))
      noder.push(komponent(`k${i}`, `Injektor ${i}`, '2'))
      kablar.push(kabel(`c${i}`, `p${i}`, `k${i}`))
    }
    // Okopplade portar, så att ECU:n blir mittenheten.
    for (let i = 5; i <= 12; i++) {
      noder.push(nod({ id: `p${i}`, anslutning: `GP ${i}`, riktning: 'ut' }))
    }
    return { noder, kablar }
  }

  function lodratX(r: ReturnType<typeof raknaRitning>, kabelId: string): number | null {
    const l = r.ledningar.find((x) => x.kabelId === kabelId)
    if (!l || l.punkter.length < 4) return null
    return l.punkter[1]!.x
  }

  it('två kablar som överlappar i höjd delar aldrig lodrät bana', () => {
    // Det är överlappet som är felet, inte att banan delas. Två kablar långt
    // ifrån varandra i höjdled får gärna ligga på samma x — de rör aldrig
    // vid varandra, och att sprida dem hade bara ätit av mellanrummet.
    const { noder, kablar } = fyra()
    const r = raknaRitning(bas({ noder, kablar }))
    const delar = r.ledningar
      .filter((l) => l.punkter.length === 4)
      .map((l) => ({
        x: l.punkter[1]!.x,
        min: Math.min(l.punkter[1]!.y, l.punkter[2]!.y),
        max: Math.max(l.punkter[1]!.y, l.punkter[2]!.y),
      }))
    expect(delar).toHaveLength(kablar.length)
    for (let i = 0; i < delar.length; i++) {
      for (let j = i + 1; j < delar.length; j++) {
        const a = delar[i]!
        const b = delar[j]!
        const overlappar = a.min < b.max && b.min < a.max
        if (overlappar) expect(a.x).not.toBe(b.x)
      }
    }
  })

  it('banorna ryms i mellanrummet mellan rutorna', () => {
    const { noder, kablar } = fyra()
    const r = raknaRitning(bas({ noder, kablar }))
    const mitten = r.rutor.find((x) => x.arMitten)!
    const grannar = r.rutor.filter((x) => !x.arMitten && x.x > mitten.x)
    const vanster = Math.min(...grannar.map((x) => x.x))
    for (const k of kablar) {
      const x = lodratX(r, k.id)!
      expect(x).toBeGreaterThan(mitten.x + mitten.bredd)
      expect(x).toBeLessThan(vanster)
    }
  })

  it('en rak kabel får ingen brytpunkt alls', () => {
    const noder = [
      nod({ id: 'p', anslutning: 'INJ 1', riktning: 'ut' }),
      komponent('k', 'Injektor 1', '2'),
    ]
    const r = raknaRitning(bas({ noder, kablar: [kabel('c', 'p', 'k')] }))
    const l = r.ledningar[0]!
    const rak = Math.abs(l.punkter[0]!.y - l.punkter[l.punkter.length - 1]!.y) < 1
    if (rak) expect(l.punkter).toHaveLength(2)
  })

  it('samma nätlista ger samma banor två gånger', () => {
    const { noder, kablar } = fyra()
    const a = raknaRitning(bas({ noder, kablar }))
    const b = raknaRitning(bas({ noder, kablar }))
    expect(a.ledningar).toEqual(b.ledningar)
  })
})

describe('rutor går att dölja på ett blad [F2-27]', () => {
  const noder = [
    nod({ id: 'p1', anslutning: 'INJ 1', riktning: 'ut' }),
    nod({ id: 'p2', anslutning: 'INJ 2', riktning: 'ut' }),
    komponent('k1', 'Injektor 1', '2'),
    komponent('k2', 'Injektor 2', '2'),
  ]
  const kablar = [kabel('c1', 'p1', 'k1'), kabel('c2', 'p2', 'k2')]
  const dolt = new Set(['komponent:Injektor 1'])

  it('den dolda rutan ritas inte', () => {
    const r = raknaRitning(bas({ noder, kablar, dolda: dolt }))
    expect(r.rutor.map((x) => x.nyckel)).not.toContain('komponent:Injektor 1')
    expect(r.rutor.map((x) => x.nyckel)).toContain('komponent:Injektor 2')
  })

  it('kabeln till en dold ruta försvinner utan hänvisningspil', () => {
    const r = raknaRitning(bas({ noder, kablar, dolda: dolt }))
    expect(r.ledningar.map((l) => l.kabelId)).toEqual(['c2'])
    expect(r.hanvisningar).toHaveLength(0)
  })

  it('det dolda går att räkna upp så att det kan tas fram igen', () => {
    const r = raknaRitning(bas({ noder, kablar, dolda: dolt }))
    expect(r.dolda).toEqual([{ nyckel: 'komponent:Injektor 1', rubrik: 'Injektor 1' }])
  })

  it('en dold ruta som filtret ändå inte släpper igenom räknas inte upp', () => {
    const r = raknaRitning(
      bas({ noder, kablar, synliga: new Set(['p1', 'p2', 'k2']), dolda: dolt }),
    )
    expect(r.dolda).toHaveLength(0)
  })
})

describe('jord- och skarvsymboler får kabeln till mitten [F2-26]', () => {
  const jordnod = nod({
    id: 'j',
    sort: 'jord',
    bararen: 'Jord 101',
    anslutning: null,
    jordklass: 'sensor',
    enhetId: null,
  })

  it('anslutningen ligger mitt i den smala rutan, inte vid kanten', () => {
    const noder = [nod({ id: 'p', anslutning: 'SENSOR GND', riktning: 'jord' }), jordnod]
    const r = raknaRitning(bas({ noder, kablar: [kabel('c', 'p', 'j')] }))
    const jord = r.rutor.find((x) => x.sort === 'jord')!
    expect(jord.anslutningar[0]!.x).toBeCloseTo(jord.x + jord.bredd / 2, 5)
  })

  it('symbolrutan är smalare än en komponentruta', () => {
    const noder = [
      nod({ id: 'p', anslutning: 'SENSOR GND', riktning: 'jord' }),
      jordnod,
      komponent('k', 'Injektor 1', '2'),
    ]
    const r = raknaRitning(bas({ noder, kablar: [kabel('c', 'p', 'j')] }))
    const jord = r.rutor.find((x) => x.sort === 'jord')!
    const komp = r.rutor.find((x) => x.sort === 'komponent')!
    expect(jord.bredd).toBeLessThan(komp.bredd)
  })
})

describe('hittaKorsningar prövas på ledningarna direkt [F2-25]', () => {
  function ledning(id: string, punkter: { x: number; y: number }[]) {
    return { kabelId: id, punkter, farg: null, markning: null, area: null, skarmad: false }
  }
  const aldrigSamma = () => false

  /** Vågrät kabel på y=100, lodrät kabel på x=50 som skär rakt igenom den. */
  const vagrat = ledning('h', [
    { x: 0, y: 100 },
    { x: 100, y: 100 },
  ])
  const lodrat = ledning('v', [
    { x: 50, y: 0 },
    { x: 50, y: 200 },
  ])

  it('hittar korsningen och lägger hoppet på den vågräta kabeln', () => {
    const k = hittaKorsningar([vagrat, lodrat], aldrigSamma)
    expect(k).toEqual([{ kabelId: 'h', underKabelId: 'v', x: 50, y: 100 }])
  })

  it('två kablar som delar nod korsar inte, de möts', () => {
    expect(hittaKorsningar([vagrat, lodrat], () => true)).toHaveLength(0)
  })

  it('en beröring i ändpunkten är ingen korsning', () => {
    const slutarPa = ledning('v2', [
      { x: 100, y: 0 },
      { x: 100, y: 200 },
    ])
    expect(hittaKorsningar([vagrat, slutarPa], aldrigSamma)).toHaveLength(0)
  })

  it('kabeln korsar inte sig själv', () => {
    const sicksack = ledning('s', [
      { x: 0, y: 0 },
      { x: 50, y: 0 },
      { x: 50, y: 100 },
      { x: 0, y: 100 },
    ])
    expect(hittaKorsningar([sicksack], aldrigSamma)).toHaveLength(0)
  })

  it('en lodrät kabel som inte når fram ger ingen korsning', () => {
    const kort = ledning('v3', [
      { x: 50, y: 0 },
      { x: 50, y: 40 },
    ])
    expect(hittaKorsningar([vagrat, kort], aldrigSamma)).toHaveLength(0)
  })

  it('varje korsning räknas en gång per par', () => {
    const andra = ledning('v4', [
      { x: 70, y: 0 },
      { x: 70, y: 200 },
    ])
    const k = hittaKorsningar([vagrat, lodrat, andra], aldrigSamma)
    expect(k.map((x) => x.x).sort((a, b) => a - b)).toEqual([50, 70])
  })
})

describe('layouten undviker korsningar när den kan [F2-25]', () => {
  it('en solfjäder ut från styrenheten korsar inte sig själv', () => {
    // Rutorna placeras i höjd med sin port, och banorna delas ut uppifrån och
    // ned. Följden är att en vanlig solfjäder inte får en enda korsning — det
    // är meningen, och hoppbågen finns för de fall där rutor flyttats för hand.
    const noder: Nod[] = []
    const kablar: Kabel[] = []
    for (let i = 1; i <= 6; i++) {
      noder.push(nod({ id: `p${i}`, anslutning: `INJ ${i}`, riktning: 'ut' }))
      noder.push(komponent(`k${i}`, `Injektor ${i}`, '2'))
      kablar.push(kabel(`c${i}`, `p${i}`, `k${i}`))
    }
    for (let i = 7; i <= 14; i++) {
      noder.push(nod({ id: `p${i}`, anslutning: `GP ${i}`, riktning: 'ut' }))
    }
    const r = raknaRitning(bas({ noder, kablar }))
    expect(r.ledningar).toHaveLength(6)
    expect(r.korsningar).toHaveLength(0)
  })

  it('solfjädern åt vänster korsar inte heller', () => {
    // Banorna räknas från styrenheten och utåt, inte från vänster. Utan den
    // spegelvändningen hade ingångssidan fått samma arton korsningar som
    // utgångssidan hade innan ordningen rättades.
    const noder: Nod[] = []
    const kablar: Kabel[] = []
    for (let i = 1; i <= 6; i++) {
      noder.push(nod({ id: `p${i}`, anslutning: `AIN ${i}`, riktning: 'in' }))
      noder.push(komponent(`g${i}`, `Givare ${i}`, 'sig'))
      kablar.push(kabel(`c${i}`, `p${i}`, `g${i}`))
    }
    for (let i = 7; i <= 14; i++) {
      noder.push(nod({ id: `p${i}`, anslutning: `GP ${i}`, riktning: 'ut' }))
    }
    const r = raknaRitning(bas({ noder, kablar }))
    expect(r.ledningar).toHaveLength(6)
    expect(r.korsningar).toHaveLength(0)
  })
})
