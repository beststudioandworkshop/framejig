# Reference charts and what they showed

The charts are typed into `src/lib/frame/reference-charts.ts` (mm and degrees).
Nothing in the tool reads them yet; only the tests do. Four of the six arrived without a
model name, so they stay unfiled until we know what they are.

| id | maker / model | sizes | filed as |
| --- | --- | --- | --- |
| surly-steamroller | Surly Steamroller | 49 to 62 | track |
| unnamed-inch-14-22 | probably Surly, sent in inches | xS to xL | not filed |
| unnamed-sm-md-lg-483 | probably Surly, "preliminary" | SM to LG | not filed |
| unnamed-sm-xl-447 | probably Surly | SM to XL | not filed |
| unnamed-xs-xl-483 | probably Surly | XS to XL | not filed |
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

## Proposed model changes (not made yet)

- Define effective top tube the way the charts do: `reach + stack / tan(seat tube angle)`.
- Add a headset allowance (about 10 mm, editable) between the fork's axle-to-crown and the head tube bottom.

Both change numbers the tool already shows, so they need a yes first.
