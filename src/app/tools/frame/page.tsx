import type { Metadata } from "next"

import { FrameConfigurator } from "@/components/tools/frame/frame-configurator"
import { decodeFrame } from "@/lib/frame"

export const metadata: Metadata = { title: "Frame geometry" }

const first = (v: string | string[] | undefined) => (Array.isArray(v) ? v[0] : v)

export default async function FramePage({ searchParams }: { searchParams: Promise<{ [key: string]: string | string[] | undefined }> }) {
  const q = await searchParams
  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-3xl font-semibold tracking-tight">Frame geometry</h1>
        <p className="mt-2 text-muted-foreground">
          Set the angles and tube lengths, or the stack and reach, and see what the frame works out to.
        </p>
      </div>
      <FrameConfigurator initial={decodeFrame(first(q.d))} initialReference={decodeFrame(first(q.r))} />
    </div>
  )
}
