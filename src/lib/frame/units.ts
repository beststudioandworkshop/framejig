// Length and angle parsing/formatting. Millimeters internally.
export type LengthUnit = "mm" | "in"

export const MM_PER_INCH = 25.4

export const mmToIn = (mm: number) => mm / MM_PER_INCH
export const inToMm = (inch: number) => inch * MM_PER_INCH

/**
 * Parse typed length: "25", "25mm", "1.5", `1 1/2"`, "3/4in". A bare number is
 * read in `defaultUnit`. Returns millimeters, or null if it isn't a length.
 */
export function parseLength(text: string, defaultUnit: LengthUnit): number | null {
  const s = text.trim().toLowerCase()
  if (s === "") return null
  // Feet and inches: 5'10", 5' 10, 5 ft 10 in, 6ft.
  const ft = s.match(/^(\d+(?:\.\d+)?)\s*(?:'|ft|feet|foot)\s*(?:(\d+(?:\.\d+)?)\s*(?:"|in|inch|inches)?)?$/)
  if (ft) return Number(ft[1]) * 304.8 + (ft[2] ? Number(ft[2]) * MM_PER_INCH : 0)
  const m = s.match(/^(-?\d+(?:\.\d+)?(?:\s+\d+\/\d+)?|-?\d+\/\d+)\s*(mm|cm|in|inch|inches|")?$/)
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
  if (m[2] === "cm") return value * 10
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

/** A height as feet and inches, rounded to the nearest inch: 1778 mm is 5'10". */
export function formatFeetInches(mm: number): string {
  const totalInches = Math.round(mmToIn(mm))
  return `${Math.floor(totalInches / 12)}'${totalInches % 12}"`
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
