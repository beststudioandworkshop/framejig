// Saving and loading frames: a downloadable file, and a list kept in the
// browser. Reading never trusts the data: anything missing or wrong becomes a
// default (see sanitizeFrame), and anything that isn't one of ours is null.
import { sanitizeFrame } from "./share"
import type { FrameInputs } from "./types"

export const FILE_FORMAT = "framejig-frame"
export const FILE_VERSION = 1
export const MAX_SAVED = 50
export const MAX_NAME = 60
export const DEFAULT_NAME = "Untitled frame"

export interface SavedFrame {
  /** Lower-case trimmed name. Saving under the same name replaces the entry. */
  id: string
  name: string
  /** ISO date-time. */
  savedAt: string
  frame: FrameInputs
  reference: FrameInputs | null
}

const isObject = (v: unknown): v is Record<string, unknown> => typeof v === "object" && v !== null && !Array.isArray(v)

/** A tidy name: trimmed, one line, not too long, never empty. */
export function cleanName(name: string): string {
  const n = name.replace(/\s+/g, " ").trim().slice(0, MAX_NAME).trim()
  return n === "" ? DEFAULT_NAME : n
}

/** File-name-safe version of a name: lower case letters, digits and single dashes. */
export function slugify(name: string): string {
  const s = cleanName(name)
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
  return s === "" ? "frame" : s
}

export function frameFileName(name: string): string {
  return `${slugify(name)}.framejig.json`
}

export function serializeFrameFile(name: string, frame: FrameInputs, reference: FrameInputs | null, now: Date = new Date()): string {
  return (
    JSON.stringify(
      { format: FILE_FORMAT, version: FILE_VERSION, name: cleanName(name), savedAt: now.toISOString(), frame, reference },
      null,
      2,
    ) + "\n"
  )
}

export interface FrameFile {
  name: string
  savedAt: string
  frame: FrameInputs
  reference: FrameInputs | null
}

/** A frame file, or null if the text isn't one of ours. */
export function parseFrameFile(text: string): FrameFile | null {
  let data: unknown
  try {
    data = JSON.parse(text)
  } catch {
    return null
  }
  if (!isObject(data) || data.format !== FILE_FORMAT || data.version !== FILE_VERSION || !isObject(data.frame)) return null
  return {
    name: typeof data.name === "string" ? cleanName(data.name) : DEFAULT_NAME,
    savedAt: typeof data.savedAt === "string" && !Number.isNaN(Date.parse(data.savedAt)) ? data.savedAt : new Date(0).toISOString(),
    frame: sanitizeFrame(data.frame),
    reference: isObject(data.reference) ? sanitizeFrame(data.reference) : null,
  }
}

export const savedId = (name: string) => cleanName(name).toLowerCase()

/** The browser's saved list as text. */
export function serializeSavedList(list: SavedFrame[]): string {
  return JSON.stringify({ format: `${FILE_FORMAT}-list`, version: FILE_VERSION, items: list })
}

/** The browser's saved list from text. Bad entries are dropped; junk gives an empty list. */
export function parseSavedList(text: string | null | undefined): SavedFrame[] {
  if (!text) return []
  let data: unknown
  try {
    data = JSON.parse(text)
  } catch {
    return []
  }
  if (!isObject(data) || data.format !== `${FILE_FORMAT}-list` || data.version !== FILE_VERSION || !Array.isArray(data.items)) return []
  const out: SavedFrame[] = []
  for (const item of data.items) {
    if (!isObject(item) || typeof item.name !== "string" || !isObject(item.frame)) continue
    const name = cleanName(item.name)
    out.push({
      id: savedId(name),
      name,
      savedAt: typeof item.savedAt === "string" && !Number.isNaN(Date.parse(item.savedAt)) ? item.savedAt : new Date(0).toISOString(),
      frame: sanitizeFrame(item.frame),
      reference: isObject(item.reference) ? sanitizeFrame(item.reference) : null,
    })
  }
  return dedupe(out).slice(0, MAX_SAVED)
}

function dedupe(list: SavedFrame[]): SavedFrame[] {
  const seen = new Set<string>()
  return list.filter((s) => (seen.has(s.id) ? false : (seen.add(s.id), true)))
}

/** Add or replace by name, newest first, capped at MAX_SAVED. */
export function upsertSaved(list: SavedFrame[], name: string, frame: FrameInputs, reference: FrameInputs | null, now: Date = new Date()): SavedFrame[] {
  const entry: SavedFrame = { id: savedId(name), name: cleanName(name), savedAt: now.toISOString(), frame, reference }
  return [entry, ...list.filter((s) => s.id !== entry.id)].slice(0, MAX_SAVED)
}

export function removeSaved(list: SavedFrame[], id: string): SavedFrame[] {
  return list.filter((s) => s.id !== id)
}
