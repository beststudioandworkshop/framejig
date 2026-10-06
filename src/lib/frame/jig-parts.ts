// Parts list for the jig, sized from the frames you've loaded. The jig is a
// T-slot extrusion spine with uprights (the design in docs/jig-notes.md).
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
  const standoff = Math.max(
    STEP,
    roundUp(Math.min(...list.map((j) => j.stations.find((s) => s.id === "rearAxle")!.standoff)), 10),
  )
  const post = list[0].settings.postHeight
  const tilt = list.map((j) => j.tilt.degrees)
  const tiltNote =
    list.length > 1
      ? `${tilt.map((t) => `${Number(t.toFixed(1))}°`).join(" and ")} for these frames`
      : `${Number(tilt[0].toFixed(1))}° for this frame`

  const part = (p: Omit<JigPart, "partNumber">): JigPart => ({ ...p, partNumber: null })

  return [
    part({
      id: "spine",
      callout: 1,
      name: "Main spine",
      qty: 1,
      spec: "Metric T-slotted framing, 40 mm x 120 mm",
      cutLength: spine,
      note: `Runs from the rear axle through the middle of the head tube, tilted ${tiltNote} above the axle-to-axle line. The carriers mount on its front face.`,
      search: "metric t-slotted framing 40 mm x 120 mm",
    }),
    part({
      id: "post",
      callout: 2,
      name: "Spine post",
      qty: 1,
      spec: "Metric T-slotted framing, 40 mm x 80 mm, upright",
      cutLength: post,
      note: "Mounts to the back side of the spine. The cut length is your pivot height; change it above to suit your bench or floor.",
      search: "metric t-slotted framing 40 mm x 80 mm",
    }),
    part({
      id: "pivot",
      callout: 3,
      name: "Spine pivot and angle lock",
      qty: 1,
      spec: "Hinge or pivot bracket for the framing series, plus a way to lock the angle",
      note: "Where the spine meets the post. It has to hold the tilt while you set the carriers and tack.",
      search: "t-slotted framing hinges",
    }),
    part({
      id: "base",
      callout: 4,
      name: "Post base and feet",
      qty: 4,
      spec: "Adjustable leveling feet on a base the post bolts to",
      note: "Level the base before you set the tilt.",
      search: "leveling feet",
    }),
    part({
      id: "rearStandoff",
      callout: 5,
      name: "Rear axle standoff",
      qty: 1,
      spec: "Metric T-slotted framing, 40 mm x 80 mm, with a bore or slot for the dummy axle",
      cutLength: standoff,
      note: "Reaches out from the spine face to the near dropout face, so the dummy axle reaches the frame's center line seen from above.",
      search: "metric t-slotted framing 40 mm x 80 mm",
    }),
    part({
      id: "seatCarrier",
      callout: 6,
      name: "Seat tube carrier",
      qty: 1,
      spec: "Metric T-slotted framing, 40 mm x 80 mm",
      cutLength: carrier("seat"),
      note: "Runs along the seat tube and carries the BB stop. The most adjustable carrier: along the spine, across it, and rotation.",
      search: "metric t-slotted framing 40 mm x 80 mm",
    }),
    part({
      id: "headCarrier",
      callout: 7,
      name: "Head tube carrier",
      qty: 1,
      spec: "Metric T-slotted framing, 40 mm x 80 mm",
      cutLength: carrier("head"),
      note: "Runs along the head tube and carries its mandrel. Rotates to the head angle.",
      search: "metric t-slotted framing 40 mm x 80 mm",
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
      name: "Framing brackets and pivot clamps",
      qty: 1,
      spec: "Brackets to match the framing series, enough to mount each carrier to the spine with a way to rotate and lock it",
      note: "The seat tube and head tube carriers rotate, so they need a pivot bolt and a clamp, not a fixed corner.",
      search: "t-slotted framing brackets",
    }),
    part({
      id: "scale",
      callout: 13,
      name: "Spine scale",
      qty: 1,
      spec: "Adhesive-backed steel rule, long enough for the spine",
      note: "Reads the position of each carrier along the spine. Your tape and calipers still check it.",
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
