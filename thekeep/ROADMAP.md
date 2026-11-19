# Ravenmarrow: Roadmap

**Current version:** 3.5 · Nov 19 2026
**Live URL:** https://motbuchanan.github.io/ravenmarrow/ (repo: ravenmarrow, files at the root)
**What it is:** A gothic Norse boss-battle game drawn entirely in code. A gift build inspired by a mobile Viking strategy RPG, built around boss fights, a warrior roster, and a light village. No money, no accounts, no data leaves the phone.

## Files (all flat, repo root)
- index.html: the whole game (engine, art, UI, fonts inlined)
- sw.js: offline cache + update detection. Cache name = `ravenmarrow-v<version>`
- manifest.json, icon-192.png, icon-512.png, apple-touch-icon.png: install
- .nojekyll: keeps GitHub Pages from processing files
- village-iso.js: the WebGL2 village renderer, loaded only on the Village tab (precached by sw.js as village-iso.js?v=<version>)
- ROADMAP.md: this file

## How updates reach her phone
1. Bump `<meta name="build">` and `<meta name="build-date">` in index.html, the HTML comment on line 2, and `CACHE` in sw.js (same number).
2. Add a new entry at the top of `CHANGELOG` in index.html. It shows once as "A new chapter" after the update lands.
3. Upload index.html and sw.js. Her phone checks on open, when the app comes back to the foreground, and every 30 minutes. A banner says a new chapter arrived; tapping Update reloads with progress kept.

## Save format
- localStorage key `ravenmarrow.save`, `v:1`. `migrate()` fills in any new fields, realms, buildings and settings, so old saves keep working when content is added.
- v1.1 added `ach` (deed id -> time), `daily` {last, total}, `bossKills` per realm, and stats flawless/collects/ultKills. 1.0 saves get bossKills backfilled from cleared realms.
- Backup codes start with `RVM1.` (Settings > Copy backup code / Restore).

## Shipped in 1.0
- 5 realms x 4 stages (3 fights + boss): Barrow-King, Garm, Hel-Maiden, Nidhogg, Jormungandr
- Bosses: signature attack every 3rd turn, enrage below half life, boss intro card
- 8 warriors (3 starters + 5 recruitable with bone runes), each with basic, special (cooldown) and Ultimate (Rage)
- Auto / Manual toggle mid-fight, 1x / 2x / 3x speed, tap-to-target
- Village: Forge, Rune Altar, Barracks, Mead Hall (idle silver up to 10 h)
- Raids: 5 waves, wounds carry over, double loot, keep loot from cleared waves
- Guided walkthrough (first battle teaches basic, special, Ultimate, targeting, Auto; then Warriors, Village, Raid). Replay from Settings.
- How to Play page, What's New, install guide (iPhone Share > Add to Home Screen, Android install prompt)
- Sound effects (WebAudio, on by default, only on taps and fights), ambient music (off by default)
- Balance target: realms 1 and 2 quick, then about 300 to 500 fights to clear realm 5 (simulated)

## Shipped in 1.1 (Nov 13 2026)
- Daily Blessing: first win each local day (saga or raid) pays silver, iron and runes scaled to her furthest realm. No streak penalty.
- Saga Journal (book button, top of camp): realm and boss lore, kill counts, stats.
- 20 Deeds paying bone runes (boss kills, flawless boss, Good Dog, Ultimate finisher, recruits, levels, buildings, full coffers, raids, 100 wins). Raid boss kills count.

## Shipped in 1.2 (Nov 13 2026)
- Relics: 15 (3 per boss), defined in RELICS in the engine. First boss kill always drops one; repeat kills 40%; raid boss 50%. One per warrior, most with a trade-off. Journal Relics tab, deeds Cursed Collector and The Hoard. Save fields `relics` {id: time} and `equip` {warrior: relic}.
- Combat feel pass (her feedback via Mot: too fast, no impact): wind-up before every move with rune flare, slash + spark effects, knockback, red hurt flash, heavier shakes, Android vibration. 1x pacing about 1.2 s per hero action; speed divides pauses by 1 / 1.8 / 3.

## Shipped in 1.3 (Nov 13 2026)
- Onboarding rework (Mot watched her read it: too much small text): cinematic one-line-at-a-time story intro, the Seer as a portrait character with one short line per step, gold keywords, word-by-word reveal, a notch pointing at the target, progress bar. How to Play is 11 swipeable picture cards (mini() in ui.js).

## Shipped in 1.4 (Nov 16 2026)
Her weekend feedback: had a blast, got far, played between Vikingard raids. Combat got repetitive (Vikingard varies animation and timing even on the same strike); village upgrades didn't feel like they did anything; she loved raiding with and against other people. 3 to 4 people now want to play.
- Attack styles per warrior look (HSTYLE) and per enemy shape (FSTYLE) in ui.js: body moves (release), projectiles (orb, arrow, ravens, sound ring, embers), impact variants (stab, cleave, claw marks, bite, slam rings), random variant + timing jitter on every strike.
- Engine: PASSIVES (one per warrior), TRICKS per enemy shape (poison, bleed, blind, all-hit), AFFIXES elites (Armored, Frenzied, Vampiric, Hulking) from realm 2 on, DoT/miss/endure events. Tutorial fight has no tricks. Foe stats raised ~12% to offset passives (sim curve unchanged).
- Village clarity: Now/Next numbers on every building, before/after squad stats on upgrade, bonus chips at the top of every fight, stat annotations on warrior pages.

## Shipped in 3.5 (Nov 19 2026) - Living Village Phase 5
- Arena on real villages. Raid a rival: your squad and Skirmish band attack their published layout (their levels, their squad and Garrison defend). Watch it or let it play out. Win by tearing down half the village or the Hall. Rating +20/-10, loot and Skirmish losses (Infirmary saves some) as before. Practice spar attacks your own layout, no rating.
- engine.js: arenaRecipe() and ARENA_TUNE (attackers 2.4x life, 3.4x attack, buildings 0.7x, hallK per defender Hall [.8, .97, 1.03, 1.17, 1.25]). Attackers wear 'x_' looks (slate and iron, black cloaks). Tuned with arenasweep.js: a mirror match is won by the attacker 43 to 49% at every Hall; punching up a Hall is hard (5 to 35%), down is easier (61 to 83%).
- base.js: simRaid result gains attHp (attacker life left; fights unchanged, SIM_VER still 1).
- ui.js: packLayout/unpackLayout (short tokens, about 6 characters a building), cleanLayout(raw, vil) next to cleanLineup (counts clamped to the Hall's unlocks, overlaps and strays dropped, invalid layouts fall back to a starter village), cleanVil, cleanUnit, packRecipe/unpackRecipe (6 KB cap; buildings rebuilt from layout + levels + kb/kh through raidItem). The player doc gains layout (published on connect and on Done in edit mode). A raid writes a feed entry with rec. ingestArena() turns entries aimed at you into red 'arena' reports, fought again on the receiving phone, deduped by uid:at (S.flags.arenaSeen, last 40). Replays draw the recipe's own village and levels, so old night reports also show the layout as it stood.
- Reports: kinds night, arena (raid on you, red card), attack and spar (yours: Victory or Repelled). HUD title per kind.
- Friend raids never cost coffers.
- Tests: arenasweep.js (Node) and v35check.py (two phones and a cheater on a mock store).

## Base engine (for the Clash-style game)
Reusable, no Ravenmarrow names: base.js (28x28 grid, footprints, fits, validLayout, starterLayout from a template, path, wallShape, the deterministic simRaid with SIM_VER and recorded frames) and village-iso.js (WebGL2 block renderer: camera, ground-grab pan and pinch, picking on real boxes, labels, edit mode with drag, paint and erase, placement rings, actors, battle playback). Ravenmarrow content: engine.js (BDEFS, UNLOCKS, STARTER, RAID_SHAPE, raidItem, raidRecipe, arenaRecipe and their tunes), art.js (blocks, figures, MATS), and ui.js (edit bar, placement facts, reports, Firebase).

## Shipped in 3.4.1 (Nov 19 2026)
- Easier village taps (Mot: the + on an empty plot was very hard to hit). A tap on a building's badge or name (16 px) picks it, and an empty plot's + catches taps within 34 px (labels float above the footprint, so the ground ray used to miss); footprint pads grow 0.12 tiles each side but only count when no real box is hit, so they never steal a neighbour's tap; 12 px tap slop before a drag starts panning, with the pan starting from the press point.

## Shipped in 3.4 (Nov 19 2026)
- Placement info in Edit layout: tap a building (or start dragging it) and a strip above the edit buttons gives its name, level, raid role, which Archer Towers reach it, how many extra steps the wall costs raiders to reach it, and what a tower covers. Updates live while dragging. Facts come from the raid rules (tower reach from raidItem, wall cost 6 like simRaid's router, unbuilt buildings ignored). Taps on walls and open ground in Move mode explain or clear instead of opening sheets.
- Tower reach rings drawn on the ground while anything is picked (bright for the picked tower, dim gold for the rest).
- Figures have more detail: boots, belts, hands, eyes, beards, helmet rims, crowns and crimson cloaks on your warriors, quivers, shield bosses; the dead get ribs, jaws, rusted helms and blades, fangs, horns, wing ribs. Fine detail is skipped when zoomed out (lod in village-iso.js).
- Zoom goes closer (cam.minZ 4.5 to 2.4).
- Raid sim unchanged (SIM_VER still 1, old reports still play).

## Shipped in 3.3 (Nov 18 2026)
Living Village, Phase 4 of 5: Night Raids fought on the map, with battle reports.
- base.js: simRaid(recipe, {record}) returns {result, frames}. SIM_VER 1, TICK 0.1 s, at most 900 ticks (90 s). Seeded random only, plain arithmetic and sqrt, positions rounded every tick, so a recipe always gives the same fight. Raiders spawn on one map side, path with Dijkstra (free tile 1, standing wall 6, buildings block), break walls in the way, fight defenders in reach, prefer towers if their shape says so, fly over walls (birds). Towers shoot the nearest raider in range, traps hurt each raider once. Defenders hold a post south of the Hall and engage within 7 tiles. Win = Hall standing and under 50% of building life destroyed. Result: win, pct, coreDown, kills, raiders, defHp, best defender, hash. Frames hold every unit, building life and shot for the replay.
- engine.js: raidRecipe() turns the village, layout, squad (makeHero), Garrison (makeBand) and horde (makeFoe) into a self-contained recipe. RAID_SHAPE gives each shape its speed, reach, wall-breaking, flight and target choice. Building life scales to the horde's hitting power and tower and trap damage to one raider's life, so the village's own levels decide how well it holds at every realm. RAID_TUNE {pack 3, heroAtk 2.6, heroHp 1.5}. Each foe becomes a pack (3 to 5 by Hall level).
- ui.js: nightHorde() is three kinds of the dead with HORDE_K [2.5, 3.0, 3.2, 1.25, 1.45] per Hall level. nightRecipe(), startNight(watch), settleNight() (loot, Garrison survivors from the band's life left plus the Infirmary, losses), nightResult(). Losing takes the share of uncollected coffers matching the damage (at least half, all of it if the Hall falls). S.reports keeps the last 10 {at, kind, by, recipe, result, loot, lost, band}. reportsSheet() opens from the Night Raid card and from the Battle reports button under the map. playReplay() re-runs the recipe with frames and plays it on the map with a HUD (1x, 2x, 4x, Skip). Torn-down buildings turn to rubble as they fall and come back after. A report from older rules shows the summary and hides Watch.
- village-iso.js: VIL.battle(), battleSpeed, battleSkip, battleInfo. Draws raiders, defenders, life bars, arrows, spells and trap flashes, and fire and smoke on badly hurt buildings. The camera follows the fighting until you touch the map.
- art.js: raider shapes as blocks (draugr, wolf, crow, wraith, serpent, dragon spawn), crimson-and-gold defender kits for your warriors, troop kits, rubble().
- Tuning: raidsweep.js (Node). A typical player with the starter layout holds 100 / 79 / 75 / 68 / 73% at Hall 1 to 5. Fights run 23 to 69 seconds at 1x.
- Tests: raidsweep.js (repeatable fights, 200 random recipes all end in time) and vil4.py (watch at 4x to the end, replay hash matches the report, Let it play out offers Watch, Skip, 10-report cap, old-rules report, villagers back after).

## Shipped in 3.2 (Nov 18 2026)
Living Village, Phase 3 of 5: lay it out yourself.
- base.js: reachable(layout, defs, item) (can anything walk in from the map edge to touch it) and validLayout(layout, defs, max, need, key) returning {ok, why:'bounds'|'overlap'|'count'|'missing'|'sealed', k}.
- village-iso.js: VIL.edit(mode, handlers) with modes 'move', 'paint' and 'erase'. In move mode a drag that starts on a movable building lifts it and shows a green (fits) or red (blocked) footprint; letting go calls place() or reject(). A drag on empty ground pans. Paint and erase call the handler once per new tile under the finger. Two fingers always pan and zoom. Faint tile lines on the ground while editing. Taps and drags now pick by each building's real blocks, not its bounding box, so a tall Hall no longer steals taps from the buildings behind it. VIL.dragState() for tests. MATS 32 (green) and 33 (red); the shader takes 40 materials.
- ui.js: vEdit {L, mode}, a working copy of the layout. The Edit layout button sits under the map. The bar holds Move / Draw walls / Erase walls, a wall counter (pieces / unlock), tray chips for extra Archer Towers and Spike Pits (only once that building is built, up to the Hall unlock), then Cancel and Done. Done runs validLayout: sealed, overlap, off-edge, too many and missing each get a plain message and a shake. Leaving the tab drops an unsaved edit. A one-time tip toast (S.flags.editTip). Help mode explains the edit button and tools. Hold-to-explain no longer fires on the map itself, so a slow start to a drag can't pop a card.
- Extra towers and pits are placed and saved now. Until Phase 4 the raid math still counts one tower and one pit.
- Tests: basecheck.js; vil3.py (drag to a free spot saves and survives reload, drop on the Hall is refused and snaps back, pan outside edit leaves the layout alone, tray adds a tower, walling the gate is refused at Done, erasing a piece makes it valid, Cancel discards, leaving the tab drops the edit).

## Shipped in 3.1 (Nov 18 2026)
Living Village, Phase 2 of 5.
- Controls fix (Mot's phone test of 3.0: panning felt reversed). Sideways drags were mirrored. Now a drag keeps the ground point under the finger (groundAt), pinch and wheel zoom toward the fingers or cursor, the finger left after a pinch keeps panning, and a double-tap on empty ground calls fit().
- art.js: figure(kind, frame, mode, torch) gives block people (walk 4 frames, work arm swing, torch), scaled 1.35x to read on a phone. Kinds: elder, smith, miner, priest, brewer, healer, scout, trainer, guard, villager, plus the troop types spear, bow, axe, shield. WORK holds the spot and job at each building. MATS grew to 32 (skin, hair, fur, robe, apron, tunics).
- village-iso.js: actors (route, waits, work at the far end, facing, torch light that moves with them), drawn in both the shadow and main passes. Raise animation: an upgraded building shows scaffolding and two builders, then its blocks rise from the ground over 3 seconds. It waits while a sheet or Vision covers the village (canAnimate). Smoke and dust are smaller and shrink as they rise.
- ui.js: villageActors(L). Villagers number 4 + 3 per Hall level (max 19), work at built buildings and walk real paths home. Up to 3 guards walk the inside of the palisade. Up to 12 troops drill in front of the War Camp, matching the skirmish and garrison types. At night, half as many are out and they carry torches. FX off or reduced motion: everyone stands at their post. vilRaise marks the upgraded building.
- Tests: basecheck.js adds every-building-pair walks with no wall crossings; vil2.py checks walking, working, the raise finishing at the new level, the thinner night crowd and FX off.

## Shipped in 3.0 (Nov 18 2026)
Living Village, Phase 1 of 5 (plan: ravenmarrow-village-plan.md). Caleb's idea: draw the village with The Keep's iso block engine.
- base.js (new source, inlined): the reusable base engine with no Ravenmarrow names. BASE.W/H 28x28, rng (mulberry32), fpOf, cells, grid, fits, wallShape (bits 1 N, 2 E, 4 S, 8 W), starterLayout, path (BFS), centre. Exported for Node (basecheck.js).
- engine.js: BDEFS footprints (hall 4x4, tower and pits 2x2, wall 1x1, others 3x3), UNLOCKS per Hall level (towers 1/1/2/2/3, pits 1/1/2/2/3, walls 80/92/104/116/128), unlocked(k, hall), STARTER template (ring 4..23, gate at 13 and 14 on row 23).
- art.js: MATS (25 block materials), blocks(id, level) and wallBlocks(level, shape). Five visible steps per building: sod and thatch, torches and fences, stone footing and slate roofs, banners and carved posts, gold trim and dragon heads. Level 0 is a staked plot.
- village-iso.js (new flat file): orthographic camera at The Keep's slant, lit blocks, 1536 shadow map from the sun or the blood moon, up to 16 flickering torch lights, chimney smoke, fog at the forest edge, pan, pinch and wheel zoom, tap picking by footprint box, HTML labels (level badge, upgrade arrow, name). Fits the whole walled village on open. Rebuilds after a lost WebGL context. Stops when the Village tab is left.
- ui.js: S.layout {v:1, items:[{k,x,y}]} made by ensureLayout() on load and restore (keeps all levels, troops and coffers). villageScene() turns the layout into parts, villagePaths() lays dirt paths from every door to the Hall and out of the gate. mountVillage() loads village-iso.js on demand and falls back to the old drawn map (svgVillage) if WebGL2 is missing. Help: canvas taps and holds explain the building under the finger (VIL.lastPick). Whispering claw marks show on the palisade. FX off or reduced motion stops flicker and smoke.
- Tests: basecheck.js (Node) and vil1.py (browser). v15check.py now opens building sheets with buildingSheet(id), since the map is a canvas.

## Shipped in 2.2 (Nov 17 2026)
Visions: event cinematics + a gallery (Saga Journal > Visions). Vision module in ui.js; VISIONS list holds id, title, unlock hint, image file, caption, camera move and effect.
- Scenes (file names fixed, upload any time): rm-ev-hold (Night Raid won), rm-ev-fall (Night Raid lost), rm-ev-wipe (fell to a saga or raid boss), rm-ev-boss0..boss4 (first kill of each realm boss), rm-ev-warband (warband boss spoils), rm-ev-legend (first Legendary), rm-ev-hall (Jarl's Hall level 5). Intro tile reuses rm-title.
- Each plays once, over whatever is on screen (z 96), tap or Close to dismiss, queue drains in order. If the art is missing the event is unlocked as 'u' and plays once on a later Continue when the file exists. Gallery: locked tiles show hints, missing art shows "Not painted yet".
- Watch the intro: title screen button, Journal > Visions, Settings.
- Scene art: all 11 rm-ev-*.webp painted and added Nov 17 2026 (900x1600, about 1.8 MB total). Not in the SW precache; cached on first view.

## Shipped in 2.1 (Nov 17 2026)
Title screen + cinematic intro from Mot's generated art (6 webp files beside index.html, about 790 KB total, all in the service worker's offline list; the SW now also caches any same-origin file it fetches).
- Files: rm-title.webp (title key art), rm-eye, rm-barrow, rm-hel, rm-realms, rm-squad (intro shots); new icon-192/512 and apple-touch-icon from the raven emblem. Source art is kept in art/ and build.py copies it into dist.
- Intro module (ui.js): 5 shots x 4.2 s with a camera move each (push, quake, rise, tilt) and an effect (eyelid blink, teal crack glow, Hel-Maiden eye ignite placed with cover-crop math, lightning flashes, embers), word-by-word captions, tap to advance, Skip. Plays once (S.set.introSeen), replay from Settings > Intro. Falls straight to the title if an image fails to load. No sound.
- Title: key art with slow drift, pulsing moon glow and fog; logo burns in, buttons fade in after.
- Tests: intro must be skipped with `typeof Intro !== 'undefined' && Intro.running()` (const is not on window).

## Shipped in 2.0.1 (Nov 17 2026)
- Equip best rewritten: each round hands out the single biggest gain across the whole roster (squad gains count triple), and it never saves a layout weaker than the current one. Tested on 40 random armories: never weaker, no item on two warriors, about 70 ms.
- gearScore special weights re-tuned from fight sims (Ward and Mending top, Battle-Fire and crit low); score order now matches win rates.
- Raid clears and warband spoils drop one tier higher, so the last realm gives tier 6. Sell value +20% per upgrade (was 30%, closed a tiny upgrade-and-sell profit). Spare sell is commons only. Army card shows kit bonus. Shorter craft labels.

## Shipped in 2.0 (Nov 17 2026)
Gear. Engine: RARITY (5), GEAR_KINDS (weapon 6, armor 5, charm 5), GEAR_FX (8 charm powers sharing relic fx keys), makeItem, itemFx (rarity x upgrade), gearFx (summed, capped by FX_CAP), craftCost, upgradeCost (+10 max), sellValue, kitCost. makeHero/power take a 5th gfx arg; bandStats/makeBand take a kit level.
- Save: S.gear {items (cap 80), eq {warriorId: {weapon, armor, charm}}}, S.kit {spear, bow, berserk}; migrate fills and sanitizes.
- Forge crafts weapons and armor at tier = Forge level (max 6); Altar binds charms at tier = Altar level; upgrading needs the matching building. War Camp kits: +10% life and attack per level for a troop type, up to the camp level (max 5).
- Drops: first boss kill always, replays 50%, regular wins 8%, Night Raid wins 35%, full Raid clears always, warband spoils always (rare or better). Rarity: legendary 1.5% base, +0.3% per bias point.
- Armory (Warriors tab): filter, item sheet (upgrade, take off, sell, give to with power deltas), sell spare commons. Equip best: squad first then by level, greedy per slot by gearScore (power plus weighted specials). Warrior sheet gear row + slot picker.
- Arena: defense lineup sends gx (gear fx) and garrison kit; cleanLineup clamps both.

## Shipped in 1.9 (Nov 16 2026)
Tap to know + help mode (Help module in ui.js).
- Tapping informational things (currency counters, coffers totals, warband bar, rival chips, defense chips, board, feed) opens a #tipcard: name, what it is for, how to get more. Party cards in battle open the same card.
- ? button in the hub top bar (#helpBtn) and battle bar (#helpB): help mode, where taps explain instead of act. Turns itself off when a sheet opens, the screen changes, or a coach step shows.
- Press and hold (480 ms) anything outside help mode for its card; the click after a hold is swallowed so nothing fires.
- Explainer rules live in Help's RULES list ([selector, fn]); add a rule for any new UI. costHTML tags chips with data-cur.

## Shipped in 1.8 (Nov 16 2026)
The Whispering: the Hel-Maiden notices the player (Psycho Mantis homage). Whisper module in ui.js. Changelog text is vague on purpose; do not spoil it in player-facing copy.
- Ambient, one per session on Continue: away 2+ days (claw marks on the palisade for a day), local time 0:00 to 3:59, battery 10% or less (Android), real full moon (the moon swells).
- Boss fights: history lines (S.stats.fell per warrior, S.stats.fled), warband friend lines (feed raids on you, top boss hitter), leaving the app mid-fight, phone upside down shows a hidden message (Android).
- Hel-Maiden only: reads manual moves. Repeating a move gets called out; switching to Auto gets "I can't hear their thoughts anymore"; she dodges the player's favorite manual move 35% of the time (engine readNext + mindReader, one miss per action).
- How to Play: after reaching Hel, the first card sometimes flips to "Trust the Seer... she lies."
- Rules: no fake system alerts, nothing leaves the phone, reduced motion skips the glitch, Settings "Let her in" silences it all. Last-seen lives in its own localStorage key (ravenmarrow.seen) so page hide never rewrites the save.

## Shipped in 1.7 (Nov 16 2026)
Art and juice pass, no gameplay changes (players are testing the balance).
- ATMO module (ui.js): #atmo canvas behind the UI for weather, #fxc above it for combat sparks and lightning, #skyflash overlay. Weather per realm (Barrow ash + red heat lightning, Ironwood fireflies + leaves, Hel snow + blue lightning, Roots rising embers + ground glow, Drowned rain + storms, village embers + fireflies). Off on menu tabs, paused when hidden, about 30 fps when only weather runs.
- Combat: Ultimates gather sparks and strike with lightning, big hits crackle, crits burst, buffs/heals lift motes, boss signature and enrage call a sky strike, boss deaths throw embers.
- Safety: full-screen flashes limited to one per 450 ms of real time at any speed (counting the hurt flash); reduced motion turns the canvas off and skips bolts and flashes. Settings: Weather & Magic switch (S.set.fx), the old CSS ash returns when it is off.
- Buildings redrawn in art.js with helpers (bGl soft glow, bTorch, bSmoke, bEmbers, bPlanks, bStones, bRoof, bBanner, bWin, bShield). Level steps: torches at 2, stone footing at 3, banners at 4, gold trim at 5. Moon rays in every scene.

## Shipped in 1.6 (Nov 16 2026)
Warband online. Firebase project ravenmarrow-99790 (Spark plan, anonymous auth, Firestore nam5). Config is baked into ui.js FIREBASE_CONFIG; SDK 10.12.2 loaded with dynamic import from gstatic only when a player joins.
- Data: groups/g_<code>/players/<uid> (name, defense lineup, power, rating), groups/g_<code>/boss/<isoWeek>/hits/<uid> (weekly wounds), groups/g_<code>/feed (who raided whom). Rules: signed-in read; each player writes only their own docs; feed entries must carry the writer's uid.
- Join screen in War (name + group code). Settings shows exactly what is shared, change name, leave (deletes own player doc).
- Shared Warband Boss: life = 700 wounds per player, wounds = 1000 x damage / that player's boss life (fair across progress). Leaderboard, once-a-week spoils when slain.
- Arena rivals: friends' saved defense lineups (cleaned and clamped by cleanLineup), rating +20/-10, feed lines, raids on you shown in red.
- Offline: fights still count; the absolute weekly totals publish on the next connect. Background refresh at most once a minute.
- Tests: v16check.py runs two phones plus a cheater against a mock store (window.RM_NET_MOCK).

## Shipped in 1.5.1 (Nov 16 2026)
- Close button on building sheets was covered by the building art (its glow filter stacked above the button). .sheet .close now z-index:5, .bart pointer-events:none.

## Shipped in 1.5 (Nov 16 2026)
Mot: villages need to be defended (walls, lookouts, archer towers), spend to recruit troops and grow resources, squad units that defend plus skirmish groups for attacking players and bosses. Friendly visual UI, not blocks of text. Modeled on Clash of Clans (Town Hall gates levels; collect, upgrade, train, attack) and Vikings: War of Clans (infirmary, watchtower, walls).
- Village is a drawn map (ART.villageMap), 12 buildings in engine BUILDINGS: hall (caps all others via bmax), mead/mine/lookout (idle silver/iron/runes, 10 h cap, one Collect), forge, altar, barracks (also troop strength + unlocks), camp (troop room), infirmary (saves 15%/lvl of fallen troops), wall/tower/pits (defense in night raids and Arena).
- Troops: TROOPS spear/bow/berserk; two bands (S.army.skirmish fights with the squad, S.army.garrison defends). Bands are single combat units (makeBand), losses settle after each fight (settleBand).
- Night Raids every 8 h after the first boss: squad + garrison + fort effects vs a horde. Lose = coffers emptied.
- Engine is side-generic now (enemiesOf/alliesOf), fort effects (tower arrows per round, wall damage cut, pits opening damage, lookout speed), round limits (boss 8, arena 15), Battle.dealt.
- War tab: Raid, Warband Boss (weekly rotating boss x40 life, 3 attempts/day, damage = rewards), Arena (fight a defense lineup: squad + garrison + fort; practice vs own shadow, 5/day). FIREBASE_CONFIG = null in ui.js keeps online parts dormant.
- Review pass: Arena uses Battle opt pvp:3 (hero armor is tuned for monsters, so hero vs hero otherwise times out); practice spars have no fort and count in arena.sparW/sparL, not rating. Troops cost 2.5x and band attack scales n^0.7 and drops as men fall. Boss and Spar locked until the first boss. Map slots re-spaced so every tap opens its own building.

## Multiplayer
Shipped in 1.6 as async warbands on Firebase (anonymous auth + Firestore, band code join, shared weekly boss, rivals, feed). Solo play needs no connection. Live co-op and live PvP are not built.

## Locked decisions
- Game art is drawn in code (approved Sample A look). Image files are limited to the icons, the title and intro shots (2.1) and the event scenes (2.2), all generated by Mot.
- No real money, loot boxes or timers that push paying.
- Version shows in Settings only (gift build, no badge on game screens).
- Nothing suggestive.

## Open queue (expansion ideas, in rough priority)
1. Feedback from the warband on Arena raids (balance knobs: ARENA_TUNE in engine.js)
2. Open question for Mot: real proximity bonuses (for example a building next to the Forge or under a tower gaining something). Not in the rules yet; would bump SIM_VER
3. Her feedback after play
4. Realm VI and beyond (each realm = 1 entry in REALMS + 1 foe shape if new)
5. Warrior stars / ascension past the level cap
6. Weekly hunt: one rotating boss with a modifier
7. More warriors (each = 1 WARRIORS entry + 3 SKILLS + a portrait case)
8. Haptics on hits (Android only; iPhone Safari has no vibration)
