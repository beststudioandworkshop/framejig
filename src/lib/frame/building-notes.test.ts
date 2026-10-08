import { describe, expect, it } from "vitest"

import { buildingNotes, type FrameMaterial, type FrameProcess } from "./index"

const processes: FrameProcess[] = ["tig", "braze", "lugged"]
const materials: FrameMaterial[] = ["steel", "titanium", "aluminum"]

describe("building notes", () => {
  for (const process of processes) {
    for (const material of materials) {
      const steps = buildingNotes({ process, material })
      const ids = steps.map((s) => s.id)

      it(`${material}, ${process}: unique ids, everything has text, in a sensible order`, () => {
        expect(new Set(ids).size).toBe(ids.length)
        for (const s of steps) {
          expect(s.title.length).toBeGreaterThan(3)
          expect(s.body.length).toBeGreaterThan(30)
        }
        // Numbers first, review last; jig before tacking before the final checks.
        expect(ids[0]).toBe("numbers")
        expect(ids.at(-1)).toBe("review")
        for (const [a, b] of [
          ["cut", "prep"],
          ["prep", "jig"],
          ["jig", "tack"],
          ["tack", "align"],
          ["align", "recheck"],
          ["recheck", "face"],
          ["face", "finish"],
        ]) {
          expect(ids.indexOf(a), `${a} before ${b}`).toBeGreaterThanOrEqual(0)
          expect(ids.indexOf(a)).toBeLessThan(ids.indexOf(b))
        }
      })

      it(`${material}, ${process}: has the right joining step`, () => {
        expect(ids.includes("tig")).toBe(process === "tig")
        expect(ids.includes("braze")).toBe(process !== "tig")
        expect(ids.includes("lug-fit")).toBe(process === "lugged")
        // The joining step comes after alignment.
        const join = ids.indexOf(process === "tig" ? "tig" : "braze")
        expect(join).toBeGreaterThan(ids.indexOf("align"))
        expect(join).toBeLessThan(ids.indexOf("recheck"))
      })

      it(`${material}, ${process}: material steps only for that material`, () => {
        expect(ids.includes("titanium")).toBe(material === "titanium")
        expect(ids.includes("aluminum")).toBe(material === "aluminum")
      })
    }
  }

  it("always tells the builder to have the frame checked, and never calls itself engineering", () => {
    for (const process of processes) {
      const last = buildingNotes({ process, material: "steel" }).at(-1)!
      expect(last.body.toLowerCase()).toContain("experienced")
    }
    const numbers = buildingNotes({ process: "tig", material: "steel" })[0]
    expect(numbers.body.toLowerCase()).toContain("strength")
  })

  it("the jig step points at the jig tool's settings", () => {
    const jig = buildingNotes({ process: "tig", material: "steel" }).find((s) => s.id === "jig")!
    expect(jig.body).toContain("pin")
    expect(jig.body).toContain("tape")
  })
})

describe("building notes by bike type", () => {
  const types = ["road", "gravel", "mountain", "touring", "track", "bruiser"] as const
  const core = ["mtb-fork", "mtb-dropper", "wide-tire-clearance", "touring-mounts", "touring-heel", "track-ends"]
  const ids = (bikeType: (typeof types)[number], process: FrameProcess = "tig", material: FrameMaterial = "steel") =>
    buildingNotes({ process, material, bikeType }).map((s) => s.id)

  it("each type gets only its own extra steps", () => {
    const extras: Record<(typeof types)[number], string[]> = {
      road: [],
      gravel: ["wide-tire-clearance"],
      mountain: ["mtb-fork", "mtb-dropper", "wide-tire-clearance"],
      touring: ["wide-tire-clearance", "touring-mounts", "touring-heel"],
      track: ["track-ends"],
      bruiser: ["wide-tire-clearance"],
    }
    for (const t of types) {
      for (const id of core) expect(ids(t).includes(id), `${t} ${id}`).toBe(extras[t].includes(id))
    }
    expect(buildingNotes({ process: "tig", material: "steel" }).map((s) => s.id)).toEqual(ids("road"))
  })

  it("those steps come before cutting, and everything else is unchanged", () => {
    for (const t of types) {
      const list = ids(t)
      for (const id of list.filter((i) => core.includes(i))) expect(list.indexOf(id)).toBeLessThan(list.indexOf("cut"))
      expect(list.filter((i) => !core.includes(i))).toEqual(ids("road"))
    }
  })

  it("works for every type, process and material", () => {
    for (const t of types)
      for (const p of ["tig", "braze", "lugged"] as const)
        for (const mat of ["steel", "titanium", "aluminum"] as const) {
          const list = ids(t, p, mat)
          expect(new Set(list).size).toBe(list.length)
          expect(list[0]).toBe("numbers")
          expect(list.at(-1)).toBe("review")
        }
  })

  it("says what the tool does not check", () => {
    const step = buildingNotes({ process: "tig", material: "steel", bikeType: "gravel" }).find((s) => s.id === "wide-tire-clearance")!
    expect(step.body).toContain("chainstays")
    expect(step.body.toLowerCase()).toContain("doesn't check")
    const track = buildingNotes({ process: "tig", material: "steel", bikeType: "track" }).find((s) => s.id === "track-ends")!
    expect(track.body.toLowerCase()).toContain("doesn't model")
  })
})
