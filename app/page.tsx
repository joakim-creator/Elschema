import { serverklient } from '@/lib/supabase/server'
import { loggaUt } from './logga-in/atgarder'

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
    .select('id, namn, fordon')
    .order('skapad', { ascending: false })

  return (
    <main className="mx-auto max-w-3xl p-8">
      <header className="flex items-baseline justify-between">
        <h1 className="text-2xl font-semibold">Elschema</h1>
        <form action={loggaUt}>
          <button className="text-sm text-[var(--color-dampad)] underline underline-offset-4">
            Logga ut {profil?.namn ?? ''}
          </button>
        </form>
      </header>

      <h2 className="mt-8 text-sm tracking-wide text-[var(--color-dampad)] uppercase">
        Projekt
      </h2>
      <ul className="mt-2 divide-y divide-[var(--color-linje)]">
        {(projekt ?? []).map((p) => (
          <li key={p.id} className="py-3">
            <div className="font-medium">{p.namn}</div>
            <div className="text-sm text-[var(--color-dampad)]">{p.fordon}</div>
          </li>
        ))}
        {(projekt ?? []).length === 0 && (
          <li className="py-3 text-sm text-[var(--color-dampad)]">Inga projekt ännu.</li>
        )}
      </ul>
    </main>
  )
}
