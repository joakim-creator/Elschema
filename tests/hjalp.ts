import { config } from 'dotenv'
import pg from 'pg'
import { createClient, type SupabaseClient } from '@supabase/supabase-js'

config({ path: '.env.local', quiet: true })

function kravs(namn: string): string {
  const v = process.env[namn]
  if (!v) throw new Error(`${namn} saknas. Kopiera .env.example till .env.local.`)
  return v
}

/** Direktanslutning till databasen. Kringgår RLS — bara för schemaprov. */
export function databas(): pg.Pool {
  return new pg.Pool({ connectionString: kravs('DATABASE_URL'), max: 4 })
}

/** Klient utan inloggning. Ser bara det anonyma rollens policyer tillåter. */
export function anonym(): SupabaseClient {
  return createClient(
    kravs('NEXT_PUBLIC_SUPABASE_URL'),
    kravs('NEXT_PUBLIC_SUPABASE_ANON_KEY'),
    {
      auth: { persistSession: false, autoRefreshToken: false },
    },
  )
}

/** Inloggad klient. Går genom RLS som den användaren. */
export async function somAnvandare(epost: string): Promise<SupabaseClient> {
  const klient = anonym()
  const { error } = await klient.auth.signInWithPassword({
    email: epost,
    password: PROVLOSENORD,
  })
  if (error) throw new Error(`kunde inte logga in som ${epost}: ${error.message}`)
  return klient
}

export const PROVLOSENORD = 'provlosenord'

export const JOAKIM = 'joakim@exempel.test'
export const ANNAN = 'annan@exempel.test'

/** Fasta id:n ur frödata. Se supabase/seed.sql. */
export const FRO = {
  joakim: 'a1000000-0000-4000-8000-000000000001',
  annan: 'a1000000-0000-4000-8000-000000000002',
  projektEvo: 'c1000000-0000-4000-8000-000000000001',
  projektVolvo: 'c1000000-0000-4000-8000-000000000002',
  zonMotor: 'c1000000-0000-4000-8000-000000000011',
  enhetEcu: 'c1000000-0000-4000-8000-000000000021',
  enhetPdm: 'c1000000-0000-4000-8000-000000000022',
  portInj1: 'c1000000-0000-4000-8000-000000000031',
  portmallInj1: 'b1000000-0000-4000-8000-000000000031',
  portmallDelad: 'b1000000-0000-4000-8000-000000000033',
  rollAnalogIn: 'b1000000-0000-4000-8000-000000000042',
  egenKomponentmall: 'b1000000-0000-4000-8000-000000000053',
  nodPortInj1: 'c1000000-0000-4000-8000-000000000081',
  nodVolvoPort: 'c1000000-0000-4000-8000-00000000008d',
  nodSkarv: 'c1000000-0000-4000-8000-00000000008c',
} as const

/**
 * Tabellerna som utgör nätlistan. Vaktprovet i schema.test.ts kräver att ingen
 * av dem bär en koordinat: B-001 säger att nätlistan är sanningen och ritningen
 * en vy. En kolumn med x och y här skulle göra läget till bärare av elektrisk
 * mening, och då går nätlistan inte längre att härleda ur tabellerna.
 */
export const NATLISTETABELLER = [
  'enhet',
  'port',
  'komponent',
  'komponentanslutning',
  'jordpunkt',
  'skarvpunkt',
  'nod',
  'kabel',
] as const

/** Ord som avslöjar att en kolumn bär placering i stället för elektrik. */
export const KOORDINATORD = [
  'x',
  'y',
  'pos_x',
  'pos_y',
  'koordinat',
  'layout',
  'position_x',
]
