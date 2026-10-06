# Jig tool (`/tools/jig`)

A separate tool from the frame geometry tool. The frame tool designs the frame;
this one turns it into jig settings, a parts list and a tools list. The frame
travels in the URL (`?d=` for your frame, `?r=` for the pinned reference), made by
`encodeFrame` / `decodeFrame` in `src/lib/frame/share.ts`. Only fields that
differ from the defaults are stored; a bad or missing link falls back to the
example frame with a notice, and a bad field falls back to its default.

## The jig this assumes (option A)

- A long T-slot **spine** (planned as 40 x 120 mm) that runs **parallel to the
  axle line**, with uprights (40 x 80 mm) on it.
- The **rear axle is fixed** at one end of the spine and is the origin for every
  number: forward is +x, up is +y, so the BB is below it.
- Stations: rear axle, bottom bracket, head tube bottom and top, seat tube top,
  and a front axle check point. Everything is a position (x, y) so it can be
  set with a tape or calipers; the head tube mandrel is set by its two end
  positions and the angle is a cross-check.
- Wheel size does not move any station (tested), because the axle is fixed and
  the BB position comes from the BB drop.
- "Spine face below the axle line" is the one jig-specific input. It depends on
  how you build the spine and BB hardware. 100 mm is an example.
- Side to side: the rear axle and BB stations sit half the rear spacing and half
  the BB shell width either side of the centre plane. Those two numbers are
  inputs on the jig page and do not change the frame geometry.

## Check distances and envelope

Ten straight-line distances between stations are listed so a tape can confirm a
set-up. The "room the jig needs" line covers your frame and the pinned
reference: spine length from the stations plus a 100 mm allowance each end, and
column heights up to each station plus 100 mm, rounded up to 50 mm. A real size
run (many frames) is not built yet; the envelope only covers two frames.

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
  tall and columns 60 mm wide, whichever way the real profiles face.

## Tools list

`frameTools(inputs)` follows the joining process (TIG, fillet braze, lugged) and
the material (titanium adds an argon purge; aluminium a dedicated brush and a
heat-treatment prompt). Rules of thumb, not a safety course.

## Parked

- A size run (many frames) for the envelope.
- Dropout angle and thru-axle details; a jig drawing from the front.
- Real part numbers once the McMaster catalog can be read.
