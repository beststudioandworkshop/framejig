"use client"

import { useElementWidth, labelSize } from "./use-element-width"
import {
  ALLOWANCE,
  buildDrawing,
  formatAngle,
  SPINE_WIDTH,
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
const rad = (d: number) => (d * Math.PI) / 180

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
 * A schematic of the tilted-spine jig around the frame. The rear axle is the
 * origin. The spine runs from it through the middle of the head tube, mounted
 * to a post behind. Carriers cross the spine along the seat and head tubes.
 * Numbers match the parts list. The hardware is drawn schematically.
 */
export function JigDrawing({ inputs, result, jig, parts }: JigDrawingProps) {
  const [ref, width] = useElementWidth<SVGSVGElement>()
  const axle = result.points?.rearAxle
  if (!axle) return null
  const frame = buildDrawing(inputs, result, { x: -axle.x, y: -axle.y })
  if (!frame) return null

  const tau = rad(jig.tilt.degrees)
  const cos = Math.cos(tau)
  const sin = Math.sin(tau)
  // Spine coordinates (u along, v across, v up) to the picture (x right, y down).
  const map = (u: number, v: number): Vec2 => ({ x: u * cos - v * sin, y: -(u * sin + v * cos) })
  const st = (id: string) => jig.stations.find((s) => s.id === id)!
  const callout = (id: string) => parts.find((p) => p.id === id)?.callout ?? 0
  const { uMin, uMax, postU } = jig.spine

  const carrierBox = (c: JigCarrier) => {
    const lo = Math.min(0, ...c.stops.map((s) => s.along))
    const hi = Math.max(0, ...c.stops.map((s) => s.along))
    const cu = c.crossing ?? 0
    const phi = rad(c.angleToSpine)
    const dir = { u: Math.cos(phi), v: Math.sin(phi) }
    const end = (a: number) => ({ u: cu + dir.u * a, v: dir.v * a })
    return { lo, hi, cu, phi, dir, end }
  }

  const post = map(postU, 0)
  const postBottom = post.y + jig.settings.postHeight
  const arcR = 150

  // Everything that has to fit in the picture.
  const spineCorners = [map(uMin, -SPINE_WIDTH / 2), map(uMax, -SPINE_WIDTH / 2), map(uMax, SPINE_WIDTH / 2), map(uMin, SPINE_WIDTH / 2)]
  const carrierEnds = jig.carriers.flatMap((c) => {
    const b = carrierBox(c)
    return [b.end(b.lo - ALLOWANCE), b.end(b.hi + ALLOWANCE + 90)].map((e) => map(e.u, e.v))
  })
  const all: Vec2[] = [
    ...frame.tubes.flatMap((t) => t.corners),
    ...frame.wheels.flatMap((w) => [
      { x: w.tire.cx - w.tire.r, y: w.tire.cy - w.tire.r },
      { x: w.tire.cx + w.tire.r, y: w.tire.cy + w.tire.r },
    ]),
    ...spineCorners,
    ...carrierEnds,
    { x: post.x - 150, y: postBottom + 40 },
    { x: post.x + 150, y: postBottom + 40 },
    { x: -arcR - 50 - 220, y: 0 },
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
      { x: hb.x - (dx / len) * extra, y: -(hb.y - (dy / len) * extra) },
      { x: ht.x + (dx / len) * extra, y: -(ht.y + (dy / len) * extra) },
    ]
  }
  const hm = mandrel(50)
  const arcEnd = { x: arcR * cos, y: -arcR * sin }

  return (
    <svg
      ref={ref}
      viewBox={`${vb.x} ${vb.y} ${vb.width} ${vb.height}`}
      role="img"
      aria-label="Schematic of the tilted-spine jig around the frame, with numbered parts"
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

      {/* axle-to-axle line and the tilt */}
      <line x1={-arcR - 40} y1={0} x2={st("frontAxle").x + 60} y2={0} className="stroke-muted-foreground" strokeDasharray="10 4 2 4" strokeWidth={1} {...thin} />
      <text x={st("frontAxle").x + 60 + fs * 0.4} y={0} dominantBaseline="central" fontSize={fs * 0.9} className="fill-muted-foreground">
        axle line
      </text>
      <path d={`M ${arcR} 0 A ${arcR} ${arcR} 0 0 0 ${arcEnd.x} ${arcEnd.y}`} className="fill-none stroke-primary" strokeWidth={1.25} {...thin} />
      <text x={-arcR - 50} y={0} textAnchor="end" dominantBaseline="central" fontSize={fs} className="fill-foreground font-mono">
        {formatAngle(jig.tilt.degrees)} tilt
      </text>

      {/* the post, behind the spine */}
      <g className="fill-none stroke-muted-foreground" strokeWidth={1.25} strokeDasharray="6 4" {...thin}>
        <rect x={post.x - POST_WIDTH / 2} y={post.y} width={POST_WIDTH} height={jig.settings.postHeight} />
        <line x1={post.x - 150} y1={postBottom} x2={post.x + 150} y2={postBottom} strokeDasharray="none" />
      </g>
      <CalloutBadge n={callout("post")} x={post.x} y={post.y + jig.settings.postHeight * 0.75} fs={fs} />
      <CalloutBadge n={callout("base")} x={post.x + 150 + fs * 1.4} y={postBottom} fs={fs} />

      {/* spine, carriers and stations, drawn in spine coordinates */}
      <g transform={`rotate(${-jig.tilt.degrees})`}>
        <rect x={uMin} y={-SPINE_WIDTH / 2} width={uMax - uMin} height={SPINE_WIDTH} className="fill-secondary stroke-foreground" strokeWidth={1.5} {...thin} />
        {jig.carriers.map((c) => {
          const b = carrierBox(c)
          const mid = (b.lo + b.hi) / 2
          return (
            <g key={c.id} transform={`translate(${b.cu} 0) rotate(${90 - c.angleToSpine})`}>
              <rect
                x={-CARRIER_WIDTH / 2}
                y={-mid - c.length / 2}
                width={CARRIER_WIDTH}
                height={c.length}
                className="fill-secondary stroke-foreground"
                strokeWidth={1.25}
                fillOpacity={0.9}
                {...thin}
              />
            </g>
          )
        })}
        <rect x={-30} y={-30} width={60} height={60} className="fill-secondary stroke-foreground" strokeWidth={1.25} {...thin} />
        {jig.stations
          .filter((s) => s.id !== "frontAxle")
          .map((s) => (
            <circle key={s.id} cx={s.u} cy={-s.v} r={fs * 0.35} className="fill-primary stroke-background" strokeWidth={1} {...thin} />
          ))}
      </g>

      {/* mandrel through the head tube */}
      <line x1={hm[0].x} y1={hm[0].y} x2={hm[1].x} y2={hm[1].y} className="stroke-primary" strokeWidth={4} strokeLinecap="round" {...thin} />

      {/* spine pivot and badges (drawn upright, so placed with the same mapping) */}
      <circle cx={post.x} cy={post.y} r={fs * 0.4} className="fill-background stroke-primary" strokeWidth={1.25} {...thin} />
      <CalloutBadge n={callout("spine")} x={map(uMin + fs * 3, 0).x} y={map(uMin + fs * 3, 0).y} fs={fs} />
      <CalloutBadge n={callout("pivot")} x={post.x + fs * 1.8} y={post.y - fs * 1.4} fs={fs} />
      <CalloutBadge n={callout("rearStandoff")} x={map(0, -SPINE_WIDTH / 2 - fs * 1.4).x} y={map(0, -SPINE_WIDTH / 2 - fs * 1.4).y} fs={fs} />
      {jig.carriers.map((c) => {
        const b = carrierBox(c)
        const e = b.end(b.hi * 0.55 + (c.id === "head" ? 40 : 0))
        const m = map(e.u, e.v)
        const lab = b.end(b.hi + ALLOWANCE + 55)
        const l = map(lab.u, lab.v)
        return (
          <g key={c.id}>
            <CalloutBadge n={callout(c.id === "seat" ? "seatCarrier" : "headCarrier")} x={m.x} y={m.y} fs={fs} />
            <text x={l.x} y={l.y} textAnchor="middle" dominantBaseline="central" fontSize={fs * 0.9} className="fill-foreground font-mono">
              {formatAngle(c.angleToSpine)}
            </text>
          </g>
        )
      })}
      <CalloutBadge n={callout("mandrels")} x={hm[1].x + fs * 1.6} y={hm[1].y - fs} fs={fs} />
    </svg>
  )
}
