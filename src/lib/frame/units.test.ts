import { describe, expect, it } from "vitest"

import { formatAngle, formatFeetInches, formatLengthValue, formatInches, formatMm, inToMm, mmToIn, parseAngle, parseLength } from "./units"

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
  it("reads centimeters", () => {
    expect(parseLength("178cm", "in")).toBe(1780)
    expect(parseLength("17.5 cm", "mm")).toBe(175)
  })
  it("reads feet and inches", () => {
    expect(parseLength(`5'10"`, "mm")).toBeCloseTo(5 * 304.8 + 10 * 25.4, 6)
    expect(parseLength("5' 10", "mm")).toBeCloseTo(1778, 6)
    expect(parseLength("5 ft 10 in", "mm")).toBeCloseTo(1778, 6)
    expect(parseLength("6ft", "in")).toBeCloseTo(1828.8, 6)
    expect(parseLength("5'", "mm")).toBeCloseTo(1524, 6)
    expect(parseLength(`5'10.5"`, "mm")).toBeCloseTo(5 * 304.8 + 10.5 * 25.4, 6)
  })
  it("ignores case and surrounding space", () => {
    expect(parseLength("  25 MM ", "in")).toBe(25)
  })
  it("rejects junk", () => {
    for (const s of ["", "abc", "1/", "12km", "--3", "1 1/2 1/2", "5'x", "ft", "'10"]) expect(parseLength(s, "mm")).toBeNull()
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

describe("formatLengthValue", () => {
  it("gives a bare number in the chosen unit", () => {
    expect(formatLengthValue(540, "mm")).toBe("540")
    expect(formatLengthValue(31.75, "mm")).toBe("31.8")
    expect(formatLengthValue(25.4, "in")).toBe("1")
    expect(formatLengthValue(31.8, "in")).toBe("1.252")
  })
  it("parses back to about the same length", () => {
    for (const unit of ["mm", "in"] as const) {
      const text = formatLengthValue(540.3, unit)
      expect(parseLength(text, unit)).toBeCloseTo(540.3, unit === "mm" ? 0 : 1)
    }
  })
})

describe("formatFeetInches", () => {
  it("rounds to the nearest inch", () => {
    expect(formatFeetInches(1778)).toBe(`5'10"`)
    expect(formatFeetInches(1829)).toBe(`6'0"`)
    expect(formatFeetInches(1524)).toBe(`5'0"`)
    expect(formatFeetInches(1780)).toBe(`5'10"`)
    expect(formatFeetInches(1640)).toBe(`5'5"`)
  })
  it("round trips with the parser to the inch", () => {
    for (const mm of [1600, 1700, 1778, 1850]) {
      expect(Math.abs(parseLength(formatFeetInches(mm), "mm")! - mm)).toBeLessThanOrEqual(13)
    }
  })
})
