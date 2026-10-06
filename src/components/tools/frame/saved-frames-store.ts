"use client"

import { parseSavedList, serializeSavedList, type SavedFrame } from "@/lib/frame"

// The saved list lives in this browser's localStorage. It's a convenience: it
// can be empty after clearing site data or in a private window, so the
// downloaded file is the reliable copy. Read through useSyncExternalStore.
const KEY = "framejig:saved-frames"
const EVENT = "framejig:saved-frames-changed"

export function subscribe(callback: () => void) {
  window.addEventListener("storage", callback)
  window.addEventListener(EVENT, callback)
  return () => {
    window.removeEventListener("storage", callback)
    window.removeEventListener(EVENT, callback)
  }
}

/** The raw stored text (a string, so it is stable between reads). */
export function getSnapshot(): string {
  try {
    return window.localStorage.getItem(KEY) ?? ""
  } catch {
    return ""
  }
}

export const getServerSnapshot = () => ""

export const readSaved = (raw: string): SavedFrame[] => parseSavedList(raw)

/** Returns false if the browser wouldn't store it. */
export function writeSaved(list: SavedFrame[]): boolean {
  try {
    window.localStorage.setItem(KEY, serializeSavedList(list))
    window.dispatchEvent(new Event(EVENT))
    return true
  } catch {
    return false
  }
}
