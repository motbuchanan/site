# All Thumbs — course roadmap and state

## v1.16 (Aug 26 2026) - chapter rebuild pass COMPLETE (all 6) + app icon

- Ch5 python-basics.html v3.1: snake mascot; gold accent. Trail = tiny Python on real build data (version string, gameshelf_v1 storage key, USB cost math, measure app-name length, personalize a toast). All run through the teaching mini-interpreter (print/vars/concat/repeat/len; no str/list/if/for by design).
- Ch6 git-basics.html v3.1: check-flag mascot; orange accent. Trail is the RICHEST of the course, Mot's actual git history: ship puffkart.html to the shelf, stage only index.html while sw.js is half-done, branch a risky redesign, merge the finished redesign, the forgot-to-branch recovery, the merge conflict on the version badge. All six run on the real mini-git engine.
- ALL SIX ORIGINAL CHAPTERS now match the standard: spotlight mascot (transparent-on-dark), General/Trail practice toggle (General default in the chapter's accent color, Trail in purple filtering the gym to real cases), back-to-hub link, v3.1. Plus Ship It (ch7) already at this standard. The whole course is now consistent.
- APP ICON added: the mascot-with-logo-phone-on-digital-rain image wired as the PWA icon + favicons + web manifest. Hub is now an installable PWA ("Add to Home Screen"). Files: icon-512/192.png, apple-touch-icon.png, favicon-32/16.png, favicon.png, manifest.webmanifest.
- Hub v1.16 (matches project version; standing rule now: bump the badge on ANY touched file so a live deploy is verifiable against a stale phone cache).

Rebuild pass done. Course is walkable start to finish at one consistent standard. Next up is Tier 2 (ch8 data/Firebase, ch9 API, ch10 Shelf Dissected).


## v1.15 (Aug 26 2026) - chapter rebuild pass 1-4 (of 6)

Bringing the original six chapters up to the new standard: spotlight mascot, General/Trail practice toggle, back-to-hub link. General is default (each chapter's accent color); The Trail (purple) filters the gym to real build-history cases. Done so far:

- Ch1 computer-basics.html v3.1: computer mascot spotlight; Trail = fast-idiot cases (score counter, the BeatForge/iPad game-loop lag, base-price+shipping add). Existing tune-a-score / lives-countdown kept.
- Ch2 internet-basics.html v3.1: envelope mascot; Trail = real 404s, content:// trap, stale-cache-vs-friends-phone (already strong), plus bare-URL-serves-index and the img/-vs-root broken-mascot 404.
- Ch3 browser-basics.html v3.1: beret+brush mascot; Trail = dress-your-own-app drills (app header, brand h1 accent, version badge italic, grow game list, wire interaction). Interactive build-it drills, all already real.
- Ch4 linux-basics.html v3.1: cap+wrench mascot; Trail kept deliberately LIGHT and labeled honest (Mot's raw-terminal experience is thin) - leans on the file/folder moves that DO map to real GitHub work: puff-kart folder, flat-repo rule, backup-before-AI-rewrite, .nojekyll, cleanup. No invented terminal sessions.

STILL TO DO in this pass: Ch5 python-basics (Second Language), Ch6 git-basics (Save Points - richest Trail material, the actual branching/merge/commit history).

Every chapter validated: token gates, node --check, acorn parse, jsdom (mascot + toggle + back-hub + trail drills playable). All are single-file replacements using images already in the repo root.


## v1.14 (Aug 26 2026) - roadmap: CI/CD chapter + AI-media strand added

- Added CI/CD & GitHub Actions as a planned Tier 3 chapter (Mot saw a video, asked; strong fit because he already has Pages auto-deploy and the session validation gates are a ready-made Trail case). After Ch 7 / Ch 10, not urgent.
- Expanded the down-the-line media track: AI-generated images AND video as a full strand (how to make it, use it, edit it/post-production), with the All Thumbs mascot pipeline itself as the built-in worked example. This is Mot's mastery lane; the course eventually catches up to what he already does best.

## v1.13 (Aug 26 2026) - shadow-free mascot refresh, light-panel workaround REMOVED

- Root cause fixed at the source: the only mascots that ever fought the cutout were the ones with drop shadows, reflections, or soft glows. Regenerated all of those SHADOW-FREE (hard-edge effects, no ground shadow/reflection, plain white bg) so they now cut clean to transparent like the rest.
- Refreshed images (replace old): thumb-aha (hard-edge bulb), thumb-nice (hard-edge sparkles), thumb-internet (now a proper envelope + stamp + dot trail), thumb-on-phone, thumb-beside-phone, thumb-phone-hero.
- NEW HUB HERO locked: thumb-phone-hero = the "hero-b" holding-phone pose. The alternate framing is saved as thumb-phone-hero-a (available spare).
- LIGHT-PANEL SPECIAL CASE ELIMINATED. No more white panels, no -light.jpg files. Every mascot is transparent-on-dark everywhere: big centered spotlights (~230px, drop-shadow) for section hero art, and big angled poke-in (rotate ~8deg, overlap card edge, vary side/size) for tip boxes. This is the single locked mascot treatment for ALL chapters going forward.
- Chapter 7 (hosting-basics.html) bumped to v0.6: all light-panel markup/CSS stripped, mascots back to transparent poke-in on dark. Two-track General/Trail practice from v1.12 unchanged.
- See mascot-gallery.md for the current running image list.


## v1.12 (Aug 26 2026) - two-track practice system + phone hero + 3 new images

- BIG structural decision (locked): every section teaches ONCE (shared explanation), then practice/examples FORK into two color-coded tracks. GENERAL (blue) is the default = a complete standalone course anyone can pass and go deploy their own work. THE TRAIL (purple) = the same concept anchored to Mot's real one-thumb-on-a-phone builds, real cases + stakes. Toggle available per section; general shows first, trail is the deeper layer.
- Chapter 7 is the TEMPLATE for this. Its gym now has a General/Trail toggle. General = the 4-level "will it load or 404?" drills. Trail = 8 real cases from Mot's actual builds (the mascot img/ vs root upload, the course.html->index.html 404 rename, the zip-wont-unpack trap, measureup/ folder-in-repo, Reframe subfolder, the content:// iPad test). Trail hides the level tabs and shows a purple banner.
- Pattern to carry back through chapters 1-6 on their rebuild pass: shared teaching, then general-vs-trail practice fork, color-coded.
- NEW HUB HERO: thumb-phone-hero (mascot holding a phone with the aperture logo) replaces thumbsup. Matches the build-on-a-phone angle. Hub v1.12.
- 3 new phone images processed and added to the gallery: thumb-phone-hero (hero), thumb-on-phone, thumb-beside-phone. See mascot-gallery.md for the full running list Claude places from.
- Chapter 7 bumped to v0.2.


## v1.11 (Aug 25 2026) - Chapter 7 Ship It (Hosting) + pop-ins placed

- NEW chapter: hosting-basics.html "Ship It" (storage key hosting101_v1, state {m,quizBest,gym}). Teaches: what a host is, the repo, index.html as front door, root-vs-folder paths (the exact thing that broke the mascot upload), and the content:// / file:// phone trap as a first-class lesson. Has a live hosting engine (servePath/wouldLoad/makeDrill, module-exported for tests), 4 interactive sandboxes (repo+publish, front door, root-vs-folder, phone-trap), 6 missions, a "will this address load or 404?" gym with 4 levels, and a 5-question quiz. Footer links back to index.html.
- Hub bumped to v1.11: added the "Ship It" spotlight row in Unit 2 (color #b7a4e3, hosting mascot). Hub now has 7 chapters.
- Pop-in poses placed on the hub: thumb-think in the "How progress works" note, thumb-wave in the footer. Both are clean cutouts on dark, no light-panel needed.
- Ch7 reuses already-deployed root images: thumb-hosting, thumb-tip, thumb-oops, thumb-aha. The aha pose (glow) sits in a LIGHT tipbox per the glow-panel rule. No new image files needed.
- Chapter-card spotlight pattern (v1.9) unchanged and now covers all 7 rows.


## v1.10 (Aug 24 2026) - mascot art wired into hub, layout reworked

The "All Thumbs" mascot is now a real cartoon-thumb character (Grok-generated raster art, background-removed to transparent PNGs). Replaces the earlier failed SVG attempts.

- Hub (index.html) at v1.9. Chapter cards REDESIGNED as spotlight cards: each card = a large tinted spotlight zone (radial glow in the chapter accent color) with the mascot displayed big on top (~210px), the chapter number and complete-check as corner overlays, then title + description + progress bar BELOW. The mascot is the hero of each card, not a side icon. This is the locked chapter-card pattern going forward. NOTE: images live in the REPO ROOT (flat), not an img/ folder, because GitHub mobile web upload cannot create folders from a zip. index.html references them by bare filename. Mascots prominent: hero 132px, row mascots sized by HEIGHT (104px) not a square box, so the tall thumb fills its space instead of floating in an empty square. Hero text reworked: long lede pulled to full width below the title, version badge moved to the top-right corner, so nothing wraps in a skinny column beside the mascot. Hero shows thumb-thumbsup by the wordmark; each of the six course rows shows its chapter mascot.
- New `img/` folder in the repo root holds 18 PNGs (600px tall, transparent).
  - Pop-ins: thumb-happy, thumb-thumbsup, thumb-wave, thumb-tip, thumb-aha, thumb-nice, thumb-cool, thumb-oops, thumb-think
  - Chapter props: thumb-computer (chip), thumb-internet (glowing envelope), thumb-browser (beret+brush), thumb-linux (cap+wrench), thumb-python (snake), thumb-git (check flag), thumb-hosting (globe), thumb-data (STORAGE box), thumb-api (ORDER #42 ticket)
- LOCKED decision: the mascot is Grok raster art, NOT SVG. Character block prompt: short thick thumb, clear fingernail with white free edge + lunula, knuckle crease, warm orange skin, cute face on the pad, plain white background, no hand/other fingers. Keep the flat sticker style for chapter props (one prop, plain white bg), NOT detailed 3D movie scenes.
- GLOW poses (thumb-internet, thumb-aha, thumb-nice) have soft light with no hard edge: they must sit on a LIGHT panel, not a dark card, or the fade shows. The other 15 cut clean to full transparency.
- thumb-computer needed a hand-composited black drop-shadow ellipse (its source had a gray ground smudge stuck to the feet).
- The hub is no longer a single file: it is index.html + the img/ folder. Acceptable (one page, relative paths).


Doc version: v1.2 · Aug 23 2026
This file is the source of truth for the course. Read it first when picking the work back up. Update it (new doc version at top) whenever something ships or a decision changes. Most recent is authoritative; if the code and this doc disagree, trust the code and fix the doc, flagging the conflict.

---

## What this is

An interactive course ("All Thumbs") that teaches the fundamentals under Mot's own builds, for his learning first and as a public shelf piece second. Public angle: Mot builds almost everything on a phone, so the hook is phone-first, self-taught building. Not a read-it course. A do-reps-until-it-sticks course: every part has real working sandboxes and a practice Gym with drills checked live against a real engine.

Primary goal: help Mot learn what he needs to keep building.
Second goal: a shareable teaching piece on the website (motbuchanan.com shelf).

### What it demonstrates (the framing worth keeping)

This is, in effect, a working demonstration of a training-and-development method: take a goal, break it into what a person needs to know at each step, and build the interactive tool that gets them there, with practice tuned to how they will actually use it. The "Your work" gym level is the proof: same engine, drills reshaped to the real job.

Framed to an organization, that is custom training plans for any path through the company (onboard a fabrication tech, ramp a clinician on a new scanner, get a comms hire up to speed), built as live practice tools rather than passive slides.

Two honesty rails so the pitch stays defensible:
- This is a demonstration of the method, not a finished L&D platform. No admin dashboard, no cross-user completion tracking, no content-authoring UI. A real engagement gets scoped separately.
- The appeal for Mot is the version where he still builds. A pure training/enablement role that removes hands-on building is not the target. This piece is training-through-building.

---

## Decisions on record

- Aug 22: This course SUPERSEDES The Reveal (the old foundations-course / fieldguide). The overlap is resolved by absorbing it, not running two courses.
- Aug 22: Public shelf identity pulls from The Reveal. See "Pull from The Reveal" below.
- Aug 22: Tier 2 chapters get built next, in order, THEN the three Tier 3 branches. Confirmed.
- Aug 22: Aesthetic direction: each section keeps its own theme (colors/fonts fit the concept); a cohesive layer holds it together, especially the hub as branches grow. A dedicated design pass happens later, done as pick-from-options, not decided unilaterally. DEFERRED, do not design-pass early.
- Aug 23: PUBLIC NAME LOCKED = "All Thumbs." Dropped the magician/"Reveal" framing entirely. New angle: phone-first, self-taught building ("supposedly all thumbs, still built the whole thing on a phone"). "The Whole Machine" is retired as the hub name. The repo FOLDER stays `reveal` (renaming breaks the live GitHub Pages URL) — folder name and display name are deliberately separate. Live at https://motbuchanan.github.io/reveal/ . ENTRY FILE is index.html (renamed from course.html on Aug 23 so the bare /reveal/ URL resolves — Pages serves index.html by default; a root without one 404s). course.html no longer exists in the repo; delete it if it lingers.
- Nothing goes public yet. Keep developing.

### Open decisions (settle before the work they gate)

- Design pass: deferred by choice until the branches start growing. Not blocking Tier 2.

---

## Current state — what is built (all shipped, all validated)

Seven single-file HTML apps, same origin, deploy together in one folder. The hub reads each app's progress key same-origin. Progress is per-device / per-browser.

| File | Title | Version | Storage key | State shape |
|---|---|---|---|---|
| computer-basics.html | The Fast Idiot: What a Computer Actually Is | v3.0 | computer101_v1 | state.m{c1..c5} + quizBest + gym |
| internet-basics.html | The Second After You Tap | v3.0 | internet101_v1 | state.m{n1..n6} + quizBest + gym |
| browser-basics.html | The Painter | v3.0 | browser101_v1 | state.m{b1..b6} + quizBest + gym |
| linux-basics.html | Under the Hood | v3.0 | linux101_v1 | state.missions{m1..m6} + quizBest + gym |
| python-basics.html | Second Language | v3.0 | python101_v1 | state.lessons{p1..p4} + quizBest + gym |
| git-basics.html | Save Points | v3.0 | git101_v1 | state.m{m1..m7} + state.boss + quizBest + gym |
| index.html | All Thumbs (hub) | v1.4 | reads all six | reads .m / .missions / .lessons + .gym |

Course order: computer, internet, browser (Unit 1: how anything reaches your screen), then linux, python, git (Unit 2: your toolbox).

NOTE the three different state shapes (.m vs .missions vs .lessons). The hub already handles all three. Any new app should pick one and the hub must be taught it.

### The Gym pattern (locked, in all six)

Each app has a practice Gym section: randomized-name drill templates, five skill tabs (four concept levels + a fifth "Your work" level, lv:4) plus "Surprise me," a plain-words goal, a live check against the REAL engine, two-stage hints (concept, then exact answer), a "type it for me" fill, Skip (reveals answer, resets streak), and reps/streak/best persisted. Level filter: `pool = GYM_TPLS.filter(t => gymLevel === -1 || t.lv === gymLevel)`.

Each app exposes `window._gym` test hooks (start/state, plus app-specific solve/pick/apply).

Design rule to preserve: computer + internet field-call drills are the ONLY ones where a wrong answer ends the drill and resets the streak (they test the mental model). Everywhere else you keep working the problem. Prediction and diagnosis are tests; building is practice.

### "Your work" drill inventory (the his-stack level, lv:4)

- git w01-w06: ship a game to the shelf, selective-stage index.html while leaving sw.js unsaved, branch a redesign off the live hub and merge back, recover from forgetting to branch, survive a conflict on a version badge, init a new project.
- linux w01-w06: start a puff-kart project folder + index.html, echo/cat a VERSION.txt, move a misfiled asset to the flat repo root, back up index.html before an AI rewrite, touch .nojekyll, clean junk before upload.
- python z01-z05: build a version string (concat, no str()), make a storage key gameshelf_v1, USB cost math, len on an app name, a "Saved for..." toast. (z01/z04 were rewritten to stay inside the mini-interpreter, which has no str() and no list literals. Do not reintroduce those.)
- computer w01-w04: game-loop and score-bonus predictions, tune-a-score and lives-countdown builds.
- internet w01: five rotating deploy-desk diagnosis scenarios (404 after upload, content:// persistence trap, stale cache, blank page for one tester, custom-domain DNS).
- browser w01-w05: app header (h1 + p), brand accent color, version-badge rule (italic + color), grow the game list, wire a full interaction.

### Engines (what each gym checks against, honestly)

- computer: real toy CPU. Instrs SET/ADD/SUB/ADDR/SHOW/JUMPIF(reg>0 -> 1-based line)/HALT, regs A and B. Exports freshMachine/stepMachine/runMachine/bytesOf.
- internet: real DNS book + BFS-routable 8-node network (kill routers, it reroutes) + mini HTTP server (200/404/301). Exports makeDNS/dnsLookup/dnsAdd/bfsPath/serveRequest/NET_EDGES.
- browser: live DOMParser tree + scoped-CSS engine + real JS pokes. Exports scopeCSS/cssRules.
- linux: real in-memory filesystem + terminal. Commands pwd/ls/cd/mkdir/touch/echo>/cat/rm/cp/mv/clear/help. Exports freshFS/runCommand/nodeAt/pathString.
- python: mini interpreter. Supports print, variables, + (concat), * (repeat), len() on a string, math. NO str(), NO list literals, NO if/for. Exports runPython/pyTokenize/pyValToString.
- git: full mini-git. init/status/add/commit -m/log/branch/switch/checkout/merge (LCA 3-way + conflict flow). Live SVG commit graph. Exports freshRepo/runGit/statusOf/isAncestor/lca/headId.

---

## Roadmap

### Tier 2 — build next, in this order

- Ch 7 — Hosting & GitHub Pages. Repos, the upload-from-phone flow, flat vs folder, the content:// persistence trap as a first-class lesson (open from Downloads = quarantined origin = storage dies). Gym: fix a broken deploy, spot why a file 404s, choose flat vs folder.
- Ch 8 — Where data lives. localStorage -> files -> a real database, ending pointed at Firebase. Gym: pick the right storage for a scenario, debug a lost-save.
- Ch 9 — What an API call is. Mot already makes them. Request/response, status, shape. Gym: read a request/response, predict the result.
- Ch 10 — The Shelf Dissected. THE KEYSTONE. His actual Game Shelf taken apart and rebuilt: hub, game registrations, sw.js precache, Firebase sync, GitHub Pages deploy, the version timeline. This is the chapter that makes the course unmistakably his and carries the training-tool proof.

### Tier 3 — the three branches, after Tier 2

- Firebase / backend. Turn the buzzer learning-project into the lesson. Mot's named next skill. Auth, Firestore, live listeners, cross-device state.
- How AI models work. Prompts, context, what the model is actually doing. Includes a practical prompting/context gym (a Mot strength, so it teaches well).
- How digital media works. Images, video, audio as data. This is the on-ramp to the down-the-line media track.
- CI/CD & GitHub Actions. What continuous integration/deployment is, in Mot's terms: a robot on GitHub that runs jobs automatically when you push (YAML workflows in .github/workflows/). The teaching hook: he ALREADY has the "CD" half (GitHub Pages auto-rebuilds and republishes on every upload); this chapter adds an auto-CHECK robot IN FRONT of the publish. The Trail case is exact and personal: the validation gates Claude runs every session (node syntax check, acorn parse, em-dash check, jsdom smoke) turned into a workflow Mot owns, so he catches a broken file even building solo from a phone. Comes AFTER Ch 7 (hosting) and ideally after the Ch 10 keystone. Not urgent, high fit.

### Growth areas the course is being aimed at (Mot named these)

- Website development -> Tier 2 (hosting, data) + a future "how a real website is structured" chapter (multi-file, components, why frameworks exist). This is the bridge past single-file, his stated wall.
- Finding new tools to build -> a meta-skill piece: "how I turn a passing question into a built tool." His curiosity-tools practice made teachable. Doubles as portfolio.
- Growing with AI -> the How-AI-Models-Work branch + the prompting gym.
- Game development -> its own multi-chapter Unit (game loops, state, input, collision, canvas, juice/game-feel). Where his energy actually is. The computer gym already seeds the game-loop idea.

### Down-the-line / future (explicitly "down the line," after fundamentals)

- AI-generated images and video: a full strand, not one chapter. How to actually do it (the tools, prompting for images vs video, keeping a character consistent across generations), how to USE what you get (background removal, cutouts, sizing, placing into a build), and how to EDIT it (compositing, fixing artifacts, post-production, stitching video). The live proof already exists in this project: the whole All Thumbs mascot pipeline (Grok generation -> shadow-free prompting -> transparent cutouts -> placement) is a worked example Mot can teach from directly. This is the natural home for the lessons he's living right now.
- Using AI for editing and post-production (part of the strand above).
Placed after the fundamentals on purpose. This is Mot's mastery lane, so it is where the course eventually meets what he is already best at. The "how digital media works" branch is the natural lead-in, and CI/CD + the media strand are the two clearest "the course catches up to what Mot already does" moments.

### Proposed, not yet ruled on by Mot

- Debugging as a taught skill (read an error, form a hypothesis, test it).
- Working-with-AI-to-code specifically (how to hand off, verify what came back, avoid black-box dependence). Aimed at his worry that his code is vulnerable / full of junk.
- Security and cleanup basics (from The Reveal's Unit 5). Same worry, addressed directly.

---

## Pull from The Reveal (absorbed project)

The Reveal was reveal.html (was fieldguide.html), key reveal_v1, an 18-chapter read-only course. Its mission survives here. Pull, in priority order:

1. Name + premise. SUPERSEDED Aug 23: the magician/"Reveal" framing was dropped in favor of "All Thumbs" (phone-first). Do NOT reintroduce the magic angle. The self-source "reveal" MECHANIC (item 3) still stands on its own merit.
2. Shelf-dissected chapters -> becomes Tier 2 Ch 10.
3. The self-source peek mechanic (a page shows its own outerHTML + char count). The literal "reveal." Browser explainer has a light version; the full one is a signature move.
4. Specimen-frame visual identity (crop-mark corners, syntax palette). A candidate for the cohesive layer in the design pass. Optional.
5. The cross-chapter growing glossary -> a hub reference tab.

DO NOT pull: the 18-chapter read-only structure, the passive quiz-only progression. That is the part this course replaces.

---

## Standing build rules (apply to every app here)

- Single self-contained HTML. No base64. Literal hex in SVG. Escape `</script` inside JS strings. Guarded localStorage with a versioned key. Version badge, tappable -> toast.
- No em dashes anywhere, including app copy. No cream/warm-light backgrounds (the "default AI" tell). No uniform fade-up-on-scroll (also an AI tell).
- Honest-interactive: never fake an effect. If the engine cannot show the real thing, change the metric to what is true. (This is why the two python drills got rewritten.)
- Deploy: all seven files in ONE folder, same origin. Mot uploads from his phone via GitHub "Upload files" (never paste large file contents into the mobile editor, it truncates). Subfolders are OK for a self-contained app with relative paths and its own scoped sw.js; flat is the default.
- Publishable copy: no personal or employer names in the public version. The "Your work" drills currently name real projects (puff-kart, gameshelf, etc.). Fine for Mot's private build; sanitize for any public release.

## Validation gate (run before every ship)

Extract the single script block, then: node --check, acorn parse (ecmaVersion 2020), grep for 0 Jekyll tokens and 0 unescaped `</script` and 0 em/en dashes, then a headless jsdom smoke with url:'https://example.test/' (localStorage needs a real origin), wait ~100-120ms for init, assert. Strongest gate: every drill template must be machine-proven solvable by its own hint solution. When an app's version or tab count changes, update the older suites' stale assertions.

Test suites (in the working dir, not shipped): tier0-engine-test.js, git-engine-test.js, linux-v2-engine-test.js, linux-v2-smoke.js, gym-git-py-smoke.js, gym-rest-smoke.js, work-drills-smoke.js.

---

## Changelog

- v1.2 (Aug 23 2026): Renamed the hub file course.html -> index.html (v1.3 -> v1.4) to fix a 404 at the bare /reveal/ URL (GitHub Pages needs a root index.html). No content change beyond the rename and version bump. Nothing referenced course.html by name, so no link fixes were needed.

- v1.1 (Aug 23 2026): Public name locked to "All Thumbs"; magician/Reveal framing dropped. Hub renamed (The Whole Machine -> All Thumbs) and rev'd to v1.3 with phone-first framing. Course went live in a standalone repo (motbuchanan/reveal, folder name kept) with .nojekyll; Pages serving. Repo folder name and display name decoupled.

- v1.0 (Aug 22 2026): Doc created. Captures state after all six apps reached v3.0 (Gym pattern + "Your work" level in all six) and hub reached v1.2. Records the supersede-The-Reveal decision, the Tier 2 -> Tier 3 roadmap, the growth areas, the down-the-line media track, the training-tool framing, and the deferred design pass.
