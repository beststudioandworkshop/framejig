import { DEFAULT_INPUTS } from "../constants"
import type { CategoryProfile } from "../category-types"
import type { FrameInputs } from "../types"
import { completeFrame, deriveRide, estimateDisclaimer } from "./helpers"
import { ROAD_RIDE } from "./road"

const RAW: FrameInputs = {
  ...DEFAULT_INPUTS,
  bikeType: "touring",
  wheel: { rimDiameter: 622, tireSection: 40 },
  crankLength: 170,
  bbShellWidth: 68,
  rearSpacing: 135,
  seatTubeAngle: 73,
  headTubeAngle: 72,
  seatTubeLength: 540,
  seatTubeExtension: 25,
  effectiveTopTube: 585,
  headTubeLength: 205,
  bbDrop: 70,
  chainstayLength: 455,
  forkAxleToCrown: 390,
  forkRake: 45,
}

export const touring: CategoryProfile = {
  id: "touring",
  label: "Touring",
  tagline: "Steady, roomy and made to carry a load.",
  forWhat: "Long trips with luggage. A relaxed, upright, stable bike with room for racks, bags, fenders and big tires.",
  ranges: {
    headTubeAngle: { label: "Head tube angle", unit: "°", low: 70.5, high: 73 },
    seatTubeAngle: { label: "Seat tube angle", unit: "°", low: 72, high: 74 },
    bbDrop: { label: "BB drop", unit: "mm", low: 62, high: 78 },
    trail: { label: "Trail", unit: "mm", low: 55, high: 75 },
    chainstayLength: { label: "Chainstay length", unit: "mm", low: 440, high: 470 },
    wheelbase: { label: "Wheelbase", unit: "mm", low: 1040, high: 1120 },
  },
  positionRange: { low: 1.5, high: 1.7 },
  rangeWhy: {
    headTubeAngle: "A moderate head angle, about 70.5 to 73°, gives steady steering that doesn't get twitchy with a load.",
    seatTubeAngle: "About 72 to 74° for a relaxed, settled seat you can sit in all day.",
    bbDrop: "A moderate drop of about 62 to 78 mm keeps a loaded bike low and stable.",
    trail: "About 55 to 75 mm keeps a loaded bike steady. The right amount depends on where you carry the weight.",
    chainstayLength: "Long chainstays, about 440 to 470 mm, so your heels clear the panniers and the bike stays calm under load.",
    wheelbase: "Long, for stability and room for bags. It grows with frame size, and the range is for a medium.",
    position: "A tall, upright position, with a high stack for its length, is comfortable for long days.",
  },
  feel: [
    { title: "Steering", text: "Steady and predictable, and it holds its line with a load on board." },
    { title: "Handling", text: "A long wheelbase and long chainstays feel calm and planted, and slow to turn in tight spaces." },
    { title: "Comfort", text: "An upright position and big tires keep long days comfortable." },
  ],
  variables: [
    { title: "Where the load sits", text: "Weight on the front, the back or the frame changes how a loaded bike steers, so the geometry should suit your luggage." },
    { title: "Wheel size", text: "26-inch and 700c wheels give different radii, so the same head angle gives a different trail." },
    { title: "Mounts", text: "Racks, fenders and bottle cages each need braze-ons and clearance, so plan them before you cut." },
    { title: "Heel clearance", text: "Short chainstays can make your heels hit the panniers." },
  ],
  reference: "Estimates from general knowledge. To be replaced with reference charts.",
  ride: deriveRide(ROAD_RIDE, {
    disclaimer: estimateDisclaimer("touring"),
    steering: { below: [48, 58, 70, 82], lo: 40, hi: 95 },
    handling: { below: [1030, 1070, 1120], lo: 980, hi: 1180 },
    position: { below: [1.4, 1.5, 1.62, 1.72], lo: 1.3, hi: 1.85 },
    weight: { below: [71.5, 74], lo: 69, hi: 76 },
    bottomBracket: { below: [62, 78, 86], lo: 52, hi: 94 },
    shortChainstay: 440,
    longChainstay: 465,
    text: { "steering.Neutral": "Tends to track predictably and still turns when you ask. A sensible middle for a touring bike." },
    notes: [
      "Loaded: these numbers describe an empty frame. Weight on the front tends to make the steering feel heavier and slower, and weight on the back tends to make it feel lighter.",
    ],
  }),
  base: completeFrame(RAW),
  grade: { reachStep: 10, stackStep: 15, seatTubeStep: 20, headAngleStep: 0, seatAngleStep: 0 },
}
