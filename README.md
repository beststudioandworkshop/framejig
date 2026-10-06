# Framejig

A bike frame geometry planner for custom builders, modeled on the Plyhead
plywood box tool. One pure, tested geometry module (`src/lib/frame/`) feeds
every output: the side-view drawing, readouts, tube schedule and jig settings.

- House rules for working in the repo: `CLAUDE.md`
- Plan, architecture and lessons from the box tool: `docs/handoff-bike-frame-tool.md`
- Running locally: `LOCAL-SETUP.md` · Deploying: `DEPLOY.md`

Frames are safety critical. This is a geometry planner, not an engineering
analysis: it says nothing validated about loads, fatigue or tube selection.
