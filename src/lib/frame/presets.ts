// Example frames to start from, one per bike type. They are EXAMPLES: plausible
// numbers, not recommendations and not verified against any maker's chart. Each
// is the medium for its category; see grading.ts for the other sizes.
import { CATEGORIES } from "./categories"
import type { BikeType, FrameInputs } from "./types"

export const MOUNTAIN_INPUTS: FrameInputs = CATEGORIES.mountain.base

export const PRESETS: Record<BikeType, FrameInputs> = {
  road: CATEGORIES.road.base,
  gravel: CATEGORIES.gravel.base,
  mountain: CATEGORIES.mountain.base,
  touring: CATEGORIES.touring.base,
  track: CATEGORIES.track.base,
}
