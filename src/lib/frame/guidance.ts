// Soft guidance only. Ranges are common rules of thumb for each kind of bike,
// NOT verified design limits, and the estimates are mine. They live in
// categories/, one profile per bike type. Say so wherever they're shown.
import { CATEGORIES } from "./categories"
import type { RangeKey, RangeTable } from "./category-types"
import type { BikeType, FrameMetrics, FrameInputs } from "./types"

export type RangeVerdict = "low" | "typical" | "high"

/** Typical ranges for each bike type. */
export const TYPICAL_RANGES_BY_TYPE: Record<BikeType, RangeTable> = {
  road: CATEGORIES.road.ranges,
  gravel: CATEGORIES.gravel.ranges,
  mountain: CATEGORIES.mountain.ranges,
  touring: CATEGORIES.touring.ranges,
  track: CATEGORIES.track.ranges,
}

/** Road ranges (the original table). */
export const TYPICAL_RANGES = TYPICAL_RANGES_BY_TYPE.road

export function checkRange(key: RangeKey, value: number, type: BikeType = "road"): RangeVerdict {
  const r = TYPICAL_RANGES_BY_TYPE[type][key]
  return value < r.low ? "low" : value > r.high ? "high" : "typical"
}

export function readouts(inputs: FrameInputs, m: FrameMetrics) {
  const type = inputs.bikeType
  const table = TYPICAL_RANGES_BY_TYPE[type]
  const values: Record<RangeKey, number> = {
    headTubeAngle: inputs.headTubeAngle,
    seatTubeAngle: inputs.seatTubeAngle,
    bbDrop: m.bbDrop,
    trail: m.trail,
    chainstayLength: m.chainstayLength,
    wheelbase: m.wheelbase,
  }
  return (Object.keys(table) as RangeKey[]).map((key) => ({
    key,
    ...table[key],
    value: values[key],
    verdict: checkRange(key, values[key], type),
  }))
}
