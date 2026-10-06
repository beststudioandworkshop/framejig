import type { Metadata } from "next"

import { JigConfigurator } from "@/components/tools/frame/jig-configurator"
import { decodeFrame } from "@/lib/frame"

export const metadata: Metadata = { title: "Frame jig" }

const first = (v: string | string[] | undefined) => (Array.isArray(v) ? v[0] : v)

export default async function JigPage({ searchParams }: { searchParams: Promise<{ [key: string]: string | string[] | undefined }> }) {
  const q = await searchParams
  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-3xl font-semibold tracking-tight">Frame jig</h1>
        <p className="mt-2 text-muted-foreground">
          Where to set each station on a jig with a fixed rear axle, what to buy to build it, and the tools to build a
          frame in it.
        </p>
      </div>
      <JigConfigurator frame={decodeFrame(first(q.d))} reference={decodeFrame(first(q.r))} />
    </div>
  )
}
