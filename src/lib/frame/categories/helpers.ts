import { buildFrame } from "../build"
import type { RangeTable } from "../category-types"
import { syncDerived } from "../convert"
import type { Band, RideProfile, Scale } from "../category-types"
import type { FrameInputs } from "../types"

/** An example frame with every derived number filled in, so switching drivers doesn't jump. */
export function completeFrame(raw: FrameInputs): FrameInputs {
  return syncDerived(raw, buildFrame(raw))
}

interface ScaleSpec {
  /** New band edges, one per band in the base scale. */
  below: number[]
  lo: number
  hi: number
}

interface RideSpec {
  disclaimer: string
  steering: ScaleSpec
  handling: ScaleSpec
  position: ScaleSpec
  weight: ScaleSpec
  bottomBracket: ScaleSpec
  shortChainstay: number
  longChainstay: number
  notes?: string[]
  /** Replace a band's text: key is `${scale}.${label}`, e.g. "steering.Neutral". */
  text?: Record<string, string>
}

function derive(name: string, base: Scale, spec: ScaleSpec, text: Record<string, string>): Scale {
  if (spec.below.length !== base.bands.length) {
    throw new Error(`${name}: expected ${base.bands.length} band edges, got ${spec.below.length}`)
  }
  const bands: Band[] = base.bands.map((b, i) => ({
    ...b,
    below: spec.below[i],
    text: text[`${name}.${b.label}`] ?? b.text,
  }))
  return {
    bands,
    last: { ...base.last, text: text[`${name}.${base.last.label}`] ?? base.last.text },
    lo: spec.lo,
    hi: spec.hi,
  }
}

/** A ride profile that keeps another's wording and moves its band edges. */
export function deriveRide(base: RideProfile, spec: RideSpec): RideProfile {
  const text = spec.text ?? {}
  return {
    disclaimer: spec.disclaimer,
    steering: derive("steering", base.steering, spec.steering, text),
    handling: derive("handling", base.handling, spec.handling, text),
    position: derive("position", base.position, spec.position, text),
    weight: derive("weight", base.weight, spec.weight, text),
    bottomBracket: derive("bottomBracket", base.bottomBracket, spec.bottomBracket, text),
    shortChainstay: { below: spec.shortChainstay, text: base.shortChainstay.text },
    longChainstay: { above: spec.longChainstay, text: base.longChainstay.text },
    notes: spec.notes ?? [],
  }
}

/** The caveat every category carries until its numbers come from reference charts. */
export const estimateDisclaimer = (kind: string) =>
  `Rules of thumb for ${kind} frames, and my own estimates rather than verified limits. Your weight, tires, fork, stem and bars all change how a bike feels, so use this to read the numbers, not as a verdict.`

const mid = (r: { low: number; high: number }) => (r.low + r.high) / 2
const rad = (d: number) => (d * Math.PI) / 180

/**
 * Fit a frame to the middle of a set of ranges: angles, BB drop and chainstay at
 * the middle, the fork rake chosen to land the trail there, the top tube chosen
 * for the wheelbase, and the head tube chosen for the stack to reach. The result
 * is an example that is inside its own ranges by construction. Wheels, seat tube
 * length and tubing come from `start`.
 */
export function fitToRanges(start: FrameInputs, ranges: RangeTable, position: { low: number; high: number }): FrameInputs {
  const a = rad(mid(ranges.headTubeAngle))
  const R = start.wheel.rimDiameter / 2 + start.wheel.tireSection
  let f: FrameInputs = {
    ...start,
    drivers: { bb: "drop", rear: "chainstay", seat: "ct", horizontal: "effectiveTopTube", vertical: "headTubeLength" },
    headTubeAngle: mid(ranges.headTubeAngle),
    seatTubeAngle: mid(ranges.seatTubeAngle),
    bbDrop: Math.round(mid(ranges.bbDrop) * 10) / 10,
    chainstayLength: Math.round(mid(ranges.chainstayLength) * 10) / 10,
    // trail = (R cos a - rake) / sin a, so rake = R cos a - trail sin a
    forkRake: Math.max(0, Math.round((R * Math.cos(a) - mid(ranges.trail) * Math.sin(a)) * 10) / 10),
  }
  // The wheelbase moves one for one with the effective top tube.
  for (let i = 0; i < 3; i++) {
    const m = buildFrame(f).metrics
    if (!m) break
    f = { ...f, effectiveTopTube: f.effectiveTopTube + (mid(ranges.wheelbase) - m.wheelbase) }
  }
  // The head tube sets stack to reach without touching the wheelbase.
  const target = mid(position)
  for (let i = 0; i < 6; i++) {
    const m = buildFrame(f).metrics
    if (!m) break
    const ratio = m.stack / m.reach
    const dH = ((target - ratio) * m.reach) / (Math.sin(a) + ratio * Math.cos(a))
    f = { ...f, headTubeLength: Math.min(400, Math.max(40, f.headTubeLength + dH)) }
  }
  return completeFrame(f)
}
