// buildFrame: the single source of geometry. Everything else (drawing, tube
// schedule, jig settings) reads this result and computes nothing itself.
import {
  ANGLE_LIMITS,
  LENGTH_MAX,
  MIN_TYRE_CLEARANCE_WARN,
  TOE_CLEARANCE_WARN,
} from "./constants"
import type {
  FrameInputs,
  FrameMetrics,
  FrameResult,
  FrameTube,
  Issue,
  KeyPoints,
  TubeRole,
  Vec2,
} from "./types"
import { add, deg, dist, distToSegment, mid, rad, scale, sub } from "./vec"

const err = (code: string, message: string, field?: string): Issue => ({
  code,
  message,
  field,
  severity: "error",
})
const warn = (code: string, message: string, field?: string): Issue => ({
  code,
  message,
  field,
  severity: "warning",
})

interface NumberField {
  path: string
  value: number
  min: number
  label: string
}

function numberFields(i: FrameInputs): NumberField[] {
  const d = i.drivers
  const f: NumberField[] = [
    { path: "wheel.rimDiameter", value: i.wheel.rimDiameter, min: 1, label: "Rim diameter" },
    { path: "wheel.tyreSection", value: i.wheel.tyreSection, min: 1, label: "Tyre section" },
    { path: "crankLength", value: i.crankLength, min: 1, label: "Crank length" },
    { path: "toeProjection", value: i.toeProjection, min: 0, label: "Toe projection" },
    { path: "seatTubeExtension", value: i.seatTubeExtension, min: 0, label: "Seat tube extension" },
    { path: "forkAxleToCrown", value: i.forkAxleToCrown, min: 1, label: "Fork axle-to-crown" },
    { path: "forkRake", value: i.forkRake, min: 0, label: "Fork rake" },
  ]
  f.push(
    d.bb === "drop"
      ? { path: "bbDrop", value: i.bbDrop, min: 0, label: "BB drop" }
      : { path: "bbHeight", value: i.bbHeight, min: 1, label: "BB height" },
    d.rear === "chainstay"
      ? { path: "chainstayLength", value: i.chainstayLength, min: 1, label: "Chainstay length" }
      : { path: "rearCentre", value: i.rearCentre, min: 1, label: "Rear centre" },
    d.seat === "ct"
      ? { path: "seatTubeLength", value: i.seatTubeLength, min: 1, label: "Seat tube length (c-t)" }
      : { path: "seatTubeLengthCC", value: i.seatTubeLengthCC, min: 1, label: "Seat tube length (c-c)" },
    d.horizontal === "effectiveTopTube"
      ? { path: "effectiveTopTube", value: i.effectiveTopTube, min: 1, label: "Effective top tube" }
      : d.horizontal === "frontCentre"
        ? { path: "frontCentre", value: i.frontCentre, min: 1, label: "Front centre" }
        : { path: "reach", value: i.reach, min: 1, label: "Reach" },
    d.vertical === "headTubeLength"
      ? { path: "headTubeLength", value: i.headTubeLength, min: 1, label: "Head tube length" }
      : { path: "stack", value: i.stack, min: 1, label: "Stack" },
  )
  for (const [role, t] of Object.entries(i.tubes)) {
    f.push(
      { path: `tubes.${role}.diameter`, value: t.diameter, min: 1, label: `${role} diameter` },
      { path: `tubes.${role}.wall`, value: t.wall, min: 0.1, label: `${role} wall` },
    )
  }
  return f
}

/** The BB drop, chainstay and seat tube lengths actually used, whichever way they were specified. */
function resolveBase(i: FrameInputs) {
  const R = i.wheel.rimDiameter / 2 + i.wheel.tyreSection
  const drop = i.drivers.bb === "drop" ? i.bbDrop : R - i.bbHeight
  const chainstay = i.drivers.rear === "chainstay" ? i.chainstayLength : Math.hypot(i.rearCentre, drop)
  const seatTop = i.drivers.seat === "ct" ? i.seatTubeLength : i.seatTubeLengthCC + i.seatTubeExtension
  return { R, drop, chainstay, seatTop }
}

function validateInputs(i: FrameInputs): Issue[] {
  const issues: Issue[] = []
  for (const f of numberFields(i)) {
    if (!Number.isFinite(f.value)) {
      issues.push(err("not-a-number", `${f.label} needs a number.`, f.path))
    } else if (f.value < f.min) {
      issues.push(err("too-small", `${f.label} must be at least ${f.min}.`, f.path))
    } else if (f.value > LENGTH_MAX) {
      issues.push(err("too-large", `${f.label} can't be more than ${LENGTH_MAX} mm.`, f.path))
    }
  }
  for (const [path, label, value] of [
    ["seatTubeAngle", "Seat tube angle", i.seatTubeAngle],
    ["headTubeAngle", "Head tube angle", i.headTubeAngle],
  ] as const) {
    if (!Number.isFinite(value)) {
      issues.push(err("not-a-number", `${label} needs a number.`, path))
    } else if (value < ANGLE_LIMITS.min || value > ANGLE_LIMITS.max) {
      issues.push(
        err("angle-range", `${label} must be between ${ANGLE_LIMITS.min}° and ${ANGLE_LIMITS.max}°.`, path),
      )
    }
  }
  for (const [role, t] of Object.entries(i.tubes)) {
    if (Number.isFinite(t.diameter) && Number.isFinite(t.wall) && t.wall * 2 >= t.diameter) {
      issues.push(err("wall-too-thick", `The ${role} wall is thicker than the tube allows.`, `tubes.${role}.wall`))
    }
  }
  if (issues.length === 0) {
    const base = resolveBase(i)
    if (base.drop < 0) {
      issues.push(err("bb-above-axle", "The bottom bracket would sit above the axles. Lower the BB height.", "bbHeight"))
    }
    if (base.chainstay <= base.drop) {
      issues.push(err("chainstay-short", "The chainstay must be longer than the BB drop.", "chainstayLength"))
    }
    if (base.seatTop <= i.seatTubeExtension && i.drivers.seat === "ct") {
      issues.push(err("seat-extension", "The seat tube extension must be shorter than the seat tube.", "seatTubeExtension"))
    }
  }
  return issues
}

interface Solved {
  points: KeyPoints
  wheelRadius: number
}

/**
 * Place the key points. BB at the origin, both axles at y = bbDrop, so the
 * fork fixes where the head tube bottom is. Numbers mode then places the head
 * tube from the effective top tube; fit mode places it from stack and reach
 * (and the head tube length falls out).
 */
function solve(i: FrameInputs): Solved {
  const { R, drop, chainstay, seatTop: seatLen } = resolveBase(i)
  const a = rad(i.headTubeAngle)
  const s = rad(i.seatTubeAngle)
  const sinA = Math.sin(a)
  const cosA = Math.cos(a)

  const bb: Vec2 = { x: 0, y: 0 }
  const rearAxle: Vec2 = { x: -Math.sqrt(chainstay ** 2 - drop ** 2), y: drop }

  // Seat tube runs from the BB up and back.
  const seatDir: Vec2 = { x: -Math.cos(s), y: Math.sin(s) }
  const seatTop = scale(seatDir, seatLen)

  // Steering axis runs from the head tube top (up and back) to the bottom (down and forward).
  const headUp: Vec2 = { x: -cosA, y: sinA }
  // Axles are level at y = drop, so the fork fixes the height of the head tube bottom.
  const bottomY = drop + i.forkAxleToCrown * sinA - i.forkRake * cosA
  const headLen =
    i.drivers.vertical === "headTubeLength" ? i.headTubeLength : (i.stack - bottomY) / sinA

  let bottomX: number
  switch (i.drivers.horizontal) {
    case "reach":
      // Head tube top is at x = reach.
      bottomX = i.reach + headLen * cosA
      break
    case "frontCentre":
      // Front axle is at x = frontCentre: back out the fork.
      bottomX = i.frontCentre - i.forkAxleToCrown * cosA - i.forkRake * sinA
      break
    default:
      // Axis crosses the seat tube top height at x = seatTop.x + effectiveTopTube.
      bottomX = seatTop.x + i.effectiveTopTube - (bottomY - seatTop.y) / Math.tan(a)
  }
  const headBottom: Vec2 = { x: bottomX, y: bottomY }
  const headTop = add(headBottom, scale(headUp, headLen))

  // Front axle: down the steering axis by axle-to-crown, then forward by the rake.
  const down: Vec2 = { x: cosA, y: -sinA }
  const forward: Vec2 = { x: sinA, y: cosA }
  const frontAxle = add(add(headBottom, scale(down, i.forkAxleToCrown)), scale(forward, i.forkRake))

  const len = dist(headTop, headBottom)
  const upUnit = scale(sub(headTop, headBottom), len > 0 ? 1 / len : 0)
  const topTubeHeadJoint = sub(headTop, scale(upUnit, i.tubes.topTube.diameter / 2))
  const downTubeHeadJoint = add(headBottom, scale(upUnit, i.tubes.downTube.diameter / 2))
  const topTubeSeatJoint = scale(seatDir, seatLen - i.seatTubeExtension)

  return {
    wheelRadius: R,
    points: {
      bb,
      rearAxle,
      frontAxle,
      headTop,
      headBottom,
      seatTop,
      topTubeSeatJoint,
      topTubeHeadJoint,
      downTubeHeadJoint,
      groundY: drop - R,
    },
  }
}

/** Ground trail from the steering axis, the textbook way: (R cos(a) - offset) / sin(a). */
function trailOf(R: number, headAngleDeg: number, rake: number): number {
  const a = rad(headAngleDeg)
  return (R * Math.cos(a) - rake) / Math.sin(a)
}

function metricsOf(i: FrameInputs, { points: p, wheelRadius: R }: Solved): FrameMetrics {
  const a = rad(i.headTubeAngle)
  // Head tube axis x at the seat tube top height, relative to the seat tube top.
  const axisX = p.headBottom.x - (p.seatTop.y - p.headBottom.y) / Math.tan(a)
  const ttMid = mid(p.topTubeSeatJoint, p.topTubeHeadJoint)
  const bbDrop = p.rearAxle.y
  const bbHeight = R - bbDrop
  const seatLength = dist(p.bb, p.seatTop)
  const toe: Vec2 = { x: i.crankLength + i.toeProjection, y: 0 }

  return {
    wheelRadius: R,
    wheelbase: p.frontAxle.x - p.rearAxle.x,
    frontCentre: p.frontAxle.x,
    rearCentre: -p.rearAxle.x,
    bbHeight,
    bbDrop,
    chainstayLength: dist(p.bb, p.rearAxle),
    seatTubeLength: seatLength,
    seatTubeLengthCC: seatLength - i.seatTubeExtension,
    trail: trailOf(R, i.headTubeAngle, i.forkRake),
    stack: p.headTop.y,
    reach: p.headTop.x,
    effectiveTopTube: axisX - p.seatTop.x,
    headTubeLength: dist(p.headTop, p.headBottom),
    topTubeSlope: deg(
      Math.atan2(p.topTubeHeadJoint.y - p.topTubeSeatJoint.y, p.topTubeHeadJoint.x - p.topTubeSeatJoint.x),
    ),
    standover: bbHeight + ttMid.y + i.tubes.topTube.diameter / 2,
    toeClearance: dist(toe, p.frontAxle) - R,
    rearTyreClearance: distToSegment(p.rearAxle, p.bb, p.seatTop) - R - i.tubes.seatTube.diameter / 2,
    frontTyreClearance:
      distToSegment(p.frontAxle, p.bb, p.downTubeHeadJoint) - R - i.tubes.downTube.diameter / 2,
  }
}

function geometryIssues(m: FrameMetrics, p: KeyPoints): Issue[] {
  const issues: Issue[] = []
  if (m.headTubeLength <= 0 || p.headTop.y <= p.headBottom.y) {
    issues.push(
      err(
        "head-tube-length",
        "That stack doesn't leave room for a head tube with this fork. Raise the stack or shorten the fork.",
        "stack",
      ),
    )
  }
  if (m.reach <= 0) {
    issues.push(err("reach-negative", "The head tube top would sit behind the bottom bracket.", "reach"))
  }
  if (m.effectiveTopTube <= 0) {
    issues.push(err("top-tube-negative", "The effective top tube works out to zero or less.", "effectiveTopTube"))
  }
  if (p.topTubeHeadJoint.x <= p.topTubeSeatJoint.x) {
    issues.push(err("top-tube-length", "The top tube would have no length. Check the angles and top tube.", "effectiveTopTube"))
  }
  if (m.rearTyreClearance < 0) {
    issues.push(err("rear-tyre-clash", "The rear tyre hits the seat tube. Lengthen the chainstays or narrow the tyre.", "chainstayLength"))
  } else if (m.rearTyreClearance < MIN_TYRE_CLEARANCE_WARN) {
    issues.push(warn("rear-tyre-tight", "The rear tyre clears the seat tube by very little.", "chainstayLength"))
  }
  if (m.frontTyreClearance < 0) {
    issues.push(err("front-tyre-clash", "The front tyre hits the down tube.", "forkAxleToCrown"))
  } else if (m.frontTyreClearance < MIN_TYRE_CLEARANCE_WARN) {
    issues.push(warn("front-tyre-tight", "The front tyre clears the down tube by very little.", "forkAxleToCrown"))
  }
  if (m.toeClearance < 0) {
    issues.push(
      warn("toe-overlap", `Toe overlap: your toe reaches ${Math.round(-m.toeClearance)} mm into the front tyre (straight ahead, crank level).`, "crankLength"),
    )
  } else if (m.toeClearance < TOE_CLEARANCE_WARN) {
    issues.push(warn("toe-near-overlap", "Your toe nearly touches the front tyre (straight ahead, crank level).", "crankLength"))
  }
  return issues
}

export function makeTubes(i: FrameInputs, p: KeyPoints): FrameTube[] {
  const def: [TubeRole, string, Vec2, Vec2, number][] = [
    ["topTube", "Top tube", p.topTubeSeatJoint, p.topTubeHeadJoint, 1],
    ["downTube", "Down tube", p.bb, p.downTubeHeadJoint, 1],
    ["seatTube", "Seat tube", p.bb, p.seatTop, 1],
    ["headTube", "Head tube", p.headBottom, p.headTop, 1],
    ["chainstay", "Chainstay", p.bb, p.rearAxle, 2],
    ["seatstay", "Seat stay", p.topTubeSeatJoint, p.rearAxle, 2],
  ]
  return def.map(([role, name, a, b, count]) => ({
    id: role,
    name,
    role,
    a,
    b,
    length: dist(a, b),
    angle: deg(Math.atan2(b.y - a.y, b.x - a.x)),
    diameter: i.tubes[role].diameter,
    wall: i.tubes[role].wall,
    count,
    material: i.material,
  }))
}

export function buildFrame(inputs: FrameInputs): FrameResult {
  const bad = validateInputs(inputs)
  if (bad.length > 0) return { ok: false, issues: bad, points: null, metrics: null, tubes: [] }

  const solved = solve(inputs)
  const metrics = metricsOf(inputs, solved)
  const issues = geometryIssues(metrics, solved.points)
  const ok = !issues.some((x) => x.severity === "error")
  return {
    ok,
    issues,
    points: solved.points,
    metrics,
    tubes: ok ? makeTubes(inputs, solved.points) : [],
  }
}
