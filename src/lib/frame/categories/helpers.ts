import { buildFrame } from "../build"
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
