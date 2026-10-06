import { describe, expect, it } from "vitest"

import { along, buildFrame, DEFAULT_INPUTS, rideFeel, RIDE_DISCLAIMER, type FrameInputs, type RideTraitId } from "./index"

const base = DEFAULT_INPUTS
function feel(over: Partial<FrameInputs> = {}, inseam?: number | null) {
  const inputs = { ...base, ...over }
  const r = buildFrame(inputs)
  return { inputs, m: r.metrics!, f: rideFeel(inputs, r.metrics!, { inseam }) }
}
const pos = (f: ReturnType<typeof feel>["f"], id: RideTraitId) => f.traits.find((t) => t.id === id)!.position
const label = (f: ReturnType<typeof feel>["f"], id: RideTraitId) => f.traits.find((t) => t.id === id)!.label

describe("along", () => {
  it("is 0 at the low end, 1 at the high end, clamped outside, and linear between", () => {
    expect(along(35, 35, 85)).toBe(0)
    expect(along(85, 35, 85)).toBe(1)
    expect(along(60, 35, 85)).toBe(0.5)
    expect(along(-100, 35, 85)).toBe(0)
    expect(along(500, 35, 85)).toBe(1)
  })
})

describe("ride feel", () => {
  it("always gives the five traits in order, each with words and the numbers behind it", () => {
    const { f } = feel()
    expect(f.traits.map((t) => t.id)).toEqual(["steering", "handling", "position", "weight", "bottomBracket"])
    expect(new Set(f.traits.map((t) => t.id)).size).toBe(5)
    for (const t of f.traits) {
      expect(t.position).toBeGreaterThanOrEqual(0)
      expect(t.position).toBeLessThanOrEqual(1)
      expect(t.title.length).toBeGreaterThan(3)
      expect(t.low.length).toBeGreaterThan(2)
      expect(t.high.length).toBeGreaterThan(2)
      expect(t.label.length).toBeGreaterThan(2)
      expect(t.text.length).toBeGreaterThan(30)
      expect(t.basis).toMatch(/\d/)
    }
    expect(f.summary.length).toBeGreaterThan(20)
    expect(f.summary.endsWith(".")).toBe(true)
  })

  it("has no NaN or undefined anywhere, across a spread of frames", () => {
    for (const headTubeAngle of [68, 72.5, 76])
      for (const forkRake of [35, 45, 60])
        for (const effectiveTopTube of [500, 560, 620]) {
          const { f } = feel({ headTubeAngle, forkRake, effectiveTopTube })
          const text = JSON.stringify(f)
          expect(text).not.toMatch(/NaN|undefined|null/)
        }
  })

  it("more trail is steadier steering; less is quicker", () => {
    const quick = feel({ headTubeAngle: 75, forkRake: 55 })
    const slow = feel({ headTubeAngle: 70, forkRake: 35 })
    expect(quick.m.trail).toBeLessThan(slow.m.trail)
    expect(pos(quick.f, "steering")).toBeLessThan(pos(slow.f, "steering"))
  })

  it("names the steering band from the trail", () => {
    const lo = feel({ headTubeAngle: 76, forkRake: 55 })
    expect(lo.m.trail).toBeLessThan(45)
    expect(label(lo.f, "steering")).toBe("Very quick")
    const mid = feel()
    expect(mid.m.trail).toBeGreaterThan(55)
    expect(mid.m.trail).toBeLessThan(65)
    expect(label(mid.f, "steering")).toBe("Neutral")
    const hi = feel({ headTubeAngle: 69, forkRake: 35 })
    expect(hi.m.trail).toBeGreaterThan(75)
    expect(label(hi.f, "steering")).toBe("Very stable")
  })

  it("a longer wheelbase feels more planted", () => {
    expect(pos(feel({ effectiveTopTube: 620 }).f, "handling")).toBeGreaterThan(pos(feel({ effectiveTopTube: 500 }).f, "handling"))
  })

  it("chainstay length adds a comment at the extremes only", () => {
    const text = (cs: number) => feel({ chainstayLength: cs }).f.traits.find((t) => t.id === "handling")!.text
    expect(text(405)).toContain("Short chainstays")
    expect(text(460)).toContain("Long chainstays")
    expect(text(430)).not.toContain("chainstays")
  })

  it("a taller stack is more upright, a longer reach more stretched", () => {
    const stack = (s: number) => feel({ drivers: { ...base.drivers, vertical: "stack" }, stack: s })
    expect(pos(stack(620).f, "position")).toBeGreaterThan(pos(stack(520).f, "position"))
    const reach = (r: number) => feel({ drivers: { ...base.drivers, horizontal: "reach" }, reach: r })
    expect(pos(reach(420).f, "position")).toBeLessThan(pos(reach(360).f, "position"))
  })

  it("a steeper seat tube sits the rider further forward", () => {
    expect(pos(feel({ seatTubeAngle: 76 }).f, "weight")).toBeGreaterThan(pos(feel({ seatTubeAngle: 71 }).f, "weight"))
    expect(label(feel({ seatTubeAngle: 70.5 }).f, "weight")).toBe("Set back")
    expect(label(feel({ seatTubeAngle: 73.5 }).f, "weight")).toBe("Middle")
    expect(label(feel({ seatTubeAngle: 76 }).f, "weight")).toBe("Set forward")
  })

  it("more BB drop is lower and more planted", () => {
    expect(pos(feel({ bbDrop: 85 }).f, "bottomBracket")).toBeGreaterThan(pos(feel({ bbDrop: 58 }).f, "bottomBracket"))
    expect(label(feel({ bbDrop: 58 }).f, "bottomBracket")).toBe("High")
    expect(label(feel({ bbDrop: 70 }).f, "bottomBracket")).toBe("Typical")
    expect(label(feel({ bbDrop: 88 }).f, "bottomBracket")).toBe("Very low")
  })

  it("the summary follows the character of the bike", () => {
    const quick = feel({ headTubeAngle: 75, forkRake: 55, effectiveTopTube: 500, chainstayLength: 405 })
    expect(quick.f.summary).toContain("quick")
    const calm = feel({ headTubeAngle: 70, forkRake: 38, effectiveTopTube: 620, chainstayLength: 450 })
    expect(calm.f.summary).toContain("calm")
    expect(feel().f.summary).toContain("balanced")
  })

  it("the summary's position wording matches the position band", () => {
    const stack = (s: number) => feel({ drivers: { ...base.drivers, vertical: "stack" }, stack: s })
    const cases: [number, string, string][] = [
      [480, "Stretched out", "stretched-out"],
      [545, "Sporty", "sporty"],
      [585, "Balanced", "middle-of-the-road"],
      [620, "Upright", "relaxed"],
    ]
    for (const [s, band, words] of cases) {
      const { f } = stack(s)
      if (label(f, "position") === band) expect(f.summary).toContain(words)
    }
    expect(feel().f.summary).toContain(label(feel().f, "position") === "Sporty" ? "sporty" : "")
  })
})

describe("notes", () => {
  it("mentions toe overlap only when there is some, with how much", () => {
    const over = feel({ crankLength: 200, toeProjection: 160 })
    expect(over.m.toeClearance).toBeLessThan(0)
    expect(over.f.notes.some((n) => n.includes("Toe overlap") && n.includes(String(Math.round(-over.m.toeClearance))))).toBe(true)
    const none = feel({ crankLength: 150, toeProjection: 40 })
    expect(none.f.notes.some((n) => n.toLowerCase().includes("toe"))).toBe(false)
    const close = feel({ crankLength: 172.5, toeProjection: 100 })
    if (close.m.toeClearance >= 0 && close.m.toeClearance < 10) expect(close.f.notes[0]).toContain("close")
  })

  it("standover needs an inseam and says how much room there is", () => {
    const { m } = feel()
    expect(feel({}, null).f.notes.filter((n) => n.startsWith("Standover"))).toEqual([])
    expect(feel({}, undefined).f.notes.filter((n) => n.startsWith("Standover"))).toEqual([])
    expect(feel({}, 0).f.notes.filter((n) => n.startsWith("Standover"))).toEqual([])
    expect(feel({}, NaN).f.notes.filter((n) => n.startsWith("Standover"))).toEqual([])
    const note = (inseam: number) => feel({}, inseam).f.notes.find((n) => n.startsWith("Standover"))!
    expect(note(m.standover - 30)).toContain("couldn't straddle")
    expect(note(m.standover + 10)).toContain("tight")
    expect(note(m.standover + 40)).toContain("Usually fine")
    expect(note(m.standover + 90)).toContain("Plenty")
  })
})

describe("disclaimer", () => {
  it("says these are rules of thumb", () => {
    expect(RIDE_DISCLAIMER.toLowerCase()).toContain("rules of thumb")
  })
})
