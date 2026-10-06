// Tools for building a frame, depending on how it's joined and what it's made of.
// Rules of thumb for a planner, not a safety course. Anyone brazing, welding or
// using a torch should be trained for it.
import type { FrameInputs } from "./types"

export type ToolCategory = "Measuring" | "Cutting and prep" | "Joining" | "Alignment and fixturing" | "Safety" | "Finishing"

export const TOOL_CATEGORIES: ToolCategory[] = [
  "Measuring",
  "Cutting and prep",
  "Joining",
  "Alignment and fixturing",
  "Safety",
  "Finishing",
]

export interface ToolItem {
  id: string
  category: ToolCategory
  name: string
  why: string
  /** False for things that make the work easier or better but aren't needed to start. */
  essential: boolean
}

const t = (id: string, category: ToolCategory, name: string, why: string, essential = true): ToolItem => ({
  id,
  category,
  name,
  why,
  essential,
})

export function frameTools(inputs: Pick<FrameInputs, "process" | "material">): ToolItem[] {
  const { process, material } = inputs
  const items: ToolItem[] = [
    t("calipers", "Measuring", "Digital calipers", "Tube diameters and wall thicknesses, mandrel fits."),
    t("tape", "Measuring", "Steel rule and tape", "Every check distance on the jig."),
    t("angle", "Measuring", "Digital angle gauge", "Tube angles and mitres. Check it against a known flat before you trust it."),
    t("square", "Measuring", "Machinist's square", "Squaring the jig columns to the spine."),
    t("align", "Measuring", "Frame alignment gauge", "Checks the rear triangle and head tube are in line after the frame is joined.", false),
    t("saw", "Cutting and prep", "Fine-tooth saw or tube cutter", "Cutting tubes to length with a square end."),
    t("notcher", "Cutting and prep", "Tube notcher or files", "Mitres and copes so tubes sit tight against each other."),
    t("deburr", "Cutting and prep", "Deburring tool and abrasive pads", "Clean ends and surfaces so the joint takes."),
    t("vise", "Cutting and prep", "Tube vise with soft jaws", "Holds tubes without marking or crushing them."),
    t("degrease", "Cutting and prep", "Degreaser and clean rags", "Oil and fingerprints ruin joints."),
    t("clamps", "Alignment and fixturing", "Clamps and V-blocks", "Hold tubes in place for tacking."),
    t("jig", "Alignment and fixturing", "Frame jig", "The jig this tool is sizing: rear axle fixed, stations set from the table."),
    t("reamer", "Alignment and fixturing", "Head tube reamer and facing tool", "Makes the head tube bore round and the ends square, after joining.", false),
    t("bbtools", "Alignment and fixturing", "BB tap or chaser and facing tool", "Cleans the threads and squares the faces of the BB shell, after joining.", false),
    t("ppe", "Safety", "Eye protection and gloves", "For cutting, filing and anything hot."),
    t("vent", "Safety", "Good ventilation or fume extraction", "Welding and brazing fumes are harmful. Work with air moving, and use a respirator rated for what you're doing."),
    t("fire", "Safety", "Fire extinguisher and a clear, non-flammable work area", "Torches and sparks."),
    t("files", "Finishing", "Files and sandpaper", "Smooth the joints."),
  ]

  if (process === "tig") {
    items.push(
      t("tig", "Joining", "TIG welder with a shielding gas supply", "Argon shielding is standard for TIG on all three materials."),
      t("filler", "Joining", "Filler rod matched to the tubing", "Match it to the tube alloy. Ask your tubing supplier."),
      t("tungsten", "Joining", "Tungsten electrodes and a way to sharpen them", "Contaminated electrodes ruin welds."),
      t("helmet", "Safety", "Welding helmet and gloves", "Arc light damages eyes and skin.")
    )
  } else if (process === "braze") {
    items.push(
      t("torch", "Joining", "Torch with a regulated fuel supply", "Brazing needs controlled heat."),
      t("filler", "Joining", "Brazing filler and flux", "Filler and flux are matched to each other and to the tube. Follow the maker's data."),
      t("fluxbrush", "Joining", "Flux brush and a way to clean off flux", "Residue left on the joint traps moisture."),
      t("goggles", "Safety", "Brazing goggles", "Torch glare damages eyes.")
    )
  } else {
    items.push(
      t("lugs", "Joining", "Lugs sized to the tubes and angles", "Lugs set the angles. Check they match your design before ordering."),
      t("torch", "Joining", "Torch with a regulated fuel supply", "Heat the lug evenly so the filler flows through."),
      t("filler", "Joining", "Silver solder or brass, and flux", "Matched to the lug and tube. Follow the maker's data."),
      t("heatshield", "Joining", "Heat shields and cooling rags", "Keep heat off finished joints and thin tubing."),
      t("goggles", "Safety", "Brazing goggles", "Torch glare damages eyes.")
    )
  }

  if (material === "titanium") {
    items.push(
      t("purge", "Joining", "Argon purge for the inside of the tubes, plus a trailing shield", "Titanium contaminates at welding heat if any hot metal sees air."),
      t("tigclean", "Cutting and prep", "Dedicated clean stainless brush and clean gloves", "Titanium needs spotless surfaces.")
    )
  } else if (material === "aluminium") {
    items.push(
      t("brush", "Cutting and prep", "Dedicated stainless brush for aluminium", "Removes oxide; never use it on steel."),
      t("heattreat", "Finishing", "A plan for post-weld heat treatment, if your alloy calls for it", "Many frame aluminium alloys are heat treated after welding. Ask your tubing supplier.", false)
    )
  }

  return items
}
