# Civic Compass (showcase) ROADMAP

Current: CC 1.3 (November 3, 2026) - Phase 3 complete (live-ready).
Lives: motbuchanan.com/civic-compass/ (folder in the motbuchanan/site repo).
What it is: a neutral, white-label fork of Empower Compass for the site. Full toolset (dates, reps, voter toolbox, voting plan, canvass sessions, action log, scripts, report-to, backup, FAQ, about), no candidate slate, no party or org identity.

## Shipped in CC 1.0 (Phase 1)
- Forked from Empower Compass EM 1.5; DEM identity removed (crescent mark, cyan/navy palette, Empower Educate Elect, empowermedina links/email, org copy). No candidate slate.
- Reskinned: navy + brass content palette, teal site chrome (home pill, version badge, primary buttons, nav), Archivo + JetBrains Mono via ../fonts/fonts.css, compass mark.
- White-labeled: report-to and canvass copy generic ("your team or group").
- City picker: Akron / Cuyahoga Falls / Stow (Summit County's three largest).
- Hardening re-applied: calendar-icon fix, update-checker (build-meta compare + tap-to-refresh, suppressed during canvass), network-first sw.
- Storage namespaced civ_v1_. Version single-source via head <meta name="build">.
- CC 1.1: placeholder replaced with verified current Summit County officials (Akron Mayor Shammas Malik, Cuyahoga Falls Mayor Don Walters, Stow Mayor Mat Siscoe; Summit Executive Ilene Shapiro + Council + BOE; Gov. DeWine, State Sen. Vernon Sykes SD-28, State House find-your-district; U.S. Sens. Husted & Moreno, U.S. Rep Emilia Sykes OH-13). Dates set to the next Ohio general election (Nov 2, 2027) with a confirm-at-VoteOhio.gov posture. DATA_VERIFIED stamped Nov 3, 2026.

## Shipped in CC 1.2 - 1.3 (Phase 3)
- CC 1.2: chrome aligned to CHROME.md exactly (teal #4cf0e0, ghost ".mb-home" home button, fixed bottom-right ".mb-ver" version pill, teal-selected city tabs, mb token set).
- break-it: Breaker (phone, iPad, storage-blocked, landscape) found 0 crashes / console errors / 404s / overflow / dead screens. Fit check 0 problems. Independent reviewer found no Breaks.
- CC 1.3: acted on the reviewer's Fixes. Removed all em dashes and curly quotes (CHROME.md rule 8). Fixed stale election-date copy that contradicted KEY_DATES: header now "Nov 2027 General"; voting-plan and wizard dates aligned to Election Day Tue Nov 2 2027, early voting Oct 5, registration confirm-at-source; dead urgent-chip branch (was comparing 2026) fixed to 2027; grammar ("a Civic Compass backup"); leftover "EM 1.1" source tag now "CC 1.3". Re-ran the full gate: all zero.

## Phase 3 site wiring
- Tile added to the site root index.html (data-game "civic-compass/", compass SVG icon in site teal/brass).
- APPINFO card added (name, verb "Find your reps", what/why/how/learned in Mot's voice to rewrite, status "CC 1.3, installable", since "November 2026").
- Placed in the home screen's Tools folder via the ITEMS layout law; surfaces through the folder's NEW badge. Featured-8 selection left untouched (that is Mot's call per the in-file LAW comment).
- Home-screen version bumped v7.59 -> v7.60 (Nov 3) in all four stamp spots + changelog entry.

## Locked decisions
- White-label (no fictional org). Current officeholders, not a candidate ballot.
- Lives as motbuchanan.com/civic-compass/; reached from the Tools folder on the home screen.

## Open queue
- Optional (reviewer Improve items, none blocking): precache list in sw.js (currently network-first only; offline works after first visit), larger tap targets on a couple of small controls, Archivo on a few remaining system-font labels.
- Officials refresh after the Nov 3 2026 results take effect (Jan 2027); exact 2027 Ohio registration/early-voting dates remain confirm-at-source.
- Mot's call: whether to promote Civic Compass from the Tools folder to a featured home-row slot.
