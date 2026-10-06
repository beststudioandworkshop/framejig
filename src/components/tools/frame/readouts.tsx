"use client"

import { AlertTriangleIcon, XCircleIcon } from "lucide-react"

import {
  profileFor,
  formatAngle,
  formatLengthValue,
  readouts,
  type FrameInputs,
  type FrameResult,
  type LengthUnit,
  type RangeVerdict,
} from "@/lib/frame"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"

const VERDICT_TEXT: Record<RangeVerdict, string> = {
  low: "Below typical",
  typical: "Typical",
  high: "Above typical",
}

function Stat({ label, value, note }: { label: string; value: string; note?: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-1 rounded-lg border p-3">
      <span className="text-sm text-muted-foreground">{label}</span>
      <span className="font-mono text-xl font-medium tabular-nums">{value}</span>
      {note}
    </div>
  )
}

export function Issues({ result }: { result: FrameResult }) {
  if (result.issues.length === 0) return null
  return (
    <div className="flex flex-col gap-2">
      {result.issues.map((issue, n) => (
        <Alert key={`${issue.code}-${n}`} variant={issue.severity === "error" ? "destructive" : "default"}>
          {issue.severity === "error" ? <XCircleIcon /> : <AlertTriangleIcon />}
          <AlertTitle>{issue.severity === "error" ? "This frame doesn't work" : "Worth a look"}</AlertTitle>
          <AlertDescription>{issue.message}</AlertDescription>
        </Alert>
      ))}
    </div>
  )
}

export function Readouts({ inputs, result, unit }: { inputs: FrameInputs; result: FrameResult; unit: LengthUnit }) {
  const m = result.metrics
  const L = (mm: number | undefined) => (m && mm !== undefined ? `${formatLengthValue(mm, unit)} ${unit}` : "—")
  const typical = m ? Object.fromEntries(readouts(inputs, m).map((r) => [r.key, r])) : {}

  const note = (key: string) => {
    const r = typical[key]
    if (!r) return null
    return (
      <Badge variant={r.verdict === "typical" ? "secondary" : "outline"} className="w-fit">
        {VERDICT_TEXT[r.verdict as RangeVerdict]}
      </Badge>
    )
  }

  return (
    <Card className="card-tone tone-tea">
      <CardHeader>
        <CardTitle>What you get</CardTitle>
        <CardDescription>
          Updates as you type. The &quot;typical&quot; tags are rules of thumb for {profileFor(inputs.bikeType, inputs.bikeStyle).label.toLowerCase()}{" "}
          frames, not limits.
        </CardDescription>
      </CardHeader>
      <CardContent className="flex flex-col gap-4">
        <Issues result={result} />
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
          <Stat label="Wheelbase" value={L(m?.wheelbase)} note={note("wheelbase")} />
          <Stat label="Trail" value={L(m?.trail)} note={note("trail")} />
          <Stat label="BB height" value={L(m?.bbHeight)} />
          <Stat label="BB drop" value={L(m?.bbDrop)} note={note("bbDrop")} />
          <Stat label="Chainstay length" value={L(m?.chainstayLength)} note={note("chainstayLength")} />
          <Stat label="Rear center" value={L(m?.rearCenter)} />
          <Stat label="Front center" value={L(m?.frontCenter)} />
          <Stat label="Standover" value={L(m?.standover)} />
          <Stat label="Seat tube (c-t)" value={L(m?.seatTubeLength)} />
          <Stat label="Seat tube (c-c)" value={L(m?.seatTubeLengthCC)} />
          <Stat label="Effective top tube" value={L(m?.effectiveTopTube)} />
          <Stat label="Head tube length" value={L(m?.headTubeLength)} />
          <Stat label="Stack" value={L(m?.stack)} />
          <Stat label="Reach" value={L(m?.reach)} />
          <Stat label="Top tube slope" value={m ? formatAngle(m.topTubeSlope) : "—"} />
          <Stat label="Toe clearance" value={L(m?.toeClearance)} />
          <Stat label="Rear tire to seat tube" value={L(m?.rearTireClearance)} />
          <Stat label="Front tire to down tube" value={L(m?.frontTireClearance)} />
        </div>
      </CardContent>
    </Card>
  )
}
