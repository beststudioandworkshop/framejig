import { describe, expect, it } from "vitest"

import {
  BIKE_TYPES,
  buildFrame,
  CATEGORIES,
  checkRange,
  DEFAULT_INPUTS,
  decodeFrame,
  encodeFrame,
  exampleFrame,
  FREAK_STYLES,
  isStyleOf,
  profileFor,
  readouts,
  rideFeel,
  sanitizeFrame,
  sizedFrame,
  SIZES,
  STYLES,
  styleOf,
  stylesOf,
  type BikeType,
  type RangeKey,
} from "./index"

const RANGE_KEYS: RangeKey[] = ["headTubeAngle", "seatTubeAngle", "bbDrop", "trail", "chainstayLength", "wheelbase"]
const wb = (t: BikeType, s: string) => buildFrame(profileFor(t, s).base).metrics!

describe("the taxonomy", () => {
  it("has styles for every bike type, with unique ids inside each", () => {
    for (const t of BIKE_TYPES) {
      const list = stylesOf(t)
      expect(list.length, t).toBeGreaterThanOrEqual(3)
      expect(new Set(list.map((s) => s.id)).size).toBe(list.length)
    }
    expect(STYLES.length).toBeGreaterThanOrEqual(24)
  })

  it("names the mountain styles the rider asked for", () => {
    expect(stylesOf("mountain").map((s) => s.id)).toEqual(
      expect.arrayContaining(["xc", "trail", "all-mountain", "enduro", "downhill", "dirt-jump"]),
    )
  })

  it("has a bruiser family with retro styles", () => {
    expect(stylesOf("bruiser").map((s) => s.id)).toEqual(expect.arrayContaining(["klunker", "beach-cruiser", "retro-mtb"]))
  })

  it("looks styles up by family, and refuses a style from another family", () => {
    expect(styleOf("mountain", "enduro")?.label).toBe("Enduro")
    expect(styleOf("road", "enduro")).toBeNull()
    expect(styleOf("mountain", null)).toBeNull()
    expect(styleOf("mountain", "nonsense")).toBeNull()
    expect(isStyleOf("track", "sprint")).toBe(true)
    expect(isStyleOf("road", "sprint")).toBe(false)
  })

  it.each(STYLES)("$family / $id has real, honest text", (s) => {
    expect(s.label.length).toBeGreaterThan(2)
    for (const x of [s.tagline, s.forWhat]) expect(x.length).toBeGreaterThan(15)
    expect(s.different.length).toBeGreaterThanOrEqual(2)
    for (const d of s.different) expect(d.length).toBeGreaterThan(15)
    expect(s.reference.toLowerCase()).toContain("estimates")
  })
})

describe("freak bikes", () => {
  it("are listed, with a reason the tool can't model them, and none pretend to be modeled", () => {
    expect(FREAK_STYLES.map((s) => s.id)).toEqual(expect.arrayContaining(["chopper", "longtail", "tall-bike", "tandem", "recumbent", "folding"]))
    expect(new Set(FREAK_STYLES.map((s) => s.id)).size).toBe(FREAK_STYLES.length)
    for (const s of FREAK_STYLES) {
      expect(s.label.length).toBeGreaterThan(2)
      for (const x of [s.tagline, s.forWhat, s.whyNot]) expect(x.length, s.id).toBeGreaterThan(15)
      expect(s.different.length).toBeGreaterThanOrEqual(2)
      expect(typeof s.possibleLater).toBe("boolean")
      expect(STYLES.some((x) => x.id === s.id)).toBe(false)
    }
  })
  it("says tall bikes, tandems, recumbents and folders can't be modeled at all", () => {
    for (const id of ["tall-bike", "tandem", "recumbent", "folding"]) expect(FREAK_STYLES.find((s) => s.id === id)!.possibleLater).toBe(false)
  })
})

describe("effective profiles", () => {
  it("a type with no style, or an unknown style, is the family's own profile", () => {
    expect(profileFor("mountain")).toBe(CATEGORIES.mountain)
    expect(profileFor("mountain", null)).toBe(CATEGORIES.mountain)
    expect(profileFor("mountain", "nonsense")).toBe(CATEGORIES.mountain)
    expect(profileFor("road", "enduro")).toBe(CATEGORIES.road)
  })

  it("is cached: asking twice gives the same object", () => {
    expect(profileFor("mountain", "enduro")).toBe(profileFor("mountain", "enduro"))
  })

  describe.each(STYLES)("$family / $id", (s) => {
    const p = profileFor(s.family, s.id)
    const fam = CATEGORIES[s.family]

    it("carries the style's words and the family's everything else", () => {
      expect(p.id).toBe(s.family)
      expect(p.styleId).toBe(s.id)
      expect(p.label).toBe(s.label)
      expect(p.different).toEqual(s.different)
      expect(p.feel).toEqual(fam.feel)
      expect(p.variables).toEqual(fam.variables)
    })

    it("has ordered ranges: the style's where it overrides, the family's elsewhere", () => {
      for (const k of RANGE_KEYS) {
        const r = p.ranges[k]
        expect(r.low, k).toBeLessThan(r.high)
        expect(r.unit).toBe(fam.ranges[k].unit)
        expect(r.label).toBe(fam.ranges[k].label)
        const o = s.ranges?.[k]
        expect(r.low).toBe(o ? o.low : fam.ranges[k].low)
        expect(r.high).toBe(o ? o.high : fam.ranges[k].high)
      }
      expect(p.positionRange.low).toBeLessThan(p.positionRange.high)
    })

    it("keeps the ride bands in order and inside their scales", () => {
      for (const name of ["steering", "handling", "position", "weight", "bottomBracket"] as const) {
        const sc = p.ride[name]
        const edges = sc.bands.map((b) => b.below)
        for (let i = 1; i < edges.length; i++) expect(edges[i], name).toBeGreaterThan(edges[i - 1])
        for (const e of edges) {
          expect(e).toBeGreaterThan(sc.lo)
          expect(e).toBeLessThan(sc.hi)
        }
        expect(sc.lo).toBeLessThan(sc.hi)
        expect(sc.bands.map((b) => b.label)).toEqual(fam.ride[name].bands.map((b) => b.label))
      }
      expect(p.ride.shortChainstay.below).toBeLessThan(p.ride.longChainstay.above)
    })

    it("has an example frame that is this style, builds with no errors, and sits inside its own ranges", () => {
      const f = p.base
      const r = buildFrame(f)
      expect(f.bikeType).toBe(s.family)
      expect(f.bikeStyle).toBe(s.id)
      expect(r.issues.filter((i) => i.severity === "error")).toEqual([])
      for (const row of readouts(f, r.metrics!)) expect(row.verdict, row.key).toBe("typical")
      const ratio = r.metrics!.stack / r.metrics!.reach
      expect(ratio).toBeGreaterThanOrEqual(p.positionRange.low - 0.02)
      expect(ratio).toBeLessThanOrEqual(p.positionRange.high + 0.02)
    })

    it("reads as an ordinary bike of its style, not an extreme one", () => {
      const f = rideFeel(p.base, buildFrame(p.base).metrics!)
      const label = (id: string) => f.traits.find((x) => x.id === id)!.label
      expect(label("steering")).not.toMatch(/^Very/)
      expect(label("bottomBracket")).not.toMatch(/^Very/)
    })

    it("has sensible head tube lengths and fits in every size", () => {
      const m = buildFrame(p.base).metrics!
      expect(m.headTubeLength).toBeGreaterThan(s.family === "mountain" ? 80 : 60)
      expect(m.headTubeLength).toBeLessThan(260)
      for (const size of SIZES) {
        const f = sizedFrame(s.family, size.id, s.id)
        const r = buildFrame(f)
        expect(f.bikeStyle, size.id).toBe(s.id)
        expect(r.ok, `${size.id}: ${r.issues.map((i) => i.code)}`).toBe(true)
      }
    })

    it("a frame of this style is judged against the style's ranges", () => {
      expect(exampleFrame(s.family, s.id)).toBe(p.base)
      const m = buildFrame(p.base).metrics!
      expect(checkRange("trail", m.trail, s.family, s.id)).toBe("typical")
    })
  })

  describe("how styles differ", () => {
    it("mountain styles get slacker and longer from cross-country to downhill", () => {
      const order = ["xc", "trail", "all-mountain", "enduro", "downhill"]
      for (let i = 1; i < order.length; i++) {
        expect(profileFor("mountain", order[i]).base.headTubeAngle).toBeLessThan(profileFor("mountain", order[i - 1]).base.headTubeAngle)
        expect(wb("mountain", order[i]).wheelbase).toBeGreaterThan(wb("mountain", order[i - 1]).wheelbase)
      }
    })
    it("a dirt jump bike is the shortest mountain style, with the shortest chainstays", () => {
      for (const s of stylesOf("mountain").filter((x) => x.id !== "dirt-jump")) {
        expect(wb("mountain", "dirt-jump").wheelbase).toBeLessThan(wb("mountain", s.id).wheelbase)
        expect(wb("mountain", "dirt-jump").chainstayLength).toBeLessThan(wb("mountain", s.id).chainstayLength)
      }
    })
    it("a fat bike has the biggest wheel of the mountain styles", () => {
      for (const s of stylesOf("mountain").filter((x) => x.id !== "fat")) {
        expect(wb("mountain", "fat").wheelRadius).toBeGreaterThan(wb("mountain", s.id).wheelRadius)
      }
    })
    it("a road race bike is steeper and shorter than endurance, and a crit is the sharpest", () => {
      expect(profileFor("road", "race").base.headTubeAngle).toBeGreaterThan(profileFor("road", "endurance").base.headTubeAngle)
      expect(wb("road", "race").wheelbase).toBeLessThan(wb("road", "endurance").wheelbase)
      expect(wb("road", "crit").wheelbase).toBeLessThan(wb("road", "race").wheelbase)
      expect(wb("road", "endurance").stack).toBeGreaterThan(wb("road", "race").stack)
    })
    it("gravel gets longer and slacker from cyclocross to adventure", () => {
      expect(wb("gravel", "adventure").wheelbase).toBeGreaterThan(wb("gravel", "gravel-race").wheelbase)
      expect(wb("gravel", "gravel-race").wheelbase).toBeGreaterThan(wb("gravel", "cross").wheelbase)
      expect(profileFor("gravel", "adventure").base.headTubeAngle).toBeLessThan(profileFor("gravel", "cross").base.headTubeAngle)
      expect(wb("gravel", "cross").bbHeight).toBeGreaterThan(wb("gravel", "adventure").bbHeight - 5)
    })
    it("an expedition touring bike has the longest chainstays and a randonneur the least trail", () => {
      for (const s of stylesOf("touring").filter((x) => x.id !== "expedition")) {
        expect(wb("touring", "expedition").chainstayLength).toBeGreaterThan(wb("touring", s.id).chainstayLength)
      }
      for (const s of stylesOf("touring").filter((x) => x.id !== "randonneur")) {
        expect(wb("touring", "randonneur").trail).toBeLessThan(wb("touring", s.id).trail)
      }
    })
    it("a sprint bike is the steepest and shortest track bike, and a street bike sits lowest", () => {
      expect(profileFor("track", "sprint").base.headTubeAngle).toBeGreaterThan(profileFor("track", "pursuit").base.headTubeAngle)
      expect(wb("track", "sprint").wheelbase).toBeLessThan(wb("track", "street").wheelbase)
      expect(wb("track", "street").bbDrop).toBeGreaterThan(wb("track", "sprint").bbDrop)
    })
    it("a beach cruiser is the longest bruiser, and a BMX cruiser the shortest", () => {
      for (const s of stylesOf("bruiser").filter((x) => x.id !== "beach-cruiser")) {
        expect(wb("bruiser", "beach-cruiser").wheelbase).toBeGreaterThan(wb("bruiser", s.id).wheelbase)
      }
      for (const s of stylesOf("bruiser").filter((x) => x.id !== "big-bmx")) {
        expect(wb("bruiser", "big-bmx").wheelbase).toBeLessThan(wb("bruiser", s.id).wheelbase)
      }
    })
    it("all-road has no overrides: it is the gravel family's own middle", () => {
      expect(styleOf("gravel", "all-road")!.ranges).toBeUndefined()
      expect(profileFor("gravel", "all-road").ranges).toEqual(CATEGORIES.gravel.ranges)
    })
  })

  describe("a style changes how a frame is judged", () => {
    it("the same numbers read differently under different styles", () => {
      const m = buildFrame(profileFor("mountain", "enduro").base).metrics!
      const asEnduro = rideFeel(profileFor("mountain", "enduro").base, m)
      const asXc = rideFeel({ ...profileFor("mountain", "enduro").base, bikeStyle: "xc" }, m)
      expect(asEnduro.traits[0].label).not.toBe(asXc.traits[0].label)
      expect(checkRange("wheelbase", m.wheelbase, "mountain", "enduro")).toBe("typical")
      expect(checkRange("wheelbase", m.wheelbase, "mountain", "xc")).toBe("high")
    })
  })
})

describe("styles in links", () => {
  it("round trip, for every style", () => {
    for (const s of STYLES) {
      const f = profileFor(s.family, s.id).base
      expect(decodeFrame(encodeFrame(f))).toEqual(f)
    }
  })
  it("a style that doesn't belong to the type is dropped, and no style is null", () => {
    expect(sanitizeFrame({ bikeType: "road", bikeStyle: "enduro" }).bikeStyle).toBeNull()
    expect(sanitizeFrame({ bikeType: "mountain", bikeStyle: "enduro" }).bikeStyle).toBe("enduro")
    expect(sanitizeFrame({ bikeType: "mountain", bikeStyle: 5 }).bikeStyle).toBeNull()
    expect(sanitizeFrame({}).bikeStyle).toBeNull()
    expect(DEFAULT_INPUTS.bikeStyle).toBeNull()
  })
})
