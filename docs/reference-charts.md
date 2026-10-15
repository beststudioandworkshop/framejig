# Reference charts and what they showed

The charts are typed into `src/lib/frame/reference-charts.ts` (mm and degrees).
Nothing in the tool reads them yet; only the tests do. Nothing is filed under a category until the user says where it goes.

| id | maker / model | sizes | filed as |
| --- | --- | --- | --- |
| surly-steamroller | Surly Steamroller | 49 to 62 | track |
| surly-pugsley | Surly Pugsley, sent in inches | xS to xL | not filed |
| surly-krampus | Surly Krampus, "preliminary" | SM to LG | not filed |
| surly-ogre | Surly Ogre | SM to XL | not filed |
| surly-karate-monkey | Surly Karate Monkey | XS to XL | not filed |
| surly-cross-check | Surly Cross-Check | 42 to 64 | not filed |
| surly-disc-trucker-26 | Surly Disc Trucker, 26-inch sizes | 42 to 56 | not filed |
| surly-disc-trucker-700c | Surly Disc Trucker, 700c sizes | 56 to 64 | not filed |
| salsa-timberjack | Timberjack (maker assumed Salsa), "preliminary" | XS to XL | not filed |
| specialized-stumpjumper-1996 | Specialized Stumpjumper 1996, 17 inch (one size) | 17" | not filed |
| surly-pacer | Surly Pacer | 42 to 62 | not filed |
| surly-straggler-700c, surly-straggler-650b | Surly Straggler, two wheel sizes | 54 to 62, 38 to 52 | not filed |
| surly-midnight-special | Surly Midnight Special | 40 to 64 | not filed |
| surly-bridge-club | Surly Bridge Club | X-Small to X-Large | not filed |
| surly-preamble | Surly Preamble | X-Small to X-Large | not filed |
| surly-lowside | Surly Lowside | X-Small to X-Large | not filed |
| surly-wednesday | Surly Wednesday | X-Small to X-Large | not filed |
| surly-ice-cream-truck | Surly Ice Cream Truck | Small to X-Large | not filed |
| surly-moonlander | Surly Moonlander | Small to X-Large | not filed |
| surly-grappler | Surly Grappler | X-Small to X-Large | not filed |
| surly-sorceress | Surly Sorceress | X-Small (27.5) to X-Large (29) | not filed |
| surly-troll | Surly Troll | XS to XL | not filed |
| surly-ecr-1, surly-ecr-2 | Surly ECR, two tables | M to XL, XS to M | not filed |
| surly-pack-rat | Surly Pack Rat | 38 to 58 | not filed |
| crust-scapegoat | Crust Scapegoat | S to XL | not filed |

## What I checked: does the geometry maths reproduce the published numbers?

I built every size of every chart in the tool and compared stack, reach and wheelbase.

1. **Wheelbase, angles and chainstay behave.** With the right inputs the model lands within
   about 2 mm of the published wheelbase on the charts that give a fork length.
2. **"Effective top tube" is defined differently.** Every chart's effective top tube equals
   `reach + stack / tan(seat tube angle)`, a horizontal measure taken at the top of the head tube.
   It holds to within 2 mm on all six charts (this is also a test). The tool measures it at the
   top tube and seat tube joint instead, which is up to 22 mm off on frames with a tall head tube.
   Typing a published effective top tube into the tool today gives a frame with the wrong reach.
3. **A fork's axle-to-crown includes about 10 mm the tool doesn't model** (the lower headset).
   Adding 10 mm to the fork length makes stack, reach and wheelbase match the Steamroller to
   0.1 mm and three of the other charts to about 1.5 mm. One chart (the 483 mm fork, 69 degree one
   with a 55 mm drop) wants closer to 15 mm. Where a fork is measured to the crown race rather than the
   head tube bottom, the difference is the headset.
4. **Standover is not reproduced.** The charts disagree with each other and with the tool by
   20 to 50 mm, so each maker probably measures it somewhere different. It stays an estimate.

## Model changes made because of this

- **Effective top tube** is now the level distance from the seat tube line to the top of the head tube:
  `reach + stack / tan(seat tube angle)`. It used to be measured at the top of the seat tube.
- **Lower headset** is a new input (default 10 mm). Fork axle-to-crown is read as the maker publishes it, to the crown
  race, and the head tube bottom sits a headset above that along the steering axis. The example frames' fork lengths
  were reduced by 10 mm so they keep the same shape.
- The tests now build every size of every chart that gives a fork length and check stack, reach and wheelbase to within 7 mm.
- Old share links and saved files read the new default headset, and effective top tube means the new thing, so a frame saved
  with an effective top tube driver can come back a few millimeters different.

## Charts pulled from surlybikes.com (2026-10-15)

Fifteen more Surly charts were read straight from the maker's product pages with a script and written to
`src/lib/frame/reference-charts-surly.ts`. Nothing was typed by eye. Two checks guard them:

- Each chart's effective top tube must equal reach plus stack over tan(seat angle), to 3 mm. Where Surly's own table
  disagrees with itself (Pacer 54 cm, Straggler 650b 38 cm, and the whole Troll table by about 5.5 mm) the test
  lists it as a known quirk instead of changing the number.
- Every chart that gives a fork length is built in the tool and must match stack, reach and wheelbase to 7 mm.

Old-style tables (Pacer, Troll, ECR, Pack Rat) print "Seat Tube Length", taken as center-to-center the way the
Cross-Check's was. New-style tables print "Total Seat Tube Length", taken as center-to-top; the Karate Monkey's matches
the table you sent. The Karate Monkey page agrees with your screenshot everywhere except standover on three sizes.
Left out: the Long Haul Trucker (same geometry as the Disc Trucker), the Big Dummy and Big Easy (cargo), and duplicate
pages of the same table.
