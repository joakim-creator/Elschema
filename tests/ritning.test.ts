import { describe, expect, it } from 'vitest'
import {
  raknaRitning,
  rutnyckel,
  type Indata,
  type Kabel,
  type Nod,
  type Ruta,
} from '@/lib/schema/layout'

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
