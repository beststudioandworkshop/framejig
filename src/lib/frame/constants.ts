// Choices rather than calculations. Anything here can be tuned without touching the maths.
import type { FrameInputs, FrameMaterial, TubeSpec } from "./types"

/** Input sanity limits only. These are not design guidance. */
export const ANGLE_LIMITS = { min: 45, max: 89 } as const

/** Largest length accepted in any field, mm. Catches typos like an extra zero. */
export const LENGTH_MAX = 3000

/** Tyre-to-tube gap below which we warn (mm). Below zero it is an error. */
export const MIN_TYRE_CLEARANCE_WARN = 6

/** Toe clearance below which we warn about a near-overlap (mm). Below zero it is overlap. */
export const TOE_CLEARANCE_WARN = 10

/** Example tube sizes for the default frame. Not a tube-selection recommendation. */
const T = (diameter: number, wall: number): TubeSpec => ({ diameter, wall })

export const DEFAULT_INPUTS: FrameInputs = {
  wheel: { rimDiameter: 622, tyreSection: 28 },
  crankLength: 172.5,
  toeProjection: 120,
  material: "steel",
  process: "tig",
  mode: "numbers",
  seatTubeAngle: 73.5,
  headTubeAngle: 72.5,
  seatTubeLength: 540,
  seatTubeExtension: 25,
  effectiveTopTube: 550,
  headTubeLength: 140,
  stack: 570,
  reach: 385,
  bbDrop: 70,
  chainstayLength: 420,
  forkAxleToCrown: 370,
  forkRake: 45,
  tubes: {
    topTube: T(31.8, 0.9),
    downTube: T(35, 1),
    seatTube: T(31.8, 0.9),
    headTube: T(44, 1),
    chainstay: T(22.2, 1),
    seatstay: T(16, 0.8),
  },
}

export const MATERIAL_LABELS: Record<FrameMaterial, string> = {
  steel: "Steel",
  titanium: "Titanium",
  aluminium: "Aluminium",
}
