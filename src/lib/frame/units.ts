// Length and angle parsing/formatting. Millimetres internally.
export type LengthUnit = "mm" | "in"

export const MM_PER_INCH = 25.4

export const mmToIn = (mm: number) => mm / MM_PER_INCH
export const inToMm = (inch: number) => inch * MM_PER_INCH

/**
 * Parse typed length: "25", "25mm", "1.5", `1 1/2"`, "3/4in". A bare number is
 * read in `defaultUnit`. Returns millimetres, or null if it isn't a length.
 */
export function parseLength(text: string, defaultUnit: LengthUnit): number | null {
  const s = text.trim().toLowerCase()
  if (s === "") return null
  const m = s.match(/^(-?\d+(?:\.\d+)?(?:\s+\d+\/\d+)?|-?\d+\/\d+)\s*(mm|in|inch|inches|")?$/)
  if (!m) return null
  const num = m[1]
  let value: number
  const mixed = num.match(/^(-?\d+)\s+(\d+)\/(\d+)$/)
  const frac = num.match(/^(-?\d+)\/(\d+)$/)
  if (mixed) {
    const whole = Number(mixed[1])
    const f = Number(mixed[2]) / Number(mixed[3])
    value = whole < 0 || mixed[1].startsWith("-") ? whole - f : whole + f
  } else if (frac) {
    value = Number(frac[1]) / Number(frac[2])
  } else {
    value = Number(num)
  }
  if (!Number.isFinite(value)) return null
  const unit: LengthUnit = m[2] === undefined ? defaultUnit : m[2] === "mm" ? "mm" : "in"
  return unit === "mm" ? value : inToMm(value)
}

/** Parse degrees: "73.5", "73.5°". Returns null if not a number. */
export function parseAngle(text: string): number | null {
  const m = text.trim().match(/^(-?\d+(?:\.\d+)?)\s*(°|deg|degrees)?$/i)
  return m ? Number(m[1]) : null
}

/** A length as a bare number in `unit` (no suffix), for editable fields and tables. */
export function formatLengthValue(mm: number, unit: LengthUnit): string {
  return unit === "mm" ? trim(mm, 1) : trim(mmToIn(mm), 3)
}

export function formatMm(mm: number, decimals = 1): string {
  return `${trim(mm, decimals)} mm`
}

export function formatInches(mm: number, decimals = 2): string {
  return `${trim(mmToIn(mm), decimals)}"`
}

export function formatAngle(degrees: number, decimals = 1): string {
  return `${trim(degrees, decimals)}°`
}

function trim(n: number, decimals: number): string {
  return Number(n.toFixed(decimals)).toString()
}
