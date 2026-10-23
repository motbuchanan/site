# Break report: motbuchanan.com sample sweep
Oct 23 2026 · 5 apps · phone, iPad, storage blocked, landscape

## Ranked across apps
1. Knight School: BREAK. With storage blocked (private mode), no board ever appears. Unguarded localStorage at knightschool.html line 879.
2. Five Letters: BREAK. Turned sideways, the letter grid covers the keyboard (R T Y U unreachable). min width rule at fiveletters.html line 47.
3. Five Letters: storage blocked drops a won daily; no version badge on screen.
4. Home screen: version mismatch, 7.52 in footer and Software Update, 7.51 in Settings badge and About.
5. Gather: badge and sw.js cache still v0.7 Sep 27 though the file changed Oct 22; installed phones may keep the old copy.
6. Knight School: badge still v1.1 Sep 21; Woodshop button label cut off.
7. Pocket Shark: about page has 12 em dashes and is out of date; sw.js offline list missing four portraits. Tap test inconclusive (no GPU on the test machine), code read only.
8. Every app loads Google Fonts, which sends a request off the device against the site promise.

Full per-app reviews follow.

# Knight School break report
Tested Oct 23 2026 · phone, iPad, storage blocked, landscape

## Breaks (a real person would hit this and be stuck or lose something)
- With saved data blocked (private mode, strict browser settings), the app dies on load. No chessboard is drawn, and New game, vs Computer, Coach, Learn and Theme do nothing. Only the version badge responds (screenshot no-storage-1-load.png).
  Where: knightschool.html:879 `let themeB=localStorage.getItem("ks_theme_b")||"walnut";` is not wrapped in try/catch. It throws, and the rest of the main script (lines 778 to about 1470) never runs.
  The same unguarded calls are at lines 880, 883, 888, 895, 900, 901, 905, 1388, 1394 and 1400.
  Fix: add one helper near line 779 and use it for every call on those lines:
  `const LS={get(k,d){try{const v=localStorage.getItem(k);return v==null?d:v;}catch(e){return d;}},set(k,v){try{localStorage.setItem(k,v);}catch(e){}}};`
  Then, for example, `let themeB=LS.get("ks_theme_b","walnut");` and `LS.set("ks_finish",finishId);`.

## Fix (real defect, not blocking)
- The version badge says "v1.1 · Sep 21", but the file was last changed Oct 22 (repo history). It does not match the real date.
  Where: knightschool.html:173 (badge) and :1475 (toast text "v1.1 loaded"). Fix: bump both to the next version and today's date, and keep them in step on every change.
- The "Woodshop" finish button is cut off and shows "Woodsho" (phone-2-after.png, phone-3-landscape.png). The label also sits jammed in the top-left corner of the chip.
  Where: knightschool.html:66 `.sw{width:58px;...display:grid;grid-template-columns:1fr 1fr}` is the colour-swatch style. It is reused for the text chips at :1412.
  Fix: give the finish chips their own class, e.g. `b.className="sw fin"` plus CSS `.sw.fin{width:auto;min-width:72px;display:flex;align-items:center;justify-content:center}`.

## Improve (worth doing, polish or feel)
- Fast taps highlight text in blue, like a text selection, on the Theme sheet titles and the Done button (phone-2-after.png). Fix: add `user-select:none;-webkit-user-select:none` to buttons and to the overlay sheets (`.ov`, `#thOv`, `#lvOv`).
- The version badge is 21px tall, under the 32px tap-target size. It only shows a toast, so a missed tap does no harm. Optional fix: `min-height:32px` on `.mb-ver` (line 152).
- The app contacts fonts.googleapis.com and fonts.gstatic.com (lines 4 and 5). That sends the visitor's IP address to Google, which goes against "nothing leaves your device". Fix: self-host the two fonts, or drop them and use system fonts.

## Not a problem
- No crashes, console errors, missing files or sideways scrolling on phone, iPad or landscape when storage works.
- No em dashes in the visible text or in the source.
- Sound: the game plays sounds only in response to a tap. The click listener at line 401 needs a real tap, and mute is saved with try/catch (lines 331 and 391). Nothing plays by itself.
- The "Pass & Play" setup, the Learn progress and the game record already use try/catch (lines 227 to 299, 1244 and 1245).
- Landscape layout fits. The theme sheet stays centered and usable (phone-3-landscape.png).
- The dimmed board in the welcome screenshot is a modal backdrop on purpose, not a broken render.
- The Google Fonts request being blocked, and the missing audio output, come from the test machine.


---

# Five Letters break report
Tested Oct 23 2026 · phone, iPad, storage blocked, landscape

## Breaks (a real person gets stuck or loses something)
1. On a phone turned sideways, the letter grid slides down over the keyboard and the Today/Practice buttons. Tapping R, T, Y or U (and the Today button) hits a grid tile instead, so you cannot type those letters. Confirmed by checking what sits under each key on a 915x412 screen: R, T, Y, U and Today all return a grid tile. See phone-3-landscape.png.
   Where: fiveletters.html:47 (`#grid` width uses `max(180px, ...)`, which forces the grid to 180px wide on a short screen even when there is no room) and fiveletters.html:74 (`.key` fixed at 52px tall).
   Fix: add this before `</style>`:
   `@media (orientation:landscape) and (max-height:520px){.key{height:40px}#kb{gap:5px;padding-top:4px}#grid{width:min(86vw,340px,calc((100svh - 290px) / 1.25))}}`
   Tested on a copy: keys and Today button are all reachable and the grid sits clear of the keyboard.

## Fix (real defect, not blocking)
1. With storage blocked (private mode, some school iPads), you can win today's word and the record still shows 0 played, 0% won, and "Copy my result" says "Play today's word first". The game drops your result instead of keeping it in memory. Confirmed by solving the daily with storage blocked.
   Where: fiveletters.html:271-277 (`loadStats`, `saveStats`, `loadDaily`, `saveDaily`).
   Fix: keep a memory copy. Add `var MEM={};` and in each save do `MEM[key]=value;` before the try; in each load return `MEM[key]` when the localStorage read fails or is empty.
2. No version badge on screen. The file has `var VERSION="v1.1"` but it is never shown, and there is no date anywhere.
   Where: fiveletters.html:217.
   Fix: add a small badge (for example under the Daily number or in Settings) showing `v1.2 · Oct 23` and bump it with the landscape fix.

## Improve (polish or feel)
1. The "Your record" button uses a menu icon (three lines), which reads as "menu", not "stats".
   Where: fiveletters.html:144.
   Fix: use a bar-chart icon or the word "Stats".
2. In storage-blocked mode the welcome tutorial pops up every time the page opens.
   Where: fiveletters.html:550-554.
   Fix: also remember `fl_tut_seen` in the memory copy from Fix 1 so it shows once per visit.

## Not a problem
- No crashes, console errors, missing files, sideways scroll, or tiny tap targets in any run.
- Portrait phone, iPad and storage-blocked screenshots all look right.
- All 1,038 answer words are real 5-letter words in words.js, so the answer is always a legal guess. No daily word repeats in the next 365 days.
- No em dashes in the file. No sound at all.
- "Left the app" was the tester tapping the Home button, which is meant to go back to the home screen.
- External hosts: fonts.googleapis.com (Google Fonts). The copy-result button only writes to your own clipboard.


---

# This Phone (site home screen) break report
Tested Oct 23 2026 · phone, iPad, storage blocked, landscape

## Breaks (a real person gets stuck or loses something)
None found. About 110 random taps, swipes and mashes across three runs: no crashes, no console errors, no missing files, no sideways scroll, no tiny tap targets. Lock screen, home grid, settings and opened apps all drew correctly in the screenshots, including with storage blocked.

## Fix (real defect, not blocking)
1. The three version numbers disagree. The footer and the Software Update page say v7.52, but the Settings row badge and the big "tap the version" number on the About page still say 7.51.
   Where: index.html:498 (footer, v7.52 Oct 22), index.html:550 (`updBadge` v7.51), index.html:592 (`verNum` 7.51), index.html:598 (`verNum2` v7.52).
   Fix: change line 550 to `v7.52` and line 592 to `7.52`. On the next change, bump all four spots together (and the date in the footer).

## Improve (polish or feel)
1. The "Sounds & Haptics" switch saves a setting that nothing reads. Flipping it changes nothing.
   Where: index.html:556 (switch), index.html:735 (`wireToggle('tglSound','set_sound',true)`). No other code reads `set_sound`.
   Fix: either remove the row, or turn it into a joke toast like Airplane Mode so it does something visible.
2. Leftover dead variable `var VER='7.26';` is never used and is an old number that could confuse a future edit.
   Where: index.html:705.
   Fix: delete the line, or point it at the real version and use it to fill all four version spots from one place so they cannot drift again.

## Not a problem
- Storage blocked: the page swaps in an in-memory stand-in (index.html:675) and every read and write goes through try/catch (lines 688, 691, 707-708). Worked in the test.
- No em dashes anywhere in the file.
- Nothing plays sound on its own; there is no audio code on the home screen.
- "Opened a new tab: reframe/" was the tester tapping "Open on its own" on an app card, which is meant to open a new tab.
- "After tapping" screenshots timed out on iPad and storage-blocked runs because a heavy app was open in the player on a GPU-less machine.
- Landscape: no sideways scroll; the opened app (Nazca) filled the screen correctly.
- External hosts the page itself contacts: fonts.googleapis.com and fonts.gstatic.com (Google Fonts). Four app tiles (RoughCut, Spectra, Haunt Inc, Measure Up) open motbuchanan.github.io, which is your own site. Mailto links open the mail app only when tapped.
- Footer date Oct 22 matches the last commit (Oct 22), so it is correct until the next change.


---

# Gather break report
Tested Oct 23 2026 · phone, iPad, storage blocked, landscape

## Breaks (a real person would hit this and be stuck or lose something)
None found. With storage blocked, the app keeps working from memory and shows a clear "This copy may not keep what you type" banner with a Save backup button (no-storage-2-after.png).

## Fix (real defect, not blocking)
- The version badge says "v0.7 · Sep 27", but index.html was last changed Oct 22 (repo history). It does not match the real date.
  Where: gather/index.html:420 (badge), :432 (`VERSION`), and sw.js:3 (`CACHE = 'gather-v0.7'`).
  Fix: bump all three together to the new version and today's date. If the cache name stays the same, phones that installed the app can keep the old copy.
- On a phone, the version badge sits on top of the footer line and covers the words "no cloud, no ads" (no-storage-2-after.png).
  Where: :233 `.mb-ver{position:fixed;...bottom:calc(76px + ...)}` floats over `.foot` (:227, :406).
  Fix: add room under the footer, e.g. `.foot{margin:26px 0 8px;padding-bottom:40px}`, or put the badge inside the header instead of making it fixed.
- The app promises "nothing sent anywhere", but it loads fonts from fonts.googleapis.com and fonts.gstatic.com, which sends the visitor's IP address to Google.
  Where: :11 and :12. Fix: self-host Archivo and JetBrains Mono next to index.html (and add them to SHELL in sw.js), or use system fonts.

## Improve (worth doing, polish or feel)
- The "About Gather" footer link is only 14px tall (`.linkbtn` at :241 has `padding:0`) and hard to hit with a thumb. Fix: `.linkbtn{padding:9px 6px}`.
- Fast taps highlight whole blocks of text in blue: the bottom nav labels, the empty-state text and the "+ Add a treat" button (no-storage-2-after.png). Fix: `button,.nav,.empty{-webkit-user-select:none;user-select:none}`.
- In Guess the Guest, the "Pass the phone" screen has only one button, "I'm Player 2" (:1463 to :1468, phone-2-after.png). No one is stuck, but there is no way to leave from that screen. Fix: add a small "Quit" button to the curtain that calls `gwClose()`.

## Not a problem
- No crashes, console errors, missing files or sideways scrolling on phone, iPad, landscape or with storage blocked.
- All storage calls are wrapped in try/catch with an in-memory fallback: `load`/`save` at :569 to :574, the probe at :616, and the welcome-seen flag at :1653 and :1737.
- No em dashes in the visible text or in the source.
- The tester's version check found no version on load. That is only because the welcome sheet covers the badge on first open (phone-1-load.png); the badge shows once the sheet closes.
- The blank-looking "Pass the phone" screen is meant to hide the board between players, not an empty render.
- The "Open the web copy" link (:717) only opens when tapped and goes to Mot's own site. That is fine.
- The Google Fonts request being blocked, and the missing GPU and audio, come from the test machine.


---

# Pocket Shark break report
Code read only, tap test inconclusive on a GPU-less machine

## Breaks (a real person gets stuck or loses something)
None found in the code read. All five script blocks pass a syntax check, and the few taps that did run (menu, 8-Ball, Story mode, How to play, a player bio) logged no errors.

## Fix (real defect, not blocking)
1. The "about" page linked from inside the game shows em dashes in every changelog line (12 of them) and is out of date: it says "updated Oct 7, 2026" and lists v1.3 as current, while the game is v1.3.1 Oct 11.
   Where: pocketshark/about.html:101 (badge date) and about.html:163-174 (`&mdash;` in each line). Linked from index.html:3170.
   Fix: replace each `&mdash;` with a colon or a middle dot, add a v1.3.1 line, and set the badge to the real date of your next change.
2. The offline cache list is missing the four newer portraits: Charlie, Dontae, Yuki and Vince. Played offline before they have been seen once online, those four players show initials instead of faces.
   Where: pocketshark/sw.js:3-6 (`ASSETS`). The faces are loaded at index.html:1498 and 1505 for all ten players.
   Fix: add `'./face-charlie.jpg','./face-dontae.jpg','./face-yuki.jpg','./face-vince.jpg'` to the list, and bump the cache name with the version.

## Improve (polish or feel)
1. The version badge in the corner is 21px tall (116x21), under the 32px big-tap rule. It only shows a "loaded" toast, so this is minor.
   Where: index.html:414 (`#mbVer`).
   Fix: give `.mb-ver` some padding (`padding:6px 10px`) so it is at least 32px tall.
2. Version check: badge `v1.3.1 · Oct 11` (index.html:5 and 414) matches the cache name `pocketshark-v1.3.1` (sw.js:2). The repo copy here only has one commit (Oct 22), so I could not tell if the game changed after Oct 11 without a bump. If it did, bump to v1.3.2 with the real date and change the cache name to match.

## Not a problem
- Storage is guarded: every save and load goes through `store` with try/catch and an in-memory copy (index.html:1405-1409). The sessionStorage use in the stale-cache check (index.html:3568) sits inside a promise with a `.catch`, so a blocked storage just skips the check.
- Sound: the audio engine only starts on a tap or a game start (index.html:1694, called at 2339, 2385, 2964, 3074). Nothing plays on its own. The camera video tag is muted.
- No em dashes in the game page itself.
- No undefined references found; three.js is bundled inside the file, not loaded from a CDN.
- Slow taps (12 to 40 seconds) and screenshot timeouts are the GPU-less test machine, not the game.
- External hosts: fonts.googleapis.com and fonts.gstatic.com (Google Fonts) on both the game and the about page. The camera (Shark Eyes) stays on the phone; the service worker ignores anything not from your own site.


---

