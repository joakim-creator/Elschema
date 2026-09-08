'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { serverklient } from '@/lib/supabase/server'
import type { Database } from '@/lib/databas.types'

type Jordklass = Database['public']['Enums']['jordklass']
type Kabeltyp = Database['public']['Enums']['kabeltyp']

const JORDKLASSER: readonly Jordklass[] = ['sensor', 'vr', 'skarm', 'chassi']
const KABELTYPER: readonly Kabeltyp[] = ['thin_wall', 'vanlig']

/**
 * Alla skrivningar går genom den inloggades klient, aldrig genom tjänstenyckeln.
 * Det gör att RLS är den verkliga spärren och inte en andra åsikt: kan en
 * skrivning gå igenom här, så är den tillåten på riktigt.
 */

function text(data: FormData, namn: string): string {
  return String(data.get(namn) ?? '').trim()
}

function tal(data: FormData, namn: string): number | null {
  const v = text(data, namn).replace(',', '.')
  if (!v) return null
  const n = Number(v)
  return Number.isFinite(n) ? n : null
}

function valfri(data: FormData, namn: string): string | null {
  return text(data, namn) || null
}

/**
 * Uppräkningarna kommer från databasen, inte från koden. Ett värde som inte
 * finns där avvisas här i stället för att bli ett skrivfel längre ned — och
 * lägger någon till en jordklass i schemat faller typkontrollen tills den
 * hanterats även här.
 */
function jordklass(data: FormData, namn: string): Jordklass | null {
  const v = text(data, namn) as Jordklass
  return JORDKLASSER.includes(v) ? v : null
}

function kabeltyp(data: FormData, namn: string): Kabeltyp | null {
  const v = text(data, namn) as Kabeltyp
  return KABELTYPER.includes(v) ? v : null
}

// ---------- projekt ----------

export async function skapaProjekt(data: FormData) {
  const supabase = await serverklient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) redirect('/logga-in')

  const { data: rad } = await supabase
    .from('projekt')
    .insert({ agare: user.id, namn: text(data, 'namn'), fordon: valfri(data, 'fordon') })
    .select('id')
    .single()

  if (rad) redirect(`/projekt/${rad.id}`)
  revalidatePath('/')
}

export async function bytNamnProjekt(data: FormData) {
  const supabase = await serverklient()
  await supabase
    .from('projekt')
    .update({ namn: text(data, 'namn'), fordon: valfri(data, 'fordon') })
    .eq('id', text(data, 'projekt'))
  revalidatePath('/')
  revalidatePath(`/projekt/${text(data, 'projekt')}`)
}

export async function raderaProjekt(data: FormData) {
  const supabase = await serverklient()
  await supabase.from('projekt').delete().eq('id', text(data, 'projekt'))
  redirect('/')
}

// ---------- zoner ----------

export async function skapaZon(data: FormData) {
  const projekt = text(data, 'projekt')
  const supabase = await serverklient()
  await supabase.from('zon').insert({ projekt_id: projekt, namn: text(data, 'namn') })
  revalidatePath(`/projekt/${projekt}/punkter`)
}

export async function raderaZon(data: FormData) {
  const projekt = text(data, 'projekt')
  const supabase = await serverklient()
  await supabase.from('zon').delete().eq('id', text(data, 'zon'))
  revalidatePath(`/projekt/${projekt}/punkter`)
}

// ---------- enheter ----------

/**
 * Lägger till en enhet ur biblioteket och instansierar samtliga portar.
 * Varje port får mallens standardroll. Att skapa portarna direkt gör att de
 * finns som noder att koppla till utan ett extra steg — och en port som inte
 * används kostar en rad, inte en felkälla.
 */
export async function laggTillEnhet(data: FormData) {
  const projekt = text(data, 'projekt')
  const mall = text(data, 'mall')
  const supabase = await serverklient()

  const { data: enhet, error } = await supabase
    .from('enhet')
    .insert({
      projekt_id: projekt,
      enhetsmall_id: mall,
      beteckning: text(data, 'beteckning'),
      zon_id: valfri(data, 'zon'),
    })
    .select('id')
    .single()
  if (error || !enhet) return

  const { data: portmallar } = await supabase
    .from('portmall')
    .select('id, portroll(id, ar_standard)')
    .eq('enhetsmall_id', mall)

  const portar = (portmallar ?? []).map((p) => ({
    enhet_id: enhet.id,
    portmall_id: p.id,
    vald_roll_id: p.portroll?.find((r) => r.ar_standard)?.id ?? null,
  }))
  if (portar.length) {
    const { data: skapade } = await supabase.from('port').insert(portar).select('id')
    if (skapade?.length) {
      await supabase
        .from('nod')
        .insert(skapade.map((p) => ({ projekt_id: projekt, port_id: p.id })))
    }
  }

  revalidatePath(`/projekt/${projekt}/enheter`)
}

export async function valjPortroll(data: FormData) {
  const projekt = text(data, 'projekt')
  const roll = text(data, 'roll')
  const supabase = await serverklient()
  await supabase
    .from('port')
    .update({ vald_roll_id: roll || null })
    .eq('id', text(data, 'port'))
  revalidatePath(`/projekt/${projekt}/enheter`)
}

export async function raderaEnhet(data: FormData) {
  const projekt = text(data, 'projekt')
  const supabase = await serverklient()
  await supabase.from('enhet').delete().eq('id', text(data, 'enhet'))
  revalidatePath(`/projekt/${projekt}/enheter`)
}

// ---------- komponenter ----------

export async function laggTillKomponent(data: FormData) {
  const projekt = text(data, 'projekt')
  const mall = text(data, 'mall')
  const supabase = await serverklient()

  const { data: komponent, error } = await supabase
    .from('komponent')
    .insert({
      projekt_id: projekt,
      komponentmall_id: mall,
      artikel_id: valfri(data, 'artikel'),
      beteckning: text(data, 'beteckning'),
      nummer: tal(data, 'nummer'),
      zon_id: valfri(data, 'zon'),
    })
    .select('id')
    .single()
  if (error || !komponent) return

  const { data: anslutningsmallar } = await supabase
    .from('komponentanslutningsmall')
    .select('id')
    .eq('komponentmall_id', mall)

  const anslutningar = (anslutningsmallar ?? []).map((a) => ({
    komponent_id: komponent.id,
    anslutningsmall_id: a.id,
  }))
  if (anslutningar.length) {
    const { data: skapade } = await supabase
      .from('komponentanslutning')
      .insert(anslutningar)
      .select('id')
    if (skapade?.length) {
      await supabase
        .from('nod')
        .insert(
          skapade.map((a) => ({ projekt_id: projekt, komponentanslutning_id: a.id })),
        )
    }
  }

  revalidatePath(`/projekt/${projekt}/komponenter`)
}

export async function valjArtikel(data: FormData) {
  const projekt = text(data, 'projekt')
  const supabase = await serverklient()
  await supabase
    .from('komponent')
    .update({ artikel_id: valfri(data, 'artikel') })
    .eq('id', text(data, 'komponent'))
  revalidatePath(`/projekt/${projekt}/komponenter`)
  revalidatePath(`/projekt/${projekt}`)
}

export async function raderaKomponent(data: FormData) {
  const projekt = text(data, 'projekt')
  const supabase = await serverklient()
  await supabase.from('komponent').delete().eq('id', text(data, 'komponent'))
  revalidatePath(`/projekt/${projekt}/komponenter`)
}

// ---------- jord och skarv ----------

export async function skapaJordpunkt(data: FormData) {
  const projekt = text(data, 'projekt')
  const klass = jordklass(data, 'klass')
  const supabase = await serverklient()

  if (!klass) return

  const { data: rad, error } = await supabase
    .from('jordpunkt')
    .insert({
      projekt_id: projekt,
      klass,
      // B-010: bara chassijord saknar ägande enhet. Villkoret i databasen
      // avvisar allt annat, så fältet nollställs här i stället för att låta
      // ett kvarglömt val fälla skrivningen.
      enhet_id: klass === 'chassi' ? null : valfri(data, 'enhet'),
      beteckning: text(data, 'beteckning'),
      zon_id: valfri(data, 'zon'),
    })
    .select('id')
    .single()
  if (error || !rad) return

  await supabase.from('nod').insert({ projekt_id: projekt, jordpunkt_id: rad.id })
  revalidatePath(`/projekt/${projekt}/punkter`)
}

export async function skapaSkarvpunkt(data: FormData) {
  const projekt = text(data, 'projekt')
  const supabase = await serverklient()
  const { data: rad, error } = await supabase
    .from('skarvpunkt')
    .insert({
      projekt_id: projekt,
      beteckning: text(data, 'beteckning'),
      zon_id: valfri(data, 'zon'),
    })
    .select('id')
    .single()
  if (error || !rad) return

  await supabase.from('nod').insert({ projekt_id: projekt, skarvpunkt_id: rad.id })
  revalidatePath(`/projekt/${projekt}/punkter`)
}

export async function raderaPunkt(data: FormData) {
  const projekt = text(data, 'projekt')
  const supabase = await serverklient()
  const tabell = text(data, 'tabell')
  if (tabell === 'jordpunkt' || tabell === 'skarvpunkt') {
    await supabase.from(tabell).delete().eq('id', text(data, 'id'))
  }
  revalidatePath(`/projekt/${projekt}/punkter`)
}

// ---------- kablar ----------

export async function skapaKabel(data: FormData) {
  const projekt = text(data, 'projekt')
  const supabase = await serverklient()
  await supabase.from('kabel').insert({
    projekt_id: projekt,
    nod_a: text(data, 'fran'),
    nod_b: text(data, 'till'),
    area_mm2: tal(data, 'area'),
    typ: kabeltyp(data, 'typ'),
    farg: valfri(data, 'farg'),
    langd_mm: tal(data, 'langd'),
    skarmad: data.get('skarmad') === 'on',
    markning: valfri(data, 'markning'),
  })
  revalidatePath(`/projekt/${projekt}`)
}

export async function andraKabel(data: FormData) {
  const projekt = text(data, 'projekt')
  const supabase = await serverklient()
  await supabase
    .from('kabel')
    .update({
      area_mm2: tal(data, 'area'),
      typ: kabeltyp(data, 'typ'),
      farg: valfri(data, 'farg'),
      langd_mm: tal(data, 'langd'),
      markning: valfri(data, 'markning'),
    })
    .eq('id', text(data, 'kabel'))
  revalidatePath(`/projekt/${projekt}`)
}

export async function raderaKabel(data: FormData) {
  const projekt = text(data, 'projekt')
  const supabase = await serverklient()
  await supabase.from('kabel').delete().eq('id', text(data, 'kabel'))
  revalidatePath(`/projekt/${projekt}`)
}

// ---------- bibliotek ----------

/**
 * Kopiera-och-ändra (D4). Kopian ägs av den som gjorde den och syns bara för
 * hen; originalet i systembiblioteket är orört. Det är det arbetssätt som
 * faktiskt används — man utgår sällan från ett tomt formulär.
 */
export async function kopieraKomponentmall(data: FormData) {
  const supabase = await serverklient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) redirect('/logga-in')

  const kalla = text(data, 'mall')
  const { data: original } = await supabase
    .from('komponentmall')
    .select(
      'namn, kategori, komponentanslutningsmall(beteckning, funktion, signaltyp_id)',
    )
    .eq('id', kalla)
    .single()
  if (!original) return

  const { data: kopia } = await supabase
    .from('komponentmall')
    .insert({
      agare: user.id,
      namn: text(data, 'namn') || `${original.namn} (kopia)`,
      kategori: original.kategori,
    })
    .select('id')
    .single()
  if (!kopia) return

  const anslutningar = (original.komponentanslutningsmall ?? []).map((a) => ({
    komponentmall_id: kopia.id,
    beteckning: a.beteckning,
    funktion: a.funktion,
    signaltyp_id: a.signaltyp_id,
  }))
  if (anslutningar.length) {
    await supabase.from('komponentanslutningsmall').insert(anslutningar)
  }

  revalidatePath('/bibliotek')
}

export async function skapaArtikel(data: FormData) {
  const supabase = await serverklient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) redirect('/logga-in')

  await supabase.from('artikel').insert({
    komponentmall_id: text(data, 'mall'),
    agare: user.id,
    fabrikat: text(data, 'fabrikat'),
    artikelnummer: valfri(data, 'artikelnummer'),
    strom_a: tal(data, 'strom'),
    spanning_min_v: tal(data, 'vmin'),
    spanning_max_v: tal(data, 'vmax'),
  })
  revalidatePath('/bibliotek')
}

// ---------- egna komponentmallar ----------

export async function bytNamnKomponentmall(data: FormData) {
  const supabase = await serverklient()
  const mall = text(data, 'mall')
  await supabase
    .from('komponentmall')
    .update({ namn: text(data, 'namn'), kategori: text(data, 'kategori') })
    .eq('id', mall)
  revalidatePath('/bibliotek')
  revalidatePath(`/bibliotek/mall/${mall}`)
}

export async function laggTillAnslutning(data: FormData) {
  const supabase = await serverklient()
  const mall = text(data, 'mall')
  await supabase.from('komponentanslutningsmall').insert({
    komponentmall_id: mall,
    beteckning: text(data, 'beteckning'),
    funktion: text(data, 'funktion'),
    signaltyp_id: valfri(data, 'signaltyp'),
  })
  revalidatePath(`/bibliotek/mall/${mall}`)
}

export async function raderaAnslutning(data: FormData) {
  const supabase = await serverklient()
  const mall = text(data, 'mall')
  await supabase
    .from('komponentanslutningsmall')
    .delete()
    .eq('id', text(data, 'anslutning'))
  revalidatePath(`/bibliotek/mall/${mall}`)
}

export async function raderaKomponentmall(data: FormData) {
  const supabase = await serverklient()
  await supabase.from('komponentmall').delete().eq('id', text(data, 'mall'))
  redirect('/bibliotek')
}

// ---------- egna enhetsmallar ----------

/**
 * Egna styrenheter. C1 säger att andra fabrikat ska gå att lägga till utan
 * kodändring — då måste det gå att göra i gränssnittet och inte bara i en
 * migration. MaxxECU kom ur en genererad migration därför att pinouten fanns
 * som tabell; nästa enhet gör det sällan.
 */
export async function skapaEnhetsmall(data: FormData) {
  const supabase = await serverklient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) redirect('/logga-in')

  const typ = text(data, 'typ')
  if (typ !== 'styrenhet' && typ !== 'pdm' && typ !== 'exp') return

  const { data: rad } = await supabase
    .from('enhetsmall')
    .insert({
      agare: user.id,
      fabrikat: text(data, 'fabrikat'),
      modell: text(data, 'modell'),
      typ,
      max_strom_a: tal(data, 'max_strom'),
      can_terminerad: data.get('can_terminerad') === 'on',
    })
    .select('id')
    .single()

  if (rad) redirect(`/bibliotek/enhet/${rad.id}`)
  revalidatePath('/bibliotek')
}

/**
 * Kontaktdon med sina stift i ett steg. Positionerna genereras som A1..A4,
 * B1..B4 och så vidare — samma mönster som Molex-donen i underlagen använder.
 * Att skriva 48 positioner för hand är hur fel smyger sig in.
 */
export async function skapaKontaktdon(data: FormData) {
  const supabase = await serverklient()
  const mall = text(data, 'mall')
  const rader = tal(data, 'rader') ?? 0
  const kolumner = tal(data, 'kolumner') ?? 0
  if (rader < 1 || kolumner < 1 || rader > 26 || kolumner > 12) return

  const { data: don } = await supabase
    .from('kontaktdonsmall')
    .insert({
      enhetsmall_id: mall,
      beteckning: text(data, 'beteckning'),
      poler: rader * kolumner,
    })
    .select('id')
    .single()
  if (!don) return

  const storlek = valfri(data, 'storlek')
  const max = tal(data, 'max_strom')
  const stift = []
  for (let r = 0; r < rader; r++) {
    for (let k = 1; k <= kolumner; k++) {
      stift.push({
        kontaktdonsmall_id: don.id,
        position: `${String.fromCharCode(65 + r)}${k}`,
        storlek,
        max_strom_a: max,
      })
    }
  }
  await supabase.from('stiftmall').insert(stift)
  revalidatePath(`/bibliotek/enhet/${mall}`)
}

export async function skapaPortmall(data: FormData) {
  const supabase = await serverklient()
  const mall = text(data, 'mall')
  const riktning = text(data, 'riktning')
  const tillatna = ['in', 'ut', 'dubbelriktad', 'matning', 'jord'] as const
  if (!(tillatna as readonly string[]).includes(riktning)) return

  const { data: port } = await supabase
    .from('portmall')
    .insert({
      enhetsmall_id: mall,
      beteckning: text(data, 'beteckning'),
      riktning: riktning as (typeof tillatna)[number],
      max_strom_a: tal(data, 'max_strom'),
    })
    .select('id')
    .single()
  if (!port) return

  const signaltyp = valfri(data, 'signaltyp')
  if (signaltyp) {
    await supabase
      .from('portroll')
      .insert({ portmall_id: port.id, signaltyp_id: signaltyp, ar_standard: true })
  }

  const stift = data.getAll('stift').map(String).filter(Boolean)
  if (stift.length) {
    await supabase
      .from('portstift')
      .insert(stift.map((s) => ({ portmall_id: port.id, stiftmall_id: s })))
  }
  revalidatePath(`/bibliotek/enhet/${mall}`)
}

export async function laggTillPortroll(data: FormData) {
  const supabase = await serverklient()
  await supabase.from('portroll').insert({
    portmall_id: text(data, 'port'),
    signaltyp_id: text(data, 'signaltyp'),
    ar_standard: false,
  })
  revalidatePath(`/bibliotek/enhet/${text(data, 'mall')}`)
}

export async function raderaPortmall(data: FormData) {
  const supabase = await serverklient()
  await supabase.from('portmall').delete().eq('id', text(data, 'port'))
  revalidatePath(`/bibliotek/enhet/${text(data, 'mall')}`)
}

export async function raderaEnhetsmall(data: FormData) {
  const supabase = await serverklient()
  await supabase.from('enhetsmall').delete().eq('id', text(data, 'mall'))
  redirect('/bibliotek')
}

// ---------- blad ----------

/**
 * Bladet är en sparad filtrering, inte en ritning (B-003). Det bär också
 * pappersvalet, eftersom en utskriftssida *är* ett blad (B-009).
 */
export async function skapaBlad(data: FormData) {
  const projekt = text(data, 'projekt')
  const format = text(data, 'format')
  if (format !== 'A4' && format !== 'A3' && format !== 'fri') return

  const supabase = await serverklient()
  await supabase.from('blad').insert({
    projekt_id: projekt,
    namn: text(data, 'namn'),
    format,
    bredd_mm: format === 'fri' ? tal(data, 'bredd') : null,
    hojd_mm: format === 'fri' ? tal(data, 'hojd') : null,
  })
  revalidatePath(`/projekt/${projekt}/blad`)
}

export async function raderaBlad(data: FormData) {
  const projekt = text(data, 'projekt')
  const supabase = await serverklient()
  await supabase.from('blad').delete().eq('id', text(data, 'blad'))
  redirect(`/projekt/${projekt}/blad`)
}

/**
 * Filtret sätts om i sin helhet. Att räkna ut skillnaden mot det som fanns
 * hade gett samma resultat med mer kod och en till väg att ha fel på.
 */
export async function sattBladfilter(data: FormData) {
  const projekt = text(data, 'projekt')
  const blad = text(data, 'blad')
  const supabase = await serverklient()

  const zoner = data.getAll('zon').map(String).filter(Boolean)
  const enheter = data.getAll('enhet').map(String).filter(Boolean)

  await supabase.from('bladfilter_zon').delete().eq('blad_id', blad)
  await supabase.from('bladfilter_enhet').delete().eq('blad_id', blad)

  if (zoner.length) {
    await supabase
      .from('bladfilter_zon')
      .insert(zoner.map((z) => ({ blad_id: blad, zon_id: z })))
  }
  if (enheter.length) {
    await supabase
      .from('bladfilter_enhet')
      .insert(enheter.map((e) => ({ blad_id: blad, enhet_id: e })))
  }
  revalidatePath(`/projekt/${projekt}/blad/${blad}`)
}

/**
 * Handflyttat läge. Ren presentation — nätlistan är orörd (B-001).
 *
 * Tar emot **förflyttningen**, inte det nya läget, och lägger den till det som
 * redan är sparat. Första versionen sparade ett absolut läge men lade på det
 * som en förskjutning ovanpå den automatiska placeringen, så rutan hoppade
 * dubbelt vid varje drag. Att servern äger additionen gör att klienten inte
 * behöver känna till det tidigare värdet alls.
 */
export async function flyttaRuta(
  projekt: string,
  blad: string,
  nyckel: string,
  dx: number,
  dy: number,
) {
  const supabase = await serverklient()
  const { data: fanns } = await supabase
    .from('bladplacering')
    .select('x, y')
    .eq('blad_id', blad)
    .eq('nyckel', nyckel)
    .maybeSingle()

  await supabase.from('bladplacering').upsert({
    blad_id: blad,
    nyckel,
    x: Math.round((fanns?.x ?? 0) + dx),
    y: Math.round((fanns?.y ?? 0) + dy),
  })
  revalidatePath(`/projekt/${projekt}/blad/${blad}`)
}

/**
 * Kabel dragen på duken. Skapas tom: area, färg och märkning fylls i efteråt,
 * i tabellen eller i kabelpanelen. Att fråga vid varje släpp bryter flytet när
 * man drar åtta injektorer i rad.
 */
export async function kopplaPaDuken(
  projekt: string,
  blad: string,
  nodA: string,
  nodB: string,
): Promise<{ fel: string } | null> {
  if (nodA === nodB) return { fel: 'En kabel kan inte gå till sig själv.' }
  const supabase = await serverklient()
  const { error } = await supabase
    .from('kabel')
    .insert({ projekt_id: projekt, nod_a: nodA, nod_b: nodB })

  if (error) {
    // Det unika indexet på nodparet är det vanliga fallet här.
    const redan = error.message.includes('kabel_par_unikt_idx')
    return {
      fel: redan ? 'De två punkterna är redan kopplade.' : 'Kopplingen gick inte igenom.',
    }
  }
  revalidatePath(`/projekt/${projekt}/blad/${blad}`)
  revalidatePath(`/projekt/${projekt}`)
  return null
}

/** Tar bort en kabel från duken. */
export async function kopplaBortPaDuken(projekt: string, blad: string, kabel: string) {
  const supabase = await serverklient()
  await supabase.from('kabel').delete().eq('id', kabel)
  revalidatePath(`/projekt/${projekt}/blad/${blad}`)
  revalidatePath(`/projekt/${projekt}`)
}

export async function nollstallPlaceringar(data: FormData) {
  const projekt = text(data, 'projekt')
  const blad = text(data, 'blad')
  const supabase = await serverklient()
  await supabase.from('bladplacering').delete().eq('blad_id', blad)
  revalidatePath(`/projekt/${projekt}/blad/${blad}`)
}

/**
 * Lägger en komponent på bladet. Filtrerar bladet på zon får komponenten den
 * zonen — annars hade den skapats och genast varit osynlig, vilket ser ut som
 * att knappen inte gjorde något.
 */
export async function laggPaBladet(data: FormData) {
  const projekt = text(data, 'projekt')
  const blad = text(data, 'blad')
  const zon = valfri(data, 'zon')
  const supabase = await serverklient()

  const mall = text(data, 'mall')
  const { data: komponent } = await supabase
    .from('komponent')
    .insert({
      projekt_id: projekt,
      komponentmall_id: mall,
      beteckning: text(data, 'beteckning'),
      nummer: tal(data, 'nummer'),
      zon_id: zon,
    })
    .select('id')
    .single()
  if (!komponent) return

  const { data: anslutningsmallar } = await supabase
    .from('komponentanslutningsmall')
    .select('id')
    .eq('komponentmall_id', mall)

  const anslutningar = (anslutningsmallar ?? []).map((a) => ({
    komponent_id: komponent.id,
    anslutningsmall_id: a.id,
  }))
  if (anslutningar.length) {
    const { data: skapade } = await supabase
      .from('komponentanslutning')
      .insert(anslutningar)
      .select('id')
    if (skapade?.length) {
      await supabase
        .from('nod')
        .insert(
          skapade.map((a) => ({ projekt_id: projekt, komponentanslutning_id: a.id })),
        )
    }
  }
  revalidatePath(`/projekt/${projekt}/blad/${blad}`)
}

/**
 * Döljer eller visar en ruta på ett blad (F2-27).
 *
 * Ligger i bladplacering av samma skäl som x, y och vand: det är presentation
 * per blad. Nätlistan är oförändrad, och samma komponent kan vara dold här och
 * synlig på nästa blad. Kabeln till en dold ruta ritas inte alls — den får
 * ingen hänvisningspil, för pilen betyder "fortsätter på annat blad".
 */
export async function doljRuta(
  projekt: string,
  blad: string,
  nyckel: string,
  dold: boolean,
) {
  const supabase = await serverklient()
  const { data: fanns } = await supabase
    .from('bladplacering')
    .select('x, y, vand')
    .eq('blad_id', blad)
    .eq('nyckel', nyckel)
    .maybeSingle()

  await supabase.from('bladplacering').upsert({
    blad_id: blad,
    nyckel,
    x: fanns?.x ?? 0,
    y: fanns?.y ?? 0,
    vand: fanns?.vand ?? false,
    dold,
  })
  revalidatePath(`/projekt/${projekt}/blad/${blad}`)
}

/** Tar fram allt som dolts på bladet. */
export async function visaAllaRutor(projekt: string, blad: string) {
  const supabase = await serverklient()
  await supabase
    .from('bladplacering')
    .update({ dold: false })
    .eq('blad_id', blad)
    .eq('dold', true)
  revalidatePath(`/projekt/${projekt}/blad/${blad}`)
}

/**
 * Vänder en rutas anslutningar till andra sidan. Automatiken vänder dem mot
 * styrenheten, men den som vill ha en snygg skiss måste kunna gå emot den.
 */
export async function vandRuta(projekt: string, blad: string, nyckel: string) {
  const supabase = await serverklient()
  const { data: fanns } = await supabase
    .from('bladplacering')
    .select('x, y, vand')
    .eq('blad_id', blad)
    .eq('nyckel', nyckel)
    .maybeSingle()

  await supabase.from('bladplacering').upsert({
    blad_id: blad,
    nyckel,
    x: fanns?.x ?? 0,
    y: fanns?.y ?? 0,
    vand: !(fanns?.vand ?? false),
  })
  revalidatePath(`/projekt/${projekt}/blad/${blad}`)
}
