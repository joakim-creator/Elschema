'use client'

import { useLayoutEffect, useRef, useState, useTransition } from 'react'
import type { Anslutningspunkt, Ritning, Ruta } from '@/lib/schema/layout'
import { flyttaRuta, kopplaBortPaDuken, kopplaPaDuken, vandRuta } from '@/app/atgarder'

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
      <line x1={x} y1={y} x2={x} y2={y + 9} />
      <line x1={x - 11} y1={y + 9} x2={x + 11} y2={y + 9} />
      <line x1={x - 7} y1={y + 13} x2={x + 7} y2={y + 13} />
      <line x1={x - 3} y1={y + 17} x2={x + 3} y2={y + 17} />
    </g>
  )
}

/**
 * Draget bär sin *startpunkt*, inte sin senaste punkt. Förflyttningen räknas då
 * alltid som "nu minus start" och behöver aldrig läsas ur React-tillstånd som
 * kanske inte hunnit committas. Första försöket ackumulerade i tillståndet och
 * läste tillbaka det vid släpp — andra draget i rad blev då noll.
 */
type Drag =
  | { sort: 'ruta'; nyckel: string; franX: number; franY: number }
  | {
      sort: 'kabel'
      fran: Anslutningspunkt
      franX: number
      franY: number
      x: number
      y: number
    }

export function RitningsVy({
  ritning,
  projekt,
  blad,
}: {
  ritning: Ritning
  projekt: string
  blad: string
}) {
  const [skala, setSkala] = useState(0.9)
  const [drag, setDrag] = useState<Drag | null>(null)
  /**
   * Lokal förskjutning under och strax efter ett drag, med det läge den
   * räknades mot. När servern svarat har rutans läge i props ändrats, och då
   * släpps den lokala förskjutningen automatiskt — utan den jämförelsen får
   * man antingen en ruta som hoppar tillbaka eller en som räknas dubbelt,
   * beroende på vilken som hinner först.
   */
  const [flytt, setFlytt] = useState<
    Record<string, { dx: number; dy: number; basX: number; basY: number }>
  >({})
  const [fel, setFel] = useState<string | null>(null)
  const [valdKabel, setValdKabel] = useState<string | null>(null)
  /**
   * Namnet på anslutningspunkten under pekaren. Låg först som <title> i SVG:n,
   * men React 19 lyfter <title> till <head> och servern gör det inte — vilket
   * gav ett hydreringsfel vid varje sidladdning. En rad i verktygsraden gör
   * samma nytta och syns dessutom på en surfplatta, där det inte finns någon
   * pekare att hovra med.
   */
  const [visa, setVisa] = useState<string | null>(null)
  const [vantar, startaOvergang] = useTransition()
  const [valdRuta, setValdRuta] = useState<string | null>(null)
  const [helskarm, setHelskarm] = useState(false)
  const svgRef = useRef<SVGSVGElement>(null)
  const ytaRef = useRef<HTMLDivElement>(null)
  const ramRef = useRef<HTMLDivElement>(null)

  /**
   * Punkten i ritningens koordinater som ska ligga kvar i ytans mitt efter
   * zoomningen. Rullningen sätts i useLayoutEffect och inte direkt i
   * zooma() — svg:n har inte hunnit växa än när knappen klickas, och en
   * rullning mot en yta som fortfarande är för liten klipps bort.
   */
  const mittmalRef = useRef<{ x: number; y: number } | null>(null)

  useLayoutEffect(() => {
    const yta = ytaRef.current
    const mal = mittmalRef.current
    if (!yta || !mal) return
    mittmalRef.current = null
    yta.scrollLeft = (mal.x - ritning.minX) * skala - yta.clientWidth / 2
    yta.scrollTop = (mal.y - ritning.minY) * skala - yta.clientHeight / 2
  }, [skala, ritning.minX, ritning.minY])

  /**
   * Zoomar kring ytans mitt. Utan det växer bara bilden medan man fortsätter
   * titta på övre vänstra hörnet, vilket känns som att storleken ändras i
   * stället för att man zoomar in i skissen.
   */
  function zooma(faktor: number) {
    const yta = ytaRef.current
    const ny = Math.min(4, Math.max(0.15, skala * faktor))
    if (yta) {
      mittmalRef.current = {
        x: ritning.minX + (yta.scrollLeft + yta.clientWidth / 2) / skala,
        y: ritning.minY + (yta.scrollTop + yta.clientHeight / 2) / skala,
      }
    }
    setSkala(ny)
  }

  /** Passa in hela ritningen i den yta som finns. */
  function passaIn() {
    const yta = ytaRef.current
    if (!yta) return
    const ny = Math.min(
      (yta.clientWidth - 16) / ritning.bredd,
      (yta.clientHeight - 16) / ritning.hojd,
    )
    mittmalRef.current = {
      x: ritning.minX + ritning.bredd / 2,
      y: ritning.minY + ritning.hojd / 2,
    }
    setSkala(Math.min(4, Math.max(0.15, ny)))
  }

  async function vaxlaHelskarm() {
    const ram = ramRef.current
    if (!ram) return
    try {
      if (document.fullscreenElement) {
        await document.exitFullscreen()
        setHelskarm(false)
      } else {
        await ram.requestFullscreen()
        setHelskarm(true)
      }
    } catch {
      // Helskärm kan nekas av webbläsaren. Vyn fungerar ändå.
    }
  }

  /** Skärmkoordinat till ritningens koordinat. */
  function tillDuken(e: React.PointerEvent): { x: number; y: number } {
    const r = svgRef.current?.getBoundingClientRect()
    if (!r) return { x: 0, y: 0 }
    return {
      x: ritning.minX + (e.clientX - r.left) / skala,
      y: ritning.minY + (e.clientY - r.top) / skala,
    }
  }

  function forskjutning(ruta: Ruta): { x: number; y: number } {
    const f = flytt[ruta.nyckel]
    if (!f) return { x: 0, y: 0 }
    if (f.basX !== ruta.x || f.basY !== ruta.y) return { x: 0, y: 0 }
    return { x: f.dx, y: f.dy }
  }

  function rutanFor(nodId: string): Ruta | undefined {
    return ritning.rutor.find((r) => r.anslutningar.some((a) => a.nodId === nodId))
  }

  /**
   * setPointerCapture kastar om pekaren inte längre är aktiv. Utan skyddet
   * avbryts hela hanteraren och draget startar aldrig — felet syns som att
   * inget händer när man drar, vilket är det svåraste slaget att felsöka.
   */
  function fangaPekare(e: React.PointerEvent) {
    try {
      ;(e.currentTarget as Element).setPointerCapture(e.pointerId)
    } catch {
      // Draget fungerar ändå; musen följs via svg-elementets egna händelser.
    }
  }

  function borjaDraRuta(nyckel: string, e: React.PointerEvent) {
    e.stopPropagation()
    fangaPekare(e)
    const p = tillDuken(e)
    setDrag({ sort: 'ruta', nyckel, franX: p.x, franY: p.y })
  }

  function borjaDraKabel(punkt: Anslutningspunkt, e: React.PointerEvent) {
    e.stopPropagation()
    fangaPekare(e)
    const p = tillDuken(e)
    setFel(null)
    setDrag({ sort: 'kabel', fran: punkt, franX: p.x, franY: p.y, x: p.x, y: p.y })
  }

  function ror(e: React.PointerEvent) {
    if (!drag) return
    const p = tillDuken(e)
    if (drag.sort === 'ruta') {
      const ruta = ritning.rutor.find((r) => r.nyckel === drag.nyckel)
      if (!ruta) return
      setFlytt((f) => ({
        ...f,
        [drag.nyckel]: {
          dx: p.x - drag.franX,
          dy: p.y - drag.franY,
          basX: ruta.x,
          basY: ruta.y,
        },
      }))
      return
    }
    setDrag({ ...drag, x: p.x, y: p.y })
  }

  /** Närmaste anslutningspunkt inom 18 px, för att slippa träffa exakt. */
  function punktVid(x: number, y: number): Anslutningspunkt | null {
    let bast: Anslutningspunkt | null = null
    let bastAvstand = 18
    for (const r of ritning.rutor) {
      const d = forskjutning(r)
      for (const a of r.anslutningar) {
        const avstand = Math.hypot(a.x + d.x - x, a.y + d.y - y)
        if (avstand < bastAvstand) {
          bastAvstand = avstand
          bast = a
        }
      }
    }
    return bast
  }

  function slapp(e: React.PointerEvent) {
    if (!drag) return
    const p = tillDuken(e)

    if (drag.sort === 'ruta') {
      const dx = p.x - drag.franX
      const dy = p.y - drag.franY
      const nyckel = drag.nyckel
      setDrag(null)
      if (Math.abs(dx) < 2 && Math.abs(dy) < 2) {
        setFlytt((f) => {
          const nytt = { ...f }
          delete nytt[nyckel]
          return nytt
        })
        return
      }
      // Förskjutningen lämnas kvar. Den släpps av sig själv när servern svarat
      // och rutans läge i props har ändrats — se forskjutning().
      startaOvergang(() => flyttaRuta(projekt, blad, nyckel, dx, dy))
      return
    }

    const mal = punktVid(p.x, p.y)
    const fran = drag.fran
    setDrag(null)
    if (!mal || mal.nodId === fran.nodId) return
    startaOvergang(async () => {
      const utfall = await kopplaPaDuken(projekt, blad, fran.nodId, mal.nodId)
      if (utfall) setFel(utfall.fel)
    })
  }

  function narmasteFlytt(nodId: string): { x: number; y: number } {
    const r = rutanFor(nodId)
    return r ? forskjutning(r) : { x: 0, y: 0 }
  }

  function rutaLage(r: Ruta) {
    const d = forskjutning(r)
    return { x: r.x + d.x, y: r.y + d.y }
  }

  return (
    <div
      ref={ramRef}
      className="flex flex-col rounded border border-[var(--color-linje)] bg-[var(--color-panel)]"
      style={{ height: helskarm ? '100vh' : 'calc(100vh - 15rem)' }}
    >
      <div className="flex flex-wrap items-center gap-3 border-b border-[var(--color-linje)] px-3 py-2 text-xs">
        <button
          onClick={() => zooma(1.25)}
          className="rounded border border-[var(--color-linje)] px-2 py-1"
        >
          Zooma in
        </button>
        <button
          onClick={() => zooma(1 / 1.25)}
          className="rounded border border-[var(--color-linje)] px-2 py-1"
        >
          Zooma ut
        </button>
        <button
          onClick={passaIn}
          className="rounded border border-[var(--color-linje)] px-2 py-1"
        >
          Passa in
        </button>
        <button
          onClick={vaxlaHelskarm}
          className="rounded border border-[var(--color-linje)] px-2 py-1"
        >
          {helskarm ? 'Lämna helskärm' : 'Helskärm'}
        </button>
        {valdRuta && (
          <button
            onClick={() => {
              const nyckel = valdRuta
              startaOvergang(() => vandRuta(projekt, blad, nyckel))
            }}
            className="rounded border border-[var(--color-linje)] px-2 py-1"
          >
            Vänd stiften på {valdRuta.split(':')[1]}
          </button>
        )}
        <span className="text-[var(--color-dampad)]">
          {Math.round(skala * 100)} % · dra i rubriken för att flytta en ruta, dra från en
          anslutningspunkt för att koppla
          {vantar && ' · sparar…'}
        </span>
        {visa && <span className="text-[var(--color-text)]">{visa}</span>}
        {fel && <span className="text-[var(--color-fel)]">{fel}</span>}
        {valdKabel && (
          <button
            onClick={() =>
              startaOvergang(async () => {
                await kopplaBortPaDuken(projekt, blad, valdKabel)
                setValdKabel(null)
              })
            }
            className="rounded border border-[var(--color-fel)] px-2 py-1 text-[var(--color-fel)]"
          >
            Ta bort vald kabel
          </button>
        )}
      </div>

      <div ref={ytaRef} className="min-h-0 flex-1 overflow-auto">
        <svg
          ref={svgRef}
          width={ritning.bredd * skala}
          height={ritning.hojd * skala}
          viewBox={`${ritning.minX} ${ritning.minY} ${ritning.bredd} ${ritning.hojd}`}
          onPointerMove={ror}
          onPointerUp={slapp}
          // Ytan är aldrig mindre än fönstret. Zoomar man ut ska arbetsytan
          // fortsätta fylla rutan, inte krympa ihop till ett hörn.
          style={{
            display: 'block',
            touchAction: 'none',
            minWidth: '100%',
            minHeight: '100%',
          }}
        >
          <rect
            x={ritning.minX}
            y={ritning.minY}
            width={ritning.bredd}
            height={ritning.hojd}
            fill="#0f1115"
          />

          {ritning.ledningar.map((l) => {
            const vald = valdKabel === l.kabelId
            const punkter = l.punkter.map((p) => `${p.x},${p.y}`).join(' ')
            const mitt = l.punkter[Math.floor(l.punkter.length / 2)]
            return (
              <g key={l.kabelId} onClick={() => setValdKabel(vald ? null : l.kabelId)}>
                <polyline
                  points={punkter}
                  fill="none"
                  stroke="transparent"
                  strokeWidth={12}
                  style={{ cursor: 'pointer' }}
                />
                <polyline
                  points={punkter}
                  fill="none"
                  stroke={vald ? '#e0a800' : '#7c8496'}
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

          {drag?.sort === 'kabel' && (
            <line
              x1={drag.fran.x + narmasteFlytt(drag.fran.nodId).x}
              y1={drag.fran.y + narmasteFlytt(drag.fran.nodId).y}
              x2={drag.x}
              y2={drag.y}
              stroke="#e0a800"
              strokeWidth={1.6}
              strokeDasharray="4 3"
            />
          )}

          {ritning.rutor.map((r) => {
            const { x, y } = rutaLage(r)
            if (r.sort === 'jord' || r.sort === 'skarv') {
              const punkt = r.anslutningar[0]
              return (
                <g key={r.nyckel}>
                  <g
                    onPointerDown={(e) => borjaDraRuta(r.nyckel, e)}
                    style={{ cursor: 'grab' }}
                  >
                    {r.sort === 'jord' ? (
                      <Jord x={x + r.bredd / 2} y={y + 14} klass={r.jordklass} />
                    ) : (
                      <circle cx={x + r.bredd / 2} cy={y + 16} r={5} fill="#e6e8ec" />
                    )}
                    <text
                      x={x + r.bredd / 2}
                      y={y + 46}
                      fontSize={10}
                      fill="#9aa3b2"
                      textAnchor="middle"
                    >
                      {r.rubrik}
                    </text>
                  </g>
                  {punkt && (
                    <circle
                      cx={punkt.x + forskjutning(r).x}
                      cy={punkt.y + forskjutning(r).y}
                      r={5}
                      fill="#2a2f3a"
                      stroke="#6aa9e0"
                      style={{ cursor: 'crosshair' }}
                      onPointerDown={(e) => borjaDraKabel(punkt, e)}
                    />
                  )}
                </g>
              )
            }

            return (
              <g key={r.nyckel}>
                <rect
                  x={x}
                  y={y}
                  width={r.bredd}
                  height={r.hojd}
                  rx={5}
                  fill="#171a21"
                  stroke={r.arMitten ? '#3a4152' : '#2a2f3a'}
                  strokeWidth={r.arMitten ? 1.8 : 1}
                />
                <g
                  onPointerDown={(e) => borjaDraRuta(r.nyckel, e)}
                  onClick={() => setValdRuta(valdRuta === r.nyckel ? null : r.nyckel)}
                  style={{ cursor: 'grab' }}
                >
                  <rect
                    x={x}
                    y={y}
                    width={r.bredd}
                    height={26}
                    rx={5}
                    fill={valdRuta === r.nyckel ? '#2a3242' : '#1e222b'}
                  />
                  <text
                    x={x + r.bredd / 2}
                    y={y + 18}
                    fontSize={r.arMitten ? 13 : 11}
                    fill="#e6e8ec"
                    textAnchor="middle"
                    fontWeight={600}
                  >
                    {r.rubrik}
                  </text>
                </g>

                {r.anslutningar.map((a) => {
                  const d = forskjutning(r)
                  const ax = a.x + d.x
                  const ay = a.y + d.y
                  const inne = a.sida === 'vanster' ? ax + 10 : ax - 10
                  return (
                    <g key={a.nodId}>
                      <text
                        x={inne}
                        y={ay + 3.5}
                        fontSize={9.5}
                        fill={a.kopplad ? '#e6e8ec' : '#6f7889'}
                        textAnchor={a.sida === 'vanster' ? 'start' : 'end'}
                      >
                        {a.etikett}
                      </text>
                      <circle
                        cx={ax}
                        cy={ay}
                        r={4.5}
                        fill={a.kopplad ? '#6aa9e0' : '#2a2f3a'}
                        stroke="#6aa9e0"
                        strokeWidth={1}
                        style={{ cursor: 'crosshair' }}
                        onPointerDown={(e) => borjaDraKabel(a, e)}
                        onPointerEnter={() =>
                          setVisa(
                            `${r.rubrik} · ${a.etikett}${a.signaltyp ? ` — ${a.signaltyp}` : ''}`,
                          )
                        }
                        onPointerLeave={() => setVisa(null)}
                      />
                    </g>
                  )
                })}
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
