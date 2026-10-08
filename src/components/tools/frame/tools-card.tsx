"use client"

import { frameTools, TOOL_CATEGORIES, MATERIAL_LABELS, type FrameInputs } from "@/lib/frame"
import { Badge } from "@/components/ui/badge"
import { CollapsibleCard } from "./collapsible-card"

const PROCESS_LABEL = { tig: "TIG welded", braze: "fillet brazed", lugged: "lugged" } as const

export function ToolsCard({ inputs }: { inputs: FrameInputs }) {
  const items = frameTools(inputs)
  return (
    <CollapsibleCard
      className="card-tone tone-tea"
      title="Tools for building it"
      description={`For a ${MATERIAL_LABELS[inputs.material].toLowerCase()} frame, ${PROCESS_LABEL[inputs.process]}. Material and joining process are set in the frame tool, and this list follows them. It's a starting point, not a safety course. Anyone using a torch or welder should be trained for it.`}
    >
      <div className="grid gap-6 sm:grid-cols-2">
        {TOOL_CATEGORIES.map((cat) => {
          const list = items.filter((i) => i.category === cat)
          if (list.length === 0) return null
          return (
            <section key={cat} className="flex flex-col gap-2">
              <h3 className="text-sm font-medium">{cat}</h3>
              <ul className="flex flex-col gap-2">
                {list.map((i) => (
                  <li key={i.id} className="text-sm">
                    <span className="font-medium">{i.name}</span>
                    {!i.essential && (
                      <Badge variant="outline" className="ml-2">
                        Nice to have
                      </Badge>
                    )}
                    <div className="text-muted-foreground">{i.why}</div>
                  </li>
                ))}
              </ul>
            </section>
          )
        })}
      </div>
    </CollapsibleCard>
  )
}
