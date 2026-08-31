import Link from 'next/link'
import { notFound } from 'next/navigation'
import { serverklient } from '@/lib/supabase/server'
import {
  laggTillPortroll,
  raderaEnhetsmall,
  raderaPortmall,
  skapaKontaktdon,
  skapaPortmall,
} from '@/app/atgarder'
import { Falt, Knapp, Panel, Tomt, Val, faltklass } from '@/app/ui'

/**
 * Redigering av en egen enhetsmall. Kravet i specifikationens avsnitt 4 är att
 * andra fabrikat ska gå att lägga till *utan kodändring* — den här sidan är
 * vad det kravet betyder i praktiken.
 */
export default async function EgenEnhet({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const supabase = await serverklient()

  const [{ data: mall }, { data: signaltyper }] = await Promise.all([
    supabase
      .from('enhetsmall')
      .select(
        `id, fabrikat, modell, typ, max_strom_a, can_terminerad, agare,
         kontaktdonsmall(id, beteckning, poler, stiftmall(id, position, storlek, max_strom_a)),
         portmall(id, beteckning, riktning, max_strom_a,
                  portroll(id, ar_standard, signaltyp(namn)),
                  portstift(stiftmall(position)))`,
      )
      .eq('id', id)
      .maybeSingle(),
    supabase.from('signaltyp').select('id, namn, kategori').order('kategori'),
  ])

  if (!mall) notFound()
  const egen = mall.agare !== null

  const don = [...(mall.kontaktdonsmall ?? [])].sort((a, b) =>
    a.beteckning.localeCompare(b.beteckning, 'sv'),
  )
  const portar = [...(mall.portmall ?? [])].sort((a, b) =>
    a.beteckning.localeCompare(b.beteckning, 'sv'),
  )
  const allaStift = don.flatMap((d) =>
    (d.stiftmall ?? []).map((s) => ({ ...s, don: d.beteckning })),
  )

  return (
    <main className="mx-auto max-w-4xl p-8">
      <Link
        href="/bibliotek"
        className="text-xs text-[var(--color-dampad)] hover:underline"
      >
        ← Biblioteket
      </Link>
      <h1 className="text-2xl font-semibold">
        {mall.fabrikat} {mall.modell}
      </h1>
      <p className="text-sm text-[var(--color-dampad)]">
        {mall.typ}
        {mall.max_strom_a ? ` · enhetstak ${mall.max_strom_a} A` : ''}
        {mall.can_terminerad ? ' · inbyggd CAN-terminering' : ''}
        {egen ? ' · egen mall' : ' · systemets mall, går att läsa men inte ändra'}
      </p>

      <div className="mt-6 grid gap-6">
        <Panel titel={`Kontaktdon (${don.length})`}>
          <ul className="divide-y divide-[var(--color-linje)] text-sm">
            {don.map((d) => (
              <li key={d.id} className="py-2">
                <span className="font-medium">{d.beteckning}</span>
                <span className="ml-2 text-xs text-[var(--color-dampad)]">
                  {d.poler} poler · stift{' '}
                  {(d.stiftmall ?? [])
                    .map((s) => s.position)
                    .sort()
                    .slice(0, 6)
                    .join(', ')}
                  {(d.stiftmall ?? []).length > 6 ? ' …' : ''}
                </span>
              </li>
            ))}
          </ul>
          {don.length === 0 && <Tomt>Inget kontaktdon ännu.</Tomt>}

          {egen && (
            <form
              action={skapaKontaktdon}
              className="mt-3 flex flex-wrap items-end gap-3"
            >
              <input type="hidden" name="mall" value={mall.id} />
              <Falt
                namn="beteckning"
                etikett="Beteckning"
                required
                placeholder="Connector 1"
              />
              <Falt
                namn="rader"
                etikett="Rader (A, B, …)"
                required
                defaultValue="12"
                inputMode="numeric"
              />
              <Falt
                namn="kolumner"
                etikett="Per rad"
                required
                defaultValue="4"
                inputMode="numeric"
              />
              <Falt namn="storlek" etikett="Stiftstorlek" placeholder="liten" />
              <Falt namn="max_strom" etikett="Max per stift (A)" inputMode="decimal" />
              <Knapp type="submit">Skapa med stift</Knapp>
            </form>
          )}
          <p className="mt-2 text-xs text-[var(--color-dampad)]">
            Positionerna genereras som A1…A4, B1…B4 och så vidare. Lämna strömgränsen tom
            om underlaget inte anger den — ett gissat värde blir fel strömkontroll senare.
          </p>
        </Panel>

        <Panel titel={`Portar (${portar.length})`}>
          <div className="max-h-96 overflow-y-auto">
            <table className="w-full text-left text-sm">
              <thead className="text-xs text-[var(--color-dampad)] uppercase">
                <tr className="border-b border-[var(--color-linje)]">
                  <th className="py-1 pr-3">Port</th>
                  <th className="py-1 pr-3">Riktning</th>
                  <th className="py-1 pr-3">Max</th>
                  <th className="py-1 pr-3">Stift</th>
                  <th className="py-1 pr-3">Roller</th>
                  <th className="py-1"></th>
                </tr>
              </thead>
              <tbody>
                {portar.map((p) => (
                  <tr
                    key={p.id}
                    className="border-b border-[var(--color-linje)] align-top"
                  >
                    <td className="py-1 pr-3 font-medium">{p.beteckning}</td>
                    <td className="py-1 pr-3 text-[var(--color-dampad)]">{p.riktning}</td>
                    <td className="py-1 pr-3 text-[var(--color-dampad)]">
                      {p.max_strom_a ? `${p.max_strom_a} A` : '—'}
                    </td>
                    <td className="py-1 pr-3 text-[var(--color-dampad)]">
                      {(p.portstift ?? []).map((s) => s.stiftmall?.position).join(', ') ||
                        '—'}
                    </td>
                    <td className="py-1 pr-3">
                      {(p.portroll ?? [])
                        .map(
                          (r) => `${r.signaltyp?.namn}${r.ar_standard ? ' (std)' : ''}`,
                        )
                        .join(', ') || '—'}
                      {egen && (
                        <form
                          action={laggTillPortroll}
                          className="mt-1 flex items-center gap-2"
                        >
                          <input type="hidden" name="mall" value={mall.id} />
                          <input type="hidden" name="port" value={p.id} />
                          <select
                            name="signaltyp"
                            className={`${faltklass} w-44 text-xs`}
                          >
                            {(signaltyper ?? []).map((t) => (
                              <option key={t.id} value={t.id}>
                                {t.namn}
                              </option>
                            ))}
                          </select>
                          <button className="text-xs text-[var(--color-dampad)] hover:text-[var(--color-text)]">
                            + roll
                          </button>
                        </form>
                      )}
                    </td>
                    <td className="py-1">
                      {egen && (
                        <form action={raderaPortmall}>
                          <input type="hidden" name="mall" value={mall.id} />
                          <input type="hidden" name="port" value={p.id} />
                          <button className="text-xs text-[var(--color-dampad)] hover:text-[var(--color-fel)]">
                            Ta bort
                          </button>
                        </form>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {portar.length === 0 && <Tomt>Ingen port ännu. Skapa kontaktdonet först.</Tomt>}

          {egen && allaStift.length > 0 && (
            <form action={skapaPortmall} className="mt-4 flex flex-wrap items-end gap-3">
              <input type="hidden" name="mall" value={mall.id} />
              <Falt namn="beteckning" etikett="Beteckning" required placeholder="INJ 1" />
              <Val namn="riktning" etikett="Riktning" required>
                <option value="in">in</option>
                <option value="ut">ut</option>
                <option value="dubbelriktad">dubbelriktad</option>
                <option value="matning">matning</option>
                <option value="jord">jord</option>
              </Val>
              <Falt namn="max_strom" etikett="Max (A)" inputMode="decimal" />
              <Val namn="signaltyp" etikett="Standardroll">
                <option value="">(ingen)</option>
                {(signaltyper ?? []).map((t) => (
                  <option key={t.id} value={t.id}>
                    {t.namn}
                  </option>
                ))}
              </Val>
              <label className="flex flex-col gap-1 text-xs text-[var(--color-dampad)]">
                Stift (flera går att välja)
                <select name="stift" multiple size={4} className={`${faltklass} w-44`}>
                  {allaStift.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.don} {s.position}
                    </option>
                  ))}
                </select>
              </label>
              <Knapp type="submit">Lägg till port</Knapp>
            </form>
          )}
        </Panel>

        {egen && (
          <Panel titel="Mallen">
            <form action={raderaEnhetsmall}>
              <input type="hidden" name="mall" value={mall.id} />
              <button className="text-xs text-[var(--color-dampad)] hover:text-[var(--color-fel)]">
                Ta bort mallen
              </button>
            </form>
            <p className="mt-2 text-xs text-[var(--color-dampad)]">
              Går inte om något fordon använder den — främmande nyckeln är{' '}
              <code>restrict</code>, så ett projekt kan aldrig tappa sina enheter av
              misstag.
            </p>
          </Panel>
        )}
      </div>
    </main>
  )
}
