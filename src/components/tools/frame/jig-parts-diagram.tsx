"use client"

import { useElementWidth, labelSize } from "./use-element-width"
import { formatLengthValue, type JigDim, type JigPart, type LengthUnit, type Vec2 } from "@/lib/frame"
import { DimLines } from "./dimension-lines"

const thin = { vectorEffect: "non-scaling-stroke" } as const
const GAP = 230
const LEFT = 150

function CalloutBadge({ n, x, y, r, fs }: { n: number; x: number; y: number; r: number; fs: number }) {
  return (
    <g>
      <circle cx={x} cy={y} r={r} className="fill-background stroke-primary" strokeWidth={1.25} {...thin} />
      <text x={x} y={y} textAnchor="middle" dominantBaseline="central" fontSize={fs} className="fill-foreground font-mono">
        {n}
      </text>
    </g>
  )
}

interface JigPartsDiagramProps {
  parts: JigPart[]
  unit?: LengthUnit
  /** The enlarged view also names every mark along each part. */
  detailed?: boolean
}

/**
 * The jig's cut parts laid out flat, each to the same scale, with the profile size,
 * the cut length, and where things sit along it. No frame, and no jig orientation:
 * this is what you cut, and where the holes and stops go. Numbers match the list.
 */
export function JigPartsDiagram({ parts, unit = "mm", detailed = false }: JigPartsDiagramProps) {
  const [ref, width] = useElementWidth<SVGSVGElement>()
  const cut = parts.filter((p) => p.cutLength !== undefined && p.profile)
  if (cut.length === 0) return null

  const longest = Math.max(...cut.map((p) => p.cutLength!))
  const rows = cut.reduce<{ part: JigPart; y: number }[]>((acc, p) => {
    const prev = acc[acc.length - 1]
    const y = prev ? prev.y + prev.part.profile!.width + GAP : 110
    acc.push({ part: p, y })
    return acc
  }, [])
  const last = rows[rows.length - 1]
  const vb = { x: 0, y: 0, width: LEFT + longest + 220, height: last.y + last.part.profile!.width + 130 }
  const fs = labelSize(vb.width, width)
  const fmt = (mm: number) => formatLengthValue(mm, unit)
  const map = (p: Vec2): Vec2 => p

  const dims: JigDim[] = rows.map(({ part, y }) => ({
    id: part.id,
    name: part.name,
    from: { x: LEFT, y: y + part.profile!.width },
    to: { x: LEFT + part.cutLength!, y: y + part.profile!.width },
    kind: "x",
    at: y + part.profile!.width + 55,
    value: part.cutLength!,
    key: true,
  }))

  return (
    <svg
      ref={ref}
      viewBox={`${vb.x} ${vb.y} ${vb.width} ${vb.height}`}
      role="img"
      aria-label="The cut parts of the jig, each to scale, with cut lengths and where the pins and stops sit"
      className="h-auto w-full"
    >
      {rows.map(({ part, y }) => {
        const w = part.profile!.width
        const len = part.cutLength!
        return (
          <g key={part.id}>
            <rect x={LEFT} y={y} width={len} height={w} className="fill-secondary stroke-foreground" strokeWidth={1.5} {...thin} />
            {part.callout > 0 && <CalloutBadge n={part.callout} x={LEFT / 2 - 10} y={y + w / 2} r={fs * 1.1} fs={fs * 1.1} />}
            <text x={LEFT} y={y - fs * 2.6} fontSize={fs} className="fill-foreground font-medium">
              {part.name}
            </text>
            <text x={LEFT + len + 20} y={y + w / 2} dominantBaseline="central" fontSize={fs * 0.85} className="fill-muted-foreground font-mono">
              40 x {w}
            </text>
            {part.marks
              ?.filter((m) => m.at >= 0 && m.at <= len)
              .map((m) => (
                <g key={m.kind + m.label}>
                  {m.kind === "mount" ? (
                    <rect x={LEFT} y={y} width={m.at} height={w} className="fill-primary/10 stroke-primary" strokeWidth={1} strokeDasharray="6 4" {...thin} />
                  ) : m.kind === "pin" ? (
                    <circle cx={LEFT + m.at} cy={y + w / 2} r={fs * 0.6} className="fill-background stroke-primary" strokeWidth={1.75} {...thin} />
                  ) : (
                    <line x1={LEFT + m.at} y1={y} x2={LEFT + m.at} y2={y + w} className="stroke-primary" strokeWidth={1.5} {...thin} />
                  )}
                  <text
                    x={LEFT + (m.kind === "mount" ? m.at / 2 : m.at)}
                    y={y - fs * 0.9}
                    textAnchor="middle"
                    fontSize={fs * 0.8}
                    className="fill-foreground stroke-background"
                    strokeWidth={fs * 0.3}
                    paintOrder="stroke"
                    strokeLinejoin="round"
                  >
                    {detailed && m.kind !== "mount" ? `${m.label} ${fmt(m.at)}` : m.label}
                  </text>
                </g>
              ))}
          </g>
        )
      })}
      <DimLines dims={dims} map={map} fs={fs * 0.65} format={fmt} />
    </svg>
  )
}
