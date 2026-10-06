import Link from "next/link"

import { Button } from "@/components/ui/button"
import { Separator } from "@/components/ui/separator"
import { ThemeToggle } from "@/components/theme-toggle"

export default function Home() {
  return (
    <div className="flex min-h-screen flex-col">
      <header className="flex items-center justify-between px-4 py-4 sm:px-8">
        <span className="text-lg font-semibold tracking-tight">Framejig</span>
        <ThemeToggle />
      </header>
      <main className="flex flex-1 flex-col items-center justify-center gap-4 px-4 text-center">
        <h1 className="text-4xl font-semibold tracking-tight sm:text-6xl">
          Framejig
        </h1>
        <p className="max-w-md text-muted-foreground">
          Plan a custom bike frame: the geometry, a tube schedule, and the jig to build it in.
        </p>
        <div className="flex flex-wrap justify-center gap-2">
          <Button render={<Link href="/tools/logic" />}>Frame logic</Button>
          <Button variant="outline" render={<Link href="/tools/frame" />}>
            Frame geometry
          </Button>
          <Button variant="outline" render={<Link href="/tools/jig" />}>
            Frame jig
          </Button>
        </div>
      </main>
      <Separator />
      <footer className="flex items-center justify-between px-4 py-4 text-sm text-muted-foreground sm:px-8">
        <span>© Framejig</span>
        <Button variant="link" render={<Link href="/system" />}>
          Design system
        </Button>
      </footer>
    </div>
  )
}
