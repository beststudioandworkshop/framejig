import type { Metadata } from "next"
import Link from "next/link"

import { Card, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"

export const metadata: Metadata = { title: "Tools" }

export default function ToolsPage() {
  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-3xl font-semibold tracking-tight">Tools</h1>
        <p className="mt-2 text-muted-foreground">Free tools for planning a custom frame.</p>
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        <Link href="/tools/frame" className="rounded-xl outline-none focus-visible:ring-3 focus-visible:ring-ring/50">
          <Card className="h-full transition-colors hover:bg-muted/50">
            <CardHeader>
              <CardTitle>Frame geometry</CardTitle>
              <CardDescription>
                Set the angles and tube lengths, or stack and reach, and get trail, wheelbase and the tube schedule.
              </CardDescription>
            </CardHeader>
          </Card>
        </Link>
        <Link href="/tools/jig" className="rounded-xl outline-none focus-visible:ring-3 focus-visible:ring-ring/50">
          <Card className="h-full transition-colors hover:bg-muted/50">
            <CardHeader>
              <CardTitle>Frame jig</CardTitle>
              <CardDescription>
                Positions from a fixed rear axle, a parts list for the jig, and the tools for building a frame in it.
              </CardDescription>
            </CardHeader>
          </Card>
        </Link>
      </div>
    </div>
  )
}
