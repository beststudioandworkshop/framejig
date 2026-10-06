import { describe, expect, it } from "vitest"

import { alignOffset, buildDrawing, buildFrame, compareFrames, DEFAULT_INPUTS, viewBoxOf, type DimensionId } from "./index"
import type { FrameInputs } from "./types"

const base = DEFAULT_INPUTS
function draw(over: Partial<FrameInputs> = {}) {
  const inputs = { ...base, ...over }
  const result = buildFrame(inputs)
  const d = buildDrawing(inputs, result)
  if (!d || !result.metrics || !result.points) throw new Error("expected a drawing")
  return { inputs, result, d, m: result.metrics, p: result.points }
}

const grid: Partial<FrameInputs>[] = []
for (const headTubeAngle of [70, 74])
  for (const seatTubeAngle of [72, 75])
    for (const forkRake of [40, 55])
      for (const effectiveTopTube of [520, 580]) grid.push({ headTubeAngle, seatTubeAngle, forkRake, effectiveTopTube })

describe("drawing", () => {
  it("is null when the frame can't be solved", () => {
    const inputs = { ...base, chainstayLength: 10 }
    expect(buildDrawing(inputs, buildFrame(inputs))).toBeNull()
  })

  it("still draws a frame that has errors, but with no tubes in the schedule", () => {
    const inputs = { ...base, effectiveTopTube: 380 } // front tire hits the down tube
    const r = buildFrame(inputs)
    expect(r.ok).toBe(false)
    expect(buildDrawing(inputs, r)!.tubes).toHaveLength(6)
  })

  it("flips Y so up is up: BB at the origin, axles above it, ground below", () => {
    const { d, m } = draw()
    expect(d.crank[0]).toEqual({ x: 0, y: -0 })
    expect(d.wheels[0].tire.cy).toBeCloseTo(-base.bbDrop, 9)
    expect(d.ground[0].y).toBeCloseTo(m.bbHeight, 9)
  })

  it("draws both wheels at the tire and rim radius, centerd on the axles", () => {
    const { d, p, m } = draw()
    const [rear, front] = d.wheels
    expect(rear.tire.cx).toBeCloseTo(p.rearAxle.x, 9)
    expect(front.tire.cx).toBeCloseTo(p.frontAxle.x, 9)
    expect(rear.tire.r).toBe(m.wheelRadius)
    expect(rear.rim.r).toBe(base.wheel.rimDiameter / 2)
    expect(front.rim.r).toBeLessThan(front.tire.r)
  })

  it("the tires touch the ground line", () => {
    const { d } = draw()
    for (const w of d.wheels) expect(w.tire.cy + w.tire.r).toBeCloseTo(d.ground[0].y, 9)
  })

  it("draws each tube at its real diameter and length", () => {
    const { d, result } = draw()
    for (const t of d.tubes) {
      const spec = result.tubes.find((x) => x.role === t.role)!
      const [c0, c1, c2, c3] = t.corners
      expect(Math.hypot(c1.x - c0.x, c1.y - c0.y)).toBeCloseTo(spec.length, 6)
      expect(Math.hypot(c3.x - c0.x, c3.y - c0.y)).toBeCloseTo(spec.diameter, 6)
      expect((c0.x + c2.x) / 2).toBeCloseTo((t.a.x + t.b.x) / 2, 6)
      expect((c0.y + c2.y) / 2).toBeCloseTo((t.a.y + t.b.y) / 2, 6)
    }
  })

  it("the steering axis runs from above the head tube to the ground, rake behind the axle", () => {
    const { d, inputs, m } = draw()
    const [top, ground] = d.steeringAxis
    expect(ground.y).toBeCloseTo(d.ground[0].y, 6)
    expect(top.y).toBeLessThan(d.fork[0].y) // above the crown
    // Distance from the front axle to the axis line is the rake.
    const vx = ground.x - top.x
    const vy = ground.y - top.y
    const ax = d.fork[1].x - top.x
    const ay = d.fork[1].y - top.y
    expect(Math.abs(vx * ay - vy * ax) / Math.hypot(vx, vy)).toBeCloseTo(inputs.forkRake, 6)
    expect(ground.x - d.contact.x).toBeCloseTo(m.trail, 6)
  })

  it("draws the level crank and the foot out to the toe", () => {
    const { d } = draw()
    expect(d.crank[1].x).toBeCloseTo(base.crankLength, 9)
    expect(d.foot[1].x).toBeCloseTo(base.crankLength + base.toeProjection, 9)
  })
})

describe("dimensions", () => {
  const ids: DimensionId[] = ["wheelbase", "trail", "bbHeight", "stack", "reach", "effectiveTopTube", "seatTubeLength", "headTubeLength", "chainstay"]

  it("has every dimension once", () => {
    expect(draw().d.dims.map((x) => x.id).sort()).toEqual([...ids].sort())
  })

  it.each(grid)("each reads the same number as the readouts (%#)", (over) => {
    const { d, m } = draw(over)
    const by = Object.fromEntries(d.dims.map((x) => [x.id, x.value]))
    expect(by.wheelbase).toBeCloseTo(m.wheelbase, 6)
    expect(by.trail).toBeCloseTo(Math.abs(m.trail), 6)
    expect(by.bbHeight).toBeCloseTo(m.bbHeight, 6)
    expect(by.stack).toBeCloseTo(m.stack, 6)
    expect(by.reach).toBeCloseTo(m.reach, 6)
    expect(by.effectiveTopTube).toBeCloseTo(m.effectiveTopTube, 6)
    expect(by.seatTubeLength).toBeCloseTo(m.seatTubeLength, 6)
    expect(by.headTubeLength).toBeCloseTo(m.headTubeLength, 6)
    expect(by.chainstay).toBeCloseTo(m.chainstayLength, 6)
  })

  it.each(grid)("each dimension line is as long as its value (%#)", (over) => {
    for (const dim of draw(over).d.dims) {
      const [a, b] = dim.line
      expect(Math.hypot(b.x - a.x, b.y - a.y), dim.id).toBeCloseTo(dim.value, 6)
    }
  })

  it("horizontal and vertical dimension lines are level / plumb; labels stay readable", () => {
    for (const dim of draw().d.dims) {
      const [a, b] = dim.line
      if (dim.axis === "x") expect(a.y).toBeCloseTo(b.y, 9)
      if (dim.axis === "y") expect(a.x).toBeCloseTo(b.x, 9)
      expect(dim.labelAngle).toBeGreaterThan(-90 - 1e-9)
      expect(dim.labelAngle).toBeLessThanOrEqual(90)
      expect(Math.hypot(dim.labelNormal.x, dim.labelNormal.y)).toBeCloseTo(1, 9)
    }
  })

  it("extension lines end just past the dimension line, and none are empty", () => {
    for (const dim of draw().d.dims) {
      expect(dim.ext.length).toBeGreaterThanOrEqual(1)
      expect(dim.ext.length).toBeLessThanOrEqual(2)
      for (const [from, to] of dim.ext) {
        expect(Math.hypot(to.x - from.x, to.y - from.y)).toBeGreaterThan(0)
        const nearest = Math.min(...dim.line.map((q) => Math.hypot(to.x - q.x, to.y - q.y)))
        expect(nearest).toBeCloseTo(10, 6) // overshoot past the line
      }
    }
  })

  it("reach is the horizontal run from the BB to the head tube top, above the head tube", () => {
    const { d, p } = draw()
    const reach = d.dims.find((x) => x.id === "reach")!
    expect(reach.line[0].x).toBeCloseTo(0, 9)
    expect(reach.line[1].x).toBeCloseTo(p.headTop.x, 9)
    expect(reach.line[0].y).toBeLessThan(-p.headTop.y) // above the head tube top (Y down)
  })
})

describe("offset and bounds", () => {
  it("an offset slides every point and leaves the shapes alone", () => {
    const inputs = base
    const result = buildFrame(inputs)
    const a = buildDrawing(inputs, result)!
    const b = buildDrawing(inputs, result, { x: 100, y: 50 })!
    expect(b.wheels[0].tire.cx).toBeCloseTo(a.wheels[0].tire.cx + 100, 9)
    expect(b.wheels[0].tire.cy).toBeCloseTo(a.wheels[0].tire.cy - 50, 9)
    expect(b.dims[0].value).toBeCloseTo(a.dims[0].value, 9)
    expect(b.bounds.minX).toBeCloseTo(a.bounds.minX + 100, 9)
    expect(b.bounds.maxY).toBeCloseTo(a.bounds.maxY - 50, 9)
  })

  it("bounds contain the wheels, tubes and dimension lines", () => {
    const { d } = draw()
    for (const w of d.wheels) {
      expect(w.tire.cx - w.tire.r).toBeGreaterThanOrEqual(d.bounds.minX)
      expect(w.tire.cy + w.tire.r).toBeLessThanOrEqual(d.bounds.maxY)
    }
    for (const t of d.tubes) for (const c of t.corners) {
      expect(c.x).toBeGreaterThanOrEqual(d.bounds.minX)
      expect(c.y).toBeGreaterThanOrEqual(d.bounds.minY)
    }
    for (const dim of d.dims) for (const q of dim.line) {
      expect(q.x).toBeGreaterThanOrEqual(d.bounds.minX)
      expect(q.y).toBeLessThanOrEqual(d.bounds.maxY)
    }
  })

  it("viewBox covers every drawing with the margin", () => {
    const a = draw().d
    const b = draw({ effectiveTopTube: 620, chainstayLength: 460 }).d
    const vb = viewBoxOf([a, b], 80)
    expect(vb.x).toBeCloseTo(Math.min(a.bounds.minX, b.bounds.minX) - 80, 9)
    expect(vb.x + vb.width).toBeCloseTo(Math.max(a.bounds.maxX, b.bounds.maxX) + 80, 9)
    expect(vb.y + vb.height).toBeCloseTo(Math.max(a.bounds.maxY, b.bounds.maxY) + 80, 9)
  })

  it("alignOffset lines the chosen anchor up", () => {
    const a = buildFrame(base).points!
    const b = buildFrame({ ...base, chainstayLength: 440, bbDrop: 60 }).points!
    for (const anchor of ["bb", "rearAxle", "frontAxle"] as const) {
      const o = alignOffset(a, b, anchor)
      expect(b[anchor].x + o.x).toBeCloseTo(a[anchor].x, 9)
      expect(b[anchor].y + o.y).toBeCloseTo(a[anchor].y, 9)
    }
    expect(alignOffset(a, a, "bb")).toEqual({ x: 0, y: 0 })
  })
})

describe("compareFrames", () => {
  const ra = buildFrame(base)
  it("is all zeros against itself", () => {
    const rows = compareFrames(base, ra, base, ra)!
    expect(rows.length).toBeGreaterThan(10)
    for (const r of rows) expect(r.delta).toBe(0)
  })
  it("delta is yours minus the reference", () => {
    const other = { ...base, headTubeAngle: 73.5, chainstayLength: 430 }
    const rows = compareFrames(other, buildFrame(other), base, ra)!
    expect(rows.find((r) => r.key === "headTubeAngle")!.delta).toBeCloseTo(1, 9)
    expect(rows.find((r) => r.key === "chainstayLength")!.delta).toBeCloseTo(10, 9)
    const trail = rows.find((r) => r.key === "trail")!
    expect(trail.delta).toBeCloseTo(trail.value - trail.reference, 9)
    expect(trail.delta).toBeLessThan(0) // steeper head angle, less trail
  })
  it("is null if either frame can't be solved", () => {
    const bad = { ...base, chainstayLength: 10 }
    expect(compareFrames(bad, buildFrame(bad), base, ra)).toBeNull()
    expect(compareFrames(base, ra, bad, buildFrame(bad))).toBeNull()
  })
})
