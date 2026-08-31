import Link from 'next/link'
import { notFound } from 'next/navigation'
import { serverklient } from '@/lib/supabase/server'
import {
  bytNamnKomponentmall,
  laggTillAnslutning,
  raderaAnslutning,
  raderaKomponentmall,
} from '@/app/atgarder'
import { Falt, Knapp, Panel, Tomt, Val } from '@/app/ui'

/**
 * Redigering av en egen komponentmall. Systemets mallar går att läsa och
 * kopiera men inte ändra — kopian är vägen in. Utan den här sidan är
 * "kopiera-och-ändra" bara "kopiera".
 */
export default async function EgenMall({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const supabase = await serverklient()

  const [{ data: mall }, { data: signaltyper }] = await Promise.all([
    supabase
      .from('komponentmall')
      .select(
        'id, namn, kategori, agare, komponentanslutningsmall(id, beteckning, funktion, signaltyp(namn))',
      )
      .eq('id', id)
      .maybeSingle(),
    supabase.from('signaltyp').select('id, namn, kategori').order('kategori'),
  ])

  if (!mall) notFound()

  const egen = mall.agare !== null
  const anslutningar = [...(mall.komponentanslutningsmall ?? [])].sort((a, b) =>
    a.beteckning.localeCompare(b.beteckning, 'sv'),
  )

  return (
    <main className="mx-auto max-w-3xl p-8">
      <Link
        href="/bibliotek"
        className="text-xs text-[var(--color-dampad)] hover:underline"
      >
        ← Biblioteket
      </Link>
      <h1 className="text-2xl font-semibold">{mall.namn}</h1>
      <p className="text-sm text-[var(--color-dampad)]">
        {mall.kategori}
        {egen ? ' · egen mall' : ' · systemets mall, går att läsa men inte ändra'}
      </p>

      <div className="mt-6 grid gap-6">
        <Panel titel={`Anslutningar (${anslutningar.length})`}>
          <ul className="divide-y divide-[var(--color-linje)] text-sm">
            {anslutningar.map((a) => (
              <li key={a.id} className="flex items-center justify-between py-2">
                <span>
                  <span className="font-medium">{a.beteckning}</span>
                  <span className="ml-2 text-xs text-[var(--color-dampad)]">
                    {a.funktion}
                    {a.signaltyp ? ` · ${a.signaltyp.namn}` : ' · ingen signaltyp'}
                  </span>
                </span>
                {egen && (
                  <form action={raderaAnslutning}>
                    <input type="hidden" name="mall" value={mall.id} />
                    <input type="hidden" name="anslutning" value={a.id} />
                    <button className="text-xs text-[var(--color-dampad)] hover:text-[var(--color-fel)]">
                      Ta bort
                    </button>
                  </form>
                )}
              </li>
            ))}
          </ul>
          {anslutningar.length === 0 && <Tomt>Inga anslutningar ännu.</Tomt>}

          {egen && (
            <form
              action={laggTillAnslutning}
              className="mt-3 flex flex-wrap items-end gap-3"
            >
              <input type="hidden" name="mall" value={mall.id} />
              <Falt namn="beteckning" etikett="Beteckning" required placeholder="1" />
              <Falt namn="funktion" etikett="Funktion" required placeholder="matning" />
              <Val namn="signaltyp" etikett="Signaltyp">
                <option value="">(ingen)</option>
                {(signaltyper ?? []).map((t) => (
                  <option key={t.id} value={t.id}>
                    {t.namn}
                  </option>
                ))}
              </Val>
              <Knapp type="submit">Lägg till</Knapp>
            </form>
          )}
        </Panel>

        {egen && (
          <Panel titel="Mallen">
            <form
              action={bytNamnKomponentmall}
              className="flex flex-wrap items-end gap-3"
            >
              <input type="hidden" name="mall" value={mall.id} />
              <Falt namn="namn" etikett="Namn" defaultValue={mall.namn} required />
              <Falt
                namn="kategori"
                etikett="Kategori"
                defaultValue={mall.kategori}
                required
              />
              <Knapp type="submit">Spara</Knapp>
            </form>
            <form action={raderaKomponentmall} className="mt-4">
              <input type="hidden" name="mall" value={mall.id} />
              <button className="text-xs text-[var(--color-dampad)] hover:text-[var(--color-fel)]">
                Ta bort mallen
              </button>
            </form>
          </Panel>
        )}
      </div>
    </main>
  )
}
