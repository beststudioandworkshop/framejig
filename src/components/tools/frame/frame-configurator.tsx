"use client"

import { useMemo, useState } from "react"
import { ArrowRightIcon, InfoIcon } from "lucide-react"
import Link from "next/link"

import { BIKE_TYPE_LABELS, buildFrame, DEFAULT_INPUTS, PRESETS, toolLink, type BikeType, type FrameInputs, type LengthUnit } from "@/lib/frame"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { toast } from "sonner"
import { Controls } from "./controls"
import { CopyLinkButton } from "./copy-link-button"
import { Readouts } from "./readouts"
import { RideFeelCard } from "./ride-feel-card"
import { SaveLoadCard } from "./save-load-card"
import { SideView } from "./side-view"
import { TubeSchedule } from "./tube-schedule"

interface FrameConfiguratorProps {
  /** A frame restored from a link. */
  initial?: FrameInputs | null
  initialReference?: FrameInputs | null
}

export function FrameConfigurator({ initial, initialReference }: FrameConfiguratorProps) {
  const [inputs, setInputs] = useState<FrameInputs>(initial ?? DEFAULT_INPUTS)
  const [unit, setUnit] = useState<LengthUnit>("mm")
  const [reference, setReference] = useState<FrameInputs | null>(initialReference ?? null)
  const result = useMemo(() => buildFrame(inputs), [inputs])
  const referenceResult = useMemo(() => (reference ? buildFrame(reference) : null), [reference])

  const changeBikeType = (type: BikeType) => {
    if (type === inputs.bikeType) return
    const before = inputs
    setInputs({ ...inputs, bikeType: type })
    toast(`Switched to ${BIKE_TYPE_LABELS[type].toLowerCase()}. Your numbers are unchanged.`, {
      action: {
        label: `Load an example ${BIKE_TYPE_LABELS[type].toLowerCase()} frame`,
        onClick: () => setInputs(PRESETS[type]),
      },
      cancel: { label: "Undo", onClick: () => setInputs(before) },
    })
  }

  const load = (frame: FrameInputs, ref: FrameInputs | null, name: string) => {
    const before = { inputs, reference }
    setInputs(frame)
    setReference(ref)
    toast(`Loaded "${name}"`, {
      action: {
        label: "Undo",
        onClick: () => {
          setInputs(before.inputs)
          setReference(before.reference)
        },
      },
    })
  }

  const jigHref = useMemo(() => toolLink("jig", inputs, reference), [inputs, reference])
  const frameHref = useMemo(() => toolLink("frame", inputs, reference), [inputs, reference])

  return (
    <div className="flex flex-col gap-6">
      <div className="flex justify-end">
        <CopyLinkButton href={frameHref} label="Copy link to this frame" />
      </div>
      <SaveLoadCard inputs={inputs} reference={reference} onLoad={load} />
      <Alert>
        <InfoIcon />
        <AlertTitle>A geometry planner, not an engineering check</AlertTitle>
        <AlertDescription>
          Frames carry a rider. This tool lays out the shape. It says nothing about strength, fatigue or whether a
          tube is right for the job. The starting numbers are examples.
        </AlertDescription>
      </Alert>
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-5">
        <div className="min-w-0 lg:col-span-2">
          <Controls inputs={inputs} unit={unit} onUnit={setUnit} update={setInputs} onBikeType={changeBikeType} />
        </div>
        <div className="flex min-w-0 flex-col gap-6 lg:col-span-3">
          <SideView
            inputs={inputs}
            result={result}
            unit={unit}
            reference={reference}
            referenceResult={referenceResult}
            onPin={() => setReference(inputs)}
            onClear={() => setReference(null)}
            transferHref={jigHref}
          />
          <Readouts inputs={inputs} result={result} unit={unit} />
          <RideFeelCard inputs={inputs} result={result} unit={unit} />
          <TubeSchedule result={result} unit={unit} />
          <Card className="card-tone tone-lavender">
            <CardHeader>
              <CardTitle>Next: the jig</CardTitle>
              <CardDescription>
                Sends every dimension of this frame{reference ? " and the reference" : ""} to the jig tool: positions from
                the fixed rear axle, a parts list, and the tools you&apos;ll need. Come back with &quot;Edit the frame&quot;
                and nothing is lost.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button render={<Link href={jigHref} />} disabled={!result.ok}>
                Transfer dims to the jig tool <ArrowRightIcon />
              </Button>
              {!result.ok && <p className="mt-2 text-sm text-muted-foreground">Fix the problems above first.</p>}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
