import { describe, expect, it } from "vitest"

import { frameTools, TOOL_CATEGORIES, type FrameMaterial, type FrameProcess } from "./index"

const processes: FrameProcess[] = ["tig", "braze", "lugged"]
const materials: FrameMaterial[] = ["steel", "titanium", "aluminium"]

describe("frame tools", () => {
  for (const process of processes) {
    for (const material of materials) {
      it(`${material}, ${process}: unique ids, known categories, something in every category`, () => {
        const items = frameTools({ process, material })
        expect(new Set(items.map((i) => i.id)).size).toBe(items.length)
        for (const i of items) {
          expect(TOOL_CATEGORIES).toContain(i.category)
          expect(i.name.length).toBeGreaterThan(2)
          expect(i.why.length).toBeGreaterThan(5)
        }
        for (const c of TOOL_CATEGORIES) expect(items.some((i) => i.category === c), c).toBe(true)
      })
    }
  }

  it("TIG gets a welder and a welding helmet, brazing gets a torch and flux", () => {
    const names = (p: FrameProcess) => frameTools({ process: p, material: "steel" }).map((i) => i.id)
    expect(names("tig")).toEqual(expect.arrayContaining(["tig", "helmet"]))
    expect(names("tig")).not.toContain("torch")
    expect(names("braze")).toEqual(expect.arrayContaining(["torch", "fluxbrush"]))
    expect(names("lugged")).toEqual(expect.arrayContaining(["lugs", "torch", "heatshield"]))
  })

  it("titanium needs an argon purge; aluminium a dedicated brush; steel neither", () => {
    const ids = (m: FrameMaterial) => frameTools({ process: "tig", material: m }).map((i) => i.id)
    expect(ids("titanium")).toContain("purge")
    expect(ids("aluminium")).toContain("brush")
    expect(ids("steel")).not.toContain("purge")
    expect(ids("steel")).not.toContain("brush")
  })

  it("always includes safety basics, and the essentials come with a reason", () => {
    for (const process of processes) {
      const items = frameTools({ process, material: "steel" })
      expect(items.filter((i) => i.category === "Safety").length).toBeGreaterThanOrEqual(3)
      expect(items.some((i) => i.id === "vent")).toBe(true)
    }
  })
})
