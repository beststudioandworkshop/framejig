import { describe, expect, it } from "vitest"

import { buildFrame, buildJig, DEFAULT_INPUTS, DEFAULT_JIG, dimGeometry, planDims, sideDims, SPINE_HEIGHT } from "./index"

const jig = () => {
  const i = DEFAULT_INPUTS
  return buildJig(i, buildFrame(i), DEFAULT_JIG)!
}
const by = (list: ReturnType<typeof sideDims>, id: string) => list.find((d) => d.id === id)!

describe("side dimensions", () => {
  const j = jig()
  const dims = sideDims(j)

  it("every dimension is a number you can find in a table", () => {
    const seat = j.carriers.find((c) => c.id === "seat")!
    const head = j.carriers.find((c) => c.id === "head")!
    expect(by(dims, "clearance").value).toBe(j.spine.bottom)
    expect(by(dims, "spineHeight").value).toBe(SPINE_HEIGHT)
    expect(by(dims, "seatPinAlong").value).toBe(seat.pivotU)
    expect(by(dims, "headPinAlong").value).toBe(head.pivotU)
    expect(by(dims, "seatPinBeyond").value).toBe(seat.pinClearance)
    expect(by(dims, "headPinBeyond").value).toBe(head.pinClearance)
    expect(by(dims, "seatPost").value).toBe(seat.postLength)
    expect(by(dims, "headPost").value).toBe(head.postLength)
    expect(by(dims, "seatStop").value).toBe(seat.stops[1].along)
    expect(by(dims, "headStop").value).toBe(head.stops[1].along)
    expect(by(dims, "seatCarrier").value).toBe(seat.length)
    expect(by(dims, "headCarrier").value).toBe(head.length)
  })

  it("each dimension's start and stop are as far apart as it reads, along its own direction", () => {
    for (const d of dims) {
      const len = d.kind === "x" ? Math.abs(d.to.x - d.from.x) : d.kind === "y" ? Math.abs(d.to.y - d.from.y) : Math.hypot(d.to.x - d.from.x, d.to.y - d.from.y)
      const g = dimGeometry(d)
      const drawn = Math.hypot(g.b.x - g.a.x, g.b.y - g.a.y)
      expect(drawn, d.id).toBeCloseTo(len, 9)
      if (d.id.endsWith("Carrier") || d.id.endsWith("Post")) expect(len, d.id).toBeCloseTo(d.value, 9)
    }
  })

  it("marks a handful as key, and the key ones are among the all", () => {
    const keys = dims.filter((d) => d.key).map((d) => d.id)
    expect(keys).toEqual(["clearance", "seatPinAlong", "headPinAlong", "seatPinBeyond", "headPinBeyond"])
    expect(keys.length).toBeLessThan(dims.length)
  })

  it("has unique ids", () => {
    expect(new Set(dims.map((d) => d.id)).size).toBe(dims.length)
  })
})

describe("plan dimensions", () => {
  const j = jig()
  const inputs = DEFAULT_INPUTS
  const dims = planDims(j, inputs)

  it("reads the same as the settings", () => {
    expect(by(dims, "spineLength").value).toBe(j.spine.length)
    expect(by(dims, "centerOffset").value).toBe(DEFAULT_JIG.centerOffset)
    expect(by(dims, "rearSpacing").value).toBe(inputs.rearSpacing)
    expect(by(dims, "bbShell").value).toBe(inputs.bbShellWidth)
    expect(by(dims, "rearStandoff").value).toBe(j.stations.find((s) => s.id === "rearAxle")!.standoff)
    expect(by(dims, "bbStandoff").value).toBe(j.stations.find((s) => s.id === "bb")!.standoff)
  })

  it("marks the offset and the two standoffs as key", () => {
    expect(dims.filter((d) => d.key).map((d) => d.id)).toEqual(["centerOffset", "rearStandoff", "bbStandoff"])
  })

  it("the standoff and the spacing meet at the near face", () => {
    const a = by(dims, "rearStandoff")
    const b = by(dims, "rearSpacing")
    expect(a.to.y).toBeCloseTo(b.from.y, 9)
  })
})
