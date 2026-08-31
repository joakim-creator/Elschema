import Link from 'next/link'
import { serverklient } from '@/lib/supabase/server'
import { skapaBlad } from '@/app/atgarder'
import { Falt, Knapp, Panel, Tomt, Val } from '@/app/ui'

/**
 * Bladen i ett projekt. Varje blad är en sparad filtrering av nätlistan och
 * samtidigt en utskriftssida (B-003, B-009).
 */
export default async function Blad({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const supabase = await serverklient()

  const { data: blad } = await supabase
    .from('blad')
    .select(
      'id, namn, format, bredd_mm, hojd_mm, skala, bladfilter_zon(zon(namn)), bladfilter_enhet(enhet(beteckning))',
    )
    .eq('projekt_id', id)
    .order('ordning')

  return (
    <div className="grid gap-6">
      <Panel
        titel={`Blad (${blad?.length ?? 0})`}
        hjalp="Ett blad är en filtrering, inte en egen ritning."
      >
        <ul className="divide-y divide-[var(--color-linje)]">
          {(blad ?? []).map((b) => {
            const filter = [
              ...(b.bladfilter_zon ?? []).map((r) => r.zon?.namn),
              ...(b.bladfilter_enhet ?? []).map((r) => r.enhet?.beteckning),
            ].filter(Boolean)
            return (
              <li key={b.id} className="py-3">
                <Link
                  href={`/projekt/${id}/blad/${b.id}`}
                  className="font-medium hover:underline"
                >
                  {b.namn}
                </Link>
                <div className="text-xs text-[var(--color-dampad)]">
                  {b.format}
                  {b.format === 'fri' ? ` ${b.bredd_mm}×${b.hojd_mm} mm` : ''} · skala{' '}
                  {b.skala} · {filter.length ? filter.join(', ') : 'hela projektet'}
                </div>
              </li>
            )
          })}
        </ul>
        {(blad ?? []).length === 0 && <Tomt>Inget blad ännu.</Tomt>}
      </Panel>

      <Panel titel="Nytt blad">
        <form action={skapaBlad} className="flex flex-wrap items-end gap-3">
          <input type="hidden" name="projekt" value={id} />
          <Falt namn="namn" etikett="Namn" required placeholder="Motorrum" />
          <Val namn="format" etikett="Format" required defaultValue="A3">
            <option value="A4">A4</option>
            <option value="A3">A3</option>
            <option value="fri">fri storlek</option>
          </Val>
          <Falt namn="bredd" etikett="Bredd (mm)" inputMode="numeric" />
          <Falt namn="hojd" etikett="Höjd (mm)" inputMode="numeric" />
          <Knapp type="submit">Skapa</Knapp>
        </form>
        <p className="mt-2 text-xs text-[var(--color-dampad)]">
          Bredd och höjd används bara vid fri storlek. Filtret sätts på bladets egen sida.
        </p>
      </Panel>
    </div>
  )
}
