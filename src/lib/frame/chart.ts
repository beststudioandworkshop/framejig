// The taxonomy chart: every style (and family) as a box showing where its typical
// ranges sit on two measures. Pure data; the SVG component only draws it.
import { CATEGORIES } from "./categories"
import type { RangeKey } from "./category-types"
import { profileFor } from "./profile"
import { STYLES } from "./styles"
import type { BikeType } from "./types"

export type ChartView = "steering" | "angles" | "stance"

export interface ChartViewInfo {
  label: string
  blurb: string
  x: RangeKey
  y: RangeKey
}

export const CHART_VIEWS: Record<ChartView, ChartViewInfo> = {
  steering: {
    label: "Steering and length",
    blurb: "How long the bike is against how much the steering wants to go straight. Up and to the right is long and stable.",
    x: "wheelbase",
    y: "trail",
  },
  angles: {
    label: "Angles",
    blurb: "Head angle against seat angle. To the left is slack and relaxed, to the right steep and sharp.",
    x: "headTubeAngle",
    y: "seatTubeAngle",
  },
  stance: {
    label: "Back end and bottom bracket",
    blurb: "Chainstay length against BB drop. High up is a low bottom bracket; right is a long rear end.",
    x: "chainstayLength",
    y: "bbDrop",
  },
}

export interface ChartBox {
  family: BikeType
  /** The style id, or null for the family's own range. */
  style: string | null
  label: string
  x: [number, number]
  y: [number, number]
}

export interface Chart {
  view: ChartView
  boxes: ChartBox[]
  xDomain: [number, number]
  yDomain: [number, number]
}

/** Every style and family as a box, with a domain that fits them all. */
export function taxonomyChart(view: ChartView): Chart {
  const { x, y } = CHART_VIEWS[view]
  const boxes: ChartBox[] = []
  for (const family of Object.keys(CATEGORIES) as BikeType[]) {
    const f = CATEGORIES[family]
    boxes.push({ family, style: null, label: f.label, x: [f.ranges[x].low, f.ranges[x].high], y: [f.ranges[y].low, f.ranges[y].high] })
  }
  for (const s of STYLES) {
    const p = profileFor(s.family, s.id)
    boxes.push({ family: s.family, style: s.id, label: s.label, x: [p.ranges[x].low, p.ranges[x].high], y: [p.ranges[y].low, p.ranges[y].high] })
  }
  const lo = (pick: (b: ChartBox) => number) => Math.min(...boxes.map(pick))
  const hi = (pick: (b: ChartBox) => number) => Math.max(...boxes.map(pick))
  const pad = (a: number, b: number): [number, number] => [a - (b - a) * 0.05, b + (b - a) * 0.05]
  return {
    view,
    boxes,
    xDomain: pad(lo((b) => b.x[0]), hi((b) => b.x[1])),
    yDomain: pad(lo((b) => b.y[0]), hi((b) => b.y[1])),
  }
}

/** Round tick values inside a domain, about `count` of them. */
export function niceTicks(domain: [number, number], count = 6): number[] {
  const [a, b] = domain
  const raw = (b - a) / count
  const mag = 10 ** Math.floor(Math.log10(raw))
  const step = [1, 2, 5, 10].map((m) => m * mag).find((s) => s >= raw) ?? 10 * mag
  const out: number[] = []
  for (let t = Math.ceil(a / step) * step; t <= b + 1e-9; t += step) out.push(Number(t.toFixed(6)))
  return out
}
