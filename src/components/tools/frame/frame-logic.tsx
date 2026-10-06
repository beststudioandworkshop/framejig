"use client"

import { useMemo, useState } from "react"
import { ArrowRightIcon, InfoIcon } from "lucide-react"
import Link from "next/link"

import {
  BIKE_TYPES,
  BIKE_TYPE_LABELS,
  buildDrawing,
  buildFrame,
  CHART_VIEWS,
  formatFeetInches,
  formatLengthValue,
  FREAK_STYLES,
  parseLength,
  profileFor,
  rideFeel,
  sizedFrame,
  sizeInfo,
  SIZES,
  stylesOf,
  suggestSize,
  toolLink,
  type BikeType,
  type ChartView,
  type LengthUnit,
  type RangeKey,
  type SizeId,
} from "@/lib/frame"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group"
import { FrameDrawing } from "./frame-drawing"
import { TaxonomyChart } from "./taxonomy-chart"
import { ValueInput } from "./value-input"

const RANGE_ROWS: RangeKey[] = ["headTubeAngle", "seatTubeAngle", "trail", "wheelbase", "chainstayLength", "bbDrop"]
type Family = BikeType | "freak"

type RiderUnit = "cm" | "ftin" | "in"
const RIDER_UNIT_LABEL: Record<RiderUnit, string> = { cm: "cm", ftin: "ft + in", in: "in" }

/** A bare number is read in the chosen unit; anything typed with its own unit wins. */
function parseRiderLength(text: string, unit: RiderUnit): number | null {
  if (/^\s*\d+(\.\d+)?\s*$/.test(text)) {
    const n = Number(text)
    if (unit === "cm") return n * 10
    if (unit === "in") return n * 25.4
    return n < 12 ? n * 304.8 : n * 25.4
  }
  return parseLength(text, "mm")
}

function formatRiderLength(mm: number, unit: RiderUnit): string {
  if (unit === "cm") return String(Math.round(mm) / 10)
  if (unit === "in") return formatLengthValue(mm, "in")
  return formatFeetInches(mm)
}

export function FrameLogic() {
  const [family, setFamily] = useState<Family>("road")
  const [style, setStyle] = useState<string | null>(null)
  const [view, setView] = useState<ChartView>("steering")
  const [showFamilies, setShowFamilies] = useState(true)
  const [size, setSize] = useState<SizeId>("M")
  const [unit, setUnit] = useState<LengthUnit>("mm")
  const [riderUnit, setRiderUnit] = useState<RiderUnit>("cm")
  const riderParse = (t: string) => parseRiderLength(t, riderUnit)
  const riderFormat = (mm: number) => formatRiderLength(mm, riderUnit)
  const [height, setHeight] = useState<number | null>(null)
  const [inseam, setInseam] = useState<number | null>(null)

  const type: BikeType = family === "freak" ? "road" : family
  const cat = profileFor(type, style)
  const frame = useMemo(() => sizedFrame(type, size, style), [type, size, style])
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
  const styles = family === "freak" ? [] : stylesOf(family)

  const pickFamily = (v: Family) => {
    setFamily(v)
    setStyle(null)
  }
  const onHeight = (mm: number) => {
    setHeight(mm)
    const s = suggestSize(mm)
    if (s) setSize(s.size)
  }

  return (
    <div className="flex flex-col gap-6">
      <Card className="card-tone tone-sky">
        <CardHeader>
          <CardTitle>The map</CardTitle>
          <CardDescription>
            Every kind of bike, and the sub-styles inside it, drawn where its typical numbers sit. Boxes are ranges, not
            single numbers, and the dashed outlines are whole families. Click any box to read about it. All the numbers are
            my estimates for now.
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <ToggleGroup
              variant="outline"
              size="sm"
              spacing={0}
              value={[view]}
              onValueChange={(v) => v[0] && setView(v[0] as ChartView)}
              aria-label="Chart view"
              className="flex-wrap"
            >
              {(Object.keys(CHART_VIEWS) as ChartView[]).map((v) => (
                <ToggleGroupItem key={v} value={v}>
                  {CHART_VIEWS[v].label}
                </ToggleGroupItem>
              ))}
            </ToggleGroup>
            <Label className="gap-2">
              <Switch size="sm" checked={showFamilies} onCheckedChange={setShowFamilies} />
              Show whole families
            </Label>
          </div>
          <p className="text-sm text-muted-foreground">{CHART_VIEWS[view].blurb}</p>
          <TaxonomyChart
            view={view}
            showFamilies={showFamilies}
            selected={{ family: type, style }}
            onSelect={(fam, st) => {
              setFamily(fam)
              setStyle(st)
            }}
          />
        </CardContent>
      </Card>

      <Card className="card-tone tone-tangerine">
        <CardHeader>
          <CardTitle>Pick the kind of bike</CardTitle>
          <CardDescription>
            Each kind of bike has its own shape, for a reason. Pick a family, then a style inside it.
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <Tabs value={family} onValueChange={(v) => pickFamily(v as Family)}>
              <TabsList className="group-data-horizontal/tabs:h-auto w-full grid-cols-4 gap-1 max-sm:grid sm:w-fit sm:flex-wrap">
                {BIKE_TYPES.map((t) => (
                  <TabsTrigger key={t} value={t}>
                    {BIKE_TYPE_LABELS[t]}
                  </TabsTrigger>
                ))}
                <TabsTrigger value="freak">Freak</TabsTrigger>
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
          </div>
          {family !== "freak" && (
            <div className="flex flex-col gap-1.5">
              <span className="text-sm font-medium">Style</span>
              <ToggleGroup
                variant="outline"
                size="sm"
                spacing={0}
                value={[style ?? "general"]}
                onValueChange={(v) => v[0] && setStyle(v[0] === "general" ? null : v[0])}
                aria-label="Style"
                className="flex-wrap"
              >
                <ToggleGroupItem value="general">General</ToggleGroupItem>
                {styles.map((s) => (
                  <ToggleGroupItem key={s.id} value={s.id}>
                    {s.label}
                  </ToggleGroupItem>
                ))}
              </ToggleGroup>
            </div>
          )}
        </CardContent>
      </Card>

      {family === "freak" ? (
        <FreakBikes />
      ) : (
        <>
          <Card className="card-tone tone-lavender">
            <CardHeader>
              <CardTitle>
                {BIKE_TYPE_LABELS[type]}
                {style ? `: ${cat.label}` : ""}. {cat.tagline}
              </CardTitle>
              <CardDescription>{cat.forWhat}</CardDescription>
            </CardHeader>
            <CardContent className="flex flex-col gap-4">
              <Alert>
                <InfoIcon />
                <AlertTitle>These numbers are estimates</AlertTitle>
                <AlertDescription>
                  {cat.reference} Ranges are for a medium and are rules of thumb, not limits. Real bikes sit outside them for
                  good reasons.
                </AlertDescription>
              </Alert>
              {cat.different && (
                <div className="flex flex-col gap-1">
                  <h3 className="text-sm font-medium">What sets {cat.label.toLowerCase()} apart from the rest of {BIKE_TYPE_LABELS[type].toLowerCase()}</h3>
                  <ul className="list-disc pl-5 text-sm text-muted-foreground">
                    {cat.different.map((d) => (
                      <li key={d}>{d}</li>
                    ))}
                  </ul>
                </div>
              )}
              <ul className="flex flex-col divide-y sm:hidden" aria-label="Typical ranges">
                {RANGE_ROWS.map((k) => (
                  <li key={k} className="flex flex-col gap-1 py-3">
                    <div className="flex flex-wrap items-baseline gap-x-3">
                      <span className="font-medium">{cat.ranges[k].label}</span>
                      <span className="font-mono tabular-nums">{fmtRange(k)}</span>
                    </div>
                    <p className="text-sm text-muted-foreground">{cat.rangeWhy[k]}</p>
                  </li>
                ))}
                <li className="flex flex-col gap-1 py-3">
                  <div className="flex flex-wrap items-baseline gap-x-3">
                    <span className="font-medium">Stack to reach</span>
                    <span className="font-mono tabular-nums">
                      {cat.positionRange.low.toFixed(2)} to {cat.positionRange.high.toFixed(2)}
                    </span>
                  </div>
                  <p className="text-sm text-muted-foreground">{cat.rangeWhy.position}</p>
                </li>
              </ul>
              <Table className="max-sm:hidden">
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
                <CardTitle>What varies inside {BIKE_TYPE_LABELS[type].toLowerCase()}</CardTitle>
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

          <Card className="card-tone tone-sky entry-zone">
            <CardHeader>
              <CardTitle>Start from a size</CardTitle>
              <CardDescription>
                Pick a size, or tell me about the rider and I&apos;ll suggest one. The {cat.label.toLowerCase()} example frame
                in that size becomes your starting point in the frame tool. Sizing differs a lot between makers, so treat
                the rider heights as rough.
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
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <h3 className="text-sm font-medium">Or start from the rider</h3>
                  <ToggleGroup
                    variant="outline"
                    spacing={0}
                    value={[riderUnit]}
                    onValueChange={(v) => v[0] && setRiderUnit(v[0] as RiderUnit)}
                    aria-label="Rider units"
                  >
                    <ToggleGroupItem value="cm">cm</ToggleGroupItem>
                    <ToggleGroupItem value="ftin">ft + in</ToggleGroupItem>
                    <ToggleGroupItem value="in">inches</ToggleGroupItem>
                  </ToggleGroup>
                </div>
                <div className="grid gap-4 sm:grid-cols-2">
                  <ValueInput
                    label="Your height"
                    unit={RIDER_UNIT_LABEL[riderUnit]}
                    inputMode="text"
                    hint={`Pick a unit, or type it with its unit: 5'10", 70 in, 178 cm.`}
                    value={height ?? Number.NaN}
                    parse={riderParse}
                    format={riderFormat}
                    onChange={onHeight}
                  />
                  <ValueInput
                    label="Your inseam (optional)"
                    unit={RIDER_UNIT_LABEL[riderUnit]}
                    inputMode="text"
                    hint="Crotch to floor, shoes off. Adds a standover note."
                    value={inseam ?? Number.NaN}
                    parse={riderParse}
                    format={riderFormat}
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
        </>
      )}
    </div>
  )
}

function FreakBikes() {
  return (
    <div className="flex flex-col gap-6">
      <Card className="card-tone tone-red">
        <CardHeader>
          <CardTitle>Freak bikes</CardTitle>
          <CardDescription>
            Not everything with two wheels is a diamond frame. Here is the weird and wonderful, and why this tool can&apos;t
            draw it (yet). No numbers here: freak bikes break the rules on purpose.
          </CardDescription>
        </CardHeader>
      </Card>
      <div className="grid gap-6 md:grid-cols-2">
        {FREAK_STYLES.map((s) => (
          <Card key={s.id} className="card-tone tone-pink">
            <CardHeader>
              <CardTitle>{s.label}</CardTitle>
              <CardDescription>{s.tagline}</CardDescription>
            </CardHeader>
            <CardContent className="flex flex-col gap-3 text-sm">
              <p>{s.forWhat}</p>
              <ul className="list-disc pl-5 text-muted-foreground">
                {s.different.map((d) => (
                  <li key={d}>{d}</li>
                ))}
              </ul>
              <div className="flex flex-col gap-1 rounded-lg border p-3">
                <div className="flex items-center gap-2">
                  <span className="font-medium">Why the tool can&apos;t model it</span>
                  <Badge variant={s.possibleLater ? "secondary" : "outline"}>{s.possibleLater ? "Could come later" : "Out of reach"}</Badge>
                </div>
                <p className="text-muted-foreground">{s.whyNot}</p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  )
}
