import { describe, expect, it } from "vitest"

import {
  buildFrame,
  buildJig,
  DEFAULT_INPUTS,
  DEFAULT_JIG,
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

  it("has the tilted-spine layout: spine, post, pivot, base, standoff and two carriers", () => {
    for (const id of ["spine", "post", "pivot", "base", "rearStandoff", "seatCarrier", "headCarrier"]) {
      expect(by(id), id).toBeDefined()
    }
    expect(parts.some((p) => p.id === "bbRiser" || p.id === "frontAxlePost")).toBe(false)
  })

  it("the spine is as long as the jig says, and the carriers as long as theirs", () => {
    expect(by("spine").cutLength).toBe(jig.spine.length)
    expect(by("seatCarrier").cutLength).toBe(jig.carriers.find((c) => c.id === "seat")!.length)
    expect(by("headCarrier").cutLength).toBe(jig.carriers.find((c) => c.id === "head")!.length)
  })

  it("the post is the pivot height from the settings", () => {
    expect(by("post").cutLength).toBe(DEFAULT_JIG.postHeight)
    const tall = jigParts([jigOf({}, { postHeight: 950 })]).find((p) => p.id === "post")!
    expect(tall.cutLength).toBe(950)
  })

  it("the rear standoff reaches the near dropout face, rounded up to 10 mm", () => {
    const standoff = jig.stations.find((s) => s.id === "rearAxle")!.standoff
    expect(by("rearStandoff").cutLength).toBe(roundUp(standoff, 10))
    expect(jigParts([jigOf({}, { centerOffset: 200 })]).find((p) => p.id === "rearStandoff")!.cutLength).toBeGreaterThan(
      by("rearStandoff").cutLength!,
    )
  })

  it("mentions the tilt angle in the spine note", () => {
    expect(by("spine").note).toContain(`${Number(jig.tilt.degrees.toFixed(1))}°`)
  })

  it("two frames: the parts are big enough for both", () => {
    const small = jigOf({ effectiveTopTube: 500, chainstayLength: 410, seatTubeLength: 480 })
    const big = jigOf({ effectiveTopTube: 600, chainstayLength: 440, seatTubeLength: 600 })
    const both = jigParts([small, big])
    for (const j of [small, big]) {
      const alone = jigParts([j])
      for (const id of ["spine", "seatCarrier", "headCarrier"]) {
        expect(both.find((p) => p.id === id)!.cutLength!).toBeGreaterThanOrEqual(alone.find((p) => p.id === id)!.cutLength!)
      }
    }
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
