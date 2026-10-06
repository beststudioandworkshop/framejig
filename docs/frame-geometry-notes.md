# Frame geometry module: model and assumptions

`src/lib/frame/` is pure TypeScript (no React, no Three). Millimeters and
degrees. Side view: X forward, Y up, origin at the bottom bracket (BB) center.
`buildFrame(inputs)` returns `{ ok, issues, points, metrics, tubes }`; every
output reads that result and computes no geometry of its own.

This is a geometry planner, not an engineering analysis. Nothing here says
anything about loads, fatigue or tube selection.

## Formulas and where they came from

- **Trail** = (R cos(a) - rake) / sin(a), with R the wheel radius, a the head
  tube angle from horizontal. Matches the published formula (see the
  Wikipedia "Bicycle and motorcycle geometry" article) and is cross-checked in
  tests by walking the steering axis down to the ground. Positive trail means
  the contact patch trails behind where the axis meets the ground.
- **Stack / reach**: vertical / horizontal distance from the BB center to the
  center of the top of the head tube (standard definition).
- **Wheel radius** = rim bead seat diameter / 2 + tire section.
- **BB height** = wheel radius - BB drop.

## Model choices (mine, not verified against a standard; confirm or change)

- Both wheels are the same size; both axles sit `bbDrop` above the BB.
- The fork is `forkAxleToCrown` measured to the **bottom of the head tube**.
  Headset stack and crown-race height are not modeled.
- **Numbers mode** takes effective top tube + head tube length; stack and reach
  are derived. **Fit mode** takes stack + reach; effective top tube and head
  tube length are derived. In fit mode the head tube length is forced by stack,
  fork and BB drop (the axles must sit level), so a low stack gives an error.
- Effective top tube = horizontal distance between the seat and head tube axes
  at the height of the seat tube top.
- The physical top tube joins the head tube one tube radius below its top, and
  the seat tube `seatTubeExtension` below its top. Seat stays meet the seat
  tube at the same point. The down tube joins one tube radius above the bottom
  of the head tube.
- Tube lengths are **joint to joint along the centerline in the side view**.
  Miter/cope allowances and left/right splay (rear spacing, BB width) are not
  applied yet.
- Standover = ground to the top of the top tube at its midpoint.
- Toe overlap: toe at (crank + toeProjection) ahead of the BB at BB height,
  crank level and pointing forward, wheel straight ahead, tire as a circle.
  Real bikes also depend on steering angle, shoe and pedal.
- Clearance checks use the front and rear tire circle against the seat tube and
  down tube segments. Error below 0 mm, warning below 6 mm.
- Typical ranges in `guidance.ts` are common rules of thumb for road/gravel
  frames. They are not verified and must be labeled that way in the UI.
- Default inputs are examples, not a recommendation.

## Not modeled yet

Rear spacing / BB width splay, miters and copes, headset stack, mudguards,
tire width (only section height), steering-angle toe overlap, wheel sizes that
differ front and rear, jig/fixture outputs.

## Drivers (what each dimension is measured as)

Each row of the main dimensions has a "measured as" dropdown, as in other frame
software. Only the chosen measurement is read; the rest are derived and shown in
the readouts. Switching never changes the frame (`switchDriver` copies the
derived numbers into the fields first).

- BB: drop, or height
- Rear end: chainstay, or rear center
- Seat tube: c-t (BB to top), or c-c (BB to the top tube centerline)
- Horizontal: effective top tube, front center, or reach
- Vertical: head tube length, or stack (head tube length then falls out of the
  stack, fork and BB drop, since both axles must sit level)

## Parked ideas

- Editable head tube top/bottom and seat tube top offsets in place of the fixed
  one-tube-radius joints (BikeCAD shows these as three small fields).
- Saddle height as an alternative seat tube driver (needs a seatpost exposure
  assumption).

## Side view and reference comparison

- `drawing.ts` turns a `FrameResult` into plain drawing data (Y down, mm):
  wheels, tubes at real diameter, fork, steering axis, crank and foot, and nine
  dimension lines (wheelbase, trail, BB height, stack, reach, effective top
  tube, seat tube, head tube, chainstay). It draws a frame that has errors so
  you can see why. `frame-drawing.tsx` only renders that data.
- Trail is shown at the ground between the contact patch and where the
  steering axis meets the ground.
- Tubes are drawn as flat strips along their centerlines, side view only. Tube
  ends are not miterd in the drawing.
- **Reference**: "Pin as reference" copies the current inputs. Type the other
  bike's numbers, pin it, then change yours. It is drawn dashed behind, lined up
  at the BB, rear axle or front axle, with a table of differences
  (`compare.ts`, yours minus the reference).
- On phones the drawing keeps a minimum width and scrolls sideways so the labels
  stay readable.
- Not drawn yet: angle arcs, saddle and bars, a print-to-scale/SVG export.

## Jig

The jig has its own tool and notes: see `docs/jig-notes.md`. The frame tool links
to it and carries the frame (and reference) in the URL.

## Fit, save and load, ride feel

- **Drawings fit their cards.** No minimum width or sideways scrolling. The label
  size is chosen from the rendered width (`labelSize` in
  `components/tools/frame/use-element-width.ts`) so text stays about 8 px or more
  on small screens; the reach dimension sits further out so labels don't collide.
- **Save and load** (`src/lib/frame/save-file.ts`):
  - **Download file**: readable JSON, `{ format: "framejig-frame", version: 1,
    name, savedAt, frame, reference }`, named `<name>.framejig.json`. The pinned
    reference is saved with the frame.
  - **Load from file**: anything missing or wrong becomes a default
    (`sanitizeFrame`), anything that isn't a Framejig file is rejected with a
    message, and a file over 1 MB is refused.
  - **Saved in this browser**: a list in localStorage (max 50, same name replaces,
    newest first). It's a convenience: it can vanish if site data is cleared or in
    a private window, so the file is the safe copy.
  - Loading and deleting both offer **Undo** in the toast.
- **How it might ride** (`src/lib/frame/ride-feel.ts`) turns the numbers into
  plain language on five scales: steering (trail), handling (wheelbase and
  chainstay), riding position (stack to reach), weight over the pedals (seat
  tube angle) and bottom bracket (BB drop), plus toe overlap and an optional
  standover note from the rider's inseam. The thresholds are **rules of thumb
  for road and gravel style frames, not verified limits**, and the card says so.
  Bigger frames always have longer wheelbases, and stem, spacers, bars,
  seatpost setback, tires and fork all change how a bike feels.

## Bike type (road and mountain)

A **bike type** (`inputs.bikeType`: `road` or `mountain`) is a lens on the same
geometry maths. It changes guidance, never the calculation, and never blocks
anything.

- **Switching type keeps your numbers.** A toast offers to load an example frame
  for the new type (`PRESETS` in `src/lib/frame/presets.ts`) and has an Undo.
- **Example frames** are plausible numbers, not recommendations and not checked
  against any maker's chart. The mountain example is a 29-inch hardtail
  specified by reach and stack (head angle 65°, 540 mm axle-to-crown, 44 mm
  rake, 40 mm BB drop, 435 mm chainstays). It builds with no errors: wheelbase
  about 1212 mm, trail about 124 mm, BB height 331 mm.
- **"Typical" tags** (`TYPICAL_RANGES_BY_TYPE`) and the **ride-feel bands**
  (`PROFILES` in `ride-feel.ts`) are separate tables per type. **The mountain
  numbers are my own estimates, not verified limits**, and the UI says so. If you
  have ranges you trust, replace them there; they are plain constants.
- **Suspension fork:** the tool treats the fork as rigid. For a suspension fork,
  enter axle-to-crown at the sag you ride at. A compressed fork steepens the head
  angle and shortens the trail. The ride-feel card says this for mountain frames.
- **Building notes** add three mountain steps before cutting: check the real
  fork, check the seat tube for a dropper post, and mock up tire and chain
  clearance (this tool only checks the tires against the seat tube and down
  tube, not the stays, chain or crank).
- The type travels in share links and saved files. A bad or missing value reads
  as road.
- **Not modeled:** fork travel and sag as an input, chainstay and seat stay tire
  clearance, 27.5-inch and fat bike specifics beyond the rim and tire numbers,
  and other types (gravel as its own type, touring, track).

## Categories, the Start page and sizes

Five bike categories: **road, gravel, mountain, touring, track**. Each is one file
in `src/lib/frame/categories/` holding a `CategoryProfile` (types in
`category-types.ts`): the primer text, typical ranges and the reason for each,
what makes it feel the way it does, what varies inside it, the ride-feel bands,
the example frame (a medium) and the size-grading rule. **Everything reads that
one profile**: the Start page, the "typical" tags, the ride-feel card, the
example frames and the size picker, so they can't drift apart.

- **The numbers are my estimates**, from general knowledge, and every category
  says so (`reference` and the ride disclaimer). They are meant to be replaced by
  reference charts. To do that for a category, edit its file: the `ranges`, the
  `base` frame (raw inputs; `completeFrame` fills in the derived numbers), the
  `grade` steps, and the `deriveRide` band edges. A test checks that every
  example frame builds with no errors, sits inside its own ranges and reads as an
  ordinary bike of its type, so a bad edit shows up fast.
- **Reference bikes mentioned so far (Surly):** the Long Haul Trucker for
  touring, the Karate Monkey for mountain, the Steamroller for track, and the
  Straggler or Cross-Check for gravel. Their geometry charts are not in the repo
  yet: surlybikes.com is blocked in the cloud environment, so the charts need to be
  pasted in or uploaded. Nothing here claims to match any Surly numbers.
- **Sizes** (`grading.ts`): S, M, L, XL as steps from the medium. Reach, stack and
  seat tube grow by the category's `grade` steps; angles, fork, chainstay and BB
  drop stay put. The medium is the example frame itself. Rider heights are rough
  (S 160 to 170 cm, M 170 to 178, L 178 to 186, XL 186 to 195) and sizing differs a
  lot between makers.
- **Start from the rider:** `suggestSize(height)` picks the size whose range holds
  the height, says "between" within 2 cm of an edge, and always says to check reach
  and standover. Height accepts `5'10"`, `70 in`, `178 cm` or millimeters.
- **Start page** (`/tools/start`): pick a kind of bike, read why its numbers are
  what they are, pick a size (or enter a height and inseam), and "Start in the
  frame tool" opens that sized example through the same link the other tools use.
- Switching the bike type in the frame tool keeps your numbers and offers to load
  that type's example. Building notes add steps per type (fork and dropper for
  mountain, wide-tire clearance for gravel, touring and mountain, mounts and heel
  clearance for touring, track ends for track).
- Not modeled: track ends and 120 mm rear spacing beyond the input, fork travel as
  an input, chainstay and seat stay tire clearance, and full-suspension frames.
