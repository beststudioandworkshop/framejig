// Pure types for the frame geometry module. Millimeters and degrees internally.
// Side-view frame: X forward, Y up, origin at the bottom bracket (BB) center.

export interface Vec2 {
  x: number
  y: number
}

export type FrameMaterial = "steel" | "titanium" | "aluminum"
export type FrameProcess = "tig" | "braze" | "lugged"

/** What the frame is for. It changes the guidance and the example numbers, never the geometry maths. */
export type BikeType = "road" | "gravel" | "mountain" | "touring" | "track" | "bruiser"

/**
 * Which measurement drives each part of the frame. Only the driven field is
 * read; the others are derived and shown in the readouts.
 */
export interface Drivers {
  /** BB position: drop below the axles, or height above the ground. */
  bb: "drop" | "height"
  /** Rear end: chainstay (BB to axle, straight line) or rear center (horizontal). */
  rear: "chainstay" | "rearCenter"
  /** Seat tube length: center-to-top (c-t) or center-to-center (c-c, to the top tube junction). */
  seat: "ct" | "cc"
  /** Horizontal position of the head tube / front wheel. */
  horizontal: "effectiveTopTube" | "frontCenter" | "reach"
  /** Vertical size of the front end: head tube length, or stack (then head tube length is derived). */
  vertical: "headTubeLength" | "stack"
}

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
  /** BB shell width, mm. Only used for the jig's side-to-side positions. */
  bbShellWidth: number
  /** Rear dropout spacing (inside face to inside face), mm. Only used for the jig. */
  rearSpacing: number

  /** Both wheels are assumed the same size. */
  wheel: {
    /** Bead seat diameter, mm (622 for 700c). */
    rimDiameter: number
    /** Tire section (height), mm. Wheel radius = rim/2 + tire section. */
    tireSection: number
  }
  crankLength: number
  /** Pedal axle to the toe of the shoe, mm. Used for the toe overlap check. */
  toeProjection: number

  bikeType: BikeType
  /** A sub-style of the bike type (for example "enduro"), or null for the general type. */
  bikeStyle: string | null
  material: FrameMaterial
  process: FrameProcess

  drivers: Drivers

  /** Degrees from horizontal. */
  seatTubeAngle: number
  /** Degrees from horizontal. */
  headTubeAngle: number
  /** Seat tube c-t: BB center to top of seat tube, along the seat tube, mm. */
  seatTubeLength: number
  /** Seat tube c-c: BB center to the top tube centerline junction, mm. */
  seatTubeLengthCC: number
  /** How far the seat tube sticks up above the top tube centerline junction, mm. */
  seatTubeExtension: number

  /**
   * Effective top tube, the way makers publish it: the level distance from the seat tube
   * line to the top of the head tube, measured at that height (reach + stack / tan(seat angle)).
   */
  effectiveTopTube: number
  /** Head tube length, mm. */
  headTubeLength: number

  /** Vertical BB center to top of head tube, mm. */
  stack: number
  /** Horizontal BB center to top of head tube, mm. */
  reach: number
  /** BB center to front axle, horizontal, mm. */
  frontCenter: number

  /** BB center below the axle line, mm. */
  bbDrop: number
  /** BB center height above the ground, mm. */
  bbHeight: number
  /** BB center to rear axle, straight line in the side view, mm. */
  chainstayLength: number
  /** BB center to rear axle, horizontal, mm. */
  rearCenter: number
  /** Fork axle-to-crown, mm, as makers publish it: to the crown race, not to the head tube. */
  forkAxleToCrown: number
  /**
   * How far the bottom of the head tube sits above the fork's crown measurement, along the
   * steering axis, mm. It is the lower headset: about 10 for a standard one.
   */
  headsetStack: number
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
  /** Top center of the head tube. */
  headTop: Vec2
  /** Bottom center of the head tube (the crown race point). */
  headBottom: Vec2
  /** Top of the seat tube. */
  seatTop: Vec2
  /** Top tube centerline meets the seat tube axis. Seat stays also meet here. */
  topTubeSeatJoint: Vec2
  /** Top tube centerline meets the head tube axis. */
  topTubeHeadJoint: Vec2
  /** Down tube centerline meets the head tube axis. */
  downTubeHeadJoint: Vec2
  /** Y of the ground in the same frame (negative: below the BB). */
  groundY: number
}

export interface FrameMetrics {
  wheelRadius: number
  wheelbase: number
  /** BB to front axle, horizontal. */
  frontCenter: number
  /** BB to rear axle, horizontal. */
  rearCenter: number
  bbHeight: number
  /** BB center below the axle line. */
  bbDrop: number
  /** BB center to rear axle, straight line. */
  chainstayLength: number
  /** Seat tube c-t. */
  seatTubeLength: number
  /** Seat tube c-c. */
  seatTubeLengthCC: number
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
  /** Distance from the toe to the front tire with a level forward crank, mm. Negative = overlap. */
  toeClearance: number
  /** Gap between rear tire and seat tube, mm. */
  rearTireClearance: number
  /** Gap between front tire and down tube, mm. */
  frontTireClearance: number
}

export type TubeRole = "topTube" | "downTube" | "seatTube" | "headTube" | "chainstay" | "seatstay"

export interface FrameTube {
  id: string
  name: string
  role: TubeRole
  /** Joint-to-joint centerline endpoints in the side view. */
  a: Vec2
  b: Vec2
  /** Centerline length between joints (side view), mm. Miter allowances are not applied. */
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
