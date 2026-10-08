import { DEFAULT_INPUTS } from "../constants"
import type { CategoryProfile } from "../category-types"
import type { FrameInputs } from "../types"
import { completeFrame, deriveRide, estimateDisclaimer } from "./helpers"
import { ROAD_RIDE } from "./road"

const RAW: FrameInputs = {
  ...DEFAULT_INPUTS,
  bikeType: "track",
  wheel: { rimDiameter: 622, tireSection: 25 },
  crankLength: 165,
  rearSpacing: 120,
  seatTubeAngle: 74.5,
  headTubeAngle: 73.5,
  seatTubeLength: 540,
  seatTubeExtension: 25,
  effectiveTopTube: 540,
  headTubeLength: 135,
  bbDrop: 50,
  chainstayLength: 405,
  forkAxleToCrown: 360,
  forkRake: 38,
}

export const track: CategoryProfile = {
  id: "track",
  label: "Track",
  tagline: "Short, steep and very direct.",
  forWhat: "Velodromes, sprints and fixed-gear riding. A short, steep, stiff frame with a high bottom bracket, built for a direct feel and tight handling.",
  ranges: {
    headTubeAngle: { label: "Head tube angle", unit: "°", low: 72.5, high: 75.5 },
    seatTubeAngle: { label: "Seat tube angle", unit: "°", low: 73, high: 76.5 },
    bbDrop: { label: "BB drop", unit: "mm", low: 40, high: 60 },
    trail: { label: "Trail", unit: "mm", low: 52, high: 66 },
    chainstayLength: { label: "Chainstay length", unit: "mm", low: 395, high: 415 },
    wheelbase: { label: "Wheelbase", unit: "mm", low: 940, high: 1010 },
  },
  positionRange: { low: 1.3, high: 1.5 },
  rangeWhy: {
    headTubeAngle: "A steep head angle, about 72.5 to 75.5°, makes the steering very quick and precise.",
    seatTubeAngle: "About 73 to 76.5° sits the rider forward over the pedals, for direct power.",
    bbDrop: "A small drop, about 40 to 60 mm, gives a high bottom bracket so you can pedal through banked turns without a pedal touching.",
    trail: "About 52 to 66 mm keeps the steering quick but not twitchy.",
    chainstayLength: "Very short chainstays, about 395 to 415 mm, keep the bike compact and stiff for sprinting.",
    wheelbase: "Short, for tight handling. It grows with frame size, and the range is for a medium.",
    position: "A low, long position keeps the rider aerodynamic and forward.",
  },
  feel: [
    { title: "Steering", text: "Very quick and direct. It rewards a smooth, precise rider." },
    { title: "Handling", text: "A short wheelbase and short chainstays make it tight and responsive." },
    { title: "Efficiency", text: "A stiff, compact frame and a forward position put the power straight into the pedals." },
  ],
  variables: [
    { title: "Track or street", text: "Street and fixed-gear frames often get a lower bottom bracket, a little more room and brake mounts. Track frames stay high, short and tight." },
    { title: "Dropouts", text: "Track frames use horizontal track ends and 120 mm rear spacing. This tool doesn't model the ends." },
    { title: "Tire width", text: "Track tires are narrow, which keeps the wheel small and the bottom bracket high." },
    { title: "Chain line", text: "A fixed gear needs the chain line to match the cog and chainring." },
  ],
  reference: "Estimates from general knowledge. To be replaced with reference charts.",
  ride: deriveRide(ROAD_RIDE, {
    disclaimer: estimateDisclaimer("track"),
    steering: { below: [48, 58, 68, 78], lo: 40, hi: 90 },
    handling: { below: [940, 990, 1030], lo: 910, hi: 1060 },
    position: { below: [1.25, 1.38, 1.5, 1.6], lo: 1.15, hi: 1.7 },
    weight: { below: [73, 75.5], lo: 71, hi: 78 },
    bottomBracket: { below: [40, 60, 68], lo: 33, hi: 75 },
    shortChainstay: 400,
    longChainstay: 412,
    text: { "steering.Neutral": "Tends to track predictably and still turns when you ask. A usual middle for a track bike." },
    notes: ["Toe overlap is common on track frames because the front end is so short and steep."],
  }),
  base: completeFrame(RAW),
  grade: { reachStep: 8, stackStep: 15, seatTubeStep: 20, headAngleStep: 0, seatAngleStep: 0 },
}
