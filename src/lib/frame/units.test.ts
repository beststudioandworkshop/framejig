import { describe, expect, it } from "vitest"

import { formatAngle, formatInches, formatMm, inToMm, mmToIn, parseAngle, parseLength } from "./units"

describe("parseLength", () => {
  it("reads bare numbers in the default unit", () => {
    expect(parseLength("25", "mm")).toBe(25)
    expect(parseLength("1", "in")).toBeCloseTo(25.4, 9)
  })
  it("reads explicit units over the default", () => {
    expect(parseLength("25mm", "in")).toBe(25)
    expect(parseLength('1"', "mm")).toBeCloseTo(25.4, 9)
    expect(parseLength("2 in", "mm")).toBeCloseTo(50.8, 9)
    expect(parseLength("2 inches", "mm")).toBeCloseTo(50.8, 9)
  })
  it("reads decimals, fractions and mixed numbers", () => {
    expect(parseLength("1.5", "in")).toBeCloseTo(38.1, 9)
    expect(parseLength("3/4", "in")).toBeCloseTo(19.05, 9)
    expect(parseLength('1 1/2"', "mm")).toBeCloseTo(38.1, 9)
  })
  it("ignores case and surrounding space", () => {
    expect(parseLength("  25 MM ", "in")).toBe(25)
  })
  it("rejects junk", () => {
    for (const s of ["", "abc", "1/", "12cm", "--3", "1 1/2 1/2"]) expect(parseLength(s, "mm")).toBeNull()
  })
})

describe("parseAngle", () => {
  it("reads numbers with an optional degree sign", () => {
    expect(parseAngle("73.5")).toBe(73.5)
    expect(parseAngle("73.5°")).toBe(73.5)
    expect(parseAngle(" 73 deg ")).toBe(73)
  })
  it("rejects junk", () => {
    expect(parseAngle("")).toBeNull()
    expect(parseAngle("steep")).toBeNull()
  })
})

describe("convert and format", () => {
  it("round trips mm and inches", () => {
    expect(inToMm(mmToIn(622))).toBeCloseTo(622, 9)
  })
  it("formats without trailing zeros", () => {
    expect(formatMm(25)).toBe("25 mm")
    expect(formatMm(25.46)).toBe("25.5 mm")
    expect(formatAngle(73.5)).toBe("73.5°")
    expect(formatInches(25.4)).toBe('1"')
  })
})
