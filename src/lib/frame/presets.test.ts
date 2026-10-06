import { describe, expect, it } from "vitest"

import { buildFrame, DEFAULT_INPUTS, decodeFrame, encodeFrame, MOUNTAIN_INPUTS, PRESETS, sanitizeFrame, switchDriver, syncDerived } from "./index"

describe("example frames", () => {
  it("each type has a preset of that type", () => {
    expect(PRESETS.road.bikeType).toBe("road")
    expect(PRESETS.mountain.bikeType).toBe("mountain")
    expect(PRESETS.road).toBe(DEFAULT_INPUTS)
    expect(PRESETS.mountain).toBe(MOUNTAIN_INPUTS)
  })

  it("both build with no errors", () => {
    for (const p of [DEFAULT_INPUTS, MOUNTAIN_INPUTS]) {
      const r = buildFrame(p)
      expect(r.ok).toBe(true)
      expect(r.issues.filter((i) => i.severity === "error")).toEqual([])
    }
  })

  it("the mountain example is a different bike: slacker, more trail, lower BB drop, longer wheelbase", () => {
    const road = buildFrame(DEFAULT_INPUTS).metrics!
    const mtb = buildFrame(MOUNTAIN_INPUTS).metrics!
    expect(MOUNTAIN_INPUTS.headTubeAngle).toBeLessThan(DEFAULT_INPUTS.headTubeAngle - 5)
    expect(mtb.trail).toBeGreaterThan(road.trail + 40)
    expect(mtb.bbDrop).toBeLessThan(road.bbDrop)
    expect(mtb.wheelbase).toBeGreaterThan(road.wheelbase + 100)
    expect(mtb.wheelRadius).toBeGreaterThan(road.wheelRadius)
  })

  it("the mountain example is driven by reach and stack, with every other measurement worked out and filled in", () => {
    expect(MOUNTAIN_INPUTS.drivers.horizontal).toBe("reach")
    expect(MOUNTAIN_INPUTS.drivers.vertical).toBe("stack")
    const m = buildFrame(MOUNTAIN_INPUTS).metrics!
    expect(MOUNTAIN_INPUTS.effectiveTopTube).toBeCloseTo(m.effectiveTopTube, 6)
    expect(MOUNTAIN_INPUTS.frontCenter).toBeCloseTo(m.frontCenter, 6)
    expect(MOUNTAIN_INPUTS.headTubeLength).toBeCloseTo(m.headTubeLength, 6)
    // Switching drivers doesn't move the frame.
    const r = buildFrame(MOUNTAIN_INPUTS)
    const back = switchDriver(switchDriver(MOUNTAIN_INPUTS, r, "horizontal", "effectiveTopTube"), r, "vertical", "headTubeLength")
    expect(buildFrame(back).metrics!.wheelbase).toBeCloseTo(m.wheelbase, 6)
  })

  it("syncing the derived numbers changes nothing", () => {
    expect(buildFrame(syncDerived(MOUNTAIN_INPUTS, buildFrame(MOUNTAIN_INPUTS))).metrics).toEqual(buildFrame(MOUNTAIN_INPUTS).metrics)
  })
})

describe("bike type in links and files", () => {
  it("round trips through a link, and a bad type falls back to road", () => {
    expect(decodeFrame(encodeFrame(MOUNTAIN_INPUTS))).toEqual(MOUNTAIN_INPUTS)
    expect(decodeFrame(encodeFrame({ ...DEFAULT_INPUTS, bikeType: "mountain" }))!.bikeType).toBe("mountain")
    expect(sanitizeFrame({ bikeType: "unicycle" }).bikeType).toBe("road")
    expect(sanitizeFrame({}).bikeType).toBe("road")
    expect(sanitizeFrame({ bikeType: "mountain" }).bikeType).toBe("mountain")
  })
})
