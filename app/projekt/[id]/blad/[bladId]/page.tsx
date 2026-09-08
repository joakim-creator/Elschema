import Link from 'next/link'
import { notFound } from 'next/navigation'
import { serverklient } from '@/lib/supabase/server'
import { raknaRitning, type Kabel, type Nod, type Nodsort } from '@/lib/schema/layout'
import { nollstallPlaceringar, raderaBlad, sattBladfilter } from '@/app/atgarder'
import { foreslaBeteckning, foreslaNummer } from '@/lib/schema/nummer'
import { LaggTillKomponent, type Mallval } from './laggtill'
import { Knapp, Panel, faltklass } from '@/app/ui'
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
    { data: serier },
    { data: befintliga },
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
    supabase
      .from('bladplacering')
      .select('nyckel, x, y, vand, dold')
      .eq('blad_id', bladId),
    supabase.from('komponentmall').select('id, namn, kategori, agare').order('namn'),
    supabase.from('nummerserie').select('kategori, serie, namn'),
    supabase.from('komponent').select('beteckning, nummer').eq('projekt_id', id),
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
        stift: n.stift,
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
    vanda: new Set((placeringar ?? []).filter((p) => p.vand).map((p) => p.nyckel)),
    dolda: new Set((placeringar ?? []).filter((p) => p.dold).map((p) => p.nyckel)),
  })

  // F2-17, F2-18: förslag på beteckning och nummer per mall, räknade på
  // servern så att de stämmer mot vad projektet redan innehåller.
  const anvandaNummer = (befintliga ?? [])
    .map((k) => k.nummer)
    .filter((n): n is number => n !== null)
  const anvandaNamn = (befintliga ?? []).map((k) => k.beteckning)
  const serieFor = new Map((serier ?? []).map((s) => [s.kategori, s]))
  const mallval: Mallval[] = (komponentmallar ?? []).map((m) => {
    const serie = serieFor.get(m.kategori)
    return {
      id: m.id,
      namn: m.namn,
      egen: m.agare !== null,
      beteckning: foreslaBeteckning(m.namn, anvandaNamn),
      nummer: serie ? foreslaNummer(serie.serie, anvandaNummer) : null,
      serie: serie ? `${serie.serie}xx ${serie.namn}` : null,
    }
  })

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
        <LaggTillKomponent
          projekt={id}
          blad={bladId}
          zon={[...zonfilter][0] ?? ''}
          mallar={mallval}
        />
        {!filtrerar && (
          <p className="mt-2 text-xs text-[var(--color-dampad)]">
            Bladet filtrerar inte, så komponenten får ingen zon. Den syns här ändå.
          </p>
        )}
      </Panel>

      <p className="text-xs text-[var(--color-dampad)]">
        <Link
          href={`/projekt/${id}/blad/${bladId}/detaljer`}
          className="underline underline-offset-4"
        >
          Detaljrutor för bladets komponenter →
        </Link>
      </p>

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
