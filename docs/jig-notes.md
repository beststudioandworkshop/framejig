# Jig tool (`/tools/jig`)

A separate tool from the frame geometry tool. The frame tool designs the frame;
this one turns it into jig settings, a parts list and a tools list. The frame
travels in the URL (`?d=` for your frame, `?r=` for the pinned reference), made by
`encodeFrame` / `decodeFrame` in `src/lib/frame/share.ts`. Only fields that
differ from the defaults are stored; a bad or missing link falls back to the
example frame with a notice, and a bad field falls back to its default. The
frame page has "Transfer dims to jig" buttons that build that link.

## The jig this models (tilted spine)

- The **rear axle is fixed** and is the origin for every number.
- A long **main spine** (planned as 40 x 120 mm T-slot) whose centerline runs
  **from the rear axle through the middle of the head tube**. Its tilt is the
  angle of that line above the axle-to-axle line, so it comes from the frame.
  The tool gives the angle and the rise over 1000 mm (set it with a level and a
  rule).
- The spine is **mounted to a post on its back side**, at a pivot with an
  angle lock. Post height (base to pivot) is an input; 700 mm is an example.
- **Carriers** (40 x 80 mm) mount on the spine's front face and cross it:
  - the **seat tube carrier** runs along the seat tube axis and carries the BB
    stop. It is the most adjustable: along the spine, across it, and rotation;
  - the **head tube carrier** runs along the head tube axis and carries its
    mandrel; it crosses the spine at the middle of the head tube by
    construction;
  - the **rear axle standoff** is a block that reaches from the spine face to
    the near dropout face, so the dummy axle reaches the frame's center line
    seen from above.
- Positions are given **along the spine** (u, from the rear axle toward the head
  tube) and **across it** (v, up toward the seat tube side, negative below). It is
  a rotation of the same key points as the drawing, so it can't disagree with it;
  every check distance is unchanged by it (tested).
- Carrier settings: angle to the spine, how far off square that is, where the
  carrier's axis crosses the spine centerline, and the distance along the
  carrier from that crossing to each stop (BB and seat tube top; head tube
  bottom and top). Up the tube is positive.
- **Standoff** is how far a locator reaches out from the spine face. The input
  "spine face to the frame's center plane" (seen from above) is an example at
  150 mm. Rear axle and BB standoffs are shortened by half the rear spacing or
  BB shell width, because those faces are what touch. The tool warns if the
  offset is too small for that.
- Wheel size does not move any station (tested), because the axle is fixed and
  the BB position comes from the BB drop.

## Check distances and envelope

Ten straight-line distances between stations let a tape confirm a set-up. The
"room and travel" panel covers your frame and the pinned reference: the range of
spine tilt, spine length, how far stations sit from the spine centerline, and
each carrier's crossing and angle range. A real size run (many frames) is not
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
- Where along the spine the post sits (the drawing puts it at the middle).
