# McMaster-Carr cart for the bike frame jig

For a Claude chat that has a browser (Chrome). Goal: find each part on mcmaster.com, check it fits, and build one cart.
The jig is level T-slot extrusion, 40 mm series, metric. Everything here comes from the owner's own design and cut list.

## Rules for the shopping chat

1. **Do not guess part numbers.** Read every number off the McMaster page. If you can't find a part, say so and offer the closest one.
2. **Ask before adding anything marked CONFIRM.** Those are sizes the owner has not decided or that depend on their tubes.
3. **Stay in one framing series.** Pick one metric 40 mm series (profile, slot width, T-nuts, bolts, brackets, plates, end caps must all match). Confirm the
   slot width from the page. I believe 40 mm series use a 10 mm slot and M8 fasteners, but that is from memory: verify it.
4. **Check that the profiles exist.** The jig needs a 40 mm x 120 mm profile and a 40 mm x 80 mm profile. If 40 x 120 is not sold, stop and ask: the
   alternatives are changing the design, not substituting.
5. At the end, give a table: item, McMaster part number, quantity, unit price, link, and what it is for. Then the cart total.
6. Metric only. Lengths in mm.

## 1. Extrusion (cut to length, or buy stock and cut)

Order each cut piece as its own line if McMaster cuts to length; otherwise buy stock and cut it. Allow about 3 mm for each saw cut.

| Part | Profile | Cut length | Qty | What it does |
| --- | --- | --- | --- | --- |
| Main spine | 40 x 120 mm | 1200 mm | 1 | Runs level; the long backbone |
| Head tube post | 40 x 120 mm | 300 mm | 1 | Stands on the spine's top edge |
| Bottom bracket post | 40 x 120 mm | 220 mm | 1 | Hangs from the spine's bottom edge |
| Rear hub plate | 40 x 120 mm | 300 mm | 1 | On the frame's center plane; holds the dummy axle |
| Head tube carrier | 40 x 80 mm | 300 mm | 1 | Pivots on a pin at the bottom of the head tube |
| Seat tube carrier | 40 x 80 mm | 600 mm | 1 | Pivots on a pin at the BB center |

Total 40 x 120: 2020 mm (plus cuts). Total 40 x 80: 900 mm (plus cuts). If buying stock, say which stock lengths you chose.

**Optional, CONFIRM with the owner:** two blocks of 40 x 120, each cut 80 mm, that joined the spine to the rear hub plate in the owner's CAD model.
They were not on the cut list.

## 2. Joining hardware (all must match the series chosen above)

| Item | Qty | Notes |
| --- | --- | --- |
| Face plates, for a perpendicular joint of two 40 x 120 extrusions | 3 | One per post that butts against the spine: head tube post, bottom bracket post, rear hub plate. CONFIRM the owner means one per post. Find a plate or gusset that spans a 120 mm face |
| 90 degree brackets, large | 8 | The critical joints. Pick the largest bracket made for 40 mm framing. Note how many fasteners each takes |
| 90 degree brackets, small | at least 8 | The less critical joints. Smaller or lighter bracket for 40 mm framing. Buy a few more than 8 |
| T-nuts and bolts | enough | See the count below. Match the slot. Get spares |
| End caps | 5 for 40 x 120, 4 for 40 x 80 | Spine 2 ends, three posts' free ends (the butt ends are covered), each carrier 2 ends |

**Fastener count (estimate, correct it from the real brackets and plates):**
large brackets 8 x 4 = 32, small brackets 8 x 2 = 16, face plates 3 x 4 = 12, so about 60 bolt and T-nut sets. Add 20 percent for spares, about 72.
Bolt length depends on the plate or bracket thickness: read it off the product page.

## 3. Pins, mandrels and axle (sizes depend on the owner's tubes: CONFIRM each one)

| Item | Qty | What to ask the owner / how to choose |
| --- | --- | --- |
| Pivot pins | 2 | One at the BB center, one at the bottom of the head tube. Each passes through a 40 mm carrier and a 40 mm post, so about 80 mm of material. Shoulder screw with a shoulder diameter near 10 mm and a shoulder at least 80 mm long, with a locknut. CONFIRM the hole size the owner will drill in the extrusion |
| Head tube mandrel | 1 | Precision ground shaft, slip fit in the head tube bore. Ask for the head tube inside diameter (about 34 mm for a 1-1/8 inch headset, but measure). Must be longer than the head tube plus the clamps, about 200 mm |
| Seat tube mandrel | 1 | Slip fit in the seat tube bore. Ask for its inside diameter. About 250 mm long |
| Bottom bracket mandrel | 1 | Slip fit in the BB shell bore. A 68 mm English shell is about 34.8 mm inside (1.37 inch thread); ask the owner |
| Dummy axle | 1 | Precision ground shaft, about 10 mm for a quick release dropout or 12 mm for a thru-axle. Long enough for the rear spacing (130 or 135 mm) plus the plates, about 190 mm. Ask which |
| Shaft collars | 8 | Two per mandrel and two for the axle, each with the matching bore |

## 4. Small items

| Item | Qty | Notes |
| --- | --- | --- |
| Adhesive-backed steel rule, 1200 mm or 48 inch, metric | 1 | Stick it along the spine to read each post's position. Metric graduations |
| Toggle clamps | 4 | To hold tubes while tacking |
| Leveling feet | 4 or more | For whatever supports the spine. The owner has not decided how it is supported, so CONFIRM before buying a base |
| Carrier angle clamps or locking hinges | 2 | Not decided. Ask the owner how the angle is locked before buying |

## What is still open (ask the owner)

- Bolt and series: which exact framing series (slot width) is wanted, and the bolt size.
- Whether to keep the two 80 mm blocks, and whether 3 face plates means one per post.
- How the spine is supported (bench, uprights or a base).
- How the carrier angles are locked.
- The inside diameters of the head tube, seat tube and BB shell the mandrels must fit, and the rear spacing and axle type.

## Where this came from

The owner's jig design is in `docs/jig-notes.md` and the in-app parts list is `src/lib/frame/jig-parts.ts` (`JIG_STOCK` holds the cut lengths).
The parts list is also a page in the app: `/tools/jig`, under "Jig parts".
