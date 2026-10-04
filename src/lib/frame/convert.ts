import type { FrameInputs, FrameResult, SpecMode } from "./types"

/**
 * Switch the spec mode without changing the frame: copy the derived numbers
 * of the current result into the fields the new mode uses.
 * Returns the inputs unchanged if the frame couldn't be solved.
 */
export function switchMode(inputs: FrameInputs, result: FrameResult, mode: SpecMode): FrameInputs {
  if (!result.metrics) return { ...inputs, mode }
  const m = result.metrics
  return {
    ...inputs,
    mode,
    stack: m.stack,
    reach: m.reach,
    effectiveTopTube: m.effectiveTopTube,
    headTubeLength: m.headTubeLength,
  }
}
