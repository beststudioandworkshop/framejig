"use client"

import { useMemo, useState } from "react"
import { InfoIcon } from "lucide-react"

import {
  buildFrame,
  buildJig,
  DEFAULT_INPUTS,
  DEFAULT_JIG,
  jigParts,
  type FrameInputs,
  type JigSettings,
  type LengthUnit,
} from "@/lib/frame"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Controls } from "./controls"
import { JigCard } from "./jig-card"
import { JigPartsCard } from "./jig-parts-card"
import { Readouts } from "./readouts"
import { SideView } from "./side-view"
import { ToolsCard } from "./tools-card"
import { TubeSchedule } from "./tube-schedule"

export function FrameConfigurator() {
  const [inputs, setInputs] = useState<FrameInputs>(DEFAULT_INPUTS)
  const [unit, setUnit] = useState<LengthUnit>("mm")
  const [reference, setReference] = useState<FrameInputs | null>(null)
  const [jigSettings, setJigSettings] = useState<JigSettings>(DEFAULT_JIG)
  const result = useMemo(() => buildFrame(inputs), [inputs])
  const referenceResult = useMemo(() => (reference ? buildFrame(reference) : null), [reference])

  const jig = useMemo(() => buildJig(inputs, result, jigSettings), [inputs, result, jigSettings])
  const referenceJig = useMemo(
    () => (reference && referenceResult ? buildJig(reference, referenceResult, jigSettings) : null),
    [reference, referenceResult, jigSettings],
  )
  const parts = useMemo(() => jigParts([jig, referenceJig]), [jig, referenceJig])

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
          />
          <Readouts inputs={inputs} result={result} unit={unit} />
          <TubeSchedule result={result} unit={unit} />
          <JigCard inputs={inputs} jig={jig} referenceJig={referenceJig} unit={unit} settings={jigSettings} onSettings={setJigSettings} />
          <JigPartsCard inputs={inputs} result={result} jig={jig} parts={parts} unit={unit} />
          <ToolsCard inputs={inputs} />
        </div>
      </div>
    </div>
  )
}
