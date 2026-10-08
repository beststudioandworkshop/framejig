"use client"

import { ChevronDownIcon } from "lucide-react"
import type { ReactNode } from "react"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible"

interface CollapsibleCardProps {
  className?: string
  title: string
  description?: ReactNode
  defaultOpen?: boolean
  children: ReactNode
}

/** A card that opens and closes from its header. Closed by default, so long reference material stays out of the way. */
export function CollapsibleCard({ className, title, description, defaultOpen = false, children }: CollapsibleCardProps) {
  return (
    <Collapsible defaultOpen={defaultOpen}>
      <Card className={className}>
        <CardHeader>
          <CollapsibleTrigger className="group/trigger flex w-full items-start justify-between gap-3 rounded-md text-left outline-none focus-visible:ring-3 focus-visible:ring-ring/50">
            <span className="flex flex-col gap-1.5">
              <CardTitle>{title}</CardTitle>
              {description && <CardDescription>{description}</CardDescription>}
            </span>
            <ChevronDownIcon className="mt-0.5 size-5 shrink-0 text-muted-foreground transition-transform group-data-[panel-open]/trigger:rotate-180" />
          </CollapsibleTrigger>
        </CardHeader>
        <CollapsibleContent>
          <CardContent className="flex flex-col gap-4">{children}</CardContent>
        </CollapsibleContent>
      </Card>
    </Collapsible>
  )
}
