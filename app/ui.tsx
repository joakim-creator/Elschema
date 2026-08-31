import type { ReactNode } from 'react'

export function Panel({
  titel,
  hjalp,
  children,
}: {
  titel: string
  hjalp?: string
  children: ReactNode
}) {
  return (
    <section className="rounded border border-[var(--color-linje)] bg-[var(--color-panel)] p-4">
      <h2 className="text-sm font-semibold tracking-wide uppercase">{titel}</h2>
      {hjalp && <p className="mt-1 text-xs text-[var(--color-dampad)]">{hjalp}</p>}
      <div className="mt-3">{children}</div>
    </section>
  )
}

export const faltklass =
  'rounded border border-[var(--color-linje)] bg-[var(--color-bakgrund)] px-2 py-1 text-sm outline-none focus:border-[var(--color-dampad)]'

export function Falt({
  namn,
  etikett,
  ...rest
}: { namn: string; etikett: string } & React.InputHTMLAttributes<HTMLInputElement>) {
  return (
    <label className="flex flex-col gap-1 text-xs text-[var(--color-dampad)]">
      {etikett}
      <input name={namn} className={faltklass} {...rest} />
    </label>
  )
}

export function Val({
  namn,
  etikett,
  children,
  ...rest
}: {
  namn: string
  etikett: string
  children: ReactNode
} & React.SelectHTMLAttributes<HTMLSelectElement>) {
  return (
    <label className="flex flex-col gap-1 text-xs text-[var(--color-dampad)]">
      {etikett}
      <select name={namn} className={faltklass} {...rest}>
        {children}
      </select>
    </label>
  )
}

export function Knapp({
  children,
  ...rest
}: React.ButtonHTMLAttributes<HTMLButtonElement>) {
  return (
    <button
      {...rest}
      className="self-end rounded border border-[var(--color-linje)] px-3 py-1 text-sm font-medium hover:border-[var(--color-dampad)] disabled:opacity-50"
    >
      {children}
    </button>
  )
}

export function Tomt({ children }: { children: ReactNode }) {
  return <p className="py-4 text-sm text-[var(--color-dampad)]">{children}</p>
}

export function Brasklapp({ children }: { children: ReactNode }) {
  return (
    <p className="mt-2 rounded border border-[var(--color-varning)]/40 bg-[var(--color-varning)]/10 px-3 py-2 text-xs text-[var(--color-varning)]">
      {children}
    </p>
  )
}
