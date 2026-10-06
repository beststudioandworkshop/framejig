import { DEFAULT_INPUTS } from "../constants"
import type { CategoryProfile, RideProfile } from "../category-types"
import type { FrameInputs } from "../types"
import { completeFrame } from "./helpers"

const RIDE: RideProfile = {
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
      { below: 71.5, label: "Set back", text: "The rider sits behind the pedals. Relaxed, though the front wheel can lift on steep climbs." },
      { below: 75, label: "Middle", text: "A middle seat tube angle. The rider sits over the pedals without feeling pushed forward." },
    ],
    last: { label: "Set forward", text: "The rider sits further over the pedals, which helps keep the front wheel down on steep climbs." },
  },
  bottomBracket: {
    lo: 15,
    hi: 65,
    bands: [
      { below: 25, label: "High", text: "A high bottom bracket clears rocks and roots, and can feel perched in corners." },
      { below: 50, label: "Typical", text: "A usual mountain bike bottom bracket height. Settled, and clears most obstacles." },
      { below: 58, label: "Low", text: "A low bottom bracket feels planted in corners, with a lower center of mass and a bit more chance of pedal strikes." },
    ],
    last: { label: "Very low", text: "Very planted, but the pedals are likely to hit rocks and roots." },
  },
  shortChainstay: { below: 425, text: "Short chainstays make the bike easier to lift and flick around." },
  longChainstay: { above: 445, text: "Long chainstays feel calm and settled and leave room for big tires." },
  notes: [
    "Fork: the numbers assume a rigid fork at the length you enter. A suspension fork compresses as you ride, which steepens the head angle and shortens the trail. Enter axle-to-crown at the sag you ride at.",
  ],
}

/**
 * A 29-inch hardtail with a long, slack front end, specified by reach and stack
 * as mountain bike makers usually do. The fork length is axle to crown at the
 * sag you ride at.
 */
const RAW: FrameInputs = {
  ...DEFAULT_INPUTS,
  bikeType: "mountain",
  wheel: { rimDiameter: 622, tireSection: 60 },
  crankLength: 170,
  bbShellWidth: 73,
  rearSpacing: 142,
  drivers: { bb: "drop", rear: "chainstay", seat: "ct", horizontal: "reach", vertical: "stack" },
  seatTubeAngle: 73,
  headTubeAngle: 65,
  seatTubeLength: 440,
  seatTubeExtension: 25,
  reach: 460,
  stack: 620,
  bbDrop: 40,
  chainstayLength: 435,
  forkAxleToCrown: 540,
  forkRake: 44,
  tubes: {
    ...DEFAULT_INPUTS.tubes,
    downTube: { diameter: 38.1, wall: 1 },
    seatTube: { diameter: 34.9, wall: 0.9 },
  },
}

export const mountain: CategoryProfile = {
  id: "mountain",
  label: "Mountain",
  tagline: "Built for rough ground and steep trails.",
  forWhat: "Trails, rocks, roots and descents. A long, slack front end and a low, planted stance for control, with a position that works for both climbing and descending.",
  ranges: {
    headTubeAngle: { label: "Head tube angle", unit: "°", low: 63, high: 69 },
    seatTubeAngle: { label: "Seat tube angle", unit: "°", low: 71, high: 76 },
    bbDrop: { label: "BB drop", unit: "mm", low: 25, high: 50 },
    trail: { label: "Trail", unit: "mm", low: 95, high: 135 },
    chainstayLength: { label: "Chainstay length", unit: "mm", low: 415, high: 450 },
    wheelbase: { label: "Wheelbase", unit: "mm", low: 1100, high: 1260 },
  },
  positionRange: { low: 1.28, high: 1.46 },
  rangeWhy: {
    headTubeAngle: "A much slacker head angle, about 63 to 69°, puts the front wheel further ahead so steep, rough descents feel steadier.",
    seatTubeAngle: "About 71 to 76°. A steeper seat angle helps keep weight forward on steep climbs. On straight tubes the angle is lower than the effective angle.",
    bbDrop: "A small drop, about 25 to 50 mm, because the bottom bracket has to clear rocks and roots.",
    trail: "A lot of trail, about 95 to 135 mm, comes from the slack head angle and big wheels. It keeps fast, rough descents steady.",
    chainstayLength: "About 415 to 450 mm leaves room for big tires and keeps the rear wheel under you.",
    wheelbase: "Long, around 1100 to 1260 mm, for stability on descents. It grows with frame size, and the range is for a medium.",
    position: "A longer reach for its stack gives a stretched, confident position on descents.",
  },
  feel: [
    { title: "Steering", text: "A slack head angle and lots of trail make it steady and calm on descents, and slower to turn in tight corners." },
    { title: "Handling", text: "A long wheelbase and a low bottom bracket feel planted. The bike asks for more room to turn." },
    { title: "Suspension", text: "A suspension fork changes the numbers as it compresses: steeper head angle and less trail." },
  ],
  variables: [
    { title: "Riding style", text: "Cross-country frames are steeper and shorter. Trail and enduro frames get slacker and longer." },
    { title: "Wheel size", text: "29-inch and 27.5-inch wheels change the radius, so the same head angle gives different trail and BB height." },
    { title: "Fork travel and sag", text: "Longer travel forks are longer from axle to crown, which slackens the head angle." },
    { title: "Hardtail or full suspension", text: "This tool is for a hardtail frame. A rear shock changes how the geometry moves as you ride." },
    { title: "Dropper post", text: "A dropper needs the right seat tube diameter and enough tube length to hold it." },
  ],
  reference: "Estimates from general knowledge. To be replaced with reference charts.",
  ride: RIDE,
  base: completeFrame(RAW),
  grade: { reachStep: 20, stackStep: 10, seatTubeStep: 30, headAngleStep: 0, seatAngleStep: 0 },
}
