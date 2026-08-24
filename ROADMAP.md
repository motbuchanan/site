# motbuchanan.com — ROADMAP

Self-documenting record of this repo. Fetch this file (raw) before any work and check it against what's actually in the repo. Update it with every upload and ship it in the same zip as the change it documents.

## What this is
The "This Phone" portfolio at motbuchanan.com: a phone-shaped home screen of single-file HTML apps, hosted on GitHub Pages from repo motbuchanan/site. Temporary front door that Mot now intends to keep (The Closet concept likely abandoned in favor of this).

## Current version
- index.html footer: **v7.12 · aug 24**
- Deployed authoritative source = this repo. Every zip in Downloads is behind it.

## What shipped (newest first)
- v7.12 (Aug 24): Dock Camera icon now shows Mot's real aperture mark (was a generic camera-body + plain-circle lens). Presented as the mark alone on the dark teal tile (chosen over a camera-body-with-lens version, which double-framed since the mark already has the body cap). IMPORTANT rendering lesson: <use href="#apmark"> did NOT resolve when nested inside an inner <svg> with a different viewBox (rendered invisible) - so all three mark instances (dock, lock, About) now INLINE the aperture path directly, and the shared <symbol> was removed. To place the mark anywhere new, inline this wrapper: <svg viewBox="940 -200 720 880"><g transform="translate(844.9,-213.7) scale(9.2129)"><path d="...aperture path..." fill="#4cf0e0" fill-rule="evenodd"/></g></svg> (full path lives in mot-aperture.svg in the repo). Always render-verify the mark after placing it.
- v7.11 (Aug 24): Replaced the traced mark with Mot's ACTUAL aperture from his source file mot-aperture.svg (he supplied it after the v7.10 trace was wrong). Now defined ONCE as an inline SVG <symbol id="apmark"> (source viewBox 940 -200 720 880) and referenced via <use href="#apmark" xlink:href> on the lock screen, Settings About page, and camera fallback. Camera photo watermark stamps the same real SVG as a data-URI image onto the canvas. og.png regenerated with it. mot-aperture.svg saved to repo root as the canonical asset. To use the mark anywhere new: <use href="#apmark" .../> (symbol is already in the DOM). DO NOT re-trace it by eye again.
- v7.10 (Aug 24): [superseded] traced camera mark (camera-body cap + 6-blade swept aperture iris + glow center, teal) now used on the lock screen, the Settings About page, and the camera fallback, replacing the earlier plain 4-tick aperture ring. og.png regenerated with the real mark too. SVG is hand-built on a 0..100 viewBox (cap path "M31 30 h8 l4.5 -6..."); reuse that block for any future spot that needs the mark. The wordmark in the .widget header is a separate vector-path SVG (the mark lives inside the "o" glyph) and was NOT touched.
- v7.9 (Aug 23): SETTINGS + CAMERA SHIPPED (big one). New dock = Settings gear + Camera + Mail (About moved off the grid into Settings). Settings is a shell OVERLAY inside index.html (not an iframe) so themes can skin the phone; games are iframes and structurally immune. Rows: About this phone (bio + joke device rows + tappable version), Software Update (changelog mirror, "up to date"), Display (11 themes: Classic/OLED/Glitch/8-Bit/DOS/Cartoon/Blueprint/CRT/Broken/Terminal/Vapor + accent swatches), Language, Sounds/Reduce Motion toggles, Storage (AUTO-COUNTS tiles by data-cat, never hand-edited), Privacy (honest no-tracking statement), Airplane Mode + Say hi. Every grid tile now carries data-cat (play/tool/make/meta) — REQUIRED for Storage; new tiles must include it. Jokes in 3 tiers: visible rows (Model MOT-1/Made in Akron/spite&coffee), tap-to-find (battery drains, airplane toasts "Still here", reset "just kidding"), and a 7-TAP version egg unlocking Developer Options (Balloon physics, Overclock, Show FPS, Reduce Emotion). Language = 3 hard-coded real settings-page translations (es/fr/de, with a "only had time for settings" wink) + 6 pure-JS joke languages (Pirate/Emoji/SHOUTING/1337/Reverse/Binary). Camera = camera.html, real getUserMedia, aperture+motbuchanan.com watermark on capture, graceful fallback if denied/http; iframe allow-list now includes "camera". Prefs persist via guarded localStorage (theme/accent/motion/lang/dev). Themes skin shell only, verified no rule touches iframe/#gf/#player. about.html file left in repo but no longer linked (bio now canonical inside Settings).
- v7.8 (Aug 23): Lock screen SHIPPED. Site opens on a lock screen (live time + date, aperture mark, name, one line). Dismiss: swipe up (touch), click / scroll-down / any key (desktop). Mode = once-then-remembered: guarded localStorage 'seen' flag, returning visitors skip straight to home. Tap the status-bar clock to re-lock. Flip const LOCK_EVERY_VISIT=true to greet every visit. No audio. Uses existing --sys system-font stack and the shared tick clock.
- v7.7 (Aug 23): Home grid reordered range-first (bundled with the still-un-deployed v7.6 SEO changes, so this one upload lands both). Row 1 = Board Games, Pigment, Reframe, Star Stuff (proof / eye-candy / range / anchor). Sudoku and Jigsaw moved late (Mot least proud of them). Board Games promoted for its chess engine. Game files did NOT move; only tile order in index.html changed. Icon color-coding was CONSIDERED and DROPPED: the real Grok icons are an asset worth more than a category-hue system; order carries the grouping instead.
- v7.6 (Aug 23): SEO pass. Real title, search-length description, full Open Graph + Twitter card tags, canonical URL, og.png preview image (dark ground, teal aperture nod), one visually-hidden crawlable h1. No visual change to the phone. No professional/job claim (stealth search preserved).
- v7.5 (Aug 20): tagline rewrite, all "coming soon" language removed, present tense.
- v7.x (Aug 20): card room complete (Poker, Hold'em, Rummy, Tonk, Hearts, Spades, Euchre); Sudoku rebuilt; LiftSafe, Production Triangle, Reframe, Pigment live.
- Aug 14-16: launch, board/card games, About page, Build Log, Jigsaw, Five Letters.

## Locked decisions (do not reopen)
- No resume link, no loud professional identity line on the home screen. Stealth job search; Mot's Yanke orbit reaches this domain via his business card.
- No Yanke work shown here (patient reels, brand systems). That content is Yanke-owned and approval-gated.
- Dock is deliberately label-free (real iOS docks are). Do not add a visible text label under one dock icon.
- Real wordmark/aperture used verbatim. Never rebuild the logo.
- No em dashes anywhere, including meta tags. No cream/warm-light backgrounds.
- Card backs: glow icon-only, rings unfiltered. Standard deck only, no cribbage.

## Open queue
1. Blackjack basic-strategy coach (Phase 4, never built).
2. Settings polish backlog: more themes if wanted, wire real Build Log content into Software Update so it can't drift, retire about.html file, optional Wallpaper picker + Text Size slider (designed, not built).
2. og.png is a plain generated placeholder. Replace with a better on-brand image when Mot wants.
3. Optional Build Log entries for v7.5 (taglines) and v7.6 (SEO).
4. Grok cover art for newer tiles if any are still on vector placeholders.
5. Security: verify Firestore rules on the gameshelf public Firebase key.
6. Infra: Cloudflare DNS move; confirm Enforce HTTPS.
7. Decide links.html: keep or delete.

## Gotchas
- Large files upload via "Upload files" only, never paste into GitHub's mobile editor (silently truncates).
- Art must be base64-embedded in index.html (relative paths break from Downloads).
- Verify the live site with a hard refresh after deploy; cache can show an old version briefly.

## Re-entry
1. Fetch raw index.html + this ROADMAP before editing.
2. Treat Locked decisions as binding.
3. Upload index.html + og.png + ROADMAP.md together.
