"use client"

import { buildingNotes, MATERIAL_LABELS, type FrameInputs } from "@/lib/frame"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"

const PROCESS_LABEL = { tig: "TIG welded", braze: "fillet brazed", lugged: "lugged" } as const

export function BuildingNotesCard({ inputs }: { inputs: FrameInputs }) {
  const steps = buildingNotes(inputs)
  return (
    <Card className="card-tone tone-mustard">
      <CardHeader>
        <CardTitle>Building notes</CardTitle>
        <CardDescription>
          The order of work for a {MATERIAL_LABELS[inputs.material].toLowerCase()} frame, {PROCESS_LABEL[inputs.process]}.
          These are rules of thumb. They don&apos;t replace training or an experienced builder looking over your first
          frame.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <ol className="flex flex-col gap-4">
          {steps.map((s, i) => (
            <li key={s.id} className="grid grid-cols-[2rem_1fr] gap-x-3">
              <span className="font-mono text-sm text-muted-foreground tabular-nums">{i + 1}</span>
              <div className="flex flex-col gap-1">
                <h3 className="text-sm font-medium">{s.title}</h3>
                <p className="text-sm text-muted-foreground">{s.body}</p>
              </div>
            </li>
          ))}
        </ol>
      </CardContent>
    </Card>
  )
}
