// How the geometry might feel on the road, in plain language.
//
// These are RULES OF THUMB for road and gravel style frames, not measurements
// and not verified limits. Rider, tires, fork, stem, bars and wheel size all
// change how a bike feels. Treat it as a way to read the numbers, not a verdict.
import type { FrameInputs, FrameMetrics } from "./types"

export const RIDE_DISCLAIMER =
  "Rules of thumb for road and gravel style frames. Your weight, tires, fork, stem and bars all change how a bike feels, so use this to read the numbers, not as a verdict."

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

interface Band {
  /** The band applies below this value. */
  below: number
  label: string
  text: string
}

function band(v: number, bands: Band[], last: Omit<Band, "below">): Omit<Band, "below"> {
  return bands.find((b) => v < b.below) ?? last
}

const STEERING: Band[] = [
  { below: 45, label: "Very quick", text: "Steers fast and flicks into corners, and can feel nervous or twitchy, especially at speed or with a light touch on the bars." },
  { below: 55, label: "Quick", text: "Responsive and eager to turn. Rewards a light, relaxed hold on the bars." },
  { below: 65, label: "Neutral", text: "Tends to track predictably and still turns when you ask. The common middle for road and gravel bikes." },
  { below: 75, label: "Stable", text: "Calm and settled in a straight line, and steers with more deliberate input. Good for loads and rough ground." },
]
const STEERING_LAST = { label: "Very stable", text: "Heavy to steer. It wants to go straight and can feel sluggish at low speed." }

const HANDLING: Band[] = [
  { below: 975, label: "Nimble", text: "A short wheelbase makes it quick to change direction and easy to flick around, and a bit more reactive over rough or fast ground." },
  { below: 1030, label: "Balanced", text: "A middle-of-the-road wheelbase. Turns willingly and still feels settled." },
  { below: 1080, label: "Planted", text: "A longer wheelbase feels steady and calm, with a wider turning arc." },
]
const HANDLING_LAST = { label: "Long and calm", text: "A very long wheelbase is calm and steady at speed, and slow to turn in tight spaces." }

const POSITION: Band[] = [
  { below: 1.35, label: "Stretched out", text: "Low and long, with more weight on the hands. Sporty and aero, and can be hard on the back and neck for some riders." },
  { below: 1.45, label: "Sporty", text: "A forward, athletic position, a little low. Common on race-minded frames." },
  { below: 1.55, label: "Balanced", text: "A middle position: not stretched, not sat bolt upright. A common all-day fit." },
  { below: 1.65, label: "Upright", text: "Taller and shorter. Weight sits more on the saddle and the view is easier. Relaxed for long days." },
]
const POSITION_LAST = { label: "Very upright", text: "Very tall for its length. Comfortable and relaxed, with less weight on the hands and more wind in the chest." }

const WEIGHT: Band[] = [
  { below: 72, label: "Set back", text: "The rider sits further behind the pedals. Relaxed and easy to sit in. Climbing out of the saddle can feel less direct." },
  { below: 74.5, label: "Middle", text: "A middle seat tube angle. The rider sits over the pedals without feeling pushed forward." },
]
const WEIGHT_LAST = { label: "Set forward", text: "The rider sits further over the pedals, which feels direct and strong for pedaling and climbing, with more weight toward the front." }

const BB: Band[] = [
  { below: 62, label: "High", text: "A high bottom bracket gives more pedal clearance in corners and over rough ground, and can feel perched." },
  { below: 72, label: "Typical", text: "A usual bottom bracket height. Feels settled and still clears the pedals in most corners." },
  { below: 82, label: "Low", text: "A low bottom bracket feels planted and stable in corners, with a lower center of mass." },
]
const BB_LAST = { label: "Very low", text: "Very planted, but the pedals are more likely to touch the ground in corners or over bumps." }

const mm = (n: number) => `${Number(n.toFixed(1))} mm`

/** Plain-language read of the geometry. Always returns the same traits, in order. */
export function rideFeel(inputs: FrameInputs, m: FrameMetrics, options: RideOptions = {}): RideFeel {
  const ratio = m.stack / m.reach

  const steer = band(m.trail, STEERING, STEERING_LAST)
  const handle = band(m.wheelbase, HANDLING, HANDLING_LAST)
  const pos = band(ratio, POSITION, POSITION_LAST)
  const weight = band(inputs.seatTubeAngle, WEIGHT, WEIGHT_LAST)
  const bb = band(m.bbDrop, BB, BB_LAST)

  const chainstay =
    m.chainstayLength < 420
      ? " Short chainstays add snap when you pedal hard."
      : m.chainstayLength > 445
        ? " Long chainstays feel calm and settled and leave room for bigger tires."
        : ""

  const traits: RideTrait[] = [
    {
      id: "steering",
      title: "Steering",
      low: "Quick",
      high: "Stable",
      position: along(m.trail, 35, 85),
      label: steer.label,
      text: steer.text,
      basis: `Trail ${mm(m.trail)}, head angle ${Number(inputs.headTubeAngle.toFixed(1))}°, rake ${mm(inputs.forkRake)}`,
    },
    {
      id: "handling",
      title: "Handling",
      low: "Nimble",
      high: "Planted",
      position: along(m.wheelbase, 920, 1120),
      label: handle.label,
      text: `${handle.text}${chainstay} Bigger frames always have longer wheelbases, so compare with bikes your size.`,
      basis: `Wheelbase ${mm(m.wheelbase)}, chainstay ${mm(m.chainstayLength)}`,
    },
    {
      id: "position",
      title: "Riding position",
      low: "Stretched out",
      high: "Upright",
      position: along(ratio, 1.25, 1.75),
      label: pos.label,
      text: `${pos.text} Stem, spacers and bars change this a lot.`,
      basis: `Stack ${mm(m.stack)}, reach ${mm(m.reach)}, stack to reach ${ratio.toFixed(2)}`,
    },
    {
      id: "weight",
      title: "Weight over the pedals",
      low: "Set back",
      high: "Set forward",
      position: along(inputs.seatTubeAngle, 70, 77),
      label: weight.label,
      text: `${weight.text} Seatpost setback and saddle position move this too.`,
      basis: `Seat tube angle ${Number(inputs.seatTubeAngle.toFixed(1))}°`,
    },
    {
      id: "bottomBracket",
      title: "Bottom bracket",
      low: "High, clearance",
      high: "Low, planted",
      position: along(m.bbDrop, 55, 90),
      label: bb.label,
      text: bb.text,
      basis: `BB drop ${mm(m.bbDrop)}, BB height ${mm(m.bbHeight)} with these wheels`,
    },
  ]

  const get = (id: RideTraitId) => traits.find((t) => t.id === id)!
  const quick = get("steering").position < 0.35 && get("handling").position < 0.4
  const calm = get("steering").position > 0.65 && get("handling").position > 0.6
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

  const notes: string[] = []
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
