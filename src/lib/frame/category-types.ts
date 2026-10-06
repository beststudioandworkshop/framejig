// The shapes of a bike category's data. One CategoryProfile per bike type is the
// single source for the primer page, the "typical" tags, the ride-feel bands,
// the example frame and the size grading. See categories/.
import type { BikeType, FrameInputs } from "./types"

export interface TypicalRange {
  label: string
  unit: "mm" | "°"
  low: number
  high: number
}

export type RangeKey = "headTubeAngle" | "seatTubeAngle" | "bbDrop" | "trail" | "chainstayLength" | "wheelbase"
export type RangeTable = Record<RangeKey, TypicalRange>

export interface Band {
  /** The band applies below this value. */
  below: number
  label: string
  text: string
}
export type BandLast = Omit<Band, "below">

/** One ride-feel scale: where the bands fall, and the range the marker moves over. */
export interface Scale {
  bands: Band[]
  last: BandLast
  lo: number
  hi: number
}

export interface RideProfile {
  disclaimer: string
  steering: Scale
  handling: Scale
  position: Scale
  weight: Scale
  bottomBracket: Scale
  /** Chainstay lengths (mm) below / above which a comment is added. */
  shortChainstay: { below: number; text: string }
  longChainstay: { above: number; text: string }
  /** Always shown for this type. */
  notes: string[]
}

export interface Note {
  title: string
  text: string
}

/** How a frame grows from one size to the next. All steps are per size, from the medium. */
export interface GradeRule {
  /** mm of reach per size. */
  reachStep: number
  /** mm of stack per size. */
  stackStep: number
  /** mm of seat tube (c-t) per size. */
  seatTubeStep: number
  /** Degrees of head angle per size (0 keeps it fixed). */
  headAngleStep: number
  /** Degrees of seat tube angle per size. */
  seatAngleStep: number
}

export interface CategoryProfile {
  id: BikeType
  label: string
  tagline: string
  forWhat: string
  ranges: RangeTable
  /** Typical stack to reach. */
  positionRange: { low: number; high: number }
  /** Why the numbers are what they are, per measure. */
  rangeWhy: Record<RangeKey | "position", string>
  /** What makes it feel the way it does. */
  feel: Note[]
  /** What varies inside the category. */
  variables: Note[]
  /** Where the numbers come from. */
  reference: string
  ride: RideProfile
  /** The example frame: a medium, with every derived number filled in. */
  base: FrameInputs
  grade: GradeRule
  /** Set on a style's merged profile: which style this is, and what sets it apart from its family. */
  styleId?: string
  different?: string[]
}

/**
 * A sub-style of a bike type, such as "enduro" within mountain. It only holds what
 * differs from its family; everything else comes from the family. The example
 * frame is fitted to the middle of the style's ranges.
 */
export interface StyleProfile {
  id: string
  family: BikeType
  label: string
  tagline: string
  forWhat: string
  /** What sets it apart from the rest of its family. */
  different: string[]
  /** Typical ranges that differ from the family's (the label and unit come from the family). */
  ranges?: Partial<Record<RangeKey, { low: number; high: number }>>
  positionRange?: { low: number; high: number }
  /** Wheel and tire for the example, when they differ from the family. */
  wheel?: { rimDiameter: number; tireSection: number }
  crankLength?: number
  /** Fork axle-to-crown for the example, when it differs from the family's. */
  forkAxleToCrown?: number
  grade?: Partial<GradeRule>
  rangeWhy?: Partial<Record<RangeKey | "position", string>>
  /** Where the numbers come from. */
  reference: string
}

/** Families that exist in the taxonomy but that this tool can't model. */
export type FamilyId = BikeType | "freak"

/** A bike the tool can't draw yet, kept in the taxonomy for the fun and the honesty. */
export interface InfoStyle {
  id: string
  label: string
  tagline: string
  forWhat: string
  different: string[]
  /** Why the tool can't model it, in plain words. */
  whyNot: string
  /** Whether it could be modeled later with the current kind of frame. */
  possibleLater: boolean
}

export type SizeId = "S" | "M" | "L" | "XL"

export interface SizeInfo {
  id: SizeId
  label: string
  /** Steps from the medium. */
  step: number
  /** A rough rider height range, cm. Sizing differs a lot between makers. */
  riderCm: [number, number]
}
