import type { FrameInputs, FrameResult } from "./types"

export interface Comparison {
  key: string
  label: string
  unit: "mm" | "°"
  /** Your frame. */
  value: number
  /** The reference. */
  reference: number
  /** value - reference. */
  delta: number
}

/** Side-by-side numbers for the frame against a reference. Null if either can't be solved. */
export function compareFrames(
  inputs: FrameInputs,
  result: FrameResult,
  refInputs: FrameInputs,
  refResult: FrameResult,
): Comparison[] | null {
  const m = result.metrics
  const r = refResult.metrics
  if (!m || !r) return null
  const rows: [string, string, "mm" | "°", number, number][] = [
    ["headTubeAngle", "Head tube angle", "°", inputs.headTubeAngle, refInputs.headTubeAngle],
    ["seatTubeAngle", "Seat tube angle", "°", inputs.seatTubeAngle, refInputs.seatTubeAngle],
    ["wheelbase", "Wheelbase", "mm", m.wheelbase, r.wheelbase],
    ["trail", "Trail", "mm", m.trail, r.trail],
    ["bbHeight", "BB height", "mm", m.bbHeight, r.bbHeight],
    ["bbDrop", "BB drop", "mm", m.bbDrop, r.bbDrop],
    ["chainstayLength", "Chainstay", "mm", m.chainstayLength, r.chainstayLength],
    ["frontCentre", "Front centre", "mm", m.frontCentre, r.frontCentre],
    ["stack", "Stack", "mm", m.stack, r.stack],
    ["reach", "Reach", "mm", m.reach, r.reach],
    ["effectiveTopTube", "Effective top tube", "mm", m.effectiveTopTube, r.effectiveTopTube],
    ["headTubeLength", "Head tube length", "mm", m.headTubeLength, r.headTubeLength],
    ["seatTubeLength", "Seat tube (c-t)", "mm", m.seatTubeLength, r.seatTubeLength],
    ["standover", "Standover", "mm", m.standover, r.standover],
  ]
  return rows.map(([key, label, unit, value, reference]) => ({ key, label, unit, value, reference, delta: value - reference }))
}
