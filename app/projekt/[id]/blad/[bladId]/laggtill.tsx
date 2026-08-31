'use client'

import { useState } from 'react'
import { laggPaBladet } from '@/app/atgarder'
import { Knapp, faltklass } from '@/app/ui'

export type Mallval = {
  id: string
  namn: string
  egen: boolean
  /** Förslaget räknas fram på servern och byts när mallen byts. */
  beteckning: string
  nummer: number | null
  serie: string | null
}

/**
 * Beteckning och nummer föreslås så fort man valt mall, och går att skriva
 * över. Att skriva in dem för hand varje gång är arbete appen kan göra —
 * och numret ska följa sin serie, vilket är svårare att hålla i huvudet än
 * att låta räkningen sköta det.
 */
export function LaggTillKomponent({
  projekt,
  blad,
  zon,
  mallar,
}: {
  projekt: string
  blad: string
  zon: string
  mallar: Mallval[]
}) {
  const [vald, setVald] = useState(mallar[0]?.id ?? '')
  const [beteckning, setBeteckning] = useState(mallar[0]?.beteckning ?? '')
  const [nummer, setNummer] = useState(String(mallar[0]?.nummer ?? ''))

  const mall = mallar.find((m) => m.id === vald)

  function byt(id: string) {
    const m = mallar.find((x) => x.id === id)
    setVald(id)
    setBeteckning(m?.beteckning ?? '')
    setNummer(String(m?.nummer ?? ''))
  }

  return (
    <form action={laggPaBladet} className="flex flex-wrap items-end gap-3">
      <input type="hidden" name="projekt" value={projekt} />
      <input type="hidden" name="blad" value={blad} />
      <input type="hidden" name="zon" value={zon} />

      <label className="flex flex-col gap-1 text-xs text-[var(--color-dampad)]">
        Komponent
        <select
          name="mall"
          value={vald}
          onChange={(e) => byt(e.target.value)}
          className={`${faltklass} w-56`}
          required
        >
          {mallar.map((m) => (
            <option key={m.id} value={m.id}>
              {m.namn}
              {m.egen ? ' (egen)' : ''}
            </option>
          ))}
        </select>
      </label>

      <label className="flex flex-col gap-1 text-xs text-[var(--color-dampad)]">
        Beteckning
        <input
          name="beteckning"
          value={beteckning}
          onChange={(e) => setBeteckning(e.target.value)}
          className={`${faltklass} w-48`}
          required
        />
      </label>

      <label className="flex flex-col gap-1 text-xs text-[var(--color-dampad)]">
        Nummer
        <input
          name="nummer"
          value={nummer}
          onChange={(e) => setNummer(e.target.value)}
          inputMode="numeric"
          className={`${faltklass} w-24`}
        />
      </label>

      <Knapp type="submit">Lägg till</Knapp>

      {mall?.serie && (
        <span className="pb-1 text-xs text-[var(--color-dampad)]">
          serie {mall.serie}
        </span>
      )}
    </form>
  )
}
