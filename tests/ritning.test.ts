import { describe, expect, it } from 'vitest'
import { raknaRitning, type Indata, type Kabel, type Nod } from '@/lib/schema/layout'

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
    signaltyp: null,
    enhetId: 'e1',
    jordklass: null,
    riktning: null,
    ...over,
  }
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
    ...over,
  }
}

describe('ECU-centrerad layout [F2-01]', () => {
  const noder = [
    nod({ id: 'p_in', anslutning: 'AIN 1', riktning: 'in' }),
    nod({ id: 'p_ut', anslutning: 'INJ 1', riktning: 'ut' }),
    nod({
      id: 'k_in',
      sort: 'komponent',
      bararen: 'CLT-givare',
      anslutning: 'signal',
      enhetId: null,
    }),
    nod({
      id: 'k_ut',
      sort: 'komponent',
      bararen: 'Injektor 1',
      anslutning: '2',
      enhetId: null,
    }),
  ]
  const kablar = [kabel('c1', 'k_in', 'p_in'), kabel('c2', 'p_ut', 'k_ut')]

  it('ingången hamnar till vänster och utgången till höger', () => {
    const r = raknaRitning(bas({ noder, kablar }))
    const rader = Object.fromEntries(r.portrader.map((p) => [p.nodId, p.sida]))
    expect(rader).toEqual({ p_in: 'vanster', p_ut: 'hoger' })
  })

  it('komponenten till vänster ritas till vänster om enheten', () => {
    const r = raknaRitning(bas({ noder, kablar }))
    const vanster = r.rutor.find((x) => x.nodId === 'k_in')!
    const hoger = r.rutor.find((x) => x.nodId === 'k_ut')!
    expect(r.mitten).not.toBeNull()
    expect(vanster.x).toBeLessThan(r.mitten!.x)
    expect(hoger.x).toBeGreaterThan(r.mitten!.x + r.mitten!.bredd)
  })

  it('enheten i mitten är den med flest portar', () => {
    const flera = [
      ...noder,
      nod({
        id: 'q1',
        bararen: 'PDM',
        enhetId: 'e2',
        anslutning: 'OUT 1',
        riktning: 'ut',
      }),
    ]
    const r = raknaRitning(bas({ noder: flera, kablar }))
    expect(r.mitten?.rubrik).toBe('ECU')
  })

  it('samma indata ger samma ritning', () => {
    const a = raknaRitning(bas({ noder, kablar }))
    const b = raknaRitning(bas({ noder, kablar }))
    expect(JSON.stringify(a)).toBe(JSON.stringify(b))
  })
})

describe('okopplade portar döljs men räknas [F2-01]', () => {
  it('en MaxxECU med 80 portar och två kablar ritar två rader', () => {
    const manga = Array.from({ length: 80 }, (_, i) =>
      nod({ id: `p${i}`, anslutning: `PORT ${i}`, riktning: i % 2 ? 'in' : 'ut' }),
    )
    const komponent = nod({
      id: 'k',
      sort: 'komponent',
      bararen: 'Injektor 1',
      anslutning: '2',
      enhetId: null,
    })
    const r = raknaRitning(
      bas({ noder: [...manga, komponent], kablar: [kabel('c', 'p0', 'k')] }),
    )
    expect(r.portrader).toHaveLength(1)
    expect(r.okopplade).toBe(79)
  })
})

describe('kablar som lämnar bladet får en hänvisning [F2-07]', () => {
  const noder = [
    nod({ id: 'p', anslutning: 'INJ 1', riktning: 'ut' }),
    nod({
      id: 'bortom',
      sort: 'komponent',
      bararen: 'Injektor 1',
      anslutning: '2',
      enhetId: null,
    }),
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
    expect(r.hanvisningar[0]).toMatchObject({
      kabelId: 'c',
      blad: 'Motorrum',
      text: 'Injektor 1 · 2',
      riktning: 'hoger',
    })
    // Ingen ruta ritas för något som inte syns på bladet.
    expect(r.rutor.map((x) => x.nodId)).not.toContain('bortom')
  })

  it('utan känt målblad blir hänvisningen ändå ritad', () => {
    const r = raknaRitning(bas({ noder, kablar, synliga: new Set(['p']) }))
    expect(r.hanvisningar[0]?.blad).toBeNull()
    // Kabeln finns kvar som streck. Att tyst utelämna den vore en halvsanning.
    expect(r.ledningar).toHaveLength(1)
  })
})

describe('jord och skarv ritas som symboler, inte som streck [F2-04]', () => {
  it('en jordpunkt blir en ruta av sorten jord med sin klass', () => {
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
    const ruta = r.rutor.find((x) => x.nodId === 'j')!
    expect(ruta.sort).toBe('jord')
    expect(ruta.jordklass).toBe('sensor')
    // Jorden hör till vänstersidan tillsammans med ingångarna.
    expect(r.portrader[0]?.sida).toBe('vanster')
  })
})

describe('kablar som inte rör mittenheten ritas ändå [F2-01]', () => {
  it('komponent till jord hamnar i bandet under', () => {
    const noder = [
      nod({ id: 'p', anslutning: 'INJ 1', riktning: 'ut' }),
      nod({
        id: 'k',
        sort: 'komponent',
        bararen: 'Injektor 1',
        anslutning: '2',
        enhetId: null,
      }),
      nod({
        id: 'k2',
        sort: 'komponent',
        bararen: 'Bränslepump',
        anslutning: 'gnd',
        enhetId: null,
      }),
      nod({
        id: 'j',
        sort: 'jord',
        bararen: 'Chassijord',
        enhetId: null,
        jordklass: 'chassi',
      }),
    ]
    const r = raknaRitning(
      bas({ noder, kablar: [kabel('c1', 'p', 'k'), kabel('c2', 'k2', 'j')] }),
    )
    expect(r.ledningar.map((l) => l.kabelId).sort()).toEqual(['c1', 'c2'])
    const band = r.rutor.filter((x) => ['k2', 'j'].includes(x.nodId))
    expect(band).toHaveLength(2)
    // Bandet ligger under mittenheten.
    expect(Math.min(...band.map((b) => b.y))).toBeGreaterThan(
      r.mitten!.y + r.mitten!.hojd,
    )
  })
})

describe('handflyttade lägen används [F2-03]', () => {
  it('förskjutningen läggs på den automatiska placeringen', () => {
    const noder = [
      nod({ id: 'p', anslutning: 'INJ 1', riktning: 'ut' }),
      nod({
        id: 'k',
        sort: 'komponent',
        bararen: 'Injektor 1',
        anslutning: '2',
        enhetId: null,
      }),
    ]
    const kablar = [kabel('c', 'p', 'k')]
    const utan = raknaRitning(bas({ noder, kablar }))
    const med = raknaRitning(
      bas({ noder, kablar, placeringar: new Map([['k', { x: 40, y: -12 }]]) }),
    )
    const a = utan.rutor.find((x) => x.nodId === 'k')!
    const b = med.rutor.find((x) => x.nodId === 'k')!
    expect(b.x - a.x).toBe(40)
    expect(b.y - a.y).toBe(-12)
  })
})

describe('kabelns färg och märkning följer med till ritningen [F2-05]', () => {
  it('ledningen bär färg, märkning, area och skärm', () => {
    const noder = [
      nod({ id: 'p', anslutning: 'INJ 1', riktning: 'ut' }),
      nod({
        id: 'k',
        sort: 'komponent',
        bararen: 'Injektor 1',
        anslutning: '2',
        enhetId: null,
      }),
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
  it('bara belysning ger ingen mitt men fortfarande rutor och streck', () => {
    const noder = [
      nod({
        id: 'a',
        sort: 'komponent',
        bararen: 'Bromsljus',
        anslutning: '+12V',
        enhetId: null,
      }),
      nod({
        id: 'b',
        sort: 'jord',
        bararen: 'Chassijord bak',
        enhetId: null,
        jordklass: 'chassi',
      }),
    ]
    const r = raknaRitning(bas({ noder, kablar: [kabel('c', 'a', 'b')] }))
    expect(r.mitten).toBeNull()
    expect(r.rutor).toHaveLength(2)
    expect(r.ledningar).toHaveLength(1)
  })
})

describe('en kabel med bara ena änden på bladet försvinner inte [F2-07]', () => {
  /**
   * Hittades genom att titta på ett riktigt blad: zonfiltret "Motor" släppte
   * igenom injektorn men inte styrenheten, och kabeln mellan dem ritades
   * varken som streck eller som hänvisning. Den fanns i nätlistan och saknades
   * på ritningen — precis det en vy aldrig får göra.
   */
  it('ritas som streck ut ur bladet med hänvisning', () => {
    const noder = [
      nod({
        id: 'inj',
        sort: 'komponent',
        bararen: 'Injektor 1',
        anslutning: '2',
        enhetId: null,
      }),
      nod({ id: 'ecu', anslutning: 'INJ 1', riktning: 'ut' }),
    ]
    const r = raknaRitning(
      bas({
        noder,
        kablar: [kabel('c', 'inj', 'ecu', { markning: 'INJ1' })],
        synliga: new Set(['inj']),
        annatBlad: new Map([['ecu', 'Kupé']]),
      }),
    )
    expect(r.ledningar).toHaveLength(1)
    expect(r.rutor.map((x) => x.nodId)).toEqual(['inj'])
    expect(r.hanvisningar).toHaveLength(1)
    expect(r.hanvisningar[0]).toMatchObject({ blad: 'Kupé', text: 'ECU · INJ 1' })
  })

  it('en kabel med båda ändarna utanför bladet ritas inte alls', () => {
    const noder = [
      nod({ id: 'a', sort: 'komponent', bararen: 'A', enhetId: null }),
      nod({ id: 'b', sort: 'komponent', bararen: 'B', enhetId: null }),
      nod({ id: 'c', sort: 'komponent', bararen: 'C', enhetId: null }),
    ]
    const r = raknaRitning(
      bas({ noder, kablar: [kabel('k', 'a', 'b')], synliga: new Set(['c']) }),
    )
    expect(r.ledningar).toHaveLength(0)
    expect(r.hanvisningar).toHaveLength(0)
  })
})
