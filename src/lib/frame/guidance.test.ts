import { describe, expect, it } from "vitest"

import { buildFrame, checkRange, DEFAULT_INPUTS, MOUNTAIN_INPUTS, PRESETS, readouts, TYPICAL_RANGES, TYPICAL_RANGES_BY_TYPE } from "./index"

describe("typical ranges", () => {
  it("classify below, inside and above (edges are inside)", () => {
    const r = TYPICAL_RANGES.trail
    expect(checkRange("trail", r.low - 1)).toBe("low")
    expect(checkRange("trail", r.low)).toBe("typical")
    expect(checkRange("trail", r.high)).toBe("typical")
    expect(checkRange("trail", r.high + 1)).toBe("high")
  })
  it("every range is ordered", () => {
    for (const r of Object.values(TYPICAL_RANGES)) expect(r.low).toBeLessThan(r.high)
  })
  it("readouts report the frame's own values", () => {
    const r = buildFrame(DEFAULT_INPUTS)
    const out = readouts(DEFAULT_INPUTS, r.metrics!)
    expect(out.find((o) => o.key === "trail")!.value).toBe(r.metrics!.trail)
    expect(out.find((o) => o.key === "bbDrop")!.value).toBe(DEFAULT_INPUTS.bbDrop)
    expect(out).toHaveLength(Object.keys(TYPICAL_RANGES).length)
  })
})

describe("per bike type", () => {
  it("each type has its own ordered ranges, and mountain is not the road table", () => {
    for (const type of ["road", "mountain"] as const) {
      for (const r of Object.values(TYPICAL_RANGES_BY_TYPE[type])) expect(r.low).toBeLessThan(r.high)
    }
    expect(TYPICAL_RANGES_BY_TYPE.mountain.trail.low).toBeGreaterThan(TYPICAL_RANGES_BY_TYPE.road.trail.high)
    expect(TYPICAL_RANGES_BY_TYPE.mountain.headTubeAngle.high).toBeLessThan(TYPICAL_RANGES_BY_TYPE.road.headTubeAngle.high)
    expect(TYPICAL_RANGES_BY_TYPE.mountain.bbDrop.high).toBeLessThan(TYPICAL_RANGES_BY_TYPE.road.bbDrop.low)
    expect(TYPICAL_RANGES).toBe(TYPICAL_RANGES_BY_TYPE.road)
  })

  it("the same number reads differently by type", () => {
    expect(checkRange("trail", 120, "road")).toBe("high")
    expect(checkRange("trail", 120, "mountain")).toBe("typical")
    expect(checkRange("headTubeAngle", 65, "road")).toBe("low")
    expect(checkRange("headTubeAngle", 65, "mountain")).toBe("typical")
    expect(checkRange("trail", 120)).toBe("high") // road by default
  })

  it("the example frames sit inside their own type's ranges", () => {
    for (const type of ["road", "mountain"] as const) {
      const inputs = PRESETS[type]
      const r = buildFrame(inputs)
      for (const row of readouts(inputs, r.metrics!)) {
        expect(row.verdict, `${type} ${row.key}`).toBe("typical")
      }
    }
  })

  it("readouts follow the frame's bike type", () => {
    const m = buildFrame(MOUNTAIN_INPUTS).metrics!
    const asMountain = readouts(MOUNTAIN_INPUTS, m).find((x) => x.key === "trail")!
    const asRoad = readouts({ ...MOUNTAIN_INPUTS, bikeType: "road" }, m).find((x) => x.key === "trail")!
    expect(asMountain.verdict).toBe("typical")
    expect(asRoad.verdict).toBe("high")
    expect(asMountain.low).toBeGreaterThan(asRoad.high)
  })
})
