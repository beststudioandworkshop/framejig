"use client"

import { useEffect, useRef, useState } from "react"

/** The rendered width of an element in pixels (0 until it has been measured). */
export function useElementWidth<T extends Element>() {
  const ref = useRef<T | null>(null)
  const [width, setWidth] = useState(0)
  useEffect(() => {
    const el = ref.current
    if (!el) return
    const observer = new ResizeObserver((entries) => setWidth(entries[0].contentRect.width))
    observer.observe(el)
    return () => observer.disconnect()
  }, [])
  return [ref, width] as const
}

/**
 * A text size in drawing units: the drawing's own proportion, but never smaller
 * than `minPx` on screen and never so big it swamps the drawing.
 */
export function labelSize(viewBoxWidth: number, renderedPx: number, minPx = 8) {
  const base = viewBoxWidth / 64
  if (renderedPx <= 0) return base
  return Math.min(Math.max(base, (minPx * viewBoxWidth) / renderedPx), viewBoxWidth / 22)
}
