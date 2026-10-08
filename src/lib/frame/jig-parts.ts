// Parts list for the jig, sized from the frames you've loaded. The jig is a
// T-slot extrusion spine, level, with two posts that carry the pivoting carriers
// (the design in docs/jig-notes.md).
//
// Part numbers are NEVER filled in here. McMaster-Carr's catalog wasn't
// reachable when this was written, so each part has the text to search for and
// an empty `partNumber` for whoever orders it. Sizes marked "to suit" depend
// on your tubes and dropouts: measure them, don't guess.
import { roundUp, type Jig } from "./jig"
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

const STEP = 50

/** Parts for a jig that can hold every frame in `jigs`. Empty if there are none. */
export function jigParts(jigs: (Jig | null)[]): JigPart[] {
  const list = jigs.filter((j): j is Jig => j !== null)
  if (list.length === 0) return []

  const spine = roundUp(Math.max(...list.map((j) => j.spine.uMax)) - Math.min(...list.map((j) => j.spine.uMin)), STEP)
  const carrier = (id: "seat" | "head") => Math.max(...list.map((j) => j.carriers.find((c) => c.id === id)!.length))
  const post = (id: "seat" | "head") => Math.max(...list.map((j) => j.carriers.find((c) => c.id === id)!.postLength))
  const standoff = Math.max(
    STEP,
    roundUp(Math.min(...list.map((j) => j.stations.find((s) => s.id === "rearAxle")!.standoff)), 10),
  )
  const clearance = list[0].spine.bottom

  const part = (p: Omit<JigPart, "partNumber">): JigPart => ({ ...p, partNumber: null })

  return [
    part({
      id: "spine",
      callout: 1,
      name: "Main spine",
      qty: 1,
      spec: "Metric T-slotted framing, 40 mm x 120 mm",
      cutLength: spine,
      note: `Runs level, parallel to the axle line, with its bottom edge ${Number(clearance.toFixed(1))} mm above it and its 120 mm face standing up. The posts and the rear standoff mount on its front face.`,
      search: "metric t-slotted framing 40 mm x 120 mm",
    }),
    part({
      id: "bbPost",
      callout: 2,
      name: "Seat tube post (BB pivot)",
      qty: 1,
      spec: "Metric T-slotted framing, 40 mm x 80 mm, upright",
      cutLength: post("seat"),
      note: "Bolts to the spine's front face and hangs below it. It slides along the spine to the BB position. The seat tube carrier pivots on a pin at the BB center.",
      search: "metric t-slotted framing 40 mm x 80 mm",
    }),
    part({
      id: "headPost",
      callout: 3,
      name: "Head tube post (head tube bottom pivot)",
      qty: 1,
      spec: "Metric T-slotted framing, 40 mm x 80 mm, upright",
      cutLength: post("head"),
      note: "Bolts to the spine's front face and stands above it. It slides along the spine to the head tube bottom. The head tube carrier pivots on a pin at the bottom of the head tube.",
      search: "metric t-slotted framing 40 mm x 80 mm",
    }),
    part({
      id: "rearStandoff",
      callout: 4,
      name: "Rear axle standoff",
      qty: 1,
      spec: "Metric T-slotted framing, 40 mm x 80 mm, with a bore or slot for the dummy axle",
      cutLength: standoff,
      note: "Reaches out from the spine face to the near dropout face, so the dummy axle reaches the frame's center line seen from above.",
      search: "metric t-slotted framing 40 mm x 80 mm",
    }),
    part({
      id: "seatCarrier",
      callout: 5,
      name: "Seat tube carrier",
      qty: 1,
      spec: "Metric T-slotted framing, 40 mm x 80 mm",
      cutLength: carrier("seat"),
      note: "Rotates about the BB pin to the seat tube angle and carries the seat tube mandrel. The most adjustable carrier: along the spine, up and down the post, and rotation.",
      search: "metric t-slotted framing 40 mm x 80 mm",
    }),
    part({
      id: "headCarrier",
      callout: 6,
      name: "Head tube carrier",
      qty: 1,
      spec: "Metric T-slotted framing, 40 mm x 80 mm",
      cutLength: carrier("head"),
      note: "Rotates about the head tube bottom pin to the head angle and carries the head tube mandrel.",
      search: "metric t-slotted framing 40 mm x 80 mm",
    }),
    part({
      id: "pivotPins",
      callout: 7,
      name: "Pivot pins",
      qty: 2,
      spec: "Shoulder bolts or precision-ground pins, diameter to suit your framing's bore, with a locking nut or collar",
      note: "One at the BB center, one at the bottom of the head tube. Each carrier turns about its pin.",
      search: "shoulder screws",
    }),
    part({
      id: "mandrels",
      callout: 8,
      name: "Mandrels (head tube, seat tube, BB)",
      qty: 3,
      spec: "Precision-ground steel shaft, diameter to suit each tube's bore (slip fit)",
      note: "Measure each tube's inside diameter after reaming and facing. The head tube mandrel must be longer than the head tube plus the clamps.",
      search: "precision ground shaft",
    }),
    part({
      id: "dummyAxle",
      callout: 9,
      name: "Dummy axle",
      qty: 1,
      spec: "Precision-ground shaft, diameter to suit your dropouts (quick release or thru-axle)",
      note: "Locates the dropouts on the rear axle standoff.",
      search: "precision ground shaft",
    }),
    part({
      id: "shaftCollars",
      callout: 10,
      name: "Shaft collars",
      qty: 8,
      spec: "Clamp-on shaft collars, bore to suit the mandrels",
      note: "Hold each mandrel in its carrier and set its position.",
      search: "clamp-on shaft collars",
    }),
    part({
      id: "framingFasteners",
      callout: 11,
      name: "T-nuts and bolts",
      qty: 1,
      spec: "T-slot nuts and screws to match the framing series, enough for every joint plus spares",
      note: "Use the fastener that matches the slot of the framing you order.",
      search: "t-slotted framing t-nuts",
    }),
    part({
      id: "brackets",
      callout: 12,
      name: "Angle clamps for the carriers",
      qty: 2,
      spec: "A clamp or locking bracket on each carrier to hold its angle about the pin",
      note: "The carriers rotate, so they need a pivot and a clamp to hold the angle you set. Set the angle with a digital angle gauge on the carrier.",
      search: "t-slotted framing pivot hinges",
    }),
    part({
      id: "scale",
      callout: 13,
      name: "Spine scale",
      qty: 1,
      spec: "Adhesive-backed steel rule, long enough for the spine",
      note: "Reads the position of each post along the spine. Your tape and calipers still check it.",
      search: "adhesive backed steel rule",
    }),
    part({
      id: "supports",
      callout: 0,
      name: "Spine supports and base",
      qty: 1,
      spec: "To suit your bench or floor: uprights or brackets that hold the spine level, with leveling feet",
      note: `Hold the spine level and ${Number(clearance.toFixed(1))} mm above the axle line. Level it before you set anything.`,
      search: "leveling feet",
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
