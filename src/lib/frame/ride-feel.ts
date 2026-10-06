// How the geometry might feel on the road, in plain language.
//
// These are RULES OF THUMB for road and gravel style frames, not measurements
// and not verified limits. Rider, tires, fork, stem, bars and wheel size all
// change how a bike feels. Treat it as a way to read the numbers, not a verdict.
import { CATEGORIES } from "./categories"
import type { Band, BandLast, RideProfile } from "./category-types"
import type { BikeType, FrameInputs, FrameMetrics } from "./types"

export type RideTraitId = "steering" | "handling" | "position" | "weight" | "bottomBracket"

export interface RideTrait {
  id: RideTraitId
  title: string
  /** What the left end of the scale means. */
  low: string
  /** What the right end means. */
  high: string
  /** 0 (left) to 1 (right). */
  position: number
  /** The band the number falls in. */
  label: string
  text: string
  /** The numbers this is based on. */
  basis: string
}

export interface RideFeel {
  summary: string
  traits: RideTrait[]
  /** Things to know: toe overlap, standover. */
  notes: string[]
}

export interface RideOptions {
  /** Rider's inseam, mm. Optional; adds a standover note. */
  inseam?: number | null
}

/** Where a value sits between lo and hi, clamped to 0..1. */
export const along = (v: number, lo: number, hi: number) => Math.min(1, Math.max(0, (v - lo) / (hi - lo)))

function band(v: number, bands: Band[], last: BandLast): BandLast {
  return bands.find((b) => v < b.below) ?? last
}

const profile = (type: BikeType): RideProfile => CATEGORIES[type].ride

/** The caveat to show with the ride feel for this bike type. */
export function rideDisclaimer(type: BikeType): string {
  return profile(type).disclaimer
}

/** The road and gravel caveat (the original wording). */
export const RIDE_DISCLAIMER = CATEGORIES.road.ride.disclaimer

const mm = (n: number) => `${Number(n.toFixed(1))} mm`

/** Plain-language read of the geometry. Always returns the same traits, in order. */
export function rideFeel(inputs: FrameInputs, m: FrameMetrics, options: RideOptions = {}): RideFeel {
  const prof = profile(inputs.bikeType)
  const ratio = m.stack / m.reach

  const steer = band(m.trail, prof.steering.bands, prof.steering.last)
  const handle = band(m.wheelbase, prof.handling.bands, prof.handling.last)
  const pos = band(ratio, prof.position.bands, prof.position.last)
  const weight = band(inputs.seatTubeAngle, prof.weight.bands, prof.weight.last)
  const bb = band(m.bbDrop, prof.bottomBracket.bands, prof.bottomBracket.last)

  const chainstay =
    m.chainstayLength < prof.shortChainstay.below
      ? ` ${prof.shortChainstay.text}`
      : m.chainstayLength > prof.longChainstay.above
        ? ` ${prof.longChainstay.text}`
        : ""

  const traits: RideTrait[] = [
    {
      id: "steering",
      title: "Steering",
      low: "Quick",
      high: "Stable",
      position: along(m.trail, prof.steering.lo, prof.steering.hi),
      label: steer.label,
      text: steer.text,
      basis: `Trail ${mm(m.trail)}, head angle ${Number(inputs.headTubeAngle.toFixed(1))}°, rake ${mm(inputs.forkRake)}`,
    },
    {
      id: "handling",
      title: "Handling",
      low: "Nimble",
      high: "Planted",
      position: along(m.wheelbase, prof.handling.lo, prof.handling.hi),
      label: handle.label,
      text: `${handle.text}${chainstay} Bigger frames always have longer wheelbases, so compare with bikes your size.`,
      basis: `Wheelbase ${mm(m.wheelbase)}, chainstay ${mm(m.chainstayLength)}`,
    },
    {
      id: "position",
      title: "Riding position",
      low: "Stretched out",
      high: "Upright",
      position: along(ratio, prof.position.lo, prof.position.hi),
      label: pos.label,
      text: `${pos.text} Stem, spacers and bars change this a lot.`,
      basis: `Stack ${mm(m.stack)}, reach ${mm(m.reach)}, stack to reach ${ratio.toFixed(2)}`,
    },
    {
      id: "weight",
      title: "Weight over the pedals",
      low: "Set back",
      high: "Set forward",
      position: along(inputs.seatTubeAngle, prof.weight.lo, prof.weight.hi),
      label: weight.label,
      text: `${weight.text} Seatpost setback and saddle position move this too.`,
      basis: `Seat tube angle ${Number(inputs.seatTubeAngle.toFixed(1))}°`,
    },
    {
      id: "bottomBracket",
      title: "Bottom bracket",
      low: "High, clearance",
      high: "Low, planted",
      position: along(m.bbDrop, prof.bottomBracket.lo, prof.bottomBracket.hi),
      label: bb.label,
      text: bb.text,
      basis: `BB drop ${mm(m.bbDrop)}, BB height ${mm(m.bbHeight)} with these wheels`,
    },
  ]

  const quick = ["Very quick", "Quick"].includes(steer.label) && handle.label === "Nimble"
  const calm = ["Stable", "Very stable"].includes(steer.label) && ["Planted", "Long and calm"].includes(handle.label)
  const character = quick ? "A quick, lively bike" : calm ? "A calm, stable bike" : "A balanced all-rounder"
  const seatingByBand: Record<string, string> = {
    "Stretched out": "with a low, stretched-out position",
    Sporty: "with a sporty, forward position",
    Balanced: "with a middle-of-the-road position",
    Upright: "with a tall, relaxed position",
    "Very upright": "with a very tall, relaxed position",
  }
  const seating = seatingByBand[pos.label]
  const summary = `${character}, ${seating}.`

  const notes: string[] = [...prof.notes]
  if (m.toeClearance < 0) {
    notes.push(
      `Toe overlap: with the crank level and the wheel straight, your toe reaches about ${Math.round(-m.toeClearance)} mm into the front tire. In slow, tight turns your toe can touch it. Many riders get used to this.`,
    )
  } else if (m.toeClearance < 10) {
    notes.push("Your toe comes close to the front tire in slow, tight turns.")
  }
  const inseam = options.inseam
  if (inseam !== null && inseam !== undefined && Number.isFinite(inseam) && inseam > 0) {
    const room = inseam - m.standover
    notes.push(
      room < 0
        ? `Standover: the top tube is ${mm(-room)} higher than your inseam, so you couldn't straddle it flat-footed.`
        : room < 25
          ? `Standover: only ${mm(room)} of room between you and the top tube. It's tight.`
          : room < 50
            ? `Standover: ${mm(room)} of room. Usually fine for road riding.`
            : `Standover: ${mm(room)} of room. Plenty.`,
    )
  }

  return { summary, traits, notes }
}
