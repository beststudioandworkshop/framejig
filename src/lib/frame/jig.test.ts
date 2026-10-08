import { describe, expect, it } from "vitest"

import {
  ALLOWANCE,
  buildFrame,
  buildJig,
  DEFAULT_INPUTS,
  DEFAULT_JIG,
  jigCsv,
  jigEnvelope,
  jigText,
  roundUp,
  syncDerived,
  type FrameInputs,
  type JigSettings,
  type StationId,
} from "./index"

const base = DEFAULT_INPUTS
const rad = (d: number) => (d * Math.PI) / 180
const deg = (r: number) => (r * 180) / Math.PI

function jigOf(over: Partial<FrameInputs> = {}, settings: Partial<JigSettings> = {}) {
  const inputs = { ...base, ...over }
  const result = buildFrame(inputs)
  const jig = buildJig(inputs, result, { ...DEFAULT_JIG, ...settings })
  if (!jig || !result.metrics) throw new Error("expected a jig")
  return { inputs, result, m: result.metrics, jig }
}
type J = ReturnType<typeof jigOf>["jig"]
const station = (j: J, id: StationId) => j.stations.find((s) => s.id === id)!
const carrier = (j: J, id: "seat" | "head") => j.carriers.find((c) => c.id === id)!

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

  it("the rear axle is the origin in both views", () => {
    const s = station(jigOf().jig, "rearAxle")
    for (const v of [s.x, s.y, s.u, s.v]) expect(v).toBeCloseTo(0, 9)
  })

  it("in the level view the BB is rear center forward and the BB drop below", () => {
    const { jig, m } = jigOf()
    const bb = station(jig, "bb")
    expect(bb.x).toBeCloseTo(m.rearCenter, 9)
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

  it("wheel size doesn't move a single station (the axle is fixed)", () => {
    const a = jigOf().jig.stations
    const b = jigOf({ wheel: { rimDiameter: 559, tireSection: 50 } }).jig.stations
    a.forEach((s, i) => {
      for (const k of ["x", "y", "u", "v"] as const) expect(b[i][k]).toBeCloseTo(s[k], 9)
    })
  })

  it.each(grid)("gives the same stations whichever measurements drive the frame (%#)", (over) => {
    const inputs = { ...base, ...over }
    const r = buildFrame(inputs)
    const synced = syncDerived(inputs, r)
    const alt = { ...synced, drivers: { bb: "height", rear: "rearCenter", seat: "cc", horizontal: "reach", vertical: "stack" } as const }
    const a = buildJig(inputs, r, DEFAULT_JIG)!.stations
    const b = buildJig(alt, buildFrame(alt), DEFAULT_JIG)!.stations
    a.forEach((s, i) => {
      for (const k of ["u", "v"] as const) expect(b[i][k], `${s.id}.${k}`).toBeCloseTo(s[k], 6)
    })
  })
})

describe("spine tilt", () => {
  it.each(grid)("is the angle of the line from the rear axle to the middle of the head tube (%#)", (over) => {
    const { jig } = jigOf(over)
    const hb = station(jig, "headBottom")
    const ht = station(jig, "headTop")
    const midX = (hb.x + ht.x) / 2
    const midY = (hb.y + ht.y) / 2
    expect(jig.tilt.degrees).toBeCloseTo(deg(Math.atan2(midY, midX)), 9)
    expect(jig.tilt.risePerMeter).toBeCloseTo(Math.tan(rad(jig.tilt.degrees)) * 1000, 9)
  })

  it.each(grid)("puts the head tube middle on the spine centerline, and the head tube about it (%#)", (over) => {
    const { jig } = jigOf(over)
    const hb = station(jig, "headBottom")
    const ht = station(jig, "headTop")
    expect((hb.v + ht.v) / 2).toBeCloseTo(0, 9)
    expect(hb.v).toBeLessThan(0)
    expect(ht.v).toBeGreaterThan(0)
  })

  it("is a rotation: every distance between stations is the same along/across as level", () => {
    for (const over of grid) {
      const { jig } = jigOf(over)
      for (const a of jig.stations)
        for (const b of jig.stations) {
          expect(Math.hypot(b.u - a.u, b.v - a.v)).toBeCloseTo(Math.hypot(b.x - a.x, b.y - a.y), 9)
        }
    }
  })

  it("a taller front end tilts the spine more", () => {
    expect(jigOf({ drivers: { ...base.drivers, vertical: "stack" }, stack: 620 }).jig.tilt.degrees).toBeGreaterThan(
      jigOf({ drivers: { ...base.drivers, vertical: "stack" }, stack: 520 }).jig.tilt.degrees,
    )
  })

  it("the BB is below the spine and the seat tube top above it", () => {
    const { jig } = jigOf()
    expect(station(jig, "bb").v).toBeLessThan(0)
    expect(station(jig, "seatTop").v).toBeGreaterThan(0)
  })
})

describe("carriers", () => {
  it("has a seat tube and a head tube carrier", () => {
    expect(jigOf().jig.carriers.map((c) => c.id)).toEqual(["seat", "head"])
  })

  it.each(grid)("angle to the spine is the tube's angle taken round by the tilt (%#)", (over) => {
    const { jig, inputs } = jigOf(over)
    expect(carrier(jig, "head").angleToSpine).toBeCloseTo(180 - inputs.headTubeAngle - jig.tilt.degrees, 9)
    expect(carrier(jig, "seat").angleToSpine).toBeCloseTo(180 - inputs.seatTubeAngle - jig.tilt.degrees, 9)
    for (const c of jig.carriers) expect(c.offSquare).toBeCloseTo(c.angleToSpine - 90, 9)
  })

  it.each(grid)("the carrier's axis runs through both of its stations (%#)", (over) => {
    const { jig } = jigOf(over)
    for (const c of jig.carriers) {
      const a = rad(c.angleToSpine)
      for (const stop of c.stops) {
        const s = station(jig, stop.station)
        // Perpendicular distance from the station to the axis line through (crossing, 0).
        const off = (s.u - c.crossing!) * Math.sin(a) - s.v * Math.cos(a)
        expect(off, `${c.id} ${stop.station}`).toBeCloseTo(0, 6)
      }
    }
  })

  it("the head tube carrier crosses the spine at the head tube middle, with stops half the head tube either side", () => {
    const { jig, m } = jigOf()
    const hb = station(jig, "headBottom")
    const ht = station(jig, "headTop")
    const c = carrier(jig, "head")
    expect(c.crossing).toBeCloseTo((hb.u + ht.u) / 2, 9)
    expect(c.stops[0].along).toBeCloseTo(-m.headTubeLength / 2, 9)
    expect(c.stops[1].along).toBeCloseTo(m.headTubeLength / 2, 9)
  })

  it("the seat carrier's stops are a seat tube length apart, BB below the crossing and the top above", () => {
    const { jig, m } = jigOf()
    const c = carrier(jig, "seat")
    const [bb, top] = c.stops
    expect(top.along - bb.along).toBeCloseTo(m.seatTubeLength, 9)
    expect(bb.along).toBeLessThan(0)
    expect(top.along).toBeGreaterThan(0)
  })

  it("a carrier is long enough for its stops and the crossing, plus room each end, in 50 mm steps", () => {
    for (const over of grid) {
      for (const c of jigOf(over).jig.carriers) {
        const lo = Math.min(0, ...c.stops.map((s) => s.along))
        const hi = Math.max(0, ...c.stops.map((s) => s.along))
        expect(c.length).toBeGreaterThanOrEqual(hi - lo + 2 * ALLOWANCE)
        expect(c.length % 50).toBe(0)
        expect(c.length - (hi - lo + 2 * ALLOWANCE)).toBeLessThan(50)
      }
    }
  })

  it("the carriers are close to square to the spine for a normal frame", () => {
    for (const c of jigOf().jig.carriers) expect(Math.abs(c.offSquare)).toBeLessThan(20)
  })
})

describe("standoffs and notes", () => {
  it("rear axle: to the near dropout face; BB: to the near shell face; the rest: to the center plane", () => {
    const { jig } = jigOf({ rearSpacing: 135, bbShellWidth: 73 }, { centerOffset: 150 })
    expect(station(jig, "rearAxle").standoff).toBe(150 - 67.5)
    expect(station(jig, "bb").standoff).toBe(150 - 36.5)
    for (const id of ["headBottom", "headTop", "seatTop", "frontAxle"] as const) expect(station(jig, id).standoff).toBe(150)
  })

  it("no notes with sensible settings", () => {
    expect(jigOf().jig.notes).toEqual([])
  })

  it("warns when the spine is too close to the center plane for the dropouts or BB", () => {
    const notes = jigOf({}, { centerOffset: 50 }).jig.notes
    expect(notes.some((n) => n.includes("Rear axle"))).toBe(true)
    expect(notes.some((n) => n.includes("Bottom bracket"))).toBe(false)
    expect(jigOf({}, { centerOffset: 20 }).jig.notes.some((n) => n.includes("Bottom bracket"))).toBe(true)
    expect(jigOf({}, { centerOffset: 0 }).jig.notes.length).toBeGreaterThan(0)
  })
})

describe("spine", () => {
  it("covers the rear axle, the head tube and where each carrier crosses, with room at each end", () => {
    for (const over of grid) {
      const { jig } = jigOf(over)
      const marks = [0, station(jig, "headBottom").u, station(jig, "headTop").u, ...jig.carriers.map((c) => c.crossing!)]
      expect(jig.spine.uMin).toBeLessThanOrEqual(Math.min(...marks) - ALLOWANCE + 1e-9)
      expect(jig.spine.uMax).toBeGreaterThanOrEqual(Math.max(...marks) + ALLOWANCE - 1e-9)
      expect(jig.spine.length).toBe(roundUp(jig.spine.uMax - jig.spine.uMin, 50))
      expect(jig.spine.postU).toBeCloseTo((jig.spine.uMin + jig.spine.uMax) / 2, 9)
    }
  })
})

describe("jig checks", () => {
  it("each check is the straight-line distance between its two stations", () => {
    const { jig } = jigOf()
    for (const c of jig.checks) {
      const a = station(jig, c.from)
      const b = station(jig, c.to)
      expect(c.length, c.id).toBeCloseTo(Math.hypot(b.u - a.u, b.v - a.v), 9)
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
    expect(len("bbToFrontAxle")).toBeCloseTo(m.frontCenter, 9)
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

  it("one frame: the ranges are single values", () => {
    const { jig } = jigOf()
    const e = jigEnvelope([jig])!
    expect(e.frames).toBe(1)
    expect(e.tilt.min).toBe(e.tilt.max)
    expect(e.tilt.min).toBe(jig.tilt.degrees)
    expect(e.spineLength).toBe(jig.spine.length)
    for (const c of e.carriers) {
      expect(c.angleToSpine.min).toBe(c.angleToSpine.max)
      expect(c.crossing.min).toBe(c.crossing.max)
    }
    expect(e.maxAcross).toBe(Math.max(...jig.stations.map((s) => Math.abs(s.v))))
  })

  it("two frames: covers both, ignoring ones that couldn't be solved", () => {
    const small = jigOf({ effectiveTopTube: 500, chainstayLength: 410, seatTubeLength: 480 }).jig
    const big = jigOf({ effectiveTopTube: 600, chainstayLength: 440, seatTubeLength: 600, headTubeAngle: 73.5 }).jig
    const e = jigEnvelope([small, null, big])!
    expect(e.frames).toBe(2)
    expect(e.tilt.min).toBeLessThan(e.tilt.max)
    expect(e.tilt.min).toBe(Math.min(small.tilt.degrees, big.tilt.degrees))
    expect(e.spineLength).toBeGreaterThanOrEqual(small.spine.length)
    expect(e.spineLength).toBeGreaterThanOrEqual(big.spine.length)
    const seat = e.carriers.find((c) => c.id === "seat")!
    expect(seat.length).toBeGreaterThanOrEqual(carrier(small, "seat").length)
    expect(seat.length).toBeGreaterThanOrEqual(carrier(big, "seat").length)
    expect(seat.angleToSpine.max).toBeGreaterThanOrEqual(seat.angleToSpine.min)
  })
})

describe("jig export", () => {
  const { jig } = jigOf()
  it("CSV has the tilt, a station table and a carrier table in the chosen unit", () => {
    const csv = jigCsv(jig, "mm")
    expect(csv).toContain("Spine tilt")
    expect(csv).toContain("Along spine (mm)")
    expect(csv).toContain("Carrier,Angle to spine")
    expect(csv).toContain("Seat tube carrier")
    expect(csv).toContain("Head tube carrier")
    expect(jigCsv(jig, "in")).toContain("Along spine (in)")
    const bb = csv.split("\n").find((l) => l.startsWith("Bottom bracket"))!.split(",")
    expect(Number(bb[2])).toBeCloseTo(station(jig, "bb").v, 0)
  })
  it("text is tab separated and has every station and carrier", () => {
    const text = jigText(jig, "mm")
    for (const s of jig.stations) expect(text).toContain(s.name)
    for (const c of jig.carriers) expect(text).toContain(c.name)
    expect(text.split("\n").find((l) => l.startsWith("Station"))!.split("\t")).toHaveLength(6)
  })
})
