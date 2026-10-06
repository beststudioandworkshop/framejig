"use client"

import { buildDrawing, formatLengthValue, ALLOWANCE, type FrameInputs, type FrameResult, type Jig, type JigPart, type LengthUnit, type Vec2 } from "@/lib/frame"

const SPINE_HEIGHT = 120
const COLUMN_WIDTH = 60
const pts = (ps: Vec2[]) => ps.map((p) => `${p.x},${p.y}`).join(" ")

const thinStroke = { vectorEffect: "non-scaling-stroke" } as const

function CalloutBadge({ n, x, y, fs }: { n: number; x: number; y: number; fs: number }) {
  if (n <= 0) return null
  return (
    <g>
      <circle cx={x} cy={y} r={fs * 0.9} className="fill-background stroke-primary" strokeWidth={1.25} {...thinStroke} />
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
  unit: LengthUnit
}

/**
 * A schematic of the jig around the frame. The rear axle is the origin, the
 * spine runs parallel to the axle line, and columns rise from the spine to
 * each station. Numbers match the parts list.
 */
export function JigDrawing({ inputs, result, jig, parts, unit }: JigDrawingProps) {
  const axle = result.points?.rearAxle
  if (!axle) return null
  const frame = buildDrawing(inputs, result, { x: -axle.x, y: -axle.y })
  if (!frame) return null

  const off = jig.settings.spineOffset
  const st = (id: string) => jig.stations.find((s) => s.id === id)!
  const callout = (id: string) => parts.find((p) => p.id === id)?.callout ?? 0

  const xs = jig.stations.map((s) => s.x)
  const spineMin = Math.min(...xs) - ALLOWANCE
  const spineMax = Math.max(...xs) + ALLOWANCE

  const hb = st("headBottom")
  const ht = st("headTop")
  const mandrel = (a: { x: number; y: number }, b: { x: number; y: number }, extra: number): [Vec2, Vec2] => {
    const dx = b.x - a.x
    const dy = b.y - a.y
    const len = Math.hypot(dx, dy)
    return [
      { x: a.x - (dx / len) * extra, y: -(a.y - (dy / len) * extra) },
      { x: b.x + (dx / len) * extra, y: -(b.y + (dy / len) * extra) },
    ]
  }
  const hm = mandrel(hb, ht, 50)
  const allX = [
...frame.tubes.flatMap((t) => t.corners.map((c) => c.x)), ...frame.wheels.flatMap((w) => [w.tyre.cx - w.tyre.r, w.tyre.cx + w.tyre.r]), spineMin, spineMax, hm[0].x, hm[1].x]
  const allY = [...frame.tubes.flatMap((t) => t.corners.map((c) => c.y)), ...frame.wheels.flatMap((w) => [w.tyre.cy - w.tyre.r, w.tyre.cy + w.tyre.r]), off + SPINE_HEIGHT, hm[0].y, hm[1].y - 3 * 14]
  const margin = 70
  const vb = {
    x: Math.min(...allX) - margin,
    y: Math.min(...allY) - margin,
    width: Math.max(...allX) - Math.min(...allX) + 2 * margin,
    height: Math.max(...allY) - Math.min(...allY) + 2 * margin,
  }
  const fs = vb.width / 64
  const thin = { vectorEffect: "non-scaling-stroke" } as const

  // Columns rise from the top face of the spine (y = off, SVG down) to the station.
  const column = (id: string, x: number, topY: number, partId: string) => ({ id, x, topY, partId })
  const cols = [
    column("rearAxle", st("rearAxle").x, -st("rearAxle").y, "rearAxleBlock"),
    column("bb", st("bb").x, -st("bb").y, "bbRiser"),
    column("headTop", st("headTop").x, -st("headTop").y, "headColumn"),
    column("seatTop", st("seatTop").x, -st("seatTop").y, "seatColumn"),
    column("frontAxle", st("frontAxle").x, -st("frontAxle").y, "frontAxlePost"),
  ]

  return (
    <svg
      viewBox={`${vb.x} ${vb.y} ${vb.width} ${vb.height}`}
      role="img"
      aria-label="Schematic of the jig around the frame, with numbered parts"
      className="h-auto w-full min-w-160"
    >
      {/* the frame, quietly */}
      <g className="fill-none stroke-muted-foreground" strokeWidth={1} {...thin}>
        {frame.wheels.map((w, i) => (
          <circle key={i} cx={w.tyre.cx} cy={w.tyre.cy} r={w.tyre.r} strokeOpacity={0.35} strokeDasharray="4 4" />
        ))}
        {frame.tubes.map((t) => (
          <polygon key={t.role + t.a.x} points={pts(t.corners)} />
        ))}
      </g>

      {/* axle line */}
      <line x1={spineMin} y1={0} x2={spineMax} y2={0} className="stroke-muted-foreground" strokeDasharray="10 4 2 4" strokeWidth={1} {...thin} />
      <text x={spineMax + fs * 0.4} y={0} dominantBaseline="central" fontSize={fs * 0.9} className="fill-muted-foreground">
        axle line
      </text>

      {/* columns */}
      {cols.map((c) => (
        <g key={c.id}>
          <rect
            x={c.x - COLUMN_WIDTH / 2}
            y={c.topY}
            width={COLUMN_WIDTH}
            height={Math.max(off - c.topY, 0)}
            className="fill-secondary stroke-foreground"
            strokeWidth={1.25}
            {...thin}
          />
          <CalloutBadge fs={fs} n={callout(c.partId)} x={c.x} y={(c.topY + off) / 2} />
        </g>
      ))}

      {/* spine */}
      <rect x={spineMin} y={off} width={spineMax - spineMin} height={SPINE_HEIGHT} className="fill-secondary stroke-foreground" strokeWidth={1.5} {...thin} />
      <CalloutBadge fs={fs} n={callout("spine")} x={spineMin + fs * 2} y={off + SPINE_HEIGHT / 2} />
      <text x={(spineMin + spineMax) / 2} y={off + SPINE_HEIGHT / 2} textAnchor="middle" dominantBaseline="central" fontSize={fs * 0.9} className="fill-muted-foreground">
        spine face is {formatLengthValue(off, unit)} {unit} below the axle line
      </text>

      {/* mandrels */}
      <line x1={hm[0].x} y1={hm[0].y} x2={hm[1].x} y2={hm[1].y} className="stroke-primary" strokeWidth={4} strokeLinecap="round" {...thin} />
      <CalloutBadge fs={fs} n={callout("mandrels")} x={hm[1].x + fs * 1.6} y={hm[1].y - fs} />

      {/* stations */}
      {jig.stations.map((s) => (
        <circle key={s.id} cx={s.x} cy={-s.y} r={fs * 0.35} className="fill-primary stroke-background" strokeWidth={1} {...thin} />
      ))}

      {/* forward positions along the spine */}
      {jig.stations.map((s, i) => (
        <text key={s.id} x={s.x} y={off + SPINE_HEIGHT + fs * (1.4 + (i % 2) * 1.3)} textAnchor="middle" fontSize={fs * 0.9} className="fill-foreground font-mono">
          {formatLengthValue(s.x, unit)}
        </text>
      ))}
    </svg>
  )
}
