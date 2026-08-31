'use server'

import { redirect } from 'next/navigation'
import { serverklient, tjansteklient } from '@/lib/supabase/server'

export type Utfall = { fel: string } | null

export async function loggaIn(_forra: Utfall, data: FormData): Promise<Utfall> {
  const epost = String(data.get('epost') ?? '').trim()
  const losenord = String(data.get('losenord') ?? '')
  if (!epost || !losenord) return { fel: 'Fyll i e-post och lösenord.' }

  const supabase = await serverklient()
  const { error } = await supabase.auth.signInWithPassword({
    email: epost,
    password: losenord,
  })
  if (error) return { fel: 'Fel e-post eller lösenord.' }

  redirect('/')
}

/**
 * Registrering i sluten grupp. Koden prövas *innan* kontot skapas, och märks
 * som använd i samma steg som profilen skapas. Tjänstenyckeln stannar på
 * servern; klienten ser bara utfallet.
 */
export async function registrera(_forra: Utfall, data: FormData): Promise<Utfall> {
  const epost = String(data.get('epost') ?? '').trim()
  const losenord = String(data.get('losenord') ?? '')
  const namn = String(data.get('namn') ?? '').trim()
  const kod = String(data.get('kod') ?? '')
    .trim()
    .toUpperCase()

  if (!epost || !losenord || !namn || !kod) return { fel: 'Alla fält behövs.' }
  if (losenord.length < 10) return { fel: 'Lösenordet behöver minst tio tecken.' }

  const tjanst = tjansteklient()

  const { data: koder } = await tjanst
    .from('inbjudningskod')
    .select('kod, anvand_av')
    .eq('kod', kod)
    .limit(1)

  const rad = koder?.[0]
  if (!rad) return { fel: 'Okänd inbjudningskod.' }
  if (rad.anvand_av) return { fel: 'Inbjudningskoden är redan använd.' }

  const { data: skapad, error: skapfel } = await tjanst.auth.admin.createUser({
    email: epost,
    password: losenord,
    email_confirm: true,
  })
  if (skapfel || !skapad.user)
    return { fel: 'Kunde inte skapa kontot. Är e-posten upptagen?' }

  const { error: profilfel } = await tjanst
    .from('profiler')
    .insert({ id: skapad.user.id, namn })
  if (profilfel) {
    // Utan profil är kontot oanvändbart. Ta bort det hellre än att lämna en spillra.
    await tjanst.auth.admin.deleteUser(skapad.user.id)
    return { fel: 'Kunde inte skapa profilen.' }
  }

  const { error: kodfel } = await tjanst
    .from('inbjudningskod')
    .update({ anvand_av: skapad.user.id, anvand: new Date().toISOString() })
    .eq('kod', kod)
    .is('anvand_av', null)
  if (kodfel) {
    await tjanst.from('profiler').delete().eq('id', skapad.user.id)
    await tjanst.auth.admin.deleteUser(skapad.user.id)
    return { fel: 'Inbjudningskoden hann användas av någon annan.' }
  }

  const supabase = await serverklient()
  await supabase.auth.signInWithPassword({ email: epost, password: losenord })
  redirect('/')
}

export async function loggaUt() {
  const supabase = await serverklient()
  await supabase.auth.signOut()
  redirect('/logga-in')
}
