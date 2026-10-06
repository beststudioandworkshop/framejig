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
