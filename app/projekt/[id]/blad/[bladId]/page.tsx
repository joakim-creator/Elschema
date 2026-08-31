import Link from 'next/link'
import { notFound } from 'next/navigation'
import { serverklient } from '@/lib/supabase/server'
import { raknaRitning, type Kabel, type Nod, type Nodsort } from '@/lib/schema/layout'
import {
  laggPaBladet,
  nollstallPlaceringar,
  raderaBlad,
  sattBladfilter,
} from '@/app/atgarder'
import { Falt, Knapp, Panel, Val, faltklass } from '@/app/ui'
import { RitningsVy } from './ritning'

/**
 * Ett blad renderat. Filtret avgör vad som syns; allt annat räknas fram ur
 * nätlistan av raknaRitning(), som är en ren funktion och prövas för sig.
 */
export default async function BladSida({
  params,
}: {
  params: Promise<{ id: string; bladId: string }>
}) {
  const { id, bladId } = await params
  const supabase = await serverklient()

  const [
    { data: blad },
    { data: allaBlad },
    { data: noder },
    { data: kablar },
    { data: zoner },
    { data: enheter },
    { data: placeringar },
    { data: komponentmallar },
  ] = await Promise.all([
    supabase
      .from('blad')
      .select(
        'id, namn, format, bredd_mm, hojd_mm, skala, bladfilter_zon(zon_id), bladfilter_enhet(enhet_id)',
      )
      .eq('id', bladId)
      .maybeSingle(),
    supabase
      .from('blad')
      .select('id, namn, bladfilter_zon(zon_id), bladfilter_enhet(enhet_id)')
      .eq('projekt_id', id)
      .order('ordning'),
    supabase.from('nod_vy').select('*').eq('projekt_id', id),
    supabase.from('kabel').select('*').eq('projekt_id', id),
    supabase.from('zon').select('id, namn').eq('projekt_id', id).order('ordning'),
    supabase
      .from('enhet')
      .select('id, beteckning')
      .eq('projekt_id', id)
      .order('beteckning'),
    supabase.from('bladplacering').select('nyckel, x, y').eq('blad_id', bladId),
    supabase.from('komponentmall').select('id, namn, agare').order('namn'),
  ])

  if (!blad) notFound()

  const zonfilter = new Set((blad.bladfilter_zon ?? []).map((r) => r.zon_id))
  const enhetsfilter = new Set((blad.bladfilter_enhet ?? []).map((r) => r.enhet_id))

  // Ett blad utan filter visar hela projektet. Det är avsiktligt: ett nytt
  // blad ska visa något, inte en tom yta man måste gissa sig ur.
  const filtrerar = zonfilter.size > 0 || enhetsfilter.size > 0

  type Rad = NonNullable<typeof noder>[number]
  const passar = (n: Rad) =>
    (zonfilter.size > 0 && n.zon_id !== null && zonfilter.has(n.zon_id)) ||
    (enhetsfilter.size > 0 &&
      n.jord_enhet_id !== null &&
      enhetsfilter.has(n.jord_enhet_id)) ||
    (enhetsfilter.size > 0 && n.enhet_id !== null && enhetsfilter.has(n.enhet_id))

  const synliga = filtrerar
    ? new Set((noder ?? []).filter(passar).map((n) => n.id!))
    : null

  /** Vilket annat blad fortsätter kabeln på? Första träffen räcker som hänvisning. */
  const annatBlad = new Map<string, string>()
  for (const n of noder ?? []) {
    if (!n.id || (synliga && synliga.has(n.id))) continue
    for (const b of allaBlad ?? []) {
      if (b.id === bladId) continue
      const andraZoner = new Set((b.bladfilter_zon ?? []).map((r) => r.zon_id))
      const andraEnheter = new Set((b.bladfilter_enhet ?? []).map((r) => r.enhet_id))
      const traff =
        (n.zon_id !== null && andraZoner.has(n.zon_id)) ||
        (n.enhet_id !== null && andraEnheter.has(n.enhet_id))
      if (traff) {
        annatBlad.set(n.id, b.namn)
        break
      }
    }
  }

  const ritning = raknaRitning({
    noder: (noder ?? [])
      .filter((n) => n.id)
      .map((n): Nod => ({
        id: n.id!,
        sort: (n.sort ?? 'skarv') as Nodsort,
        bararen: n.bararen ?? '?',
        anslutning: n.anslutning,
        signaltyp: n.signaltyp_namn,
        enhetId: n.enhet_id,
        jordklass: n.jordklass,
        riktning: n.riktning,
      })),
    kablar: (kablar ?? []).map((k): Kabel => ({
      id: k.id,
      nodA: k.nod_a,
      nodB: k.nod_b,
      farg: k.farg,
      markning: k.markning,
      area: k.area_mm2 === null ? null : Number(k.area_mm2),
      skarmad: k.skarmad,
    })),
    synliga,
    annatBlad,
    placeringar: new Map(
      (placeringar ?? []).map((p) => [p.nyckel, { x: p.x, y: p.y }] as const),
    ),
  })

  // F2-08: en ruta per komponent på bladet, med varje anslutning och vad den
  // går till. Genererad ur nätlistan, aldrig skriven för hand.
  const nodPerId = new Map((noder ?? []).filter((n) => n.id).map((n) => [n.id!, n]))
  const detaljKarta = new Map<
    string,
    { anslutning: string; mot: string; markning: string | null }[]
  >()
  for (const k of kablar ?? []) {
    for (const [egen, andra] of [
      [k.nod_a, k.nod_b],
      [k.nod_b, k.nod_a],
    ] as const) {
      const n = nodPerId.get(egen)
      const m = nodPerId.get(andra)
      if (!n || n.sort !== 'komponent' || !n.bararen) continue
      if (synliga && !synliga.has(egen)) continue
      if (!detaljKarta.has(n.bararen)) detaljKarta.set(n.bararen, [])
      detaljKarta.get(n.bararen)!.push({
        anslutning: n.anslutning ?? '?',
        mot: m ? `${m.bararen}${m.anslutning ? ` · ${m.anslutning}` : ''}` : 'okopplad',
        markning: k.markning,
      })
    }
  }
  const detaljer = [...detaljKarta.entries()]
    .map(([namn, rader]) => ({
      namn,
      rader: rader.sort((a, b) => a.anslutning.localeCompare(b.anslutning, 'sv')),
    }))
    .sort((a, b) => a.namn.localeCompare(b.namn, 'sv'))

  return (
    <div className="grid gap-6">
      <div className="flex items-baseline justify-between">
        <div>
          <Link
            href={`/projekt/${id}/blad`}
            className="text-xs text-[var(--color-dampad)] hover:underline"
          >
            ← Alla blad
          </Link>
          <h2 className="text-lg font-semibold">{blad.namn}</h2>
          <p className="text-xs text-[var(--color-dampad)]">
            {blad.format}
            {blad.format === 'fri' ? ` ${blad.bredd_mm}×${blad.hojd_mm} mm` : ''} · skala{' '}
            {blad.skala} ·{' '}
            {filtrerar
              ? `${synliga?.size ?? 0} av ${noder?.length ?? 0} punkter`
              : 'hela projektet'}
          </p>
        </div>
      </div>

      <RitningsVy ritning={ritning} projekt={id} blad={bladId} />

      <Panel
        titel="Lägg till på bladet"
        hjalp="Komponenten hamnar i bladets zon och dyker upp som en ruta att dra kablar till. Kabeln fyller du i efteråt."
      >
        <form action={laggPaBladet} className="flex flex-wrap items-end gap-3">
          <input type="hidden" name="projekt" value={id} />
          <input type="hidden" name="blad" value={bladId} />
          <input type="hidden" name="zon" value={[...zonfilter][0] ?? ''} />
          <Val namn="mall" etikett="Komponent" required>
            {(komponentmallar ?? []).map((m) => (
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
            placeholder="Injektor 3"
          />
          <Falt namn="nummer" etikett="Nummer" inputMode="numeric" />
          <Knapp type="submit">Lägg till</Knapp>
        </form>
        {!filtrerar && (
          <p className="mt-2 text-xs text-[var(--color-dampad)]">
            Bladet filtrerar inte, så komponenten får ingen zon. Den syns här ändå.
          </p>
        )}
      </Panel>

      <Panel
        titel="Detaljrutor"
        hjalp="Genererade ur de komponenter bladet visar — som stiftlägena och relädragningen i förlagan. Inget skrivs för hand här; ändras kopplingen ändras rutan."
      >
        {detaljer.length === 0 ? (
          <p className="py-2 text-sm text-[var(--color-dampad)]">
            Inga komponenter på bladet ännu.
          </p>
        ) : (
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {detaljer.map((d) => (
              <div
                key={d.namn}
                className="rounded border border-[var(--color-linje)] p-3 text-xs"
              >
                <div className="font-medium">{d.namn}</div>
                <ul className="mt-2 space-y-1">
                  {d.rader.map((r, i) => (
                    <li key={i} className="flex justify-between gap-2">
                      <span className="text-[var(--color-dampad)]">{r.anslutning}</span>
                      <span className="text-right">
                        {r.mot}
                        {r.markning && (
                          <span className="ml-1 text-[var(--color-varning)]">
                            {r.markning}
                          </span>
                        )}
                      </span>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        )}
      </Panel>

      <Panel
        titel="Filter"
        hjalp="Bladet är en sparad filtrering, inte en egen ritning. Utan valda rader visas hela projektet."
      >
        <form action={sattBladfilter} className="flex flex-wrap items-end gap-4">
          <input type="hidden" name="projekt" value={id} />
          <input type="hidden" name="blad" value={bladId} />
          <label className="flex flex-col gap-1 text-xs text-[var(--color-dampad)]">
            Zoner
            <select
              name="zon"
              multiple
              size={4}
              defaultValue={[...zonfilter].filter((z): z is string => z !== null)}
              className={`${faltklass} w-48`}
            >
              {(zoner ?? []).map((z) => (
                <option key={z.id} value={z.id}>
                  {z.namn}
                </option>
              ))}
            </select>
          </label>
          <label className="flex flex-col gap-1 text-xs text-[var(--color-dampad)]">
            Enheter
            <select
              name="enhet"
              multiple
              size={4}
              defaultValue={[...enhetsfilter].filter((e): e is string => e !== null)}
              className={`${faltklass} w-48`}
            >
              {(enheter ?? []).map((e) => (
                <option key={e.id} value={e.id}>
                  {e.beteckning}
                </option>
              ))}
            </select>
          </label>
          <Knapp type="submit">Spara filter</Knapp>
        </form>

        <div className="mt-4 flex gap-4">
          <form action={nollstallPlaceringar}>
            <input type="hidden" name="projekt" value={id} />
            <input type="hidden" name="blad" value={bladId} />
            <button className="text-xs text-[var(--color-dampad)] hover:text-[var(--color-text)]">
              Nollställ handflyttade lägen
            </button>
          </form>
          <form action={raderaBlad}>
            <input type="hidden" name="projekt" value={id} />
            <input type="hidden" name="blad" value={bladId} />
            <button className="text-xs text-[var(--color-dampad)] hover:text-[var(--color-fel)]">
              Ta bort bladet
            </button>
          </form>
        </div>
      </Panel>
    </div>
  )
}
