"use client"

import { CopyIcon, DownloadIcon } from "lucide-react"
import { toast } from "sonner"

import {
  formatAngle,
  formatLengthValue,
  scheduleCsv,
  scheduleRows,
  scheduleText,
  type FrameResult,
  type LengthUnit,
} from "@/lib/frame"
import { Button } from "@/components/ui/button"
import { Card, CardAction, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"

export function TubeSchedule({ result, unit }: { result: FrameResult; unit: LengthUnit }) {
  const rows = scheduleRows(result.tubes)
  const f = (mm: number) => formatLengthValue(mm, unit)

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(scheduleText(result.tubes, unit))
      toast("Tube schedule copied")
    } catch {
      toast("Couldn't copy. Try the CSV download instead.")
    }
  }

  const download = () => {
    const blob = new Blob([scheduleCsv(result.tubes, unit)], { type: "text/csv" })
    const url = URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = "tube-schedule.csv"
    a.click()
    URL.revokeObjectURL(url)
  }

  return (
    <Card className="card-tone tone-mustard">
      <CardHeader>
        <CardTitle>Tube schedule</CardTitle>
        <CardDescription>
          Lengths run joint to joint along the centerline, side view. They don&apos;t include miter or cope
          allowances or the stays&apos; splay, so don&apos;t cut from them yet.
        </CardDescription>
        <CardAction className="flex gap-2">
          <Button variant="outline" size="sm" onClick={copy} disabled={rows.length === 0}>
            <CopyIcon /> Copy
          </Button>
          <Button variant="outline" size="sm" onClick={download} disabled={rows.length === 0}>
            <DownloadIcon /> CSV
          </Button>
        </CardAction>
      </CardHeader>
      <CardContent>
        {rows.length === 0 ? (
          <p className="text-sm text-muted-foreground">Fix the problems above to see the tubes.</p>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Tube</TableHead>
                <TableHead className="text-right">Qty</TableHead>
                <TableHead className="text-right">Diameter ({unit})</TableHead>
                <TableHead className="text-right">Wall ({unit})</TableHead>
                <TableHead className="text-right">Length ({unit})</TableHead>
                <TableHead className="text-right">Angle from horizontal</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {rows.map((r) => (
                <TableRow key={r.name}>
                  <TableCell className="font-medium">{r.name}</TableCell>
                  <TableCell className="text-right tabular-nums">{r.qty}</TableCell>
                  <TableCell className="text-right tabular-nums">{f(r.diameter)}</TableCell>
                  <TableCell className="text-right tabular-nums">{f(r.wall)}</TableCell>
                  <TableCell className="text-right font-mono tabular-nums">{f(r.length)}</TableCell>
                  <TableCell className="text-right tabular-nums">{formatAngle(r.angle)}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </CardContent>
    </Card>
  )
}
