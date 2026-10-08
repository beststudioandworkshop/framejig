import { describe, expect, it } from "vitest"

import {
  ALLOWANCE,
  POST_OVERLAP,
  SPINE_HEIGHT,
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

  it("the rear axle is the origin: nothing forward of it, on the axle line, below the spine's centerline", () => {
    const { jig } = jigOf()
    const s = station(jig, "rearAxle")
    for (const v of [s.x, s.y, s.u]) expect(v).toBeCloseTo(0, 9)
    expect(s.v).toBeCloseTo(-jig.spine.centerline, 9)
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

describe("level spine", () => {
  it("v is the height above the spine's centerline, and u is the distance from the rear axle", () => {
    const { jig } = jigOf()
    const centerline = DEFAULT_JIG.spineClearance + SPINE_HEIGHT / 2
    expect(jig.spine.bottom).toBe(DEFAULT_JIG.spineClearance)
    expect(jig.spine.top).toBe(DEFAULT_JIG.spineClearance + SPINE_HEIGHT)
    expect(jig.spine.centerline).toBe(centerline)
    for (const s of jig.stations) {
      expect(s.u).toBeCloseTo(s.x, 9)
      expect(s.v).toBeCloseTo(s.y - centerline, 9)
    }
  })

  it("the spine's height is 120 mm and its bottom edge starts 120 mm above the axle line", () => {
    expect(SPINE_HEIGHT).toBe(120)
    expect(DEFAULT_JIG.spineClearance).toBe(120)
  })

  it("raising the spine moves every v down by the same amount and leaves u alone", () => {
    const a = jigOf().jig.stations
    const b = jigOf({}, { spineClearance: 170 }).jig.stations
    a.forEach((s, i) => {
      expect(b[i].u).toBeCloseTo(s.u, 9)
      expect(b[i].v).toBeCloseTo(s.v - 50, 9)
    })
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

  it("the seat carrier pivots at the BB and the head carrier at the bottom of the head tube", () => {
    const { jig } = jigOf()
    expect(carrier(jig, "seat").pivot).toBe("bb")
    expect(carrier(jig, "head").pivot).toBe("headBottom")
    expect(carrier(jig, "seat").pivotU).toBeCloseTo(station(jig, "bb").u, 9)
    expect(carrier(jig, "head").pivotU).toBeCloseTo(station(jig, "headBottom").u, 9)
  })

  it.each(grid)("the tube angle is the frame's own angle and the angle to the spine is its supplement (%#)", (over) => {
    const { jig, inputs } = jigOf(over)
    expect(carrier(jig, "head").tubeAngle).toBe(inputs.headTubeAngle)
    expect(carrier(jig, "seat").tubeAngle).toBe(inputs.seatTubeAngle)
    for (const c of jig.carriers) {
      expect(c.angleToSpine).toBeCloseTo(180 - c.tubeAngle, 9)
      expect(c.offSquare).toBeCloseTo(c.angleToSpine - 90, 9)
    }
  })

  it.each(grid)("the carrier's axis runs through the pin and its other station (%#)", (over) => {
    const { jig } = jigOf(over)
    for (const c of jig.carriers) {
      const a = rad(c.tubeAngle)
      const pin = station(jig, c.pivot)
      for (const stop of c.stops) {
        const s = station(jig, stop.station)
        // Perpendicular distance from the station to the axis line through the pin, with the tube going up and back.
        const off = (s.u - pin.u) * Math.sin(a) + (s.v - pin.v) * Math.cos(a)
        expect(off, `${c.id} ${stop.station}`).toBeCloseTo(0, 6)
      }
    }
  })

  it("the stops are the pin at zero and the tube's top at its length", () => {
    const { jig, m } = jigOf()
    const seat = carrier(jig, "seat")
    const head = carrier(jig, "head")
    expect(seat.stops[0]).toEqual({ station: "bb", along: 0 })
    expect(seat.stops[1].along).toBeCloseTo(m.seatTubeLength, 9)
    expect(head.stops[0]).toEqual({ station: "headBottom", along: 0 })
    expect(head.stops[1].along).toBeCloseTo(m.headTubeLength, 9)
  })

  it("the seat post hangs below the spine and the head post stands above it, by the pin's clearance", () => {
    const { jig } = jigOf()
    const seat = carrier(jig, "seat")
    const head = carrier(jig, "head")
    expect(seat.side).toBe("below")
    expect(head.side).toBe("above")
    expect(seat.pinClearance).toBeCloseTo(jig.spine.bottom - station(jig, "bb").y, 9)
    expect(head.pinClearance).toBeCloseTo(station(jig, "headBottom").y - jig.spine.top, 9)
    expect(seat.pinClearance).toBeGreaterThan(0)
    expect(head.pinClearance).toBeGreaterThan(0)
  })

  it("the default frame's pins land where the sketch puts them: 190 below the spine, 99 above it", () => {
    const { jig } = jigOf()
    expect(Math.round(carrier(jig, "seat").pinClearance)).toBe(190)
    expect(Math.round(carrier(jig, "head").pinClearance)).toBe(99)
  })

  it("a carrier is long enough for its stops plus room each end, in 50 mm steps; a post for its overlap, clearance and room", () => {
    for (const over of grid) {
      for (const c of jigOf(over).jig.carriers) {
        const reach = c.stops[1].along
        expect(c.length).toBeGreaterThanOrEqual(reach + 2 * ALLOWANCE)
        expect(c.length % 50).toBe(0)
        expect(c.length - (reach + 2 * ALLOWANCE)).toBeLessThan(50)
        expect(c.postLength).toBeGreaterThanOrEqual(POST_OVERLAP + Math.max(0, c.pinClearance) + ALLOWANCE)
        expect(c.postLength % 50).toBe(0)
      }
    }
  })

  it("the carriers lean back, about 105 to 110 degrees from the spine's forward direction for a normal frame", () => {
    for (const c of jigOf().jig.carriers) expect(c.angleToSpine).toBeGreaterThan(100)
    for (const c of jigOf().jig.carriers) expect(c.angleToSpine).toBeLessThan(112)
  })

  it("warns when a pin falls inside the spine's height", () => {
    // A very low spine puts the head tube bottom pin inside it; a very high one does the same to the seat pin.
    expect(jigOf({}, { spineClearance: 300 }).jig.notes.some((n) => n.includes("inside the spine"))).toBe(true)
    expect(jigOf().jig.notes).toEqual([])
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
  it("covers every station but the front axle, with room at each end", () => {
    for (const over of grid) {
      const { jig } = jigOf(over)
      const marks = jig.stations.filter((s) => s.id !== "frontAxle").map((s) => s.u)
      expect(jig.spine.uMin).toBeCloseTo(Math.min(...marks) - ALLOWANCE, 9)
      expect(jig.spine.uMax).toBeCloseTo(Math.max(...marks) + ALLOWANCE, 9)
      expect(jig.spine.length).toBe(roundUp(jig.spine.uMax - jig.spine.uMin, 50))
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
    expect(e.spineLength).toBe(jig.spine.length)
    for (const c of e.carriers) {
      expect(c.angleToSpine.min).toBe(c.angleToSpine.max)
      expect(c.pivotU.min).toBe(c.pivotU.max)
      expect(c.pinClearance.min).toBe(c.pinClearance.max)
    }
    expect(e.maxAcross).toBe(Math.max(...jig.stations.map((s) => Math.abs(s.v))))
  })

  it("two frames: covers both, ignoring ones that couldn't be solved", () => {
    const small = jigOf({ effectiveTopTube: 500, chainstayLength: 410, seatTubeLength: 480 }).jig
    const big = jigOf({ effectiveTopTube: 600, chainstayLength: 440, seatTubeLength: 600, headTubeAngle: 73.5 }).jig
    const e = jigEnvelope([small, null, big])!
    expect(e.frames).toBe(2)
    expect(e.spineLength).toBeGreaterThanOrEqual(small.spine.length)
    expect(e.spineLength).toBeGreaterThanOrEqual(big.spine.length)
    const seat = e.carriers.find((c) => c.id === "seat")!
    expect(seat.length).toBeGreaterThanOrEqual(carrier(small, "seat").length)
    expect(seat.length).toBeGreaterThanOrEqual(carrier(big, "seat").length)
    expect(seat.postLength).toBeGreaterThanOrEqual(carrier(big, "seat").postLength)
    expect(seat.pivotU.max).toBeGreaterThanOrEqual(seat.pivotU.min)
    const head = e.carriers.find((c) => c.id === "head")!
    expect(head.angleToSpine.max).toBeGreaterThan(head.angleToSpine.min)
  })
})

describe("jig export", () => {
  const { jig } = jigOf()
  it("CSV has the spine line, a station table and a carrier table in the chosen unit", () => {
    const csv = jigCsv(jig, "mm")
    expect(csv).toContain("Spine bottom edge above the axle line")
    expect(csv).toContain("Along spine (mm)")
    expect(csv).toContain("Carrier,Tube angle")
    expect(csv).toContain("Seat tube carrier")
    expect(csv).toContain("Head tube carrier")
    expect(csv).not.toContain("tilt")
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
