"use client"

import { CopyIcon, DownloadIcon } from "lucide-react"
import { toast } from "sonner"

import {
  formatLengthValue,
  jigPartsCsv,
  jigPartsText,
  type JigPart,
  type LengthUnit,
} from "@/lib/frame"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Button } from "@/components/ui/button"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { CollapsibleCard } from "./collapsible-card"

interface Props {
  parts: JigPart[]
  unit: LengthUnit
}

export function JigPartsCard({ parts, unit }: Props) {
  const copy = async () => {
    try {
      await navigator.clipboard.writeText(jigPartsText(parts, unit))
      toast("Parts list copied")
    } catch {
      toast("Couldn't copy. Try the CSV download instead.")
    }
  }
  const download = () => {
    const url = URL.createObjectURL(new Blob([jigPartsCsv(parts, unit)], { type: "text/csv" }))
    const a = document.createElement("a")
    a.href = url
    a.download = "jig-parts.csv"
    a.click()
    URL.revokeObjectURL(url)
  }

  return (
    <CollapsibleCard
      className="card-tone tone-lavender"
      title="Jig parts"
      description="A T-slot spine with posts and carriers, sized for the frames above. Each line has search terms for McMaster-Carr; you confirm sizes and availability. Numbers match the drawing in the jig settings."
    >
      <div className="flex gap-2">
        <Button variant="outline" size="sm" onClick={copy} disabled={parts.length === 0}>
          <CopyIcon /> Copy
        </Button>
        <Button variant="outline" size="sm" onClick={download} disabled={parts.length === 0}>
          <DownloadIcon /> CSV
        </Button>
      </div>
      <Alert>
          <AlertTitle>No part numbers yet</AlertTitle>
          <AlertDescription>
            McMaster-Carr&apos;s catalog wasn&apos;t reachable when this was built, so the part numbers are blank on
            purpose. Each line says what to search for. Check the size and availability on their site, then write the
            number in the CSV. Sizes marked &quot;to suit&quot; depend on your tubes and dropouts.
          </AlertDescription>
        </Alert>

        {parts.length === 0 ? (
          <p className="text-sm text-muted-foreground">Fix the problems above to see the parts.</p>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-8">#</TableHead>
                <TableHead>Part</TableHead>
                <TableHead className="text-right">Qty</TableHead>
                <TableHead>What to buy</TableHead>
                <TableHead className="text-right">Cut ({unit})</TableHead>
                <TableHead>Search McMaster-Carr for</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {parts.map((p) => (
                <TableRow key={p.id}>
                  <TableCell className="font-mono tabular-nums">{p.callout > 0 ? p.callout : ""}</TableCell>
                  <TableCell className="font-medium whitespace-normal">
                    {p.name}
                    <div className="text-xs font-normal text-muted-foreground">{p.note}</div>
                  </TableCell>
                  <TableCell className="text-right tabular-nums">{p.qty}</TableCell>
                  <TableCell className="whitespace-normal">{p.spec}</TableCell>
                  <TableCell className="text-right font-mono tabular-nums">
                    {p.cutLength === undefined ? "–" : formatLengthValue(p.cutLength, unit)}
                  </TableCell>
                  <TableCell className="font-mono text-xs whitespace-normal">{p.search}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
    </CollapsibleCard>
  )
}
