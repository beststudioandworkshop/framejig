"use client"

import { LinkIcon } from "lucide-react"
import { toast } from "sonner"

import { Button } from "@/components/ui/button"

/** Copies the full URL for a relative tool link (the frame travels in the link). */
export function CopyLinkButton({ href, label = "Copy link" }: { href: string; label?: string }) {
  const copy = async () => {
    try {
      await navigator.clipboard.writeText(new URL(href, window.location.origin).toString())
      toast("Link copied. It reopens exactly this design.")
    } catch {
      toast("Couldn't copy the link. Copy it from the address bar after opening the jig tool.")
    }
  }
  return (
    <Button variant="outline" size="sm" onClick={copy}>
      <LinkIcon /> {label}
    </Button>
  )
}
