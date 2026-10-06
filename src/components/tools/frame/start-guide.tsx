"use client"

import { useMemo, useState } from "react"
import { ArrowRightIcon, InfoIcon } from "lucide-react"
import Link from "next/link"

import {
  BIKE_TYPES,
  BIKE_TYPE_LABELS,
  buildDrawing,
  buildFrame,
  CATEGORIES,
  formatFeetInches,
  formatLengthValue,
  parseLength,
  rideFeel,
  sizedFrame,
  sizeInfo,
  SIZES,
  suggestSize,
  toolLink,
  type BikeType,
  type LengthUnit,
  type RangeKey,
  type SizeId,
} from "@/lib/frame"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group"
import { FrameDrawing } from "./frame-drawing"
import { ValueInput } from "./value-input"

const RANGE_ROWS: RangeKey[] = ["headTubeAngle", "seatTubeAngle", "trail", "wheelbase", "chainstayLength", "bbDrop"]

export function StartGuide() {
  const [type, setType] = useState<BikeType>("road")
  const [size, setSize] = useState<SizeId>("M")
  const [unit, setUnit] = useState<LengthUnit>("mm")
  const [height, setHeight] = useState<number | null>(null)
  const [inseam, setInseam] = useState<number | null>(null)

  const cat = CATEGORIES[type]
  const frame = useMemo(() => sizedFrame(type, size), [type, size])
  const result = useMemo(() => buildFrame(frame), [frame])
  const drawing = useMemo(() => buildDrawing(frame, result), [frame, result])
  const feel = useMemo(() => (result.metrics ? rideFeel(frame, result.metrics, { inseam }) : null), [frame, result, inseam])
  const suggestion = height === null ? null : suggestSize(height)
  const m = result.metrics
  const f = (mm: number | undefined) => (mm === undefined ? "–" : `${formatLengthValue(mm, unit)} ${unit}`)
  const fmtRange = (k: RangeKey) => {
    const r = cat.ranges[k]
    return r.unit === "°" ? `${r.low}° to ${r.high}°` : `${formatLengthValue(r.low, unit)} to ${formatLengthValue(r.high, unit)} ${unit}`
  }
  const standover = feel?.notes.find((n) => n.startsWith("Standover"))

  const onHeight = (mm: number) => {
    setHeight(mm)
    const s = suggestSize(mm)
    if (s) setSize(s.size)
  }

  return (
    <div className="flex flex-col gap-6">
      <Card className="card-tone tone-sky">
        <CardHeader>
          <CardTitle>Pick the kind of bike</CardTitle>
          <CardDescription>
            Each kind of bike has its own shape, for a reason. Read what makes it ride the way it does, pick a size, and
            open it in the frame tool as your starting point.
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-wrap items-center justify-between gap-3">
          <Tabs value={type} onValueChange={(v) => setType(v as BikeType)}>
            <TabsList className="h-auto flex-wrap">
              {BIKE_TYPES.map((t) => (
                <TabsTrigger key={t} value={t}>
                  {BIKE_TYPE_LABELS[t]}
                </TabsTrigger>
              ))}
            </TabsList>
          </Tabs>
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
        </CardContent>
      </Card>

      <Card className="card-tone tone-tangerine">
        <CardHeader>
          <CardTitle>{cat.label}: {cat.tagline}</CardTitle>
          <CardDescription>{cat.forWhat}</CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-4">
          <Alert>
            <InfoIcon />
            <AlertTitle>These numbers are estimates</AlertTitle>
            <AlertDescription>
              {cat.reference} Ranges are for a medium and are rules of thumb, not limits. Real bikes sit outside them for good
              reasons.
            </AlertDescription>
          </Alert>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Measure</TableHead>
                <TableHead>Typical</TableHead>
                <TableHead>Why</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {RANGE_ROWS.map((k) => (
                <TableRow key={k}>
                  <TableCell className="font-medium whitespace-normal">{cat.ranges[k].label}</TableCell>
                  <TableCell className="font-mono whitespace-nowrap tabular-nums">{fmtRange(k)}</TableCell>
                  <TableCell className="whitespace-normal">{cat.rangeWhy[k]}</TableCell>
                </TableRow>
              ))}
              <TableRow>
                <TableCell className="font-medium whitespace-normal">Stack to reach</TableCell>
                <TableCell className="font-mono whitespace-nowrap tabular-nums">
                  {cat.positionRange.low.toFixed(2)} to {cat.positionRange.high.toFixed(2)}
                </TableCell>
                <TableCell className="whitespace-normal">{cat.rangeWhy.position}</TableCell>
              </TableRow>
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <div className="grid gap-6 md:grid-cols-2">
        <Card className="card-tone tone-tea">
          <CardHeader>
            <CardTitle>What makes it feel the way it does</CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="flex flex-col gap-3">
              {cat.feel.map((n) => (
                <li key={n.title} className="flex flex-col gap-0.5">
                  <h3 className="text-sm font-medium">{n.title}</h3>
                  <p className="text-sm text-muted-foreground">{n.text}</p>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
        <Card className="card-tone tone-mustard">
          <CardHeader>
            <CardTitle>What varies inside this kind of bike</CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="flex flex-col gap-3">
              {cat.variables.map((n) => (
                <li key={n.title} className="flex flex-col gap-0.5">
                  <h3 className="text-sm font-medium">{n.title}</h3>
                  <p className="text-sm text-muted-foreground">{n.text}</p>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      </div>

      <Card className="card-tone tone-lavender entry-zone">
        <CardHeader>
          <CardTitle>Start from a size</CardTitle>
          <CardDescription>
            Pick a size, or tell me about the rider and I&apos;ll suggest one. The {cat.label.toLowerCase()} example frame
            in that size becomes your starting point in the frame tool. Sizing differs a lot between makers, so treat the
            rider heights as rough.
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-6">
          <div className="flex flex-col gap-1.5">
            <span className="text-sm font-medium">Size</span>
            <ToggleGroup
              variant="outline"
              spacing={0}
              value={[size]}
              onValueChange={(v) => v[0] && setSize(v[0] as SizeId)}
              aria-label="Size"
              className="flex-wrap"
            >
              {SIZES.map((s) => (
                <ToggleGroupItem key={s.id} value={s.id} aria-label={`${s.label}, about ${s.riderCm[0]} to ${s.riderCm[1]} centimeters`}>
                  {s.id}
                </ToggleGroupItem>
              ))}
            </ToggleGroup>
            <p className="text-sm text-muted-foreground">
              {sizeInfo(size).label}: riders about {sizeInfo(size).riderCm[0]} to {sizeInfo(size).riderCm[1]} cm
            </p>
          </div>

          <div className="flex flex-col gap-3 rounded-lg border p-3">
            <h3 className="text-sm font-medium">Or start from the rider</h3>
            <div className="grid gap-4 sm:grid-cols-2">
              <ValueInput
                label="Your height"
                unit={unit}
                hint={`Type it any way: 5'10", 70 in, 178 cm.`}
                value={height ?? Number.NaN}
                parse={(t) => parseLength(t, unit)}
                format={(mm) => formatLengthValue(mm, unit)}
                onChange={onHeight}
              />
              <ValueInput
                label="Your inseam (optional)"
                unit={unit}
                hint="Crotch to floor, shoes off. Adds a standover note."
                value={inseam ?? Number.NaN}
                parse={(t) => parseLength(t, unit)}
                format={(mm) => formatLengthValue(mm, unit)}
                onChange={setInseam}
              />
            </div>
            {height !== null && (
              <p className="text-sm">
                {suggestion ? (
                  <>
                    <span className="font-medium">
                      {formatFeetInches(height)} · {Math.round(height / 10)} cm:
                    </span>{" "}
                    {suggestion.note}
                  </>
                ) : (
                  <span className="text-muted-foreground">That height doesn&apos;t look right. Try something like 5&apos;10&quot;.</span>
                )}
              </p>
            )}
          </div>

          {drawing && (
            <div className="grid gap-6 lg:grid-cols-2">
              <FrameDrawing drawing={drawing} showDimensions={false} unit={unit} />
              <dl className="grid grid-cols-2 content-start gap-3 text-sm">
                {[
                  ["Reach", f(m?.reach)],
                  ["Stack", f(m?.stack)],
                  ["Wheelbase", f(m?.wheelbase)],
                  ["Trail", f(m?.trail)],
                  ["BB height", f(m?.bbHeight)],
                  ["Seat tube (c-t)", f(m?.seatTubeLength)],
                  ["Chainstay", f(m?.chainstayLength)],
                  ["Standover", f(m?.standover)],
                ].map(([k, v]) => (
                  <div key={k} className="flex flex-col gap-0.5 rounded-lg border p-3">
                    <dt className="text-muted-foreground">{k}</dt>
                    <dd className="font-mono tabular-nums">{v}</dd>
                  </div>
                ))}
                {feel && (
                  <p className="col-span-2 text-sm text-muted-foreground">
                    {feel.summary}
                    {standover ? ` ${standover}` : ""}
                  </p>
                )}
              </dl>
            </div>
          )}

          <div>
            <Button render={<Link href={toolLink("frame", frame)} />}>
              Start in the frame tool <ArrowRightIcon />
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
