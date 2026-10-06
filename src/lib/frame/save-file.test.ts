import { describe, expect, it } from "vitest"

import {
  buildFrame,
  cleanName,
  DEFAULT_INPUTS,
  DEFAULT_NAME,
  frameFileName,
  MAX_NAME,
  MAX_SAVED,
  parseFrameFile,
  parseSavedList,
  removeSaved,
  sanitizeFrame,
  savedId,
  serializeFrameFile,
  serializeSavedList,
  slugify,
  upsertSaved,
  type FrameInputs,
} from "./index"

const base = DEFAULT_INPUTS
const other: FrameInputs = {
  ...base,
  headTubeAngle: 68.5,
  material: "titanium",
  process: "braze",
  drivers: { bb: "height", rear: "rearCenter", seat: "cc", horizontal: "reach", vertical: "stack" },
  tubes: { ...base.tubes, topTube: { diameter: 34.9, wall: 1.2 } },
}
const when = new Date("2026-10-10T12:00:00Z")

describe("names", () => {
  it("cleans up: trims, one line, never empty, not too long", () => {
    expect(cleanName("  My   road\nframe ")).toBe("My road frame")
    expect(cleanName("")).toBe(DEFAULT_NAME)
    expect(cleanName("   ")).toBe(DEFAULT_NAME)
    expect(cleanName("x".repeat(500)).length).toBe(MAX_NAME)
  })
  it("slugs are safe file names", () => {
    expect(slugify("My Road Frame!")).toBe("my-road-frame")
    expect(slugify("../../etc/passwd")).toBe("etc-passwd")
    expect(slugify("***")).toBe("frame")
    expect(slugify("")).toBe("untitled-frame")
    expect(frameFileName("Gravel v2")).toBe("gravel-v2.framejig.json")
    expect(frameFileName("a/b\\c:d")).toMatch(/^[a-z0-9-]+\.framejig\.json$/)
  })
})

describe("sanitizeFrame", () => {
  it("gives a complete valid frame from anything", () => {
    for (const junk of [null, undefined, 5, "x", [], {}, { headTubeAngle: "steep" }]) {
      const f = sanitizeFrame(junk)
      expect(buildFrame(f).ok, JSON.stringify(junk)).toBe(true)
    }
    expect(sanitizeFrame(null)).toEqual(base)
  })
  it("keeps what is valid and drops what isn't", () => {
    const f = sanitizeFrame({ headTubeAngle: 70, material: "wood", unknown: 1, tubes: { topTube: { diameter: 40 } } })
    expect(f.headTubeAngle).toBe(70)
    expect(f.material).toBe(base.material)
    expect(f).not.toHaveProperty("unknown")
    expect(f.tubes.topTube).toEqual({ diameter: 40, wall: base.tubes.topTube.wall })
  })
})

describe("frame file", () => {
  it("round trips a frame, with and without a reference", () => {
    const text = serializeFrameFile("Road v2", other, base, when)
    const f = parseFrameFile(text)!
    expect(f.name).toBe("Road v2")
    expect(f.savedAt).toBe("2026-10-10T12:00:00.000Z")
    expect(f.frame).toEqual(other)
    expect(f.reference).toEqual(base)
    expect(parseFrameFile(serializeFrameFile("x", base, null, when))!.reference).toBeNull()
  })
  it("is readable, tagged JSON", () => {
    const text = serializeFrameFile("Road", base, null, when)
    expect(text.endsWith("\n")).toBe(true)
    const j = JSON.parse(text)
    expect(j.format).toBe("framejig-frame")
    expect(j.version).toBe(1)
    expect(text).toContain('\n  "frame"')
  })
  it("builds the same frame after a round trip", () => {
    expect(buildFrame(parseFrameFile(serializeFrameFile("a", other, null, when))!.frame)).toEqual(buildFrame(other))
  })
  it("gives null for anything that isn't one of ours, and never throws", () => {
    for (const s of ["", "nope", "[]", "{}", "null", '{"format":"other","version":1,"frame":{}}', '{"format":"framejig-frame","version":2,"frame":{}}', '{"format":"framejig-frame","version":1}', '{"format":"framejig-frame","version":1,"frame":5}', "{".repeat(1000)]) {
      expect(() => parseFrameFile(s)).not.toThrow()
      expect(parseFrameFile(s), s.slice(0, 30)).toBeNull()
    }
  })
  it("repairs a file that is missing fields or has bad ones", () => {
    const f = parseFrameFile('{"format":"framejig-frame","version":1,"name":42,"savedAt":"yesterday","frame":{"headTubeAngle":71},"reference":3}')!
    expect(f.name).toBe(DEFAULT_NAME)
    expect(f.savedAt).toBe(new Date(0).toISOString())
    expect(f.frame).toEqual({ ...base, headTubeAngle: 71 })
    expect(f.reference).toBeNull()
  })
})

describe("saved list", () => {
  it("round trips", () => {
    let list = upsertSaved([], "Road", base, null, when)
    list = upsertSaved(list, "Gravel", other, base, new Date(when.getTime() + 1000))
    const back = parseSavedList(serializeSavedList(list))
    expect(back).toEqual(list)
    expect(back.map((s) => s.name)).toEqual(["Gravel", "Road"])
  })
  it("saving under the same name replaces it and moves it to the top", () => {
    let list = upsertSaved([], "Road", base, null, when)
    list = upsertSaved(list, "Gravel", other, null, when)
    list = upsertSaved(list, " road ", other, null, new Date(when.getTime() + 5000))
    expect(list.map((s) => s.name)).toEqual(["road", "Gravel"])
    expect(list[0].frame).toEqual(other)
    expect(savedId(" ROAD ")).toBe("road")
  })
  it("keeps at most MAX_SAVED, dropping the oldest", () => {
    let list: ReturnType<typeof upsertSaved> = []
    for (let i = 0; i < MAX_SAVED + 5; i++) list = upsertSaved(list, `frame ${i}`, base, null, new Date(when.getTime() + i))
    expect(list).toHaveLength(MAX_SAVED)
    expect(list[0].name).toBe(`frame ${MAX_SAVED + 4}`)
    expect(list.some((s) => s.name === "frame 0")).toBe(false)
  })
  it("removes by id", () => {
    const list = upsertSaved(upsertSaved([], "A", base, null, when), "B", base, null, when)
    expect(removeSaved(list, "a").map((s) => s.name)).toEqual(["B"])
    expect(removeSaved(list, "nope")).toEqual(list)
  })
  it("junk gives an empty list; bad entries are dropped and the rest kept", () => {
    for (const s of [null, undefined, "", "nope", "[]", "{}", '{"format":"framejig-frame-list","version":9,"items":[]}', '{"format":"framejig-frame-list","version":1,"items":5}']) {
      expect(parseSavedList(s as string)).toEqual([])
    }
    const mixed = JSON.stringify({
      format: "framejig-frame-list",
      version: 1,
      items: [{ name: "ok", frame: { headTubeAngle: 70 } }, { name: 5, frame: {} }, "x", { name: "no frame" }, { name: "OK", frame: {} }],
    })
    const list = parseSavedList(mixed)
    expect(list.map((s) => s.name)).toEqual(["ok"])
    expect(list[0].frame.headTubeAngle).toBe(70)
  })
})
