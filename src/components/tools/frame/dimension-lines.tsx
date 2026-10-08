"use client"

import { dimGeometry, type JigDim, type Vec2 } from "@/lib/frame"

const thin = { vectorEffect: "non-scaling-stroke" } as const

interface DimLinesProps {
  dims: JigDim[]
  /** From the dimension's own coordinates (mm) to the picture's. */
  map: (p: Vec2) => Vec2
  /** Text size in drawing units. */
  fs: number
  /** How a length reads. */
  format: (mm: number) => string
}

/**
 * Dimension lines with a line at each end running back to the feature it
 * measures, an arrow at each end of the dimension, and the number in the middle
 * on a halo so it stays readable over the drawing.
 */
export function DimLines({ dims, map, fs, format }: DimLinesProps) {
  const arrow = fs * 0.9
  return (
    <g className="fill-none stroke-primary" strokeWidth={1} {...thin}>
      {dims.map((d) => {
        const g = dimGeometry(d)
        const a = map(g.a)
        const b = map(g.b)
        const from = map(d.from)
        const to = map(d.to)
        const dx = b.x - a.x
        const dy = b.y - a.y
        const len = Math.hypot(dx, dy)
        if (len < 1e-6) return null
        const u = { x: dx / len, y: dy / len }
        const n = { x: -u.y, y: u.x }
        const tip = (p: Vec2, dir: number) => {
          const base = { x: p.x - u.x * arrow * dir, y: p.y - u.y * arrow * dir }
          return `${p.x},${p.y} ${base.x + n.x * arrow * 0.3},${base.y + n.y * arrow * 0.3} ${base.x - n.x * arrow * 0.3},${base.y - n.y * arrow * 0.3}`
        }
        // The extension line runs from the feature to just past the dimension line.
        const ext = (feature: Vec2, end: Vec2) => {
          const ex = end.x - feature.x
          const ey = end.y - feature.y
          const l = Math.hypot(ex, ey)
          if (l < 1e-6) return null
          return <line x1={feature.x} y1={feature.y} x2={end.x + (ex / l) * arrow * 0.5} y2={end.y + (ey / l) * arrow * 0.5} strokeOpacity={0.6} strokeDasharray="none" />
        }
        const mid = { x: (a.x + b.x) / 2, y: (a.y + b.y) / 2 }
        let angle = (Math.atan2(dy, dx) * 180) / Math.PI
        if (angle > 90) angle -= 180
        if (angle < -90) angle += 180
        const upright = d.kind !== "aligned"
        return (
          <g key={d.id}>
            {ext(from, a)}
            {ext(to, b)}
            <line x1={a.x} y1={a.y} x2={b.x} y2={b.y} />
            <polygon points={tip(a, -1)} className="fill-primary" strokeWidth={0.5} />
            <polygon points={tip(b, 1)} className="fill-primary" strokeWidth={0.5} />
            <text
              x={mid.x}
              y={mid.y}
              textAnchor="middle"
              dominantBaseline="central"
              fontSize={fs}
              transform={upright ? undefined : `rotate(${angle} ${mid.x} ${mid.y})`}
              className="fill-foreground stroke-background font-mono"
              strokeWidth={fs * 0.4}
              paintOrder="stroke"
              strokeLinejoin="round"
              style={{ strokeOpacity: 1 }}
            >
              {format(d.value)}
            </text>
          </g>
        )
      })}
    </g>
  )
}
