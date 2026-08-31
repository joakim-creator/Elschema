import { serverklient } from '@/lib/supabase/server'
import { laggTillKomponent, raderaKomponent, valjArtikel } from '@/app/atgarder'
import { Falt, Knapp, Panel, Tomt, Val, faltklass } from '@/app/ui'

/**
 * Komponenter i projektet. Artikeln får saknas (B-008): man vet att det sitter
 * en injektor på porten innan man bestämt vilken. En instans utan artikel
 * saknar strömvärde och redovisas som *ej kontrollerad*, aldrig som godkänd.
 */
export default async function Komponenter({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const supabase = await serverklient()

  const [{ data: komponenter }, { data: mallar }, { data: zoner }] = await Promise.all([
    supabase
      .from('komponent')
      .select(
        `id, beteckning, nummer, artikel_id, zon_id,
         komponentmall(id, namn, kategori, artikel(id, fabrikat, artikelnummer, strom_a)),
         komponentanslutning(id, komponentanslutningsmall(beteckning, funktion)),
         zon(namn)`,
      )
      .eq('projekt_id', id)
      .order('beteckning'),
    supabase
      .from('komponentmall')
      .select('id, namn, kategori, agare, artikel(id, fabrikat, artikelnummer, strom_a)')
      .order('namn'),
    supabase.from('zon').select('id, namn').eq('projekt_id', id).order('ordning'),
  ])

  const utanArtikel = (komponenter ?? []).filter((k) => !k.artikel_id).length

  return (
    <div className="grid gap-6">
      <Panel
        titel={`Komponenter (${komponenter?.length ?? 0})`}
        hjalp={
          utanArtikel > 0
            ? `${utanArtikel} utan vald artikel. De har inget strömvärde och kommer att räknas som ej kontrollerade, inte som godkända.`
            : 'Samtliga har en vald artikel.'
        }
      >
        {(komponenter ?? []).length === 0 ? (
          <Tomt>Ingen komponent ännu.</Tomt>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[52rem] text-left text-sm">
              <thead className="text-xs text-[var(--color-dampad)] uppercase">
                <tr className="border-b border-[var(--color-linje)]">
                  <th className="py-2 pr-3">Beteckning</th>
                  <th className="py-2 pr-3">Mall</th>
                  <th className="py-2 pr-3">Zon</th>
                  <th className="py-2 pr-3">Anslutningar</th>
                  <th className="py-2 pr-3">Artikel</th>
                  <th className="py-2"></th>
                </tr>
              </thead>
              <tbody>
                {(komponenter ?? []).map((k) => (
                  <tr
                    key={k.id}
                    className="border-b border-[var(--color-linje)] align-top"
                  >
                    <td className="py-2 pr-3 font-medium">{k.beteckning}</td>
                    <td className="py-2 pr-3 text-[var(--color-dampad)]">
                      {k.komponentmall?.namn}
                    </td>
                    <td className="py-2 pr-3 text-[var(--color-dampad)]">
                      {k.zon?.namn ?? '—'}
                    </td>
                    <td className="py-2 pr-3 text-xs text-[var(--color-dampad)]">
                      {(k.komponentanslutning ?? [])
                        .map((a) => a.komponentanslutningsmall?.beteckning)
                        .join(', ')}
                    </td>
                    <td className="py-2 pr-3">
                      <form action={valjArtikel} className="flex items-center gap-2">
                        <input type="hidden" name="projekt" value={id} />
                        <input type="hidden" name="komponent" value={k.id} />
                        <select
                          name="artikel"
                          defaultValue={k.artikel_id ?? ''}
                          className={`${faltklass} w-64`}
                        >
                          <option value="">(ingen vald — ej kontrollerad)</option>
                          {(k.komponentmall?.artikel ?? []).map((a) => (
                            <option key={a.id} value={a.id}>
                              {a.fabrikat} {a.artikelnummer}
                              {a.strom_a ? ` — ${a.strom_a} A` : ''}
                            </option>
                          ))}
                        </select>
                        <button className="text-xs text-[var(--color-dampad)] hover:text-[var(--color-text)]">
                          Välj
                        </button>
                      </form>
                    </td>
                    <td className="py-2">
                      <form action={raderaKomponent}>
                        <input type="hidden" name="projekt" value={id} />
                        <input type="hidden" name="komponent" value={k.id} />
                        <button className="text-xs text-[var(--color-dampad)] hover:text-[var(--color-fel)]">
                          Ta bort
                        </button>
                      </form>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Panel>

      <Panel
        titel="Lägg till komponent"
        hjalp="Anslutningarna instansieras direkt och blir noder att koppla till."
      >
        <form action={laggTillKomponent} className="flex flex-wrap items-end gap-3">
          <input type="hidden" name="projekt" value={id} />
          <Val namn="mall" etikett="Mall" required>
            {(mallar ?? []).map((m) => (
              <option key={m.id} value={m.id}>
                {m.namn}
                {m.agare ? ' (egen)' : ''}
              </option>
            ))}
          </Val>
          <Falt
            namn="beteckning"
            etikett="Beteckning"
            required
            placeholder="Injektor 1"
          />
          <Falt namn="nummer" etikett="Nummer" inputMode="numeric" placeholder="1" />
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
        <p className="mt-2 text-xs text-[var(--color-dampad)]">
          Artikeln väljs i tabellen ovan när komponenten finns. Den får vänta — instansen
          är giltig ändå.
        </p>
      </Panel>
    </div>
  )
}
