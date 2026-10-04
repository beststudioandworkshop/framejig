"use client"

import { useId, useState } from "react"

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
}

/**
 * Text field for a number. Valid values are pushed up as you type; the text is
 * only reformatted on blur so the cursor isn't fought.
 */
export function ValueInput({ label, unit, value, parse, format, onChange, hint, disabled, hideLabel }: ValueInputProps) {
  const id = useId()
  const [draft, setDraft] = useState<string | null>(null)
  const shown = draft ?? (Number.isFinite(value) ? format(value) : "")
  const invalid = draft !== null && parse(draft) === null

  return (
    <Field>
      <FieldLabel htmlFor={id} className={hideLabel ? "sr-only" : "justify-between"}>
        <span>{label}</span>
        {!hideLabel && <span className="font-normal text-muted-foreground">{unit}</span>}
      </FieldLabel>
      <Input
        id={id}
        inputMode="decimal"
        autoComplete="off"
        value={shown}
        disabled={disabled}
        aria-invalid={invalid || undefined}
        aria-label={hideLabel ? `${label} (${unit})` : undefined}
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
