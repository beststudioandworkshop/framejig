import type { Metadata } from "next"

import { StartGuide } from "@/components/tools/frame/start-guide"

export const metadata: Metadata = { title: "Where to start" }

export default function StartPage() {
  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-3xl font-semibold tracking-tight">Where to start</h1>
        <p className="mt-2 text-muted-foreground">
          What makes a road bike different from a mountain bike, and how to pick a starting frame for the one you want
          to build.
        </p>
      </div>
      <StartGuide />
    </div>
  )
}
