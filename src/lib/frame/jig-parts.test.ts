import { describe, expect, it } from "vitest"

import {
  buildFrame,
  buildJig,
  DEFAULT_INPUTS,
  DEFAULT_JIG,
  JIG_STOCK,
  jigParts,
  jigPartsCsv,
  jigPartsText,
  roundUp,
  type FrameInputs,
  type JigSettings,
} from "./index"

const base = DEFAULT_INPUTS
const jigOf = (over: Partial<FrameInputs> = {}, settings: Partial<JigSettings> = {}) => {
  const i = { ...base, ...over }
  return buildJig(i, buildFrame(i), { ...DEFAULT_JIG, ...settings })!
}

describe("roundUp", () => {
  it("rounds up to the step and leaves exact multiples alone", () => {
    expect(roundUp(1101, 50)).toBe(1150)
    expect(roundUp(1100, 50)).toBe(1100)
    expect(roundUp(0.5, 50)).toBe(50)
  })
})

describe("jig parts", () => {
  const jig = jigOf()
  const parts = jigParts([jig])
  const by = (id: string) => parts.find((p) => p.id === id)!

  it("is empty with no frames", () => {
    expect(jigParts([])).toEqual([])
    expect(jigParts([null])).toEqual([])
  })

  it("never has a part number: those are never guessed", () => {
    for (const p of parts) expect(p.partNumber).toBeNull()
  })

  it("every part says what to search for and what to buy", () => {
    for (const p of parts) {
      expect(p.search.length).toBeGreaterThan(3)
      expect(p.spec.length).toBeGreaterThan(5)
      expect(p.qty).toBeGreaterThan(0)
    }
  })

  it("has unique ids and sequential callout numbers on the drawn parts", () => {
    expect(new Set(parts.map((p) => p.id)).size).toBe(parts.length)
    const callouts = parts.map((p) => p.callout).filter((c) => c > 0)
    expect(callouts).toEqual(callouts.map((_, i) => i + 1))
  })

  it("has your cut list: the spine, three 120 x 40 posts and plates, and two 80 x 40 carriers, at your lengths", () => {
    expect(by("spine").cutLength).toBe(1200)
    expect(by("headPost").cutLength).toBe(300)
    expect(by("rearHub").cutLength).toBe(300)
    expect(by("bbPost").cutLength).toBe(220)
    expect(by("headCarrier").cutLength).toBe(300)
    expect(by("seatCarrier").cutLength).toBe(600)
    expect(JIG_STOCK).toEqual({ spine: 1200, headPost: 300, rearHub: 300, bbPost: 220, headCarrier: 300, seatCarrier: 600 })
    for (const id of ["spine", "headPost", "rearHub", "bbPost"]) expect(by(id).profile).toEqual({ thickness: 40, width: 120 })
    for (const id of ["headCarrier", "seatCarrier"]) expect(by(id).profile).toEqual({ thickness: 40, width: 80 })
  })

  it("has the hardware you asked for: three face plates, eight large and at least eight small 90 degree brackets, and bolts", () => {
    expect(by("facePlates").qty).toBe(3)
    expect(by("largeBrackets").qty).toBe(8)
    expect(by("smallBrackets").qty).toBeGreaterThanOrEqual(8)
    expect(by("smallBrackets").spec.toLowerCase()).toContain("at least 8")
    expect(by("framingFasteners").name.toLowerCase()).toContain("bolts")
    expect(parts.some((p) => p.id === "rearStandoff" || p.id === "pivot" || p.id === "post")).toBe(false)
  })

  it("keeps the pins, mandrels, dummy axle and collars", () => {
    for (const id of ["pivotPins", "mandrels", "dummyAxle", "shaftCollars"]) expect(by(id), id).toBeDefined()
  })

  it("says in the spine note how high the bottom edge sits above the axle line", () => {
    expect(by("spine").note).toContain("120 mm above")
    expect(jigParts([jigOf({}, { spineClearance: 150 })]).find((p) => p.id === "spine")!.note).toContain("150 mm above")
  })

  it("every cut part has a profile and a fit, and its marks sit within its length", () => {
    const cut = parts.filter((p) => p.cutLength !== undefined)
    expect(cut.length).toBe(6)
    for (const p of cut) {
      expect(p.profile, p.id).toBeDefined()
      if (p.id !== "rearHub") expect(p.fit, p.id).toBeDefined()
      for (const m of p.marks ?? []) {
        expect(m.at, `${p.id} ${m.label}`).toBeGreaterThanOrEqual(0)
        // A mark past the end is a part that is too short for the frame, and the fit says so.
        if (p.fit?.ok !== false) expect(m.at, `${p.id} ${m.label}`).toBeLessThanOrEqual(p.cutLength!)
      }
    }
  })

  it("a carrier's pin sits 100 mm from its lower end and the tube top a tube length further on", () => {
    const seat = by("seatCarrier").marks!
    expect(seat.find((m) => m.kind === "pin")!.at).toBe(100)
    expect(seat.find((m) => m.kind === "stop")!.at).toBeCloseTo(100 + jig.carriers.find((c) => c.id === "seat")!.stops[1].along, 9)
  })

  it("a post's pin sits its clearance from the end that touches the spine (the posts butt against it)", () => {
    const bb = by("bbPost").marks!
    expect(bb.find((m) => m.kind === "pin")!.at).toBeCloseTo(jig.carriers.find((c) => c.id === "seat")!.pinClearance, 9)
  })

  describe("does it hold the frame?", () => {
    it("the default road frame: the spine and head parts fit, the seat carrier and BB post are too short", () => {
      expect(by("spine").fit!.ok).toBe(true)
      expect(by("headPost").fit!.ok).toBe(true)
      expect(by("headCarrier").fit!.ok).toBe(true)
      // The default frame's seat tube is 540 and its BB pin sits 190 mm from the spine.
      expect(by("seatCarrier").fit!.ok).toBe(false)
      expect(by("bbPost").fit!.ok).toBe(false)
      expect(by("seatCarrier").fit!.note).toContain("450")
    })

    it("a frame with a 440 mm seat tube and a BB pin 156 mm from the spine fits the same parts", () => {
      const j = jigOf({ seatTubeLength: 440, bbDrop: 36 })
      const p = jigParts([j])
      expect(p.find((x) => x.id === "seatCarrier")!.fit!.ok).toBe(true)
      expect(p.find((x) => x.id === "bbPost")!.fit!.ok).toBe(true)
    })

    it("with two frames loaded, a part must hold both", () => {
      const fine = jigOf({ seatTubeLength: 440, bbDrop: 36 })
      const both = jigParts([fine, jig])
      expect(both.find((x) => x.id === "seatCarrier")!.fit!.ok).toBe(false)
      expect(jigParts([fine]).find((x) => x.id === "seatCarrier")!.fit!.ok).toBe(true)
    })

    it("a spine that is too short for the stations says so", () => {
      const wide = jigOf({ effectiveTopTube: 900, chainstayLength: 700 })
      expect(jigParts([wide]).find((x) => x.id === "spine")!.fit!.ok).toBe(false)
    })
  })
})

describe("parts export", () => {
  const parts = jigParts([jigOf()])
  it("CSV has a header and a line per part, with the part number column empty", () => {
    const lines = jigPartsCsv(parts, "mm").trim().split("\n")
    expect(lines).toHaveLength(parts.length + 1)
    expect(lines[0]).toContain("Search McMaster-Carr for")
    expect(lines[0].endsWith("Part number")).toBe(true)
    for (const l of lines.slice(1)) expect(l.endsWith(",")).toBe(true)
  })
  it("text has the same number of columns on every line", () => {
    for (const l of jigPartsText(parts, "in").split("\n")) expect(l.split("\t")).toHaveLength(7)
  })
})
