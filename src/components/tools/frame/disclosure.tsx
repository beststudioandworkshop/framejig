"use client"

import { ChevronDownIcon } from "lucide-react"
import type { ReactNode } from "react"

import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible"

interface DisclosureProps {
  title: string
  children: ReactNode
  defaultOpen?: boolean
}

/**
 * A closed-by-default section inside a card, for the lowest level of information: the detail you look at
 * when you want it and can ignore when you don't.
 */
export function Disclosure({ title, children, defaultOpen = false }: DisclosureProps) {
  return (
    <Collapsible defaultOpen={defaultOpen} className="rounded-lg border">
      <CollapsibleTrigger className="group/trigger flex w-full items-center justify-between gap-3 rounded-lg px-3 py-2.5 text-left text-sm font-medium outline-none focus-visible:ring-3 focus-visible:ring-ring/50">
        {title}
        <ChevronDownIcon className="size-4 shrink-0 text-muted-foreground transition-transform group-data-[panel-open]/trigger:rotate-180" />
      </CollapsibleTrigger>
      <CollapsibleContent>
        <div className="flex flex-col gap-4 border-t px-3 py-3">{children}</div>
      </CollapsibleContent>
    </Collapsible>
  )
}
