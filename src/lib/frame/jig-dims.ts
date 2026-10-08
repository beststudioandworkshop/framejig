// Dimension lines for the jig drawings: where each one starts, where it stops, and
// what it reads. They come from the same Jig the tables use, so a number on the
// drawing is always a number in a table (tested).
import { ALLOWANCE, CARRIER_WIDTH, POST_OVERLAP, POST_WIDTH, PROFILE_THICKNESS, SPINE_HEIGHT, type Jig, type JigCarrier, type JigStation } from "./jig"
import type { FrameInputs, Vec2 } from "./types"

export interface JigDim {
  id: string
  name: string
  /** Where the dimension starts and stops, in the view's own coordinates (mm). */
  from: Vec2
  to: Vec2
  /**
   * "x": a level dimension; `at` is the y of its line.
   * "y": an upright dimension; `at` is the x of its line.
   * "aligned": along from to to; `at` is the distance of its line to the left of that direction.
   */
  kind: "x" | "y" | "aligned"
  at: number
  /** What it reads, mm. */
  value: number
}

const station = (jig: Jig, id: string): JigStation => jig.stations.find((s) => s.id === id)!
const carrierOf = (jig: Jig, id: JigCarrier["id"]) => jig.carriers.find((c) => c.id === id)!

/**
 * The side view, x forward from the rear axle and y up from the axle line.
 * The drawing places the seat post below the spine and the head post above it.
 */
export function sideDims(jig: Jig): JigDim[] {
  const { bottom, top, uMin } = jig.spine
  const seat = carrierOf(jig, "seat")
  const head = carrierOf(jig, "head")
  const pinS = station(jig, seat.pivot)
  const pinH = station(jig, head.pivot)
  const dir = (c: JigCarrier): Vec2 => {
    const a = (c.tubeAngle * Math.PI) / 180
    return { x: -Math.cos(a), y: Math.sin(a) }
  }
  const along = (c: JigCarrier, pin: JigStation, d: number): Vec2 => ({ x: pin.x + dir(c).x * d, y: pin.y + dir(c).y * d })

  const postTopSeat = bottom + POST_OVERLAP
  const postBottomSeat = postTopSeat - seat.postLength
  const postBottomHead = top - POST_OVERLAP
  const postTopHead = postBottomHead + head.postLength
  const lowest = Math.min(postBottomSeat, pinS.y - ALLOWANCE)
  const highest = Math.max(postTopHead, along(head, pinH, head.length - ALLOWANCE).y)
  const leftX = uMin - 70

  return [
    { id: "clearance", name: "Axle line to the spine's bottom edge", from: { x: leftX, y: 0 }, to: { x: leftX, y: bottom }, kind: "y", at: leftX, value: bottom },
    { id: "spineHeight", name: "Spine height", from: { x: leftX, y: bottom }, to: { x: leftX, y: top }, kind: "y", at: leftX, value: SPINE_HEIGHT },
    {
      id: "seatPinAlong",
      name: "Rear axle to the BB pin, along the spine",
      from: { x: 0, y: 0 },
      to: { x: pinS.u, y: pinS.y },
      kind: "x",
      at: lowest - 70,
      value: seat.pivotU,
    },
    {
      id: "headPinAlong",
      name: "Rear axle to the head tube bottom pin, along the spine",
      from: { x: 0, y: 0 },
      to: { x: pinH.u, y: pinH.y },
      kind: "x",
      at: highest + 90,
      value: head.pivotU,
    },
    {
      id: "seatPinBeyond",
      name: "Spine bottom edge to the BB pin",
      from: { x: pinS.u, y: bottom },
      to: { x: pinS.u, y: pinS.y },
      kind: "y",
      at: pinS.u + POST_WIDTH / 2 + 60,
      value: seat.pinClearance,
    },
    {
      id: "headPinBeyond",
      name: "Spine top edge to the head tube bottom pin",
      from: { x: pinH.u, y: top },
      to: { x: pinH.u, y: pinH.y },
      kind: "y",
      at: pinH.u + POST_WIDTH / 2 + 60,
      value: head.pinClearance,
    },
    { id: "seatPost", name: "Seat tube post, cut length", from: { x: pinS.u - POST_WIDTH / 2, y: postTopSeat }, to: { x: pinS.u - POST_WIDTH / 2, y: postBottomSeat }, kind: "y", at: pinS.u - POST_WIDTH / 2 - 60, value: seat.postLength },
    { id: "headPost", name: "Head tube post, cut length", from: { x: pinH.u - POST_WIDTH / 2, y: postBottomHead }, to: { x: pinH.u - POST_WIDTH / 2, y: postTopHead }, kind: "y", at: pinH.u - POST_WIDTH / 2 - 60, value: head.postLength },
    { id: "seatStop", name: "BB pin to the seat tube top, along the carrier", from: along(seat, pinS, 0), to: along(seat, pinS, seat.stops[1].along), kind: "aligned", at: CARRIER_WIDTH / 2 + 60, value: seat.stops[1].along },
    { id: "seatCarrier", name: "Seat tube carrier, cut length", from: along(seat, pinS, -ALLOWANCE), to: along(seat, pinS, seat.length - ALLOWANCE), kind: "aligned", at: CARRIER_WIDTH / 2 + 140, value: seat.length },
    { id: "headStop", name: "Head tube bottom pin to the head tube top, along the carrier", from: along(head, pinH, 0), to: along(head, pinH, head.stops[1].along), kind: "aligned", at: -(CARRIER_WIDTH / 2 + 60), value: head.stops[1].along },
    { id: "headCarrier", name: "Head tube carrier, cut length", from: along(head, pinH, -ALLOWANCE), to: along(head, pinH, head.length - ALLOWANCE), kind: "aligned", at: -(CARRIER_WIDTH / 2 + 140), value: head.length },
  ]
}

/**
 * The top view: x along the spine from the rear axle, y outward from the spine's
 * front face toward the frame's center plane. The spine sits at y from -40 to 0.
 */
export function planDims(jig: Jig, inputs: Pick<FrameInputs, "rearSpacing" | "bbShellWidth">): JigDim[] {
  const D = jig.settings.centerOffset
  const { uMin, uMax } = jig.spine
  const bb = station(jig, "bb")
  const rear = station(jig, "rearAxle")
  const xRear = rear.u
  const xBB = bb.u
  const half = (w: number) => w / 2
  return [
    { id: "spineLength", name: "Spine, cut length", from: { x: uMin, y: -PROFILE_THICKNESS }, to: { x: uMax, y: -PROFILE_THICKNESS }, kind: "x", at: -PROFILE_THICKNESS - 60, value: jig.spine.length },
    { id: "centerOffset", name: "Spine face to the frame's center plane", from: { x: uMin, y: 0 }, to: { x: uMin, y: D }, kind: "y", at: uMin - 40, value: D },
    { id: "rearStandoff", name: "Rear axle standoff, spine face to the near dropout face", from: { x: xRear, y: 0 }, to: { x: xRear, y: D - half(inputs.rearSpacing) }, kind: "y", at: xRear - 80, value: D - half(inputs.rearSpacing) },
    { id: "rearSpacing", name: "Rear spacing", from: { x: xRear, y: D - half(inputs.rearSpacing) }, to: { x: xRear, y: D + half(inputs.rearSpacing) }, kind: "y", at: xRear + 80, value: inputs.rearSpacing },
    { id: "bbStandoff", name: "BB locator, spine face to the near shell face", from: { x: xBB, y: 0 }, to: { x: xBB, y: D - half(inputs.bbShellWidth) }, kind: "y", at: xBB + 110, value: D - half(inputs.bbShellWidth) },
    { id: "bbShell", name: "BB shell width", from: { x: xBB, y: D - half(inputs.bbShellWidth) }, to: { x: xBB, y: D + half(inputs.bbShellWidth) }, kind: "y", at: xBB + 110, value: inputs.bbShellWidth },
  ]
}

/** The two ends of a dimension line and the extension lines to it, in the same coordinates as `from` and `to`. */
export function dimGeometry(d: JigDim): { a: Vec2; b: Vec2 } {
  if (d.kind === "x") return { a: { x: d.from.x, y: d.at }, b: { x: d.to.x, y: d.at } }
  if (d.kind === "y") return { a: { x: d.at, y: d.from.y }, b: { x: d.at, y: d.to.y } }
  const dx = d.to.x - d.from.x
  const dy = d.to.y - d.from.y
  const len = Math.hypot(dx, dy) || 1
  const n = { x: (-dy / len) * d.at, y: (dx / len) * d.at }
  return { a: { x: d.from.x + n.x, y: d.from.y + n.y }, b: { x: d.to.x + n.x, y: d.to.y + n.y } }
}
