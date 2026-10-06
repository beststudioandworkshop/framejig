// Share links: a frame's inputs as a short URL-safe string. Used to carry a
// frame between tools (and, later, to share one). Only what differs from the
// defaults is stored. Decoding never throws: junk gives null, and anything
// missing or wrong falls back to the default for that field.
import { BIKE_TYPES, DEFAULT_INPUTS } from "./constants"
import { isStyleOf } from "./styles"
import type { BikeType, Drivers, FrameInputs, FrameMaterial, FrameProcess, FrameTubeSpecs, TubeSpec } from "./types"

const VERSION = 1

const MATERIALS: FrameMaterial[] = ["steel", "titanium", "aluminum"]
const PROCESSES: FrameProcess[] = ["tig", "braze", "lugged"]
const DRIVER_VALUES: { [K in keyof Drivers]: Drivers[K][] } = {
  bb: ["drop", "height"],
  rear: ["chainstay", "rearCenter"],
  seat: ["ct", "cc"],
  horizontal: ["effectiveTopTube", "frontCenter", "reach"],
  vertical: ["headTubeLength", "stack"],
}
const TUBE_ROLES = Object.keys(DEFAULT_INPUTS.tubes) as (keyof FrameTubeSpecs)[]
const NUMBER_KEYS = (Object.keys(DEFAULT_INPUTS) as (keyof FrameInputs)[]).filter(
  (k) => typeof DEFAULT_INPUTS[k] === "number",
)

function toBase64Url(text: string): string {
  return btoa(text).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "")
}

function fromBase64Url(text: string): string | null {
  try {
    const b64 = text.replace(/-/g, "+").replace(/_/g, "/")
    return atob(b64 + "=".repeat((4 - (b64.length % 4)) % 4))
  } catch {
    return null
  }
}

/** The bike type, and its style only if that style belongs to the type. */
function bikeIdentity(type: unknown, style: unknown): { bikeType: BikeType; bikeStyle: string | null } {
  const bikeType = BIKE_TYPES.includes(type as BikeType) ? (type as BikeType) : DEFAULT_INPUTS.bikeType
  return { bikeType, bikeStyle: typeof style === "string" && isStyleOf(bikeType, style) ? style : null }
}

const isObject = (v: unknown): v is Record<string, unknown> => typeof v === "object" && v !== null && !Array.isArray(v)
const isNumber = (v: unknown): v is number => typeof v === "number" && Number.isFinite(v)

/** Only the fields that differ from the defaults. */
function changes(inputs: FrameInputs): Record<string, unknown> {
  const out: Record<string, unknown> = {}
  for (const key of Object.keys(DEFAULT_INPUTS) as (keyof FrameInputs)[]) {
    if (JSON.stringify(inputs[key]) !== JSON.stringify(DEFAULT_INPUTS[key])) out[key] = inputs[key]
  }
  return out
}

export function encodeFrame(inputs: FrameInputs): string {
  return toBase64Url(JSON.stringify({ v: VERSION, c: changes(inputs) }))
}

/** A frame from a share string, or null if it isn't one. Missing or invalid fields become defaults. */
export function decodeFrame(text: string | null | undefined): FrameInputs | null {
  if (!text) return null
  const json = fromBase64Url(text)
  if (json === null) return null
  let data: unknown
  try {
    data = JSON.parse(json)
  } catch {
    return null
  }
  if (!isObject(data) || data.v !== VERSION || !isObject(data.c)) return null
  return sanitizeFrame(data.c)
}

/**
 * Turn any object into a complete, valid set of inputs: every field that is
 * missing or the wrong type becomes its default, and unknown fields are dropped.
 */
export function sanitizeFrame(raw: unknown): FrameInputs {
  const c: Record<string, unknown> = isObject(raw) ? raw : {}
  const d = DEFAULT_INPUTS

  const tubes = {} as FrameTubeSpecs
  const rawTubes = isObject(c.tubes) ? c.tubes : {}
  for (const role of TUBE_ROLES) {
    const t = rawTubes[role]
    const spec: TubeSpec = { ...d.tubes[role] }
    if (isObject(t)) {
      if (isNumber(t.diameter)) spec.diameter = t.diameter
      if (isNumber(t.wall)) spec.wall = t.wall
    }
    tubes[role] = spec
  }

  const rawWheel = isObject(c.wheel) ? c.wheel : {}
  const rawDrivers = isObject(c.drivers) ? c.drivers : {}
  const drivers = { ...d.drivers } as Record<keyof Drivers, string>
  for (const key of Object.keys(DRIVER_VALUES) as (keyof Drivers)[]) {
    const v = rawDrivers[key]
    if (typeof v === "string" && (DRIVER_VALUES[key] as string[]).includes(v)) drivers[key] = v
  }

  const out: FrameInputs = {
    ...d,
    wheel: {
      rimDiameter: isNumber(rawWheel.rimDiameter) ? rawWheel.rimDiameter : d.wheel.rimDiameter,
      tireSection: isNumber(rawWheel.tireSection) ? rawWheel.tireSection : d.wheel.tireSection,
    },
    ...bikeIdentity(c.bikeType, c.bikeStyle),
    material: MATERIALS.includes(c.material as FrameMaterial) ? (c.material as FrameMaterial) : d.material,
    process: PROCESSES.includes(c.process as FrameProcess) ? (c.process as FrameProcess) : d.process,
    drivers: drivers as unknown as Drivers,
    tubes,
  }
  for (const key of NUMBER_KEYS) {
    const v = c[key]
    if (isNumber(v)) (out as unknown as Record<string, number>)[key] = v
  }
  return out
}
