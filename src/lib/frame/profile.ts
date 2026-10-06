// The effective profile for a bike type and, optionally, a style within it: the
// family's data with the style's differences laid over it. Everything that needs
// ranges, ride-feel bands, an example frame or a grading rule asks here.
import { CATEGORIES } from "./categories"
import { fitToRanges } from "./categories/helpers"
import type { CategoryProfile, RangeKey, RangeTable, RideProfile, Scale } from "./category-types"
import { styleOf } from "./styles"
import type { BikeType } from "./types"

interface Span {
  low: number
  high: number
}

const lin = (v: number, from: Span, to: Span) => to.low + ((v - from.low) * (to.high - to.low)) / (from.high - from.low)

/** Move a scale's band edges and ends with a range, so the bands keep their place in it. */
function remap(scale: Scale, from: Span, to: Span): Scale {
  return {
    bands: scale.bands.map((b) => ({ ...b, below: lin(b.below, from, to) })),
    last: scale.last,
    lo: lin(scale.lo, from, to),
    hi: lin(scale.hi, from, to),
  }
}

function remapRide(ride: RideProfile, from: RangeTable, fromPos: Span, to: RangeTable, toPos: Span): RideProfile {
  const span = (t: RangeTable, k: RangeKey): Span => ({ low: t[k].low, high: t[k].high })
  return {
    ...ride,
    steering: remap(ride.steering, span(from, "trail"), span(to, "trail")),
    handling: remap(ride.handling, span(from, "wheelbase"), span(to, "wheelbase")),
    position: remap(ride.position, fromPos, toPos),
    weight: remap(ride.weight, span(from, "seatTubeAngle"), span(to, "seatTubeAngle")),
    bottomBracket: remap(ride.bottomBracket, span(from, "bbDrop"), span(to, "bbDrop")),
    shortChainstay: {
      ...ride.shortChainstay,
      below: lin(ride.shortChainstay.below, span(from, "chainstayLength"), span(to, "chainstayLength")),
    },
    longChainstay: {
      ...ride.longChainstay,
      above: lin(ride.longChainstay.above, span(from, "chainstayLength"), span(to, "chainstayLength")),
    },
  }
}

const cache = new Map<string, CategoryProfile>()

/** The profile for a type and an optional style. An unknown style gives the family's own profile. */
export function profileFor(type: BikeType, style?: string | null): CategoryProfile {
  const key = `${type}:${style ?? ""}`
  const hit = cache.get(key)
  if (hit) return hit

  const family = CATEGORIES[type]
  const s = styleOf(type, style)
  if (!s) {
    cache.set(key, family)
    return family
  }

  const ranges = Object.fromEntries(
    (Object.keys(family.ranges) as RangeKey[]).map((k) => [k, { ...family.ranges[k], ...(s.ranges?.[k] ?? {}) }]),
  ) as RangeTable
  const positionRange = s.positionRange ?? family.positionRange
  const changed = s.ranges !== undefined || s.positionRange !== undefined || s.wheel !== undefined || s.crankLength !== undefined || s.forkAxleToCrown !== undefined

  const start = {
    ...family.base,
    bikeStyle: s.id,
    wheel: s.wheel ?? family.base.wheel,
    crankLength: s.crankLength ?? family.base.crankLength,
    forkAxleToCrown: s.forkAxleToCrown ?? family.base.forkAxleToCrown,
  }

  const merged: CategoryProfile = {
    ...family,
    label: s.label,
    tagline: s.tagline,
    forWhat: s.forWhat,
    ranges,
    positionRange,
    rangeWhy: { ...family.rangeWhy, ...s.rangeWhy },
    reference: s.reference,
    ride: remapRide(family.ride, family.ranges, family.positionRange, ranges, positionRange),
    base: changed ? fitToRanges(start, ranges, positionRange) : start,
    grade: { ...family.grade, ...s.grade },
    styleId: s.id,
    different: s.different,
  }
  cache.set(key, merged)
  return merged
}
