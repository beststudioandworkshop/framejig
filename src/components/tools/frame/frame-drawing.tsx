"use client"

import { useId } from "react"

import { formatLengthValue, viewBoxOf, type Drawing, type LengthUnit, type Vec2 } from "@/lib/frame"

const line = (a: Vec2, b: Vec2) => ({ x1: a.x, y1: a.y, x2: b.x, y2: b.y })
const pts = (ps: Vec2[]) => ps.map((p) => `${p.x},${p.y}`).join(" ")

interface FrameDrawingProps {
  drawing: Drawing
  /** Drawn dashed and quiet behind the main frame. */
  reference?: Drawing | null
  showDimensions: boolean
  unit: LengthUnit
}

/**
 * The side view. Draws exactly what the drawing data says; all colour comes
 * from tokens (`currentColor` and the token stroke/fill classes).
 */
export function FrameDrawing({ drawing, reference, showDimensions, unit }: FrameDrawingProps) {
  const arrowId = useId()
  const vb = viewBoxOf(reference ? [drawing, reference] : [drawing], 90)
  const fs = vb.width / 64
  const arrow = fs * 0.55
  const thin = { vectorEffect: "non-scaling-stroke" } as const

  return (
    <svg
      viewBox={`${vb.x} ${vb.y} ${vb.width} ${vb.height}`}
      role="img"
      aria-label="Side view of the frame with its dimensions"
      className="h-auto w-full min-w-160"
    >
      <defs>
        <marker
          id={arrowId}
          viewBox="0 0 10 10"
          refX="10"
          refY="5"
          markerUnits="userSpaceOnUse"
          markerWidth={arrow}
          markerHeight={arrow}
          orient="auto-start-reverse"
        >
          <path d="M0,1 L10,5 L0,9 z" className="fill-primary" />
        </marker>
      </defs>

      <line {...line(drawing.ground[0], drawing.ground[1])} className="stroke-border" strokeWidth={2} {...thin} />

      {reference && (
        <g className="fill-none stroke-muted-foreground" strokeDasharray="6 4" strokeWidth={1.25} {...thin}>
          {reference.wheels.map((w, i) => (
            <circle key={i} cx={w.tyre.cx} cy={w.tyre.cy} r={w.tyre.r} />
          ))}
          {reference.tubes.map((t) => (
            <polygon key={t.role + t.a.x} points={pts(t.corners)} />
          ))}
          <line {...line(reference.fork[0], reference.fork[1])} />
        </g>
      )}

      <g className="fill-none stroke-muted-foreground" strokeWidth={1.25} {...thin}>
        {drawing.wheels.map((w, i) => (
          <g key={i}>
            <circle cx={w.tyre.cx} cy={w.tyre.cy} r={w.tyre.r} />
            <circle cx={w.rim.cx} cy={w.rim.cy} r={w.rim.r} strokeOpacity={0.5} />
          </g>
        ))}
      </g>

      <line
        {...line(drawing.steeringAxis[0], drawing.steeringAxis[1])}
        className="stroke-muted-foreground"
        strokeDasharray="10 4 2 4"
        strokeWidth={1}
        {...thin}
      />

      <g className="fill-secondary stroke-foreground" strokeWidth={1.25} strokeLinejoin="round" {...thin}>
        {drawing.tubes.map((t) => (
          <polygon key={t.role + t.a.x} points={pts(t.corners)} />
        ))}
      </g>
      <line {...line(drawing.fork[0], drawing.fork[1])} className="stroke-foreground" strokeWidth={2} {...thin} />

      <g className="stroke-muted-foreground" strokeWidth={1.5} {...thin}>
        <line {...line(drawing.crank[0], drawing.crank[1])} />
        <line {...line(drawing.foot[0], drawing.foot[1])} strokeDasharray="3 3" />
      </g>
      {drawing.wheels.map((w, i) => (
        <circle key={i} cx={w.tyre.cx} cy={w.tyre.cy} r={fs * 0.3} className="fill-background stroke-foreground" strokeWidth={1.25} {...thin} />
      ))}
      <circle cx={drawing.contact.x} cy={drawing.contact.y} r={fs * 0.25} className="fill-foreground" />

      {showDimensions &&
        drawing.dims.map((d) => {
          const x = d.labelMid.x + d.labelNormal.x * fs * 0.9
          const y = d.labelMid.y + d.labelNormal.y * fs * 0.9
          return (
            <g key={d.id}>
              {d.ext.map((e, i) => (
                <line key={i} {...line(e[0], e[1])} className="stroke-muted-foreground" strokeWidth={0.75} {...thin} />
              ))}
              <line
                {...line(d.line[0], d.line[1])}
                className="stroke-primary"
                strokeWidth={1}
                markerStart={`url(#${arrowId})`}
                markerEnd={`url(#${arrowId})`}
                {...thin}
              />
              <text
                x={x}
                y={y}
                transform={`rotate(${d.labelAngle} ${x} ${y})`}
                textAnchor="middle"
                dominantBaseline="central"
                fontSize={fs}
                className="fill-foreground stroke-background font-mono"
                strokeWidth={fs * 0.4}
                strokeLinejoin="round"
                paintOrder="stroke"
              >
                {d.name} {formatLengthValue(d.value, unit)}
              </text>
            </g>
          )
        })}
    </svg>
  )
}
