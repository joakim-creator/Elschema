import Link from 'next/link'
import { notFound } from 'next/navigation'
import type { ReactNode } from 'react'
import { serverklient } from '@/lib/supabase/server'
import { bytNamnProjekt, raderaProjekt } from '@/app/atgarder'
import { Falt, Knapp } from '@/app/ui'

const flikar = [
  { href: '', namn: 'Kopplingar' },
  { href: '/enheter', namn: 'Enheter' },
  { href: '/komponenter', namn: 'Komponenter' },
  { href: '/punkter', namn: 'Zoner, jord och skarv' },
  { href: '/blad', namn: 'Blad' },
]

export default async function ProjektLayout({
  children,
  params,
}: {
  children: ReactNode
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const supabase = await serverklient()
  const { data: projekt } = await supabase
    .from('projekt')
    .select('id, namn, fordon')
    .eq('id', id)
    .maybeSingle()

  // RLS gör att ett projekt man inte äger ser likadant ut som ett som inte
  // finns. Det är avsiktligt: annars går det att kartlägga vad andra har.
  if (!projekt) notFound()

  return (
    <main className="mx-auto max-w-6xl p-8">
      <header className="flex items-baseline justify-between">
        <div>
          <Link href="/" className="text-xs text-[var(--color-dampad)] hover:underline">
            ← Alla projekt
          </Link>
          <h1 className="text-2xl font-semibold">{projekt.namn}</h1>
          <p className="text-sm text-[var(--color-dampad)]">{projekt.fordon}</p>
        </div>
        <details className="text-sm">
          <summary className="cursor-pointer text-[var(--color-dampad)] select-none">
            Inställningar
          </summary>
          <div className="mt-3 rounded border border-[var(--color-linje)] bg-[var(--color-panel)] p-4">
            <form action={bytNamnProjekt} className="flex flex-wrap items-end gap-3">
              <input type="hidden" name="projekt" value={id} />
              <Falt namn="namn" etikett="Namn" defaultValue={projekt.namn} required />
              <Falt namn="fordon" etikett="Fordon" defaultValue={projekt.fordon ?? ''} />
              <Knapp type="submit">Spara</Knapp>
            </form>
            <form action={raderaProjekt} className="mt-4">
              <input type="hidden" name="projekt" value={id} />
              <button className="text-xs text-[var(--color-dampad)] hover:text-[var(--color-fel)]">
                Ta bort projektet med allt innehåll
              </button>
            </form>
          </div>
        </details>
      </header>

      <nav className="mt-6 flex gap-4 border-b border-[var(--color-linje)] text-sm">
        {flikar.map((f) => (
          <Link
            key={f.href}
            href={`/projekt/${id}${f.href}`}
            className="-mb-px border-b-2 border-transparent pb-2 hover:border-[var(--color-dampad)]"
          >
            {f.namn}
          </Link>
        ))}
      </nav>

      <div className="mt-6">{children}</div>
    </main>
  )
}
