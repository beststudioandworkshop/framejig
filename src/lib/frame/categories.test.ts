import { describe, expect, it } from "vitest"

import {
  BIKE_TYPES,
  BIKE_TYPE_LABELS,
  buildFrame,
  CATEGORIES,
  readouts,
  rideFeel,
  switchDriver,
  TYPICAL_RANGES_BY_TYPE,
  type RangeKey,
  type RideProfile,
  type Scale,
} from "./index"

const RANGE_KEYS: RangeKey[] = ["headTubeAngle", "seatTubeAngle", "bbDrop", "trail", "chainstayLength", "wheelbase"]
const SCALES = ["steering", "handling", "position", "weight", "bottomBracket"] as const

describe("categories", () => {
  it("has the five bike types, in order, each keyed by its own id and labeled", () => {
    expect(BIKE_TYPES).toEqual(["road", "gravel", "mountain", "touring", "track"])
    expect(Object.keys(CATEGORIES)).toEqual(BIKE_TYPES)
    for (const t of BIKE_TYPES) {
      expect(CATEGORIES[t].id).toBe(t)
      expect(CATEGORIES[t].label).toBe(BIKE_TYPE_LABELS[t])
    }
  })

  describe.each(BIKE_TYPES)("%s", (t) => {
    const c = CATEGORIES[t]

    it("has real text everywhere", () => {
      for (const s of [c.tagline, c.forWhat, c.reference]) expect(s.length).toBeGreaterThan(15)
      for (const key of [...RANGE_KEYS, "position"] as const) expect(c.rangeWhy[key].length, key).toBeGreaterThan(25)
      expect(c.feel.length).toBeGreaterThanOrEqual(3)
      expect(c.variables.length).toBeGreaterThanOrEqual(3)
      for (const n of [...c.feel, ...c.variables]) {
        expect(n.title.length).toBeGreaterThan(2)
        expect(n.text.length).toBeGreaterThan(25)
      }
      expect(new Set(c.feel.map((n) => n.title)).size).toBe(c.feel.length)
      expect(new Set(c.variables.map((n) => n.title)).size).toBe(c.variables.length)
    })

    it("says the numbers are estimates until reference charts replace them", () => {
      expect(c.reference.toLowerCase()).toContain("estimates")
      expect(c.ride.disclaimer.toLowerCase()).toContain("rules of thumb")
      expect(c.ride.disclaimer.toLowerCase()).toContain("estimates")
    })

    it("has ordered ranges with the right units", () => {
      for (const k of RANGE_KEYS) {
        const r = c.ranges[k]
        expect(r.low, k).toBeLessThan(r.high)
        expect(r.unit).toBe(k.endsWith("Angle") ? "°" : "mm")
      }
      expect(c.positionRange.low).toBeLessThan(c.positionRange.high)
      expect(TYPICAL_RANGES_BY_TYPE[t]).toBe(c.ranges)
    })

    it("has ride bands that ascend, fit their scale and have unique labels", () => {
      const ride: RideProfile = c.ride
      for (const name of SCALES) {
        const s: Scale = ride[name]
        expect(s.lo, name).toBeLessThan(s.hi)
        const edges = s.bands.map((b) => b.below)
        for (let i = 1; i < edges.length; i++) expect(edges[i], `${name} edges ascend`).toBeGreaterThan(edges[i - 1])
        for (const e of edges) {
          expect(e).toBeGreaterThan(s.lo)
          expect(e).toBeLessThan(s.hi)
        }
        const labels = [...s.bands.map((b) => b.label), s.last.label]
        expect(new Set(labels).size).toBe(labels.length)
        for (const b of [...s.bands, s.last]) expect(b.text.length).toBeGreaterThan(20)
      }
      expect(ride.shortChainstay.below).toBeLessThan(ride.longChainstay.above)
    })

    it("has a grading rule that makes bigger sizes bigger", () => {
      expect(c.grade.reachStep).toBeGreaterThan(0)
      expect(c.grade.stackStep).toBeGreaterThan(0)
      expect(c.grade.seatTubeStep).toBeGreaterThan(0)
    })

    describe("its example frame", () => {
      const inputs = c.base
      const r = buildFrame(inputs)
      const m = r.metrics!

      it("is a frame of this type that builds with no errors", () => {
        expect(inputs.bikeType).toBe(t)
        expect(r.ok).toBe(true)
        expect(r.issues.filter((i) => i.severity === "error")).toEqual([])
        expect(r.tubes).toHaveLength(6)
      })

      it("sits inside its own typical ranges", () => {
        for (const row of readouts(inputs, m)) expect(row.verdict, row.key).toBe("typical")
        const ratio = m.stack / m.reach
        expect(ratio).toBeGreaterThanOrEqual(c.positionRange.low - 0.05)
        expect(ratio).toBeLessThanOrEqual(c.positionRange.high + 0.05)
      })

      it("reads as an ordinary bike of its type, not an extreme one", () => {
        const f = rideFeel(inputs, m)
        const label = (id: string) => f.traits.find((x) => x.id === id)!.label
        expect(label("steering")).not.toMatch(/^Very/)
        expect(label("bottomBracket")).not.toMatch(/^Very/)
        expect(label("weight")).toBe("Middle")
      })

      it("keeps the same frame whichever measurements drive it", () => {
        let f = inputs
        for (const [key, value] of [
          ["bb", "height"],
          ["rear", "rearCenter"],
          ["seat", "cc"],
          ["horizontal", "frontCenter"],
          ["vertical", "stack"],
          ["horizontal", "reach"],
          ["vertical", "headTubeLength"],
          ["horizontal", "effectiveTopTube"],
        ] as const) {
          f = switchDriver(f, buildFrame(f), key, value)
          const again = buildFrame(f).metrics!
          expect(again.wheelbase, `${key}=${value}`).toBeCloseTo(m.wheelbase, 4)
          expect(again.trail).toBeCloseTo(m.trail, 4)
          expect(again.stack).toBeCloseTo(m.stack, 4)
          expect(again.reach).toBeCloseTo(m.reach, 4)
        }
      })
    })
  })

  describe("how the categories differ", () => {
    type T = (typeof BIKE_TYPES)[number]
    const metrics = Object.fromEntries(BIKE_TYPES.map((t) => [t, buildFrame(CATEGORIES[t].base).metrics!])) as Record<
      T,
      NonNullable<ReturnType<typeof buildFrame>["metrics"]>
    >
    const others = (t: T) => BIKE_TYPES.filter((x) => x !== t)

    it("a mountain bike has the most trail and the slackest head angle", () => {
      for (const t of others("mountain")) {
        expect(metrics.mountain.trail).toBeGreaterThan(metrics[t].trail)
        expect(CATEGORIES.mountain.base.headTubeAngle).toBeLessThan(CATEGORIES[t].base.headTubeAngle)
      }
    })
    it("a mountain bike has the longest wheelbase and the smallest BB drop", () => {
      for (const t of others("mountain")) {
        expect(metrics.mountain.wheelbase).toBeGreaterThan(metrics[t].wheelbase)
        expect(metrics.mountain.bbDrop).toBeLessThan(metrics[t].bbDrop)
      }
    })
    it("a track bike has the shortest wheelbase and chainstays, and the steepest head angle", () => {
      for (const t of others("track")) {
        expect(metrics.track.wheelbase).toBeLessThan(metrics[t].wheelbase)
        expect(metrics.track.chainstayLength).toBeLessThan(metrics[t].chainstayLength)
        expect(CATEGORIES.track.base.headTubeAngle).toBeGreaterThan(CATEGORIES[t].base.headTubeAngle)
      }
    })
    it("a touring bike has the longest chainstays and a tall position", () => {
      for (const t of others("touring")) expect(metrics.touring.chainstayLength).toBeGreaterThan(metrics[t].chainstayLength)
      const ratio = (t: T) => metrics[t].stack / metrics[t].reach
      for (const t of ["road", "track", "mountain"] as const) expect(ratio("touring")).toBeGreaterThan(ratio(t))
    })
    it("gravel sits between road and touring on wheelbase and chainstay", () => {
      expect(metrics.gravel.wheelbase).toBeGreaterThan(metrics.road.wheelbase)
      expect(metrics.gravel.wheelbase).toBeLessThan(metrics.touring.wheelbase)
      expect(metrics.gravel.chainstayLength).toBeGreaterThan(metrics.road.chainstayLength)
      expect(metrics.gravel.chainstayLength).toBeLessThan(metrics.touring.chainstayLength)
    })
    it("the wheels differ by type: mountain biggest, track smallest", () => {
      for (const t of others("mountain")) expect(metrics.mountain.wheelRadius).toBeGreaterThan(metrics[t].wheelRadius)
      for (const t of others("track")) expect(metrics.track.wheelRadius).toBeLessThan(metrics[t].wheelRadius)
    })
    it("the same numbers read differently under another type's bands", () => {
      const asRoad = rideFeel({ ...CATEGORIES.mountain.base, bikeType: "road" }, metrics.mountain)
      const asMountain = rideFeel(CATEGORIES.mountain.base, metrics.mountain)
      expect(asRoad.traits[0].label).not.toBe(asMountain.traits[0].label)
    })
  })
})
