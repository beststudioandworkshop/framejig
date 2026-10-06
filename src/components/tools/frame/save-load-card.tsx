"use client"

import { useMemo, useRef, useState, useSyncExternalStore } from "react"
import { DownloadIcon, FolderOpenIcon, SaveIcon } from "lucide-react"
import { toast } from "sonner"

import {
  frameFileName,
  parseFrameFile,
  removeSaved,
  serializeFrameFile,
  upsertSaved,
  type FrameInputs,
  type SavedFrame,
} from "@/lib/frame"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Field, FieldLabel } from "@/components/ui/field"
import { Input } from "@/components/ui/input"
import { getServerSnapshot, getSnapshot, readSaved, subscribe, writeSaved } from "./saved-frames-store"

interface SaveLoadCardProps {
  inputs: FrameInputs
  reference: FrameInputs | null
  /** Replace the current frame (and reference). The caller makes this undoable. */
  onLoad: (frame: FrameInputs, reference: FrameInputs | null, name: string) => void
}

const MAX_FILE_BYTES = 1_000_000

export function SaveLoadCard({ inputs, reference, onLoad }: SaveLoadCardProps) {
  const [name, setName] = useState("My frame")
  const fileInput = useRef<HTMLInputElement>(null)
  const raw = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot)
  const saved = useMemo(() => readSaved(raw), [raw])

  const saveHere = () => {
    const ok = writeSaved(upsertSaved(saved, name, inputs, reference))
    toast(ok ? `Saved "${name.trim() || "Untitled frame"}" in this browser` : "This browser wouldn't save it. Download the file instead.")
  }

  const download = () => {
    const url = URL.createObjectURL(new Blob([serializeFrameFile(name, inputs, reference)], { type: "application/json" }))
    const a = document.createElement("a")
    a.href = url
    a.download = frameFileName(name)
    a.click()
    URL.revokeObjectURL(url)
  }

  const loadFile = async (file: File | undefined) => {
    if (!file) return
    if (file.size > MAX_FILE_BYTES) {
      toast("That file is too big to be a saved frame.")
      return
    }
    const parsed = parseFrameFile(await file.text())
    if (!parsed) {
      toast("That doesn't look like a Framejig frame file.")
      return
    }
    setName(parsed.name)
    onLoad(parsed.frame, parsed.reference, parsed.name)
  }

  const remove = (s: SavedFrame) => {
    const before = saved
    writeSaved(removeSaved(saved, s.id))
    toast(`Deleted "${s.name}"`, { action: { label: "Undo", onClick: () => writeSaved(before) } })
  }

  return (
    <Card className="card-tone tone-pink entry-zone">
      <CardHeader>
        <CardTitle>Save and load</CardTitle>
        <CardDescription>
          Download a file to keep, or save in this browser for quick reuse. The browser list can disappear if site data
          is cleared, so the file is the safe copy. A pinned reference is saved with the frame.
        </CardDescription>
      </CardHeader>
      <CardContent className="flex flex-col gap-4">
        <div className="flex flex-wrap items-end gap-3">
          <Field className="w-full max-w-xs">
            <FieldLabel htmlFor="frame-name">Name</FieldLabel>
            <Input id="frame-name" value={name} maxLength={60} onChange={(e) => setName(e.target.value)} autoComplete="off" />
          </Field>
          <Button variant="outline" onClick={saveHere}>
            <SaveIcon /> Save in this browser
          </Button>
          <Button variant="outline" onClick={download}>
            <DownloadIcon /> Download file
          </Button>
          <Button variant="outline" onClick={() => fileInput.current?.click()}>
            <FolderOpenIcon /> Load from file
          </Button>
          <input
            ref={fileInput}
            type="file"
            accept=".json,application/json"
            className="sr-only"
            tabIndex={-1}
            aria-label="Load a saved frame file"
            onChange={async (e) => {
              await loadFile(e.target.files?.[0])
              e.target.value = ""
            }}
          />
        </div>

        {saved.length === 0 ? (
          <p className="text-sm text-muted-foreground">Nothing saved in this browser yet.</p>
        ) : (
          <ul className="flex flex-col divide-y rounded-lg border">
            {saved.map((s) => (
              <li key={s.id} className="flex flex-wrap items-center gap-x-3 gap-y-1 px-3 py-2 text-sm">
                <span className="font-medium">{s.name}</span>
                {s.reference && <Badge variant="outline">with reference</Badge>}
                <span className="text-muted-foreground">{new Date(s.savedAt).toLocaleDateString(undefined, { year: "numeric", month: "short", day: "numeric" })}</span>
                <span className="ml-auto flex gap-1">
                  <Button variant="ghost" size="sm" onClick={() => onLoad(s.frame, s.reference, s.name)}>
                    Load
                  </Button>
                  <Button variant="ghost" size="sm" onClick={() => remove(s)}>
                    Delete
                  </Button>
                </span>
              </li>
            ))}
          </ul>
        )}
      </CardContent>
    </Card>
  )
}
