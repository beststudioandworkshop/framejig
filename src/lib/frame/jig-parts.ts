// Parts list for the jig, sized from the frames you've loaded. The jig is a
// T-slot extrusion spine with uprights (the design in docs/jig-notes.md).
//
// Part numbers are NEVER filled in here. McMaster-Carr's catalog wasn't
// reachable when this was written, so each part has the text to search for and
// an empty `partNumber` for whoever orders it. Sizes marked "to suit" depend
// on your tubes and dropouts: measure them, don't guess.
import type { Jig, StationId } from "./jig"
import { formatLengthValue, type LengthUnit } from "./units"

export interface JigPart {
  id: string
  /** Number on the jig schematic, matching this row. 0 if the part isn't drawn. */
  callout: number
  name: string
  qty: number
  /** What to buy. */
  spec: string
  /** Length to cut, mm, for extrusion parts. */
  cutLength?: number
  note: string
  /** Text to type into McMaster-Carr's search box. */
  search: string
  /** Fill in after looking it up. Always null here: never guessed. */
  partNumber: string | null
}

/** Round up to the next multiple of `step`. */
export const roundUp = (n: number, step: number) => Math.ceil(n / step - 1e-9) * step

/** Space left past the last station for clamps, and so a column isn't flush with its mandrel. */
export const ALLOWANCE = 100
const STEP = 50

function highest(jigs: Jig[], id: StationId): number {
  return Math.max(...jigs.map((j) => j.stations.find((s) => s.id === id)!.yFromSpine))
}

/** Parts for a jig that can hold every frame in `jigs`. Empty if there are none. */
export function jigParts(jigs: (Jig | null)[]): JigPart[] {
  const list = jigs.filter((j): j is Jig => j !== null)
  if (list.length === 0) return []

  const all = list.flatMap((j) => j.stations)
  const minX = Math.min(...all.map((s) => s.x))
  const maxX = Math.max(...all.map((s) => s.x))
  const spine = roundUp(maxX - minX + 2 * ALLOWANCE, STEP)
  const column = (id: StationId) => roundUp(highest(list, id) + ALLOWANCE, STEP)

  const part = (p: Omit<JigPart, "partNumber">): JigPart => ({ ...p, partNumber: null })

  return [
    part({
      id: "spine",
      callout: 1,
      name: "Spine",
      qty: 1,
      spec: "Metric T-slotted framing, 40 mm x 120 mm",
      cutLength: spine,
      note: "Runs parallel to the axle line. The rear axle block sits at one end; the stations spread along it.",
      search: "metric t-slotted framing 40 mm x 120 mm",
    }),
    part({
      id: "rearAxleBlock",
      callout: 2,
      name: "Rear axle block",
      qty: 1,
      spec: "Metric T-slotted framing, 40 mm x 80 mm, short length, with a bore or slot for the dummy axle",
      cutLength: 200,
      note: "Fixed. The one point that never moves. Dropout faces sit half the rear spacing either side of the centre plane.",
      search: "metric t-slotted framing 40 mm x 80 mm",
    }),
    part({
      id: "bbRiser",
      callout: 3,
      name: "Bottom bracket riser",
      qty: 1,
      spec: "Metric T-slotted framing, 40 mm x 80 mm",
      cutLength: column("bb"),
      note: "Slides along the spine to set the chainstay. Carries the BB mandrel.",
      search: "metric t-slotted framing 40 mm x 80 mm",
    }),
    part({
      id: "headColumn",
      callout: 4,
      name: "Head tube column",
      qty: 1,
      spec: "Metric T-slotted framing, 40 mm x 80 mm",
      cutLength: column("headTop"),
      note: "Reaches the head tube top. The mandrel is set by its bottom and top positions.",
      search: "metric t-slotted framing 40 mm x 80 mm",
    }),
    part({
      id: "seatColumn",
      callout: 5,
      name: "Seat tube column",
      qty: 1,
      spec: "Metric T-slotted framing, 40 mm x 80 mm",
      cutLength: column("seatTop"),
      note: "Holds the top of the seat tube. The tube also passes through the BB.",
      search: "metric t-slotted framing 40 mm x 80 mm",
    }),
    part({
      id: "frontAxlePost",
      callout: 6,
      name: "Front axle check post",
      qty: 1,
      spec: "Metric T-slotted framing, 40 mm x 80 mm",
      cutLength: roundUp(highest(list, "frontAxle") + ALLOWANCE, STEP),
      note: "Optional. Where a gauge or dummy fork's axle should land, level with the rear axle.",
      search: "metric t-slotted framing 40 mm x 80 mm",
    }),
    part({
      id: "mandrels",
      callout: 7,
      name: "Mandrels (head tube, BB, seat tube)",
      qty: 3,
      spec: "Precision-ground steel shaft, diameter to suit each tube's bore (slip fit)",
      note: "Measure each tube's inside diameter after reaming and facing. Head tube mandrel must be longer than the head tube plus the clamps.",
      search: "precision ground shaft",
    }),
    part({
      id: "dummyAxle",
      callout: 8,
      name: "Dummy axle",
      qty: 1,
      spec: "Precision-ground shaft, diameter to suit your dropouts (quick release or thru-axle)",
      note: "Locates the dropouts on the rear axle block.",
      search: "precision ground shaft",
    }),
    part({
      id: "shaftCollars",
      callout: 9,
      name: "Shaft collars",
      qty: 8,
      spec: "Clamp-on shaft collars, bore to suit the mandrels",
      note: "Hold each mandrel in its column and set its position.",
      search: "clamp-on shaft collars",
    }),
    part({
      id: "framingFasteners",
      callout: 10,
      name: "T-nuts and bolts",
      qty: 1,
      spec: "T-slot nuts and screws to match the framing series, enough for every joint plus spares",
      note: "Use the fastener that matches the slot of the framing you order.",
      search: "t-slotted framing t-nuts",
    }),
    part({
      id: "brackets",
      callout: 11,
      name: "Framing brackets",
      qty: 1,
      spec: "Corner or angle brackets to match the framing series, one pair per column",
      note: "Square each column to the spine. Check with a machinist's square before tightening.",
      search: "t-slotted framing corner brackets",
    }),
    part({
      id: "scale",
      callout: 12,
      name: "Spine scale",
      qty: 1,
      spec: "Adhesive-backed steel rule, long enough for the spine",
      note: "Reads the x position of each column along the spine. Your tape and calipers still check it.",
      search: "adhesive backed steel rule",
    }),
    part({
      id: "clamps",
      callout: 0,
      name: "Hold-down clamps",
      qty: 4,
      spec: "Toggle clamps, or other quick-release hold-downs, to hold tubes while tacking",
      note: "Keep them away from the heat.",
      search: "toggle clamps",
    }),
    part({
      id: "feet",
      callout: 0,
      name: "Levelling feet or stand",
      qty: 4,
      spec: "Adjustable levelling feet, rated for the jig and a frame",
      note: "Level the spine before you set anything.",
      search: "leveling feet",
    }),
    part({
      id: "endCaps",
      callout: 0,
      name: "End caps",
      qty: 1,
      spec: "Caps to match the framing profile, one per open end",
      note: "Keeps swarf and sharp edges out of your hands.",
      search: "t-slotted framing end caps",
    }),
  ]
}

function partRow(p: JigPart, unit: LengthUnit): string[] {
  return [
    p.callout > 0 ? String(p.callout) : "",
    p.name,
    String(p.qty),
    p.spec,
    p.cutLength === undefined ? "" : formatLengthValue(p.cutLength, unit),
    p.search,
    p.partNumber ?? "",
  ]
}

function partHeader(unit: LengthUnit): string[] {
  return ["#", "Part", "Qty", "What to buy", `Cut length (${unit})`, "Search McMaster-Carr for", "Part number"]
}

const csvCell = (s: string) => (/[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s)

/** The parts list as CSV. The part number column is left empty for whoever orders. */
export function jigPartsCsv(parts: JigPart[], unit: LengthUnit): string {
  return [partHeader(unit), ...parts.map((p) => partRow(p, unit))].map((r) => r.map(csvCell).join(",")).join("\n") + "\n"
}

/** Tab-separated, so it pastes straight into a spreadsheet. */
export function jigPartsText(parts: JigPart[], unit: LengthUnit): string {
  return [partHeader(unit), ...parts.map((p) => partRow(p, unit))].map((r) => r.join("\t")).join("\n")
}
