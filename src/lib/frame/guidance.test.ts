import { describe, expect, it } from "vitest"

import { buildFrame, checkRange, DEFAULT_INPUTS, readouts, TYPICAL_RANGES } from "./index"

describe("typical ranges", () => {
  it("classify below, inside and above (edges are inside)", () => {
    const r = TYPICAL_RANGES.trail
    expect(checkRange("trail", r.low - 1)).toBe("low")
    expect(checkRange("trail", r.low)).toBe("typical")
    expect(checkRange("trail", r.high)).toBe("typical")
    expect(checkRange("trail", r.high + 1)).toBe("high")
  })
  it("every range is ordered", () => {
    for (const r of Object.values(TYPICAL_RANGES)) expect(r.low).toBeLessThan(r.high)
  })
  it("readouts report the frame's own values", () => {
    const r = buildFrame(DEFAULT_INPUTS)
    const out = readouts(DEFAULT_INPUTS, r.metrics!)
    expect(out.find((o) => o.key === "trail")!.value).toBe(r.metrics!.trail)
    expect(out.find((o) => o.key === "bbDrop")!.value).toBe(DEFAULT_INPUTS.bbDrop)
    expect(out).toHaveLength(Object.keys(TYPICAL_RANGES).length)
  })
})
