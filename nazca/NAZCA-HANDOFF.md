# NAZCA-HANDOFF.md (v0.14 · Sep 6 2026)

## What this is
Nazca is Mot's infinite deep-zoom drawing app: kid-friendly fun brushes and pro tools in one UI, with the zoom itself as the identity (draw a world inside a dot, then play the zoom as a story). Single-file HTML PWA, no dependencies, no server. Deploys as a folder in the site repo `motbuchanan/site` at `nazca/` (same pattern as `allthumbs/` and `reframe/`), so the live URL is https://motbuchanan.com/nazca/. Authoritative file: `nazca/index.html` (this package). Icon: `nazca/icon-*.png` from Mot's Nazca-bird artwork.

## Current state
- v0.14 · Sep 6. Phases 1 to 8 shipped: deep-zoom tiled engine (levels -4 to 24, 1/64× to 16.7M×), stabilizer, speed taper, hold-to-snap shapes, 2/3-finger tap undo/redo, layers, IndexedDB autosave, `.nazca` project files, brush presets (Pro / Fun / Alive), buffered per-stroke opacity, fill with close-gaps + grow, long-press eyedropper, recent colors + palette, alive layer (wobble, train track, bugs, fireworks), stroke log with replay, timelapse and tour video export (WebM via MediaRecorder), keyframe captions + hold, editable last stroke, symmetry, depth-locked layers, hidden notes, portals, real-world scale reference, depth map, reference and trace images (floats), lasso select with move/scale/rotate/copy, freeze moving things to pixels, seed brush, sky loading screen (icon-512.png descent), in-app Guide (two tiers + inspiration).
- Verified headless (Chromium): all of the above. Verified on Mot's phone: engine through v0.9 (crash fix confirmed), Deep zoom "works beautifully". Untested on device: v0.10 alive layer, v0.11 replay/video/adjust/symmetry.
- Not yet done: Phase 9+ (see Open items). No service worker yet (autosave already covers offline reopening; add sw.js only when the site adopts one for its other apps).

## Locked decisions
- Name is Nazca. First name slate (Complement, Big Paper, Scribble, Endless, Marks) was rejected; do not re-propose.
- Palette: site teal #4cf0e0 (active/accent), orange #f59847 (go actions), chrome #141a22, paper #fbfaf6. Pulled from the live site's tokens.
- Infinite canvas with level-addressed tiles, not a fixed document. Brush size is in screen pixels so brushes feel the same at every depth.
- Fit frames what is near the current view at the current depth, never the whole drawing (a deep drawing is a dot from the top).
- Depth gauge pill stays on screen; it doubles as the Tour panel button.
- Undo stores changed rectangles only, PNG-compressed in the background, byte-capped at 96 MB. Do not go back to full-tile snapshots: that is what crashed the tab.
- Stamps capped at 512 px and scaled on draw. Removing the cap re-creates a crash when a big eraser meets a deep tile.
- Rendering composites each layer's visible slots into one axis-aligned buffer before drawing (seam-free on rotation and translucent paint). Do not draw tiles individually with overlap.
- Buffered strokes for brushes (commit on lift); eraser is immediate. Both are intentional.
- Tapping the canvas while a panel is open closes the panel and does not draw.

## Open items (in order)
1. Site chat: create `nazca/` in the repo, drop this package in, add a tile to index.html pointing at `nazca/`, ROADMAP.md entry. Icon files are here.
2. Phone verification of v0.10 and v0.11 features (list above).
3. Phase 9: living stickers, grow brush. Phase 10: perspective and isometric guides.
5. Later: tile eviction to IndexedDB for very large drawings; sound pack (opt-in); simple/full UI depth toggle.

## Gotchas
- The sky loading screen loads `icon-512.png` relative to the page; from a standalone file with no icon it falls back to a gradient. It runs every launch (2.65 s), tap skips, 4 s hard timeout. Guide content lives in the `#guide` div; update it when tools change.
- Floats live in `doc.floats` (kinds: ref, trace, selection), undo kind `floats`; compound edits use undo kind `multi` (entries applied in order on redo, reversed on undo). `paintCanvas(L, canvas, worldRect, z, op)` is the one path for stamping any canvas into all levels (fill, selection commit, freeze). `sctx` is a `let` so freezeAlive can swap the drawing context (`sctxSwap`).
- Depth marks live in `doc.marks` (kinds: reveal, portal), undo kind `marks`; scale reference is `doc.scaleRef` (meters per world unit). Portal tap-to-enter is a screen-space label hit test (`portalHits`) checked at the top of pointerdown.
- Opening the file from Chrome Downloads (`content://`) has no storage: autosave, restore, and settings will not persist there. Test from the https URL.
- Old saved settings (`nazca.settings.v3`) can leave a tiny/faint brush; the Size panel has Reset.
- Hold-to-snap needs jitter-proof hold detection (9 px screen radius); a per-event movement threshold fails on real fingers.
- The snapped-shape property is `snapShape`; `shape` is the stamp shape. They collided once and broke the adjust chip.
- Replay swaps `doc.layers` for temp layers; `pushUndo`, `noteRecentColor`, and `autosave` are guarded by `replaying`. Keep those guards when adding features that write during replay.
- Build gates before shipping any version: `node --check` on the extracted script, no `{{`/`{%` (Jekyll), no unescaped `</script`, bump `VERSION` with the real date, run the headless suite (files `_test7*.py`, `_test8*.py`, `_test11.py` in the build sandbox: deep zoom, fill/marker/eyedropper, replay/video).
- The "Adjust that line" chip sits top-center; headless tests must close panels by clicking elsewhere.
- MediaRecorder output is WebM on Android/desktop Chrome, MP4 on Safari. Filenames `nazca-tour-*.webm`, `nazca-timelapse-*.webm`.

## File map
- Package: `nazca/index.html` (app, v0.14), `nazca/manifest.json`, `nazca/icon-512.png`, `icon-192.png`, `icon-180.png` (apple-touch), `icon-maskable-512.png`, `nazca/NAZCA-HANDOFF.md`.
- Repo: `motbuchanan/site`, branch `main`, custom domain via CNAME (motbuchanan.com). `.nojekyll` present.
- Deployed URL after upload: https://motbuchanan.com/nazca/
- Storage keys: localStorage `nazca.settings.v3`, `nazca.hint.v2`; IndexedDB db `nazca`, store `projects`, key `current`.
- Debug hook in the page: `window.nazca` (doc, view, settings, floodFill, stroke getter).

## People
- Mot: owner, builds and tests on phone (360 CSS px wide). Garrett: primary kid user. No other stakeholders.

## Re-entry instructions
1. Fetch the live file: https://raw.githubusercontent.com/motbuchanan/site/main/nazca/index.html and read `VERSION` to confirm what is deployed.
2. Read this handoff and `/areas/drawing-app.md` memory before patching.
3. Patch the live file, bump VERSION with the real date, run the build gates, ship as `nazca-vX.Y.html` plus a repo-ready `index.html`.
