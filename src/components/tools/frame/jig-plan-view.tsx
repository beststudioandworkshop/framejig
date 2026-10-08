"use client"

import { useElementWidth, labelSize } from "./use-element-width"
import {
  ALLOWANCE,
  CARRIER_WIDTH,
  dimGeometry,
  formatLengthValue,
  planDims,
  POST_WIDTH,
  PROFILE_THICKNESS,
  type FrameInputs,
  type Jig,
  type JigCarrier,
  type LengthUnit,
  type Vec2,
} from "@/lib/frame"
import { DimLines } from "./dimension-lines"

const thin = { vectorEffect: "non-scaling-stroke" } as const
const LABEL = { headBottom: "head bottom", headTop: "head top", seatTop: "seat top", frontAxle: "front axle" } as const

interface JigPlanViewProps {
  inputs: FrameInputs
  jig: Jig
  unit?: LengthUnit
}

/**
 * The jig seen from above, to scale. The spine runs along the top with its front
 * face at zero; the frame's center plane is `centerOffset` out from that face.
 * Posts sit on the face, carriers in front of them, and the locators reach out to
 * the frame: the rear dropouts, the BB shell, and the tubes on the center plane.
 */
export function JigPlanView({ inputs, jig, unit = "mm" }: JigPlanViewProps) {
  const [ref, width] = useElementWidth<SVGSVGElement>()
  const D = jig.settings.centerOffset
  const { uMin, uMax } = jig.spine
  const T = PROFILE_THICKNESS
  const st = (id: string) => jig.stations.find((s) => s.id === id)!
  const dims = planDims(jig, inputs)
  const map = (p: Vec2): Vec2 => p

  const footprint = (c: JigCarrier) => {
    const pin = st(c.pivot)
    const a = (c.tubeAngle * Math.PI) / 180
    const dir = { x: -Math.cos(a), y: Math.sin(a) }
    const perp = { x: Math.sin(a), y: Math.cos(a) }
    const ends = [-ALLOWANCE, c.length - ALLOWANCE]
    const xs = ends.flatMap((d) => [-1, 1].map((s) => pin.x + dir.x * d + perp.x * s * (CARRIER_WIDTH / 2)))
    return { x0: Math.min(...xs), x1: Math.max(...xs) }
  }

  const rear = st("rearAxle")
  const bb = st("bb")
  const halfRear = inputs.rearSpacing / 2
  const halfBB = inputs.bbShellWidth / 2
  const centerStations = ["headBottom", "headTop", "seatTop", "frontAxle"].map(st)

  const all: Vec2[] = [
    { x: uMin, y: -T },
    { x: uMax, y: D + halfRear },
    { x: st("frontAxle").u + 40, y: D },
    ...jig.carriers.flatMap((c) => {
      const f = footprint(c)
      return [{ x: f.x0, y: 0 }, { x: f.x1, y: 2 * T }]
    }),
    ...dims.flatMap((d) => {
      const g = dimGeometry(d)
      return [map(g.a), map(g.b)]
    }),
  ]
  const margin = 70
  const minX = Math.min(...all.map((p) => p.x)) - margin
  const maxX = Math.max(...all.map((p) => p.x)) + margin
  const minY = Math.min(...all.map((p) => p.y)) - margin
  const maxY = Math.max(...all.map((p) => p.y)) + margin
  const vb = { x: minX, y: minY, width: maxX - minX, height: maxY - minY }
  const fs = labelSize(vb.width, width)
  const fmt = (mm: number) => formatLengthValue(mm, unit)

  const part = "fill-secondary stroke-foreground"
  return (
    <svg
      ref={ref}
      viewBox={`${vb.x} ${vb.y} ${vb.width} ${vb.height}`}
      role="img"
      aria-label="Top view of the jig and the frame's center plane, to scale, with dimensions"
      className="h-auto w-full"
    >
      {/* the frame's center plane */}
      <line x1={uMin} y1={D} x2={uMax} y2={D} className="stroke-muted-foreground" strokeDasharray="10 4 2 4" strokeWidth={1} {...thin} />
      <text x={uMax} y={D - fs * 0.8} textAnchor="end" fontSize={fs * 0.9} className="fill-muted-foreground">
        frame center plane
      </text>

      {/* spine, seen from above: its 40 mm thickness behind the front face */}
      <rect x={uMin} y={-T} width={uMax - uMin} height={T} className={part} strokeWidth={1.5} {...thin} />
      <text x={uMin + fs * 0.6} y={-T / 2} dominantBaseline="central" fontSize={fs * 0.9} className="fill-foreground">
        spine
      </text>

      {/* posts on the face, carriers in front of them */}
      {jig.carriers.map((c) => {
        const pin = st(c.pivot)
        return <rect key={`post-${c.id}`} x={pin.x - POST_WIDTH / 2} y={0} width={POST_WIDTH} height={T} className={part} strokeWidth={1.25} fillOpacity={0.9} {...thin} />
      })}
      {jig.carriers.map((c) => {
        const f = footprint(c)
        return <rect key={`carrier-${c.id}`} x={f.x0} y={T} width={f.x1 - f.x0} height={T} className={part} strokeWidth={1.25} fillOpacity={0.7} {...thin} />
      })}

      {/* rear axle standoff block, from the spine face to the near dropout */}
      <rect x={rear.u - T / 2} y={0} width={T} height={D - halfRear} className={part} strokeWidth={1.25} {...thin} />
      {/* the rear dropouts and dummy axle */}
      <line x1={rear.u} y1={D - halfRear} x2={rear.u} y2={D + halfRear} className="stroke-primary" strokeWidth={4} strokeLinecap="round" {...thin} />
      <line x1={rear.u - 30} y1={D - halfRear} x2={rear.u + 30} y2={D - halfRear} className="stroke-foreground" strokeWidth={2} {...thin} />
      <line x1={rear.u - 30} y1={D + halfRear} x2={rear.u + 30} y2={D + halfRear} className="stroke-foreground" strokeWidth={2} {...thin} />

      {/* BB locator and shell */}
      <rect x={bb.u - T / 2} y={2 * T} width={T} height={Math.max(0, D - halfBB - 2 * T)} className={part} strokeWidth={1.25} fillOpacity={0.7} {...thin} />
      <rect x={bb.u - T / 2} y={D - halfBB} width={T} height={inputs.bbShellWidth} className="fill-none stroke-primary" strokeWidth={2} {...thin} />

      {/* the tubes and the front axle, on the center plane */}
      {centerStations.map((s) => (
        <g key={s.id}>
          <circle cx={s.u} cy={D} r={fs * 0.45} className="fill-primary stroke-background" strokeWidth={1} {...thin} />
          <text
            x={s.u}
            y={D + (s.id === "headTop" ? -fs * 1.2 : fs * 1.4)}
            textAnchor="middle"
            dominantBaseline="central"
            fontSize={fs * 0.8}
            className="fill-foreground stroke-background"
            strokeWidth={fs * 0.3}
            paintOrder="stroke"
          >
            {LABEL[s.id as keyof typeof LABEL]}
          </text>
        </g>
      ))}

      <DimLines dims={dims} map={map} fs={fs * 0.95} format={fmt} />
    </svg>
  )
}
