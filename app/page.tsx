import Link from 'next/link'
import { serverklient } from '@/lib/supabase/server'
import { loggaUt } from './logga-in/atgarder'
import { skapaProjekt } from './atgarder'
import { Falt, Knapp, Panel, Tomt } from './ui'

export default async function Start() {
  const supabase = await serverklient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  const { data: profil } = await supabase
    .from('profiler')
    .select('namn')
    .eq('id', user?.id ?? '')
    .maybeSingle()

  const { data: projekt } = await supabase
    .from('projekt')
    .select('id, namn, fordon, andrad')
    .order('andrad', { ascending: false })

  return (
    <main className="mx-auto max-w-3xl p-8">
      <header className="flex items-baseline justify-between">
        <h1 className="text-2xl font-semibold">Elschema</h1>
        <div className="flex items-center gap-4 text-sm">
          <Link href="/bibliotek" className="text-[var(--color-dampad)] hover:underline">
            Bibliotek
          </Link>
          <form action={loggaUt}>
            <button className="text-[var(--color-dampad)] hover:underline">
              Logga ut {profil?.namn ?? ''}
            </button>
          </form>
        </div>
      </header>

      <div className="mt-8 grid gap-6">
        <Panel titel="Projekt" hjalp="Ett projekt är ett fordon.">
          <ul className="divide-y divide-[var(--color-linje)]">
            {(projekt ?? []).map((p) => (
              <li key={p.id} className="py-3">
                <Link href={`/projekt/${p.id}`} className="font-medium hover:underline">
                  {p.namn}
                </Link>
                <div className="text-sm text-[var(--color-dampad)]">{p.fordon}</div>
              </li>
            ))}
          </ul>
          {(projekt ?? []).length === 0 && <Tomt>Inga projekt ännu.</Tomt>}
        </Panel>

        <Panel titel="Nytt projekt">
          <form action={skapaProjekt} className="flex flex-wrap items-end gap-3">
            <Falt namn="namn" etikett="Namn" required placeholder="Evo 8 racebil" />
            <Falt
              namn="fordon"
              etikett="Fordon"
              placeholder="Mitsubishi Lancer Evolution VIII"
            />
            <Knapp type="submit">Skapa</Knapp>
          </form>
        </Panel>
      </div>
    </main>
  )
}
