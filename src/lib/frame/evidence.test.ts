import { describe, expect, it } from "vitest"

import {
  BASIS_LABEL,
  chartName,
  deriveEvidence,
  GENERIC_WHY,
  isCharted,
  picksFor,
  profileFor,
  REFERENCE_CHARTS,
  STYLE_CHARTS,
  STYLES,
  whyFor,
  type RangeKey,
} from "./index"

const KEYS: RangeKey[] = ["headTubeAngle", "seatTubeAngle", "bbDrop", "trail", "chainstayLength", "wheelbase"]

describe("style charts", () => {
  it("only name styles that exist and charts that exist", () => {
    const styleIds = new Set(STYLES.map((s) => s.id))
    for (const [style, picks] of Object.entries(STYLE_CHARTS)) {
      expect(styleIds.has(style), style).toBe(true)
      for (const p of picks) {
        const id = typeof p === "string" ? p : p.id
        const chart = REFERENCE_CHARTS.find((c) => c.id === id)
        expect(chart, `${style}: ${id}`).toBeDefined()
        if (typeof p !== "string" && p.sizes) for (const s of p.sizes) expect(chart!.sizes, `${id} ${s}`).toContain(s)
      }
    }
  })

  it("gives every chart a readable name", () => {
    for (const c of REFERENCE_CHARTS) expect(chartName(c.id).length).toBeGreaterThan(3)
  })
})

describe("deriveEvidence", () => {
  const wheel = { rimDiameter: 622, tireSection: 28 }

  it("is null with no charts", () => {
    expect(deriveEvidence([], wheel)).toBeNull()
    expect(deriveEvidence(["no-such-chart"], wheel)).toBeNull()
  })

  it("covers every angle the chart prints, widened to a minimum for one bike", () => {
    const ev = deriveEvidence(["surly-steamroller"], wheel)!
    expect(ev.bikes).toBe(1)
    // The Steamroller's head angles run 72.5 to 74 and its seat angles 73 to 74.5.
    expect(ev.ranges.headTubeAngle!.low).toBeLessThanOrEqual(72.5)
    expect(ev.ranges.headTubeAngle!.high).toBeGreaterThanOrEqual(74)
    expect(ev.ranges.seatTubeAngle!.low).toBeLessThanOrEqual(73)
    expect(ev.ranges.seatTubeAngle!.high).toBeGreaterThanOrEqual(74.5)
    expect(ev.ranges.bbDrop!.low).toBeLessThanOrEqual(70)
    expect(ev.ranges.bbDrop!.high).toBeGreaterThanOrEqual(70)
    expect(ev.ranges.bbDrop!.high - ev.ranges.bbDrop!.low).toBeGreaterThanOrEqual(10)
    expect(ev.ranges.bbDrop!.basis).toBe("charts")
  })

  it("trail always needs a wheel, so it says so", () => {
    const ev = deriveEvidence(["surly-steamroller"], wheel)!
    expect(ev.ranges.trail!.basis).toBe("charts-wheel")
  })

  it("a BB drop worked out from a BB height is marked as needing the wheel; a printed one is not", () => {
    expect(deriveEvidence(["specialized-stumpjumper-1996"], { rimDiameter: 559, tireSection: 45 })!.ranges.bbDrop!.basis).toBe("charts-wheel")
    expect(deriveEvidence(["surly-pacer"], wheel)!.ranges.bbDrop!.basis).toBe("charts")
  })

  it("only reads the frames it is asked for", () => {
    const some = deriveEvidence([{ id: "free-agent-2020", sizes: ['Ratio (24")'] }], { rimDiameter: 507, tireSection: 45 })!
    expect(some.ranges.chainstayLength!.low).toBeLessThanOrEqual(373)
    expect(some.ranges.chainstayLength!.high).toBeLessThan(400)
  })

  it("a BMX frame's BB comes out at or above the axles", () => {
    const ev = deriveEvidence(picksFor("bruiser", "big-bmx"), { rimDiameter: 507, tireSection: 45 })!
    expect(ev.ranges.bbDrop!.high).toBeLessThanOrEqual(5)
    expect(ev.ranges.bbDrop!.basis).toBe("charts-wheel")
  })

  it("reads the fork length the charts give", () => {
    expect(deriveEvidence(["surly-pacer"], wheel)!.fork).toBe(376)
  })
})

describe("profiles with evidence", () => {
  it("marks every range, and a style with no charts is entirely assumed", () => {
    const race = profileFor("road", "race")
    expect(isCharted(race)).toBe(false)
    for (const k of KEYS) expect(race.ranges[k].basis).toBe("assumed")
    expect(race.positionBasis).toBe("assumed")
    expect(race.evidence).toBeUndefined()
  })

  it("a style with charts says which, and its charted ranges are marked", () => {
    const p = profileFor("gravel", "adventure")
    expect(isCharted(p)).toBe(true)
    expect(p.evidence!.charts).toEqual(["surly-bridge-club", "crust-scapegoat", "ritchey-ascent-2025", "2025-crust-bikes-bombora-base", "surly-ogre"])
    for (const k of KEYS) expect(["charts", "charts-wheel"]).toContain(p.ranges[k].basis)
    expect(p.positionBasis).toBe("charts")
  })

  it("the range holds what the charts hold", () => {
    const p = profileFor("touring", "expedition")
    // The Disc Trucker's chainstay is 450 on every size and its head angle 70 to 72.
    expect(p.ranges.chainstayLength.high).toBeGreaterThanOrEqual(450)
    expect(p.ranges.headTubeAngle.low).toBeLessThanOrEqual(70)
    expect(p.ranges.headTubeAngle.high).toBeGreaterThanOrEqual(72)
  })

  it("a family's range comes from all of its styles' charts", () => {
    const fam = profileFor("mountain")
    expect(fam.evidence!.charts.length).toBeGreaterThan(10)
    expect(fam.evidence!.bikes).toBe(fam.evidence!.charts.length)
  })

  it("the example frame sits inside the ranges and uses the charts' fork", () => {
    const p = profileFor("road", "endurance")
    expect(p.base.forkAxleToCrown).toBe(376)
  })

  it("shows the plain reason where a chart set the range and the written one where it is assumed", () => {
    const charted = profileFor("road", "endurance")
    const assumed = profileFor("road", "race")
    expect(whyFor(charted, "trail")).toBe(GENERIC_WHY.trail)
    expect(whyFor(assumed, "trail")).toBe(assumed.rangeWhy.trail)
    expect(whyFor(charted, "position")).toBe(GENERIC_WHY.position)
    expect(whyFor(assumed, "position")).toBe(assumed.rangeWhy.position)
  })

  it("has a label for each basis", () => {
    expect(Object.keys(BASIS_LABEL).sort()).toEqual(["assumed", "charts", "charts-wheel"])
  })
})
