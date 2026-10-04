import { describe, expect, it } from "vitest"

import { buildFrame, DEFAULT_INPUTS } from "./index"
import { fromHorizontal, scheduleCsv, scheduleRows, scheduleText } from "./schedule"

const tubes = buildFrame(DEFAULT_INPUTS).tubes

describe("angle from horizontal", () => {
  it("folds any direction into 0-90", () => {
    expect(fromHorizontal(0)).toBe(0)
    expect(fromHorizontal(106.5)).toBeCloseTo(73.5, 9)
    expect(fromHorizontal(-122.3)).toBeCloseTo(57.7, 9)
    expect(fromHorizontal(170.4)).toBeCloseTo(9.6, 9)
    expect(fromHorizontal(-45)).toBe(45)
    expect(fromHorizontal(90)).toBe(90)
    expect(fromHorizontal(180)).toBe(0)
  })
  it("seat and head tube rows show their design angles", () => {
    const rows = scheduleRows(tubes)
    expect(rows.find((r) => r.name === "Seat tube")!.angle).toBeCloseTo(DEFAULT_INPUTS.seatTubeAngle, 6)
    expect(rows.find((r) => r.name === "Head tube")!.angle).toBeCloseTo(DEFAULT_INPUTS.headTubeAngle, 6)
  })
})

describe("tube schedule", () => {
  it("has one row per tube with the tube's numbers", () => {
    const rows = scheduleRows(tubes)
    expect(rows).toHaveLength(6)
    tubes.forEach((t, i) => {
      expect(rows[i]).toMatchObject({ name: t.name, qty: t.count, length: t.length, diameter: t.diameter, wall: t.wall })
    })
  })
  it("is empty for an empty tube list", () => {
    expect(scheduleRows([])).toEqual([])
    expect(scheduleCsv([], "mm")).toBe("Tube,Qty,OD (mm),Wall (mm),Length (mm),Angle from horizontal (deg),Material\n")
  })
  it("CSV has a header, one line per tube, and the chosen unit", () => {
    const lines = scheduleCsv(tubes, "mm").trim().split("\n")
    expect(lines).toHaveLength(7)
    expect(lines[0]).toContain("Length (mm)")
    const seat = lines.find((l) => l.startsWith("Seat tube"))!.split(",")
    expect(Number(seat[4])).toBeCloseTo(DEFAULT_INPUTS.seatTubeLength, 0)
    expect(scheduleCsv(tubes, "in").split("\n")[0]).toContain("Length (in)")
  })
  it("quotes cells that need it", () => {
    const odd = [{ ...tubes[0], name: 'Top, "big"' }]
    expect(scheduleCsv(odd, "mm").split("\n")[1].startsWith('"Top, ""big""",')).toBe(true)
  })
  it("text is tab separated with a column per header", () => {
    const lines = scheduleText(tubes, "mm").split("\n")
    expect(lines).toHaveLength(7)
    for (const l of lines) expect(l.split("\t")).toHaveLength(7)
  })
  it("inch lengths are mm / 25.4", () => {
    const chain = scheduleCsv(tubes, "in").split("\n").find((l) => l.startsWith("Chainstay"))!.split(",")
    expect(Number(chain[4])).toBeCloseTo(DEFAULT_INPUTS.chainstayLength / 25.4, 1)
  })
})
