// Jig settings for a tilted spine and a fixed rear axle.
//
// The main spine is a straight bar whose centerline runs from the rear axle
// through the middle of the head tube. It's mounted to a post on its back side.
// Its tilt is the angle of that line above the axle-to-axle line, so it is
// worked out from the frame. Carriers mount on the front face of the spine:
//   - a seat tube carrier along the seat tube axis (it also stops the BB), the
//     most adjustable one: along the spine, across it, and rotation;
//   - a head tube carrier along the head tube axis;
//   - a standoff at the rear axle so the dummy axle reaches the frame's center
//     line when seen from above.
//
// Positions are given along the spine (u, from the rear axle, toward the head
// tube) and across it (v, positive toward the seat tube side). All of it is a
// rotation of the frame's key points, so it can't disagree with the drawing.
import { dist, mid, deg, rad } from "./vec"
import { formatLengthValue, type LengthUnit } from "./units"
import type { FrameInputs, FrameResult, Vec2 } from "./types"

/** The 40 x 120 mm profile's wide face, across the spine. */
export const SPINE_WIDTH = 120

/** Room left past the last station for clamps, mm. */
export const ALLOWANCE = 100

/** Round up to the next multiple of `step`. */
export const roundUp = (n: number, step: number) => Math.ceil(n / step - 1e-9) * step

export interface JigSettings {
  /** From the spine's front face to the frame's center plane, seen from above, mm. */
  centerOffset: number
  /** From the base up to the pivot where the spine mounts to the post, mm. */
  postHeight: number
}

/** Examples. Both depend on how you build the jig. */
export const DEFAULT_JIG: JigSettings = { centerOffset: 150, postHeight: 700 }

export type StationId = "rearAxle" | "bb" | "headBottom" | "headTop" | "seatTop" | "frontAxle"

export interface JigStation {
  id: StationId
  name: string
  /** Forward of the rear axle, mm (level frame view; used for the check distances). */
  x: number
  /** Up from the rear axle, mm. */
  y: number
  /** Along the spine from the rear axle, mm. */
  u: number
  /** Across the spine from its centerline, mm. Positive toward the seat tube side. */
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
  /** Angle from the spine's forward direction to the carrier's upward direction, degrees. */
  angleToSpine: number
  /** Degrees away from square to the spine. Negative leans toward the rear. */
  offSquare: number
  /** Where the carrier's axis crosses the spine centerline, along the spine from the rear axle. Null if it never does. */
  crossing: number | null
  /** Distance along the carrier from that crossing to each station it holds. Positive is toward the top of the tube. */
  stops: { station: StationId; along: number }[]
  /** Length to cut, mm. */
  length: number
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
  tilt: {
    /** Degrees above the axle-to-axle line. */
    degrees: number
    /** How much the far end rises over one meter of the spine, mm. */
    risePerMeter: number
  }
  spine: {
    /** Along the spine from the rear axle, mm. */
    uMin: number
    uMax: number
    /** Cut length, mm. */
    length: number
    /** Where the post meets the spine, along it from the rear axle, mm. */
    postU: number
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
  const at = (v: Vec2): Vec2 => ({ x: v.x - o.x, y: v.y - o.y })

  const headMid = at(mid(p.headBottom, p.headTop))
  if (!(headMid.x > 0)) return null
  const tau = Math.atan2(headMid.y, headMid.x)
  const c = Math.cos(tau)
  const s = Math.sin(tau)
  const toSpine = (q: Vec2) => ({ u: q.x * c + q.y * s, v: -q.x * s + q.y * c })

  const D = settings.centerOffset
  const st = (
    id: StationId,
    name: string,
    point: Vec2,
    note: string,
    standoff: number,
    extra: { halfWidth?: number; angle?: number } = {},
  ): JigStation => {
    const q = at(point)
    return { id, name, x: q.x, y: q.y, ...toSpine(q), standoff, note, ...extra }
  }

  const stations: JigStation[] = [
    st("rearAxle", "Rear axle (fixed)", p.rearAxle, "On the spine centerline. The standoff reaches the near dropout face.", D - inputs.rearSpacing / 2, {
      halfWidth: inputs.rearSpacing / 2,
    }),
    st("bb", "Bottom bracket", p.bb, "Center of the shell. Stopped on the seat tube carrier.", D - inputs.bbShellWidth / 2, {
      halfWidth: inputs.bbShellWidth / 2,
    }),
    st("headBottom", "Head tube bottom", p.headBottom, "Bottom end of the head tube, on its centerline.", D, { angle: inputs.headTubeAngle }),
    st("headTop", "Head tube top", p.headTop, "Top end of the head tube, on its centerline.", D, { angle: inputs.headTubeAngle }),
    st("seatTop", "Seat tube top", p.seatTop, "Top of the seat tube. The tube also passes through the BB.", D, { angle: inputs.seatTubeAngle }),
    st("frontAxle", "Front axle (check)", p.frontAxle, "Where a gauge or dummy fork's axle should land. Level with the rear axle.", D),
  ]
  const by = Object.fromEntries(stations.map((x) => [x.id, x])) as Record<StationId, JigStation>

  const carrier = (
    id: JigCarrier["id"],
    name: string,
    lower: StationId,
    upper: StationId,
    tubeAngle: number,
  ): JigCarrier => {
    // The tube's upward direction in the frame, then in spine coordinates.
    const a = rad(tubeAngle)
    const dx = -Math.cos(a)
    const dy = Math.sin(a)
    const du = dx * c + dy * s
    const dv = -dx * s + dy * c
    const angleToSpine = deg(Math.atan2(dv, du))
    const lo = by[lower]
    const crossing = Math.abs(dv) < 1e-9 ? null : lo.u + (-lo.v / dv) * du
    const cu = crossing ?? lo.u
    const along = (q: JigStation) => (q.u - cu) * du + q.v * dv
    const stops = [lower, upper].map((sid) => ({ station: sid, along: along(by[sid]) }))
    const lowest = Math.min(0, ...stops.map((x) => x.along))
    const highest = Math.max(0, ...stops.map((x) => x.along))
    return {
      id,
      name,
      angleToSpine,
      offSquare: angleToSpine - 90,
      crossing,
      stops,
      length: roundUp(highest - lowest + 2 * ALLOWANCE, 50),
    }
  }

  const carriers = [
    carrier("seat", "Seat tube carrier", "bb", "seatTop", inputs.seatTubeAngle),
    carrier("head", "Head tube carrier", "headBottom", "headTop", inputs.headTubeAngle),
  ]

  const ends = [0, by.headBottom.u, by.headTop.u, ...carriers.map((x) => x.crossing).filter((x): x is number => x !== null)]
  const uMin = Math.min(...ends) - ALLOWANCE
  const uMax = Math.max(...ends) + ALLOWANCE

  const check = (id: string, name: string, from: StationId, to: StationId): JigCheck => ({
    id,
    name,
    from,
    to,
    length: dist(by[from], by[to]),
  })

  const notes: string[] = []
  if (!(D > 0)) notes.push("The spine face has to be some distance from the frame's center plane.")
  for (const x of stations) {
    if (x.halfWidth !== undefined && x.standoff <= 0) {
      notes.push(`${x.name}: the center offset is smaller than half its width, so the standoff comes out zero or less.`)
    }
  }

  return {
    settings,
    tilt: { degrees: deg(tau), risePerMeter: Math.tan(tau) * 1000 },
    spine: { uMin, uMax, length: roundUp(uMax - uMin, 50), postU: (uMin + uMax) / 2 },
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
  tilt: { min: number; max: number }
  /** Spine length that holds every frame, mm. */
  spineLength: number
  /** How far each carrier has to move and rotate to cover every frame. */
  carriers: {
    id: JigCarrier["id"]
    name: string
    crossing: { min: number; max: number }
    angleToSpine: { min: number; max: number }
    length: number
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
    tilt: range(list.map((j) => j.tilt.degrees)),
    spineLength: roundUp(Math.max(...list.map((j) => j.spine.uMax)) - Math.min(...list.map((j) => j.spine.uMin)), 50),
    carriers: ids.map((id) => {
      const cs = list.map((j) => j.carriers.find((c) => c.id === id)!)
      return {
        id,
        name: cs[0].name,
        crossing: range(cs.map((c) => c.crossing ?? 0)),
        angleToSpine: range(cs.map((c) => c.angleToSpine)),
        length: Math.max(...cs.map((c) => c.length)),
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
  return ["Carrier", "Angle to spine (deg)", "Off square (deg)", `Crosses spine at (${unit})`, `Cut length (${unit})`, "Stops (distance along carrier from the crossing)"]
}

function carrierRow(c: JigCarrier, unit: LengthUnit): string[] {
  return [
    c.name,
    String(Number(c.angleToSpine.toFixed(1))),
    String(Number(c.offSquare.toFixed(1))),
    c.crossing === null ? "" : formatLengthValue(c.crossing, unit),
    formatLengthValue(c.length, unit),
    c.stops.map((x) => `${x.station} ${formatLengthValue(x.along, unit)}`).join("; "),
  ]
}

const csvCell = (s: string) => (/[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s)

function tiltLine(jig: Jig): string[] {
  return ["Spine tilt (deg above the axle-to-axle line)", String(Number(jig.tilt.degrees.toFixed(2))), "Rise over 1000 mm of spine (mm)", String(Number(jig.tilt.risePerMeter.toFixed(1)))]
}

export function jigCsv(jig: Jig, unit: LengthUnit): string {
  const rows: string[][] = [
    tiltLine(jig),
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
    tiltLine(jig),
    [],
    header(unit),
    ...jig.stations.map((s) => row(s, unit)),
    [],
    carrierHeader(unit),
    ...jig.carriers.map((c) => carrierRow(c, unit)),
  ]
  return rows.map((r) => r.join("\t")).join("\n")
}
