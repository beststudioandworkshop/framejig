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
    <Card>
      <CardHeader>
        <CardTitle>Jig settings</CardTitle>
        <CardDescription>
          Everything is measured from the rear axle, which is fixed. Forward is away from it. Up is above the axle line,
          so the bottom bracket is below.
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
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          <ValueInput
            label="Spine face below the axle line"
            unit={unit}
            hint="How far down the top face of your spine sits. It depends on how you build the jig."
            value={settings.spineOffset}
            parse={(t) => parseLength(t, unit)}
            format={(mm) => formatLengthValue(mm, unit)}
            onChange={(v) => onSettings({ ...settings, spineOffset: v })}
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
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Station</TableHead>
                  <TableHead className="text-right">Forward ({unit})</TableHead>
                  <TableHead className="text-right">Up from axle line ({unit})</TableHead>
                  <TableHead className="text-right">Up from spine ({unit})</TableHead>
                  <TableHead className="text-right">Each side of centre ({unit})</TableHead>
                  <TableHead className="text-right">Angle</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {jig.stations.map((s) => (
                  <TableRow key={s.id}>
                    <TableCell className="font-medium">{s.name}</TableCell>
                    <TableCell className="text-right font-mono tabular-nums">{f(s.x)}</TableCell>
                    <TableCell className="text-right font-mono tabular-nums">{f(s.y)}</TableCell>
                    <TableCell className="text-right font-mono tabular-nums">{f(s.yFromSpine)}</TableCell>
                    <TableCell className="text-right tabular-nums">{s.halfWidth === undefined ? "–" : f(s.halfWidth)}</TableCell>
                    <TableCell className="text-right tabular-nums">{s.angle === undefined ? "–" : `${Number(s.angle.toFixed(1))}°`}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>

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
                  Room the jig needs {env.frames > 1 ? "for your frame and the reference" : "for this frame"}
                </span>
                <span className="text-muted-foreground">
                  Stations run from {f(env.minX)} to {f(env.maxX)} {unit} along the spine ({f(env.spanX)} {unit}), and
                  rise up to {f(env.maxHeight)} {unit} above the spine face.
                </span>
              </div>
            )}
          </>
        )}
        <p className="text-xs text-muted-foreground">
          Each side of centre is half the rear spacing ({f(inputs.rearSpacing)} {unit} between the dropout faces) and
          half the BB shell width ({f(inputs.bbShellWidth)} {unit}). Settings are for the frame as drawn in the side
          view. Check every number against your tubes before you cut.
        </p>
      </CardContent>
    </Card>
  )
}
