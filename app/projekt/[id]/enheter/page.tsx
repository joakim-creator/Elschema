import { serverklient } from '@/lib/supabase/server'
import { laggTillEnhet, raderaEnhet, valjPortroll } from '@/app/atgarder'
import { Falt, Knapp, Panel, Tomt, Val, faltklass } from '@/app/ui'

/**
 * Enheter och deras portar. Rollvalet är det som gör kontrollen i fas 4
 * meningsfull: en port med två möjliga roller (TACH / GP OUT 8) prövas mot den
 * som faktiskt är vald, inte mot båda.
 */
export default async function Enheter({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const supabase = await serverklient()

  const [{ data: enheter }, { data: mallar }, { data: zoner }] = await Promise.all([
    supabase
      .from('enhet')
      .select(
        `id, beteckning, zon_id,
         enhetsmall(fabrikat, modell, typ, max_strom_a, can_terminerad),
         port(id, vald_roll_id,
              portmall(id, beteckning, riktning, max_strom_a, anteckning,
                       portroll(id, ar_standard, signaltyp(nyckel, namn, ar_karna))))`,
      )
      .eq('projekt_id', id)
      .order('beteckning'),
    supabase.from('enhetsmall').select('id, fabrikat, modell, typ').order('fabrikat'),
    supabase.from('zon').select('id, namn').eq('projekt_id', id).order('ordning'),
  ])

  return (
    <div className="grid gap-6">
      {(enheter ?? []).map((e) => {
        const mall = e.enhetsmall
        const portar = [...(e.port ?? [])].sort((a, b) =>
          (a.portmall?.beteckning ?? '').localeCompare(
            b.portmall?.beteckning ?? '',
            'sv',
          ),
        )
        return (
          <Panel
            key={e.id}
            titel={`${e.beteckning} — ${mall?.fabrikat} ${mall?.modell}`}
            hjalp={[
              mall?.typ,
              mall?.max_strom_a ? `enhetstak ${mall.max_strom_a} A` : null,
              mall?.can_terminerad
                ? 'inbyggd CAN-terminering'
                : 'ingen inbyggd CAN-terminering',
              `${portar.length} portar`,
            ]
              .filter(Boolean)
              .join(' · ')}
          >
            <div className="max-h-96 overflow-y-auto">
              <table className="w-full text-left text-sm">
                <thead className="text-xs text-[var(--color-dampad)] uppercase">
                  <tr className="border-b border-[var(--color-linje)]">
                    <th className="py-1 pr-3">Port</th>
                    <th className="py-1 pr-3">Riktning</th>
                    <th className="py-1 pr-3">Max</th>
                    <th className="py-1 pr-3">Roll</th>
                  </tr>
                </thead>
                <tbody>
                  {portar.map((p) => {
                    const roller = p.portmall?.portroll ?? []
                    const vald = roller.find((r) => r.id === p.vald_roll_id)
                    const okontrollerad = vald?.signaltyp && !vald.signaltyp.ar_karna
                    return (
                      <tr key={p.id} className="border-b border-[var(--color-linje)]">
                        <td className="py-1 pr-3 font-medium">
                          {p.portmall?.beteckning}
                        </td>
                        <td className="py-1 pr-3 text-[var(--color-dampad)]">
                          {p.portmall?.riktning}
                        </td>
                        <td className="py-1 pr-3 text-[var(--color-dampad)]">
                          {p.portmall?.max_strom_a ? `${p.portmall.max_strom_a} A` : '—'}
                        </td>
                        <td className="py-1 pr-3">
                          <form action={valjPortroll} className="flex items-center gap-2">
                            <input type="hidden" name="projekt" value={id} />
                            <input type="hidden" name="port" value={p.id} />
                            <select
                              name="roll"
                              defaultValue={p.vald_roll_id ?? ''}
                              className={`${faltklass} w-56`}
                            >
                              <option value="">(ingen vald)</option>
                              {roller.map((r) => (
                                <option key={r.id} value={r.id}>
                                  {r.signaltyp?.namn}
                                  {r.ar_standard ? ' (standard)' : ''}
                                </option>
                              ))}
                            </select>
                            {roller.length > 1 && (
                              <button className="text-xs text-[var(--color-dampad)] hover:text-[var(--color-text)]">
                                Byt
                              </button>
                            )}
                          </form>
                          {okontrollerad && (
                            <span className="text-xs text-[var(--color-varning)]">
                              egen typ — kontrolleras inte
                            </span>
                          )}
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>

            <form action={raderaEnhet} className="mt-3">
              <input type="hidden" name="projekt" value={id} />
              <input type="hidden" name="enhet" value={e.id} />
              <button className="text-xs text-[var(--color-dampad)] hover:text-[var(--color-fel)]">
                Ta bort enheten och dess portar
              </button>
            </form>
          </Panel>
        )
      })}

      {(enheter ?? []).length === 0 && (
        <Panel titel="Enheter">
          <Tomt>Ingen enhet ännu. Lägg till en ur biblioteket nedan.</Tomt>
        </Panel>
      )}

      <Panel
        titel="Lägg till enhet"
        hjalp="Samtliga portar instansieras direkt, var och en med mallens standardroll."
      >
        <form action={laggTillEnhet} className="flex flex-wrap items-end gap-3">
          <input type="hidden" name="projekt" value={id} />
          <Val namn="mall" etikett="Ur biblioteket" required>
            {(mallar ?? []).map((m) => (
              <option key={m.id} value={m.id}>
                {m.fabrikat} {m.modell} ({m.typ})
              </option>
            ))}
          </Val>
          <Falt namn="beteckning" etikett="Beteckning" required placeholder="ECU" />
          <Val namn="zon" etikett="Zon">
            <option value="">(ingen)</option>
            {(zoner ?? []).map((z) => (
              <option key={z.id} value={z.id}>
                {z.namn}
              </option>
            ))}
          </Val>
          <Knapp type="submit">Lägg till</Knapp>
        </form>
      </Panel>
    </div>
  )
}
