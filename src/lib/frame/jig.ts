// Jig settings for a level spine and a fixed rear axle.
//
// The main spine is a straight bar that runs level, parallel to the axle line.
// Its bottom edge is a set distance above that line (120 mm to start with), and
// its tall face is 120 mm. Everything is measured from the rear axle, which is fixed.
//   - The seat tube carrier hangs on a post below the spine and rotates about a
//     pin at the center of the bottom bracket.
//   - The head tube carrier stands on a post above the spine and rotates about a
//     pin at the bottom of the head tube.
//   - A standoff at the rear axle reaches out so the dummy axle sits on the
//     frame's center line when seen from above.
//
// Positions are given along the spine (u, forward from the rear axle) and across
// it (v, up from the spine's centerline, negative below). With a level spine
// u and v are just the frame's own x and y, shifted, so the jig can't disagree with the drawing.
import { dist } from "./vec"
import { formatLengthValue, type LengthUnit } from "./units"
import type { FrameInputs, FrameResult } from "./types"

/** The spine's tall face, as seen from the side, mm. */
export const SPINE_HEIGHT = 120

/** Room left past the last station for clamps, mm. */
export const ALLOWANCE = 100

/** How far a post runs along the spine's face, past its edge, to be bolted on, mm. */
export const POST_OVERLAP = 100

/** Round up to the next multiple of `step`. */
export const roundUp = (n: number, step: number) => Math.ceil(n / step - 1e-9) * step

export interface JigSettings {
  /** From the spine's front face to the frame's center plane, seen from above, mm. */
  centerOffset: number
  /** From the axle line up to the spine's bottom edge, mm. */
  spineClearance: number
}

/** Examples. Both depend on how you build the jig. */
export const DEFAULT_JIG: JigSettings = { centerOffset: 150, spineClearance: 120 }

export type StationId = "rearAxle" | "bb" | "headBottom" | "headTop" | "seatTop" | "frontAxle"

export interface JigStation {
  id: StationId
  name: string
  /** Forward of the rear axle, mm. */
  x: number
  /** Up from the rear axle, mm. */
  y: number
  /** Along the spine from the rear axle, mm. */
  u: number
  /** Across the spine from its centerline, mm. Positive is up. */
  v: number
  /** How far out from the spine's front face the locator reaches, mm. */
  standoff: number
  /** The locator sits this far either side of the center plane, mm. Absent for center-plane points. */
  halfWidth?: number
  /** Angle from horizontal of the tube this station holds, degrees. */
  angle?: number
  note: string
}

export interface JigCarrier {
  id: "seat" | "head"
  name: string
  /** The station the carrier pivots about. */
  pivot: StationId
  /** The pin's place along the spine from the rear axle, mm. */
  pivotU: number
  /** Which side of the spine the post sits on. */
  side: "below" | "above"
  /** How far the pin sits beyond that spine edge, mm. Negative means it falls within the spine's height. */
  pinClearance: number
  /** The tube's angle from horizontal, the same as the frame's. */
  tubeAngle: number
  /** Angle from the spine's forward direction to the carrier's upward direction, degrees. */
  angleToSpine: number
  /** Degrees away from square to the spine. */
  offSquare: number
  /** Distance along the carrier from the pin to each station it holds. Positive is up the tube. */
  stops: { station: StationId; along: number }[]
  /** Carrier cut length, mm. The pin sits `ALLOWANCE` from its lower end. */
  length: number
  /** Post cut length, mm. */
  postLength: number
}

export interface JigCheck {
  id: string
  name: string
  from: StationId
  to: StationId
  /** Straight-line distance for a tape, mm. */
  length: number
}

export interface Jig {
  settings: JigSettings
  spine: {
    /** Along the spine from the rear axle, mm. */
    uMin: number
    uMax: number
    /** Cut length, mm. */
    length: number
    /** Height of the spine's bottom and top edges above the axle line, mm. */
    bottom: number
    top: number
    /** Height of the spine's centerline above the axle line, mm. */
    centerline: number
  }
  stations: JigStation[]
  carriers: JigCarrier[]
  checks: JigCheck[]
  /** Things about the settings worth a second look. */
  notes: string[]
}

export function buildJig(inputs: FrameInputs, result: FrameResult, settings: JigSettings): Jig | null {
  const p = result.points
  if (!p) return null
  const o = p.rearAxle

  const bottom = settings.spineClearance
  const top = bottom + SPINE_HEIGHT
  const centerline = bottom + SPINE_HEIGHT / 2

  const D = settings.centerOffset
  const st = (
    id: StationId,
    name: string,
    point: { x: number; y: number },
    note: string,
    standoff: number,
    extra: { halfWidth?: number; angle?: number } = {},
  ): JigStation => {
    const x = point.x - o.x
    const y = point.y - o.y
    return { id, name, x, y, u: x, v: y - centerline, standoff, note, ...extra }
  }

  const stations: JigStation[] = [
    st("rearAxle", "Rear axle (fixed)", p.rearAxle, "Fixed, and the origin for every number. The standoff reaches the near dropout face.", D - inputs.rearSpacing / 2, {
      halfWidth: inputs.rearSpacing / 2,
    }),
    st("bb", "Bottom bracket", p.bb, "Center of the shell. The seat tube carrier pivots here.", D - inputs.bbShellWidth / 2, {
      halfWidth: inputs.bbShellWidth / 2,
    }),
    st("headBottom", "Head tube bottom", p.headBottom, "Bottom end of the head tube, on its centerline. The head tube carrier pivots here.", D, { angle: inputs.headTubeAngle }),
    st("headTop", "Head tube top", p.headTop, "Top end of the head tube, on its centerline.", D, { angle: inputs.headTubeAngle }),
    st("seatTop", "Seat tube top", p.seatTop, "Top of the seat tube. The tube also passes through the BB.", D, { angle: inputs.seatTubeAngle }),
    st("frontAxle", "Front axle (check)", p.frontAxle, "Where a gauge or dummy fork's axle should land. Level with the rear axle.", D),
  ]
  const by = Object.fromEntries(stations.map((x) => [x.id, x])) as Record<StationId, JigStation>

  const carrier = (
    id: JigCarrier["id"],
    name: string,
    pivot: StationId,
    upper: StationId,
    tubeAngle: number,
  ): JigCarrier => {
    const lo = by[pivot]
    const side = lo.y < bottom ? "below" : "above"
    // The post runs from the spine's edge on that side out to the pin.
    const pinClearance = side === "below" ? bottom - lo.y : lo.y - top
    const angleToSpine = 180 - tubeAngle
    const reach = dist(lo, by[upper])
    return {
      id,
      name,
      pivot,
      pivotU: lo.u,
      side,
      pinClearance,
      tubeAngle,
      angleToSpine,
      offSquare: angleToSpine - 90,
      stops: [
        { station: pivot, along: 0 },
        { station: upper, along: reach },
      ],
      length: roundUp(reach + 2 * ALLOWANCE, 50),
      postLength: roundUp(POST_OVERLAP + Math.max(0, pinClearance) + ALLOWANCE, 50),
    }
  }

  const carriers = [
    carrier("seat", "Seat tube carrier", "bb", "seatTop", inputs.seatTubeAngle),
    carrier("head", "Head tube carrier", "headBottom", "headTop", inputs.headTubeAngle),
  ]

  const marks = stations.filter((x) => x.id !== "frontAxle").map((x) => x.u)
  const uMin = Math.min(...marks) - ALLOWANCE
  const uMax = Math.max(...marks) + ALLOWANCE

  const check = (id: string, name: string, from: StationId, to: StationId): JigCheck => ({
    id,
    name,
    from,
    to,
    length: dist(by[from], by[to]),
  })

  const notes: string[] = []
  if (!(D > 0)) notes.push("The spine face has to be some distance from the frame's center plane.")
  if (!(bottom > 0)) notes.push("The spine's bottom edge has to be above the axle line.")
  for (const x of stations) {
    if (x.halfWidth !== undefined && x.standoff <= 0) {
      notes.push(`${x.name}: the center offset is smaller than half its width, so the standoff comes out zero or less.`)
    }
  }
  for (const c of carriers) {
    if (c.pinClearance < 0) {
      notes.push(
        `${c.name}: the pin falls ${Math.round(-c.pinClearance)} mm inside the spine's height. Move the spine so the pin clears its ${c.side === "below" ? "bottom" : "top"} edge.`,
      )
    }
  }

  return {
    settings,
    spine: { uMin, uMax, length: roundUp(uMax - uMin, 50), bottom, top, centerline },
    stations,
    carriers,
    checks: [
      check("wheelbase", "Rear axle to front axle", "rearAxle", "frontAxle"),
      check("chainstay", "Rear axle to BB", "rearAxle", "bb"),
      check("rearToHeadBottom", "Rear axle to head tube bottom", "rearAxle", "headBottom"),
      check("rearToHeadTop", "Rear axle to head tube top", "rearAxle", "headTop"),
      check("rearToSeatTop", "Rear axle to seat tube top", "rearAxle", "seatTop"),
      check("bbToHeadBottom", "BB to head tube bottom", "bb", "headBottom"),
      check("bbToHeadTop", "BB to head tube top", "bb", "headTop"),
      check("bbToSeatTop", "BB to seat tube top", "bb", "seatTop"),
      check("bbToFrontAxle", "BB to front axle", "bb", "frontAxle"),
      check("headTube", "Head tube bottom to top", "headBottom", "headTop"),
    ],
    notes,
  }
}

export interface JigEnvelope {
  /** How many frames this covers. */
  frames: number
  /** Spine length that holds every frame, mm. */
  spineLength: number
  /** How far each carrier has to move and rotate to cover every frame. */
  carriers: {
    id: JigCarrier["id"]
    name: string
    pivotU: { min: number; max: number }
    pinClearance: { min: number; max: number }
    angleToSpine: { min: number; max: number }
    length: number
    postLength: number
  }[]
  /** The furthest any station sits from the spine centerline, mm. */
  maxAcross: number
}

const range = (xs: number[]) => ({ min: Math.min(...xs), max: Math.max(...xs) })

/** The room and travel the jig needs to hold all of these frames. Null if there are none. */
export function jigEnvelope(jigs: (Jig | null)[]): JigEnvelope | null {
  const list = jigs.filter((j): j is Jig => j !== null)
  if (list.length === 0) return null
  const ids: JigCarrier["id"][] = ["seat", "head"]
  return {
    frames: list.length,
    spineLength: roundUp(Math.max(...list.map((j) => j.spine.uMax)) - Math.min(...list.map((j) => j.spine.uMin)), 50),
    carriers: ids.map((id) => {
      const cs = list.map((j) => j.carriers.find((c) => c.id === id)!)
      return {
        id,
        name: cs[0].name,
        pivotU: range(cs.map((c) => c.pivotU)),
        pinClearance: range(cs.map((c) => c.pinClearance)),
        angleToSpine: range(cs.map((c) => c.angleToSpine)),
        length: Math.max(...cs.map((c) => c.length)),
        postLength: Math.max(...cs.map((c) => c.postLength)),
      }
    }),
    maxAcross: Math.max(...list.flatMap((j) => j.stations.map((s) => Math.abs(s.v)))),
  }
}

function header(unit: LengthUnit): string[] {
  return [
    "Station",
    `Along spine (${unit})`,
    `Across spine (${unit})`,
    `Standoff from spine face (${unit})`,
    `Each side of center (${unit})`,
    "Tube angle from horizontal (deg)",
  ]
}

function row(s: JigStation, unit: LengthUnit): string[] {
  return [
    s.name,
    formatLengthValue(s.u, unit),
    formatLengthValue(s.v, unit),
    formatLengthValue(s.standoff, unit),
    s.halfWidth === undefined ? "" : formatLengthValue(s.halfWidth, unit),
    s.angle === undefined ? "" : String(Number(s.angle.toFixed(1))),
  ]
}

function carrierHeader(unit: LengthUnit): string[] {
  return ["Carrier", "Tube angle (deg)", "Angle to spine (deg)", `Pin along spine (${unit})`, `Pin beyond the spine edge (${unit})`, `Carrier cut (${unit})`, `Post cut (${unit})`, "Stops (distance along the carrier from the pin)"]
}

function carrierRow(c: JigCarrier, unit: LengthUnit): string[] {
  return [
    c.name,
    String(Number(c.tubeAngle.toFixed(1))),
    String(Number(c.angleToSpine.toFixed(1))),
    formatLengthValue(c.pivotU, unit),
    `${formatLengthValue(c.pinClearance, unit)} ${c.side === "below" ? "below" : "above"}`,
    formatLengthValue(c.length, unit),
    formatLengthValue(c.postLength, unit),
    c.stops.map((x) => `${x.station} ${formatLengthValue(x.along, unit)}`).join("; "),
  ]
}

const csvCell = (s: string) => (/[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s)

function spineLine(jig: Jig, unit: LengthUnit): string[] {
  return ["Spine bottom edge above the axle line", formatLengthValue(jig.spine.bottom, unit), "Spine height", formatLengthValue(SPINE_HEIGHT, unit)]
}

export function jigCsv(jig: Jig, unit: LengthUnit): string {
  const rows: string[][] = [
    spineLine(jig, unit),
    [],
    header(unit),
    ...jig.stations.map((s) => row(s, unit)),
    [],
    carrierHeader(unit),
    ...jig.carriers.map((c) => carrierRow(c, unit)),
  ]
  return rows.map((r) => r.map(csvCell).join(",")).join("\n") + "\n"
}

/** Tab-separated, so it pastes straight into a spreadsheet. */
export function jigText(jig: Jig, unit: LengthUnit): string {
  const rows: string[][] = [
    spineLine(jig, unit),
    [],
    header(unit),
    ...jig.stations.map((s) => row(s, unit)),
    [],
    carrierHeader(unit),
    ...jig.carriers.map((c) => carrierRow(c, unit)),
  ]
  return rows.map((r) => r.join("\t")).join("\n")
}
