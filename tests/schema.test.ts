import { afterAll, describe, expect, it } from 'vitest'
import type pg from 'pg'
import { databas, KOORDINATORD, NATLISTETABELLER } from './hjalp'

const db: pg.Pool = databas()
afterAll(async () => {
  await db.end()
})

describe('vaktprov: nätlistan bär ingen placering [F0-15]', () => {
  it('ingen nätlistetabell har en koordinatkolumn', async () => {
    const { rows } = await db.query<{ table_name: string; column_name: string }>(
      `select table_name, column_name
         from information_schema.columns
        where table_schema = 'public'
          and table_name = any($1::text[])`,
      [[...NATLISTETABELLER]],
    )

    const misstankta = rows.filter((r) => {
      const k = r.column_name.toLowerCase()
      return KOORDINATORD.some(
        (ord) => k === ord || k.endsWith(`_${ord}`) || k.startsWith(`${ord}_`),
      )
    })

    expect(
      misstankta.map((r) => `${r.table_name}.${r.column_name}`),
      'B-001: nätlistan är sanningen, ritningen är en vy. Placering hör till bladet.',
    ).toEqual([])
  })

  it('nätlistetabellerna finns över huvud taget', async () => {
    const { rows } = await db.query<{ table_name: string }>(
      `select table_name from information_schema.tables
        where table_schema = 'public' and table_name = any($1::text[])`,
      [[...NATLISTETABELLER]],
    )
    // Utan den här kontrollen passerar provet ovan på en tom databas.
    expect(rows.map((r) => r.table_name).sort()).toEqual([...NATLISTETABELLER].sort())
  })
})

describe('vaktprov: åtkomstkontroll är påslagen [F0-12]', () => {
  it('varje tabell i public har row level security', async () => {
    const { rows } = await db.query<{ tablename: string; rowsecurity: boolean }>(
      `select tablename, rowsecurity from pg_tables where schemaname = 'public'`,
    )
    expect(rows.length).toBeGreaterThan(15)
    const utan = rows.filter((r) => !r.rowsecurity).map((r) => r.tablename)
    expect(utan, 'en tabell utan RLS är läsbar för alla inloggade').toEqual([])
  })

  it('varje tabell utom inbjudningskod har minst en policy', async () => {
    const { rows } = await db.query<{ tablename: string; antal: string }>(
      `select t.tablename, count(p.policyname) as antal
         from pg_tables t
         left join pg_policies p
           on p.schemaname = t.schemaname and p.tablename = t.tablename
        where t.schemaname = 'public'
        group by t.tablename`,
    )
    // inbjudningskod är avsiktligt utan policy: bara service_role kommer åt den.
    const utan = rows.filter((r) => Number(r.antal) === 0).map((r) => r.tablename)
    expect(utan).toEqual(['inbjudningskod'])
  })
})

describe('vaktprov: kärnsignaltyperna finns [B-006]', () => {
  it('alla fyra jordklasser finns som kärntyp', async () => {
    const { rows } = await db.query<{ nyckel: string }>(
      `select nyckel from signaltyp where ar_karna and kategori = 'jord' order by nyckel`,
    )
    expect(rows.map((r) => r.nyckel)).toEqual([
      'chassijord',
      'sensorjord',
      'skarmjord',
      'vr_jord',
    ])
  })

  it('tänd- och injektorutgång är egna typer, inte generiska drivare', async () => {
    const { rows } = await db.query<{ nyckel: string }>(
      `select nyckel from signaltyp where ar_karna and nyckel in ('tandutgang', 'injektorutgang')`,
    )
    expect(rows).toHaveLength(2)
  })

  it('en kärntyp får inte ha ägare', async () => {
    await expect(
      db.query(
        `insert into signaltyp (nyckel, namn, kategori, ar_karna, agare)
         values ('fel_typ', 'Fel', 'ingang', true, 'a1000000-0000-4000-8000-000000000001')`,
      ),
    ).rejects.toThrow(/karna_saknar_agare/)
  })
})

describe('vaktprov: varje migration står i registret [lardomar 2026-08-31]', () => {
  it('inga migrationsfiler saknas i databasandringar.md', async () => {
    const { readdirSync, readFileSync } = await import('node:fs')
    const filer = readdirSync('supabase/migrations')
      .filter((f) => f.endsWith('.sql'))
      .map((f) => f.replace(/\.sql$/, ''))
    const register = readFileSync('docs/databasandringar.md', 'utf8')

    expect(filer.length).toBeGreaterThan(0)
    const saknas = filer.filter((f) => !register.includes(f))
    expect(
      saknas,
      'en migration utan rad i registret har ingen dokumenterad återställning',
    ).toEqual([])
  })

  it('varje registerrad pekar på en återställning som finns', async () => {
    const { readFileSync } = await import('node:fs')
    const register = readFileSync('docs/databasandringar.md', 'utf8')
    const hanvisade = [...register.matchAll(/\|\s*(R-\d{3})\s*\|/g)].map((m) => m[1]!)
    const skrivna = new Set(
      [...register.matchAll(/^\*\*(R-\d{3})\*\*/gm)].map((m) => m[1]!),
    )

    expect(hanvisade.length).toBeGreaterThan(0)
    const utan = [...new Set(hanvisade)].filter((r) => !skrivna.has(r))
    expect(utan, 'registret hänvisar till en återställning som inte är skriven').toEqual(
      [],
    )
  })
})
