import { DEFAULT_INPUTS } from "../constants"
import type { CategoryProfile, RideProfile } from "../category-types"
import { estimateDisclaimer } from "./helpers"

/** The road ride-feel bands. Other categories reuse this wording and move the edges. */
export const ROAD_RIDE: RideProfile = {
  disclaimer: estimateDisclaimer("road"),
  steering: {
    lo: 35,
    hi: 85,
    bands: [
      { below: 45, label: "Very quick", text: "Steers fast and flicks into corners, and can feel nervous or twitchy, especially at speed or with a light touch on the bars." },
      { below: 55, label: "Quick", text: "Responsive and eager to turn. Rewards a light, relaxed hold on the bars." },
      { below: 65, label: "Neutral", text: "Tends to track predictably and still turns when you ask. The common middle for road bikes." },
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
    hi: 95,
    bands: [
      { below: 64, label: "High", text: "A high bottom bracket gives more pedal clearance in corners and over rough ground, and can feel perched." },
      { below: 80, label: "Typical", text: "A usual bottom bracket height. Feels settled and still clears the pedals in most corners." },
      { below: 88, label: "Low", text: "A low bottom bracket feels planted and stable in corners, with a lower center of mass." },
    ],
    last: { label: "Very low", text: "Very planted, but the pedals are more likely to touch the ground in corners or over bumps." },
  },
  shortChainstay: { below: 420, text: "Short chainstays add snap when you pedal hard." },
  longChainstay: { above: 445, text: "Long chainstays feel calm and settled and leave room for bigger tires." },
  notes: [],
}

export const road: CategoryProfile = {
  id: "road",
  label: "Road",
  tagline: "Fast and efficient on pavement.",
  forWhat: "Paved roads, group rides and long days in the saddle. A light, quick bike with a position you can hold for hours.",
  ranges: {
    headTubeAngle: { label: "Head tube angle", unit: "°", low: 70, high: 74 },
    seatTubeAngle: { label: "Seat tube angle", unit: "°", low: 72, high: 75 },
    bbDrop: { label: "BB drop", unit: "mm", low: 65, high: 80 },
    trail: { label: "Trail", unit: "mm", low: 50, high: 70 },
    chainstayLength: { label: "Chainstay length", unit: "mm", low: 405, high: 450 },
    wheelbase: { label: "Wheelbase", unit: "mm", low: 960, high: 1060 },
  },
  positionRange: { low: 1.35, high: 1.55 },
  rangeWhy: {
    headTubeAngle: "A steeper head angle, around 70 to 74°, makes the steering quick and precise at speed.",
    seatTubeAngle: "About 72 to 75° puts the rider over the pedals for efficient pedaling without pushing them too far forward.",
    bbDrop: "65 to 80 mm of drop keeps the bottom bracket low enough to feel planted in corners and still clear the pedals on smooth roads.",
    trail: "50 to 70 mm of trail keeps the steering lively but predictable at speed.",
    chainstayLength: "Short chainstays keep the wheelbase compact and the rear end responsive.",
    wheelbase: "Compact enough to turn quickly, long enough to be steady at speed. It grows with frame size, and the range is for a medium.",
    position: "Stack to reach spans race (low and long) to endurance (taller and shorter).",
  },
  feel: [
    { title: "Steering", text: "A steep head angle with moderate trail makes it quick and precise, and settled at speed." },
    { title: "Handling", text: "A short rear end and a compact wheelbase make it respond quickly when you pedal hard or change line." },
    { title: "Position", text: "A forward position over the pedals favors speed. Endurance versions sit taller for comfort over long distances." },
  ],
  variables: [
    { title: "Race or endurance", text: "Race frames are lower and longer; endurance frames are taller and a little longer in the wheelbase." },
    { title: "Tire width", text: "Wider tires (25 to 32 mm) raise the bottom bracket and need more clearance at the stays and fork." },
    { title: "Fork offset", text: "More offset means less trail and quicker steering, and the other way round." },
    { title: "Brakes and fenders", text: "Rim or disc brakes and fender mounts change the clearances you need." },
  ],
  reference: "Estimates from general knowledge. To be replaced with reference charts.",
  ride: ROAD_RIDE,
  base: DEFAULT_INPUTS,
  grade: { reachStep: 10, stackStep: 20, seatTubeStep: 20, headAngleStep: 0, seatAngleStep: 0 },
}
