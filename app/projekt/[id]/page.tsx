import { serverklient } from '@/lib/supabase/server'
import { andraKabel, raderaKabel, skapaKabel } from '@/app/atgarder'
import { Brasklapp, Falt, Knapp, Panel, Tomt, Val, faltklass } from '@/app/ui'

type NodRad = {
  id: string
  sort: string
  bararen: string | null
  anslutning: string | null
  signaltyp_namn: string | null
  last_a: number | null
}

function etikett(n: NodRad): string {
  const prefix = n.sort === 'jord' ? 'Jord: ' : n.sort === 'skarv' ? 'Skarv: ' : ''
  const del = n.anslutning ? ` · ${n.anslutning}` : ''
  return `${prefix}${n.bararen ?? '?'}${del}`
}

/**
 * Kopplingslistan. Det här är vyn som ersätter Excel: en rad per kabel, båda
 * ändarna utskrivna med namn, och ett förslag på area när lasten är känd.
 *
 * Raderna redigeras i tabellen. Ett formulär kan inte spänna över flera <td>,
 * så varje rad har sitt formulär i sista cellen och fälten pekar på det med
 * form-attributet. Alternativet — ett formulär per fält — hade gjort varje
 * ändring till en egen skrivning.
 */
export default async function Kopplingar({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const supabase = await serverklient()

  const [{ data: kablar }, { data: noder }, { data: barformaga }] = await Promise.all([
    supabase.from('kabel_vy').select('*').eq('projekt_id', id).order('markning'),
    supabase.from('nod_vy').select('*').eq('projekt_id', id).order('bararen'),
    supabase.from('barformaga').select('*').order('area_mm2'),
  ])

  const nodlista = (noder ?? []) as NodRad[]

  // Vyer får alla kolumner nullbara i de genererade typerna, id inräknat. Raden
  // finns förstås alltid, men hellre än att tysta typen med ett utropstecken
  // sållas de bort — en rad utan id går ändå inte att spara eller ta bort.
  const kabellista = (kablar ?? []).filter(
    (k): k is typeof k & { id: string } => typeof k.id === 'string',
  )

  function foreslagenArea(last: number | null, typ: string | null): number | null {
    if (!last || last <= 0) return null
    const rad = (barformaga ?? []).find(
      (b) => Number(typ === 'vanlig' ? b.vanlig_a : b.thin_wall_a) >= last,
    )
    return rad ? Number(rad.area_mm2) : null
  }

  return (
    <div className="grid gap-6">
      <Panel
        titel={`Kopplingar (${kabellista.length})`}
        hjalp="En rad per kabel. Ändra en port på fliken Enheter och raden här följer med — det är hela poängen."
      >
        {nodlista.length === 0 && (
          <Tomt>
            Inga noder ännu. Lägg till en enhet eller en komponent först — en kabel går
            mellan två punkter, och punkterna måste finnas.
          </Tomt>
        )}

        {kabellista.length > 0 && (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[68rem] text-left text-sm">
              <thead className="text-xs text-[var(--color-dampad)] uppercase">
                <tr className="border-b border-[var(--color-linje)]">
                  <th className="py-2 pr-3">Märkning</th>
                  <th className="py-2 pr-3">Från</th>
                  <th className="py-2 pr-3">Till</th>
                  <th className="py-2 pr-3">Area</th>
                  <th className="py-2 pr-3">Typ</th>
                  <th className="py-2 pr-3">Färg</th>
                  <th className="py-2 pr-3">Längd mm</th>
                  <th className="py-2 pr-3">Förslag</th>
                  <th className="py-2"></th>
                </tr>
              </thead>
              <tbody>
                {kabellista.map((k) => {
                  const f = `kabel-${k.id}`
                  const forslag = foreslagenArea(k.last_a, k.typ)
                  const underdimensionerad =
                    forslag !== null &&
                    k.area_mm2 !== null &&
                    Number(k.area_mm2) < forslag
                  return (
                    <tr
                      key={k.id}
                      className="border-b border-[var(--color-linje)] align-top"
                    >
                      <td className="py-2 pr-3">
                        <input
                          form={f}
                          name="markning"
                          defaultValue={k.markning ?? ''}
                          className={`${faltklass} w-24`}
                        />
                      </td>
                      <td className="py-2 pr-3">
                        {k.fran_bararen}
                        {k.fran_anslutning ? ` · ${k.fran_anslutning}` : ''}
                        <div className="text-xs text-[var(--color-dampad)]">
                          {k.fran_signaltyp}
                        </div>
                      </td>
                      <td className="py-2 pr-3">
                        {k.till_bararen}
                        {k.till_anslutning ? ` · ${k.till_anslutning}` : ''}
                        <div className="text-xs text-[var(--color-dampad)]">
                          {k.till_signaltyp}
                        </div>
                      </td>
                      <td className="py-2 pr-3">
                        <input
                          form={f}
                          name="area"
                          defaultValue={k.area_mm2 ?? undefined}
                          inputMode="decimal"
                          className={`${faltklass} w-16 ${underdimensionerad ? 'text-[var(--color-varning)]' : ''}`}
                        />
                      </td>
                      <td className="py-2 pr-3">
                        <select
                          form={f}
                          name="typ"
                          defaultValue={k.typ ?? 'thin_wall'}
                          className={`${faltklass} w-28`}
                        >
                          <option value="thin_wall">thin-wall</option>
                          <option value="vanlig">vanlig</option>
                        </select>
                      </td>
                      <td className="py-2 pr-3">
                        <input
                          form={f}
                          name="farg"
                          defaultValue={k.farg ?? ''}
                          className={`${faltklass} w-20`}
                        />
                      </td>
                      <td className="py-2 pr-3">
                        <input
                          form={f}
                          name="langd"
                          defaultValue={k.langd_mm ?? undefined}
                          inputMode="numeric"
                          className={`${faltklass} w-20`}
                        />
                      </td>
                      <td className="py-2 pr-3 text-xs">
                        {forslag === null ? (
                          <span className="text-[var(--color-dampad)]">
                            {k.last_a ? 'ingen area räcker' : 'last okänd'}
                          </span>
                        ) : (
                          <span
                            className={
                              underdimensionerad
                                ? 'text-[var(--color-varning)]'
                                : 'text-[var(--color-dampad)]'
                            }
                          >
                            {forslag} mm² vid {k.last_a} A
                          </span>
                        )}
                      </td>
                      <td className="py-2">
                        <div className="flex gap-3">
                          <form id={f} action={andraKabel}>
                            <input type="hidden" name="projekt" value={id} />
                            <input type="hidden" name="kabel" value={k.id} />
                            <button className="text-xs text-[var(--color-dampad)] hover:text-[var(--color-text)]">
                              Spara
                            </button>
                          </form>
                          <form action={raderaKabel}>
                            <input type="hidden" name="projekt" value={id} />
                            <input type="hidden" name="kabel" value={k.id} />
                            <button className="text-xs text-[var(--color-dampad)] hover:text-[var(--color-fel)]">
                              Ta bort
                            </button>
                          </form>
                        </div>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}

        <Brasklapp>
          Areaförslaget bygger på MaxxECU:s tabell över bärförmåga. Underlaget säger själv
          att kablar i varm miljö och i stammar med många hårt belastade ledare behöver
          större area än tabellen anger. Förslaget är en utgångspunkt, inte ett facit.
        </Brasklapp>
      </Panel>

      <Panel
        titel="Ny kabel"
        hjalp="Punkt till punkt. Behöver ledningen förgrena sig, lägg en skarvpunkt och dra två kablar."
      >
        <form action={skapaKabel} className="flex flex-wrap items-end gap-3">
          <input type="hidden" name="projekt" value={id} />
          <Val namn="fran" etikett="Från" required disabled={nodlista.length === 0}>
            {nodlista.map((n) => (
              <option key={n.id} value={n.id}>
                {etikett(n)}
              </option>
            ))}
          </Val>
          <Val namn="till" etikett="Till" required disabled={nodlista.length === 0}>
            {nodlista.map((n) => (
              <option key={n.id} value={n.id}>
                {etikett(n)}
              </option>
            ))}
          </Val>
          <Falt namn="area" etikett="Area (mm²)" inputMode="decimal" />
          <Val namn="typ" etikett="Kabeltyp">
            <option value="thin_wall">thin-wall (TXL, R2)</option>
            <option value="vanlig">vanlig (RK, RKUB)</option>
          </Val>
          <Falt namn="farg" etikett="Färg" />
          <Falt namn="langd" etikett="Längd (mm)" inputMode="numeric" />
          <Falt namn="markning" etikett="Märkning" />
          <label className="flex items-center gap-2 pb-1 text-xs text-[var(--color-dampad)]">
            <input type="checkbox" name="skarmad" /> Skärmad
          </label>
          <Knapp type="submit" disabled={nodlista.length === 0}>
            Lägg till
          </Knapp>
        </form>
      </Panel>
    </div>
  )
}
