// Jig settings for a fixed rear axle. Every position is measured from the
// rear axle centre: forward is +x, up is +y (so the BB is below, negative).
// The jig spine runs parallel to the axle line; "up from spine" is the height
// of a station above the spine's datum face, which sits `spineOffset` below
// the axle line. All of this is a translation of the frame's key points, so
// it can't disagree with the drawing or the schedule.
import { dist } from "./vec"
import { formatLengthValue, type LengthUnit } from "./units"
import type { FrameInputs, FrameResult, Vec2 } from "./types"

export interface JigSettings {
  /** How far below the axle line the spine's datum face sits, mm. */
  spineOffset: number
}

/** An example. It depends on how your spine and BB hardware are built. */
export const DEFAULT_JIG: JigSettings = { spineOffset: 100 }

export type StationId = "rearAxle" | "bb" | "headBottom" | "headTop" | "seatTop" | "frontAxle"

export interface JigStation {
  id: StationId
  name: string
  /** Forward of the rear axle, mm. */
  x: number
  /** Up from the axle line, mm (negative = below). */
  y: number
  /** Up from the spine's datum face, mm. */
  yFromSpine: number
  /** The locator sits this far either side of the centre plane (a half width), mm. Absent for centre-plane points. */
  halfWidth?: number
  /** Angle from horizontal of the tube this station holds, degrees. */
  angle?: number
  note: string
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
  stations: JigStation[]
  checks: JigCheck[]
}

export function buildJig(inputs: FrameInputs, result: FrameResult, settings: JigSettings): Jig | null {
  const p = result.points
  if (!p) return null
  const o = p.rearAxle
  const at = (v: Vec2): Vec2 => ({ x: v.x - o.x, y: v.y - o.y })
  const st = (
    id: StationId,
    name: string,
    v: Vec2,
    note: string,
    extra: { halfWidth?: number; angle?: number } = {},
  ): JigStation => {
    const q = at(v)
    return { id, name, x: q.x, y: q.y, yFromSpine: q.y + settings.spineOffset, note, ...extra }
  }

  const stations: JigStation[] = [
    st("rearAxle", "Rear axle (fixed)", p.rearAxle, "The fixed point. Dropout faces sit half the rear spacing either side of the centre plane.", {
      halfWidth: inputs.rearSpacing / 2,
    }),
    st("bb", "Bottom bracket", p.bb, "Centre of the shell. Slide it along the spine to set the chainstay.", {
      halfWidth: inputs.bbShellWidth / 2,
    }),
    st("headBottom", "Head tube bottom", p.headBottom, "Bottom end of the head tube, on its centreline.", { angle: inputs.headTubeAngle }),
    st("headTop", "Head tube top", p.headTop, "Top end of the head tube, on its centreline.", { angle: inputs.headTubeAngle }),
    st("seatTop", "Seat tube top", p.seatTop, "Top of the seat tube. The tube also passes through the BB.", { angle: inputs.seatTubeAngle }),
    st("frontAxle", "Front axle (check)", p.frontAxle, "Where a gauge or dummy fork's axle should land. Level with the rear axle."),
  ]

  const byId = Object.fromEntries(stations.map((s) => [s.id, s])) as Record<StationId, JigStation>
  const check = (id: string, name: string, from: StationId, to: StationId): JigCheck => ({
    id,
    name,
    from,
    to,
    length: dist(byId[from], byId[to]),
  })

  return {
    settings,
    stations,
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
  }
}

export interface JigEnvelope {
  /** How many frames this covers. */
  frames: number
  /** Furthest back and forward any station reaches along the spine, from the rear axle, mm. */
  minX: number
  maxX: number
  /** Length of spine the stations span, mm. */
  spanX: number
  /** Lowest and highest any station sits above the spine datum face, mm. */
  minHeight: number
  maxHeight: number
}

/** The room the jig needs to hold all of these frames. Null if there are none. */
export function jigEnvelope(jigs: (Jig | null)[]): JigEnvelope | null {
  const list = jigs.filter((j): j is Jig => j !== null)
  if (list.length === 0) return null
  const all = list.flatMap((j) => j.stations)
  const minX = Math.min(...all.map((s) => s.x))
  const maxX = Math.max(...all.map((s) => s.x))
  return {
    frames: list.length,
    minX,
    maxX,
    spanX: maxX - minX,
    minHeight: Math.min(...all.map((s) => s.yFromSpine)),
    maxHeight: Math.max(...all.map((s) => s.yFromSpine)),
  }
}

function header(unit: LengthUnit): string[] {
  return [
    "Station",
    `Forward of rear axle (${unit})`,
    `Up from axle line (${unit})`,
    `Up from spine (${unit})`,
    `Side to side, each way (${unit})`,
    "Angle from horizontal (deg)",
  ]
}

function row(s: JigStation, unit: LengthUnit): string[] {
  return [
    s.name,
    formatLengthValue(s.x, unit),
    formatLengthValue(s.y, unit),
    formatLengthValue(s.yFromSpine, unit),
    s.halfWidth === undefined ? "" : formatLengthValue(s.halfWidth, unit),
    s.angle === undefined ? "" : String(Number(s.angle.toFixed(1))),
  ]
}

const csvCell = (s: string) => (/[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s)

export function jigCsv(jig: Jig, unit: LengthUnit): string {
  const rows = jig.stations.map((s) => row(s, unit))
  return [header(unit), ...rows].map((r) => r.map(csvCell).join(",")).join("\n") + "\n"
}

/** Tab-separated, so it pastes straight into a spreadsheet. */
export function jigText(jig: Jig, unit: LengthUnit): string {
  const rows = jig.stations.map((s) => row(s, unit))
  return [header(unit), ...rows].map((r) => r.join("\t")).join("\n")
}
