// Soft guidance only. Ranges are common rules of thumb for each kind of bike,
// NOT verified design limits, and the mountain ranges especially are my own
// estimates. Say so wherever they're shown.
import type { BikeType, FrameMetrics, FrameInputs } from "./types"

export interface TypicalRange {
  label: string
  unit: "mm" | "°"
  low: number
  high: number
}

type RangeTable = {
  headTubeAngle: TypicalRange
  seatTubeAngle: TypicalRange
  bbDrop: TypicalRange
  trail: TypicalRange
  chainstayLength: TypicalRange
  wheelbase: TypicalRange
}

const road: RangeTable = {
  headTubeAngle: { label: "Head tube angle", unit: "°", low: 70, high: 74 },
  seatTubeAngle: { label: "Seat tube angle", unit: "°", low: 72, high: 75 },
  bbDrop: { label: "BB drop", unit: "mm", low: 65, high: 80 },
  trail: { label: "Trail", unit: "mm", low: 50, high: 70 },
  chainstayLength: { label: "Chainstay length", unit: "mm", low: 405, high: 450 },
  wheelbase: { label: "Wheelbase", unit: "mm", low: 960, high: 1060 },
}

const mountain: RangeTable = {
  headTubeAngle: { label: "Head tube angle", unit: "°", low: 63, high: 69 },
  seatTubeAngle: { label: "Seat tube angle", unit: "°", low: 71, high: 76 },
  bbDrop: { label: "BB drop", unit: "mm", low: 25, high: 50 },
  trail: { label: "Trail", unit: "mm", low: 95, high: 135 },
  chainstayLength: { label: "Chainstay length", unit: "mm", low: 415, high: 450 },
  wheelbase: { label: "Wheelbase", unit: "mm", low: 1100, high: 1260 },
}

/** Typical ranges for each bike type. */
export const TYPICAL_RANGES_BY_TYPE: Record<BikeType, RangeTable> = { road, mountain }

/** Road and gravel ranges (the original table). */
export const TYPICAL_RANGES = road

export type RangeKey = keyof RangeTable
export type RangeVerdict = "low" | "typical" | "high"

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
