"use client"

import { useId, useState, type ReactNode } from "react"

import { Field, FieldDescription, FieldLabel } from "@/components/ui/field"
import { Input } from "@/components/ui/input"

interface ValueInputProps {
  label: string
  /** Shown to the right of the label, e.g. "mm" or "°". */
  unit: string
  value: number
  parse: (text: string) => number | null
  format: (value: number) => string
  onChange: (value: number) => void
  hint?: string
  /** Shows a derived value that can't be edited in the current mode. */
  disabled?: boolean
  /** Compact: no hint, smaller label (for the tube table). */
  hideLabel?: boolean
  /** Replaces the text label (e.g. a "measured as" dropdown). `label` is still the accessible name. */
  labelNode?: ReactNode
}

/**
 * Text field for a number. Valid values are pushed up as you type; the text is
 * only reformatted on blur so the cursor isn't fought.
 */
export function ValueInput({ label, unit, value, parse, format, onChange, hint, disabled, hideLabel, labelNode }: ValueInputProps) {
  const id = useId()
  const [draft, setDraft] = useState<string | null>(null)
  // Show what's being typed, unless the number was changed from outside (a loaded
  // file, an undo) and no longer matches it. Text that isn't a number yet stays.
  const parsedDraft = draft === null ? null : parse(draft)
  const draftStale = parsedDraft !== null && !(Math.abs(parsedDraft - value) < 1e-9)
  const shown = draft !== null && !draftStale ? draft : Number.isFinite(value) ? format(value) : ""
  const invalid = draft !== null && parsedDraft === null

  return (
    <Field>
      {labelNode ? (
        <div className="flex items-center justify-between gap-2">
          {labelNode}
          <span className="text-sm text-muted-foreground">{unit}</span>
        </div>
      ) : (
        <FieldLabel htmlFor={id} className={hideLabel ? "sr-only" : "justify-between"}>
          <span>{label}</span>
          {!hideLabel && <span className="font-normal text-muted-foreground">{unit}</span>}
        </FieldLabel>
      )}
      <Input
        id={id}
        inputMode="decimal"
        autoComplete="off"
        value={shown}
        disabled={disabled}
        aria-invalid={invalid || undefined}
        aria-label={hideLabel || labelNode ? `${label} (${unit})` : undefined}
        onChange={(e) => {
          const text = e.target.value
          setDraft(text)
          const parsed = parse(text)
          if (parsed !== null) onChange(parsed)
        }}
        onBlur={() => setDraft(null)}
      />
      {hint && !hideLabel && <FieldDescription>{hint}</FieldDescription>}
    </Field>
  )
}
