"use client"

import { useElementWidth, labelSize } from "./use-element-width"
import {
  ALLOWANCE,
  buildDrawing,
  dimGeometry,
  CARRIER_WIDTH,
  formatAngle,
  formatLengthValue,
  POST_OVERLAP,
  POST_WIDTH,
  sideDims,
  SPINE_HEIGHT,
  type FrameInputs,
  type FrameResult,
  type Jig,
  type JigCarrier,
  type LengthUnit,
  type Vec2,
} from "@/lib/frame"
import { DimLines } from "./dimension-lines"

const pts = (ps: Vec2[]) => ps.map((p) => `${p.x},${p.y}`).join(" ")
const thin = { vectorEffect: "non-scaling-stroke" } as const

interface JigDrawingProps {
  inputs: FrameInputs
  result: FrameResult
  jig: Jig
  unit?: LengthUnit
  /** The enlarged view shows every dimension; the small one only the key ones. */
  detailed?: boolean
}

/**
 * A side-view schematic of the level-spine jig around the frame. The rear axle is
 * the origin and the spine runs level above the axle line. The seat tube carrier
 * hangs on a post below the spine and turns about the BB; the head tube carrier
 * stands on a post above it and turns about the bottom of the head tube.
 * The jig parts are solid; the frame's tube outlines are drawn over them so you can see where the frame meets the jig.
 */
export function JigDrawing({ inputs, result, jig, unit = "mm", detailed = false }: JigDrawingProps) {
  const [ref, width] = useElementWidth<SVGSVGElement>()
  const axle = result.points?.rearAxle
  if (!axle) return null
  const frame = buildDrawing(inputs, result, { x: -axle.x, y: -axle.y })
  if (!frame) return null

  // The picture has y down, so a height above the axle line is negative.
  const Y = (up: number) => -up
  const st = (id: string) => jig.stations.find((s) => s.id === id)!
  const { uMin, uMax, bottom, top } = jig.spine
  const dims = sideDims(jig).filter((d) => detailed || d.key)
  const map = (p: Vec2): Vec2 => ({ x: p.x, y: -p.y })

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
      return { x, y: yTop, width: POST_WIDTH, height: c.postLength }
    }
    const yBottom = Y(top - POST_OVERLAP)
    return { x, y: yBottom - c.postLength, width: POST_WIDTH, height: c.postLength }
  }

  // The rear standoff block is the 80 x 40 profile; its 40 face is what shows from the side, on the spine's face,
  // hanging from the spine's bottom edge to a little below the axle.
  const standoffTop = Y(bottom)
  const standoffBottom = Y(0) + 40

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
    ...dims.flatMap((d) => {
      const g = dimGeometry(d)
      return [map(g.a), map(g.b)]
    }),
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
      aria-label="Side-view schematic of the level-spine jig around the frame, to scale"
      className="h-auto w-full"
    >
      {/* the wheels, quietly, behind everything */}
      <g className="fill-none stroke-muted-foreground" strokeWidth={1} {...thin}>
        {frame.wheels.map((w, i) => (
          <circle key={i} cx={w.tire.cx} cy={w.tire.cy} r={w.tire.r} strokeOpacity={0.35} strokeDasharray="4 4" />
        ))}
      </g>

      {/* axle-to-axle line and the spine's height above it */}
      <line x1={uMin} y1={0} x2={st("frontAxle").x + 60} y2={0} className="stroke-muted-foreground" strokeDasharray="10 4 2 4" strokeWidth={1} {...thin} />
      <text x={st("frontAxle").x + 60 + fs * 0.4} y={0} dominantBaseline="central" fontSize={fs * 0.9} className="fill-muted-foreground">
        axle line
      </text>
      {/* the jig: solid, and in front of the frame */}
      <g style={{ filter: "drop-shadow(0 1px 2px color-mix(in oklab, var(--foreground) 35%, transparent))" }}>
      {jig.carriers.map((c) => {
        const r = postRect(c)
        return <rect key={`post-${c.id}`} x={r.x} y={r.y} width={r.width} height={r.height} className="fill-secondary stroke-foreground" strokeWidth={1.5} {...thin} />
      })}
      <rect x={uMin} y={Y(top)} width={uMax - uMin} height={SPINE_HEIGHT} className="fill-secondary stroke-foreground" strokeWidth={1.75} {...thin} />

      {/* rear axle standoff: a block on the spine's face reaching down to the axle */}
      <rect x={-CARRIER_WIDTH / 4} y={standoffTop} width={CARRIER_WIDTH / 2} height={standoffBottom - standoffTop} className="fill-secondary stroke-foreground" strokeWidth={1.25} {...thin} />

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
              strokeWidth={1.5}
              {...thin}
            />
          </g>
        )
      })}
      </g>

      {/* the frame's tube outlines, in front of the jig so you can see where they meet it */}
      <g className="fill-none stroke-foreground" strokeWidth={1.25} strokeOpacity={0.75} {...thin}>
        {frame.tubes.map((t) => (
          <polygon key={t.role + t.a.x} points={pts(t.corners)} />
        ))}
      </g>

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

      {/* tube angles */}
      {jig.carriers.map((c) => {
        const sh = carrierShape(c)
        const lab = sh.end(c.length - ALLOWANCE + 55)
        return (
          <g key={c.id}>
            <text x={lab.x} y={lab.y} textAnchor="middle" dominantBaseline="central" fontSize={fs * 0.75} className="fill-foreground stroke-background font-mono" strokeWidth={fs * 0.3} paintOrder="stroke" strokeLinejoin="round">
              {formatAngle(c.tubeAngle)}
            </text>
          </g>
        )
      })}

      <DimLines dims={dims} map={map} fs={fs * 0.65} format={(mm) => formatLengthValue(mm, unit)} />
    </svg>
  )
}
