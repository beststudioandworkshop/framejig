import { describe, expect, it } from "vitest"

import { buildFrame, buildJig, DEFAULT_INPUTS, DEFAULT_JIG, jigCsv, jigEnvelope, jigText, syncDerived, type FrameInputs, type StationId } from "./index"

const base = DEFAULT_INPUTS
function jigOf(over: Partial<FrameInputs> = {}, spineOffset = DEFAULT_JIG.spineOffset) {
  const inputs = { ...base, ...over }
  const result = buildFrame(inputs)
  const jig = buildJig(inputs, result, { spineOffset })
  if (!jig || !result.metrics) throw new Error("expected a jig")
  return { inputs, result, m: result.metrics, jig }
}
const station = (j: ReturnType<typeof jigOf>["jig"], id: StationId) => j.stations.find((s) => s.id === id)!

const grid: Partial<FrameInputs>[] = []
for (const headTubeAngle of [70, 74])
  for (const seatTubeAngle of [72, 75])
    for (const forkRake of [40, 55])
      for (const effectiveTopTube of [520, 580]) grid.push({ headTubeAngle, seatTubeAngle, forkRake, effectiveTopTube })

describe("jig stations", () => {
  it("is null when the frame can't be solved", () => {
    const inputs = { ...base, chainstayLength: 10 }
    expect(buildJig(inputs, buildFrame(inputs), DEFAULT_JIG)).toBeNull()
  })

  it("has the six stations in order", () => {
    expect(jigOf().jig.stations.map((s) => s.id)).toEqual(["rearAxle", "bb", "headBottom", "headTop", "seatTop", "frontAxle"])
  })

  it("the rear axle is the origin", () => {
    const s = station(jigOf().jig, "rearAxle")
    expect(s.x).toBe(0)
    expect(s.y).toBe(0)
  })

  it("the BB is rear centre forward and the BB drop below the axle line", () => {
    const { jig, m } = jigOf()
    const bb = station(jig, "bb")
    expect(bb.x).toBeCloseTo(m.rearCentre, 9)
    expect(bb.y).toBeCloseTo(-m.bbDrop, 9)
  })

  it("the front axle is the wheelbase forward and level with the rear axle", () => {
    const { jig, m } = jigOf()
    const f = station(jig, "frontAxle")
    expect(f.x).toBeCloseTo(m.wheelbase, 9)
    expect(f.y).toBeCloseTo(0, 9)
  })

  it("the head tube top is reach forward and stack up from the BB", () => {
    const { jig, m } = jigOf()
    const bb = station(jig, "bb")
    const top = station(jig, "headTop")
    expect(top.x - bb.x).toBeCloseTo(m.reach, 9)
    expect(top.y - bb.y).toBeCloseTo(m.stack, 9)
  })

  it("the seat tube top sits at the seat angle and c-t length from the BB", () => {
    const { jig, inputs, m } = jigOf()
    const bb = station(jig, "bb")
    const top = station(jig, "seatTop")
    expect(Math.hypot(top.x - bb.x, top.y - bb.y)).toBeCloseTo(m.seatTubeLength, 9)
    expect((Math.atan2(top.y - bb.y, bb.x - top.x) * 180) / Math.PI).toBeCloseTo(inputs.seatTubeAngle, 9)
  })

  it("holds head and seat tube angles on those stations only", () => {
    const { jig, inputs } = jigOf()
    expect(station(jig, "headBottom").angle).toBe(inputs.headTubeAngle)
    expect(station(jig, "headTop").angle).toBe(inputs.headTubeAngle)
    expect(station(jig, "seatTop").angle).toBe(inputs.seatTubeAngle)
    expect(station(jig, "bb").angle).toBeUndefined()
    expect(station(jig, "rearAxle").angle).toBeUndefined()
  })

  it("side-to-side half widths come from the rear spacing and BB shell width", () => {
    const { jig } = jigOf({ rearSpacing: 135, bbShellWidth: 73 })
    expect(station(jig, "rearAxle").halfWidth).toBe(67.5)
    expect(station(jig, "bb").halfWidth).toBe(36.5)
    expect(station(jig, "headTop").halfWidth).toBeUndefined()
  })

  it("height off the spine is the height off the axle line plus the spine offset", () => {
    for (const offset of [0, 100, 250]) {
      for (const s of jigOf({}, offset).jig.stations) expect(s.yFromSpine).toBeCloseTo(s.y + offset, 9)
    }
  })

  it("wheel size doesn't move a single station (the axle is fixed)", () => {
    const a = jigOf().jig.stations
    const b = jigOf({ wheel: { rimDiameter: 559, tyreSection: 50 } }).jig.stations
    a.forEach((s, i) => {
      expect(b[i].x).toBeCloseTo(s.x, 9)
      expect(b[i].y).toBeCloseTo(s.y, 9)
    })
  })

  it.each(grid)("gives the same stations whichever measurements drive the frame (%#)", (over) => {
    const inputs = { ...base, ...over }
    const r = buildFrame(inputs)
    const synced = syncDerived(inputs, r)
    const alt = { ...synced, drivers: { bb: "height", rear: "rearCentre", seat: "cc", horizontal: "reach", vertical: "stack" } as const }
    const a = buildJig(inputs, r, DEFAULT_JIG)!.stations
    const b = buildJig(alt, buildFrame(alt), DEFAULT_JIG)!.stations
    a.forEach((s, i) => {
      expect(b[i].x).toBeCloseTo(s.x, 6)
      expect(b[i].y).toBeCloseTo(s.y, 6)
    })
  })
})

describe("jig checks", () => {
  it("each check is the straight-line distance between its two stations", () => {
    const { jig } = jigOf()
    for (const c of jig.checks) {
      const a = station(jig, c.from)
      const b = station(jig, c.to)
      expect(c.length, c.id).toBeCloseTo(Math.hypot(b.x - a.x, b.y - a.y), 9)
    }
  })

  it("matches the frame's own numbers", () => {
    const { jig, m } = jigOf()
    const len = (id: string) => jig.checks.find((c) => c.id === id)!.length
    expect(len("wheelbase")).toBeCloseTo(m.wheelbase, 9)
    expect(len("chainstay")).toBeCloseTo(m.chainstayLength, 9)
    expect(len("bbToSeatTop")).toBeCloseTo(m.seatTubeLength, 9)
    expect(len("headTube")).toBeCloseTo(m.headTubeLength, 9)
    expect(len("bbToHeadTop")).toBeCloseTo(Math.hypot(m.reach, m.stack), 9)
    expect(len("bbToFrontAxle")).toBeCloseTo(Math.hypot(m.frontCentre, m.bbDrop), 9)
  })

  it("has unique ids and no check from a station to itself", () => {
    const { jig } = jigOf()
    expect(new Set(jig.checks.map((c) => c.id)).size).toBe(jig.checks.length)
    for (const c of jig.checks) expect(c.from).not.toBe(c.to)
  })
})

describe("jig envelope", () => {
  it("is null with no frames", () => {
    expect(jigEnvelope([])).toBeNull()
    expect(jigEnvelope([null])).toBeNull()
  })

  it("one frame: ranges across its stations", () => {
    const { jig } = jigOf()
    const e = jigEnvelope([jig])!
    expect(e.frames).toBe(1)
    expect(e.minX).toBe(Math.min(...jig.stations.map((s) => s.x)))
    expect(e.maxX).toBe(Math.max(...jig.stations.map((s) => s.x)))
    expect(e.spanX).toBeCloseTo(e.maxX - e.minX, 9)
    expect(e.maxHeight).toBe(Math.max(...jig.stations.map((s) => s.yFromSpine)))
    expect(e.minHeight).toBe(Math.min(...jig.stations.map((s) => s.yFromSpine)))
  })

  it("two frames: covers both, ignoring ones that couldn't be solved", () => {
    const small = jigOf({ effectiveTopTube: 500, chainstayLength: 410 }).jig
    const big = jigOf({ effectiveTopTube: 600, chainstayLength: 440, seatTubeLength: 600 }).jig
    const e = jigEnvelope([small, null, big])!
    expect(e.frames).toBe(2)
    expect(e.maxX).toBe(Math.max(small.stations[5].x, big.stations[5].x))
    expect(e.maxHeight).toBeGreaterThanOrEqual(jigEnvelope([small])!.maxHeight)
    expect(e.maxHeight).toBeGreaterThanOrEqual(jigEnvelope([big])!.maxHeight)
  })

  it("a lower spine means taller columns", () => {
    const hi = jigEnvelope([jigOf({}, 50).jig])!
    const lo = jigEnvelope([jigOf({}, 150).jig])!
    expect(lo.maxHeight - hi.maxHeight).toBeCloseTo(100, 9)
  })
})

describe("jig export", () => {
  const { jig } = jigOf()
  it("CSV has a header and a line per station in the chosen unit", () => {
    const lines = jigCsv(jig, "mm").trim().split("\n")
    expect(lines).toHaveLength(7)
    expect(lines[0]).toContain("Forward of rear axle (mm)")
    expect(jigCsv(jig, "in").split("\n")[0]).toContain("(in)")
    const bb = lines.find((l) => l.startsWith("Bottom bracket"))!.split(",")
    expect(Number(bb[2])).toBeCloseTo(-base.bbDrop, 0)
  })
  it("text is tab separated with the same columns on every line", () => {
    for (const l of jigText(jig, "mm").split("\n")) expect(l.split("\t")).toHaveLength(6)
  })
})
