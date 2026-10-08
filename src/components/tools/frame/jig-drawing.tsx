"use client"

import { useElementWidth, labelSize } from "./use-element-width"
import {
  ALLOWANCE,
  buildDrawing,
  formatAngle,
  POST_OVERLAP,
  SPINE_HEIGHT,
  type FrameInputs,
  type FrameResult,
  type Jig,
  type JigCarrier,
  type JigPart,
  type Vec2,
} from "@/lib/frame"

const CARRIER_WIDTH = 60
const POST_WIDTH = 80
const pts = (ps: Vec2[]) => ps.map((p) => `${p.x},${p.y}`).join(" ")
const thin = { vectorEffect: "non-scaling-stroke" } as const

function CalloutBadge({ n, x, y, fs }: { n: number; x: number; y: number; fs: number }) {
  if (n <= 0) return null
  return (
    <g>
      <circle cx={x} cy={y} r={fs * 0.9} className="fill-background stroke-primary" strokeWidth={1.25} {...thin} />
      <text x={x} y={y} textAnchor="middle" dominantBaseline="central" fontSize={fs * 1.05} className="fill-foreground font-mono">
        {n}
      </text>
    </g>
  )
}

interface JigDrawingProps {
  inputs: FrameInputs
  result: FrameResult
  jig: Jig
  parts: JigPart[]
}

/**
 * A side-view schematic of the level-spine jig around the frame. The rear axle is
 * the origin and the spine runs level above the axle line. The seat tube carrier
 * hangs on a post below the spine and turns about the BB; the head tube carrier
 * stands on a post above it and turns about the bottom of the head tube.
 * Numbers match the parts list. The hardware is drawn schematically.
 */
export function JigDrawing({ inputs, result, jig, parts }: JigDrawingProps) {
  const [ref, width] = useElementWidth<SVGSVGElement>()
  const axle = result.points?.rearAxle
  if (!axle) return null
  const frame = buildDrawing(inputs, result, { x: -axle.x, y: -axle.y })
  if (!frame) return null

  // The picture has y down, so a height above the axle line is negative.
  const Y = (up: number) => -up
  const st = (id: string) => jig.stations.find((s) => s.id === id)!
  const callout = (id: string) => parts.find((p) => p.id === id)?.callout ?? 0
  const { uMin, uMax, bottom, top } = jig.spine

  const carrierShape = (c: JigCarrier) => {
    const pin = st(c.pivot)
    // The tube's upward direction in the picture is up and back.
    const a = (c.tubeAngle * Math.PI) / 180
    const dir = { x: -Math.cos(a), y: -Math.sin(a) }
    const end = (along: number): Vec2 => ({ x: pin.x + dir.x * along, y: Y(pin.y) + dir.y * along })
    return { pin, dir, end, rotate: c.tubeAngle - 90 }
  }
  const postRect = (c: JigCarrier) => {
    const pin = st(c.pivot)
    const x = pin.x - POST_WIDTH / 2
    if (c.side === "below") {
      const yTop = Y(bottom + POST_OVERLAP)
      const yBot = Y(pin.y) + ALLOWANCE
      return { x, y: yTop, width: POST_WIDTH, height: yBot - yTop }
    }
    const yBot = Y(top - POST_OVERLAP)
    const yTop = Y(pin.y) - ALLOWANCE
    return { x, y: yTop, width: POST_WIDTH, height: yBot - yTop }
  }

  const standoffTop = Y(bottom + 40)
  const standoffBottom = Y(0) + 30

  // Everything that has to fit in the picture.
  const carrierEnds = jig.carriers.flatMap((c) => {
    const sh = carrierShape(c)
    return [sh.end(-ALLOWANCE), sh.end(c.length - ALLOWANCE)]
  })
  const all: Vec2[] = [
    ...frame.tubes.flatMap((t) => t.corners),
    ...frame.wheels.flatMap((w) => [
      { x: w.tire.cx - w.tire.r, y: w.tire.cy - w.tire.r },
      { x: w.tire.cx + w.tire.r, y: w.tire.cy + w.tire.r },
    ]),
    { x: uMin, y: Y(top) },
    { x: uMax, y: Y(bottom) },
    ...carrierEnds,
    ...jig.carriers.flatMap((c) => {
      const r = postRect(c)
      return [
        { x: r.x, y: r.y },
        { x: r.x + r.width, y: r.y + r.height },
      ]
    }),
    { x: -220, y: 0 },
  ]
  const margin = 70
  const minX = Math.min(...all.map((p) => p.x)) - margin
  const maxX = Math.max(...all.map((p) => p.x)) + margin
  const minY = Math.min(...all.map((p) => p.y)) - margin
  const maxY = Math.max(...all.map((p) => p.y)) + margin
  const vb = { x: minX, y: minY, width: maxX - minX, height: maxY - minY }
  const fs = labelSize(vb.width, width)

  const hb = st("headBottom")
  const ht = st("headTop")
  const mandrel = (extra: number): [Vec2, Vec2] => {
    const dx = ht.x - hb.x
    const dy = ht.y - hb.y
    const len = Math.hypot(dx, dy)
    return [
      { x: hb.x - (dx / len) * extra, y: Y(hb.y - (dy / len) * extra) },
      { x: ht.x + (dx / len) * extra, y: Y(ht.y + (dy / len) * extra) },
    ]
  }
  const hm = mandrel(50)

  return (
    <svg
      ref={ref}
      viewBox={`${vb.x} ${vb.y} ${vb.width} ${vb.height}`}
      role="img"
      aria-label="Side-view schematic of the level-spine jig around the frame, with numbered parts"
      className="h-auto w-full"
    >
      {/* the frame, quietly */}
      <g className="fill-none stroke-muted-foreground" strokeWidth={1} {...thin}>
        {frame.wheels.map((w, i) => (
          <circle key={i} cx={w.tire.cx} cy={w.tire.cy} r={w.tire.r} strokeOpacity={0.35} strokeDasharray="4 4" />
        ))}
        {frame.tubes.map((t) => (
          <polygon key={t.role + t.a.x} points={pts(t.corners)} />
        ))}
      </g>

      {/* axle-to-axle line and the spine's height above it */}
      <line x1={uMin} y1={0} x2={st("frontAxle").x + 60} y2={0} className="stroke-muted-foreground" strokeDasharray="10 4 2 4" strokeWidth={1} {...thin} />
      <text x={st("frontAxle").x + 60 + fs * 0.4} y={0} dominantBaseline="central" fontSize={fs * 0.9} className="fill-muted-foreground">
        axle line
      </text>
      <g className="stroke-primary" strokeWidth={1.25} {...thin}>
        <line x1={uMin - 40} y1={0} x2={uMin - 40} y2={Y(bottom)} />
        <line x1={uMin - 40 - 12} y1={0} x2={uMin - 40 + 12} y2={0} />
        <line x1={uMin - 40 - 12} y1={Y(bottom)} x2={uMin - 40 + 12} y2={Y(bottom)} />
      </g>
      <text x={uMin - 40 - fs * 0.5} y={Y(bottom / 2)} textAnchor="end" dominantBaseline="central" fontSize={fs} className="fill-foreground font-mono">
        {Number(bottom.toFixed(1))}
      </text>

      {/* posts, then the spine over their inner ends */}
      {jig.carriers.map((c) => {
        const r = postRect(c)
        return <rect key={`post-${c.id}`} x={r.x} y={r.y} width={r.width} height={r.height} className="fill-secondary stroke-foreground" strokeWidth={1.25} fillOpacity={0.9} {...thin} />
      })}
      <rect x={uMin} y={Y(top)} width={uMax - uMin} height={SPINE_HEIGHT} className="fill-secondary stroke-foreground" strokeWidth={1.5} fillOpacity={0.8} {...thin} />

      {/* rear axle standoff: a block on the spine's face reaching down to the axle */}
      <rect x={-30} y={standoffTop} width={60} height={standoffBottom - standoffTop} className="fill-secondary stroke-foreground" strokeWidth={1.25} {...thin} />

      {/* carriers, each turning about its pin */}
      {jig.carriers.map((c) => {
        const sh = carrierShape(c)
        return (
          <g key={c.id} transform={`translate(${sh.pin.x} ${Y(sh.pin.y)}) rotate(${sh.rotate})`}>
            <rect
              x={-CARRIER_WIDTH / 2}
              y={-(c.length - ALLOWANCE)}
              width={CARRIER_WIDTH}
              height={c.length}
              className="fill-secondary stroke-foreground"
              strokeWidth={1.25}
              fillOpacity={0.55}
              {...thin}
            />
          </g>
        )
      })}

      {/* mandrel through the head tube */}
      <line x1={hm[0].x} y1={hm[0].y} x2={hm[1].x} y2={hm[1].y} className="stroke-primary" strokeWidth={4} strokeLinecap="round" {...thin} />

      {/* stations and pins */}
      {jig.stations
        .filter((s) => s.id !== "frontAxle")
        .map((s) => (
          <circle key={s.id} cx={s.x} cy={Y(s.y)} r={fs * 0.35} className="fill-primary stroke-background" strokeWidth={1} {...thin} />
        ))}
      {jig.carriers.map((c) => {
        const sh = carrierShape(c)
        return <circle key={`pin-${c.id}`} cx={sh.pin.x} cy={Y(sh.pin.y)} r={fs * 0.7} className="fill-none stroke-primary" strokeWidth={1.5} {...thin} />
      })}

      {/* badges and angles */}
      <CalloutBadge n={callout("spine")} x={uMin + fs * 3} y={Y(top) - fs * 1.4} fs={fs} />
      <CalloutBadge n={callout("rearStandoff")} x={-30 - fs * 1.4} y={Y(bottom / 2)} fs={fs} />
      {jig.carriers.map((c) => {
        const sh = carrierShape(c)
        const post = postRect(c)
        const mid = sh.end((c.length - 2 * ALLOWANCE) * 0.5)
        const lab = sh.end(c.length - ALLOWANCE + 55)
        return (
          <g key={c.id}>
            <CalloutBadge n={callout(c.id === "seat" ? "seatCarrier" : "headCarrier")} x={mid.x + fs * 2.2} y={mid.y} fs={fs} />
            <CalloutBadge n={callout(c.id === "seat" ? "bbPost" : "headPost")} x={post.x + post.width + fs * 1.4} y={c.side === "below" ? post.y + post.height * 0.7 : post.y + post.height * 0.3} fs={fs} />
            <CalloutBadge n={callout("pivotPins")} x={sh.pin.x - fs * 2.4} y={Y(sh.pin.y) + (c.side === "below" ? fs * 1.6 : -fs * 1.6)} fs={fs} />
            <text x={lab.x} y={lab.y} textAnchor="middle" dominantBaseline="central" fontSize={fs * 0.9} className="fill-foreground font-mono">
              {formatAngle(c.tubeAngle)}
            </text>
          </g>
        )
      })}
      <CalloutBadge n={callout("mandrels")} x={hm[1].x + fs * 1.6} y={hm[1].y - fs} fs={fs} />
    </svg>
  )
}
