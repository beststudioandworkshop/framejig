// Building notes: the order of work for a frame, depending on how it's joined
// and what it's made of. Rules of thumb for a planner. They are not a course,
// not engineering advice, and not a substitute for someone experienced looking
// over your first frame.
import type { BikeType, FrameInputs, FrameMaterial, FrameProcess } from "./types"

export interface BuildStep {
  id: string
  title: string
  body: string
  /** Shown only for these joining processes / materials. Absent means everyone. */
  processes?: FrameProcess[]
  materials?: FrameMaterial[]
  bikeTypes?: BikeType[]
}

const STEPS: BuildStep[] = [
  {
    id: "numbers",
    title: "Check your numbers",
    body: "Read the readouts and clear every error. Look at the warnings, especially toe overlap and tire clearance. Print the tube schedule. This tool lays out the shape; it says nothing about strength, so confirm tube sizes with your tubing supplier.",
  },
  {
    id: "tubing",
    title: "Choose and inspect the tubing",
    body: "Ask your tubing supplier which alloy and wall thickness suit the rider and the use. Roll each tube on a flat surface to check it's straight, and check the diameters with calipers before you cut.",
  },
  {
    id: "mtb-fork",
    title: "Check the fork you'll actually use",
    body: "The numbers assume the fork's axle-to-crown length at the sag you ride at. Measure the real fork, with its travel, and compare. A longer or shorter fork than the one you designed around changes the head angle and the BB height.",
    bikeTypes: ["mountain"],
  },
  {
    id: "mtb-dropper",
    title: "Check the seat tube for a dropper post",
    body: "If you'll run a dropper post, check its diameter, the seat tube's inside diameter after reaming, and how much of the post has to sit inside the tube. Do this before you cut, not after.",
    bikeTypes: ["mountain"],
  },
  {
    id: "wide-tire-clearance",
    title: "Mock up tire and chain clearance",
    body: "This tool checks the tires against the seat tube and down tube only. It doesn't check the chainstays, seat stays, chain or crank. With big tires, mock these up before you commit.",
    bikeTypes: ["gravel", "touring", "mountain"],
  },
  {
    id: "touring-mounts",
    title: "Plan the racks, fenders and bottle cages",
    body: "Each rack, fender and bottle cage needs braze-ons or eyelets in the right place, and the frame needs clearance for them. Decide on them before you cut, not after.",
    bikeTypes: ["touring"],
  },
  {
    id: "touring-heel",
    title: "Check heel clearance with your bags",
    body: "With panniers on the rack, your heels can hit them if the chainstays are short. Check with your actual bags and shoes before you commit.",
    bikeTypes: ["touring"],
  },
  {
    id: "track-ends",
    title: "Check the track ends and chain line",
    body: "Track frames use horizontal track ends and 120 mm rear spacing, and this tool doesn't model them. Check your hub, chain line and track ends against the frame before you cut.",
    bikeTypes: ["track"],
  },
  {
    id: "cut",
    title: "Cut and miter the tubes",
    body: "The schedule lengths run joint to joint along the centerline. They are not cut lengths. Miters and copes change them, so cut a little long and fit each tube to its neighbor. Deburr every end. Miter templates aren't in this tool yet.",
  },
  {
    id: "prep",
    title: "Prepare the joints",
    body: "Degrease everything and handle it with clean gloves. Fit each joint tight and square before any heat.",
  },
  {
    id: "lug-fit",
    title: "Fit the lugs",
    body: "Dry-fit every tube into its lug and check the angles against your design before you flux anything. Lugs set the angles, so an angle that doesn't match is a problem you'll weld in.",
    processes: ["lugged"],
  },
  {
    id: "vent",
    title: "Add vent holes",
    body: "A sealed tube can build up pressure when it's heated. As a rule of thumb, give each tube a small vent hole where air can escape, in a place that suits the frame. Ask an experienced builder where.",
    processes: ["tig", "braze", "lugged"],
  },
  {
    id: "jig",
    title: "Set up the jig",
    body: "Use the jig tool. Set the spine tilt, set each carrier's angle and where it crosses the spine, fit the standoff and dummy axle, and mount the tubes on the mandrels. Level the base first. Then measure the tape checks before you tack anything.",
  },
  {
    id: "tack",
    title: "Tack it",
    body: "Tack the joints without finishing any. A common order is the main triangle first, then the rear triangle. Take only small tacks so you can still adjust. Measure the tape checks again after tacking.",
  },
  {
    id: "align",
    title: "Check alignment before the real joins",
    body: "With an alignment gauge, check that the rear triangle and the head tube are in line with the center plane. Fix anything now, while the tacks are small.",
  },
  {
    id: "tig",
    title: "Weld",
    body: "Work around the frame instead of finishing one joint at a time, so heat spreads and the frame doesn't pull to one side. Let it cool between passes and re-check the tape checks.",
    processes: ["tig"],
  },
  {
    id: "braze",
    title: "Braze",
    body: "Flux the joint and bring it up to temperature evenly. Filler flows toward the heat, so heat the tubes, not the filler. Don't overheat. Clean off all flux afterward, because it traps moisture. Work in a ventilated space.",
    processes: ["braze", "lugged"],
  },
  {
    id: "titanium",
    title: "Keep the titanium shielded",
    body: "Titanium takes up contamination from the air at welding heat. Shield the inside with an argon purge and the outside with a trailing shield, and keep every surface clean. Ask a titanium builder before your first joint.",
    materials: ["titanium"],
  },
  {
    id: "aluminum",
    title: "Plan the heat treatment",
    body: "Many frame aluminum alloys are heat treated after welding. Ask your tubing supplier what yours needs, and who can do it, before you weld.",
    materials: ["aluminum"],
  },
  {
    id: "recheck",
    title: "Check everything again",
    body: "Once it's cool, check the tape checks and alignment again before you take it out of the jig. Check again after it's out.",
  },
  {
    id: "face",
    title: "Face and chase",
    body: "After joining, ream and face the head tube, and chase and face the BB shell, so the headset and bottom bracket seat square. Check the dropouts are in line.",
  },
  {
    id: "finish",
    title: "Clean up and finish",
    body: "Clean off flux, oxide and any spatter, and inspect every joint. Treat the inside of steel tubes against rust. Then file, sand and finish.",
  },
  {
    id: "review",
    title: "Have it checked before anyone rides it",
    body: "Have an experienced builder look over the first frame, joints included. Frames carry a person, and a planner can't see a bad joint.",
  },
]

/** The steps for this frame, in order. */
export function buildingNotes(inputs: Pick<FrameInputs, "process" | "material"> & { bikeType?: BikeType }): BuildStep[] {
  return STEPS.filter(
    (s) =>
      (!s.processes || s.processes.includes(inputs.process)) &&
      (!s.materials || s.materials.includes(inputs.material)) &&
      (!s.bikeTypes || s.bikeTypes.includes(inputs.bikeType ?? "road")),
  )
}
