import Link from 'next/link'
import { serverklient } from '@/lib/supabase/server'
import { kopieraKomponentmall, skapaArtikel, skapaEnhetsmall } from '@/app/atgarder'
import { Falt, Knapp, Panel, Val } from '@/app/ui'

/**
 * Biblioteket. Systemets rader syns för alla och ägs av ingen; egna rader syns
 * bara för sin ägare. Kopiera-och-ändra är vägen till en egen mall — man utgår
 * sällan från ett tomt formulär (D4).
 */
export default async function Bibliotek() {
  const supabase = await serverklient()

  const [{ data: enhetsmallar }, { data: komponentmallar }, { data: barformaga }] =
    await Promise.all([
      supabase
        .from('enhetsmall')
        .select(
          'id, fabrikat, modell, typ, max_strom_a, can_terminerad, agare, kontaktdonsmall(beteckning, poler), portmall(id)',
        )
        .order('fabrikat'),
      supabase
        .from('komponentmall')
        .select('id, namn, kategori, agare, komponentanslutningsmall(id), artikel(id)')
        .order('namn'),
      supabase.from('barformaga').select('*').order('area_mm2'),
    ])

  return (
    <main className="mx-auto max-w-5xl p-8">
      <Link href="/" className="text-xs text-[var(--color-dampad)] hover:underline">
        ← Alla projekt
      </Link>
      <h1 className="text-2xl font-semibold">Bibliotek</h1>

      <div className="mt-6 grid gap-6">
        <Panel
          titel="Styrenheter, PDM och moduler"
          hjalp="Styrenheter är data, inte kod."
        >
          <table className="w-full text-left text-sm">
            <thead className="text-xs text-[var(--color-dampad)] uppercase">
              <tr className="border-b border-[var(--color-linje)]">
                <th className="py-2 pr-3">Enhet</th>
                <th className="py-2 pr-3">Typ</th>
                <th className="py-2 pr-3">Kontaktdon</th>
                <th className="py-2 pr-3">Portar</th>
                <th className="py-2 pr-3">Enhetstak</th>
                <th className="py-2 pr-3">CAN</th>
              </tr>
            </thead>
            <tbody>
              {(enhetsmallar ?? []).map((e) => (
                <tr key={e.id} className="border-b border-[var(--color-linje)]">
                  <td className="py-2 pr-3 font-medium">
                    <Link href={`/bibliotek/enhet/${e.id}`} className="hover:underline">
                      {e.fabrikat} {e.modell}
                    </Link>
                    {e.agare && (
                      <span className="ml-2 text-xs text-[var(--color-dampad)]">
                        egen
                      </span>
                    )}
                  </td>
                  <td className="py-2 pr-3 text-[var(--color-dampad)]">{e.typ}</td>
                  <td className="py-2 pr-3 text-[var(--color-dampad)]">
                    {(e.kontaktdonsmall ?? [])
                      .map((d) => `${d.beteckning} (${d.poler}p)`)
                      .join(', ') || '—'}
                  </td>
                  <td className="py-2 pr-3">{e.portmall?.length ?? 0}</td>
                  <td className="py-2 pr-3">
                    {e.max_strom_a ? `${e.max_strom_a} A` : '—'}
                  </td>
                  <td className="py-2 pr-3 text-[var(--color-dampad)]">
                    {e.can_terminerad ? 'inbyggd 120 Ω' : 'ingen terminering'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </Panel>

        <Panel
          titel="Ny enhetsmall"
          hjalp="Andra fabrikat ska gå att lägga till utan kodändring. Kontaktdon, stift och portar matas in på mallens egen sida."
        >
          <form action={skapaEnhetsmall} className="flex flex-wrap items-end gap-3">
            <Falt namn="fabrikat" etikett="Fabrikat" required placeholder="Link" />
            <Falt namn="modell" etikett="Modell" required placeholder="G4X" />
            <Val namn="typ" etikett="Typ" required>
              <option value="styrenhet">styrenhet</option>
              <option value="pdm">PDM</option>
              <option value="exp">expansionsmodul</option>
            </Val>
            <Falt namn="max_strom" etikett="Enhetstak (A)" inputMode="decimal" />
            <label className="flex items-center gap-2 pb-1 text-xs text-[var(--color-dampad)]">
              <input type="checkbox" name="can_terminerad" /> Inbyggd CAN-terminering
            </label>
            <Knapp type="submit">Skapa</Knapp>
          </form>
        </Panel>

        <Panel
          titel="Komponentmallar"
          hjalp="Mallen bär anslutningarnas funktion. Artikeln bär de mätbara värdena."
        >
          <table className="w-full text-left text-sm">
            <thead className="text-xs text-[var(--color-dampad)] uppercase">
              <tr className="border-b border-[var(--color-linje)]">
                <th className="py-2 pr-3">Namn</th>
                <th className="py-2 pr-3">Kategori</th>
                <th className="py-2 pr-3">Anslutningar</th>
                <th className="py-2 pr-3">Artiklar</th>
                <th className="py-2">Kopiera</th>
              </tr>
            </thead>
            <tbody>
              {(komponentmallar ?? []).map((m) => (
                <tr key={m.id} className="border-b border-[var(--color-linje)]">
                  <td className="py-2 pr-3 font-medium">
                    {m.namn}
                    {m.agare && (
                      <span className="ml-2 text-xs text-[var(--color-dampad)]">
                        egen
                      </span>
                    )}
                  </td>
                  <td className="py-2 pr-3 text-[var(--color-dampad)]">{m.kategori}</td>
                  <td className="py-2 pr-3">{m.komponentanslutningsmall?.length ?? 0}</td>
                  <td className="py-2 pr-3">{m.artikel?.length ?? 0}</td>
                  <td className="py-2">
                    <form
                      action={kopieraKomponentmall}
                      className="flex items-center gap-2"
                    >
                      <input type="hidden" name="mall" value={m.id} />
                      <input
                        name="namn"
                        placeholder={`${m.namn} (kopia)`}
                        className="w-44 rounded border border-[var(--color-linje)] bg-[var(--color-bakgrund)] px-2 py-1 text-xs"
                      />
                      <button className="text-xs text-[var(--color-dampad)] hover:text-[var(--color-text)]">
                        Kopiera
                      </button>
                    </form>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </Panel>

        <Panel
          titel="Ny artikel"
          hjalp="Artikeln hör till en mall och bär strömmen som kontrollerna räknar på."
        >
          <form action={skapaArtikel} className="flex flex-wrap items-end gap-3">
            <Val namn="mall" etikett="Mall" required>
              {(komponentmallar ?? []).map((m) => (
                <option key={m.id} value={m.id}>
                  {m.namn}
                </option>
              ))}
            </Val>
            <Falt namn="fabrikat" etikett="Fabrikat" required placeholder="Bosch" />
            <Falt namn="artikelnummer" etikett="Artikelnummer" placeholder="0280158123" />
            <Falt namn="strom" etikett="Ström (A)" inputMode="decimal" />
            <Falt namn="vmin" etikett="Spänning min" inputMode="decimal" />
            <Falt namn="vmax" etikett="Spänning max" inputMode="decimal" />
            <Knapp type="submit">Lägg till</Knapp>
          </form>
        </Panel>

        <Panel
          titel="Bärförmåga"
          hjalp="Frödata ur MaxxECU:s PDM-underlag. Utbytbar — den gäller deras förutsättningar."
        >
          <table className="w-full max-w-md text-left text-sm">
            <thead className="text-xs text-[var(--color-dampad)] uppercase">
              <tr className="border-b border-[var(--color-linje)]">
                <th className="py-1 pr-3">mm²</th>
                <th className="py-1 pr-3">AWG</th>
                <th className="py-1 pr-3">thin-wall</th>
                <th className="py-1 pr-3">vanlig</th>
              </tr>
            </thead>
            <tbody>
              {(barformaga ?? []).map((b) => (
                <tr key={b.id} className="border-b border-[var(--color-linje)]">
                  <td className="py-1 pr-3">{b.area_mm2}</td>
                  <td className="py-1 pr-3 text-[var(--color-dampad)]">{b.awg ?? '—'}</td>
                  <td className="py-1 pr-3">{b.thin_wall_a} A</td>
                  <td className="py-1 pr-3">{b.vanlig_a} A</td>
                </tr>
              ))}
            </tbody>
          </table>
        </Panel>
      </div>
    </main>
  )
}
