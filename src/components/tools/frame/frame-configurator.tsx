"use client"

import { useMemo, useState } from "react"
import { ArrowRightIcon, InfoIcon } from "lucide-react"
import Link from "next/link"

import { buildFrame, DEFAULT_INPUTS, encodeFrame, type FrameInputs, type LengthUnit } from "@/lib/frame"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Controls } from "./controls"
import { Readouts } from "./readouts"
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

  const jigHref = useMemo(() => {
    const q = new URLSearchParams({ d: encodeFrame(inputs) })
    if (reference) q.set("r", encodeFrame(reference))
    return `/tools/jig?${q.toString()}`
  }, [inputs, reference])

  return (
    <div className="flex flex-col gap-6">
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
          <Controls inputs={inputs} unit={unit} onUnit={setUnit} update={setInputs} />
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
          <TubeSchedule result={result} unit={unit} />
          <Card>
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
