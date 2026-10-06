import { DEFAULT_INPUTS } from "../constants"
import type { CategoryProfile } from "../category-types"
import type { FrameInputs } from "../types"
import { deriveRide, estimateDisclaimer, fitToRanges } from "./helpers"
import { ROAD_RIDE } from "./road"

const ranges = {
  headTubeAngle: { label: "Head tube angle", unit: "°" as const, low: 66, high: 71 },
  seatTubeAngle: { label: "Seat tube angle", unit: "°" as const, low: 69.5, high: 73 },
  bbDrop: { label: "BB drop", unit: "mm" as const, low: 20, high: 50 },
  trail: { label: "Trail", unit: "mm" as const, low: 60, high: 90 },
  chainstayLength: { label: "Chainstay length", unit: "mm" as const, low: 440, high: 470 },
  wheelbase: { label: "Wheelbase", unit: "mm" as const, low: 1070, high: 1180 },
}
const positionRange = { low: 1.2, high: 1.45 }

/** A 26-inch retro cruiser: fat tires, relaxed angles, and a long, stable rear end. */
const RAW: FrameInputs = {
  ...DEFAULT_INPUTS,
  bikeType: "bruiser",
  wheel: { rimDiameter: 559, tireSection: 50 },
  crankLength: 175,
  rearSpacing: 135,
  seatTubeLength: 480,
  seatTubeExtension: 30,
  forkAxleToCrown: 405,
  tubes: {
    ...DEFAULT_INPUTS.tubes,
    topTube: { diameter: 31.8, wall: 1 },
    downTube: { diameter: 38.1, wall: 1 },
    seatTube: { diameter: 31.8, wall: 1 },
  },
}

export const bruiser: CategoryProfile = {
  id: "bruiser",
  label: "Bruiser",
  tagline: "Retro geometry for cruising around and having a good time.",
  forWhat: "Easygoing rides with fat tires, relaxed angles and a stance that says there's no hurry. Think old-school ballooned-tire mountain bikes and beach cruisers: stable, comfy and a little goofy, built for fun rather than speed.",
  ranges,
  positionRange,
  rangeWhy: {
    headTubeAngle: "A relaxed head angle, roughly 66 to 71°, keeps the steering lazy and forgiving at cruising speed.",
    seatTubeAngle: "About 69.5 to 73°. Sit back, sit up, and enjoy the view. The seat is further behind the pedals than on a sporty bike.",
    bbDrop: "A modest drop, roughly 20 to 50 mm, with fat tires gives a bottom bracket that sits fairly high for the wheel size.",
    trail: "A generous 60 to 90 mm or so of trail gives the calm, self-centering steering that makes it easy to ride no-hands, for the brave.",
    chainstayLength: "Long chainstays, about 440 to 470 mm, make the ride smooth and settled and leave room for big tires.",
    wheelbase: "Long, roughly 1070 to 1180 mm for a medium, for a smooth and unhurried ride. It grows with frame size.",
    position: "Tall for its length, so you sit up and look around instead of leaning over the bars. The small wheels keep the stack in check.",
  },
  feel: [
    { title: "Steering", text: "Lazy and forgiving. It takes a little arm to turn it, and it wants to roll straight." },
    { title: "Handling", text: "A long wheelbase and big tires float over bumps. It's not a bike for tight corners or hurrying." },
    { title: "Mood", text: "Relaxed and a bit heavy. You're here for the ride, not the lap time." },
  ],
  variables: [
    { title: "Which retro", text: "Klunkers, beach cruisers, 1990s rigid mountain bikes and big BMX cruisers all sit in this family, each with its own attitude." },
    { title: "Tire size", text: "Fat 26-inch tires are common. A bigger tire is a bigger wheel, which changes trail and bottom bracket height." },
    { title: "Bars", text: "Swept-back or riser bars set how upright you sit, and change the fit a lot." },
    { title: "Fenders, racks and baskets", text: "Cruisers collect accessories, so plan the mounts before you cut." },
  ],
  reference: "Estimates from general knowledge. To be replaced with reference charts.",
  ride: deriveRide(ROAD_RIDE, {
    disclaimer: estimateDisclaimer("bruiser"),
    steering: { below: [62, 72, 84, 96], lo: 50, hi: 110 },
    handling: { below: [1080, 1140, 1190], lo: 1040, hi: 1230 },
    position: { below: [1.17, 1.27, 1.37, 1.47], lo: 1.07, hi: 1.57 },
    weight: { below: [70.5, 72.5], lo: 68, hi: 75 },
    bottomBracket: { below: [22, 50, 60], lo: 12, hi: 68 },
    shortChainstay: 440,
    longChainstay: 470,
    text: { "steering.Neutral": "Tends to track predictably and still turns when you ask. A usual middle for a cruiser." },
    notes: ["Retro geometry is about comfort and fun, not speed. Expect a relaxed, stable, slightly heavy feel."],
  }),
  base: fitToRanges(RAW, ranges, positionRange),
  grade: { reachStep: 12, stackStep: 15, seatTubeStep: 25, headAngleStep: 0, seatAngleStep: 0 },
}
