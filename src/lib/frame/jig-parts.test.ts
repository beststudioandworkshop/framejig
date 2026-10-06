import { describe, expect, it } from "vitest"

import { ALLOWANCE, buildFrame, buildJig, DEFAULT_INPUTS, DEFAULT_JIG, jigEnvelope, jigParts, roundUp, type FrameInputs } from "./index"

const base = DEFAULT_INPUTS
const jigOf = (over: Partial<FrameInputs> = {}) => {
  const i = { ...base, ...over }
  return buildJig(i, buildFrame(i), DEFAULT_JIG)!
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

  it("has unique ids and unique, positive callout numbers on the drawn parts", () => {
    expect(new Set(parts.map((p) => p.id)).size).toBe(parts.length)
    const callouts = parts.map((p) => p.callout).filter((c) => c > 0)
    expect(new Set(callouts).size).toBe(callouts.length)
    expect([...callouts].sort((a, b) => a - b)).toEqual(callouts.map((_, i) => i + 1))
  })

  it("the spine covers the stations plus the allowance at both ends, in 50 mm steps", () => {
    const e = jigEnvelope([jig])!
    const spine = by("spine").cutLength!
    expect(spine).toBeGreaterThanOrEqual(e.spanX + 2 * ALLOWANCE)
    expect(spine % 50).toBe(0)
    expect(spine - (e.spanX + 2 * ALLOWANCE)).toBeLessThan(50)
  })

  it("each column reaches its station plus the allowance", () => {
    const h = (id: string) => jig.stations.find((s) => s.id === id)!.yFromSpine
    expect(by("headColumn").cutLength!).toBeGreaterThanOrEqual(h("headTop") + ALLOWANCE)
    expect(by("seatColumn").cutLength!).toBeGreaterThanOrEqual(h("seatTop") + ALLOWANCE)
    expect(by("bbRiser").cutLength!).toBeGreaterThanOrEqual(h("bb") + ALLOWANCE)
    expect(by("headColumn").cutLength!).toBeGreaterThan(by("bbRiser").cutLength!)
  })

  it("two frames: the parts are big enough for both", () => {
    const small = jigOf({ effectiveTopTube: 500, chainstayLength: 410, seatTubeLength: 480 })
    const big = jigOf({ effectiveTopTube: 600, chainstayLength: 440, seatTubeLength: 600 })
    const both = jigParts([small, big])
    for (const j of [small, big]) {
      const alone = jigParts([j])
      for (const id of ["spine", "headColumn", "seatColumn", "bbRiser"]) {
        expect(both.find((p) => p.id === id)!.cutLength!).toBeGreaterThanOrEqual(alone.find((p) => p.id === id)!.cutLength!)
      }
    }
  })

  it("a lower spine means longer columns", () => {
    const f = (o: number) => {
      const r = buildFrame(base)
      return jigParts([buildJig(base, r, { spineOffset: o })]).find((p) => p.id === "headColumn")!.cutLength!
    }
    expect(f(200)).toBeGreaterThan(f(50))
  })
})

describe("parts export", () => {
  const parts = jigParts([jigOf()])
  it("CSV has a header and a line per part, with the part number column empty", async () => {
    const { jigPartsCsv } = await import("./index")
    const lines = jigPartsCsv(parts, "mm").trim().split("\n")
    expect(lines).toHaveLength(parts.length + 1)
    expect(lines[0]).toContain("Search McMaster-Carr for")
    expect(lines[0].endsWith("Part number")).toBe(true)
    for (const l of lines.slice(1)) expect(l.endsWith(",")).toBe(true) // empty last column
  })
  it("text has the same number of columns on every line", async () => {
    const { jigPartsText } = await import("./index")
    for (const l of jigPartsText(parts, "in").split("\n")) expect(l.split("\t")).toHaveLength(7)
  })
})
