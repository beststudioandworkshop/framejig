import { DEFAULT_INPUTS } from "../constants"
import type { CategoryProfile } from "../category-types"
import type { FrameInputs } from "../types"
import { completeFrame, deriveRide, estimateDisclaimer } from "./helpers"
import { ROAD_RIDE } from "./road"

const RAW: FrameInputs = {
  ...DEFAULT_INPUTS,
  bikeType: "gravel",
  wheel: { rimDiameter: 622, tireSection: 40 },
  crankLength: 172.5,
  seatTubeAngle: 73,
  headTubeAngle: 71,
  seatTubeLength: 540,
  seatTubeExtension: 25,
  effectiveTopTube: 572,
  headTubeLength: 150,
  bbDrop: 70,
  chainstayLength: 430,
  forkAxleToCrown: 395,
  forkRake: 50,
  rearSpacing: 142,
}

export const gravel: CategoryProfile = {
  id: "gravel",
  label: "Gravel",
  tagline: "Road speed, with the calm to go off pavement.",
  forWhat: "Gravel roads, mixed surfaces and long adventures. A road-style bike made calmer and roomier for wider tires and loose ground.",
  ranges: {
    headTubeAngle: { label: "Head tube angle", unit: "°", low: 69.5, high: 72.5 },
    seatTubeAngle: { label: "Seat tube angle", unit: "°", low: 72, high: 74.5 },
    bbDrop: { label: "BB drop", unit: "mm", low: 60, high: 75 },
    trail: { label: "Trail", unit: "mm", low: 58, high: 78 },
    chainstayLength: { label: "Chainstay length", unit: "mm", low: 420, high: 445 },
    wheelbase: { label: "Wheelbase", unit: "mm", low: 1010, high: 1090 },
  },
  positionRange: { low: 1.4, high: 1.6 },
  rangeWhy: {
    headTubeAngle: "A little slacker than road, about 69.5 to 72.5°, so the steering stays calm on loose surfaces and with wider tires.",
    seatTubeAngle: "About 72 to 74.5°, close to road, so you still pedal efficiently over long days.",
    bbDrop: "Wider tires raise the bottom bracket for the same drop, so gravel frames keep a drop of roughly 60 to 75 mm to stay stable.",
    trail: "More trail than road, about 58 to 78 mm, keeps the steering from feeling twitchy on loose ground and with a bigger wheel.",
    chainstayLength: "Longer chainstays, about 420 to 445 mm, leave room for wide tires and keep the back end calm on loose ground.",
    wheelbase: "Longer than road for stability on rough, loose surfaces. It grows with frame size, and the range is for a medium.",
    position: "A little taller for its length than road for comfort over long, rough days.",
  },
  feel: [
    { title: "Steering", text: "More trail and a slacker head angle than road make it calm and forgiving on loose ground." },
    { title: "Handling", text: "A longer wheelbase and chainstays feel stable and settled, and a bit slower to turn than a road bike." },
    { title: "Comfort", text: "A taller position and bigger tires take the edge off long, rough days." },
  ],
  variables: [
    { title: "Tire width and wheel size", text: "700c tires of 38 to 50 mm are common, and smaller wheels with bigger tires exist too. A wider tire is a bigger wheel, which changes trail and BB height." },
    { title: "Race or bikepacking", text: "Race frames are shorter and sharper. Bikepacking frames are longer and carry more mounts." },
    { title: "Fork offset", text: "Offset is chosen to set trail for the tire size you run." },
    { title: "Bars and mounts", text: "Flared drop bars, bag mounts and fenders change the fit and clearances." },
  ],
  reference: "Estimates from general knowledge. To be replaced with reference charts.",
  ride: deriveRide(ROAD_RIDE, {
    disclaimer: estimateDisclaimer("gravel"),
    steering: { below: [50, 60, 72, 84], lo: 40, hi: 95 },
    handling: { below: [1000, 1050, 1100], lo: 960, hi: 1160 },
    position: { below: [1.32, 1.42, 1.54, 1.64], lo: 1.25, hi: 1.75 },
    weight: { below: [71.5, 74], lo: 69, hi: 76 },
    bottomBracket: { below: [60, 76, 85], lo: 52, hi: 92 },
    shortChainstay: 425,
    longChainstay: 445,
    text: { "steering.Neutral": "Tends to track predictably and still turns when you ask. The common middle for gravel bikes." },
  }),
  base: completeFrame(RAW),
  grade: { reachStep: 10, stackStep: 20, seatTubeStep: 20, headAngleStep: 0, seatAngleStep: 0 },
}
