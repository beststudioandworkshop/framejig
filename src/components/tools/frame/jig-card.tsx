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
  type Jig,
  type JigSettings,
  type LengthUnit,
} from "@/lib/frame"
import { Button } from "@/components/ui/button"
import { Card, CardAction, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { ValueInput } from "./value-input"

interface JigCardProps {
  inputs: FrameInputs
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

export function JigCard({ inputs, jig, referenceJig, unit, settings, onSettings, onWidths }: JigCardProps) {
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
          The rear axle is fixed. The main spine runs from it through the middle of the head tube, so its tilt comes from
          the frame. Carriers on its face hold the seat tube and head tube.
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
            label="Post height"
            unit={unit}
            hint="Base up to the pivot where the spine mounts."
            value={settings.postHeight}
            parse={(t) => parseLength(t, unit)}
            format={(mm) => formatLengthValue(mm, unit)}
            onChange={(v) => onSettings({ ...settings, postHeight: v })}
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
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
              {[
                ["Spine tilt", `${Number(jig.tilt.degrees.toFixed(2))}° above the axle line`],
                ["Rise over 1000 mm", `${Number(jig.tilt.risePerMeter.toFixed(1))} mm`],
                ["Spine length", `${f(jig.spine.length)} ${unit}`],
                ["Post height", `${f(jig.settings.postHeight)} ${unit}`],
              ].map(([k, v]) => (
                <div key={k} className="flex flex-col gap-0.5 rounded-lg border p-3 text-sm">
                  <span className="text-muted-foreground">{k}</span>
                  <span className="font-mono tabular-nums">{v}</span>
                </div>
              ))}
            </div>
            <p className="-mt-3 text-sm text-muted-foreground">
              Set the spine so its centerline runs from the rear axle through the middle of the head tube. The tilt is
              measured from the axle-to-axle line. Along the spine is measured from the rear axle; across is up
              (toward the seat tube) from the spine&apos;s centerline, down is negative.
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
                Each carrier crosses the spine and runs along its tube. Set the angle, then slide the carrier to where
                it crosses. The stops are measured along the carrier from that crossing, up the tube is positive.
              </p>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Carrier</TableHead>
                    <TableHead className="text-right">Angle to spine</TableHead>
                    <TableHead className="text-right">Off square</TableHead>
                    <TableHead className="text-right">Crosses spine at ({unit})</TableHead>
                    <TableHead className="text-right">Cut ({unit})</TableHead>
                    <TableHead>Stops</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {jig.carriers.map((c) => (
                    <TableRow key={c.id}>
                      <TableCell className="font-medium">{c.name}</TableCell>
                      <TableCell className="text-right font-mono tabular-nums">{Number(c.angleToSpine.toFixed(1))}°</TableCell>
                      <TableCell className="text-right font-mono tabular-nums">
                        {c.offSquare > 0 ? "+" : c.offSquare < 0 ? "−" : ""}
                        {Number(Math.abs(c.offSquare).toFixed(1))}°
                      </TableCell>
                      <TableCell className="text-right font-mono tabular-nums">{c.crossing === null ? "–" : f(c.crossing)}</TableCell>
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
                Straight-line distances between stations. They don&apos;t change with the tilt. Measure these on the
                jig before you tack anything.
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
                  The spine tilts {Number(env.tilt.min.toFixed(1))}° to {Number(env.tilt.max.toFixed(1))}° and needs{" "}
                  {f(env.spineLength)} {unit}. Stations reach up to {f(env.maxAcross)} {unit} from the spine centerline.
                </span>
                {env.carriers.map((c) => (
                  <span key={c.id} className="text-muted-foreground">
                    {c.name}: crosses the spine at {f(c.crossing.min)} to {f(c.crossing.max)} {unit}, angle{" "}
                    {Number(c.angleToSpine.min.toFixed(1))}° to {Number(c.angleToSpine.max.toFixed(1))}°.
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
