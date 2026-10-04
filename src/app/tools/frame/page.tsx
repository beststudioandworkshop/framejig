import type { Metadata } from "next"

import { FrameConfigurator } from "@/components/tools/frame/frame-configurator"

export const metadata: Metadata = { title: "Frame geometry" }

export default function FramePage() {
  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-3xl font-semibold tracking-tight">Frame geometry</h1>
        <p className="mt-2 text-muted-foreground">
          Set the angles and tube lengths, or the stack and reach, and see what the frame works out to.
        </p>
      </div>
      <FrameConfigurator />
    </div>
  )
}
