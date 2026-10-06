import { describe, expect, it } from "vitest"

import { buildFrame, DEFAULT_INPUTS, decodeFrame, encodeFrame, type FrameInputs } from "./index"

const base = DEFAULT_INPUTS
const encodeRaw = (v: unknown) => btoa(JSON.stringify(v)).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "")

describe("share links", () => {
  it("round trips the defaults", () => {
    expect(decodeFrame(encodeFrame(base))).toEqual(base)
  })

  it("round trips a very different frame", () => {
    const other: FrameInputs = {
      ...base,
      headTubeAngle: 68.25,
      seatTubeAngle: 71,
      seatTubeLength: 612.5,
      forkRake: 52,
      material: "titanium",
      process: "braze",
      drivers: { bb: "height", rear: "rearCentre", seat: "cc", horizontal: "reach", vertical: "stack" },
      wheel: { rimDiameter: 584, tyreSection: 52 },
      tubes: { ...base.tubes, topTube: { diameter: 34.9, wall: 1.2 } },
      rearSpacing: 142,
      bbShellWidth: 73,
    }
    expect(decodeFrame(encodeFrame(other))).toEqual(other)
    // And it still builds the same frame.
    expect(buildFrame(decodeFrame(encodeFrame(other))!)).toEqual(buildFrame(other))
  })

  it("is URL safe and small when little has changed", () => {
    const s = encodeFrame({ ...base, headTubeAngle: 73 })
    expect(s).toMatch(/^[A-Za-z0-9_-]+$/)
    expect(s.length).toBeLessThan(80)
    expect(encodeFrame(base).length).toBeLessThan(encodeFrame({ ...base, headTubeAngle: 73 }).length)
  })

  it("only stores what differs from the defaults", () => {
    const b64 = encodeFrame({ ...base, headTubeAngle: 73 }).replace(/-/g, "+").replace(/_/g, "/")
    const json = atob(b64 + "=".repeat((4 - (b64.length % 4)) % 4))
    expect(JSON.parse(json)).toEqual({ v: 1, c: { headTubeAngle: 73 } })
  })

  it("gives null for junk, never throws", () => {
    for (const s of [null, undefined, "", "!!!", "abc", "e30", encodeRaw("hello"), encodeRaw([1, 2]), encodeRaw({ v: 2, c: {} }), encodeRaw({ v: 1 }), encodeRaw({ v: 1, c: 5 }), "%%%%", "a".repeat(5000)]) {
      expect(() => decodeFrame(s as string)).not.toThrow()
      expect(decodeFrame(s as string), String(s).slice(0, 20)).toBeNull()
    }
  })

  it("falls back to the default for any field that is missing or wrong", () => {
    const f = decodeFrame(
      encodeRaw({
        v: 1,
        c: {
          headTubeAngle: "steep",
          seatTubeAngle: NaN,
          forkRake: null,
          material: "wood",
          process: 5,
          wheel: { rimDiameter: "big", tyreSection: 30 },
          drivers: { bb: "nonsense", horizontal: "reach" },
          tubes: { topTube: { diameter: 40, wall: "thick" }, downTube: 7 },
          unknownField: 1,
        },
      }),
    )!
    expect(f.headTubeAngle).toBe(base.headTubeAngle)
    expect(f.seatTubeAngle).toBe(base.seatTubeAngle)
    expect(f.forkRake).toBe(base.forkRake)
    expect(f.material).toBe(base.material)
    expect(f.process).toBe(base.process)
    expect(f.wheel).toEqual({ rimDiameter: base.wheel.rimDiameter, tyreSection: 30 })
    expect(f.drivers).toEqual({ ...base.drivers, horizontal: "reach" })
    expect(f.tubes.topTube).toEqual({ diameter: 40, wall: base.tubes.topTube.wall })
    expect(f.tubes.downTube).toEqual(base.tubes.downTube)
    expect(f).not.toHaveProperty("unknownField")
  })

  it("always returns a complete set of inputs", () => {
    const f = decodeFrame(encodeRaw({ v: 1, c: {} }))!
    expect(f).toEqual(base)
  })

  it("does not change the defaults", () => {
    const copy = structuredClone(base)
    decodeFrame(encodeFrame({ ...base, bbDrop: 55, tubes: { ...base.tubes, seatTube: { diameter: 28, wall: 1 } } }))
    expect(base).toEqual(copy)
  })
})
