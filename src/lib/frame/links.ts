// Links between the tools. A frame (and an optional reference) travel in the
// URL; see share.ts. Paths are relative; callers add the origin when copying.
import { encodeFrame } from "./share"
import type { FrameInputs } from "./types"

export type ToolPath = "frame" | "jig"

export function toolLink(tool: ToolPath, inputs: FrameInputs, reference?: FrameInputs | null): string {
  const q = new URLSearchParams({ d: encodeFrame(inputs) })
  if (reference) q.set("r", encodeFrame(reference))
  return `/tools/${tool}?${q.toString()}`
}
