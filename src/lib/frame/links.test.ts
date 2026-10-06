import { describe, expect, it } from "vitest"

import { DEFAULT_INPUTS, decodeFrame, toolLink } from "./index"

const base = DEFAULT_INPUTS
const params = (href: string) => new URL(href, "https://example.test").searchParams

describe("tool links", () => {
  it("points at the chosen tool", () => {
    expect(toolLink("frame", base)).toMatch(/^\/tools\/frame\?/)
    expect(toolLink("jig", base)).toMatch(/^\/tools\/jig\?/)
  })

  it("carries the frame, and only adds a reference when there is one", () => {
    const other = { ...base, headTubeAngle: 73.5 }
    const a = params(toolLink("jig", other))
    expect(decodeFrame(a.get("d"))).toEqual(other)
    expect(a.has("r")).toBe(false)
    const b = params(toolLink("jig", other, base))
    expect(decodeFrame(b.get("d"))).toEqual(other)
    expect(decodeFrame(b.get("r"))).toEqual(base)
    expect(params(toolLink("frame", other, null)).has("r")).toBe(false)
  })

  it("is a single URL-safe query with no stray characters", () => {
    expect(toolLink("jig", { ...base, forkRake: 52 }, base)).toMatch(/^\/tools\/jig\?d=[A-Za-z0-9_-]+&r=[A-Za-z0-9_-]+$/)
  })
})
