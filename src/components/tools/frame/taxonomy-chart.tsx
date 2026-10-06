"use client"

import { BIKE_TYPES, BIKE_TYPE_LABELS, CHART_VIEWS, niceTicks, taxonomyChart, type BikeType, type ChartView } from "@/lib/frame"
import { useElementWidth } from "./use-element-width"

// Static class names so Tailwind can see them.
const TONE: Record<BikeType, { fill: string; stroke: string; swatch: string }> = {
  road: { fill: "fill-tone-tangerine/25", stroke: "stroke-tone-tangerine", swatch: "bg-tone-tangerine" },
  gravel: { fill: "fill-tone-mustard/25", stroke: "stroke-tone-mustard", swatch: "bg-tone-mustard" },
  mountain: { fill: "fill-tone-tea/25", stroke: "stroke-tone-tea", swatch: "bg-tone-tea" },
  touring: { fill: "fill-tone-sky/30", stroke: "stroke-tone-sky", swatch: "bg-tone-sky" },
  track: { fill: "fill-tone-lavender/25", stroke: "stroke-tone-lavender", swatch: "bg-tone-lavender" },
  bruiser: { fill: "fill-tone-pink/30", stroke: "stroke-tone-pink", swatch: "bg-tone-pink" },
}

const W = 760
const H = 640
const M = { left: 58, right: 14, top: 12, bottom: 46 }

interface TaxonomyChartProps {
  view: ChartView
  /** The family and style being looked at. */
  selected: { family: BikeType; style: string | null }
  showFamilies: boolean
  onSelect: (family: BikeType, style: string | null) => void
}

export function TaxonomyChart({ view, selected, showFamilies, onSelect }: TaxonomyChartProps) {
  const [ref, width] = useElementWidth<SVGSVGElement>()
  const chart = taxonomyChart(view)
  const info = CHART_VIEWS[view]
  const { xDomain, yDomain } = chart
  const px = (v: number) => M.left + ((v - xDomain[0]) / (xDomain[1] - xDomain[0])) * (W - M.left - M.right)
  const py = (v: number) => H - M.bottom - ((v - yDomain[0]) / (yDomain[1] - yDomain[0])) * (H - M.top - M.bottom)
  // Text stays about 10 px on screen whatever the width.
  const fs = Math.max(10, width > 0 ? (10 * W) / width : 12)
  const unitOf = (k: "x" | "y") => (info[k].endsWith("Angle") ? "°" : " mm")
  const labelOf = (k: "x" | "y") => (k === "x" ? xLabel : yLabel)
  const xLabel = info.x === "wheelbase" ? "Wheelbase" : info.x === "headTubeAngle" ? "Head tube angle" : "Chainstay length"
  const yLabel = info.y === "trail" ? "Trail" : info.y === "seatTubeAngle" ? "Seat tube angle" : "BB drop"

  const isSelected = (b: { family: BikeType; style: string | null }) => b.family === selected.family && b.style === selected.style
  const families = chart.boxes.filter((b) => b.style === null)
  const styles = chart.boxes.filter((b) => b.style !== null)

  const rect = (b: (typeof chart.boxes)[number]) => {
    const x = px(b.x[0])
    const y = py(b.y[1])
    return { x, y, w: px(b.x[1]) - x, h: py(b.y[0]) - y }
  }
  const press = (b: (typeof chart.boxes)[number]) => ({
    role: "button" as const,
    tabIndex: 0,
    "aria-label": `${BIKE_TYPE_LABELS[b.family]}${b.style ? `, ${b.label}` : ", whole family"}`,
    "aria-pressed": isSelected(b),
    onClick: () => onSelect(b.family, b.style),
    onKeyDown: (e: React.KeyboardEvent) => {
      if (e.key === "Enter" || e.key === " ") {
        e.preventDefault()
        onSelect(b.family, b.style)
      }
    },
  })

  return (
    <div className="flex flex-col gap-3">
      <svg
        ref={ref}
        viewBox={`0 0 ${W} ${H}`}
        role="group"
        aria-label={`Chart of ${labelOf("y")} against ${labelOf("x")} for every kind of bike`}
        className="h-auto w-full"
      >
        {niceTicks(xDomain).map((t) => (
          <g key={`x${t}`}>
            <line x1={px(t)} x2={px(t)} y1={M.top} y2={H - M.bottom} className="stroke-border" strokeWidth={1} vectorEffect="non-scaling-stroke" />
            <text x={px(t)} y={H - M.bottom + fs * 1.4} textAnchor="middle" fontSize={fs} className="fill-muted-foreground">
              {t}
            </text>
          </g>
        ))}
        {niceTicks(yDomain).map((t) => (
          <g key={`y${t}`}>
            <line x1={M.left} x2={W - M.right} y1={py(t)} y2={py(t)} className="stroke-border" strokeWidth={1} vectorEffect="non-scaling-stroke" />
            <text x={M.left - 6} y={py(t)} textAnchor="end" dominantBaseline="central" fontSize={fs} className="fill-muted-foreground">
              {t}
            </text>
          </g>
        ))}
        <text x={(M.left + W - M.right) / 2} y={H - 6} textAnchor="middle" fontSize={fs * 1.05} className="fill-foreground">
          {xLabel} ({unitOf("x").trim() || "mm"})
        </text>
        <text
          transform={`translate(14 ${(M.top + H - M.bottom) / 2}) rotate(-90)`}
          textAnchor="middle"
          fontSize={fs * 1.05}
          className="fill-foreground"
        >
          {yLabel} ({unitOf("y").trim() || "mm"})
        </text>

        {showFamilies &&
          families.map((b) => {
            const r = rect(b)
            return (
              <rect
                key={`f-${b.family}`}
                x={r.x}
                y={r.y}
                width={r.w}
                height={r.h}
                rx={4}
                className={`cursor-pointer outline-none focus-visible:stroke-primary fill-transparent ${TONE[b.family].stroke}`}
                strokeWidth={isSelected(b) ? 3 : 1.5}
                strokeDasharray="6 4"
                vectorEffect="non-scaling-stroke"
                {...press(b)}
              />
            )
          })}
        {styles
          .filter((b) => !isSelected(b))
          .concat(styles.filter(isSelected))
          .map((b) => {
            const r = rect(b)
            const sel = isSelected(b)
            return (
              <g key={`s-${b.family}-${b.style}`}>
                <rect
                  x={r.x}
                  y={r.y}
                  width={r.w}
                  height={r.h}
                  rx={3}
                  className={`cursor-pointer outline-none focus-visible:stroke-primary ${TONE[b.family].fill} ${sel ? "stroke-primary" : TONE[b.family].stroke}`}
                  strokeWidth={sel ? 3 : 1.25}
                  vectorEffect="non-scaling-stroke"
                  {...press(b)}
                />
                <text
                  x={r.x + r.w / 2}
                  y={r.y + r.h / 2}
                  textAnchor="middle"
                  dominantBaseline="central"
                  fontSize={fs * 0.95}
                  className="pointer-events-none fill-foreground stroke-background"
                  strokeWidth={fs * 0.35}
                  paintOrder="stroke"
                  strokeLinejoin="round"
                >
                  {b.label}
                </text>
              </g>
            )
          })}
      </svg>
      <ul className="flex flex-wrap gap-x-4 gap-y-1 text-sm" aria-label="Key">
        {BIKE_TYPES.map((t) => (
          <li key={t} className="flex items-center gap-1.5">
            <span className={`size-3 rounded-sm ${TONE[t].swatch}`} />
            {BIKE_TYPE_LABELS[t]}
          </li>
        ))}
      </ul>
    </div>
  )
}
