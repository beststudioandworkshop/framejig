"use client"

import {
  buildFrame,
  formatLengthValue,
  MATERIAL_LABELS,
  parseAngle,
  parseLength,
  switchDriver,
  type FrameInputs,
  type FrameMaterial,
  type FrameProcess,
  type FrameTubeSpecs,
  type LengthUnit,
  type BikeType,
  type Drivers,
  BIKE_TYPE_LABELS,
  stylesOf,
} from "@/lib/frame"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { FieldGroup, FieldLegend, FieldSet } from "@/components/ui/field"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group"
import { ValueInput } from "./value-input"

export type Update = (fn: (inputs: FrameInputs) => FrameInputs) => void

interface ControlsProps {
  inputs: FrameInputs
  unit: LengthUnit
  onUnit: (unit: LengthUnit) => void
  update: Update
  onBikeType: (type: BikeType) => void
  onBikeStyle: (style: string | null) => void
}

const TUBE_LABELS: Record<keyof FrameTubeSpecs, string> = {
  topTube: "Top tube",
  downTube: "Down tube",
  seatTube: "Seat tube",
  headTube: "Head tube",
  chainstay: "Chainstay",
  seatstay: "Seat stay",
}

interface DriverOption<K extends keyof Drivers> {
  value: Drivers[K]
  label: string
  field: keyof FrameInputs
  hint: string
}

const BB_OPTIONS: DriverOption<"bb">[] = [
  { value: "drop", label: "BB drop", field: "bbDrop", hint: "How far the bottom bracket sits below the axles." },
  { value: "height", label: "BB height", field: "bbHeight", hint: "Bottom bracket center, up from the ground." },
]
const REAR_OPTIONS: DriverOption<"rear">[] = [
  { value: "chainstay", label: "Chainstay", field: "chainstayLength", hint: "Bottom bracket to rear axle, side view." },
  { value: "rearCenter", label: "Rear center", field: "rearCenter", hint: "Level distance, bottom bracket to rear axle." },
]
const SEAT_OPTIONS: DriverOption<"seat">[] = [
  { value: "ct", label: "Seat tube c-t", field: "seatTubeLength", hint: "Bottom bracket center to the top of the tube." },
  { value: "cc", label: "Seat tube c-c", field: "seatTubeLengthCC", hint: "Bottom bracket center to the top tube centerline." },
]
const HORIZONTAL_OPTIONS: DriverOption<"horizontal">[] = [
  { value: "effectiveTopTube", label: "Eff. top tube", field: "effectiveTopTube", hint: "Level, from the seat tube line to the top of the head tube." },
  { value: "frontCenter", label: "Front center", field: "frontCenter", hint: "Straight line, bottom bracket to front axle." },
  { value: "reach", label: "Reach", field: "reach", hint: "Forward from the bottom bracket to the top of the head tube." },
]
const VERTICAL_OPTIONS: DriverOption<"vertical">[] = [
  { value: "headTubeLength", label: "Head tube", field: "headTubeLength", hint: "Worked-out stack is in the readouts." },
  { value: "stack", label: "Stack", field: "stack", hint: "Up from the bottom bracket to the top of the head tube." },
]

const BIKE_ITEMS = (Object.keys(BIKE_TYPE_LABELS) as BikeType[]).map((value) => ({ value, label: BIKE_TYPE_LABELS[value] }))
const MATERIAL_ITEMS = Object.entries(MATERIAL_LABELS).map(([value, label]) => ({ value, label }))
const PROCESS_ITEMS: { value: FrameProcess; label: string }[] = [
  { value: "tig", label: "TIG welded" },
  { value: "braze", label: "Fillet brazed" },
  { value: "lugged", label: "Lugged" },
]

export function Controls({ inputs, unit, onUnit, update, onBikeType, onBikeStyle }: ControlsProps) {
  const len = (label: string, key: keyof FrameInputs, hint?: string) => (
    <ValueInput
      label={label}
      unit={unit}
      hint={hint}
      value={inputs[key] as number}
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

  /** A row whose measurement you choose from a dropdown. */
  function driven<K extends keyof Drivers>(key: K, options: DriverOption<K>[]) {
    const current = options.find((o) => o.value === inputs.drivers[key]) ?? options[0]
    return (
      <ValueInput
        label={current.label}
        unit={unit}
        hint={current.hint}
        value={inputs[current.field] as number}
        parse={(t) => parseLength(t, unit)}
        format={(mm) => formatLengthValue(mm, unit)}
        onChange={(v) => update((i) => ({ ...i, [current.field]: v }))}
        labelNode={
          <Select
            items={options.map((o) => ({ value: o.value as string, label: o.label }))}
            value={current.value as string}
            onValueChange={(v) => update((i) => switchDriver(i, buildFrame(i), key, v as Drivers[K]))}
          >
            <SelectTrigger size="sm" className="min-w-0 flex-1" aria-label={`${current.label}: measured as`}>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {options.map((o) => (
                <SelectItem key={o.value as string} value={o.value as string}>
                  {o.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        }
      />
    )
  }

  const styleItems = [{ value: "general", label: "General" }, ...stylesOf(inputs.bikeType).map((st) => ({ value: st.id, label: st.label }))]

  return (
    <Card className="card-tone tone-tangerine entry-zone">
      <CardHeader>
        <CardTitle>Your frame</CardTitle>
        <CardDescription>Everything is in the side view, measured from the center of the bottom bracket.</CardDescription>
      </CardHeader>
      <CardContent className="flex flex-col gap-6">
        <div className="flex flex-wrap items-center gap-x-6 gap-y-3">
          <div className="flex flex-col gap-1.5">
            <span className="text-sm font-medium">Bike type</span>
            <Select
              items={BIKE_ITEMS}
              value={inputs.bikeType}
              onValueChange={(v) => onBikeType(v as BikeType)}
            >
              <SelectTrigger className="w-40" aria-label="Bike type">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {BIKE_ITEMS.map((o) => (
                  <SelectItem key={o.value} value={o.value}>
                    {o.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="flex flex-col gap-1.5">
            <span className="text-sm font-medium">Style</span>
            <Select
              items={styleItems}
              value={inputs.bikeStyle ?? "general"}
              onValueChange={(v) => onBikeStyle(v === "general" ? null : (v as string))}
            >
              <SelectTrigger className="w-44" aria-label="Bike style">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {styleItems.map((o) => (
                  <SelectItem key={o.value} value={o.value}>
                    {o.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
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
        </div>

        <FieldSet>
          <FieldLegend variant="label">Main triangle</FieldLegend>
          <FieldGroup className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            {angle("Seat tube angle", "seatTubeAngle", "From horizontal.")}
            {angle("Head tube angle", "headTubeAngle", "From horizontal.")}
            {driven("seat", SEAT_OPTIONS)}
            {len("Seat tube extension", "seatTubeExtension", "How far it sticks up past the top tube.")}
            {driven("horizontal", HORIZONTAL_OPTIONS)}
            {driven("vertical", VERTICAL_OPTIONS)}
          </FieldGroup>
        </FieldSet>

        <FieldSet>
          <FieldLegend variant="label">Rear end and bottom bracket</FieldLegend>
          <FieldGroup className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            {driven("bb", BB_OPTIONS)}
            {driven("rear", REAR_OPTIONS)}
          </FieldGroup>
        </FieldSet>

        <FieldSet>
          <FieldLegend variant="label">Fork and wheels</FieldLegend>
          <FieldGroup className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            {len("Fork axle-to-crown", "forkAxleToCrown", inputs.bikeType === "mountain" ? "As the maker publishes it, to the crown race. For a suspension fork, use the length at the sag you ride at." : "As the maker publishes it, to the crown race.")}
            {len("Fork rake (offset)", "forkRake")}
            {len("Lower headset", "headsetStack", "How far the head tube bottom sits above that measurement. About 10 mm for a standard headset.")}
            <ValueInput
              label="Rim diameter"
              unit={unit}
              hint="622 mm for 700c and 29-inch, 584 mm for 27.5-inch."
              value={inputs.wheel.rimDiameter}
              parse={(t) => parseLength(t, unit)}
              format={(mm) => formatLengthValue(mm, unit)}
              onChange={(v) => update((i) => ({ ...i, wheel: { ...i.wheel, rimDiameter: v } }))}
            />
            <ValueInput
              label="Tire section"
              unit={unit}
              hint="The tire's height off the rim."
              value={inputs.wheel.tireSection}
              parse={(t) => parseLength(t, unit)}
              format={(mm) => formatLengthValue(mm, unit)}
              onChange={(v) => update((i) => ({ ...i, wheel: { ...i.wheel, tireSection: v } }))}
            />
          </FieldGroup>
        </FieldSet>

        <FieldSet>
          <FieldLegend variant="label">For the toe overlap check</FieldLegend>
          <FieldGroup className="grid grid-cols-1 gap-4 sm:grid-cols-2">
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
