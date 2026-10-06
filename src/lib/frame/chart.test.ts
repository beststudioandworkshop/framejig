import { describe, expect, it } from "vitest"

import { CATEGORIES, CHART_VIEWS, niceTicks, profileFor, STYLES, taxonomyChart, type ChartView } from "./index"

const views = Object.keys(CHART_VIEWS) as ChartView[]

describe("taxonomy chart", () => {
  it("has three views, each with two different measures", () => {
    expect(views).toEqual(["steering", "angles", "stance"])
    for (const v of views) {
      expect(CHART_VIEWS[v].x).not.toBe(CHART_VIEWS[v].y)
      expect(CHART_VIEWS[v].label.length).toBeGreaterThan(5)
      expect(CHART_VIEWS[v].blurb.length).toBeGreaterThan(30)
    }
  })

  describe.each(views)("%s", (view) => {
    const chart = taxonomyChart(view)
    const { x, y } = CHART_VIEWS[view]

    it("has a box for every family and every style, once each", () => {
      expect(chart.boxes).toHaveLength(Object.keys(CATEGORIES).length + STYLES.length)
      expect(chart.boxes.filter((b) => b.style === null).map((b) => b.family)).toEqual(Object.keys(CATEGORIES))
      for (const s of STYLES) expect(chart.boxes.filter((b) => b.family === s.family && b.style === s.id)).toHaveLength(1)
    })

    it("draws each box from its own ranges", () => {
      for (const b of chart.boxes) {
        const p = profileFor(b.family, b.style)
        expect(b.x).toEqual([p.ranges[x].low, p.ranges[x].high])
        expect(b.y).toEqual([p.ranges[y].low, p.ranges[y].high])
        expect(b.x[0]).toBeLessThan(b.x[1])
        expect(b.y[0]).toBeLessThan(b.y[1])
        expect(b.label).toBe(p.label)
      }
    })

    it("has a domain that holds every box with room to spare", () => {
      for (const b of chart.boxes) {
        expect(b.x[0]).toBeGreaterThan(chart.xDomain[0])
        expect(b.x[1]).toBeLessThan(chart.xDomain[1])
        expect(b.y[0]).toBeGreaterThan(chart.yDomain[0])
        expect(b.y[1]).toBeLessThan(chart.yDomain[1])
      }
    })

    it("is the same every time", () => {
      expect(taxonomyChart(view)).toEqual(chart)
    })
  })

  it("puts a downhill bike up and to the right of a road race bike on steering and length", () => {
    const c = taxonomyChart("steering")
    const pick = (f: string, s: string | null) => c.boxes.find((b) => b.family === f && b.style === s)!
    const dh = pick("mountain", "downhill")
    const race = pick("road", "race")
    expect(dh.x[0]).toBeGreaterThan(race.x[1])
    expect(dh.y[0]).toBeGreaterThan(race.y[1])
  })

  it("puts a track sprint bike to the right of a downhill bike on angles", () => {
    const c = taxonomyChart("angles")
    const pick = (f: string, s: string | null) => c.boxes.find((b) => b.family === f && b.style === s)!
    expect(pick("track", "sprint").x[0]).toBeGreaterThan(pick("mountain", "downhill").x[1])
  })
})

describe("niceTicks", () => {
  it("gives round values inside the domain", () => {
    const t = niceTicks([930, 1300])
    expect(t.length).toBeGreaterThanOrEqual(3)
    expect(t.length).toBeLessThanOrEqual(10)
    for (const v of t) {
      expect(v).toBeGreaterThanOrEqual(930)
      expect(v).toBeLessThanOrEqual(1300)
    }
    expect(t.every((v) => v % 50 === 0 || v % 100 === 0)).toBe(true)
  })
  it("is ascending with even steps", () => {
    const t = niceTicks([60, 80], 5)
    const steps = t.slice(1).map((v, i) => v - t[i])
    for (const s of steps) expect(s).toBeCloseTo(steps[0], 9)
    expect(t).toEqual([...t].sort((a, b) => a - b))
  })
})
