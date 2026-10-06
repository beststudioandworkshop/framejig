// Sizes. A frame in each size is the medium example plus the category's grading
// step per size. The rules are my estimates, and sizing differs a lot between
// makers, so rider heights are rough.
import { buildFrame } from "./build"
import { syncDerived } from "./convert"
import { CATEGORIES } from "./categories"
import type { SizeId, SizeInfo } from "./category-types"
import type { BikeType, FrameInputs } from "./types"

export const SIZES: SizeInfo[] = [
  { id: "S", label: "Small", step: -1, riderCm: [160, 170] },
  { id: "M", label: "Medium", step: 0, riderCm: [170, 178] },
  { id: "L", label: "Large", step: 1, riderCm: [178, 186] },
  { id: "XL", label: "Extra large", step: 2, riderCm: [186, 195] },
]

export const sizeInfo = (id: SizeId): SizeInfo => SIZES.find((s) => s.id === id)!

/** The example frame for a category in a size. The medium is the example itself. */
export function sizedFrame(type: BikeType, size: SizeId): FrameInputs {
  const { base, grade } = CATEGORIES[type]
  const step = sizeInfo(size).step
  if (step === 0) return base
  const m = buildFrame(base).metrics!
  const graded: FrameInputs = {
    ...base,
    // Grade in reach and stack, then hand every derived number back.
    drivers: { ...base.drivers, horizontal: "reach", vertical: "stack", seat: "ct" },
    reach: m.reach + grade.reachStep * step,
    stack: m.stack + grade.stackStep * step,
    seatTubeLength: m.seatTubeLength + grade.seatTubeStep * step,
    headTubeAngle: base.headTubeAngle + grade.headAngleStep * step,
    seatTubeAngle: base.seatTubeAngle + grade.seatAngleStep * step,
  }
  return { ...syncDerived(graded, buildFrame(graded)), drivers: base.drivers }
}

export interface SizeSuggestion {
  size: SizeId
  /** Set when the height is close to the edge between two sizes. */
  between: [SizeId, SizeId] | null
  note: string
}

const EDGE_CM = 2

/** "a small", "an extra large". */
const a = (label: string) => `${/^[aeiou]/i.test(label) ? "an" : "a"} ${label.toLowerCase()}`

/**
 * A rough size for a rider's height (mm). Sizing differs a lot between makers,
 * so this is a starting point; the note says to check reach and standover.
 */
export function suggestSize(heightMm: number): SizeSuggestion | null {
  if (!Number.isFinite(heightMm) || heightMm < 1000 || heightMm > 2300) return null
  const cm = heightMm / 10
  const first = SIZES[0]
  const last = SIZES[SIZES.length - 1]
  if (cm < first.riderCm[0]) {
    return { size: first.id, between: null, note: `Shorter than the small range (${first.riderCm[0]} to ${first.riderCm[1]} cm). Start with a small and expect to adjust, or look for smaller frames.` }
  }
  if (cm >= last.riderCm[1]) {
    return { size: last.id, between: null, note: `Taller than the extra large range (${last.riderCm[0]} to ${last.riderCm[1]} cm). Start with an extra large and expect to adjust.` }
  }
  const i = SIZES.findIndex((s) => cm >= s.riderCm[0] && cm < s.riderCm[1])
  const s = SIZES[i]
  const next = SIZES[i + 1]
  const prev = SIZES[i - 1]
  const choose = "Choose by reach: longer reach if you like to stretch out, shorter if you like it upright."
  if (next && s.riderCm[1] - cm <= EDGE_CM) {
    return { size: s.id, between: [s.id, next.id], note: `Between ${a(s.label)} and ${a(next.label)}. ${choose}` }
  }
  if (prev && cm - s.riderCm[0] < EDGE_CM) {
    return { size: s.id, between: [prev.id, s.id], note: `Between ${a(prev.label)} and ${a(s.label)}. ${choose}` }
  }
  return { size: s.id, between: null, note: `${a(s.label)[0].toUpperCase()}${a(s.label).slice(1)} fits riders about ${s.riderCm[0]} to ${s.riderCm[1]} cm. Sizing differs between makers, so check the reach and standover.` }
}
