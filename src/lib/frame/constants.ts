// Choices rather than calculations. Anything here can be tuned without touching the maths.
import type { FrameInputs, FrameMaterial, TubeSpec } from "./types"

/** Input sanity limits only. These are not design guidance. */
export const ANGLE_LIMITS = { min: 45, max: 89 } as const

/** Largest length accepted in any field, mm. Catches typos like an extra zero. */
export const LENGTH_MAX = 3000

/** Tire-to-tube gap below which we warn (mm). Below zero it is an error. */
export const MIN_TIRE_CLEARANCE_WARN = 6

/** Toe clearance below which we warn about a near-overlap (mm). Below zero it is overlap. */
export const TOE_CLEARANCE_WARN = 10

/** Example tube sizes for the default frame. Not a tube-selection recommendation. */
const T = (diameter: number, wall: number): TubeSpec => ({ diameter, wall })

export const DEFAULT_INPUTS: FrameInputs = {
  bbShellWidth: 68,
  rearSpacing: 130,
  wheel: { rimDiameter: 622, tireSection: 28 },
  crankLength: 172.5,
  toeProjection: 90,
  bikeType: "road",
  bikeStyle: null,
  material: "steel",
  process: "tig",
  drivers: {
    bb: "drop",
    rear: "chainstay",
    seat: "ct",
    horizontal: "effectiveTopTube",
    vertical: "headTubeLength",
  },
  seatTubeAngle: 73.5,
  headTubeAngle: 72.5,
  seatTubeLength: 540,
  seatTubeLengthCC: 515,
  seatTubeExtension: 25,
  effectiveTopTube: 550,
  headTubeLength: 140,
  stack: 543,
  reach: 389,
  frontCenter: 585,
  bbDrop: 70,
  bbHeight: 269,
  chainstayLength: 420,
  rearCenter: 414,
  forkAxleToCrown: 360,
  forkRake: 45,
  headsetStack: 10,
  tubes: {
    topTube: T(31.8, 0.9),
    downTube: T(35, 1),
    seatTube: T(31.8, 0.9),
    headTube: T(44, 1),
    chainstay: T(22.2, 1),
    seatstay: T(16, 0.8),
  },
}

export const BIKE_TYPE_LABELS: Record<import("./types").BikeType, string> = {
  road: "Road",
  gravel: "Gravel",
  mountain: "Mountain",
  touring: "Touring",
  track: "Track",
  bruiser: "Bruiser",
}

/** Every bike type, in the order we show them. */
export const BIKE_TYPES: import("./types").BikeType[] = ["road", "gravel", "mountain", "touring", "track", "bruiser"]

export const MATERIAL_LABELS: Record<FrameMaterial, string> = {
  steel: "Steel",
  titanium: "Titanium",
  aluminum: "Aluminum",
}
