// What the reference charts say about each style, and where they don't say anything.
// A style is matched to the charts of the bikes that belong in it (the matching is a judgment call, listed below
// and shown on the Frame logic page). The typical ranges are then read from those charts. A range that no chart
// covers stays an assumed estimate, and the page says so.
import type { RangeKey } from "./category-types"
import { chartValue, REFERENCE_CHARTS, type ReferenceChart } from "./reference-charts"
import { STYLES } from "./styles"
import type { BikeType } from "./types"

/** Where a range came from. */
export type RangeBasis = "charts" | "charts-wheel" | "assumed"

export const BASIS_LABEL: Record<RangeBasis, string> = {
  charts: "From charts",
  "charts-wheel": "From charts, wheel assumed",
  assumed: "Assumed",
}

export interface ChartPick {
  id: string
  /** Only these sizes (or frames) of the chart, when the chart mixes things. */
  sizes?: string[]
}

/** Which charts belong to which style. A style with none stays entirely assumed. */
export const STYLE_CHARTS: Record<string, (string | ChartPick)[]> = {
  endurance: ["surly-pacer", "trek-domane-al-2025"],
  cross: ["surly-cross-check"],
  "gravel-race": ["surly-midnight-special", "2026-trek-bikes-checkpoint-al3"],
  adventure: ["surly-bridge-club", "crust-scapegoat", "ritchey-ascent-2025", "2025-crust-bikes-bombora-base", "surly-ogre"],
  "all-road": ["surly-straggler-700c", "surly-straggler-650b", "surly-preamble"],
  xc: ["surly-karate-monkey"],
  trail: ["salsa-timberjack", "ritchey-timberwolf-2018", "surly-wednesday", "trek-marlin-5-2026"],
  "all-mountain": ["2025-specialized-bicycles-status-v2-140", "surly-grappler"],
  enduro: ["2023-specialized-bicycles-enduro-expert-low-bb", "2021-trek-bikes-slash-8"],
  downhill: ["specialized-demo-race-2020", "2025-trek-bikes-session-8"],
  "dirt-jump": ["2024-specialized-bicycles-p-3-base"],
  fat: ["surly-pugsley", "surly-moonlander", "2025-trek-bikes-farley-7"],
  expedition: ["surly-disc-trucker-26", "surly-disc-trucker-700c", "surly-troll"],
  randonneur: ["trek-520-2017", "trek-520-1992"],
  street: ["surly-steamroller"],
  "retro-mtb": [
    "specialized-stumpjumper-1996",
    "1997-trek-bikes-850-base",
    "1998-trek-bikes-930-base",
    "1999-schwinn-bicycle-company-homegrown-homegrown-pro",
  ],
  "big-bmx": [{ id: "free-agent-2020", sizes: ['Ratio (24")', 'Team Limo 24 (24")', 'Ambush 24 (24")', 'Crux (26")', 'Metus (26")'] }],
  "beach-cruiser": ["schwinn-s1"],
}

export interface RangeEvidence {
  low: number
  high: number
  basis: RangeBasis
}

export interface Evidence {
  /** The chart ids used. */
  charts: string[]
  /** How many bikes (models) that is. */
  bikes: number
  ranges: Partial<Record<RangeKey, RangeEvidence>>
  position?: { low: number; high: number }
  /** The fork axle-to-crown the charts give, mm (the middle of the bikes). */
  fork?: number
}

/** A range narrower than this is widened around its middle: one or two bikes don't prove a narrow band. */
const MIN_WIDTH: Record<RangeKey | "position", number> = {
  headTubeAngle: 2,
  seatTubeAngle: 2,
  bbDrop: 10,
  trail: 12,
  chainstayLength: 20,
  wheelbase: 40,
  position: 0.08,
}
const STEP: Record<RangeKey | "position", number> = {
  headTubeAngle: 0.5,
  seatTubeAngle: 0.5,
  bbDrop: 5,
  trail: 5,
  chainstayLength: 5,
  wheelbase: 5,
  position: 0.01,
}

const rad = (d: number) => (d * Math.PI) / 180

/** The value a fraction of the way up the sorted list. */
function quantile(sorted: number[], q: number): number {
  const pos = (sorted.length - 1) * q
  const lo = Math.floor(pos)
  const hi = Math.ceil(pos)
  return sorted[lo] + (sorted[hi] - sorted[lo]) * (pos - lo)
}

function span(values: number[], key: RangeKey | "position"): { low: number; high: number } {
  // With plenty of numbers the extremes are cut off (a family holds a few odd bikes); with few, every one counts.
  const sorted = [...values].sort((a, b) => a - b)
  let lo = sorted.length >= 12 ? quantile(sorted, 0.1) : sorted[0]
  let hi = sorted.length >= 12 ? quantile(sorted, 0.9) : sorted[sorted.length - 1]
  const w = MIN_WIDTH[key]
  if (hi - lo < w) {
    const mid = (lo + hi) / 2
    lo = mid - w / 2
    hi = mid + w / 2
  }
  const step = STEP[key]
  const round = (v: number) => Number(v.toFixed(2))
  return { low: round(Math.floor(lo / step + 1e-9) * step), high: round(Math.ceil(hi / step - 1e-9) * step) }
}

const chartOf = (id: string): ReferenceChart | undefined => REFERENCE_CHARTS.find((c) => c.id === id)

/** The ranges the charts give, for a wheel of the style's assumed size. Null if there are no charts. */
export function deriveEvidence(picks: (string | ChartPick)[], wheel: { rimDiameter: number; tireSection: number }): Evidence | null {
  const R = wheel.rimDiameter / 2 + wheel.tireSection
  const v: Record<RangeKey | "position", number[]> = { headTubeAngle: [], seatTubeAngle: [], bbDrop: [], trail: [], chainstayLength: [], wheelbase: [], position: [] }
  let bbFromHeight = false
  const forks: number[] = []
  const used: string[] = []
  for (const p of picks) {
    const pick = typeof p === "string" ? { id: p } : p
    const chart = chartOf(pick.id)
    if (!chart) continue
    const idx = chart.sizes.map((_, i) => i).filter((i) => !pick.sizes || pick.sizes.includes(chart.sizes[i]))
    if (idx.length === 0) continue
    used.push(chart.id)
    const mid = idx[Math.floor((idx.length - 1) / 2)]
    for (const i of idx) {
      const hta = chartValue(chart, "headTubeAngle", i)
      const sta = chartValue(chart, "seatTubeAngle", i)
      const cs = chartValue(chart, "chainstay", i)
      const drop = chartValue(chart, "bbDrop", i)
      const height = chartValue(chart, "bbHeight", i)
      const rake = chartValue(chart, "forkOffset", i)
      if (hta !== undefined) v.headTubeAngle.push(hta)
      if (sta !== undefined) v.seatTubeAngle.push(sta)
      if (cs !== undefined) v.chainstayLength.push(cs)
      if (drop !== undefined) v.bbDrop.push(drop)
      else if (height !== undefined) {
        v.bbDrop.push(R - height)
        bbFromHeight = true
      }
      if (hta !== undefined && rake !== undefined) v.trail.push((R * Math.cos(rad(hta)) - rake) / Math.sin(rad(hta)))
    }
    const fork = chartValue(chart, "forkAxleToCrown", mid)
    if (fork !== undefined) forks.push(fork)
    const wb = chartValue(chart, "wheelbase", mid)
    if (wb !== undefined) v.wheelbase.push(wb)
    const stack = chartValue(chart, "stack", mid)
    const reach = chartValue(chart, "reach", mid)
    if (stack !== undefined && reach !== undefined) v.position.push(stack / reach)
  }
  if (used.length === 0) return null
  const ranges: Evidence["ranges"] = {}
  for (const k of ["headTubeAngle", "seatTubeAngle", "bbDrop", "trail", "chainstayLength", "wheelbase"] as RangeKey[]) {
    if (v[k].length === 0) continue
    const basis: RangeBasis = k === "trail" || (k === "bbDrop" && bbFromHeight) ? "charts-wheel" : "charts"
    ranges[k] = { ...span(v[k], k), basis }
  }
  forks.sort((a, b) => a - b)
  const fork = forks.length ? forks[Math.floor((forks.length - 1) / 2)] : undefined
  return { charts: used, bikes: used.length, ranges, position: v.position.length ? span(v.position, "position") : undefined, fork }
}

/** The charts that belong to a style, or to the whole family when no style is named. */
export function picksFor(type: BikeType, styleId: string | null): (string | ChartPick)[] {
  if (styleId) return STYLE_CHARTS[styleId] ?? []
  return STYLES.filter((s) => s.family === type).flatMap((s) => STYLE_CHARTS[s.id] ?? [])
}

/** A readable name for a chart: maker and model. */
export function chartName(id: string): string {
  const c = chartOf(id)
  if (!c) return id
  if (!c.model) return c.maker
  // Some models already carry the maker's name ("2021 Trek Bikes Slash 8").
  const first = c.maker.split(" ")[0].toLowerCase()
  return c.model.toLowerCase().includes(first) ? c.model : `${c.maker} ${c.model}`
}

/** The reason for a range when its numbers came from charts: the plain physics, with no numbers that could disagree with the range. */
export const GENERIC_WHY: Record<RangeKey | "position", string> = {
  headTubeAngle: "A steeper head angle steers quicker and lighter. A slacker one is steadier at speed and easier on steep ground.",
  seatTubeAngle: "A steeper seat tube angle puts the rider further forward over the pedals; a slacker one sits them back and more relaxed.",
  trail: "More trail steadies the steering and makes the bike track straight. Less trail makes it lighter and quicker to turn.",
  wheelbase: "A longer wheelbase is calmer and more stable. A shorter one turns sooner and feels livelier. It grows with frame size, and the range is for a medium.",
  chainstayLength: "Short chainstays keep the rear end lively and the wheelbase compact. Long ones add stability and room for tires, fenders and bags.",
  bbDrop: "More drop puts the bottom bracket lower, so the bike feels planted. Less drop gives more room to pedal over bumps and obstacles. BMX frames put it at or above the axles.",
  position: "A higher stack for the reach sits the rider more upright; a lower one stretches them out and forward.",
}

/** The reason to show for a measure of a profile: the written one where the range is an assumption, the plain one where charts set it. */
export function whyFor(profile: { ranges: Record<RangeKey, { basis?: RangeBasis }>; positionBasis?: "charts" | "assumed"; rangeWhy: Record<RangeKey | "position", string> }, key: RangeKey | "position"): string {
  const fromCharts = key === "position" ? profile.positionBasis === "charts" : (profile.ranges[key].basis ?? "assumed") !== "assumed"
  return fromCharts ? GENERIC_WHY[key] : profile.rangeWhy[key]
}

/** True if any range of the profile was read from charts. */
export function isCharted(profile: { evidence?: { bikes: number } }): boolean {
  return (profile.evidence?.bikes ?? 0) > 0
}
