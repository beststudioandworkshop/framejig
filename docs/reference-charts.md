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
