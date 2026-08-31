import { afterAll, describe, expect, it } from 'vitest'
import type pg from 'pg'
import { FRO, databas } from './hjalp'

const db: pg.Pool = databas()
afterAll(async () => {
  await db.end()
})

/** Kör i en transaktion som alltid rullas tillbaka. Proven får inte lämna spår. */
async function iRullbakTransaktion(sql: string, params: unknown[] = []): Promise<void> {
  const klient = await db.connect()
  try {
    await klient.query('begin')
    await klient.query(sql, params)
    throw new Error('förväntade ett fel, men skrivningen gick igenom')
  } finally {
    await klient.query('rollback').catch(() => {})
    klient.release()
  }
}

describe('noden är exakt en sak [F0-08]', () => {
  it('en nod utan innehåll avvisas', async () => {
    await expect(
      iRullbakTransaktion(`insert into nod (projekt_id) values ($1)`, [FRO.projektEvo]),
    ).rejects.toThrow(/noden_ar_exakt_en_sak/)
  })

  it('en nod som är både port och skarvpunkt avvisas', async () => {
    await expect(
      iRullbakTransaktion(
        `insert into nod (projekt_id, port_id, skarvpunkt_id)
         values ($1, $2, 'c1000000-0000-4000-8000-000000000071')`,
        [FRO.projektEvo, FRO.portInj1],
      ),
    ).rejects.toThrow(/noden_ar_exakt_en_sak|unique|dubblett/i)
  })
})

describe('jordklassen bär sin ägande enhet [B-010]', () => {
  it('chassijord med ägande enhet avvisas', async () => {
    await expect(
      iRullbakTransaktion(
        `insert into jordpunkt (projekt_id, klass, enhet_id, beteckning)
         values ($1, 'chassi', $2, 'Fel chassijord')`,
        [FRO.projektEvo, FRO.enhetEcu],
      ),
    ).rejects.toThrow(/chassijord_saknar_agare/)
  })

  it('sensorjord utan ägande enhet avvisas', async () => {
    await expect(
      iRullbakTransaktion(
        `insert into jordpunkt (projekt_id, klass, enhet_id, beteckning)
         values ($1, 'sensor', null, 'Herrelös sensorjord')`,
        [FRO.projektEvo],
      ),
    ).rejects.toThrow(/chassijord_saknar_agare/)
  })

  it('ECU:ns och PDM:ns sensorjord är två skilda punkter', async () => {
    const { rows } = await db.query<{ antal: string }>(
      `select count(*) as antal from jordpunkt
        where projekt_id = $1 and klass = 'sensor'`,
      [FRO.projektEvo],
    )
    expect(Number(rows[0]?.antal)).toBe(2)
  })
})

describe('kabeln stannar i sitt projekt [F0-11]', () => {
  it('en kabel mellan två projekt avvisas', async () => {
    await expect(
      iRullbakTransaktion(
        `insert into kabel (projekt_id, nod_a, nod_b, area_mm2, typ)
         values ($1, $2, $3, 1.00, 'thin_wall')`,
        [FRO.projektEvo, FRO.nodPortInj1, FRO.nodVolvoPort],
      ),
    ).rejects.toThrow(/utanför sitt projekt/)
  })

  it('en kabel till sig själv avvisas', async () => {
    await expect(
      iRullbakTransaktion(
        `insert into kabel (projekt_id, nod_a, nod_b) values ($1, $2, $2)`,
        [FRO.projektEvo, FRO.nodPortInj1],
      ),
    ).rejects.toThrow(/kabeln_gar_inte_till_sig_sjalv/)
  })

  it('samma nodpar två gånger avvisas, oavsett ordning', async () => {
    await expect(
      iRullbakTransaktion(
        `insert into kabel (projekt_id, nod_a, nod_b)
         values ($1, $2, $3)`,
        [FRO.projektEvo, FRO.nodSkarv, 'c1000000-0000-4000-8000-000000000085'],
      ),
    ).rejects.toThrow(/kabel_par_unikt_idx/)
  })
})

describe('vald roll hör till portens egen mall [F0-11]', () => {
  it('en roll från en annan portmall avvisas', async () => {
    await expect(
      iRullbakTransaktion(`update port set vald_roll_id = $2 where id = $1`, [
        FRO.portInj1,
        FRO.rollAnalogIn,
      ]),
    ).rejects.toThrow(/hör inte till portmall/)
  })

  it('en port kan bära flera roller men bara en standard [C5]', async () => {
    const { rows } = await db.query<{ antal: string }>(
      `select count(*) as antal from portroll where portmall_id = $1`,
      [FRO.portmallDelad],
    )
    expect(Number(rows[0]?.antal)).toBe(2)

    await expect(
      iRullbakTransaktion(
        `update portroll set ar_standard = true where portmall_id = $1`,
        [FRO.portmallDelad],
      ),
    ).rejects.toThrow(/portroll_en_standard_idx/)
  })
})

describe('en PDM-kanal sitter på flera stift [B-011]', () => {
  it('OUT 1 i frödata har tre stift', async () => {
    const { rows } = await db.query<{ antal: string }>(
      `select count(*) as antal from portstift where portmall_id = $1`,
      ['b1000000-0000-4000-8000-000000000035'],
    )
    expect(Number(rows[0]?.antal)).toBe(3)
  })

  it('ett stift kan inte bära två portar', async () => {
    await expect(
      iRullbakTransaktion(
        `insert into portstift (portmall_id, stiftmall_id)
         values ($1, 'b1000000-0000-4000-8000-000000000025')`,
        [FRO.portmallInj1],
      ),
    ).rejects.toThrow(/portstift_stift_unikt_idx/)
  })
})
