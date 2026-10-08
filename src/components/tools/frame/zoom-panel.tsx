"use client"

import { MaximizeIcon, MinusIcon, PlusIcon, RotateCcwIcon } from "lucide-react"
import { useCallback, useEffect, useRef, useState, type ReactNode } from "react"

import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogDescription, DialogTitle, DialogTrigger } from "@/components/ui/dialog"

interface View {
  k: number
  x: number
  y: number
}
const START: View = { k: 1, x: 0, y: 0 }
const MIN = 1
const MAX = 12
const clamp = (v: number) => Math.min(MAX, Math.max(MIN, v))

/**
 * A drawing you can pan and zoom: scroll or pinch to zoom, drag to move, double click
 * to zoom in, and buttons for the same. The drawing is vector, so it stays sharp.
 */
function ZoomSurface({ children }: { children: ReactNode }) {
  const box = useRef<HTMLDivElement>(null)
  const [view, setView] = useState<View>(START)
  const pointers = useRef(new Map<number, { x: number; y: number }>())
  const pinch = useRef<{ dist: number; k: number } | null>(null)

  const zoomAt = useCallback((cx: number, cy: number, factor: number) => {
    setView((v) => {
      const k = clamp(v.k * factor)
      const f = k / v.k
      return { k, x: cx - (cx - v.x) * f, y: cy - (cy - v.y) * f }
    })
  }, [])
  const zoomCenter = (factor: number) => {
    const r = box.current?.getBoundingClientRect()
    if (r) zoomAt(r.width / 2, r.height / 2, factor)
  }

  useEffect(() => {
    const el = box.current
    if (!el) return
    const onWheel = (e: WheelEvent) => {
      e.preventDefault()
      const r = el.getBoundingClientRect()
      zoomAt(e.clientX - r.left, e.clientY - r.top, Math.exp(-e.deltaY * 0.0015))
    }
    el.addEventListener("wheel", onWheel, { passive: false })
    return () => el.removeEventListener("wheel", onWheel)
  }, [zoomAt])

  const down = (e: React.PointerEvent) => {
    box.current?.setPointerCapture(e.pointerId)
    pointers.current.set(e.pointerId, { x: e.clientX, y: e.clientY })
    if (pointers.current.size === 2) {
      const [a, b] = [...pointers.current.values()]
      pinch.current = { dist: Math.hypot(a.x - b.x, a.y - b.y), k: view.k }
    }
  }
  const move = (e: React.PointerEvent) => {
    const prev = pointers.current.get(e.pointerId)
    if (!prev) return
    pointers.current.set(e.pointerId, { x: e.clientX, y: e.clientY })
    if (pointers.current.size === 2 && pinch.current) {
      const [a, b] = [...pointers.current.values()]
      const r = box.current!.getBoundingClientRect()
      const dist = Math.hypot(a.x - b.x, a.y - b.y)
      const target = clamp(pinch.current.k * (dist / pinch.current.dist))
      zoomAt((a.x + b.x) / 2 - r.left, (a.y + b.y) / 2 - r.top, target / view.k)
    } else if (pointers.current.size === 1) {
      setView((v) => ({ ...v, x: v.x + (e.clientX - prev.x), y: v.y + (e.clientY - prev.y) }))
    }
  }
  const up = (e: React.PointerEvent) => {
    pointers.current.delete(e.pointerId)
    if (pointers.current.size < 2) pinch.current = null
  }

  return (
    <div className="relative flex h-full min-h-0 flex-col gap-2">
      <div className="flex items-center gap-2">
        <Button variant="outline" size="icon-sm" aria-label="Zoom in" onClick={() => zoomCenter(1.5)}>
          <PlusIcon />
        </Button>
        <Button variant="outline" size="icon-sm" aria-label="Zoom out" onClick={() => zoomCenter(1 / 1.5)}>
          <MinusIcon />
        </Button>
        <Button variant="outline" size="sm" onClick={() => setView(START)}>
          <RotateCcwIcon /> Reset
        </Button>
        <span className="ml-auto text-xs text-muted-foreground tabular-nums">{Math.round(view.k * 100)}%</span>
      </div>
      <div
        ref={box}
        className="relative min-h-0 flex-1 cursor-grab touch-none overflow-hidden rounded-lg border bg-background active:cursor-grabbing"
        onPointerDown={down}
        onPointerMove={move}
        onPointerUp={up}
        onPointerCancel={up}
        onDoubleClick={(e) => {
          const r = e.currentTarget.getBoundingClientRect()
          zoomAt(e.clientX - r.left, e.clientY - r.top, 2)
        }}
      >
        <div className="absolute top-0 left-0 w-full origin-top-left" style={{ transform: `translate(${view.x}px, ${view.y}px) scale(${view.k})` }}>
          {children}
        </div>
      </div>
      <p className="text-xs text-muted-foreground">Scroll or pinch to zoom, drag to move, double click to zoom in.</p>
    </div>
  )
}

/** A drawing with an Enlarge button that opens it big, with pan and zoom. */
export function ZoomPanel({ title, children }: { title: string; children: ReactNode }) {
  return (
    <div className="flex flex-col gap-2">
      <div className="flex justify-end">
        <Dialog>
          <DialogTrigger
            render={
              <Button variant="outline" size="sm">
                <MaximizeIcon /> Enlarge
              </Button>
            }
          />
          <DialogContent className="flex h-[92vh] w-[96vw] max-w-none flex-col gap-3 sm:max-w-none">
            <DialogTitle>{title}</DialogTitle>
            <DialogDescription className="sr-only">The drawing, enlarged. Scroll or pinch to zoom and drag to move.</DialogDescription>
            <div className="min-h-0 flex-1">
              <ZoomSurface>{children}</ZoomSurface>
            </div>
          </DialogContent>
        </Dialog>
      </div>
      {children}
    </div>
  )
}
