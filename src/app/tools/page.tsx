import type { Metadata } from "next"
export const metadata: Metadata = { title: "Tools" }

export default function ToolsPage() {
  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-3xl font-semibold tracking-tight">Tools</h1>
        <p className="mt-2 text-muted-foreground">Free tools for planning a custom frame.</p>
      </div>
      <p className="text-sm text-muted-foreground">The frame geometry tool is on its way.</p>
    </div>
  )
}
