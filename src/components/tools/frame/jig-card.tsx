"use client"

import { CopyIcon, DownloadIcon } from "lucide-react"
import { toast } from "sonner"

import {
  formatLengthValue,
  jigCsv,
  jigEnvelope,
  jigText,
  parseLength,
  type FrameInputs,
  type FrameResult,
  type Jig,
  type JigSettings,
  type LengthUnit,
} from "@/lib/frame"
import { Button } from "@/components/ui/button"
import { Card, CardAction, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { JigDrawing } from "./jig-drawing"
import { JigPlanView } from "./jig-plan-view"
import { ZoomPanel } from "./zoom-panel"
import { ValueInput } from "./value-input"

interface JigCardProps {
  inputs: FrameInputs
  result: FrameResult
  jig: Jig | null
  referenceJig: Jig | null
  unit: LengthUnit
  settings: JigSettings
  onSettings: (s: JigSettings) => void
  onWidths: (w: Partial<Pick<FrameInputs, "bbShellWidth" | "rearSpacing">>) => void
}

function download(name: string, text: string) {
  const url = URL.createObjectURL(new Blob([text], { type: "text/csv" }))
  const a = document.createElement("a")
  a.href = url
  a.download = name
  a.click()
  URL.revokeObjectURL(url)
}

export function JigCard({ inputs, result, jig, referenceJig, unit, settings, onSettings, onWidths }: JigCardProps) {
  const f = (mm: number) => formatLengthValue(mm, unit)
  const env = jigEnvelope([jig, referenceJig])

  const copy = async () => {
    if (!jig) return
    try {
      await navigator.clipboard.writeText(jigText(jig, unit))
      toast("Jig settings copied")
    } catch {
      toast("Couldn't copy. Try the CSV download instead.")
    }
  }

  return (
    <Card className="card-tone tone-tangerine entry-zone">
      <CardHeader>
        <CardTitle>Jig settings</CardTitle>
        <CardDescription>
          The rear axle is fixed. The main spine runs level, parallel to the axle line. The seat tube carrier pivots at the
          center of the bottom bracket and the head tube carrier pivots at the bottom of the head tube.
        </CardDescription>
        <CardAction className="flex gap-2">
          <Button variant="outline" size="sm" onClick={copy} disabled={!jig}>
            <CopyIcon /> Copy
          </Button>
          <Button variant="outline" size="sm" onClick={() => jig && download("jig-settings.csv", jigCsv(jig, unit))} disabled={!jig}>
            <DownloadIcon /> CSV
          </Button>
        </CardAction>
      </CardHeader>
      <CardContent className="flex flex-col gap-6">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <ValueInput
            label="Spine face to the frame's center plane"
            unit={unit}
            hint="Seen from above. How far the carriers reach out from the spine to the middle of the frame."
            value={settings.centerOffset}
            parse={(t) => parseLength(t, unit)}
            format={(mm) => formatLengthValue(mm, unit)}
            onChange={(v) => onSettings({ ...settings, centerOffset: v })}
          />
          <ValueInput
            label="Spine bottom edge above the axle line"
            unit={unit}
            hint="From the axle line up to the bottom edge of the spine. The spine is 120 mm tall."
            value={settings.spineClearance}
            parse={(t) => parseLength(t, unit)}
            format={(mm) => formatLengthValue(mm, unit)}
            onChange={(v) => onSettings({ ...settings, spineClearance: v })}
          />
          <ValueInput
            label="Rear spacing"
            unit={unit}
            hint="Between the inside faces of the dropouts."
            value={inputs.rearSpacing}
            parse={(t) => parseLength(t, unit)}
            format={(mm) => formatLengthValue(mm, unit)}
            onChange={(v) => onWidths({ rearSpacing: v })}
          />
          <ValueInput
            label="BB shell width"
            unit={unit}
            hint="68 or 73 mm are common."
            value={inputs.bbShellWidth}
            parse={(t) => parseLength(t, unit)}
            format={(mm) => formatLengthValue(mm, unit)}
            onChange={(v) => onWidths({ bbShellWidth: v })}
          />
        </div>

        {!jig ? (
          <p className="text-sm text-muted-foreground">Fix the problems above to see the jig settings.</p>
        ) : (
          <>
            <Tabs defaultValue="side">
              <TabsList>
                <TabsTrigger value="side">Side view</TabsTrigger>
                <TabsTrigger value="top">Top view</TabsTrigger>
              </TabsList>
              <TabsContent value="side" className="flex flex-col gap-2">
                <ZoomPanel title="Jig, side view">
                  {(enlarged) => <JigDrawing inputs={inputs} result={result} jig={jig} unit={unit} detailed={enlarged} />}
                </ZoomPanel>
                <p className="text-xs text-muted-foreground">
                  To scale: the spine and posts are the 40 x 120 profile, the carriers and the standoff the 40 x 80. The
                  jig is drawn solid, with the frame's tube outlines over it so you can see where they meet. This view shows
                  the key dimensions; Enlarge shows them all. The angles are the tube angles each carrier is turned to.
                </p>
              </TabsContent>
              <TabsContent value="top" className="flex flex-col gap-2">
                <ZoomPanel title="Jig, top view">
                  {(enlarged) => <JigPlanView inputs={inputs} jig={jig} unit={unit} detailed={enlarged} />}
                </ZoomPanel>
                <p className="text-xs text-muted-foreground">
                  Seen from above, to scale. The spine&apos;s front face is at the top of the frame area, and the frame&apos;s
                  center plane is the dashed line. The standoffs reach from the face to the dropouts and the BB shell,
                  so they stop short of the center plane by half the rear spacing or half the BB shell width. Enlarge
                  shows every dimension.
                </p>
              </TabsContent>
            </Tabs>

            <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
              {[
                ["Spine bottom edge", `${f(jig.spine.bottom)} ${unit} above the axle line`],
                ["Spine top edge", `${f(jig.spine.top)} ${unit} above the axle line`],
                ["Spine length", `${f(jig.spine.length)} ${unit}`],
                ["Spine centerline", `${f(jig.spine.centerline)} ${unit} above the axle line`],
              ].map(([k, v]) => (
                <div key={k} className="flex flex-col gap-0.5 rounded-lg border p-3 text-sm">
                  <span className="text-muted-foreground">{k}</span>
                  <span className="font-mono tabular-nums">{v}</span>
                </div>
              ))}
            </div>
            <p className="-mt-3 text-sm text-muted-foreground">
              Set the spine level, with its bottom edge at that height above the axle line. Along the spine is measured
              forward from the rear axle; across is up from the spine&apos;s centerline, down is negative.
            </p>

            {jig.notes.length > 0 && (
              <ul className="flex flex-col gap-1 text-sm text-destructive">
                {jig.notes.map((n) => (
                  <li key={n}>{n}</li>
                ))}
              </ul>
            )}

            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Station</TableHead>
                  <TableHead className="text-right">Along spine ({unit})</TableHead>
                  <TableHead className="text-right">Across spine ({unit})</TableHead>
                  <TableHead className="text-right">Standoff ({unit})</TableHead>
                  <TableHead className="text-right">Each side of center ({unit})</TableHead>
                  <TableHead className="text-right">Tube angle</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {jig.stations.map((s) => (
                  <TableRow key={s.id}>
                    <TableCell className="font-medium">{s.name}</TableCell>
                    <TableCell className="text-right font-mono tabular-nums">{f(s.u)}</TableCell>
                    <TableCell className="text-right font-mono tabular-nums">{f(s.v)}</TableCell>
                    <TableCell className="text-right font-mono tabular-nums">{f(s.standoff)}</TableCell>
                    <TableCell className="text-right tabular-nums">{s.halfWidth === undefined ? "–" : f(s.halfWidth)}</TableCell>
                    <TableCell className="text-right tabular-nums">{s.angle === undefined ? "–" : `${Number(s.angle.toFixed(1))}°`}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>

            <div className="flex flex-col gap-2">
              <h3 className="text-sm font-medium">Carriers</h3>
              <p className="text-sm text-muted-foreground">
                Each carrier turns about a pin on its post. Slide the post along the spine to the pin position, set the pin
                at the height shown from the spine edge, then turn the carrier to the tube angle. The stops are measured
                along the carrier from the pin, up the tube is positive.
              </p>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Carrier</TableHead>
                    <TableHead className="text-right">Tube angle</TableHead>
                    <TableHead className="text-right">Pin along spine ({unit})</TableHead>
                    <TableHead className="text-right">Pin beyond the spine edge ({unit})</TableHead>
                    <TableHead className="text-right">Post cut ({unit})</TableHead>
                    <TableHead className="text-right">Carrier cut ({unit})</TableHead>
                    <TableHead>Stops</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {jig.carriers.map((c) => (
                    <TableRow key={c.id}>
                      <TableCell className="font-medium">{c.name}</TableCell>
                      <TableCell className="text-right font-mono tabular-nums">{Number(c.tubeAngle.toFixed(1))}°</TableCell>
                      <TableCell className="text-right font-mono tabular-nums">{f(c.pivotU)}</TableCell>
                      <TableCell className="text-right font-mono tabular-nums">
                        {f(c.pinClearance)} {c.side === "below" ? "below" : "above"}
                      </TableCell>
                      <TableCell className="text-right font-mono tabular-nums">{f(c.postLength)}</TableCell>
                      <TableCell className="text-right font-mono tabular-nums">{f(c.length)}</TableCell>
                      <TableCell className="text-sm whitespace-normal">
                        {c.stops
                          .map((x) => `${jig.stations.find((s) => s.id === x.station)!.name} ${f(x.along)}`)
                          .join(" · ")}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>

            <div className="flex flex-col gap-2">
              <h3 className="text-sm font-medium">Check with a tape</h3>
              <p className="text-sm text-muted-foreground">
                Straight-line distances between stations. Measure these on the jig before you tack anything.
              </p>
              <Table>
                <TableBody>
                  {jig.checks.map((c) => (
                    <TableRow key={c.id}>
                      <TableCell>{c.name}</TableCell>
                      <TableCell className="text-right font-mono tabular-nums">{f(c.length)} {unit}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>

            {env && (
              <div className="flex flex-col gap-1 rounded-lg border p-3 text-sm">
                <span className="font-medium">
                  Room and travel {env.frames > 1 ? "for your frame and the reference" : "for this frame"}
                </span>
                <span className="text-muted-foreground">
                  The spine needs {f(env.spineLength)} {unit}. Stations reach up to {f(env.maxAcross)} {unit} from the
                  spine centerline.
                </span>
                {env.carriers.map((c) => (
                  <span key={c.id} className="text-muted-foreground">
                    {c.name}: pin at {f(c.pivotU.min)} to {f(c.pivotU.max)} {unit} along the spine, {f(c.pinClearance.min)} to{" "}
                    {f(c.pinClearance.max)} {unit} beyond the spine edge, turned {Number((180 - c.angleToSpine.max).toFixed(1))}° to{" "}
                    {Number((180 - c.angleToSpine.min).toFixed(1))}° from horizontal.
                  </span>
                ))}
              </div>
            )}
          </>
        )}
        <p className="text-xs text-muted-foreground">
          Standoff is how far a locator reaches out from the spine face: to the center plane, less half the rear
          spacing or half the BB shell width where those faces are what touch. Check every number against your tubes
          before you cut.
        </p>
      </CardContent>
    </Card>
  )
}
