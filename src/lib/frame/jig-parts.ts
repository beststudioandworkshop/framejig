// Parts list for the jig. The cut list is the user's own stock (see JIG_STOCK): the lengths they have, and
// a check, for every frame loaded, that the parts are long enough to hold it. The hardware follows what they said they need.
//
// Part numbers are NEVER filled in here. McMaster-Carr's catalog wasn't
// reachable when this was written, so each part has the text to search for and
// an empty `partNumber` for whoever orders it. Sizes marked "to suit" depend
// on your tubes and dropouts: measure them, don't guess.
import { ALLOWANCE, CARRIER_WIDTH, PROFILE_THICKNESS, POST_WIDTH, type Jig } from "./jig"
import { formatLengthValue, type LengthUnit } from "./units"

/** A feature along a cut part, measured from its left end as the parts diagram draws it (mm). */
export interface PartMark {
  kind: "pin" | "stop" | "post" | "axle"
  label: string
  at: number
}

/** Whether a part is long enough for the frames loaded. */
export interface PartFit {
  ok: boolean
  /** In words, with the numbers. */
  note: string
}

export interface JigPart {
  id: string
  /** Number on the cut-parts picture, matching this row. 0 if the part isn't drawn. */
  callout: number
  name: string
  qty: number
  /** What to buy. */
  spec: string
  /** Length to cut, mm, for extrusion parts. */
  cutLength?: number
  /** The extrusion's profile, for the parts diagram, e.g. "40 x 120". */
  profile?: { thickness: number; width: number }
  /** Where things sit along it, for the parts diagram. */
  marks?: PartMark[]
  /** For a cut part: does it hold the frames loaded? */
  fit?: PartFit
  note: string
  /** Text to type into McMaster-Carr's search box. */
  search: string
  /** Fill in after looking it up. Always null here: never guessed. */
  partNumber: string | null
}

/** The extrusion the user has, in mm: the lengths of each cut part. */
export const JIG_STOCK = {
  spine: 1200,
  headPost: 300,
  rearHub: 300,
  bbPost: 220,
  headCarrier: 300,
  seatCarrier: 600,
} as const

/** Room past a pin or a stop that a carrier or post still needs, mm. */
const ROOM_BELOW_PIN = ALLOWANCE
const ROOM_PAST_STOP = 50

const mm = (n: number) => `${Math.round(n)} mm`

/** Parts for a jig that can hold every frame in `jigs`. Empty if there are none. */
export function jigParts(jigs: (Jig | null)[]): JigPart[] {
  const list = jigs.filter((j): j is Jig => j !== null)
  if (list.length === 0) return []

  const first = list[0]
  const clearance = first.spine.bottom
  const carrierOf = (j: Jig, id: "seat" | "head") => j.carriers.find((c) => c.id === id)!
  const profile120 = { thickness: PROFILE_THICKNESS, width: POST_WIDTH }
  const profile80 = { thickness: PROFILE_THICKNESS, width: CARRIER_WIDTH }

  // The worst case among the frames loaded, for each cut part.
  const spineNeed = Math.max(...list.map((j) => j.spine.length))
  const stopReach = (id: "seat" | "head") => Math.max(...list.map((j) => carrierOf(j, id).stops[1].along))
  const pinHeight = (id: "seat" | "head") => Math.max(...list.map((j) => Math.max(0, carrierOf(j, id).pinClearance)))
  const fitSpine: PartFit = {
    ok: JIG_STOCK.spine >= spineNeed,
    note: JIG_STOCK.spine >= spineNeed ? `${mm(JIG_STOCK.spine)} holds the ${mm(spineNeed)} the stations need.` : `The stations need ${mm(spineNeed)}; yours is ${mm(JIG_STOCK.spine)}.`,
  }
  const fitPost = (id: "seat" | "head", have: number): PartFit => {
    const need = pinHeight(id) + ROOM_PAST_STOP
    return {
      ok: have >= need,
      note: have >= need ? `Holds the pin ${mm(pinHeight(id))} out from the spine, with room past it.` : `The pin sits ${mm(pinHeight(id))} out from the spine, which needs ${mm(need)}; yours is ${mm(have)}.`,
    }
  }
  const fitCarrier = (id: "seat" | "head", have: number): PartFit => {
    const holds = have - ROOM_BELOW_PIN - ROOM_PAST_STOP
    const reach = stopReach(id)
    return { ok: holds >= reach, note: `Holds a ${id === "seat" ? "seat" : "head"} tube up to ${mm(holds)} along it; this frame's is ${mm(reach)}.` }
  }

  const carrierMarks = (id: "seat" | "head"): PartMark[] => {
    const c = carrierOf(first, id)
    return [
      { kind: "pin", label: id === "seat" ? "BB pin" : "head pin", at: ROOM_BELOW_PIN },
      { kind: "stop", label: id === "seat" ? "seat top" : "head top", at: ROOM_BELOW_PIN + c.stops[1].along },
    ]
  }
  // Posts butt against the spine's edge, so the pin sits its clearance from the end that touches it.
  const postMarks = (id: "seat" | "head"): PartMark[] => [{ kind: "pin", label: id === "seat" ? "BB pin" : "head pin", at: Math.max(0, carrierOf(first, id).pinClearance) }]

  const part = (p: Omit<JigPart, "partNumber">): JigPart => ({ ...p, partNumber: null })

  const parts: JigPart[] = [
    part({
      id: "spine",
      callout: 1,
      name: "Main spine",
      qty: 1,
      spec: "Metric T-slotted framing, 40 mm x 120 mm",
      cutLength: JIG_STOCK.spine,
      profile: profile120,
      marks: [
        { kind: "axle", label: "rear axle", at: -first.spine.uMin },
        { kind: "post", label: "BB post", at: carrierOf(first, "seat").pivotU - first.spine.uMin },
        { kind: "post", label: "head post", at: carrierOf(first, "head").pivotU - first.spine.uMin },
      ],
      fit: fitSpine,
      note: `Runs level, parallel to the axle line, with its bottom edge ${Number(clearance.toFixed(1))} mm above it and its 120 mm face standing up.`,
      search: "metric t-slotted framing 40 mm x 120 mm",
    }),
    part({
      id: "headPost",
      callout: 2,
      name: "Head tube post",
      qty: 1,
      spec: "Metric T-slotted framing, 40 mm x 120 mm",
      cutLength: JIG_STOCK.headPost,
      profile: profile120,
      marks: postMarks("head"),
      fit: fitPost("head", JIG_STOCK.headPost),
      note: "Stands on the spine's top edge, in the spine's plane. The head tube carrier pivots on a pin at the bottom of the head tube.",
      search: "metric t-slotted framing 40 mm x 120 mm",
    }),
    part({
      id: "bbPost",
      callout: 3,
      name: "Bottom bracket post",
      qty: 1,
      spec: "Metric T-slotted framing, 40 mm x 120 mm",
      cutLength: JIG_STOCK.bbPost,
      profile: profile120,
      marks: postMarks("seat"),
      fit: fitPost("seat", JIG_STOCK.bbPost),
      note: "Hangs from the spine's bottom edge, in the spine's plane. The seat tube carrier pivots on a pin at the BB center.",
      search: "metric t-slotted framing 40 mm x 120 mm",
    }),
    part({
      id: "rearHub",
      callout: 4,
      name: "Rear hub plate",
      qty: 1,
      spec: "Metric T-slotted framing, 40 mm x 120 mm",
      cutLength: JIG_STOCK.rearHub,
      profile: profile120,
      note: "Stands on the frame's center plane and carries the dummy axle. In your Rhino model two 80 mm blocks join it to the spine; they are not on your list, so add them if you keep them.",
      search: "metric t-slotted framing 40 mm x 120 mm",
    }),
    part({
      id: "headCarrier",
      callout: 5,
      name: "Head tube carrier",
      qty: 1,
      spec: "Metric T-slotted framing, 40 mm x 80 mm",
      cutLength: JIG_STOCK.headCarrier,
      profile: profile80,
      marks: carrierMarks("head"),
      fit: fitCarrier("head", JIG_STOCK.headCarrier),
      note: "Rotates about the head tube bottom pin to the head angle and carries the head tube mandrel.",
      search: "metric t-slotted framing 40 mm x 80 mm",
    }),
    part({
      id: "seatCarrier",
      callout: 6,
      name: "Seat tube carrier",
      qty: 1,
      spec: "Metric T-slotted framing, 40 mm x 80 mm",
      cutLength: JIG_STOCK.seatCarrier,
      profile: profile80,
      marks: carrierMarks("seat"),
      fit: fitCarrier("seat", JIG_STOCK.seatCarrier),
      note: "Rotates about the BB pin to the seat tube angle and carries the seat tube mandrel.",
      search: "metric t-slotted framing 40 mm x 80 mm",
    }),
    part({
      id: "facePlates",
      callout: 7,
      name: "Face plates for the perpendicular 120 x 40 joints",
      qty: 3,
      spec: "Face plate, or gusset, for a perpendicular joint of two 40 mm x 120 mm extrusions, with its bolts",
      note: "One for each post that butts against the spine: the head tube post, the bottom bracket post and the rear hub plate.",
      search: "t-slotted framing face plate 40 mm",
    }),
    part({
      id: "largeBrackets",
      callout: 8,
      name: "Large 90 degree brackets",
      qty: 8,
      spec: "Large 90 degree brackets for 40 mm framing, with their bolts and T-nuts",
      note: "The critical joints, which hold the posts and the rear hub square to the spine.",
      search: "t-slotted framing 90 degree brackets 40 mm",
    }),
    part({
      id: "smallBrackets",
      callout: 9,
      name: "Small 90 degree brackets",
      qty: 8,
      spec: "Smaller 90 degree brackets for 40 mm framing, with their bolts and T-nuts (at least 8)",
      note: "The less critical joints. Buy a few more than you plan to use.",
      search: "t-slotted framing 90 degree brackets small",
    }),
    part({
      id: "framingFasteners",
      callout: 10,
      name: "Bolts and T-nuts",
      qty: 1,
      spec: "T-slot nuts and bolts to match the framing series, enough for every joint plus spares",
      note: "Use the fastener that matches the slot of the framing you order. Count them from the brackets and plates above.",
      search: "t-slotted framing t-nuts and bolts",
    }),
    part({
      id: "pivotPins",
      callout: 11,
      name: "Pivot pins",
      qty: 2,
      spec: "Shoulder bolts or precision-ground pins, diameter to suit your framing's bore, with a locking nut or collar",
      note: "One at the BB center, one at the bottom of the head tube. Each carrier turns about its pin.",
      search: "shoulder screws",
    }),
    part({
      id: "mandrels",
      callout: 12,
      name: "Mandrels (head tube, seat tube, BB)",
      qty: 3,
      spec: "Precision-ground steel shaft, diameter to suit each tube's bore (slip fit)",
      note: "Measure each tube's inside diameter after reaming and facing. The head tube mandrel must be longer than the head tube plus the clamps.",
      search: "precision ground shaft",
    }),
    part({
      id: "dummyAxle",
      callout: 13,
      name: "Dummy axle",
      qty: 1,
      spec: "Precision-ground shaft, diameter to suit your dropouts (quick release or thru-axle)",
      note: "Locates the dropouts on the rear hub plate.",
      search: "precision ground shaft",
    }),
    part({
      id: "shaftCollars",
      callout: 14,
      name: "Shaft collars",
      qty: 8,
      spec: "Clamp-on shaft collars, bore to suit the mandrels",
      note: "Hold each mandrel in its carrier and set its position.",
      search: "clamp-on shaft collars",
    }),
    part({
      id: "angleClamps",
      callout: 15,
      name: "Angle clamps for the carriers",
      qty: 2,
      spec: "A clamp or locking bracket on each carrier to hold its angle about the pin",
      note: "Not decided yet. Set the angle with a digital angle gauge on the carrier.",
      search: "t-slotted framing pivot hinges",
    }),
    part({
      id: "scale",
      callout: 16,
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
  return parts
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
