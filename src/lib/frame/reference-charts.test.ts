import { describe, expect, it } from "vitest"

import { buildFrame } from "./build"
import { DEFAULT_INPUTS } from "./constants"
import { chartValue, REFERENCE_CHARTS, type ChartRow } from "./reference-charts"

// Millimeters. A standard 10 mm headset gets most charts to within 2; one chart wants closer to 15.
const TOL = 7
// Where Surly's own table disagrees with itself by more than 3 mm: the Pacer 54 cm and the Straggler 650b 38 cm
// (4 to 6 mm), and the whole Troll table (about 5.5 mm on every size, so it measures reach or stack another way).
const KNOWN_QUIRKS = new Set(["surly-pacer 54cm", "surly-straggler-650b 38cm", "surly-troll XS", "surly-troll S", "surly-troll M", "surly-troll L",
  // The aggregator's small Crust Evasion sizes (very sloped top tubes) and the Domane 44 cm.
  "crust-evasion-2021 Step-through", "crust-evasion-2021 Small (52cm)", "crust-evasion-2021 Medium (54cm)",
  "crust-evasion-2018 Small Step-Through", "crust-evasion-2018 Small", "crust-evasion-2018 Medium", "trek-domane-al-2025 44 cm",
])
// Charts that need a looser comparison, and why.
// - The Schwinn S1's effective top tube (646) is not reach plus stack over tan(seat angle) (607), so it uses another definition.
// - The 2020 Demo is a long-travel full-suspension frame, so its fork length and its stack are not read the same way as a rigid frame's.
const SKIP_IDENTITY = new Set(["schwinn-s1"])
const SKIP_MODEL = new Set(["schwinn-s1"])
const LOOSE_MODEL: Record<string, number> = { "specialized-demo-race-2020": 12 }
// Charts read from an aggregator are held to 10 mm instead of 7: vintage and suspension bikes count the head tube and fork a little differently.
// These two sizes disagree with themselves in the source (reach 22 mm and stack 19 mm off) and are left out of the model comparison.
const SOURCE_DISAGREES = new Set(["2020-crust-bikes-shred-eagle-26 Small", "2021-v4-crust-bikes-dreamer-base X Small"])
// Sizes where an aggregator's effective top tube is more than 10 mm from what its own reach, stack and seat angle imply.
const ETT_DISAGREES = new Set(["2026-trek-bikes-checkpoint-al3 XL", "2020-crust-bikes-shred-eagle-26 Small", "2024-crust-bikes-evasion-trail-140-26x3 L"])
const isAggregated = (c: { notes: string[] }) => c.notes.some((n) => n.includes("Bike Insights"))
const LOOSE_STACK: Record<string, number> = { "specialized-demo-race-2020": 30 }
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
        // Where the maker's own table disagrees with itself, the page is typed as printed and listed here.
        if (SKIP_IDENTITY.has(c.id) || ETT_DISAGREES.has(`${c.id} ${s}`)) return
        const own = KNOWN_QUIRKS.has(`${c.id} ${s}`)
        expect(Math.abs(reach + stack / Math.tan(rad(sta)) - ett), `${c.id} ${s}`).toBeLessThan(isAggregated(c) ? 10 : own ? 7 : 3)
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
        if (SOURCE_DISAGREES.has(`${c.id} ${s}`)) return
        const estimate = drop + (fork + htl) * Math.sin(rad(hta))
        // Axles sit `drop` above the BB, so the head top is that much plus the fork and head tube up the steering axis.
        expect(Math.abs(estimate - stack), `${c.id} ${s}`).toBeLessThan(LOOSE_STACK[c.id] ?? 20)
      })
    }
  })

  // The tool's own maths against the published numbers. The wheel size only matters for
  // trail and standover, so it is left at the default. Standover is not compared: makers measure it in different places.
  describe("the tool reproduces the published numbers", () => {
    for (const c of REFERENCE_CHARTS) {
      // Only charts that give everything the tool needs to place the frame.
      const needed: ChartRow[] = ["forkAxleToCrown", "forkOffset", "bbDrop", "chainstay", "effectiveTopTube", "headTubeLength", "headTubeAngle", "seatTubeAngle", "stack", "reach", "wheelbase"]
      if (chartValue(c, "seatTubeCT", 0) === undefined && chartValue(c, "seatTubeCC", 0) === undefined) continue
      if (SKIP_MODEL.has(c.id)) continue
      if (needed.some((row) => chartValue(c, row, 0) === undefined)) continue
      c.sizes.forEach((size, i) => {
        it(`${c.id} ${size}: stack, reach and wheelbase`, () => {
          const g = (r: ChartRow) => chartValue(c, r, i)!
          const r = buildFrame({
            ...DEFAULT_INPUTS,
            seatTubeAngle: g("seatTubeAngle"),
            headTubeAngle: g("headTubeAngle"),
            ...(chartValue(c, "seatTubeCT", i) !== undefined
              ? { seatTubeLength: g("seatTubeCT") }
              : { drivers: { ...DEFAULT_INPUTS.drivers, seat: "cc" as const }, seatTubeLengthCC: g("seatTubeCC") }),
            effectiveTopTube: g("effectiveTopTube"),
            headTubeLength: g("headTubeLength"),
            bbDrop: g("bbDrop"),
            chainstayLength: g("chainstay"),
            forkAxleToCrown: g("forkAxleToCrown"),
            forkRake: g("forkOffset"),
          })
          const m = r.metrics!
          if (SOURCE_DISAGREES.has(`${c.id} ${size}`)) return
          const tol = LOOSE_MODEL[c.id] ?? (isAggregated(c) ? 10 : TOL)
          expect(Math.abs(m.stack - g("stack"))).toBeLessThan(tol)
          expect(Math.abs(m.reach - g("reach"))).toBeLessThan(tol)
          expect(Math.abs(m.wheelbase - g("wheelbase"))).toBeLessThan(tol)
        })
      })
    }
  })
})
