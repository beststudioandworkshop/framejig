import { describe, expect, it } from "vitest"

import { buildFrame, DEFAULT_INPUTS, switchDriver, syncDerived } from "./index"
import type { FrameInputs, KeyPoints } from "./types"
import { dist } from "./vec"

const base = DEFAULT_INPUTS

const KEY_FIELDS = {
  bb: ["drop", "height"],
  rear: ["chainstay", "rearCenter"],
  seat: ["ct", "cc"],
  horizontal: ["effectiveTopTube", "frontCenter", "reach"],
  vertical: ["headTubeLength", "stack"],
} as const
const rad = (d: number) => (d * Math.PI) / 180
const deg = (r: number) => (r * 180) / Math.PI

function frame(over: Partial<FrameInputs> = {}) {
  const inputs = { ...base, ...over }
  const r = buildFrame(inputs)
  if (!r.points || !r.metrics) throw new Error("expected a solvable frame")
  return { inputs, r, p: r.points, m: r.metrics }
}

/** Grid of varied but sensible frames. */
const grid: Partial<FrameInputs>[] = []
for (const headTubeAngle of [70, 72.5, 74])
  for (const seatTubeAngle of [72, 74.5])
    for (const forkRake of [40, 50])
      for (const bbDrop of [60, 75])
        for (const effectiveTopTube of [520, 570])
          grid.push({ headTubeAngle, seatTubeAngle, forkRake, bbDrop, effectiveTopTube })

describe("default frame", () => {
  it("builds without errors", () => {
    const r = buildFrame(base)
    expect(r.ok).toBe(true)
    expect(r.issues.filter((i) => i.severity === "error")).toEqual([])
    expect(r.tubes).toHaveLength(6)
  })
})

describe("wheels and BB", () => {
  it("wheel radius is half the rim plus the tire section", () => {
    expect(frame().m.wheelRadius).toBe(311 + 28)
  })
  it("700c x 28 with 70 drop gives a 269 mm BB height", () => {
    expect(frame().m.bbHeight).toBe(269)
  })
  it("both axles sit bbDrop above the BB and the ground one wheel radius below the axle", () => {
    const { p, m } = frame()
    expect(p.rearAxle.y).toBe(70)
    expect(p.frontAxle.y).toBeCloseTo(70, 9)
    expect(p.groundY).toBeCloseTo(p.frontAxle.y - m.wheelRadius, 9)
    expect(p.groundY).toBeCloseTo(-m.bbHeight, 9)
  })
  it("chainstay length is the straight line BB to rear axle", () => {
    const { p } = frame({ chainstayLength: 430 })
    expect(dist(p.bb, p.rearAxle)).toBeCloseTo(430, 9)
  })
  it("rear center is the horizontal chainstay, and wheelbase = rear + front center", () => {
    const { m } = frame({ chainstayLength: 420, bbDrop: 70 })
    expect(m.rearCenter).toBeCloseTo(Math.sqrt(420 ** 2 - 70 ** 2), 9)
    expect(m.wheelbase).toBeCloseTo(m.rearCenter + m.frontCenter, 9)
  })
})

describe("trail", () => {
  it("matches the textbook value for 73 deg, 334 mm radius, 45 mm rake (about 55.1 mm)", () => {
    const { m } = frame({ headTubeAngle: 73, forkRake: 45, wheel: { rimDiameter: 612, tireSection: 28 } })
    expect(m.wheelRadius).toBe(334)
    expect(m.trail).toBeCloseTo(55.06, 1)
  })

  it.each(grid)("agrees with intersecting the steering axis with the ground (%#)", (over) => {
    const { p, m } = frame(over)
    // Independent route: walk down the steering axis to the ground.
    const t = (p.headBottom.y - p.groundY) / Math.sin(rad(over.headTubeAngle ?? base.headTubeAngle))
    const groundX = p.headBottom.x + t * Math.cos(rad(over.headTubeAngle ?? base.headTubeAngle))
    // Contact patch is directly below the front axle.
    expect(groundX - p.frontAxle.x).toBeCloseTo(m.trail, 6)
  })

  it("falls with more rake and rises with a slacker head angle", () => {
    expect(frame({ forkRake: 50 }).m.trail).toBeLessThan(frame({ forkRake: 40 }).m.trail)
    expect(frame({ headTubeAngle: 71 }).m.trail).toBeGreaterThan(frame({ headTubeAngle: 74 }).m.trail)
  })

  it("is zero-offset sensible: rake 0 gives R / tan(angle)", () => {
    const { m } = frame({ forkRake: 0, headTubeAngle: 70 })
    expect(m.trail).toBeCloseTo(m.wheelRadius / Math.tan(rad(70)), 9)
  })
})

describe("fork", () => {
  it.each(grid)("axle is rake away from the steering axis and axle-to-crown down it (%#)", (over) => {
    const { inputs, p } = frame(over)
    const a = rad(inputs.headTubeAngle)
    const axisDir = { x: Math.cos(a), y: -Math.sin(a) }
    const v = { x: p.frontAxle.x - p.headBottom.x, y: p.frontAxle.y - p.headBottom.y }
    const along = v.x * axisDir.x + v.y * axisDir.y
    const across = Math.abs(v.x * axisDir.y - v.y * axisDir.x)
    expect(along).toBeCloseTo(inputs.forkAxleToCrown, 6)
    expect(across).toBeCloseTo(inputs.forkRake, 6)
  })
})

describe("head and seat tube", () => {
  it("head tube keeps its length and angle in numbers mode", () => {
    const { p, m } = frame({ headTubeLength: 150, headTubeAngle: 73 })
    expect(m.headTubeLength).toBeCloseTo(150, 9)
    expect(deg(Math.atan2(p.headTop.y - p.headBottom.y, p.headBottom.x - p.headTop.x))).toBeCloseTo(73, 9)
  })
  it("seat tube has the right length and angle", () => {
    const { p } = frame({ seatTubeLength: 520, seatTubeAngle: 74 })
    expect(dist(p.bb, p.seatTop)).toBeCloseTo(520, 9)
    expect(deg(Math.atan2(p.seatTop.y, -p.seatTop.x))).toBeCloseTo(74, 9)
  })
  it.each(grid)("effective top tube is the horizontal gap between the axes at seat-tube-top height (%#)", (over) => {
    const { inputs, p, m } = frame(over)
    const a = rad(inputs.headTubeAngle)
    // Head axis x at y = seatTop.y by parametrising the line, independent of build.ts's formula.
    const t = (p.seatTop.y - p.headBottom.y) / Math.sin(a)
    const axisX = p.headBottom.x - t * Math.cos(a)
    expect(axisX - p.seatTop.x).toBeCloseTo(inputs.effectiveTopTube, 6)
    expect(m.effectiveTopTube).toBeCloseTo(inputs.effectiveTopTube, 6)
  })
  it("stack and reach are the head tube top coordinates relative to the BB", () => {
    const { p, m } = frame()
    expect(m.stack).toBe(p.headTop.y)
    expect(m.reach).toBe(p.headTop.x)
  })
})

describe("drivers", () => {
  type D = FrameInputs["drivers"]
  const baseResult = buildFrame(base)
  const synced = syncDerived(base, baseResult)
  const keys = Object.keys(KEY_FIELDS) as (keyof D)[]

  function samePoints(a: KeyPoints | null, b: KeyPoints | null) {
    expect(a).not.toBeNull()
    expect(b).not.toBeNull()
    for (const k of Object.keys(a!) as (keyof KeyPoints)[]) {
      const x = a![k]
      const y = b![k]
      if (typeof x === "number") expect(y as number).toBeCloseTo(x, 6)
      else {
        expect((y as { x: number }).x).toBeCloseTo(x.x, 6)
        expect((y as { y: number }).y).toBeCloseTo(x.y, 6)
      }
    }
  }

  it("each alternative driver, fed the derived value, gives the same frame", () => {
    for (const key of keys) {
      for (const value of KEY_FIELDS[key]) {
        const r = buildFrame({ ...synced, drivers: { ...synced.drivers, [key]: value } })
        expect(r.ok, `${key}=${value}`).toBe(true)
        samePoints(baseResult.points, r.points)
      }
    }
  })

  it("every combination of drivers gives the same frame", () => {
    let n = 0
    for (const bb of KEY_FIELDS.bb)
      for (const rear of KEY_FIELDS.rear)
        for (const seat of KEY_FIELDS.seat)
          for (const horizontal of KEY_FIELDS.horizontal)
            for (const vertical of KEY_FIELDS.vertical) {
              const r = buildFrame({ ...synced, drivers: { bb, rear, seat, horizontal, vertical } })
              expect(r.ok).toBe(true)
              samePoints(baseResult.points, r.points)
              n++
            }
    expect(n).toBe(48)
  })

  it("ignores fields that aren't driving", () => {
    const junk = { bbHeight: 1, rearCenter: 1, seatTubeLengthCC: 1, frontCenter: 1, reach: 1, stack: 1 }
    expect(buildFrame({ ...base, ...junk }).metrics).toEqual(baseResult.metrics)
    const alt: D = { bb: "height", rear: "rearCenter", seat: "cc", horizontal: "reach", vertical: "stack" }
    const a = buildFrame({ ...synced, drivers: alt })
    const b = buildFrame({ ...synced, drivers: alt, bbDrop: 1, chainstayLength: 1, seatTubeLength: 1, effectiveTopTube: 1, headTubeLength: 1 })
    expect(a.metrics).toEqual(b.metrics)
  })

  it("only checks the fields that are driving", () => {
    expect(buildFrame({ ...base, frontCenter: NaN, reach: NaN, stack: NaN, bbHeight: NaN, rearCenter: NaN, seatTubeLengthCC: NaN }).ok).toBe(true)
    expect(buildFrame({ ...base, drivers: { ...base.drivers, horizontal: "reach" }, reach: NaN }).ok).toBe(false)
  })

  it("the driven value is what comes out", () => {
    expect(frame({ drivers: { ...base.drivers, bb: "height" }, bbHeight: 280 }).m.bbHeight).toBeCloseTo(280, 9)
    expect(frame({ drivers: { ...base.drivers, bb: "height" }, bbHeight: 280 }).m.bbDrop).toBeCloseTo(339 - 280, 9)
    expect(frame({ drivers: { ...base.drivers, rear: "rearCenter" }, rearCenter: 410 }).m.rearCenter).toBeCloseTo(410, 9)
    expect(frame({ drivers: { ...base.drivers, seat: "cc" }, seatTubeLengthCC: 500 }).m.seatTubeLengthCC).toBeCloseTo(500, 9)
    expect(frame({ drivers: { ...base.drivers, seat: "cc" }, seatTubeLengthCC: 500 }).m.seatTubeLength).toBeCloseTo(500 + base.seatTubeExtension, 9)
    expect(frame({ drivers: { ...base.drivers, horizontal: "frontCenter" }, frontCenter: 600 }).m.frontCenter).toBeCloseTo(600, 9)
    expect(frame({ drivers: { ...base.drivers, horizontal: "reach" }, reach: 400 }).m.reach).toBeCloseTo(400, 9)
    expect(frame({ drivers: { ...base.drivers, vertical: "stack" }, stack: 580 }).m.stack).toBeCloseTo(580, 9)
  })

  it("stack-driven: head tube length falls out and the axles stay level", () => {
    const { p, m } = frame({ drivers: { ...base.drivers, vertical: "stack" }, stack: 580 })
    expect(m.headTubeLength).toBeGreaterThan(0)
    expect(p.frontAxle.y).toBeCloseTo(p.rearAxle.y, 9)
  })

  it.each(grid)("round trip: tube lengths -> stack and reach -> tube lengths (%#)", (over) => {
    const inputs = { ...base, ...over }
    const n = buildFrame(inputs)
    const toFit = switchDriver(switchDriver(inputs, n, "horizontal", "reach"), n, "vertical", "stack")
    const f = buildFrame(toFit)
    samePoints(n.points, f.points)
    const back = switchDriver(switchDriver(toFit, f, "horizontal", "effectiveTopTube"), f, "vertical", "headTubeLength")
    samePoints(n.points, buildFrame(back).points)
    expect(back.effectiveTopTube).toBeCloseTo(inputs.effectiveTopTube, 6)
    expect(back.headTubeLength).toBeCloseTo(inputs.headTubeLength, 6)
  })

  it("syncDerived and switchDriver leave the inputs alone when the frame can't be solved", () => {
    const inputs = { ...base, chainstayLength: 10 }
    const r = buildFrame(inputs)
    expect(r.metrics).toBeNull()
    expect(syncDerived(inputs, r)).toBe(inputs)
    expect(switchDriver(inputs, r, "bb", "height")).toEqual({ ...inputs, drivers: { ...inputs.drivers, bb: "height" } })
  })
})


describe("tubes", () => {
  it.each(grid)("every tube endpoint touches a key point (%#)", (over) => {
    const r = buildFrame({ ...base, ...over })
    const pts = Object.entries(r.points!).filter(([, v]) => typeof v !== "number").map(([, v]) => v as { x: number; y: number })
    for (const t of r.tubes) {
      for (const end of [t.a, t.b]) {
        expect(pts.some((q) => q.x === end.x && q.y === end.y)).toBe(true)
      }
    }
  })
  it("lists the six frame tubes with lengths equal to the endpoint distance", () => {
    const { r } = frame()
    expect(r.tubes.map((t) => t.role)).toEqual(["topTube", "downTube", "seatTube", "headTube", "chainstay", "seatstay"])
    for (const t of r.tubes) expect(t.length).toBeCloseTo(dist(t.a, t.b), 9)
  })
  it("marks stays as pairs and the rest as singles", () => {
    const counts = Object.fromEntries(frame().r.tubes.map((t) => [t.role, t.count]))
    expect(counts).toEqual({ topTube: 1, downTube: 1, seatTube: 1, headTube: 1, chainstay: 2, seatstay: 2 })
  })
  it("carries diameter, wall and material from the inputs", () => {
    const { r } = frame({ material: "titanium" })
    const dt = r.tubes.find((t) => t.role === "downTube")!
    expect(dt.diameter).toBe(base.tubes.downTube.diameter)
    expect(dt.wall).toBe(base.tubes.downTube.wall)
    expect(dt.material).toBe("titanium")
  })
  it("chainstay is as long as the input", () => {
    expect(frame({ chainstayLength: 435 }).r.tubes.find((t) => t.role === "chainstay")!.length).toBeCloseTo(435, 9)
  })
  it("top tube joins the head tube one tube radius below the top", () => {
    const { p, inputs } = frame()
    expect(dist(p.topTubeHeadJoint, p.headTop)).toBeCloseTo(inputs.tubes.topTube.diameter / 2, 9)
    expect(dist(p.downTubeHeadJoint, p.headBottom)).toBeCloseTo(inputs.tubes.downTube.diameter / 2, 9)
  })
  it("seat stays meet the seat tube where the top tube does, below the top by the extension", () => {
    const { p, inputs } = frame()
    expect(dist(p.topTubeSeatJoint, p.seatTop)).toBeCloseTo(inputs.seatTubeExtension, 9)
  })
})

describe("derived readouts", () => {
  it("top tube slope is zero when the joints are level", () => {
    const { p, m } = frame()
    const slope = deg(Math.atan2(p.topTubeHeadJoint.y - p.topTubeSeatJoint.y, p.topTubeHeadJoint.x - p.topTubeSeatJoint.x))
    expect(m.topTubeSlope).toBeCloseTo(slope, 9)
  })
  it("standover is ground to the top of the top tube at its midpoint", () => {
    const { p, m, inputs } = frame()
    const midY = (p.topTubeSeatJoint.y + p.topTubeHeadJoint.y) / 2
    expect(m.standover).toBeCloseTo(m.bbHeight + midY + inputs.tubes.topTube.diameter / 2, 9)
  })
  it("toe clearance is the toe-to-front-wheel-center distance less the radius", () => {
    const { p, m, inputs } = frame()
    const toe = { x: inputs.crankLength + inputs.toeProjection, y: 0 }
    expect(m.toeClearance).toBeCloseTo(dist(toe, p.frontAxle) - m.wheelRadius, 9)
  })
  it("a longer front center means less toe overlap", () => {
    expect(frame({ effectiveTopTube: 600 }).m.toeClearance).toBeGreaterThan(frame({ effectiveTopTube: 520 }).m.toeClearance)
  })
  it("rear tire clearance grows with chainstay length", () => {
    expect(frame({ chainstayLength: 450 }).m.rearTireClearance).toBeGreaterThan(frame({ chainstayLength: 410 }).m.rearTireClearance)
  })
})

describe("scaling", () => {
  it("scaling every length by k scales the length metrics by k and leaves angles alone", () => {
    const k = 1.25
    const s = (n: number) => n * k
    const big: FrameInputs = {
      ...base,
      wheel: { rimDiameter: s(base.wheel.rimDiameter), tireSection: s(base.wheel.tireSection) },
      crankLength: s(base.crankLength),
      toeProjection: s(base.toeProjection),
      seatTubeLength: s(base.seatTubeLength),
      seatTubeExtension: s(base.seatTubeExtension),
      effectiveTopTube: s(base.effectiveTopTube),
      headTubeLength: s(base.headTubeLength),
      bbDrop: s(base.bbDrop),
      chainstayLength: s(base.chainstayLength),
      forkAxleToCrown: s(base.forkAxleToCrown),
      forkRake: s(base.forkRake),
      tubes: Object.fromEntries(
        Object.entries(base.tubes).map(([k2, v]) => [k2, { diameter: s(v.diameter), wall: s(v.wall) }]),
      ) as unknown as FrameInputs["tubes"],
    }
    const a = buildFrame(base).metrics!
    const b = buildFrame(big).metrics!
    for (const key of ["wheelbase", "frontCenter", "rearCenter", "bbHeight", "trail", "stack", "reach", "effectiveTopTube", "headTubeLength", "standover", "toeClearance", "rearTireClearance", "frontTireClearance"] as const) {
      expect(b[key]).toBeCloseTo(a[key] * k, 6)
    }
    expect(b.topTubeSlope).toBeCloseTo(a.topTubeSlope, 9)
  })
})

describe("issues", () => {
  const errors = (over: Partial<FrameInputs>) => buildFrame({ ...base, ...over }).issues.filter((i) => i.severity === "error")

  it("never throws on junk and always reports an error", () => {
    const junk = [NaN, Infinity, -Infinity, -1, 0, 1e12]
    for (const v of junk) {
      for (const field of ["seatTubeAngle", "headTubeAngle", "seatTubeLength", "effectiveTopTube", "headTubeLength", "bbDrop", "chainstayLength", "forkAxleToCrown", "forkRake", "crankLength"] as const) {
        let r: ReturnType<typeof buildFrame> | undefined
        expect(() => { r = buildFrame({ ...base, [field]: v }) }).not.toThrow()
        if (v === 0 && (field === "bbDrop" || field === "forkRake")) continue // zero is a legal value
        expect(r!.ok, `${field}=${v}`).toBe(false)
        expect(r!.tubes).toEqual([])
      }
    }
  })
  it("names the field that is wrong", () => {
    const i = errors({ headTubeAngle: 20 })
    expect(i[0].field).toBe("headTubeAngle")
    expect(i[0].code).toBe("angle-range")
  })
  it("rejects a chainstay no longer than the BB drop", () => {
    expect(errors({ chainstayLength: 70, bbDrop: 70 }).map((e) => e.code)).toContain("chainstay-short")
  })
  it("rejects a wall that fills the tube", () => {
    expect(errors({ tubes: { ...base.tubes, topTube: { diameter: 10, wall: 5 } } }).map((e) => e.code)).toContain("wall-too-thick")
  })
  it("rejects a BB above the axle line", () => {
    expect(errors({ drivers: { ...base.drivers, bb: "height" }, bbHeight: 400 }).map((e) => e.code)).toContain("bb-above-axle")
  })
  it("a stack too low for the fork gives a head tube error and no tubes", () => {
    const r = buildFrame({ ...base, drivers: { ...base.drivers, horizontal: "reach", vertical: "stack" }, stack: 300, reach: 390 })
    expect(r.ok).toBe(false)
    expect(r.issues.map((i) => i.code)).toContain("head-tube-length")
    expect(r.tubes).toEqual([])
    expect(r.points).not.toBeNull() // still drawable
  })
  it("reach that puts the head tube behind the BB is an error", () => {
    const r = buildFrame({ ...base, drivers: { ...base.drivers, horizontal: "reach" }, reach: -10 })
    expect(r.ok).toBe(false)
  })
  it("flags a rear tire that hits the seat tube", () => {
    const r = buildFrame({ ...base, chainstayLength: 300, seatTubeAngle: 80 })
    expect(r.ok).toBe(false)
    expect(r.issues.map((i) => i.code)).toContain("rear-tire-clash")
  })
  it("flags a front tire that hits the down tube", () => {
    const r = buildFrame({ ...base, effectiveTopTube: 380 })
    expect(r.issues.map((i) => i.code)).toContain("front-tire-clash")
    expect(r.ok).toBe(false)
  })
  it("toe overlap is a warning: the frame is still ok", () => {
    const r = buildFrame({ ...base, crankLength: 200, toeProjection: 160 })
    const w = r.issues.find((i) => i.code === "toe-overlap")
    expect(w?.severity).toBe("warning")
    expect(r.ok).toBe(true)
    expect(r.tubes).toHaveLength(6)
  })
  it("no toe warning with plenty of clearance", () => {
    const r = buildFrame({ ...base, toeProjection: 40, crankLength: 150 })
    expect(r.issues.find((i) => i.code.startsWith("toe-"))).toBeUndefined()
  })
})

describe("purity", () => {
  it("does not change its inputs and gives identical results twice", () => {
    const copy = structuredClone(base)
    const a = buildFrame(base)
    const b = buildFrame(base)
    expect(base).toEqual(copy)
    expect(a).toEqual(b)
  })
})
