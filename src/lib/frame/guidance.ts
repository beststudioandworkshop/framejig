// Soft guidance only. Ranges are common rules of thumb for road/gravel-style
// frames, NOT verified design limits. Say so wherever they're shown.
import type { FrameMetrics, FrameInputs } from "./types"

export interface TypicalRange {
  label: string
  unit: "mm" | "°"
  low: number
  high: number
}

export const TYPICAL_RANGES = {
  headTubeAngle: { label: "Head tube angle", unit: "°", low: 70, high: 74 },
  seatTubeAngle: { label: "Seat tube angle", unit: "°", low: 72, high: 75 },
  bbDrop: { label: "BB drop", unit: "mm", low: 65, high: 80 },
  trail: { label: "Trail", unit: "mm", low: 50, high: 70 },
  chainstayLength: { label: "Chainstay length", unit: "mm", low: 405, high: 450 },
  wheelbase: { label: "Wheelbase", unit: "mm", low: 960, high: 1060 },
} as const satisfies Record<string, TypicalRange>

export type RangeKey = keyof typeof TYPICAL_RANGES
export type RangeVerdict = "low" | "typical" | "high"

export function checkRange(key: RangeKey, value: number): RangeVerdict {
  const r = TYPICAL_RANGES[key]
  return value < r.low ? "low" : value > r.high ? "high" : "typical"
}

export function readouts(inputs: FrameInputs, m: FrameMetrics) {
  const values: Record<RangeKey, number> = {
    headTubeAngle: inputs.headTubeAngle,
    seatTubeAngle: inputs.seatTubeAngle,
    bbDrop: inputs.bbDrop,
    trail: m.trail,
    chainstayLength: inputs.chainstayLength,
    wheelbase: m.wheelbase,
  }
  return (Object.keys(TYPICAL_RANGES) as RangeKey[]).map((key) => ({
    key,
    ...TYPICAL_RANGES[key],
    value: values[key],
    verdict: checkRange(key, values[key]),
  }))
}
