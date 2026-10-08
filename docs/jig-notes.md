# Jig tool (`/tools/jig`)

A separate tool from the frame geometry tool. The frame tool designs the frame;
this one turns it into jig settings, a parts list and a tools list. The frame
travels in the URL (`?d=` for your frame, `?r=` for the pinned reference), made by
`encodeFrame` / `decodeFrame` in `src/lib/frame/share.ts`. Only fields that
differ from the defaults are stored; a bad or missing link falls back to the
example frame with a notice, and a bad field falls back to its default. The
frame page has "Transfer dims to jig" buttons that build that link.

## The jig this models (level spine)

Replaced the earlier tilted-spine design after the user's Rhino sketches (side, perspective and top views).

- The **rear axle is fixed** and is the origin for every number.
- A long **main spine** (planned as 40 x 120 mm T-slot) runs **level**, parallel to the axle line, with its 120 mm
  face standing up. Its **bottom edge is a set height above the axle line**: an input, 120 mm to start with. So
  its top edge is 240 mm up and its centerline 180 mm up.
- Two **posts** (40 x 120 mm, the big profile in plane with the spine) bolt to the spine's front face and slide along it:
  - the **seat tube post hangs below the spine**. The **seat tube carrier pivots on a pin at the center of the
    bottom bracket**. For the default frame that pin sits 190 mm below the spine's bottom edge;
  - the **head tube post stands above the spine**. The **head tube carrier pivots on a pin at the bottom of the head
    tube**. For the default frame that pin sits 99 mm above the spine's top edge.
- Each **carrier** (40 x 80 mm) turns about its pin. Because the spine is level, its angle is simply the frame's own
  seat or head tube angle (the tool also shows the angle from the spine's forward direction, 180 minus that).
  Stops are measured **along the carrier from the pin**, up the tube positive: the seat tube top, and the head tube
  top. The carrier is cut to reach plus 100 mm each end.
- The **rear axle standoff** is a block on the spine's front face that reaches to the near dropout face, so the dummy
  axle reaches the frame's center line seen from above. "Spine face to the frame's center plane" is an input
  (150 mm to start with).
- Positions are given **along the spine** (u, forward from the rear axle) and **across it** (v, up from the spine's
  centerline, negative below). With a level spine these are the frame's own x and y, shifted. Every check distance
  is unchanged (tested).
- A note appears if a pin falls inside the spine's own height (the post can't hang there).
- Wheel size does not move any station (tested), because the axle is fixed and the BB position comes from the BB drop.
- Not decided yet: how the spine is supported, and how a carrier's angle is locked. The parts list has placeholders
  for both ("Spine supports and base", "Angle clamps for the carriers").

## Check distances and envelope

Ten straight-line distances between stations let a tape confirm a set-up. The
"room and travel" panel covers your frame and the pinned reference: the range of
spine length, how far stations sit from the spine centerline, and
each carrier's pin range and angle range. A real size run (many frames) is not
built yet; the envelope only covers two frames.

## Parts list

- Quantities and cut lengths come from the stations. Mandrel, dummy axle, collar
  and fastener sizes say "to suit" because they depend on your tubes and
  dropouts.
- **No part numbers are filled in.** McMaster-Carr's catalog was not reachable
  when this was written (the cloud environment blocks the host), so each line
  carries search terms and an empty part number column in the CSV. Do not guess
  them. Confirm availability and sizes (for example whether a 40 x 120 mm
  profile is stocked) on their site.
- The schematic is not to scale in its hardware: the spine is drawn 120 mm
  wide, carriers 60 mm, the post 80 mm.

## Tools list

`frameTools(inputs)` follows the joining process (TIG, fillet braze, lugged) and
the material (titanium adds an argon purge; aluminum a dedicated brush and a
heat-treatment prompt). Rules of thumb, not a safety course.

## Parked

- A size run (many frames) for the envelope.
- Dropout angle and thru-axle details; a front-on and top view of the jig.
- Real part numbers once the McMaster catalog can be read.

## Links, building notes and styling

- **Links:** `toolLink(tool, inputs, reference)` (`src/lib/frame/links.ts`) builds
  `/tools/frame?d=…&r=…` or `/tools/jig?d=…&r=…`. Both tools have a "Copy link"
  button that copies the full URL; opening it restores the exact design.
- **Building notes:** `buildingNotes(inputs)` (`src/lib/frame/building-notes.ts`)
  gives the order of work, filtered by joining process and material (lug fit for
  lugged; weld for TIG; braze for brazed and lugged; titanium shielding;
  aluminum heat treatment). Rules of thumb only; the last step is always to have
  an experienced builder check the first frame. Miter templates are not in the
  tool yet, and the notes say so.
- **Styling:** uses the tokens already in `globals.css`: a 3px `card-tone`
  band per card (tangerine for the settings cards, sky for the drawing and frame
  summary, tea for readouts and tools, mustard for the schedule and notes,
  lavender for the jig parts and the "next" card) and `entry-zone` so only the
  inputs, selects and chosen toggles are orange. No new tokens.
- Not done: shuffled helper hints under the size fields.

## The drawings

- **Side view and top view** (tabs in the jig settings card). Both are drawn to scale from the same `Jig` the tables
  use. Hardware is drawn at its real profile sizes: the spine and the two posts are 40 x 120 mm (the big parts in
  plane with the spine), the carriers and the rear standoff block 40 x 80 mm.
- **Dimension lines** come from `src/lib/frame/jig-dims.ts`, so each one is a number in a table (tested). Each has a thin
  line at both ends back to the feature it measures, an arrow at each end, and the number on a halo. The side view
  shows: axle line to the spine bottom, the spine's height, each pin's place along the spine, each pin's height
  beyond the spine edge, each post's cut length, the stop distance along each carrier, and each carrier's cut length.
  The top view shows: the spine's cut length, spine face to the frame's center plane, the rear standoff, the rear spacing,
  the BB locator, and the BB shell width.
- **Enlarge** opens a drawing in a big window where you can scroll or pinch to zoom, drag to move, and double click
  to zoom in. The drawings are vector, so they stay sharp.
- The spine is drawn at its cut length (rounded up to 50 mm), starting 100 mm behind the rearmost station.

### Drawing changes after the first review

- The small drawings show only the key dimensions (axle line to the spine, each pin's place along the spine and height off
  the spine edge; in the top view the offset and the two standoffs). **Enlarge** shows all of them. Each `JigDim` has a
  `key` flag.
- Dimension text is smaller, with a halo; the arrows are about 40 percent of their earlier size.
- The numbered circles are off the frame drawings. The jig parts are solid and in front of the quiet frame.
- The **Jig parts** drop-down opens with a second picture: every cut part laid flat to one scale, with its profile, cut
  length, and where the pins, stops and mounting area sit (`jig-parts-diagram.tsx`). Numbers match the list.
- Open: the top view looked odd to the user, who had not thought about the BB shell width setting the BB locator's
  length. A STEP or 3dm file of the jig is the way to check the orientation.

## What the user's Rhino model (Frame_Jig.3dm) shows

Read with `rhino3dm`; units are millimeters. The side view is the model's Y (along) and Z (up); the frame's center plane
is at X = -792.9. **Measure parts from their render meshes, not from `GetBoundingBox()`**: a first read used the
bounding boxes of the solids, which are about 1.2 times too big, and wrongly reported 144 x 48 profiles. The meshes
give the true sizes below, which match what the user drew.

- **Sizes.** Spine 40 x 120 x 1200 long, centered at Z = 0, so its bottom edge is 120 above the axle line (the axle
  line is at Z = -180). Both posts 40 x 120 x 300 long. Carriers 40 x 80. The rear standoff pieces are two 40 x 120
  blocks 80 long side by side, in front of a 40 x 120 x 300 plate centered on the frame's center plane.
- **Pin positions agree with the tool.** With the spine centerline 180 above the axle line, the BB pin is 216 below it
  and the head tube bottom pin 234.8 above it, exactly what `buildJig` gives for the same frame.
- **The frame in the model** (from its purple outline): chainstay about 437.5, BB drop 36, seat tube about 440
  (center to top) at about 72.8 degrees, head tube about 83.7 mm long at 65.0 degrees, reach about 423, stack about
  527. No fork or front axle is drawn.
- **Posts are in the spine's plane** (the same 40 mm band) and **butt end to end** against the spine's bottom or top edge
  (the BB post runs Z -60 to -360, the head post 60 to 360). They do not overlap the spine. The tool's `POST_OVERLAP` of
  100 mm is therefore wrong for this build; with no overlap the cut length would be pin clearance plus 100 mm,
  which rounds to 300 for both posts, as modeled.
- **Carriers sit directly on the spine's front face** (touching it), not a post-thickness further out. The seat carrier
  is about 610 long and the head carrier about 305.
- **The frame's center plane is 100 mm from the spine's front face**, not the 150 mm example.
- Not yet in the tool: the real rear fixture (two blocks and a plate behind the dropouts, with dropout plates and
  three locating pins), and the way the posts are joined to the spine.
