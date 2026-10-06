"use client"

import { useState } from "react"

import {
  formatLengthValue,
  parseLength,
  rideFeel,
  RIDE_DISCLAIMER,
  type FrameInputs,
  type FrameResult,
  type LengthUnit,
} from "@/lib/frame"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { ValueInput } from "./value-input"

export function RideFeelCard({ inputs, result, unit }: { inputs: FrameInputs; result: FrameResult; unit: LengthUnit }) {
  const [inseam, setInseam] = useState<number | null>(null)
  if (!result.metrics) return null
  const feel = rideFeel(inputs, result.metrics, { inseam })

  return (
    <Card className="card-tone tone-lavender entry-zone">
      <CardHeader>
        <CardTitle>How it might ride</CardTitle>
        <CardDescription>{RIDE_DISCLAIMER}</CardDescription>
      </CardHeader>
      <CardContent className="flex flex-col gap-6">
        <p className="text-lg font-medium">{feel.summary}</p>

        <ul className="flex flex-col gap-5">
          {feel.traits.map((t) => (
            <li key={t.id} className="flex flex-col gap-2">
              <div className="flex flex-wrap items-center gap-2">
                <h3 className="text-sm font-medium">{t.title}</h3>
                <Badge variant="secondary">{t.label}</Badge>
              </div>
              <div>
                <div
                  className="relative h-2 rounded-full bg-muted"
                  role="img"
                  aria-label={`${t.title}: ${t.label}, between ${t.low} and ${t.high}`}
                >
                  <span
                    className="absolute top-1/2 size-4 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-background bg-primary"
                    style={{ left: `${Math.round(t.position * 100)}%` }}
                  />
                </div>
                <div className="mt-1 flex justify-between text-xs text-muted-foreground">
                  <span>{t.low}</span>
                  <span>{t.high}</span>
                </div>
              </div>
              <p className="text-sm">{t.text}</p>
              <p className="font-mono text-xs text-muted-foreground">{t.basis}</p>
            </li>
          ))}
        </ul>

        <div className="flex flex-col gap-3 rounded-lg border p-3">
          <h3 className="text-sm font-medium">For you</h3>
          <div className="flex max-w-sm items-end gap-2">
            <div className="flex-1">
              <ValueInput
                label="Your inseam (optional)"
                unit={unit}
                hint="Crotch to floor, shoes off. Adds a standover note."
                value={inseam ?? Number.NaN}
                parse={(t) => parseLength(t, unit)}
                format={(mm) => formatLengthValue(mm, unit)}
                onChange={setInseam}
              />
            </div>
            {inseam !== null && (
              <Button variant="ghost" size="sm" onClick={() => setInseam(null)}>
                Clear
              </Button>
            )}
          </div>
          {feel.notes.length === 0 ? (
            <p className="text-sm text-muted-foreground">No toe overlap to worry about.</p>
          ) : (
            <ul className="flex flex-col gap-1 text-sm">
              {feel.notes.map((n) => (
                <li key={n}>{n}</li>
              ))}
            </ul>
          )}
        </div>
      </CardContent>
    </Card>
  )
}
