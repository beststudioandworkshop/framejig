# Frame geometry module: model and assumptions

`src/lib/frame/` is pure TypeScript (no React, no Three). Millimetres and
degrees. Side view: X forward, Y up, origin at the bottom bracket (BB) centre.
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
- **Stack / reach**: vertical / horizontal distance from the BB centre to the
  centre of the top of the head tube (standard definition).
- **Wheel radius** = rim bead seat diameter / 2 + tyre section.
- **BB height** = wheel radius - BB drop.

## Model choices (mine, not verified against a standard; confirm or change)

- Both wheels are the same size; both axles sit `bbDrop` above the BB.
- The fork is `forkAxleToCrown` measured to the **bottom of the head tube**.
  Headset stack and crown-race height are not modelled.
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
- Tube lengths are **joint to joint along the centreline in the side view**.
  Mitre/cope allowances and left/right splay (rear spacing, BB width) are not
  applied yet.
- Standover = ground to the top of the top tube at its midpoint.
- Toe overlap: toe at (crank + toeProjection) ahead of the BB at BB height,
  crank level and pointing forward, wheel straight ahead, tyre as a circle.
  Real bikes also depend on steering angle, shoe and pedal.
- Clearance checks use the front and rear tyre circle against the seat tube and
  down tube segments. Error below 0 mm, warning below 6 mm.
- Typical ranges in `guidance.ts` are common rules of thumb for road/gravel
  frames. They are not verified and must be labelled that way in the UI.
- Default inputs are examples, not a recommendation.

## Not modelled yet

Rear spacing / BB width splay, mitres and copes, headset stack, mudguards,
tyre width (only section height), steering-angle toe overlap, wheel sizes that
differ front and rear, jig/fixture outputs.

## Parked ideas

- **"Measured as" dropdowns per dimension** (seen in BikeCAD's Primary dimensions
  panel): BB drop or BB height; chainstay length or rear centre; seat tube
  length or saddle height; front centre, effective top tube or reach; editable
  head tube top/bottom and seat tube top offsets instead of the fixed
  one-tube-radius joints. Would convert to the same internal geometry in
  `src/lib/frame/`, so the drawing and schedule wouldn't change. Not needed yet.
- Read the Paterek Manual (theframebuilders.com is blocked in the cloud
  environment; needs the host allowed or pasted pages) and check the model
  choices above against it.
