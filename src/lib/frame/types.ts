// Pure types for the frame geometry module. Millimetres and degrees internally.
// Side-view frame: X forward, Y up, origin at the bottom bracket (BB) centre.

export interface Vec2 {
  x: number
  y: number
}

export type FrameMaterial = "steel" | "titanium" | "aluminium"
export type FrameProcess = "tig" | "braze" | "lugged"

/** How the frame is specified. "numbers": top tube + head tube length. "fit": stack + reach. */
export type SpecMode = "numbers" | "fit"

export interface TubeSpec {
  /** Outside diameter, mm. */
  diameter: number
  /** Wall thickness, mm. */
  wall: number
}

export interface FrameTubeSpecs {
  topTube: TubeSpec
  downTube: TubeSpec
  seatTube: TubeSpec
  headTube: TubeSpec
  chainstay: TubeSpec
  seatstay: TubeSpec
}

export interface FrameInputs {
  /** Both wheels are assumed the same size. */
  wheel: {
    /** Bead seat diameter, mm (622 for 700c). */
    rimDiameter: number
    /** Tyre section (height), mm. Wheel radius = rim/2 + tyre section. */
    tyreSection: number
  }
  crankLength: number
  /** Pedal axle to the toe of the shoe, mm. Used for the toe overlap check. */
  toeProjection: number

  material: FrameMaterial
  process: FrameProcess

  mode: SpecMode

  /** Degrees from horizontal. */
  seatTubeAngle: number
  /** Degrees from horizontal. */
  headTubeAngle: number
  /** BB centre to top of seat tube, along the seat tube, mm. */
  seatTubeLength: number
  /** How far the seat tube sticks up above the top tube centreline junction, mm. */
  seatTubeExtension: number

  /** Numbers mode only: horizontal distance between seat and head tube axes at the seat tube top. */
  effectiveTopTube: number
  /** Numbers mode only: head tube length, mm. */
  headTubeLength: number

  /** Fit mode only: vertical BB centre to top of head tube, mm. */
  stack: number
  /** Fit mode only: horizontal BB centre to top of head tube, mm. */
  reach: number

  /** BB centre below the axle line, mm. */
  bbDrop: number
  /** BB centre to rear axle, straight line in the side view, mm. */
  chainstayLength: number
  /** Fork axle-to-crown, mm (measured to the bottom of the head tube; headset stack not modelled). */
  forkAxleToCrown: number
  /** Fork offset (rake), mm. */
  forkRake: number

  tubes: FrameTubeSpecs
}

export type IssueSeverity = "error" | "warning"

export interface Issue {
  code: string
  message: string
  /** The input field it relates to, when there is one. */
  field?: string
  severity: IssueSeverity
}

export interface KeyPoints {
  bb: Vec2
  rearAxle: Vec2
  frontAxle: Vec2
  /** Top centre of the head tube. */
  headTop: Vec2
  /** Bottom centre of the head tube (the crown race point). */
  headBottom: Vec2
  /** Top of the seat tube. */
  seatTop: Vec2
  /** Top tube centreline meets the seat tube axis. Seat stays also meet here. */
  topTubeSeatJoint: Vec2
  /** Top tube centreline meets the head tube axis. */
  topTubeHeadJoint: Vec2
  /** Down tube centreline meets the head tube axis. */
  downTubeHeadJoint: Vec2
  /** Y of the ground in the same frame (negative: below the BB). */
  groundY: number
}

export interface FrameMetrics {
  wheelRadius: number
  wheelbase: number
  /** BB to front axle, horizontal. */
  frontCentre: number
  /** BB to rear axle, horizontal. */
  rearCentre: number
  bbHeight: number
  /** Ground trail, mm. Positive: the contact patch trails the steering axis. */
  trail: number
  stack: number
  reach: number
  /** Effective (horizontal) top tube length. Derived in fit mode. */
  effectiveTopTube: number
  /** Head tube length. Derived in fit mode. */
  headTubeLength: number
  /** Physical top tube slope, degrees; positive = rises toward the head tube. */
  topTubeSlope: number
  /** Ground to top of the top tube at its midpoint, mm. */
  standover: number
  /** Distance from the toe to the front tyre with a level forward crank, mm. Negative = overlap. */
  toeClearance: number
  /** Gap between rear tyre and seat tube, mm. */
  rearTyreClearance: number
  /** Gap between front tyre and down tube, mm. */
  frontTyreClearance: number
}

export type TubeRole = "topTube" | "downTube" | "seatTube" | "headTube" | "chainstay" | "seatstay"

export interface FrameTube {
  id: string
  name: string
  role: TubeRole
  /** Joint-to-joint centreline endpoints in the side view. */
  a: Vec2
  b: Vec2
  /** Centreline length between joints (side view), mm. Mitre allowances are not applied. */
  length: number
  /** Direction a -> b, degrees from +X. */
  angle: number
  diameter: number
  wall: number
  /** 2 for the mirrored left/right pairs. */
  count: number
  material: FrameMaterial
}

export interface FrameResult {
  ok: boolean
  issues: Issue[]
  /** Null when the inputs are too broken to place the points. */
  points: KeyPoints | null
  metrics: FrameMetrics | null
  /** Empty when ok is false. */
  tubes: FrameTube[]
}
