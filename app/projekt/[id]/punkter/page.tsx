import { serverklient } from '@/lib/supabase/server'
import {
  raderaPunkt,
  raderaZon,
  skapaJordpunkt,
  skapaSkarvpunkt,
  skapaZon,
} from '@/app/atgarder'
import { Falt, Knapp, Panel, Tomt, Val } from '@/app/ui'

const JORDKLASSER = [
  { varde: 'sensor', namn: 'Sensorjord' },
  { varde: 'vr', namn: 'VR-jord' },
  { varde: 'skarm', namn: 'Skärmjord' },
  { varde: 'chassi', namn: 'Chassi- och motorjord' },
] as const

/**
 * Zoner, jordpunkter och skarvpunkter — de tre saker som inte kommer ur
 * biblioteket men som nätlistan behöver.
 */
export default async function Punkter({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const supabase = await serverklient()

  const [{ data: zoner }, { data: jordar }, { data: skarvar }, { data: enheter }] =
    await Promise.all([
      supabase
        .from('zon')
        .select('id, namn, ordning')
        .eq('projekt_id', id)
        .order('ordning'),
      supabase
        .from('jordpunkt')
        .select('id, klass, beteckning, enhet(beteckning), zon(namn)')
        .eq('projekt_id', id)
        .order('beteckning'),
      supabase
        .from('skarvpunkt')
        .select('id, beteckning, zon(namn)')
        .eq('projekt_id', id)
        .order('beteckning'),
      supabase
        .from('enhet')
        .select('id, beteckning')
        .eq('projekt_id', id)
        .order('beteckning'),
    ])

  return (
    <div className="grid gap-6 lg:grid-cols-2">
      <Panel
        titel="Zoner"
        hjalp="Ett blad är en filtrering på zon. Zonen sätts på enheter, komponenter och punkter."
      >
        <ul className="divide-y divide-[var(--color-linje)] text-sm">
          {(zoner ?? []).map((z) => (
            <li key={z.id} className="flex items-center justify-between py-2">
              {z.namn}
              <form action={raderaZon}>
                <input type="hidden" name="projekt" value={id} />
                <input type="hidden" name="zon" value={z.id} />
                <button className="text-xs text-[var(--color-dampad)] hover:text-[var(--color-fel)]">
                  Ta bort
                </button>
              </form>
            </li>
          ))}
        </ul>
        {(zoner ?? []).length === 0 && <Tomt>Ingen zon ännu.</Tomt>}
        <form action={skapaZon} className="mt-3 flex items-end gap-3">
          <input type="hidden" name="projekt" value={id} />
          <Falt namn="namn" etikett="Ny zon" required placeholder="Motor" />
          <Knapp type="submit">Lägg till</Knapp>
        </form>
      </Panel>

      <Panel
        titel="Jordpunkter"
        hjalp="Klassen räcker inte: sensorjord i ECU:n och sensorjord i PDM:en är två skilda punkter och får aldrig kopplas ihop."
      >
        <ul className="divide-y divide-[var(--color-linje)] text-sm">
          {(jordar ?? []).map((j) => (
            <li key={j.id} className="flex items-center justify-between py-2">
              <span>
                {j.beteckning}
                <span className="ml-2 text-xs text-[var(--color-dampad)]">
                  {JORDKLASSER.find((k) => k.varde === j.klass)?.namn}
                  {j.enhet ? ` · ${j.enhet.beteckning}` : ' · gemensam'}
                  {j.zon ? ` · ${j.zon.namn}` : ''}
                </span>
              </span>
              <form action={raderaPunkt}>
                <input type="hidden" name="projekt" value={id} />
                <input type="hidden" name="tabell" value="jordpunkt" />
                <input type="hidden" name="id" value={j.id} />
                <button className="text-xs text-[var(--color-dampad)] hover:text-[var(--color-fel)]">
                  Ta bort
                </button>
              </form>
            </li>
          ))}
        </ul>
        {(jordar ?? []).length === 0 && <Tomt>Ingen jordpunkt ännu.</Tomt>}

        <form action={skapaJordpunkt} className="mt-3 flex flex-wrap items-end gap-3">
          <input type="hidden" name="projekt" value={id} />
          <Falt
            namn="beteckning"
            etikett="Beteckning"
            required
            placeholder="ECU sensorjord"
          />
          <Val namn="klass" etikett="Klass" required>
            {JORDKLASSER.map((k) => (
              <option key={k.varde} value={k.varde}>
                {k.namn}
              </option>
            ))}
          </Val>
          <Val namn="enhet" etikett="Ägande enhet">
            <option value="">(ingen — bara för chassijord)</option>
            {(enheter ?? []).map((e) => (
              <option key={e.id} value={e.id}>
                {e.beteckning}
              </option>
            ))}
          </Val>
          <Knapp type="submit">Lägg till</Knapp>
        </form>
        <p className="mt-2 text-xs text-[var(--color-dampad)]">
          Chassi- och motorjord är den enda klassen utan ägande enhet. Väljs den,
          nollställs enheten automatiskt.
        </p>
      </Panel>

      <Panel
        titel="Skarvpunkter"
        hjalp="En kabel går punkt till punkt. Förgrening görs här: en skarvpunkt är en nod som flera kablar kan sluta i."
      >
        <ul className="divide-y divide-[var(--color-linje)] text-sm">
          {(skarvar ?? []).map((s) => (
            <li key={s.id} className="flex items-center justify-between py-2">
              <span>
                {s.beteckning}
                {s.zon && (
                  <span className="ml-2 text-xs text-[var(--color-dampad)]">
                    {s.zon.namn}
                  </span>
                )}
              </span>
              <form action={raderaPunkt}>
                <input type="hidden" name="projekt" value={id} />
                <input type="hidden" name="tabell" value="skarvpunkt" />
                <input type="hidden" name="id" value={s.id} />
                <button className="text-xs text-[var(--color-dampad)] hover:text-[var(--color-fel)]">
                  Ta bort
                </button>
              </form>
            </li>
          ))}
        </ul>
        {(skarvar ?? []).length === 0 && <Tomt>Ingen skarvpunkt ännu.</Tomt>}
        <form action={skapaSkarvpunkt} className="mt-3 flex flex-wrap items-end gap-3">
          <input type="hidden" name="projekt" value={id} />
          <Falt
            namn="beteckning"
            etikett="Beteckning"
            required
            placeholder="Skarv matning injektorer"
          />
          <Knapp type="submit">Lägg till</Knapp>
        </form>
      </Panel>
    </div>
  )
}
