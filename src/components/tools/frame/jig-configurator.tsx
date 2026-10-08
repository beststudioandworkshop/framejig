"use client"

import { useMemo, useState } from "react"
import { ArrowLeftIcon, InfoIcon } from "lucide-react"
import Link from "next/link"

import {
  buildFrame,
  buildJig,
  DEFAULT_INPUTS,
  DEFAULT_JIG,
  toolLink,
  formatAngle,
  formatLengthValue,
  jigParts,
  type FrameInputs,
  type JigSettings,
  type LengthUnit,
} from "@/lib/frame"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Button } from "@/components/ui/button"
import { Card, CardAction, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group"
import { BuildingNotesCard } from "./building-notes-card"
import { CopyLinkButton } from "./copy-link-button"
import { Issues } from "./readouts"
import { JigCard } from "./jig-card"
import { JigPartsCard } from "./jig-parts-card"
import { ToolsCard } from "./tools-card"

interface JigConfiguratorProps {
  /** The frame from the link, or null if there wasn't one. */
  frame: FrameInputs | null
  reference: FrameInputs | null
}

export function JigConfigurator({ frame, reference }: JigConfiguratorProps) {
  const [unit, setUnit] = useState<LengthUnit>("mm")
  const [settings, setSettings] = useState<JigSettings>(DEFAULT_JIG)
  const [widths, setWidths] = useState<Partial<Pick<FrameInputs, "bbShellWidth" | "rearSpacing">>>({})

  const inputs = useMemo<FrameInputs>(() => ({ ...(frame ?? DEFAULT_INPUTS), ...widths }), [frame, widths])
  const refInputs = useMemo<FrameInputs | null>(() => (reference ? { ...reference, ...widths } : null), [reference, widths])
  const result = useMemo(() => buildFrame(inputs), [inputs])
  const refResult = useMemo(() => (refInputs ? buildFrame(refInputs) : null), [refInputs])
  const jig = useMemo(() => buildJig(inputs, result, settings), [inputs, result, settings])
  const refJig = useMemo(
    () => (refInputs && refResult ? buildJig(refInputs, refResult, settings) : null),
    [refInputs, refResult, settings],
  )
  const parts = useMemo(() => jigParts([jig, refJig]), [jig, refJig])

  const editHref = useMemo(() => toolLink("frame", inputs, refInputs), [inputs, refInputs])
  const jigHref = useMemo(() => toolLink("jig", inputs, refInputs), [inputs, refInputs])

  const m = result.metrics
  const L = (mm: number | undefined) => (mm === undefined ? "–" : `${formatLengthValue(mm, unit)} ${unit}`)

  return (
    <div className="flex flex-col gap-6">
      <div className="flex justify-end">
        <CopyLinkButton href={jigHref} label="Copy link to this jig" />
      </div>
      <Alert>
        <InfoIcon />
        <AlertTitle>Settings for a jig, not a guarantee</AlertTitle>
        <AlertDescription>
          These positions follow from the frame you drew. Check every number against your tubes, and measure the jig
          against the tape checks before you tack anything.
        </AlertDescription>
      </Alert>

      {!frame && (
        <Alert>
          <InfoIcon />
          <AlertTitle>No frame in the link</AlertTitle>
          <AlertDescription>
            This is the example frame. Design yours in the frame tool and open the jig from there to bring it here.
          </AlertDescription>
        </Alert>
      )}

      <Card className="card-tone tone-sky">
        <CardHeader>
          <CardTitle>The frame</CardTitle>
          <CardDescription>
            {refInputs ? "Your frame, and the reference you pinned. The jig is sized to hold both." : "From the frame tool."}
          </CardDescription>
          <CardAction className="flex flex-wrap items-center gap-2">
            <ToggleGroup
              variant="outline"
              size="sm"
              spacing={0}
              value={[unit]}
              onValueChange={(v) => v[0] && setUnit(v[0] as LengthUnit)}
              aria-label="Units"
            >
              <ToggleGroupItem value="mm">mm</ToggleGroupItem>
              <ToggleGroupItem value="in">inches</ToggleGroupItem>
            </ToggleGroup>
            <Button variant="outline" size="sm" render={<Link href={editHref} />}>
              <ArrowLeftIcon /> Edit the frame
            </Button>
          </CardAction>
        </CardHeader>
        <CardContent className="flex flex-col gap-4">
          <Issues result={result} />
          <dl className="grid grid-cols-2 gap-3 text-sm sm:grid-cols-4">
            {[
              ["Wheelbase", L(m?.wheelbase)],
              ["Chainstay", L(m?.chainstayLength)],
              ["BB drop", L(m?.bbDrop)],
              ["Stack", L(m?.stack)],
              ["Reach", L(m?.reach)],
              ["Head angle", formatAngle(inputs.headTubeAngle)],
              ["Seat angle", formatAngle(inputs.seatTubeAngle)],
              ["Seat tube (c-t)", L(m?.seatTubeLength)],
            ].map(([k, v]) => (
              <div key={k} className="flex flex-col gap-0.5 rounded-lg border p-3">
                <dt className="text-muted-foreground">{k}</dt>
                <dd className="font-mono tabular-nums">{v}</dd>
              </div>
            ))}
          </dl>
        </CardContent>
      </Card>

      <JigCard
        inputs={inputs}
        result={result}
        parts={parts}
        jig={jig}
        referenceJig={refJig}
        unit={unit}
        settings={settings}
        onSettings={setSettings}
        onWidths={(w) => setWidths((prev) => ({ ...prev, ...w }))}
      />
      <JigPartsCard parts={parts} unit={unit} />
      <ToolsCard inputs={inputs} />
      <BuildingNotesCard inputs={inputs} />
    </div>
  )
}
