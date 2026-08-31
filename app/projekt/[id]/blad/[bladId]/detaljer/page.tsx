import Link from 'next/link'
import { notFound } from 'next/navigation'
import { serverklient } from '@/lib/supabase/server'
import { Panel, Tomt } from '@/app/ui'

/**
 * Detaljrutorna på egen sida. De hörde tidigare hemma under ritningen, men
 * ritvyn ska ha all plats webbläsaren ger — och det här är en läslista man
 * öppnar när man ska koppla, inte något man tittar på medan man ritar.
 *
 * Innehållet genereras ur nätlistan. Ingen text här är skriven för hand, så
 * den kan aldrig hamna i otakt med schemat.
 */
export default async function Detaljer({
  params,
}: {
  params: Promise<{ id: string; bladId: string }>
}) {
  const { id, bladId } = await params
  const supabase = await serverklient()

  const [{ data: blad }, { data: noder }, { data: kablar }] = await Promise.all([
    supabase
      .from('blad')
      .select('id, namn, bladfilter_zon(zon_id), bladfilter_enhet(enhet_id)')
      .eq('id', bladId)
      .maybeSingle(),
    supabase.from('nod_vy').select('*').eq('projekt_id', id),
    supabase.from('kabel').select('*').eq('projekt_id', id),
  ])

  if (!blad) notFound()

  const zonfilter = new Set((blad.bladfilter_zon ?? []).map((r) => r.zon_id))
  const enhetsfilter = new Set((blad.bladfilter_enhet ?? []).map((r) => r.enhet_id))
  const filtrerar = zonfilter.size > 0 || enhetsfilter.size > 0

  type Rad = NonNullable<typeof noder>[number]
  const passar = (n: Rad) =>
    (n.zon_id !== null && zonfilter.has(n.zon_id)) ||
    (n.enhet_id !== null && enhetsfilter.has(n.enhet_id)) ||
    (n.jord_enhet_id !== null && enhetsfilter.has(n.jord_enhet_id))

  const synliga = filtrerar
    ? new Set((noder ?? []).filter(passar).map((n) => n.id!))
    : null

  const nodPerId = new Map((noder ?? []).filter((n) => n.id).map((n) => [n.id!, n]))
  const karta = new Map<
    string,
    {
      anslutning: string
      stift: string | null
      mot: string
      markning: string | null
      area: string | null
    }[]
  >()

  for (const k of kablar ?? []) {
    for (const [egen, andra] of [
      [k.nod_a, k.nod_b],
      [k.nod_b, k.nod_a],
    ] as const) {
      const n = nodPerId.get(egen)
      const m = nodPerId.get(andra)
      if (!n || !n.bararen) continue
      if (n.sort !== 'komponent' && n.sort !== 'port') continue
      if (synliga && !synliga.has(egen)) continue
      if (!karta.has(n.bararen)) karta.set(n.bararen, [])
      karta.get(n.bararen)!.push({
        anslutning: n.anslutning ?? '?',
        stift: n.stift,
        mot: m ? `${m.bararen}${m.anslutning ? ` · ${m.anslutning}` : ''}` : 'okopplad',
        markning: k.markning,
        area: k.area_mm2 === null ? null : String(k.area_mm2),
      })
    }
  }

  const detaljer = [...karta.entries()]
    .map(([namn, rader]) => ({
      namn,
      rader: rader.sort((a, b) => a.anslutning.localeCompare(b.anslutning, 'sv')),
    }))
    .sort((a, b) => a.namn.localeCompare(b.namn, 'sv'))

  return (
    <div className="grid gap-6">
      <div>
        <Link
          href={`/projekt/${id}/blad/${bladId}`}
          className="text-xs text-[var(--color-dampad)] hover:underline"
        >
          ← Tillbaka till ritningen
        </Link>
        <h2 className="text-lg font-semibold">Detaljrutor — {blad.namn}</h2>
        <p className="text-xs text-[var(--color-dampad)]">
          En ruta per enhet och komponent på bladet, med varje anslutning och vad den går
          till. Genererad ur nätlistan.
        </p>
      </div>

      <Panel titel={`Rutor (${detaljer.length})`}>
        {detaljer.length === 0 ? (
          <Tomt>Inget kopplat på bladet ännu.</Tomt>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
            {detaljer.map((d) => (
              <div
                key={d.namn}
                className="rounded border border-[var(--color-linje)] p-3 text-xs"
              >
                <div className="mb-2 font-medium">{d.namn}</div>
                <table className="w-full">
                  <tbody>
                    {d.rader.map((r, i) => (
                      <tr key={i} className="align-top">
                        <td className="py-0.5 pr-2 whitespace-nowrap text-[var(--color-dampad)]">
                          {r.stift ? `${r.stift} · ` : ''}
                          {r.anslutning}
                        </td>
                        <td className="py-0.5">
                          {r.mot}
                          {(r.markning || r.area) && (
                            <span className="ml-1 text-[var(--color-varning)]">
                              {[r.markning, r.area ? `${r.area} mm²` : null]
                                .filter(Boolean)
                                .join(' · ')}
                            </span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ))}
          </div>
        )}
      </Panel>
    </div>
  )
}
