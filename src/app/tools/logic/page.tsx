import type { Metadata } from "next"

import { FrameLogic } from "@/components/tools/frame/frame-logic"

export const metadata: Metadata = { title: "Frame logic" }

export default function FrameLogicPage() {
  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-3xl font-semibold tracking-tight">Frame logic</h1>
        <p className="mt-2 text-muted-foreground">
          Why a road bike and a mountain bike are shaped so differently. Explore the families and styles, then pick a size
          to start from in the frame tool.
        </p>
      </div>
      <FrameLogic />
    </div>
  )
}
