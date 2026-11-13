# All Thumbs: course roadmap and state

## v1.24 (Nov 13 2026) - hub design pass: the shelf

The hub was one tall card per chapter (about 6,000px of scrolling at 11 chapters, double that by 16). Three layouts were mocked as phone renders (A the shelf, B a route line, C next-up plus index). Mot picked A, then flagged that three books on a shelf look empty, so round 2 regrouped and filled the shelves. That is what shipped.

- Structure: four topic shelves replace the six unit headings. The basics (ch 1-7), Under your own apps (ch 8-14), Directing AI (ch 15-16 plus the Images and video course), Branch courses (Video editing, Game development). Unit names survive as small divider tabs standing between books ("your toolbox", "shared + live", "trust nothing"). Chapter files never mention unit numbers, so nothing else changed.
- Each chapter is a book spine: color band with its number, title running up the spine, a fill that rises with its progress (same countDone / pctOf math and storage keys as before, all three state shapes). Planned chapters are dashed ghost books with no link. Branch courses are wide boxed sets marked COURSE.
- Tap a spine: it lifts 16px (the one signature motion) and opens one card under its shelf with the mascot, description, stats, and Start / Keep going / Open again. Default selection is the first unfinished built chapter. The page compensates so a tapped book never jumps out from under the thumb. Git's "boss beaten" chip moved into its card.
- Books flex wider when a shelf has fewer of them (max 66px, course boxes 128px). Each shelf ends with a bookend; any gap of 78px or more gets a mascot prop leaning on it (refit on resize). At 320px the books squeeze to 30px and no props show.
- PROPS (one line in the script) lists the prop images: currently thumb-wave, thumb-cool, thumb-happy, thumb-thumbsup. New leaning or posing bookend art drops in by editing that list.
- Also: badge tap now checks the live file for a newer build and offers a reload (meta build + VERSION + badge kept in step), a done line under the title ("10 of 11 chapters done on this device"), a noscript list of plain chapter links, aria-labels and aria-pressed on every spine.
- Adding a chapter now: give its CH entry key, img, file and total. It turns from a ghost into a real book in place. Planned titles for 12-16 are working titles.

### Art wanted (Mot plans to generate these)

- New chapter mascots for the new concepts (12 Break It onward), same sticker style as the rest, plain white background, no shadow.
- Bookend mascots made for the shelf: leaning on the bookend, sitting on the plank edge, peeking from behind a book, holding a book. Possibly animated. Until then the four existing poses stand in.

### Validation

0 dashes, 0 curly quotes, node --check, acorn, jsdom (4 shelves, 16 books + 3 courses, default selection, card stats and links, planned books unlinked, course cards, version in 3 places, noscript links, storage blocked, lift lands a frame later), real-tap checks (each tapped book rises 16px and stays put, Keep going opens the chapter), fitcheck 0 problems, Breaker clean on phone / iPad / blocked storage, separate reviewer. Reviewer found no breaks; fixed before ship: keyboard focus now stays on the picked book, the update bar is a real button, the extra re-render on window focus is gone, Python's card says lessons, finished books fill stronger. Left as is: the previously lifted book snaps down instead of easing down.

## v1.23 (Nov 13 2026) - expansion map approved + Chapter 11: Who Tapped First (Firebase)

The ten-chapter course was complete at v1.22. On Nov 13 the course was picked back up to cover what has been learned since. The old "Tier 3, pick one" list is replaced by this map. Most recent is authoritative.

### Approved unit map (Nov 13 2026)

- Unit 4, Shared and live: Ch 11 Firebase for real. BUILT (this version).
- Unit 5, Trust nothing: Ch 12 Break It (hostile testing: phone, tablet, landscape, blocked storage, and why the builder never grades its own work; Trail = real Breaker findings such as a chess trainer dying in private mode and a word game covering its own keyboard sideways). Ch 13 Debugging (root cause first, stale copy vs real bug, the tap-the-badge update check). Ch 14 Robots on GitHub (CI/CD, the validation gates and the Breaker as the worked example).
- Unit 6, Directing AI: Ch 15 How models work plus the prompting gym. Ch 16 Agents, skills and schedules (the separate reviewer, the monthly sweep, the rulebook refresh).
- Branches, each with its own mini-hub: AI images and video (the mascot pipeline as the spine); Video editing (companion to RoughCut; RoughCut is ready, so this branch is READY TO START); Game development (later).
- Build order: Ch 11, then Ch 12, then Ch 14. One chapter per sitting.

### Open decisions

- Do the media and editing branches live inside All Thumbs or stand as sibling courses on the site? Undecided Nov 13. Does not block Ch 12. Must be settled before the first branch chapter ships, because it sets the folder, the hub and the mascot.
- Hub design pass: it was deferred "until the branches start growing". With 11 rows and branches coming, it is now due. Do it as pick-from-options, before Ch 12 ships.

### Chapter 11 details

- NEW chapter: firebase-basics.html "Who Tapped First" (storage key firebase101_v1, state {m,quizBest,gym}, rose accent #ff7a9c, hero thumb-on-phone; think / oops / aha poke-ins, all images already in the repo). Chapter 8 explained that a cloud database exists; this one teaches the four jobs it does, told through the two-phone buzzer: who is asking (anonymous vs email sign-in, the uid as a name tag), where it sits (collection / document / field, odd-even path rule), are they allowed (security rules as the only lock, denied writes as the lock working), who was first (plain read-then-write vs a transaction, and the same guard stopping double scoring). Plus asked-once vs listening.
- Engine (pure, module-exported): hasUid, sameUidAcross, pathKind, evalRule(rule, asker), seesUpdate, race(mode), scoreAfter(guarded). Five sandboxes: sign-in picker with two devices, path builder, rule x asker verdict, once-vs-listening two-phone message counter, the tie race played step by step. 6 missions, yes/no gym with 4 General levels (name tags, rules, listening, ties), 9 Trail cases (buzzer rules, the Downloads sign-in trap, first-tap transaction, rock paper scissors scoring guard, the two-account messenger lock, voice notes refused until the rules learned them, the config key scare, the Game Shelf orphan-record reset, live sync with offline storage off), 5-question quiz with retry.
- New in this chapter, to carry back to older chapters when they are next touched: the badge shows number AND date, one meta name="build" tag mirrors VERSION, and tapping the badge checks the live file for a newer build and offers to load it. Also meta description, canonical and share tags.
- Hub v1.23: "Unit 4 - Shared and live" added with the Chapter 11 row (total 6), lede extended, units now placed by number ("unit" + r.unit), stale search description fixed (it still said six explainers), canonical and share tags added.
- Validated: 0 dashes, 0 curly quotes, 0 Jekyll tokens, node --check, acorn, 25 engine unit tests, 38-assertion jsdom smoke (every sandbox, all 6 missions, 50 gym drills across both tracks, quiz, storage blocked, hub reads the new key), fitcheck 0 problems, Breaker run plus separate reviewer.
- Known, not fixed here: the ten older chapters fail fitcheck on their nav strip (the checker does not see it as a scrolling strip; adding overflow-y:hidden to nav clears it), and their badges show the number without the date. Fold both into the hub design pass.
- Optional art: a dedicated Chapter 11 mascot (the thumb holding a buzzer button, same sticker style, plain white background, no shadow). If made, save it as thumb-firebase.png and the chapter and hub get pointed at it.
- Reviewer pass (separate agent, Nov 13): 0 breaks. Fixed before ship: section headings hiding under the sticky nav after a chip tap (scroll-margin-top), hub badge under 32px tall, an overstated line about what rules refuse, a made-up error message replaced with the real one, six copy flags. Fixed same day in chapter v0.2 (Nov 13): the path builder got a "back one step" button and an end-of-branch note, and quiz options now shuffle on every load and retry (the right answers used to sit only in the 2nd or 3rd slot). Left open: Hint then answer still scores a rep (same as older chapters).
- TESTED Nov 13 (chapter v0.3): Trail case 2 is confirmed on the build phone. A one-time test page opened from Downloads (content://) loaded the Firebase library, then anonymous sign-in gave no answer in 20 seconds and no error. The hint now says exactly that. One run on one phone (Android Chrome); the cause was not dug into.
- FOLLOW-UP outside this folder: the site home screen card for All Thumbs still says 10 of 10 chapters and 11 files.

## v1.22 (Oct 24 2026) - fonts load from the site's shared fonts/ folder (../fonts/fonts.css) instead of Google. No content change.

## v1.21 (Oct 22 2026) - full audit of the live course after ch8-10 went up

Pulled motbuchanan/site fresh and audited all 11 files (hub + 10 chapters) that are live at v1.20.
Checked per file: em/en dashes in raw, escaped (\u2014) and entity (&mdash;) form; Jekyll tokens; unescaped </script in JS; every thumb-*.png referenced exists; every href resolves; duplicate ids; node --check + acorn on every script; jsdom boot with console-error capture; gym starts on General AND Trail with level tabs hidden on Trail; quiz completes and persists quizBest; hub row key matches each chapter's storage key; hub `total` matches each chapter's real mission/lesson count; hub integration test seeding every state shape (m / missions / lessons) and reading the rendered percentages; dead-function scan.

Findings and fixes:
- hosting-basics.html: 8 dashes hiding as &mdash; and \u2014 (the original gate only caught the raw character). Removed. Dead function countDone() removed. Bumped v0.6 -> v0.7.
- computer-basics.html: dead function insText() removed. Bumped v3.1 -> v3.2.
- linux-basics.html: primeSeen flagged by the scanner but it is a named self-invoking function, so it runs. Left alone.
- index.html (hub): lede still said every gym has a "Your work" level (the pre-Trail name). Rewritten to describe General + The Trail. Chapters 8-10 were filed under "Unit 2 - Your toolbox"; added "Unit 3 - Under your own apps" and moved data/api/shelf there (3/4/3). Bumped v1.20 -> v1.21.
- Everything else clean: all 10 chapters boot with zero console errors, all gyms run both tracks, all quizzes are 5 questions and persist, all hub totals match (5/6/6/6/4/7/6/6/6/6), all images and links resolve, zero dashes elsewhere, zero Jekyll tokens.
- Site card (motbuchanan.com index.html, v7.51 -> v7.52): APPINFO allthumbs/ entry said "7 of 10 chapters built", listed 8 files, "the hub plus seven chapters", and the how-text named seven chapters. Updated to 10 of 10, 11 files (size stat is measured live from that list), "the hub plus ten chapters", how-text names all ten and the two gym tracks. shot-allthumbs-1.jpg re-rendered from the v1.21 hub at 480x1038 (old one showed v1.16). CHANGES log entry added.

Hub rules confirmed in the audit: a chapter shows "complete" at quiz 4/5 or better (the day-one rule); progress reads state.m, state.missions or state.lessons, so all three generations of chapter state shape work.


## v1.20 (Oct 22 2026) - Chapter 10: The Shelf Dissected (KEYSTONE). Tier 2 complete.

- NEW chapter: shelf-dissected.html (storage key shelf101_v1, brass accent #d9b35a, thumb-beside-phone hero, cool + nice poke-ins). The keystone: Mot's real Game Shelf taken apart. NOT a simulator: every number, file name and bug is read from the live motbuchanan/gameshelf repo (cloned with history on Oct 22) and AUDIT-2026-07.md. Facts baked in: 84 HTML pages, 282 commits (Jun 9 to Oct 21; 114/40/29/48/51 per month), 47 GAME_KEYS, sw cache gameshelf-v70 with 135 precached files, Firestore project buchanan-gameshelf, 4 onSnapshot listeners, GN.room (create/join/pushState/start/watch) live in Trouble, zero GN.room calls in Connect 4 yet.
- Sections: what it is (stat tiles) / anatomy (6 tappable parts, each mapped to the chapter that taught it) / adding a game (the four interlocking registrations as a checklist simulator: tick what you did, ship, read the silent bugs; engine registerGame(flags) maps each miss to its real failure) / the service worker (network-first, precache, the cache-name bump as deploy ritual) / the cabinet (gamenight.js, GAME_KEYS, the v34 orphan-record push-back bug walked step by step, GN.room) / timeline (commits-per-month bars + 7 real milestones). 6 missions, "ships clean or silent bug?" gym with 4 general levels, 8 Trail cases straight from the audit (arcade GAME_KEYS, Scrabble NAMES, chess shelf_tv vs gn_tv, network-first single-file edits, the v7-v16 deploy burst, the 67-ref link audit, Connect 4 room gap, deterministic labels), 5-question quiz.
- Hub bumped to v1.20: "The Shelf Dissected" row added, 10 chapters. Visible badge + VERSION var both updated.
- Deploy zip carries all three unshipped chapters (data, api, shelf) + hub + roadmap, since v1.18/v1.19 had not landed when this was built.
- Validated: 0 em/en dashes, 0 Jekyll tokens, node --check, acorn, 12 engine unit tests, 21-assertion jsdom smoke.

TIER 2 COMPLETE (ch8 data, ch9 API, ch10 keystone). Tier 3 next, Mot's pick: CI/CD and GitHub Actions (the validation gates as a workflow he owns), or the AI image/video strand (the mascot pipeline as the worked example), or the Firebase/backend chapter via the buzzer project.


## v1.19 (Oct 22 2026) - Chapter 9: The Order Window (APIs)

- NEW chapter: api-basics.html "The Order Window" (storage key api101_v1, coral accent #ff9a6b, thumb-api mascot; tip + oops poke-ins). Second Tier 2 chapter. Teaches what an API call is (the walk-up order window on someone else's computer, same move as Chapter 2 but asking for data instead of a page), the four-part shape (verb / URL / body / response), status codes by first digit (2xx worked, 4xx your order was wrong, 5xx the kitchen is broken), reading JSON by following label paths, API keys (a key in a page is readable, money-spending keys live server-side) and rate limits (429). Ties back to Chapter 8: Firebase config = which window, security rules = who is allowed.
- Engine (pure, module-exported): a tiny fake server callApi(verb,url,body) with two windows, whoseFault(status), dig(obj,path). Two sandboxes: build-and-send an order (watch the round trip, see 200/201/403/404) and a JSON label-path explorer that highlights the line and prints the answer.path code. 6 missions, a "whose side is the problem on?" gym with 4 general levels, 5-question quiz.
- Two-track practice: General (coral) + The Trail (purple, 8 real cases): the office weather screens going blank on 503 vs 401, a Firebase 403 permission-denied write, the API key scare (scan came back clean), polling too fast into 429, a stale link 404 after the course.html rename, a Firestore incident during the buzzer project, and the 200-but-undefined wrong-label-path bug.
- Hub bumped to v1.19: "The Order Window" row added in Unit 2 (9 chapters). Visible badge and VERSION var both updated.
- NOTE: Chapter 8 (v1.18) had not been uploaded yet when this was built, so this deploy zip carries BOTH data-basics.html and api-basics.html plus the hub.
- Validated: 0 em/en dashes, 0 Jekyll tokens, node --check, acorn, 13 engine unit tests, 21-assertion jsdom smoke.

STILL TO DO Tier 2: Chapter 10 (The Shelf Dissected, keystone). Tier 3 planned: CI/CD and GitHub Actions, the AI image/video strand.


## v1.18 (Oct 21 2026) - Chapter 8: Where Data Lives (Tier 2 begins)

- NEW chapter: data-basics.html "Where Data Lives" (storage key data101_v1, teal accent #45d4c4, thumb-data mascot). First Tier 2 chapter. Teaches the three places a web app keeps data: a variable (memory, lost on close), localStorage (survives close but stuck on one device/browser), and a cloud database like Firebase (survives everything, syncs to every signed-in device). Then the wall that forces the jump (progress on your phone is not on the kid's iPad), what Firebase is in plain terms (a shared cabinet on an always-on computer, config is not a password, security rules are), and sync via live listeners.
- Interactive engine (pure, module-exported, testable): survivesClose / visibleOnOtherDevice / syncs across the three tiers. Two sandboxes: a two-phone three-tier store (save on your phone, see what crosses to the iPad per tier) and a live-sync demo (save on one phone, the other updates itself). 6 missions, a "will the other device see it?" gym with 4 general levels, 5-question quiz.
- Two-track practice: General (teal, 4 levels) default + The Trail (purple, 8 real cases): the content:// progress-loss, early Game Shelf localStorage giving everyone separate scores, the Game Shelf move to Firebase, the buzzer learning project, and honest "localStorage is the right call" cases for solo apps (Pigment, a personal drawing app).
- Hub bumped to v1.18: added the "Where Data Lives" spotlight row in Unit 2 (8 chapters now). Both the visible badge and the VERSION var updated so the deploy is verifiable against a stale cache.
- Validated: 0 em/en dashes, 0 Jekyll tokens, node --check, acorn parse, 12 engine unit tests, 23-assertion jsdom smoke (all sandboxes, missions, track toggle, 25 trail drills, sync). Single-file chapter; thumb-data.png already lives in the repo.

STILL TO DO Tier 2: Chapter 9 (what an API call is), Chapter 10 (The Shelf Dissected, keystone). Tier 3 planned: CI/CD and GitHub Actions, the AI image/video strand.


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

Framed to an organization, that is custom training plans for any path through an organization (onboard a new hire, ramp someone on a new machine, get a new teammate up to speed), built as live practice tools rather than passive slides.

Two honesty rails so the pitch stays defensible:
- This is a demonstration of the method, not a finished L&D platform. No admin dashboard, no cross-user completion tracking, no content-authoring UI. A real engagement gets scoped separately.
- The appeal for Mot is the version where he still builds. A pure training/enablement role that removes hands-on building is not the target. This piece is training-through-building.

---

## Decisions on record

- Aug 22: This course SUPERSEDES The Reveal (the old foundations-course / fieldguide). The overlap is resolved by absorbing it, not running two courses.
- Aug 22: Public shelf identity pulls from The Reveal. See "Pull from The Reveal" below.
- Aug 22: Tier 2 chapters get built next, in order, THEN the three Tier 3 branches. Confirmed.
- Aug 22: Aesthetic direction: each section keeps its own theme (colors/fonts fit the concept); a cohesive layer holds it together, especially the hub as branches grow. A dedicated design pass happens later, done as pick-from-options, not decided unilaterally. DEFERRED, do not design-pass early.
- Aug 23: PUBLIC NAME LOCKED = "All Thumbs." Dropped the magician/"Reveal" framing entirely. New angle: phone-first, self-taught building ("supposedly all thumbs, still built the whole thing on a phone"). "The Whole Machine" is retired as the hub name. The repo FOLDER stays `reveal` (renaming breaks the live GitHub Pages URL): folder name and display name are deliberately separate. Live at https://motbuchanan.github.io/reveal/ . ENTRY FILE is index.html (renamed from course.html on Aug 23 so the bare /reveal/ URL resolves: Pages serves index.html by default; a root without one 404s). course.html no longer exists in the repo; delete it if it lingers.
- Nothing goes public yet. Keep developing.

### Open decisions (settle before the work they gate)

- Design pass: deferred by choice until the branches start growing. Not blocking Tier 2.

---

## Current state: what is built (all shipped, all validated)

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

- Hub v1.17 (Sep 21 2026): site chrome pass on index.html only. Archivo/JetBrains Mono for chrome text, shared .mb-ver badge (fixed bottom-right, taps to toast), Refresh button on shared ghost chrome. Chapters and mascot art untouched.

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

### Tier 2: build next, in this order

- Ch 7: Hosting & GitHub Pages. Repos, the upload-from-phone flow, flat vs folder, the content:// persistence trap as a first-class lesson (open from Downloads = quarantined origin = storage dies). Gym: fix a broken deploy, spot why a file 404s, choose flat vs folder.
- Ch 8: Where data lives. localStorage -> files -> a real database, ending pointed at Firebase. Gym: pick the right storage for a scenario, debug a lost-save.
- Ch 9: What an API call is. Mot already makes them. Request/response, status, shape. Gym: read a request/response, predict the result.
- Ch 10: The Shelf Dissected. THE KEYSTONE. His actual Game Shelf taken apart and rebuilt: hub, game registrations, sw.js precache, Firebase sync, GitHub Pages deploy, the version timeline. This is the chapter that makes the course unmistakably his and carries the training-tool proof.

### Tier 3: the three branches, after Tier 2

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
- Publishable copy: no personal or employer names anywhere in the course. The "Your work" drills name real projects (puff-kart, gameshelf, etc.), which is fine; people's names are not. Chapters were scrubbed Oct 25 2026.

## Validation gate (run before every ship)

Extract the single script block, then: node --check, acorn parse (ecmaVersion 2020), grep for 0 Jekyll tokens and 0 unescaped `</script` and 0 em/en dashes, then a headless jsdom smoke with url:'https://example.test/' (localStorage needs a real origin), wait ~100-120ms for init, assert. Strongest gate: every drill template must be machine-proven solvable by its own hint solution. When an app's version or tab count changes, update the older suites' stale assertions.

Test suites (in the working dir, not shipped): tier0-engine-test.js, git-engine-test.js, linux-v2-engine-test.js, linux-v2-smoke.js, gym-git-py-smoke.js, gym-rest-smoke.js, work-drills-smoke.js.

---

## Changelog

- v1.2 (Aug 23 2026): Renamed the hub file course.html -> index.html (v1.3 -> v1.4) to fix a 404 at the bare /reveal/ URL (GitHub Pages needs a root index.html). No content change beyond the rename and version bump. Nothing referenced course.html by name, so no link fixes were needed.

- v1.1 (Aug 23 2026): Public name locked to "All Thumbs"; magician/Reveal framing dropped. Hub renamed (The Whole Machine -> All Thumbs) and rev'd to v1.3 with phone-first framing. Course went live in a standalone repo (motbuchanan/reveal, folder name kept) with .nojekyll; Pages serving. Repo folder name and display name decoupled.

- v1.0 (Aug 22 2026): Doc created. Captures state after all six apps reached v3.0 (Gym pattern + "Your work" level in all six) and hub reached v1.2. Records the supersede-The-Reveal decision, the Tier 2 -> Tier 3 roadmap, the growth areas, the down-the-line media track, the training-tool framing, and the deferred design pass.
