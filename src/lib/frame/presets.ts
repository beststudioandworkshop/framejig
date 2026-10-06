// Example frames to start from, one per bike type. They are EXAMPLES: plausible
// numbers, not recommendations and not verified against any maker's chart.
import { buildFrame } from "./build"
import { DEFAULT_INPUTS } from "./constants"
import { syncDerived } from "./convert"
import type { BikeType, FrameInputs } from "./types"

/**
 * A 29-inch hardtail with a long, slack front end. The fork length is axle to
 * crown at the sag you ride at. Specified by reach and stack, as mountain bike
 * makers usually do.
 */
const MOUNTAIN_RAW: FrameInputs = {
  ...DEFAULT_INPUTS,
  bikeType: "mountain",
  wheel: { rimDiameter: 622, tireSection: 60 },
  crankLength: 170,
  bbShellWidth: 73,
  rearSpacing: 142,
  drivers: { bb: "drop", rear: "chainstay", seat: "ct", horizontal: "reach", vertical: "stack" },
  seatTubeAngle: 73,
  headTubeAngle: 65,
  seatTubeLength: 440,
  seatTubeExtension: 25,
  reach: 460,
  stack: 620,
  bbDrop: 40,
  chainstayLength: 435,
  forkAxleToCrown: 540,
  forkRake: 44,
  tubes: {
    ...DEFAULT_INPUTS.tubes,
    downTube: { diameter: 38.1, wall: 1 },
    seatTube: { diameter: 34.9, wall: 0.9 },
  },
}

/** The mountain example with every derived number filled in, so switching modes doesn't jump. */
export const MOUNTAIN_INPUTS: FrameInputs = syncDerived(MOUNTAIN_RAW, buildFrame(MOUNTAIN_RAW))

export const PRESETS: Record<BikeType, FrameInputs> = {
  road: DEFAULT_INPUTS,
  mountain: MOUNTAIN_INPUTS,
}
