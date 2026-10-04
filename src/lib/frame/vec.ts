import type { Vec2 } from "./types"

export const rad = (deg: number) => (deg * Math.PI) / 180
export const deg = (r: number) => (r * 180) / Math.PI

export const add = (a: Vec2, b: Vec2): Vec2 => ({ x: a.x + b.x, y: a.y + b.y })
export const sub = (a: Vec2, b: Vec2): Vec2 => ({ x: a.x - b.x, y: a.y - b.y })
export const scale = (a: Vec2, k: number): Vec2 => ({ x: a.x * k, y: a.y * k })
export const dist = (a: Vec2, b: Vec2) => Math.hypot(a.x - b.x, a.y - b.y)
export const mid = (a: Vec2, b: Vec2): Vec2 => ({ x: (a.x + b.x) / 2, y: (a.y + b.y) / 2 })

/** Shortest distance from point p to the segment a-b. */
export function distToSegment(p: Vec2, a: Vec2, b: Vec2): number {
  const ab = sub(b, a)
  const len2 = ab.x * ab.x + ab.y * ab.y
  if (len2 === 0) return dist(p, a)
  const t = Math.max(0, Math.min(1, ((p.x - a.x) * ab.x + (p.y - a.y) * ab.y) / len2))
  return dist(p, { x: a.x + ab.x * t, y: a.y + ab.y * t })
}
