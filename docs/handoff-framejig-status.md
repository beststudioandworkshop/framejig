# Framejig: where things stand (handoff for a new chat)

Read this, then `CLAUDE.md` and `AGENTS.md` in the repo root, then the notes in `docs/`. This replaces the
older `docs/handoff-bike-frame-tool.md`, which was the brief for starting the project.

## The project and the person

- **Repo:** `beststudioandworkshop/framejig`. **Branch:** `claude/lucid-sagan-ou20vp` (commit and push only here; no pull requests unless asked).
  Cloned at `/home/user/framejig` in the cloud session. About 40 commits.
- **Stack:** Next.js 16 (read `node_modules/next/dist/docs/` first: middleware is `proxy.ts`, `searchParams` is a Promise), TypeScript, Tailwind v4
  (tokens in `src/app/globals.css`), shadcn/ui on Base UI (use the `render` prop, never `asChild`), Vitest, pnpm, sonner toasts.
- **The user** is a maker, not a developer. They review in a browser and give short, plain-spoken feedback. They build steel bike frames and
  are building a jig. Their go-to reference is Surly. Use American spelling everywhere. Work in steps, show it, and stop for their reaction.
  When something is assumed, say so plainly on the page and in the reply.
- **Checks before every push:** `pnpm test && pnpm typecheck && pnpm lint && pnpm build`. Lint fails on exactly 3 upstream shadcn files
  (`theme-toggle.tsx`, `ui/carousel.tsx`, `hooks/use-mobile.ts`); that is expected.
- **Look at it for real:** `next build` + `next start` on port 3111, then Playwright (Chromium at `/opt/pw-browsers/chromium`, module
  `/opt/node22/lib/node_modules/playwright`). Never `next dev`. If the build fails with a font/Turbopack error, `rm -rf .next` and rebuild.
  Kill a stale server with `ps aux | grep "[n]ext-server" | awk '{print $2}' | xargs -r kill` (never `pkill -f`, it kills your own shell).

## Architecture rule

One pure, tested geometry module (`src/lib/frame/`, no React) that every output reads. The UI only wires it. A number on any screen must be a
number the module produced, and tests check that.

## What exists

Pages: `/tools/frame` (frame geometry), `/tools/jig` (jig settings, drawings, parts), `/tools/logic` (Frame logic; `/tools/start` redirects there).

### Frame geometry tool (`/tools/frame`)
- Side-view geometry in mm and degrees, BB at the origin. Drivers pick which measurements you type (BB drop or height, chainstay or rear center,
  seat tube c-t or c-c, effective top tube or front center or reach, head tube length or stack). Switching a driver keeps the frame the same.
- Six bike types plus a Style dropdown (24 styles). Save/load (file and browser list), copy link, undo toasts, ride-feel card, compare to a
  pinned reference, building notes, tools list, tube schedule.
- **Conventions fixed from the published charts:** effective top tube = reach + stack / tan(seat angle) (level, at the head tube top). Fork
  axle-to-crown is as makers publish it (to the crown race); a **lower headset** input (default 10 mm) puts the head tube bottom above it.
  **Front center is the straight line** from the BB to the front axle. A bottom bracket may sit up to 150 mm **above** the axles (BMX).

### Reference charts (`src/lib/frame/reference-charts*.ts`, notes in `docs/reference-charts.md`)
About 60 charts as data: the user's screenshots (typed by hand), 15 Surly pages read from surlybikes.com by script, 31 from Bike Insights
(an aggregator; less certain), Free Agent BMX, a 1996 Stumpjumper. None is filed under a category in the data; `evidence.ts` files them by style.
Tests check each against its own reach/stack/seat angle (3 mm; 10 mm for aggregator charts) and rebuild it in the tool (7 mm; 10 mm aggregator),
with a short list of known quirks and exceptions in `reference-charts.test.ts`.
- **Network:** `curl` works for surlybikes.com, bikeinsights.com and geometrygeeks.bike; the WebFetch tool does not. Parse pages with a script.
  Geometry Geeks needs JavaScript and its data is crowd-sourced. Measure Rhino parts from their **meshes**, not `GetBoundingBox()` (about 1.2 times too big).

### Frame logic (`/tools/logic`)
Pick a family and style, see the map (a chart of every style's typical ranges), pick a size or enter rider height, and hand an example frame to
the frame tool. Order: pick, map, start from a size, then the style's details. The lowest level sits in closed dropdowns inside each card
(`disclosure.tsx`). Ranges come from the charts through `evidence.ts` (`STYLE_CHARTS`, `deriveEvidence`) and each row is marked **From charts**,
**From charts, wheel assumed** or **Assumed**. A style with no chart is dotted on the map and entirely assumed.
Styles still with no chart: race, criterium, sprint, pursuit, commuter, klunker, basket bike. The user does not want the page to list which bikes' charts
were used; the point is a reasoned place to start from, then edit.
Profiles: `categories/*.ts` (six families, hand data), `styles.ts` (24 styles and 6 info-only freak bikes), `profile.ts` (`profileFor(type, style)`
merges them, then lays the chart evidence over), `chart.ts` (the map), `grading.ts` (S/M/L/XL and rider height).

### Jig (`/tools/jig`)
The user's design (from their Rhino file `Frame_Jig.3dm`): a **level** 40 x 120 spine, its bottom edge 120 mm above the axle line, rear axle fixed at the
origin. Two posts in the spine's plane butt against its edges; the **seat tube carrier pivots at the BB center**, the **head tube carrier at the bottom of
the head tube**. Pin positions match their model exactly. Facts from the model: spine 1200 long, posts 40 x 120 x 300, carriers 40 x 80, the center plane
is 100 mm from the spine face (the tool's default is still 150), carriers sit directly on the spine face.
- `jig.ts` (stations, carriers, spine, checks, envelope, exports), `jig-dims.ts` (dimension lines, with a `key` flag: small drawings show key dimensions,
  Enlarge shows all), `jig-parts.ts` (the parts list), drawings in `jig-drawing.tsx` (side), `jig-plan-view.tsx` (top), `jig-parts-diagram.tsx` (cut parts laid flat),
  `zoom-panel.tsx` (enlarge, scroll/pinch zoom, drag).
- **Parts list = the user's cut list** (`JIG_STOCK`): spine 1200, head tube post 300, rear hub plate 300, bottom bracket post 220, head tube carrier 300, seat
  tube carrier 600. A "Holds this frame?" column checks each against the loaded frame. Hardware: bolts and T-nuts, 3 face plates, 8 large and at least 8 small
  90 degree brackets, plus pins, mandrels, dummy axle, collars, angle clamps, scale. **McMaster part numbers are blank on purpose** (never guess them).

## Open items and questions for the user

- Jig drawings still use the old layout in three ways: posts drawn on the spine's face and overlapping it by 100 mm (the model butts them in the spine's plane,
  and `POST_OVERLAP` is still in `jig.ts`), center offset default 150 (model: 100), and the rear fixture drawn as one block (model: two 80 mm blocks and a plate).
  The new parts list already assumes butt joints. Fix the geometry and drawings to match.
- Not decided by the user: how the posts attach to the spine, how the spine is supported, how carrier angles are locked, whether the two 80 mm blocks are kept,
  bolt size and quantity, and whether 3 face plates means one per post.
- More charts wanted, especially a real BMX cruiser, beach cruiser, klunker, 1990s Ritchey mountain bike, and road race/crit and track sprint/pursuit.
  The user has said to keep finding charts; more files and screenshots will come with the model name in the message.
- Replace remaining hand estimates when charts arrive; the "what sets it apart" bullets still hold hand numbers for styles without charts.
- Shelved: miter and cope templates with DXF export, a 3D tube preview, a jig size run, an as-built jig panel, editable head tube joint offsets, saddle height as a seat tube option.

## Gotchas that cost time

- Old share links read the new defaults (10 mm headset, new effective top tube meaning), so a saved frame can come back a few millimeters different.
- `profileFor` caches by type and style; the family profile is the same object for `null` and for an unknown style.
- Never guess a part number, a measurement, or which model a chart is. Ask, or state the assumption.
- When tests assert a belief about the hand estimates (for example "touring has the longest chainstays") and the charts disagree, change the test and say so.
