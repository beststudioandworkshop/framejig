// Side-view drawing, as plain data. Built from the same key points as
// everything else; the SVG component only draws what's here.
// Drawing coordinates: millimeters, Y DOWN (SVG), same X as the frame.
import { makeTubes } from "./build"
import type { FrameInputs, FrameResult, KeyPoints, TubeRole, Vec2 } from "./types"
import { add, deg, rad, scale, sub } from "./vec"

export interface Circle {
  cx: number
  cy: number
  r: number
}

export interface TubeOutline {
  role: TubeRole
  /** The four corners of the tube drawn at its real diameter. */
  corners: [Vec2, Vec2, Vec2, Vec2]
  a: Vec2
  b: Vec2
}

export type DimensionId =
  | "wheelbase"
  | "trail"
  | "bbHeight"
  | "stack"
  | "reach"
  | "effectiveTopTube"
  | "seatTubeLength"
  | "headTubeLength"
  | "chainstay"

export interface DimensionLine {
  id: DimensionId
  name: string
  /** What the dimension reads, mm. */
  value: number
  axis: "x" | "y" | "aligned"
  /** Thin extension lines from the measured points out to the dimension line (none where the point is on it). */
  ext: [Vec2, Vec2][]
  line: [Vec2, Vec2]
  /** Center of the dimension line. */
  labelMid: Vec2
  /** Unit vector pointing from the line toward where the label sits. */
  labelNormal: Vec2
  /** Text rotation in degrees (SVG sense), kept readable: -90 to 90. */
  labelAngle: number
}

export interface Box {
  minX: number
  minY: number
  maxX: number
  maxY: number
}

export interface Drawing {
  wheels: { tire: Circle; rim: Circle }[]
  tubes: TubeOutline[]
  /** Crown to front axle. */
  fork: [Vec2, Vec2]
  /** Steering axis from above the head tube down to the ground. */
  steeringAxis: [Vec2, Vec2]
  /** Where the front tire touches the ground. */
  contact: Vec2
  ground: [Vec2, Vec2]
  /** Level crank, then foot to the toe. */
  crank: [Vec2, Vec2]
  foot: [Vec2, Vec2]
  dims: DimensionLine[]
  /** Bounds of the frame, wheels and dimension lines (not label text). */
  bounds: Box
}

const GAP = 6
const OVERSHOOT = 10

const flip = (p: Vec2): Vec2 => ({ x: p.x, y: -p.y })

function shifted(p: KeyPoints, o: Vec2): KeyPoints {
  const mv = (v: Vec2): Vec2 => ({ x: v.x + o.x, y: v.y + o.y })
  return {
    bb: mv(p.bb),
    rearAxle: mv(p.rearAxle),
    frontAxle: mv(p.frontAxle),
    headTop: mv(p.headTop),
    headBottom: mv(p.headBottom),
    seatTop: mv(p.seatTop),
    topTubeSeatJoint: mv(p.topTubeSeatJoint),
    topTubeHeadJoint: mv(p.topTubeHeadJoint),
    downTubeHeadJoint: mv(p.downTubeHeadJoint),
    groundY: p.groundY + o.y,
  }
}

function outline(a: Vec2, b: Vec2, diameter: number): [Vec2, Vec2, Vec2, Vec2] {
  const d = sub(b, a)
  const len = Math.hypot(d.x, d.y) || 1
  const n = { x: (-d.y / len) * (diameter / 2), y: (d.x / len) * (diameter / 2) }
  return [flip(add(a, n)), flip(add(b, n)), flip(sub(b, n)), flip(sub(a, n))]
}

/** Keep text upright: fold an angle into -90..90. */
function readable(angle: number): number {
  if (angle > 90) return angle - 180
  if (angle <= -90) return angle + 180
  return angle
}

/** The measured point can sit right on the dimension line; no extension line is needed then. */
function dropEmpty(lines: [Vec2, Vec2][]): [Vec2, Vec2][] {
  return lines.filter(([a, b]) => Math.hypot(b.x - a.x, b.y - a.y) > 1e-6)
}

/** Horizontal (axis "x") or vertical (axis "y") dimension, drawn at `at` (a Y for "x", an X for "y"). */
function linear(
  id: DimensionId,
  name: string,
  a: Vec2,
  b: Vec2,
  axis: "x" | "y",
  at: number,
  labelSide: 1 | -1 = 1,
): DimensionLine {
  // Work in frame coordinates (Y up), flip at the end.
  const pa = axis === "x" ? { x: a.x, y: at } : { x: at, y: a.y }
  const pb = axis === "x" ? { x: b.x, y: at } : { x: at, y: b.y }
  const out = (m: Vec2, p: Vec2): Vec2 => {
    const d = sub(p, m)
    const len = Math.hypot(d.x, d.y) || 1
    const u = scale(d, 1 / len)
    return add(p, scale(u, OVERSHOOT))
  }
  const start = (m: Vec2, p: Vec2): Vec2 => {
    const d = sub(p, m)
    const len = Math.hypot(d.x, d.y) || 1
    return add(m, scale(d, Math.min(GAP, len) / len))
  }
  return {
    id,
    name,
    value: axis === "x" ? Math.abs(b.x - a.x) : Math.abs(b.y - a.y),
    axis,
    ext: dropEmpty([
      [flip(start(a, pa)), flip(out(a, pa))],
      [flip(start(b, pb)), flip(out(b, pb))],
    ]),
    line: [flip(pa), flip(pb)],
    labelMid: flip({ x: (pa.x + pb.x) / 2, y: (pa.y + pb.y) / 2 }),
    // Label above a horizontal line (-Y in SVG), left of a vertical one.
    labelNormal: axis === "x" ? { x: 0, y: -labelSide } : { x: -labelSide, y: 0 },
    labelAngle: axis === "x" ? 0 : -90,
  }
}

/** Dimension parallel to a-b, offset sideways by `offset` (positive = to the left of a -> b, in frame coords). */
function aligned(id: DimensionId, name: string, a: Vec2, b: Vec2, offset: number): DimensionLine {
  const d = sub(b, a)
  const len = Math.hypot(d.x, d.y) || 1
  const left = { x: -d.y / len, y: d.x / len }
  const sign = offset >= 0 ? 1 : -1
  const n = scale(left, offset)
  const pa = add(a, n)
  const pb = add(b, n)
  const outward = scale(left, sign)
  const ext = (m: Vec2, p: Vec2): [Vec2, Vec2] => [
    flip(add(m, scale(outward, GAP))),
    flip(add(p, scale(outward, OVERSHOOT))),
  ]
  const lineSvg = [flip(pa), flip(pb)] as [Vec2, Vec2]
  const angle = readable(deg(Math.atan2(lineSvg[1].y - lineSvg[0].y, lineSvg[1].x - lineSvg[0].x)))
  return {
    id,
    name,
    value: len,
    axis: "aligned",
    ext: dropEmpty([ext(a, pa), ext(b, pb)]),
    line: lineSvg,
    labelMid: { x: (lineSvg[0].x + lineSvg[1].x) / 2, y: (lineSvg[0].y + lineSvg[1].y) / 2 },
    labelNormal: { x: outward.x, y: -outward.y },
    labelAngle: angle,
  }
}

/**
 * The side view. `offset` slides the whole frame (frame coordinates, Y up),
 * used to line a reference bike up with another. Returns null if the frame
 * couldn't be solved at all; draws even when it has errors so you can see why.
 */
export function buildDrawing(inputs: FrameInputs, result: FrameResult, offset: Vec2 = { x: 0, y: 0 }): Drawing | null {
  if (!result.points || !result.metrics) return null
  const m = result.metrics
  const p = shifted(result.points, offset)
  const R = m.wheelRadius
  const a = rad(inputs.headTubeAngle)

  const tubes: TubeOutline[] = makeTubes(inputs, result.points).map((t) => {
    const ta = add(t.a, offset)
    const tb = add(t.b, offset)
    return { role: t.role, corners: outline(ta, tb, t.diameter), a: flip(ta), b: flip(tb) }
  })

  const axisUp = { x: -Math.cos(a), y: Math.sin(a) }
  const axisTop = add(p.headTop, scale(axisUp, 80))
  const down = { x: Math.cos(a), y: -Math.sin(a) }
  const axisGround = add(p.headBottom, scale(down, (p.headBottom.y - p.groundY) / Math.sin(a)))
  const contact = { x: p.frontAxle.x, y: p.groundY }

  const crankEnd = add(p.bb, { x: inputs.crankLength, y: 0 })
  const toe = add(crankEnd, { x: inputs.toeProjection, y: 0 })

  const wheel = (c: Vec2) => ({
    tire: { cx: c.x, cy: -c.y, r: R },
    rim: { cx: c.x, cy: -c.y, r: inputs.wheel.rimDiameter / 2 },
  })

  const lowest = p.groundY
  const dims: DimensionLine[] = [
    linear("wheelbase", "Wheelbase", p.rearAxle, p.frontAxle, "x", lowest - 130, -1),
    linear("trail", "Trail", contact, axisGround, "x", lowest - 50, -1),
    linear("bbHeight", "BB height", { x: p.bb.x, y: lowest }, p.bb, "y", p.bb.x + 110),
    linear("stack", "Stack", p.bb, p.headTop, "y", p.bb.x),
    linear("reach", "Reach", p.bb, p.headTop, "x", p.headTop.y + 110),
    linear(
      "effectiveTopTube",
      "Eff. top tube",
      { x: p.headTop.x - m.effectiveTopTube, y: p.headTop.y },
      p.headTop,
      "x",
      p.headTop.y + 45,
    ),
    aligned("seatTubeLength", "Seat tube", p.bb, p.seatTop, 70),
    aligned("headTubeLength", "Head tube", p.headBottom, p.headTop, -60),
    aligned("chainstay", "Chainstay", p.bb, p.rearAxle, 50),
  ]
  // Trail reads as a distance whichever way round the two points fall.
  dims[1].value = Math.abs(axisGround.x - contact.x)

  const drawing: Drawing = {
    wheels: [wheel(p.rearAxle), wheel(p.frontAxle)],
    tubes,
    fork: [flip(p.headBottom), flip(p.frontAxle)],
    steeringAxis: [flip(axisTop), flip(axisGround)],
    contact: flip(contact),
    ground: [
      flip({ x: p.rearAxle.x - R - 40, y: p.groundY }),
      flip({ x: p.frontAxle.x + R + 40, y: p.groundY }),
    ],
    crank: [flip(p.bb), flip(crankEnd)],
    foot: [flip(crankEnd), flip(toe)],
    dims,
    bounds: { minX: 0, minY: 0, maxX: 0, maxY: 0 },
  }
  drawing.bounds = boundsOf(drawing)
  return drawing
}

function boundsOf(d: Drawing): Box {
  const pts: Vec2[] = []
  for (const w of d.wheels) {
    pts.push({ x: w.tire.cx - w.tire.r, y: w.tire.cy - w.tire.r }, { x: w.tire.cx + w.tire.r, y: w.tire.cy + w.tire.r })
  }
  for (const t of d.tubes) pts.push(...t.corners)
  pts.push(...d.fork, ...d.steeringAxis, ...d.ground, ...d.crank, ...d.foot)
  for (const dim of d.dims) pts.push(...dim.line, ...dim.ext.flat())
  return {
    minX: Math.min(...pts.map((q) => q.x)),
    maxX: Math.max(...pts.map((q) => q.x)),
    minY: Math.min(...pts.map((q) => q.y)),
    maxY: Math.max(...pts.map((q) => q.y)),
  }
}

/** A viewBox that fits every drawing, with a margin (mm) for labels. */
export function viewBoxOf(drawings: Drawing[], margin = 80) {
  const b = drawings.map((d) => d.bounds)
  const minX = Math.min(...b.map((x) => x.minX)) - margin
  const minY = Math.min(...b.map((x) => x.minY)) - margin
  const maxX = Math.max(...b.map((x) => x.maxX)) + margin
  const maxY = Math.max(...b.map((x) => x.maxY)) + margin
  return { x: minX, y: minY, width: maxX - minX, height: maxY - minY }
}

/** Where to shift a reference frame so it lines up with `main` at the chosen anchor. */
export function alignOffset(main: KeyPoints, ref: KeyPoints, anchor: "bb" | "rearAxle" | "frontAxle"): Vec2 {
  const m = main[anchor]
  const r = ref[anchor]
  return { x: m.x - r.x, y: m.y - r.y }
}
