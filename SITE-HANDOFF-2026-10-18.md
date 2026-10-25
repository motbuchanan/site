# motbuchanan.com: session handoff, Oct 18 2026 (ships v7.50)

## 1. What this is
The "This Phone" portfolio at motbuchanan.com, repo motbuchanan/site (GitHub Pages, main, root). One index.html is the phone shell; 26 app tiles (8 loose + 4 folders), each with a card (APPINFO), launching local files or live external builds in an iframe. Audience: strangers who land here (no resume, no hire-me), people who get the domain from his business card, and makers who are welcome to copy anything. Authoritative files: the repo. ROADMAP.md in the repo is the running record and was re-synced this session.

## 2. Current state
- Delivered: **v7.50 · Oct 18**, zip `showcase-phone-v7.50.zip` = index.html, og.png, ROADMAP.md, roughcut/index.html, this handoff, SITE-AUDIT-2026-10-18.md. Upload index.html, og.png, ROADMAP.md to root and roughcut/index.html over the old one. Nothing else changed.
- Live before this session: v7.49 · Oct 10 (commit 83e1fc3, Oct 11).
- Verified headless (Chromium, phone 390x844 and desktop 1440x900, served over http): lock auto-advances at 7 s and the bar fills; Play folder shows NEW (Pocket Shark inside); About numbers read 7.50 / v7.50; Brew Deck card measures 498 KB from the local brewdeck/ files; TAKE IT links resolve for local single-file, local folder, standalone-repo and gameshelf-subfolder apps; roughcut/ redirect fires; 0 console errors; node --check OK; 0 em dashes; 0 jekyll tokens; APPINFO still parses as JSON.
- Untested on glass: the lock bar fill on his OLED, the evening tint at reduced strength (judge on glass, 4pm to 9pm), the pill row at his font size, the Save-the-file download on Android Chrome (download attribute, same origin, should just save).

## 3. Locked decisions (this session adds to ROADMAP.md's list)
- TAKE IT row on every card: Open on its own / See the code / Save the file. Links derive from data-game in takeLinks(); never hand-type GitHub URLs into APPINFO. This is the "take it" philosophy made visible; it did not exist on the site before (only the hidden lab pieces had it).
- Lock screen auto-advances after LOCK_AUTO_MS (7000). Swipe cue stays. The teal fill of .lkbar is the tell.
- A folder inherits NEW from any app inside it.
- One canonical home per app (table in ROADMAP.md "Where each app really lives"). Brew Deck = brewdeck/ in this repo. RoughCut = standalone repo. Measure Up + Haunt Inc = gameshelf repo. Noodle = DecisionDeck/beatforge.html (not on the site yet).
- Five taglines rewritten (apology/burnout lines out), two false ones made true, eight added. Mot owns the list; cut any he dislikes (LINES array, line ~920).
- Still locked from before and respected here: no resume link, no hire-me language, no employer work, no family names, dock label-free, real wordmark verbatim, icon-tap opens the card, layout law (8 loose + 4 folders).
- NOT changed, awaiting Mot: the lock-screen identity line and About paragraph order (method-first vs outcome-first; options in the audit), LinkedIn in About, the widget, loops, videos, desktop panel.

## 4. Open items (ordered)
1. BLOCKING for the widget: Mot picks the widget app and records its loop (phone screen recording, trimmed in RoughCut, 720p, 5 to 8 s, muted, under 3 MB). Recommendation on file: Pocket Shark first. Then the widget build (W1 in ROADMAP).
2. Mot picks the six loose apps that sit beside the widget.
3. Loops for the rest of the cards (W2), replacing title-screen screenshots.
4. His 3 to 5 own videos: confirm they are his own and not work-owned, then the Reel tile (W3).
5. Desktop: card-beside-phone + caption (W4).
6. Housekeeping on GitHub (F1): delete stray root file `measureup`, the four orphan pages, the 26 leftover roughcut/ files.
7. Cards (F2): Spectra and Haunt Inc screenshots; months for five `since` fields; mid-use shots for Knight School and Nazca.
8. buildlog.html entries for v7.43 to v7.50 (owed since Sep 26).
9. Noodle onto the site once the rebrand is confirmed uploaded to DecisionDeck.
10. Anti-AI rulebook October refresh (F5).

## 5. Gotchas
- FOUR version stamps now, not three: footer tagline, updBadge, verNum (the big tap number in About, no "v"), verNum2. verNum sat at 7.47 through two releases.
- The APPINFO object is ONE line of JSON inside the script. Patch it with scoped find/replace (anchor on the app key first), because status strings like "v0.7, installable" exist on more than one card. Keep straight quotes inside it (curly quotes were in the RoughCut copy; a straight double quote must be written \" in the source).
- The Brew Deck fix in v7.46 was lost by v7.47: later builds were cut from an older index. Always fetch the live index.html raw before building.
- Folder tiles are built in foldTile(); anything appended to the button BEFORE the innerHTML line gets wiped. The NEW badge is appended after it.
- Base64 icons stay embedded (ROADMAP gotcha: relative paths break when the file is opened from Downloads). Cost: index.html is 869 KB, 539 KB of it icons. If "the page is tiny" is ever claimed again, it has to be measured.
- Evening tint lives in todColor() (line ~1105). v7.50 halved the warm alphas for 5am to 8am, 4pm to 7pm and 7pm to 9pm. Revert = restore .35/.15/.32.
- The sandbox cannot reach *.github.io (proxy allowlist), so external tiles and redirects cannot be exercised here; they were checked by repo contents via git instead (all referenced repos exist; brewdeck standalone is still at the stale commit dadd478).
- Validation gates run this session: node --check on the inline script, 0 em dashes, 0 jekyll tokens, curly-quote scan, APPINFO JSON parse, headless render at phone and desktop with console capture. Run all of them again before the next ship.
- Standing-rule suggestion for the site skill/ROADMAP: "one canonical home per app; a copy in a second repo gets a redirect, not updates."

## 6. File map
- Repo: github.com/motbuchanan/site (main). Live: https://motbuchanan.com/
- Shell: index.html (phone, cards, settings, lock, taglines). CHANGES array ~line 833 (Software Update list). LINES ~920 (taglines). lock code ~662. APPINFO ~855 (one line). ITEMS ~1019 (layout law). takeLinks/paintTake just above closeSheet (~line 891). todColor ~1105.
- Cards' screenshots: flat root shot-<app>-N.jpg, 480 px wide. The Keep uses thekeep/0N-*.jpg.
- Folder apps in this repo: pocketshark/ (v1.3.1), sideboss/ (v0.8), gather/ (v0.7), thekeep/ (v0.7.12), allthumbs/ (hub v1.17), nazca/ (v0.18), reframe/ (v1.7), brewdeck/ (v6.0, canonical), lab/ (bloom.html live; dither, foil-maker, bird-foil, layout-lab hidden).
- External: motbuchanan.github.io/roughcut/ (v0.32), /spectra/ (v2.3), /gameshelf/measureup/, /gameshelf/hauntinc/.
- Orphans to delete: about.html, links.html, boardgames.html, cards.html, root file `measureup`, roughcut/* except the new index.html.
- Working copies this session: /home/claude/site-v750/ (edited files + patch scripts + test750.py render test); clone at /home/claude/motbuchanan/site.
- Audit: SITE-AUDIT-2026-10-18.md (full critique, research, sources).

## 7. People
- Mot: owner, sole builder, final call on every design and copy decision.
- His son: recipient of many apps; never named on the site.
- Employer: nothing of theirs on the site; coworkers reach the domain via his business card.

## 8. Re-entry instructions
1. Fetch raw index.html and ROADMAP.md from the repo; confirm the footer reads v7.50 · Oct 18 (if not, v7.50 was not uploaded; do not build on the older file).
2. Read ROADMAP.md "Where each app really lives" and "Open queue" W1 to W4.
3. Ask only for what is missing to start W1: the loop file and the pick of six loose apps.
4. Before any ship: node --check, em-dash scan, jekyll scan, APPINFO parse, headless render, bump all four stamps + CHANGES + ROADMAP, stamp the real date.
