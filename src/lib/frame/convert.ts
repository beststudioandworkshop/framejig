import type { Drivers, FrameInputs, FrameResult } from "./types"

/**
 * Write every derived number back into its input field, so nothing jumps when
 * a different measurement takes over. A no-op for the fields already driving.
 * Returns the inputs unchanged if the frame couldn't be solved.
 */
export function syncDerived(inputs: FrameInputs, result: FrameResult): FrameInputs {
  const m = result.metrics
  if (!m) return inputs
  return {
    ...inputs,
    bbDrop: m.bbDrop,
    bbHeight: m.bbHeight,
    chainstayLength: m.chainstayLength,
    rearCentre: m.rearCentre,
    seatTubeLength: m.seatTubeLength,
    seatTubeLengthCC: m.seatTubeLengthCC,
    effectiveTopTube: m.effectiveTopTube,
    frontCentre: m.frontCentre,
    reach: m.reach,
    headTubeLength: m.headTubeLength,
    stack: m.stack,
  }
}

/** Change which measurement drives a row without changing the frame. */
export function switchDriver<K extends keyof Drivers>(
  inputs: FrameInputs,
  result: FrameResult,
  key: K,
  value: Drivers[K],
): FrameInputs {
  const synced = syncDerived(inputs, result)
  return { ...synced, drivers: { ...synced.drivers, [key]: value } }
}
