import { describe, expect, it } from "vitest"

import { buildFrame } from "./build"
import { DEFAULT_INPUTS } from "./constants"
import { chartValue, REFERENCE_CHARTS, type ChartRow } from "./reference-charts"

// Millimeters. A standard 10 mm headset gets most charts to within 2; one chart wants closer to 15.
const TOL = 7
const rad = (d: number) => (d * Math.PI) / 180

describe("reference charts", () => {
  it("gives every row one value, or one per size", () => {
    for (const c of REFERENCE_CHARTS) {
      for (const [row, v] of Object.entries(c.rows)) {
        if (Array.isArray(v)) expect(v.length, `${c.id} ${row}`).toBe(c.sizes.length)
      }
    }
  })

  it("has unique ids", () => {
    const ids = REFERENCE_CHARTS.map((c) => c.id)
    expect(new Set(ids).size).toBe(ids.length)
  })

  // The published "effective top tube" is the horizontal distance between the seat
  // tube line and the head tube top, measured at the head tube top: reach + stack / tan(seat angle).
  // It holds to a couple of millimeters on every chart, so it also catches typing slips.
  it("has an effective top tube that matches reach, stack and seat angle", () => {
    for (const c of REFERENCE_CHARTS) {
      c.sizes.forEach((s, i) => {
        const g = (r: ChartRow) => chartValue(c, r, i)
        const reach = g("reach")
        const stack = g("stack")
        const sta = g("seatTubeAngle")
        const ett = g("effectiveTopTube")
        if (reach === undefined || stack === undefined || sta === undefined || ett === undefined) return
        expect(Math.abs(reach + stack / Math.tan(rad(sta)) - ett), `${c.id} ${s}`).toBeLessThan(3)
      })
    }
  })

  it("has a stack that matches the head tube, fork and angles (to the nearest few millimeters)", () => {
    // Only a sanity bound: the charts differ in how they count the headset.
    for (const c of REFERENCE_CHARTS) {
      c.sizes.forEach((s, i) => {
        const g = (r: ChartRow) => chartValue(c, r, i)
        const stack = g("stack")
        const hta = g("headTubeAngle")
        const htl = g("headTubeLength")
        const fork = g("forkAxleToCrown")
        const drop = g("bbDrop")
        if (stack === undefined || hta === undefined || htl === undefined || fork === undefined || drop === undefined) return
        const estimate = drop + (fork + htl) * Math.sin(rad(hta))
        // Axles sit `drop` above the BB, so the head top is that much plus the fork and head tube up the steering axis.
        expect(Math.abs(estimate - stack), `${c.id} ${s}`).toBeLessThan(20)
      })
    }
  })

  // The tool's own maths against the published numbers. The wheel size only matters for
  // trail and standover, so it is left at the default. Standover is not compared: makers measure it in different places.
  describe("the tool reproduces the published numbers", () => {
    for (const c of REFERENCE_CHARTS) {
      if (chartValue(c, "forkAxleToCrown", 0) === undefined) continue
      c.sizes.forEach((size, i) => {
        it(`${c.id} ${size}: stack, reach and wheelbase`, () => {
          const g = (r: ChartRow) => chartValue(c, r, i)!
          const r = buildFrame({
            ...DEFAULT_INPUTS,
            seatTubeAngle: g("seatTubeAngle"),
            headTubeAngle: g("headTubeAngle"),
            seatTubeLength: g("seatTubeCT"),
            effectiveTopTube: g("effectiveTopTube"),
            headTubeLength: g("headTubeLength"),
            bbDrop: g("bbDrop"),
            chainstayLength: g("chainstay"),
            forkAxleToCrown: g("forkAxleToCrown"),
            forkRake: g("forkOffset"),
          })
          const m = r.metrics!
          expect(Math.abs(m.stack - g("stack"))).toBeLessThan(TOL)
          expect(Math.abs(m.reach - g("reach"))).toBeLessThan(TOL)
          expect(Math.abs(m.wheelbase - g("wheelbase"))).toBeLessThan(TOL)
        })
      })
    }
  })
})
