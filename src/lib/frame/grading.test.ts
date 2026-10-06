import { describe, expect, it } from "vitest"

import {
  BIKE_TYPES,
  buildFrame,
  CATEGORIES,
  decodeFrame,
  encodeFrame,
  sizedFrame,
  sizeInfo,
  SIZES,
  suggestSize,
  switchDriver,
  type SizeId,
} from "./index"

describe("sizes", () => {
  it("run small to extra large, one step apart from the medium, with contiguous rider heights", () => {
    expect(SIZES.map((s) => s.id)).toEqual(["S", "M", "L", "XL"])
    expect(SIZES.map((s) => s.step)).toEqual([-1, 0, 1, 2])
    for (let i = 1; i < SIZES.length; i++) expect(SIZES[i].riderCm[0]).toBe(SIZES[i - 1].riderCm[1])
    for (const s of SIZES) expect(s.riderCm[0]).toBeLessThan(s.riderCm[1])
    expect(sizeInfo("L").label).toBe("Large")
  })

  describe.each(BIKE_TYPES)("%s", (t) => {
    const c = CATEGORIES[t]
    const m0 = buildFrame(c.base).metrics!
    const at = (id: SizeId) => buildFrame(sizedFrame(t, id))

    it("the medium is the example frame", () => {
      expect(sizedFrame(t, "M")).toBe(c.base)
    })

    it("every size builds with no errors, and is still this type", () => {
      for (const s of SIZES) {
        const f = sizedFrame(t, s.id)
        const r = buildFrame(f)
        expect(f.bikeType).toBe(t)
        expect(r.issues.filter((i) => i.severity === "error"), s.id).toEqual([])
        expect(r.ok).toBe(true)
      }
    })

    it("reach, stack and seat tube grow by exactly the grading step per size", () => {
      for (const s of SIZES) {
        const m = at(s.id).metrics!
        expect(m.reach).toBeCloseTo(m0.reach + c.grade.reachStep * s.step, 6)
        expect(m.stack).toBeCloseTo(m0.stack + c.grade.stackStep * s.step, 6)
        expect(m.seatTubeLength).toBeCloseTo(m0.seatTubeLength + c.grade.seatTubeStep * s.step, 6)
      }
    })

    it("each size is bigger than the one before in reach, stack, seat tube, head tube and wheelbase", () => {
      for (let i = 1; i < SIZES.length; i++) {
        const a = at(SIZES[i - 1].id).metrics!
        const b = at(SIZES[i].id).metrics!
        for (const k of ["reach", "stack", "seatTubeLength", "headTubeLength", "wheelbase"] as const) {
          expect(b[k], `${SIZES[i].id} ${k}`).toBeGreaterThan(a[k])
        }
      }
    })

    it("angles, fork, chainstay and BB drop stay put (the grading rule's angle steps are zero)", () => {
      for (const s of SIZES) {
        const f = sizedFrame(t, s.id)
        expect(f.headTubeAngle).toBeCloseTo(c.base.headTubeAngle, 9)
        expect(f.seatTubeAngle).toBeCloseTo(c.base.seatTubeAngle, 9)
        expect(f.forkRake).toBe(c.base.forkRake)
        expect(f.forkAxleToCrown).toBe(c.base.forkAxleToCrown)
        const m = at(s.id).metrics!
        expect(m.bbDrop).toBeCloseTo(m0.bbDrop, 9)
        expect(m.chainstayLength).toBeCloseTo(m0.chainstayLength, 9)
        expect(m.trail).toBeCloseTo(m0.trail, 9)
      }
    })

    it("keeps the example's own measurements as the driven ones, and every derived number consistent", () => {
      for (const s of SIZES) {
        const f = sizedFrame(t, s.id)
        const r = buildFrame(f)
        expect(f.drivers).toEqual(c.base.drivers)
        expect(f.effectiveTopTube).toBeCloseTo(r.metrics!.effectiveTopTube, 6)
        expect(f.headTubeLength).toBeCloseTo(r.metrics!.headTubeLength, 6)
        const flipped = switchDriver(switchDriver(f, r, "horizontal", "reach"), r, "vertical", "stack")
        expect(buildFrame(flipped).metrics!.wheelbase).toBeCloseTo(r.metrics!.wheelbase, 6)
      }
    })

    it("a sized frame survives a link round trip", () => {
      for (const s of SIZES) {
        const f = sizedFrame(t, s.id)
        expect(decodeFrame(encodeFrame(f))).toEqual(f)
      }
    })
  })
})

describe("suggestSize", () => {
  it("gives nothing for impossible heights", () => {
    for (const h of [NaN, Infinity, -1, 0, 500, 999, 2301, 5000]) expect(suggestSize(h)).toBeNull()
  })

  it("picks the size whose rider range holds the height", () => {
    for (let cm = 162; cm <= 192; cm++) {
      const s = suggestSize(cm * 10 + 3)!
      const info = SIZES.find((x) => cm + 0.3 >= x.riderCm[0] && cm + 0.3 < x.riderCm[1])!
      expect(s.size, `${cm} cm`).toBe(info.id)
    }
  })

  it("says so when a rider is between two sizes, and names both", () => {
    const edge = suggestSize(1690)!
    expect(edge.between).toEqual(["S", "M"])
    expect(edge.note).toContain("Between a small and a medium")
    expect(edge.note).toContain("reach")
    expect(suggestSize(1710)!.between).toEqual(["S", "M"])
    expect(suggestSize(1775)!.between).toEqual(["M", "L"])
    expect(suggestSize(1850)!.between).toEqual(["L", "XL"])
  })

  it("uses a or an correctly", () => {
    expect(suggestSize(1850)!.note).toContain("Between a large and an extra large")
    expect(suggestSize(1900)!.note).toContain("An extra large fits")
    expect(suggestSize(1900)!.note).not.toContain("A extra")
    expect(suggestSize(1740)!.note).toMatch(/^A medium fits/)
  })

  it("is plain in the middle of a range, and warns that sizing differs between makers", () => {
    const m = suggestSize(1740)!
    expect(m.size).toBe("M")
    expect(m.between).toBeNull()
    expect(m.note).toContain("medium")
    expect(m.note.toLowerCase()).toContain("differs between makers")
  })

  it("handles riders beyond the ends", () => {
    const short = suggestSize(1500)!
    expect(short.size).toBe("S")
    expect(short.note).toContain("Shorter")
    const tall = suggestSize(1990)!
    expect(tall.size).toBe("XL")
    expect(tall.note).toContain("Taller")
  })
})
