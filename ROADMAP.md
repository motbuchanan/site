# motbuchanan.com — ROADMAP

Self-documenting record of this repo. Fetch this file (raw) before any work and check it against what's actually in the repo. Update it with every upload and ship it in the same zip as the change it documents.

## What this is
The "This Phone" portfolio at motbuchanan.com: a phone-shaped home screen of single-file HTML apps, hosted on GitHub Pages from repo motbuchanan/site. Temporary front door that Mot now intends to keep (The Closet concept likely abandoned in favor of this).

## Current version
- index.html footer: **v7.7 · aug 23**
- Deployed authoritative source = this repo. Every zip in Downloads is behind it.

## What shipped (newest first)
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
1. Lock-screen About: APPROVED in concept (Mot likes it). Site opens on a lock screen (name, aperture mark, one honest line, live clock) that swipes up / clicks away into home. Adapts to input: swipe on touch, click/scroll/keypress on desktop. Decision pending: show every visit vs once-then-remembered (Claude recommends once-then-remembered, tap the clock to revisit). Also a Settings-styled "About this phone" tile as the on-demand version (pun on the concept). Demo built: layout-proposal.html.
2. Blackjack basic-strategy coach (Phase 4, never built).
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
