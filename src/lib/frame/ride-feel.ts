// How the geometry might feel on the road, in plain language.
//
// These are RULES OF THUMB for road and gravel style frames, not measurements
// and not verified limits. Rider, tires, fork, stem, bars and wheel size all
// change how a bike feels. Treat it as a way to read the numbers, not a verdict.
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

interface Band {
  /** The band applies below this value. */
  below: number
  label: string
  text: string
}

type Last = Omit<Band, "below">

function band(v: number, bands: Band[], last: Last): Last {
  return bands.find((b) => v < b.below) ?? last
}

/** One scale: where the bands fall, and the range the marker moves over. */
interface Scale {
  bands: Band[]
  last: Last
  lo: number
  hi: number
}

interface RideProfile {
  disclaimer: string
  steering: Scale
  handling: Scale
  position: Scale
  weight: Scale
  bottomBracket: Scale
  /** Chainstay lengths (mm) below / above which a comment is added. */
  shortChainstay: { below: number; text: string }
  longChainstay: { above: number; text: string }
  /** Always shown for this type. */
  notes: string[]
}

const road: RideProfile = {
  disclaimer:
    "Rules of thumb for road and gravel style frames. Your weight, tires, fork, stem and bars all change how a bike feels, so use this to read the numbers, not as a verdict.",
  steering: {
    lo: 35,
    hi: 85,
    bands: [
      { below: 45, label: "Very quick", text: "Steers fast and flicks into corners, and can feel nervous or twitchy, especially at speed or with a light touch on the bars." },
      { below: 55, label: "Quick", text: "Responsive and eager to turn. Rewards a light, relaxed hold on the bars." },
      { below: 65, label: "Neutral", text: "Tends to track predictably and still turns when you ask. The common middle for road and gravel bikes." },
      { below: 75, label: "Stable", text: "Calm and settled in a straight line, and steers with more deliberate input. Good for loads and rough ground." },
    ],
    last: { label: "Very stable", text: "Heavy to steer. It wants to go straight and can feel sluggish at low speed." },
  },
  handling: {
    lo: 920,
    hi: 1120,
    bands: [
      { below: 975, label: "Nimble", text: "A short wheelbase makes it quick to change direction and easy to flick around, and a bit more reactive over rough or fast ground." },
      { below: 1030, label: "Balanced", text: "A middle-of-the-road wheelbase. Turns willingly and still feels settled." },
      { below: 1080, label: "Planted", text: "A longer wheelbase feels steady and calm, with a wider turning arc." },
    ],
    last: { label: "Long and calm", text: "A very long wheelbase is calm and steady at speed, and slow to turn in tight spaces." },
  },
  position: {
    lo: 1.25,
    hi: 1.75,
    bands: [
      { below: 1.35, label: "Stretched out", text: "Low and long, with more weight on the hands. Sporty and aero, and can be hard on the back and neck for some riders." },
      { below: 1.45, label: "Sporty", text: "A forward, athletic position, a little low. Common on race-minded frames." },
      { below: 1.55, label: "Balanced", text: "A middle position: not stretched, not sat bolt upright. A common all-day fit." },
      { below: 1.65, label: "Upright", text: "Taller and shorter. Weight sits more on the saddle and the view is easier. Relaxed for long days." },
    ],
    last: { label: "Very upright", text: "Very tall for its length. Comfortable and relaxed, with less weight on the hands and more wind in the chest." },
  },
  weight: {
    lo: 70,
    hi: 77,
    bands: [
      { below: 72, label: "Set back", text: "The rider sits further behind the pedals. Relaxed and easy to sit in. Climbing out of the saddle can feel less direct." },
      { below: 74.5, label: "Middle", text: "A middle seat tube angle. The rider sits over the pedals without feeling pushed forward." },
    ],
    last: { label: "Set forward", text: "The rider sits further over the pedals, which feels direct and strong for pedaling and climbing, with more weight toward the front." },
  },
  bottomBracket: {
    lo: 55,
    hi: 90,
    bands: [
      { below: 62, label: "High", text: "A high bottom bracket gives more pedal clearance in corners and over rough ground, and can feel perched." },
      { below: 72, label: "Typical", text: "A usual bottom bracket height. Feels settled and still clears the pedals in most corners." },
      { below: 82, label: "Low", text: "A low bottom bracket feels planted and stable in corners, with a lower center of mass." },
    ],
    last: { label: "Very low", text: "Very planted, but the pedals are more likely to touch the ground in corners or over bumps." },
  },
  shortChainstay: { below: 420, text: "Short chainstays add snap when you pedal hard." },
  longChainstay: { above: 445, text: "Long chainstays feel calm and settled and leave room for bigger tires." },
  notes: [],
}

const mountain: RideProfile = {
  disclaimer:
    "Rules of thumb for mountain bike frames, and my own estimates rather than verified limits. Fork travel and sag, tires, stem, bars, your weight and the trails you ride all change how a bike feels. Use this to read the numbers, not as a verdict.",
  steering: {
    lo: 80,
    hi: 150,
    bands: [
      { below: 90, label: "Very quick", text: "Steers fast for a mountain bike and can feel darty on steep or fast ground." },
      { below: 105, label: "Quick", text: "Responsive and agile on tight, twisty trails. Asks for more attention at speed on rough ground." },
      { below: 120, label: "Neutral", text: "A balanced middle. Turns willingly on tight trail and stays composed on fast descents." },
      { below: 135, label: "Stable", text: "Steady on steep and fast descents and in rough ground. Takes more effort in tight, slow corners." },
    ],
    last: { label: "Very stable", text: "Very slack and steady, built for steep, fast descents. Can feel heavy and slow in tight corners and on the climbs." },
  },
  handling: {
    lo: 1080,
    hi: 1280,
    bands: [
      { below: 1120, label: "Nimble", text: "A short wheelbase for a mountain bike. Quick in tight corners and easy to maneuver, and less settled at speed." },
      { below: 1170, label: "Balanced", text: "A middle-of-the-road wheelbase. Lively and still steady." },
      { below: 1220, label: "Planted", text: "Long and steady, composed on rough descents, and needs more room in switchbacks." },
    ],
    last: { label: "Long and calm", text: "A very long wheelbase is calm and stable at speed, and slow to turn in tight switchbacks." },
  },
  position: {
    lo: 1.15,
    hi: 1.65,
    bands: [
      { below: 1.28, label: "Stretched out", text: "Long and low for a mountain bike, with a lot of weight forward on the bars. Fast and aggressive, and can be a lot on long climbs." },
      { below: 1.36, label: "Sporty", text: "A forward, athletic position with a long reach. Confident on descents." },
      { below: 1.46, label: "Balanced", text: "A middle position that works for climbing and descending." },
      { below: 1.56, label: "Upright", text: "Taller and shorter, with weight further back. Relaxed, and comfortable on long climbs." },
    ],
    last: { label: "Very upright", text: "Very tall for its length. Relaxed, with less weight on the hands, and less secure on steep descents." },
  },
  weight: {
    lo: 69,
    hi: 76,
    bands: [
      { below: 70, label: "Set back", text: "The rider sits behind the pedals. Relaxed, though the front wheel can lift on steep climbs." },
      { below: 73.5, label: "Middle", text: "A middle seat tube angle. The rider sits over the pedals without feeling pushed forward." },
    ],
    last: { label: "Set forward", text: "The rider sits further over the pedals, which helps keep the front wheel down on steep climbs." },
  },
  bottomBracket: {
    lo: 20,
    hi: 60,
    bands: [
      { below: 30, label: "High", text: "A high bottom bracket clears rocks and roots, and can feel perched in corners." },
      { below: 42, label: "Typical", text: "A usual mountain bike bottom bracket height. Settled, and clears most obstacles." },
      { below: 52, label: "Low", text: "A low bottom bracket feels planted in corners, with a lower center of mass and a bit more chance of pedal strikes." },
    ],
    last: { label: "Very low", text: "Very planted, but the pedals are likely to hit rocks and roots." },
  },
  shortChainstay: { below: 425, text: "Short chainstays make the bike easier to lift and flick around." },
  longChainstay: { above: 445, text: "Long chainstays feel calm and settled and leave room for big tires." },
  notes: [
    "Fork: the numbers assume a rigid fork at the length you enter. A suspension fork compresses as you ride, which steepens the head angle and shortens the trail. Enter axle-to-crown at the sag you ride at.",
  ],
}

const PROFILES: Record<BikeType, RideProfile> = { road, mountain }

/** The caveat to show with the ride feel for this bike type. */
export function rideDisclaimer(type: BikeType): string {
  return PROFILES[type].disclaimer
}

/** The road and gravel caveat (the original wording). */
export const RIDE_DISCLAIMER = road.disclaimer

const mm = (n: number) => `${Number(n.toFixed(1))} mm`

/** Plain-language read of the geometry. Always returns the same traits, in order. */
export function rideFeel(inputs: FrameInputs, m: FrameMetrics, options: RideOptions = {}): RideFeel {
  const prof = PROFILES[inputs.bikeType]
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
