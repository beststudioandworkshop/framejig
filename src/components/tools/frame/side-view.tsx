"use client"

import { useState } from "react"

import {
  alignOffset,
  buildDrawing,
  compareFrames,
  formatLengthValue,
  type FrameInputs,
  type FrameResult,
  type LengthUnit,
} from "@/lib/frame"
import { Button } from "@/components/ui/button"
import { Card, CardAction, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group"
import { FrameDrawing } from "./frame-drawing"

type Anchor = "bb" | "rearAxle" | "frontAxle"

interface SideViewProps {
  inputs: FrameInputs
  result: FrameResult
  unit: LengthUnit
  reference: FrameInputs | null
  referenceResult: FrameResult | null
  onPin: () => void
  onClear: () => void
}

const signed = (n: number, text: string) => (Math.abs(n) < 0.05 ? "0" : `${n > 0 ? "+" : "−"}${text}`)

export function SideView({ inputs, result, unit, reference, referenceResult, onPin, onClear }: SideViewProps) {
  const [showDimensions, setShowDimensions] = useState(true)
  const [anchor, setAnchor] = useState<Anchor>("bb")

  const drawing = buildDrawing(inputs, result)
  const refDrawing =
    reference && referenceResult && result.points && referenceResult.points
      ? buildDrawing(reference, referenceResult, alignOffset(result.points, referenceResult.points, anchor))
      : null
  const rows = reference && referenceResult ? compareFrames(inputs, result, reference, referenceResult) : null

  return (
    <Card>
      <CardHeader>
        <CardTitle>Side view</CardTitle>
        <CardDescription>
          {refDrawing
            ? "Solid is your frame. Dashed is the reference you pinned."
            : "Drawn to scale from the numbers. Pin a frame as a reference, then change your numbers to compare."}
        </CardDescription>
        <CardAction className="flex gap-2">
          <Button variant="outline" size="sm" onClick={onPin} disabled={!result.metrics}>
            {reference ? "Re-pin as reference" : "Pin as reference"}
          </Button>
          {reference && (
            <Button variant="ghost" size="sm" onClick={onClear}>
              Clear
            </Button>
          )}
        </CardAction>
      </CardHeader>
      <CardContent className="flex flex-col gap-4">
        <div className="flex flex-wrap items-center gap-x-6 gap-y-3">
          <Label className="gap-2">
            <Switch size="sm" checked={showDimensions} onCheckedChange={setShowDimensions} />
            Dimensions
          </Label>
          {refDrawing && (
            <div className="flex items-center gap-2">
              <span className="text-sm font-medium">Line up at</span>
              <ToggleGroup
                variant="outline"
                size="sm"
                spacing={0}
                value={[anchor]}
                onValueChange={(v) => v[0] && setAnchor(v[0] as Anchor)}
                aria-label="Line the reference up at"
              >
                <ToggleGroupItem value="bb">Bottom bracket</ToggleGroupItem>
                <ToggleGroupItem value="rearAxle">Rear axle</ToggleGroupItem>
                <ToggleGroupItem value="frontAxle">Front axle</ToggleGroupItem>
              </ToggleGroup>
            </div>
          )}
        </div>

        {drawing ? (
          <div className="overflow-x-auto">
            <FrameDrawing drawing={drawing} reference={refDrawing} showDimensions={showDimensions} unit={unit} />
          </div>
        ) : (
          <p className="text-sm text-muted-foreground">Fix the problems below to see the drawing.</p>
        )}

        {rows && (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Against the reference ({unit})</TableHead>
                <TableHead className="text-right">Yours</TableHead>
                <TableHead className="text-right">Reference</TableHead>
                <TableHead className="text-right">Difference</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {rows.map((r) => {
                const f = (n: number) => (r.unit === "°" ? `${Number(n.toFixed(1))}°` : formatLengthValue(n, unit))
                return (
                  <TableRow key={r.key}>
                    <TableCell className="font-medium">{r.label}</TableCell>
                    <TableCell className="text-right tabular-nums">{f(r.value)}</TableCell>
                    <TableCell className="text-right tabular-nums">{f(r.reference)}</TableCell>
                    <TableCell
                      className={`text-right font-mono tabular-nums ${Math.abs(r.delta) < 0.05 ? "text-muted-foreground" : ""}`}
                    >
                      {signed(r.delta, f(Math.abs(r.delta)))}
                    </TableCell>
                  </TableRow>
                )
              })}
            </TableBody>
          </Table>
        )}
      </CardContent>
    </Card>
  )
}
