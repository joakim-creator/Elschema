'use client'

import { useActionState, useState } from 'react'
import { loggaIn, registrera, type Utfall } from './atgarder'

const falt =
  'w-full rounded border border-[var(--color-linje)] bg-[var(--color-bakgrund)] px-3 py-2 outline-none focus:border-[var(--color-dampad)]'

export default function LoggaIn() {
  const [nyttKonto, setNyttKonto] = useState(false)
  const [utfallIn, skickaIn, vantarIn] = useActionState<Utfall, FormData>(loggaIn, null)
  const [utfallNy, skickaNy, vantarNy] = useActionState<Utfall, FormData>(
    registrera,
    null,
  )

  const utfall = nyttKonto ? utfallNy : utfallIn
  const vantar = nyttKonto ? vantarNy : vantarIn

  return (
    <main className="mx-auto flex min-h-screen max-w-sm flex-col justify-center gap-6 p-8">
      <div>
        <h1 className="text-2xl font-semibold">Elschema</h1>
        <p className="mt-1 text-sm text-[var(--color-dampad)]">
          Sluten grupp. Nya konton kräver en inbjudningskod.
        </p>
      </div>

      <form action={nyttKonto ? skickaNy : skickaIn} className="flex flex-col gap-3">
        {nyttKonto && (
          <label className="flex flex-col gap-1 text-sm">
            Namn
            <input name="namn" className={falt} autoComplete="name" required />
          </label>
        )}

        <label className="flex flex-col gap-1 text-sm">
          E-post
          <input
            name="epost"
            type="email"
            className={falt}
            autoComplete="email"
            required
          />
        </label>

        <label className="flex flex-col gap-1 text-sm">
          Lösenord
          <input
            name="losenord"
            type="password"
            className={falt}
            autoComplete={nyttKonto ? 'new-password' : 'current-password'}
            required
          />
        </label>

        {nyttKonto && (
          <label className="flex flex-col gap-1 text-sm">
            Inbjudningskod
            <input name="kod" className={falt} required />
          </label>
        )}

        {utfall?.fel && (
          <p role="alert" className="text-sm text-[var(--color-fel)]">
            {utfall.fel}
          </p>
        )}

        <button
          type="submit"
          disabled={vantar}
          className="mt-2 rounded bg-[var(--color-panel)] px-4 py-2 font-medium disabled:opacity-50"
        >
          {vantar ? 'Ett ögonblick…' : nyttKonto ? 'Skapa konto' : 'Logga in'}
        </button>
      </form>

      <button
        type="button"
        onClick={() => setNyttKonto((v) => !v)}
        className="text-sm text-[var(--color-dampad)] underline underline-offset-4"
      >
        {nyttKonto ? 'Jag har redan ett konto' : 'Jag har en inbjudningskod'}
      </button>
    </main>
  )
}
