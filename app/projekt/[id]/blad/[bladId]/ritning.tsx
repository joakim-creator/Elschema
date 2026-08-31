'use client'

import { useCallback, useRef, useState } from 'react'
import type { Ritning } from '@/lib/schema/layout'
import { sparaPlacering } from '@/app/atgarder'

const JORDFARG: Record<string, string> = {
  sensor: '#6aa9e0',
  vr: '#c58fe0',
  skarm: '#9aa3b2',
  chassi: '#e6e8ec',
}

/** Jordsymbol i stället för ett streck tvärs över bladet (E5). */
function Jord({ x, y, klass }: { x: number; y: number; klass: string | null }) {
  const f = JORDFARG[klass ?? 'chassi'] ?? '#9aa3b2'
  return (
    <g stroke={f} strokeWidth={1.6} fill="none">
      <line x1={x} y1={y} x2={x} y2={y + 8} />
      <line x1={x - 10} y1={y + 8} x2={x + 10} y2={y + 8} />
      <line x1={x - 6} y1={y + 12} x2={x + 6} y2={y + 12} />
      <line x1={x - 2} y1={y + 16} x2={x + 2} y2={y + 16} />
    </g>
  )
}

function Skarv({ x, y }: { x: number; y: number }) {
  return <circle cx={x} cy={y} r={4} fill="#e6e8ec" />
}

export function RitningsVy({
  ritning,
  projekt,
  blad,
  redigerbar,
}: {
  ritning: Ritning
  projekt: string
  blad: string
  redigerbar: boolean
}) {
  const [skala, setSkala] = useState(1)
  const [panorering, setPanorering] = useState({ x: 0, y: 0 })
  const [drar, setDrar] = useState<{
    nod: string
    startX: number
    startY: number
  } | null>(null)
  const [flytt, setFlytt] = useState<Record<string, { x: number; y: number }>>({})
  const svgRef = useRef<SVGSVGElement>(null)

  const forskjutning = useCallback(
    (nodId: string) => flytt[nodId] ?? { x: 0, y: 0 },
    [flytt],
  )

  function pekaNed(nodId: string, e: React.PointerEvent) {
    if (!redigerbar) return
    e.stopPropagation()
    ;(e.target as Element).setPointerCapture(e.pointerId)
    setDrar({ nod: nodId, startX: e.clientX, startY: e.clientY })
  }

  function pekaRor(e: React.PointerEvent) {
    if (!drar) return
    const dx = (e.clientX - drar.startX) / skala
    const dy = (e.clientY - drar.startY) / skala
    setFlytt((f) => ({ ...f, [drar.nod]: { x: dx, y: dy } }))
  }

  async function pekaUpp() {
    if (!drar) return
    const d = forskjutning(drar.nod)
    const nod = drar.nod
    setDrar(null)
    if (Math.abs(d.x) < 2 && Math.abs(d.y) < 2) return
    const ruta = ritning.rutor.find((r) => r.nodId === nod)
    if (!ruta) return
    await sparaPlacering(projekt, blad, nod, ruta.x + d.x, ruta.y + d.y)
    setFlytt((f) => {
      const nytt = { ...f }
      delete nytt[nod]
      return nytt
    })
  }

  return (
    <div className="rounded border border-[var(--color-linje)] bg-[var(--color-panel)]">
      <div className="flex items-center gap-3 border-b border-[var(--color-linje)] px-3 py-2 text-xs">
        <button
          onClick={() => setSkala((s) => Math.min(3, s * 1.2))}
          className="rounded border border-[var(--color-linje)] px-2 py-1"
        >
          Zooma in
        </button>
        <button
          onClick={() => setSkala((s) => Math.max(0.2, s / 1.2))}
          className="rounded border border-[var(--color-linje)] px-2 py-1"
        >
          Zooma ut
        </button>
        <button
          onClick={() => {
            setSkala(1)
            setPanorering({ x: 0, y: 0 })
          }}
          className="rounded border border-[var(--color-linje)] px-2 py-1"
        >
          Passa in
        </button>
        <span className="text-[var(--color-dampad)]">
          {Math.round(skala * 100)} % ·{' '}
          {redigerbar ? 'dra en ruta för att flytta den' : 'läsläge'}
          {ritning.okopplade > 0 && ` · ${ritning.okopplade} okopplade portar döljs`}
        </span>
      </div>

      <div
        className="overflow-auto"
        style={{ maxHeight: '70vh' }}
        onPointerMove={pekaRor}
        onPointerUp={pekaUpp}
      >
        <svg
          ref={svgRef}
          width={ritning.bredd * skala}
          height={ritning.hojd * skala}
          viewBox={`${panorering.x} ${panorering.y} ${ritning.bredd} ${ritning.hojd}`}
          style={{ display: 'block' }}
        >
          <rect width={ritning.bredd} height={ritning.hojd} fill="#0f1115" />

          {ritning.ledningar.map((l) => {
            const punkter = l.punkter.map((p) => `${p.x},${p.y}`).join(' ')
            const mitt = l.punkter[Math.floor(l.punkter.length / 2)]
            return (
              <g key={l.kabelId}>
                <polyline
                  points={punkter}
                  fill="none"
                  stroke="#7c8496"
                  strokeWidth={l.area && l.area >= 2.5 ? 2.4 : 1.4}
                  strokeDasharray={l.skarmad ? '6 3' : undefined}
                />
                {mitt && (l.farg || l.markning) && (
                  <>
                    {l.farg && (
                      <text
                        x={mitt.x}
                        y={mitt.y - 5}
                        fontSize={10}
                        fill="#e6e8ec"
                        textAnchor="middle"
                      >
                        {l.farg}
                        {l.area ? ` ${l.area}` : ''}
                      </text>
                    )}
                    {l.markning && (
                      <text
                        x={mitt.x}
                        y={mitt.y + 12}
                        fontSize={10}
                        fill="#6aa9e0"
                        textAnchor="middle"
                      >
                        {l.markning}
                      </text>
                    )}
                  </>
                )}
              </g>
            )
          })}

          {ritning.mitten && (
            <g>
              <rect
                x={ritning.mitten.x}
                y={ritning.mitten.y}
                width={ritning.mitten.bredd}
                height={ritning.mitten.hojd}
                rx={6}
                fill="#171a21"
                stroke="#2a2f3a"
              />
              <text
                x={ritning.mitten.x + ritning.mitten.bredd / 2}
                y={ritning.mitten.y + 20}
                fontSize={13}
                fill="#e6e8ec"
                textAnchor="middle"
                fontWeight={600}
              >
                {ritning.mitten.rubrik}
              </text>
            </g>
          )}

          {ritning.portrader.map((p) => (
            <g key={p.nodId}>
              <circle cx={p.x} cy={p.y} r={2.5} fill="#9aa3b2" />
              <text
                x={p.sida === 'vanster' ? p.x + 8 : p.x - 8}
                y={p.y + 3}
                fontSize={10}
                fill="#9aa3b2"
                textAnchor={p.sida === 'vanster' ? 'start' : 'end'}
              >
                {p.text}
              </text>
            </g>
          ))}

          {ritning.rutor.map((r) => {
            const d = forskjutning(r.nodId)
            const x = r.x + d.x
            const y = r.y + d.y
            if (r.sort === 'jord') {
              return (
                <g
                  key={r.nodId}
                  onPointerDown={(e) => pekaNed(r.nodId, e)}
                  style={{ cursor: redigerbar ? 'grab' : 'default' }}
                >
                  <Jord x={x + r.bredd - 20} y={y + 4} klass={r.jordklass} />
                  <text
                    x={x + r.bredd - 40}
                    y={y + 16}
                    fontSize={10}
                    fill="#9aa3b2"
                    textAnchor="end"
                  >
                    {r.rubrik}
                  </text>
                </g>
              )
            }
            if (r.sort === 'skarv') {
              return (
                <g
                  key={r.nodId}
                  onPointerDown={(e) => pekaNed(r.nodId, e)}
                  style={{ cursor: redigerbar ? 'grab' : 'default' }}
                >
                  <Skarv x={x + r.bredd - 8} y={y + r.hojd / 2} />
                  <text
                    x={x + r.bredd - 20}
                    y={y + r.hojd / 2 + 3}
                    fontSize={10}
                    fill="#9aa3b2"
                    textAnchor="end"
                  >
                    {r.rubrik}
                  </text>
                </g>
              )
            }
            return (
              <g
                key={r.nodId}
                onPointerDown={(e) => pekaNed(r.nodId, e)}
                style={{ cursor: redigerbar ? 'grab' : 'default' }}
              >
                <rect
                  x={x}
                  y={y}
                  width={r.bredd}
                  height={r.hojd}
                  rx={3}
                  fill="#171a21"
                  stroke="#2a2f3a"
                />
                <text x={x + 8} y={y + 17} fontSize={11} fill="#e6e8ec">
                  {r.rubrik}
                </text>
                {r.underrad && (
                  <text
                    x={x + r.bredd - 8}
                    y={y + 17}
                    fontSize={10}
                    fill="#9aa3b2"
                    textAnchor="end"
                  >
                    {r.underrad}
                  </text>
                )}
              </g>
            )
          })}

          {ritning.hanvisningar.map((h) => (
            <g key={h.kabelId}>
              <path
                d={
                  h.riktning === 'vanster'
                    ? `M ${h.x} ${h.y} l 14 -8 l 0 16 z`
                    : `M ${h.x} ${h.y} l -14 -8 l 0 16 z`
                }
                fill="#2a2f3a"
                stroke="#6aa9e0"
              />
              <text
                x={h.riktning === 'vanster' ? h.x - 6 : h.x + 6}
                y={h.y + 3}
                fontSize={10}
                fill="#6aa9e0"
                textAnchor={h.riktning === 'vanster' ? 'end' : 'start'}
              >
                {h.blad ? `→ ${h.blad}` : '→ annat blad'}
              </text>
              <text
                x={h.riktning === 'vanster' ? h.x - 6 : h.x + 6}
                y={h.y + 15}
                fontSize={9}
                fill="#9aa3b2"
                textAnchor={h.riktning === 'vanster' ? 'end' : 'start'}
              >
                {h.text}
              </text>
            </g>
          ))}
        </svg>
      </div>
    </div>
  )
}
