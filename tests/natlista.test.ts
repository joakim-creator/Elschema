import { afterAll, beforeAll, describe, expect, it } from 'vitest'
import type pg from 'pg'
import type { SupabaseClient } from '@supabase/supabase-js'
import { ANNAN, FRO, JOAKIM, databas, somAnvandare } from './hjalp'

const db: pg.Pool = databas()
let joakim: SupabaseClient
let annan: SupabaseClient

beforeAll(async () => {
  joakim = await somAnvandare(JOAKIM)
  annan = await somAnvandare(ANNAN)
}, 30_000)

afterAll(async () => {
  await db.end()
})

describe('MaxxECU Race är inmatad ur källan [F1-03]', () => {
  it('två kontaktdon med 48 och 32 poler', async () => {
    const { rows } = await db.query<{ beteckning: string; poler: number }>(
      `select d.beteckning, d.poler
         from kontaktdonsmall d join enhetsmall e on e.id = d.enhetsmall_id
        where e.fabrikat = 'MaxxECU' and e.modell = 'Race'
        order by d.beteckning`,
    )
    expect(rows).toEqual([
      { beteckning: 'Connector 1', poler: 48 },
      { beteckning: 'Connector 2', poler: 32 },
    ])
  })

  it('80 stift och 80 portar', async () => {
    const { rows } = await db.query<{ stift: string; portar: string }>(
      `select
         (select count(*) from stiftmall s
            join kontaktdonsmall d on d.id = s.kontaktdonsmall_id
            join enhetsmall e on e.id = d.enhetsmall_id
           where e.fabrikat = 'MaxxECU' and e.modell = 'Race') as stift,
         (select count(*) from portmall p
            join enhetsmall e on e.id = p.enhetsmall_id
           where e.fabrikat = 'MaxxECU' and e.modell = 'Race') as portar`,
    )
    expect(Number(rows[0]?.stift)).toBe(80)
    expect(Number(rows[0]?.portar)).toBe(80)
  })

  /**
   * Stickproven är hämtade ur kopplingsbilden, inte ur importen. Går de isär
   * är det importen som har fel — det är hela poängen med att pröva mot
   * källan och inte mot sig själv.
   */
  it.each([
    ['A2', 'IGN 1', 'tandutgang'],
    ['E3', 'GND SHIELD', 'skarmjord'],
    ['G1', '+5V SENSOR SUPPLY', 'matning_5v'],
    ['H1', 'SENSOR GND', 'sensorjord'],
    ['H2', 'TRIGGER GND', 'vr_jord'],
    ['L4', 'ENGINE GND', 'chassijord'],
    ['M4', '+12V ECU POWER SUPPLY', 'matning_12v'],
    ['E1', 'CAN H', 'can_h'],
    ['K1', 'INJ 1', 'injektorutgang'],
  ])('Connector 1 stift %s är %s med standardroll %s', async (position, port, roll) => {
    const { rows } = await db.query<{ port: string; nyckel: string }>(
      `select p.beteckning as port, t.nyckel
         from stiftmall s
         join kontaktdonsmall d on d.id = s.kontaktdonsmall_id
         join enhetsmall e on e.id = d.enhetsmall_id
         join portstift ps on ps.stiftmall_id = s.id
         join portmall p on p.id = ps.portmall_id
         join portroll r on r.portmall_id = p.id and r.ar_standard
         join signaltyp t on t.id = r.signaltyp_id
        where e.fabrikat = 'MaxxECU' and e.modell = 'Race'
          and d.beteckning = 'Connector 1' and s.position = $1`,
      [position],
    )
    expect(rows[0]).toEqual({ port, nyckel: roll })
  })

  it('sex portar bär två roller — det är hur enheten är byggd [C5]', async () => {
    const { rows } = await db.query<{ beteckning: string }>(
      `select p.beteckning
         from portmall p
         join enhetsmall e on e.id = p.enhetsmall_id
         join portroll r on r.portmall_id = p.id
        where e.fabrikat = 'MaxxECU' and e.modell = 'Race'
        group by p.beteckning having count(*) > 1
        order by p.beteckning`,
    )
    expect(rows.map((r) => r.beteckning)).toEqual([
      'DIN/VR 1',
      'DIN/VR 2',
      'DIN/VR 4',
      'DIN/VR5',
      'HOME',
      'TRIGGER',
    ])
  })

  it('stiftstorlek är null — den står inte i underlaget och gissas inte', async () => {
    const { rows } = await db.query<{ antal: string }>(
      `select count(*) as antal
         from stiftmall s
         join kontaktdonsmall d on d.id = s.kontaktdonsmall_id
         join enhetsmall e on e.id = d.enhetsmall_id
        where e.fabrikat = 'MaxxECU' and e.modell = 'Race'
          and (s.storlek is not null or s.max_strom_a is not null)`,
    )
    expect(Number(rows[0]?.antal)).toBe(0)
  })

  it('MaxxECU:s egna signaltyper är systemets men inte kärna [B-006]', async () => {
    const { rows } = await db.query<{
      nyckel: string
      ar_karna: boolean
      agare: string | null
    }>(
      `select nyckel, ar_karna, agare from signaltyp
        where nyckel in ('wbo2', 'egt', 'knack', 'knack_gnd') order by nyckel`,
    )
    expect(rows).toHaveLength(4)
    expect(rows.every((r) => !r.ar_karna && r.agare === null)).toBe(true)
  })
})

describe('bärförmåga och areaförslag [F1-18, F1-19]', () => {
  it('tio rader, växande ström med växande area', async () => {
    const { rows } = await db.query<{
      area_mm2: string
      thin_wall_a: string
      vanlig_a: string
    }>(`select area_mm2, thin_wall_a, vanlig_a from barformaga order by area_mm2`)
    expect(rows).toHaveLength(10)
    const thin = rows.map((r) => Number(r.thin_wall_a))
    const vanlig = rows.map((r) => Number(r.vanlig_a))
    // Växer den inte monotont är tabellen felläst ur PDF:ens tvåspaltiga layout.
    expect(thin).toEqual([...thin].sort((a, b) => a - b))
    expect(vanlig).toEqual([...vanlig].sort((a, b) => a - b))
    expect(thin.every((t, i) => t >= (vanlig[i] ?? 0))).toBe(true)
  })

  it.each([
    [1.2, 'thin_wall', '0.50'],
    [12, 'thin_wall', '0.75'],
    [12, 'vanlig', '1.50'],
    [16, 'vanlig', '2.50'],
    [80, 'vanlig', '16.00'],
  ])('%s A som %s föreslår %s mm²', async (strom, sort, forvantat) => {
    const { rows } = await db.query<{ area: string }>(
      `select foreslagen_area($1, $2::kabeltyp) as area`,
      [strom, sort],
    )
    expect(rows[0]?.area).toBe(forvantat)
  })

  it('ingen area räcker till 95 A', async () => {
    const { rows } = await db.query(`select foreslagen_area(95, 'thin_wall') as area`)
    expect(rows[0]?.area).toBeNull()
  })
})

describe('vyerna visar nätlistan och läcker inte [F1-16]', () => {
  it('kopplingslistan namnger båda ändarna', async () => {
    const { data } = await joakim
      .from('kabel_vy')
      .select('*')
      .eq('projekt_id', FRO.projektEvo)
      .eq('markning', 'INJ1')
    expect(data).toHaveLength(1)
    expect(data?.[0]).toMatchObject({
      fran_bararen: 'Injektor 1',
      fran_anslutning: '2',
      till_bararen: 'ECU',
      till_anslutning: 'INJ 1',
      till_signaltyp: 'Injektorutgång',
    })
  })

  it('nod_vy ger varje sorts punkt en bärare', async () => {
    const { data } = await joakim
      .from('nod_vy')
      .select('sort, bararen')
      .eq('projekt_id', FRO.projektEvo)
    const sorter = new Set((data ?? []).map((r) => r.sort))
    expect([...sorter].sort()).toEqual(['jord', 'komponent', 'port', 'skarv'])
    expect((data ?? []).every((r) => r.bararen)).toBe(true)
  })

  it('den andre ser inga rader i vyerna — security_invoker gäller', async () => {
    const { data: kablar } = await annan
      .from('kabel_vy')
      .select('id')
      .eq('projekt_id', FRO.projektEvo)
    const { data: noder } = await annan
      .from('nod_vy')
      .select('id')
      .eq('projekt_id', FRO.projektEvo)
    expect(kablar).toEqual([])
    expect(noder).toEqual([])
    // Och sitt eget ser hen. Utan det prövar provet ovan bara att vyn är tom.
    const { data: eget } = await annan
      .from('kabel_vy')
      .select('id')
      .eq('projekt_id', FRO.projektVolvo)
    expect(eget?.length ?? 0).toBeGreaterThan(0)
  })

  it('vaktprov: vyerna är security_invoker', async () => {
    const { rows } = await db.query<{ viewname: string; opt: string[] | null }>(
      `select c.relname as viewname, c.reloptions as opt
         from pg_class c join pg_namespace n on n.oid = c.relnamespace
        where n.nspname = 'public' and c.relkind = 'v'`,
    )
    expect(rows.length).toBeGreaterThan(0)
    const utan = rows.filter((r) => !(r.opt ?? []).includes('security_invoker=true'))
    expect(
      utan.map((r) => r.viewname),
      'en vy utan security_invoker läser förbi RLS',
    ).toEqual([])
  })
})

describe('en ändrad port slår igenom i kopplingslistan [F1-17]', () => {
  it('byte av vald roll ändrar signaltypen på kabeln', async () => {
    const { data: fore } = await joakim
      .from('kabel_vy')
      .select('till_signaltyp')
      .eq('projekt_id', FRO.projektEvo)
      .eq('markning', 'TRIG')
      .single()
    expect(fore?.till_signaltyp).toBe('VR- eller frekvensingång')

    const { rows } = await db.query<{ port: string; roll: string }>(
      `select p.id as port, r.id as roll
         from port p
         join enhet e on e.id = p.enhet_id
         join portmall pm on pm.id = p.portmall_id
         join portroll r on r.portmall_id = pm.id
         join signaltyp t on t.id = r.signaltyp_id
        where e.projekt_id = $1 and e.beteckning = 'MaxxECU Race'
          and pm.beteckning = 'TRIGGER' and t.nyckel = 'digital_in'`,
      [FRO.projektEvo],
    )
    const rad = rows[0]
    expect(rad).toBeDefined()

    await joakim.from('port').update({ vald_roll_id: rad!.roll }).eq('id', rad!.port)

    const { data: efter } = await joakim
      .from('kabel_vy')
      .select('till_signaltyp')
      .eq('projekt_id', FRO.projektEvo)
      .eq('markning', 'TRIG')
      .single()
    expect(efter?.till_signaltyp).toBe('Digital ingång')

    // Städa: provet får inte lämna projektet i ett annat läge än det började i.
    const { rows: standard } = await db.query<{ roll: string }>(
      `select r.id as roll from portroll r
         join signaltyp t on t.id = r.signaltyp_id
        where r.portmall_id = (select portmall_id from port where id = $1)
          and t.nyckel = 'vr_in'`,
      [rad!.port],
    )
    await joakim
      .from('port')
      .update({ vald_roll_id: standard[0]!.roll })
      .eq('id', rad!.port)
  })
})
