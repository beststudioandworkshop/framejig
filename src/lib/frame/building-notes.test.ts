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
    expect(jig.body).toContain("tilt")
    expect(jig.body).toContain("tape")
  })
})

describe("building notes by bike type", () => {
  const ids = (bikeType: "road" | "mountain", process: FrameProcess = "tig", material: FrameMaterial = "steel") =>
    buildingNotes({ process, material, bikeType }).map((s) => s.id)

  it("mountain frames get the fork, dropper and clearance steps; road frames don't", () => {
    for (const id of ["mtb-fork", "mtb-dropper", "mtb-clearance"]) {
      expect(ids("mountain")).toContain(id)
      expect(ids("road")).not.toContain(id)
    }
    expect(buildingNotes({ process: "tig", material: "steel" }).map((s) => s.id)).not.toContain("mtb-fork")
  })

  it("those steps come before cutting, and everything else is unchanged", () => {
    const m = ids("mountain")
    for (const id of ["mtb-fork", "mtb-dropper", "mtb-clearance"]) expect(m.indexOf(id)).toBeLessThan(m.indexOf("cut"))
    expect(m.filter((i) => !i.startsWith("mtb-"))).toEqual(ids("road"))
  })

  it("works for every process and material", () => {
    for (const p of ["tig", "braze", "lugged"] as const)
      for (const mat of ["steel", "titanium", "aluminum"] as const) {
        const list = ids("mountain", p, mat)
        expect(new Set(list).size).toBe(list.length)
        expect(list.at(-1)).toBe("review")
      }
  })

  it("says what the tool does not check", () => {
    const step = buildingNotes({ process: "tig", material: "steel", bikeType: "mountain" }).find((s) => s.id === "mtb-clearance")!
    expect(step.body).toContain("chainstays")
    expect(step.body.toLowerCase()).toContain("doesn't check")
  })
})
