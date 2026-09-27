# Gather: ROADMAP

Self-documenting record for the `gather/` folder app inside motbuchanan/site. Read this (raw) before touching Gather; update it with every upload and ship it in the same zip.

## What this is
A private, single-device family occasion planner: household profiles (the spine), gifts + budgets, a no-repeat Secret Santa with a pass-the-phone hold-to-light reveal, potluck sign-up, party games, countdown hub. Six themes (Halloween, Thanksgiving, Birthday, Winter Holiday, Easter, New Year's Eve), with moving-holiday dates computed rather than hardcoded. Every occasion is its own container sharing one household. Free on motbuchanan.com; opens in the site's app viewer (iframe) and also works on its own at motbuchanan.com/gather/.

## Current version
- index.html: **v0.7 · Sep 27** (badge = `VERSION` const + .mb-ver pill)
- sw.js CACHE: `gather-v0.7` (must match the badge every deploy)
- Storage keys: `gather.v1` (state, internal v:3), `gather.seenAbout` (first-open About shown)

## What shipped
- v0.7 (Sep 27): Guess the ___, a two-player pass-the-phone deduction game. 24 procedurally drawn SVG faces from attribute vectors, themed cast names per occasion, family mode that puts your own roster on the board, and a face editor that saves each person's look to `person.gwFace`. All six bottom-nav icons now theme (they had been stuck on Halloween since v0.1).
- v0.6 (Sep 27): Easter and New Year's Eve themes. Self-computing date engine: anonymous Gregorian algorithm for Easter, nth-weekday for Thanksgiving, `md:[month,day]` for fixed holidays. `defaultDate(theme)` returns the next upcoming occurrence, so no default ever goes stale.
- v0.5.1 (Sep 26): final icon, "Backlit generations" (family by height in dark silhouette on a teal glow, orange and teal rim light).
- v0.5 (Sep 26): site edition. Etsy/store code removed (unlock code, buy links, demo mode, sale zip, Quick-Start PDF). CHROME.md applied. 0 em dashes. Storage-risk banner. First-open About sheet with self-measured file size and home-screen steps. Reveal lantern themed outside Halloween. Network-first service worker. Placeholder icon (replaced in v0.5.1).
- v0.4 (Sep 15): no sticky add-bars; per-occasion dress-up faces and themed extra field (`face(p)`, `occ.faces`, `occ.extras`, `THEME_EXTRA`); chip auto-scroll; countdown date line.
- v0.3 (Sep 12): occasions as containers, gift memory on archive, theme-scoped draw history, wishlist kiosk, start fresh / clear sample, delete confirms, manifest/icons.
- v0.1 to v0.2.1 (Aug 11 to 15): first builds, hub, atmosphere, print sheets, backup/restore, vCard import.

## Guess the ___ (v0.7)
- The name is themed per occasion (`terms.guessName`): Guess the Ghoul, Guess the Elf, Guess the Bunny, Guess the Guest. **Never ship it as "Guess Who"** — that is a Hasbro trademark and this app is public.
- `GW_V` is a set of 24 attribute vectors balanced so every fair question splits the board. Do not casually edit it; the names in `GW_NAMES` are what swap per theme, not the vectors.
- `GW_NAMES[theme]` must stay 24 long and keep the f/m alternation of `GW_V` (even index female, odd male).
- Family mode fills a short roster up to 12 with themed characters and toasts that it did.
- `gwSeeded(person)` is a deterministic FNV-1a hash of id + name, so an unedited face is stable across reloads. `gwFaceSheet()` overrides it into `person.gwFace`.
- Faces are original code-drawn SVG, ported from the Game Shelf's guesswho.html. No third-party art anywhere in this game.

## Locked decisions
- Single device, local only. No accounts, no cloud, no sync. This is the product's whole position.
- Household is global; treats, potluck and draw live inside an occasion.
- `face(p)` is the only way to render a person's emoji. Base face is neutral; dress-up is per occasion.
- Draw history is scoped by theme and banked only on archive. `drawSecret()` is property-tested; do not modify casually.
- No sticky bottom action bars (header "+ Add" pill + end-of-list button).
- Themed primary buttons and themed nav emoji are content, kept by design (CHROME exception).
- Not for sale. The Etsy/Gumroad track is dropped (Sep 26).
- Holiday dates are computed, never hardcoded. Adding a theme means adding `md:` or `calc:` to it.
- Every new theme has **eight** registration points: CSS `[data-theme]` block, `THEMES` entry (including `navIc` and `guessName`), `THEME_EXTRA`, FX particle CONF, markSVG colors, lanternSVG colors, `GW_NAMES` cast, `GW_HATS` colors.

## Open queue
1. Card copy voice pass (lives in the site index APPINFO, key "gather/").
2. Real-device check on iPhone (Safari, then home-screen copy) and Android. Never done.
3. Delete the 6 stray files the v7.42 zip upload left in `gather/`: `Index.html` (1 byte, capital I, the GitHub mobile-editor paste truncation), `buildlog.html`, `shot-gather-1..4.jpg`.
4. Offered, not chosen: a "make your own occasion" custom theme, and international themes (Lunar New Year, Diwali, Hanukkah, Eid) with published-source sourcing.

## Validation gate
Extract the last inline script, node --check; 0 `{{`/`{%`; 0 em dashes; 0 `fill="var(`; badge == VERSION == sw CACHE suffix; headless 390x844 real taps: first-open About, Load sample, nav tabs, draw + hold-to-light reveal, create an occasion per theme and read back its computed date, and a full Guess the ___ playthrough in both modes (pick, flip, peek, pass, wrong guess, right guess, restart, quit) plus the face editor round-tripped through a reload.
