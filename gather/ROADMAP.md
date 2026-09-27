# Gather: ROADMAP

Self-documenting record for the `gather/` folder app inside motbuchanan/site. Read this (raw) before touching Gather; update it with every upload and ship it in the same zip.

## What this is
A private, single-device family occasion planner: household profiles (the spine), gifts + budgets, a no-repeat Secret Santa with a pass-the-phone hold-to-light reveal, potluck sign-up, party games, countdown hub. Four themes (Halloween, Thanksgiving, Birthday, Winter Holiday). Every occasion is its own container sharing one household. Free on motbuchanan.com; opens in the site's app viewer (iframe) and also works on its own at motbuchanan.com/gather/.

## Current version
- index.html: **v0.5 · Sep 26** (badge = `VERSION` const + .mb-ver pill)
- sw.js CACHE: `gather-v0.5` (must match the badge every deploy)
- Storage keys: `gather.v1` (state, internal v:3), `gather.seenAbout` (first-open About shown)

## What shipped
- v0.5 (Sep 26): site edition. Etsy/store code removed (unlock code, buy links, demo mode, sale zip, Quick-Start PDF). CHROME.md applied. 0 em dashes. Storage-risk banner. First-open About sheet with self-measured file size and home-screen steps. Reveal lantern themed outside Halloween. Network-first service worker. Placeholder icon "The Table".
- v0.4 (Sep 15): no sticky add-bars; per-occasion dress-up faces and themed extra field (`face(p)`, `occ.faces`, `occ.extras`, `THEME_EXTRA`); chip auto-scroll; countdown date line.
- v0.3 (Sep 12): occasions as containers, gift memory on archive, theme-scoped draw history, wishlist kiosk, start fresh / clear sample, delete confirms, manifest/icons.
- v0.1 to v0.2.1 (Aug 11 to 15): first builds, hub, atmosphere, print sheets, backup/restore, vCard import.

## Locked decisions
- Single device, local only. No accounts, no cloud, no sync. This is the product's whole position.
- Household is global; treats, potluck and draw live inside an occasion.
- `face(p)` is the only way to render a person's emoji. Base face is neutral; dress-up is per occasion.
- Draw history is scoped by theme and banked only on archive. `drawSecret()` is property-tested; do not modify casually.
- No sticky bottom action bars (header "+ Add" pill + end-of-list button).
- Themed primary buttons and themed nav emoji are content, kept by design (CHROME exception).
- Not for sale. The Etsy/Gumroad track is dropped (Sep 26).

## Open queue
1. Icon pick from the six neutral concepts; swap gather/icon-*.png + the site tile base64.
2. Card copy voice pass (lives in the site index APPINFO, key "gather/").
3. Real-device check on iPhone (Safari, then home-screen copy) and Android.

## Validation gate
Extract the last inline script, node --check; 0 `{{`/`{%`; 0 em dashes; 0 `fill="var(`; badge == VERSION == sw CACHE suffix; headless 390x844 real taps: first-open About, Load sample, nav tabs, draw + hold-to-light reveal.
