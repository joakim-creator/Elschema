import { beforeAll, describe, expect, it } from 'vitest'
import type { SupabaseClient } from '@supabase/supabase-js'
import { ANNAN, FRO, JOAKIM, anonym, somAnvandare } from './hjalp'

let joakim: SupabaseClient
let annan: SupabaseClient

beforeAll(async () => {
  joakim = await somAnvandare(JOAKIM)
  annan = await somAnvandare(ANNAN)
}, 30_000)

describe('projekt syns bara för sin ägare [F0-12]', () => {
  it('Joakim ser sitt eget projekt', async () => {
    const { data, error } = await joakim.from('projekt').select('id, namn')
    expect(error).toBeNull()
    expect(data?.map((r) => r.id)).toEqual([FRO.projektEvo])
  })

  it('Joakim ser inte den andres projekt', async () => {
    const { data } = await joakim.from('projekt').select('id').eq('id', FRO.projektVolvo)
    expect(data).toEqual([])
  })

  it('den andre ser sitt, inte Joakims', async () => {
    const { data } = await annan.from('projekt').select('id')
    expect(data?.map((r) => r.id)).toEqual([FRO.projektVolvo])
  })

  it('utan inloggning syns inga projekt alls', async () => {
    const { data } = await anonym().from('projekt').select('id')
    expect(data).toEqual([])
  })
})

describe('projektets innehåll ärver ägarens sikt [F0-12]', () => {
  const tabeller = [
    'zon',
    'enhet',
    'komponent',
    'jordpunkt',
    'skarvpunkt',
    'nod',
    'kabel',
    'blad',
  ]

  it.each(tabeller)('%s: Joakim ser bara rader i sitt projekt', async (tabell) => {
    const { data, error } = await joakim.from(tabell).select('id, projekt_id')
    expect(error).toBeNull()
    // Frödata har rader i båda projekten. Ser vi noll rader prövar provet ingenting.
    expect(data?.length ?? 0).toBeGreaterThan(0)
    expect(data?.every((r) => r.projekt_id === FRO.projektEvo)).toBe(true)
  })

  it('port: syns via sin enhet, inte via projekt_id', async () => {
    const { data } = await joakim.from('port').select('id, enhet_id')
    expect(data?.length ?? 0).toBeGreaterThan(0)
    expect(data?.every((r) => r.enhet_id !== FRO.projektVolvo)).toBe(true)
    const { data: annansPort } = await joakim
      .from('port')
      .select('id')
      .eq('id', FRO.nodVolvoPort)
    expect(annansPort).toEqual([])
  })

  it('komponentanslutning: den andres syns inte', async () => {
    const { data } = await joakim.from('komponentanslutning').select('id')
    expect(data?.length ?? 0).toBeGreaterThan(0)
    expect(data?.map((r) => r.id)).not.toContain('c1000000-0000-4000-8000-000000000055')
  })
})

describe('biblioteket: systemets syns för alla, egna bara för sin ägare [F0-12]', () => {
  it('båda ser systemets komponentmallar', async () => {
    const { data: a } = await joakim.from('komponentmall').select('id').is('agare', null)
    const { data: b } = await annan.from('komponentmall').select('id').is('agare', null)
    expect(a?.length ?? 0).toBeGreaterThan(0)
    expect(a?.length).toBe(b?.length)
  })

  it('Joakims egna mall syns för honom', async () => {
    const { data } = await joakim
      .from('komponentmall')
      .select('id')
      .eq('id', FRO.egenKomponentmall)
    expect(data?.map((r) => r.id)).toEqual([FRO.egenKomponentmall])
  })

  it('Joakims egna mall syns inte för den andre', async () => {
    const { data } = await annan
      .from('komponentmall')
      .select('id')
      .eq('id', FRO.egenKomponentmall)
    expect(data).toEqual([])
  })

  it('ingen får skriva i systembiblioteket', async () => {
    const { error } = await joakim
      .from('komponentmall')
      .insert({ agare: null, namn: 'Smyger in', kategori: 'fusk' })
    expect(error, 'agare = null ska avvisas av policyn').not.toBeNull()
  })

  it('systemets signaltyper går inte att ändra', async () => {
    const { data } = await joakim
      .from('signaltyp')
      .update({ namn: 'Ändrad' })
      .eq('nyckel', 'sensorjord')
      .select()
    expect(data).toEqual([])
  })
})

describe('skrivning stannar hos ägaren [F0-12]', () => {
  it('Joakim kan inte lägga en zon i den andres projekt', async () => {
    const { error } = await joakim
      .from('zon')
      .insert({ projekt_id: FRO.projektVolvo, namn: 'Smygzon' })
    expect(error).not.toBeNull()
  })

  it('Joakim kan inte radera den andres projekt', async () => {
    const { data } = await joakim
      .from('projekt')
      .delete()
      .eq('id', FRO.projektVolvo)
      .select()
    expect(data).toEqual([])
  })

  it('Joakim kan lägga till en zon i sitt eget', async () => {
    const namn = `Provzon ${Date.now()}`
    const { data, error } = await joakim
      .from('zon')
      .insert({ projekt_id: FRO.projektEvo, namn })
      .select()
    expect(error).toBeNull()
    expect(data).toHaveLength(1)
    await joakim.from('zon').delete().eq('namn', namn)
  })
})
