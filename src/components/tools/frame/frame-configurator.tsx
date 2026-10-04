"use client"

import { useMemo, useState } from "react"
import { InfoIcon } from "lucide-react"

import { buildFrame, DEFAULT_INPUTS, type FrameInputs, type LengthUnit } from "@/lib/frame"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Controls } from "./controls"
import { Readouts } from "./readouts"
import { TubeSchedule } from "./tube-schedule"

export function FrameConfigurator() {
  const [inputs, setInputs] = useState<FrameInputs>(DEFAULT_INPUTS)
  const [unit, setUnit] = useState<LengthUnit>("mm")
  const result = useMemo(() => buildFrame(inputs), [inputs])

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
          <Readouts inputs={inputs} result={result} unit={unit} />
          <TubeSchedule result={result} unit={unit} />
        </div>
      </div>
    </div>
  )
}
