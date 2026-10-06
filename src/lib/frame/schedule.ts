// Tube schedule: the frame's tubes as rows, plus CSV and paste-friendly text.
import { formatLengthValue, type LengthUnit } from "./units"
import type { FrameMaterial, FrameTube } from "./types"

export interface ScheduleRow {
  name: string
  qty: number
  /** mm */
  diameter: number
  /** mm */
  wall: number
  /** Joint-to-joint centerline length in mm. Miter allowances not applied. */
  length: number
  /** Acute angle from horizontal in the side view, 0 to 90 degrees. */
  angle: number
  material: FrameMaterial
}

/** Fold a direction (any sign, 0-360) into the acute angle the tube makes with horizontal. */
export function fromHorizontal(angleDeg: number): number {
  const a = Math.abs(angleDeg) % 180
  return Math.min(a, 180 - a)
}

export function scheduleRows(tubes: FrameTube[]): ScheduleRow[] {
  return tubes.map((t) => ({
    name: t.name,
    qty: t.count,
    diameter: t.diameter,
    wall: t.wall,
    length: t.length,
    angle: fromHorizontal(t.angle),
    material: t.material,
  }))
}

function cells(row: ScheduleRow, unit: LengthUnit): string[] {
  return [
    row.name,
    String(row.qty),
    formatLengthValue(row.diameter, unit),
    formatLengthValue(row.wall, unit),
    formatLengthValue(row.length, unit),
    String(Number(row.angle.toFixed(1))),
    row.material,
  ]
}

function header(unit: LengthUnit): string[] {
  return ["Tube", "Qty", `OD (${unit})`, `Wall (${unit})`, `Length (${unit})`, "Angle from horizontal (deg)", "Material"]
}

const csvCell = (s: string) => (/[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s)

export function scheduleCsv(tubes: FrameTube[], unit: LengthUnit): string {
  const rows = scheduleRows(tubes).map((r) => cells(r, unit))
  return [header(unit), ...rows].map((r) => r.map(csvCell).join(",")).join("\n") + "\n"
}

/** Tab-separated, so it pastes straight into a spreadsheet. */
export function scheduleText(tubes: FrameTube[], unit: LengthUnit): string {
  const rows = scheduleRows(tubes).map((r) => cells(r, unit))
  return [header(unit), ...rows].map((r) => r.join("\t")).join("\n")
}
