// Example frames to start from, one per bike type. They are EXAMPLES: plausible
// numbers, not recommendations and not verified against any maker's chart. Each
// is the medium for its category; see grading.ts for the other sizes.
import { CATEGORIES } from "./categories"
import { profileFor } from "./profile"
import type { BikeType, FrameInputs } from "./types"

export const MOUNTAIN_INPUTS: FrameInputs = CATEGORIES.mountain.base

export const PRESETS: Record<BikeType, FrameInputs> = {
  road: CATEGORIES.road.base,
  gravel: CATEGORIES.gravel.base,
  mountain: CATEGORIES.mountain.base,
  touring: CATEGORIES.touring.base,
  track: CATEGORIES.track.base,
  bruiser: CATEGORIES.bruiser.base,
}

/** The example frame (a medium) for a type and an optional style. */
export const exampleFrame = (type: BikeType, style?: string | null): FrameInputs => profileFor(type, style).base
