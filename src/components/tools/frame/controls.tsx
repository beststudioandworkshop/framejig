"use client"

import {
  buildFrame,
  formatLengthValue,
  MATERIAL_LABELS,
  parseAngle,
  parseLength,
  switchMode,
  type FrameInputs,
  type FrameMaterial,
  type FrameProcess,
  type FrameResult,
  type FrameTubeSpecs,
  type LengthUnit,
  type SpecMode,
} from "@/lib/frame"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { FieldGroup, FieldLegend, FieldSet } from "@/components/ui/field"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group"
import { ValueInput } from "./value-input"

export type Update = (fn: (inputs: FrameInputs) => FrameInputs) => void

interface ControlsProps {
  inputs: FrameInputs
  result: FrameResult
  unit: LengthUnit
  onUnit: (unit: LengthUnit) => void
  update: Update
}

const TUBE_LABELS: Record<keyof FrameTubeSpecs, string> = {
  topTube: "Top tube",
  downTube: "Down tube",
  seatTube: "Seat tube",
  headTube: "Head tube",
  chainstay: "Chainstay",
  seatstay: "Seat stay",
}

const MATERIAL_ITEMS = Object.entries(MATERIAL_LABELS).map(([value, label]) => ({ value, label }))
const PROCESS_ITEMS: { value: FrameProcess; label: string }[] = [
  { value: "tig", label: "TIG welded" },
  { value: "braze", label: "Fillet brazed" },
  { value: "lugged", label: "Lugged" },
]

export function Controls({ inputs, result, unit, onUnit, update }: ControlsProps) {
  const len = (label: string, key: keyof FrameInputs, hint?: string, derived?: { value?: number }) => (
    <ValueInput
      label={label}
      unit={unit}
      hint={hint}
      value={derived?.value ?? (inputs[key] as number)}
      disabled={derived !== undefined}
      parse={(t) => parseLength(t, unit)}
      format={(mm) => formatLengthValue(mm, unit)}
      onChange={(v) => update((i) => ({ ...i, [key]: v }))}
    />
  )
  const angle = (label: string, key: "seatTubeAngle" | "headTubeAngle", hint?: string) => (
    <ValueInput
      label={label}
      unit="°"
      hint={hint}
      value={inputs[key]}
      parse={parseAngle}
      format={(d) => String(Number(d.toFixed(2)))}
      onChange={(v) => update((i) => ({ ...i, [key]: v }))}
    />
  )

  const m = result.metrics
  const fit = inputs.mode === "fit"
  const setMode = (mode: SpecMode) => update((i) => switchMode(i, buildFrame(i), mode))

  return (
    <Card>
      <CardHeader>
        <CardTitle>Your frame</CardTitle>
        <CardDescription>Everything is in the side view, measured from the centre of the bottom bracket.</CardDescription>
      </CardHeader>
      <CardContent className="flex flex-col gap-6">
        <div className="flex flex-wrap items-center gap-x-6 gap-y-3">
          <div className="flex flex-col gap-1.5">
            <span className="text-sm font-medium">Units</span>
            <ToggleGroup
              variant="outline"
              spacing={0}
              value={[unit]}
              onValueChange={(v) => v[0] && onUnit(v[0] as LengthUnit)}
              aria-label="Units"
            >
              <ToggleGroupItem value="mm">mm</ToggleGroupItem>
              <ToggleGroupItem value="in">inches</ToggleGroupItem>
            </ToggleGroup>
          </div>
          <div className="flex flex-col gap-1.5">
            <span className="text-sm font-medium">Specify the frame by</span>
            <ToggleGroup
              variant="outline"
              spacing={0}
              value={[inputs.mode]}
              onValueChange={(v) => v[0] && setMode(v[0] as SpecMode)}
              aria-label="Specify the frame by"
            >
              <ToggleGroupItem value="numbers">Tube lengths</ToggleGroupItem>
              <ToggleGroupItem value="fit">Stack and reach</ToggleGroupItem>
            </ToggleGroup>
          </div>
        </div>

        <FieldSet>
          <FieldLegend variant="label">Main triangle</FieldLegend>
          <FieldGroup className="grid gap-4 sm:grid-cols-2">
            {angle("Seat tube angle", "seatTubeAngle", "From horizontal.")}
            {angle("Head tube angle", "headTubeAngle", "From horizontal.")}
            {len("Seat tube length", "seatTubeLength", "Bottom bracket centre to the top of the tube.")}
            {len("Seat tube extension", "seatTubeExtension", "How far it sticks up past the top tube.")}
            {fit ? (
              <>
                {len("Stack", "stack", "Up from the bottom bracket to the top of the head tube.")}
                {len("Reach", "reach", "Forward from the bottom bracket to the top of the head tube.")}
                {len("Effective top tube", "effectiveTopTube", "Worked out from stack and reach.", { value: m?.effectiveTopTube })}
                {len("Head tube length", "headTubeLength", "Worked out from stack and the fork.", { value: m?.headTubeLength })}
              </>
            ) : (
              <>
                {len("Effective top tube", "effectiveTopTube", "Level distance between the seat and head tube.")}
                {len("Head tube length", "headTubeLength")}
                {len("Stack", "stack", "Worked out from the numbers above.", { value: m?.stack })}
                {len("Reach", "reach", "Worked out from the numbers above.", { value: m?.reach })}
              </>
            )}
          </FieldGroup>
        </FieldSet>

        <FieldSet>
          <FieldLegend variant="label">Rear end and bottom bracket</FieldLegend>
          <FieldGroup className="grid gap-4 sm:grid-cols-2">
            {len("Bottom bracket drop", "bbDrop", "How far the bottom bracket sits below the axles.")}
            {len("Chainstay length", "chainstayLength", "Bottom bracket to rear axle, side view.")}
          </FieldGroup>
        </FieldSet>

        <FieldSet>
          <FieldLegend variant="label">Fork and wheels</FieldLegend>
          <FieldGroup className="grid gap-4 sm:grid-cols-2">
            {len("Fork axle-to-crown", "forkAxleToCrown", "To the bottom of the head tube.")}
            {len("Fork rake (offset)", "forkRake")}
            <ValueInput
              label="Rim diameter"
              unit={unit}
              hint="622 mm for 700c."
              value={inputs.wheel.rimDiameter}
              parse={(t) => parseLength(t, unit)}
              format={(mm) => formatLengthValue(mm, unit)}
              onChange={(v) => update((i) => ({ ...i, wheel: { ...i.wheel, rimDiameter: v } }))}
            />
            <ValueInput
              label="Tyre section"
              unit={unit}
              hint="The tyre's height off the rim."
              value={inputs.wheel.tyreSection}
              parse={(t) => parseLength(t, unit)}
              format={(mm) => formatLengthValue(mm, unit)}
              onChange={(v) => update((i) => ({ ...i, wheel: { ...i.wheel, tyreSection: v } }))}
            />
          </FieldGroup>
        </FieldSet>

        <FieldSet>
          <FieldLegend variant="label">For the toe overlap check</FieldLegend>
          <FieldGroup className="grid gap-4 sm:grid-cols-2">
            {len("Crank length", "crankLength")}
            {len("Pedal axle to toe", "toeProjection", "How far your shoe reaches past the pedal.")}
          </FieldGroup>
        </FieldSet>

        <FieldSet>
          <FieldLegend variant="label">Tubing</FieldLegend>
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
            <div className="flex flex-col gap-1.5">
              <span className="text-sm font-medium">Material</span>
              <Select
                items={MATERIAL_ITEMS}
                value={inputs.material}
                onValueChange={(v) => update((i) => ({ ...i, material: v as FrameMaterial }))}
              >
                <SelectTrigger className="w-full" aria-label="Material">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {MATERIAL_ITEMS.map((o) => (
                    <SelectItem key={o.value} value={o.value}>
                      {o.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="flex flex-col gap-1.5">
              <span className="text-sm font-medium">Joined by</span>
              <Select
                items={PROCESS_ITEMS}
                value={inputs.process}
                onValueChange={(v) => update((i) => ({ ...i, process: v as FrameProcess }))}
              >
                <SelectTrigger className="w-full" aria-label="Joined by">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {PROCESS_ITEMS.map((o) => (
                    <SelectItem key={o.value} value={o.value}>
                      {o.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="flex flex-col gap-3">
            <div className="grid grid-cols-[minmax(0,1fr)_6rem_6rem] items-center gap-x-3 text-sm text-muted-foreground">
              <span />
              <span>Diameter ({unit})</span>
              <span>Wall ({unit})</span>
            </div>
            {(Object.keys(TUBE_LABELS) as (keyof FrameTubeSpecs)[]).map((role) => (
              <div key={role} className="grid grid-cols-[minmax(0,1fr)_6rem_6rem] items-center gap-x-3">
                <span className="text-sm">{TUBE_LABELS[role]}</span>
                {(["diameter", "wall"] as const).map((dim) => (
                  <ValueInput
                    key={dim}
                    hideLabel
                    label={`${TUBE_LABELS[role]} ${dim}`}
                    unit={unit}
                    value={inputs.tubes[role][dim]}
                    parse={(t) => parseLength(t, unit)}
                    format={(mm) => formatLengthValue(mm, unit)}
                    onChange={(v) =>
                      update((i) => ({ ...i, tubes: { ...i.tubes, [role]: { ...i.tubes[role], [dim]: v } } }))
                    }
                  />
                ))}
              </div>
            ))}
          </div>
        </FieldSet>
      </CardContent>
    </Card>
  )
}
