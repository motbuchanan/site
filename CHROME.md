# motbuchanan.com shared chrome (Sep 21 2026)

Every app on the site keeps its own CONTENT world (board colors, felt, space, paper, hazard stripes). What is identical everywhere is the CHROME: type, home button, version badge, primary/secondary buttons, tab pills, section labels. A visitor should feel one maker across all apps.

## Tokens (paste into each app's :root; do NOT rename existing app vars, add these)
```
--mb-ink:#ebedef; --mb-soft:#c2c9d1; --mb-dim:#7d8794;
--mb-teal:#4cf0e0; --mb-orange:#f59847;
--mb-glass:rgba(14,18,23,.62); --mb-line:rgba(255,255,255,.12);
--mb-ui:'Archivo',system-ui,-apple-system,sans-serif;
--mb-mono:'JetBrains Mono',ui-monospace,Menlo,monospace;
```
Font link (add to <head> if missing):
```
<link rel="preconnect" href="https://fonts.googleapis.com"><link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Archivo:wght@500;700;800&family=JetBrains+Mono:wght@400;600;700&display=swap" rel="stylesheet">
```

## Rules
1. TYPE: body/UI text = var(--mb-ui). App title = Archivo 800, letter-spacing -.02em. Small labels, eyebrows, stats, badges = var(--mb-mono) uppercase 10-11px letter-spacing .08em. Replace system-ui / -apple-system / Segoe font stacks. Keep any font that is part of the content world (e.g. The Keep's monospace WORLD render, Triangle's mono readouts) but chrome text still switches.
2. HOME BUTTON (only in apps that draw their own, the data-selfback ones): the shell's exact style.
   `.mb-home{display:inline-flex;align-items:center;gap:6px;background:transparent;color:var(--mb-teal);border:1px solid rgba(76,240,224,.4);border-radius:8px;font:700 12px var(--mb-mono);padding:7px 13px;text-decoration:none;cursor:pointer}` text: `&larr; home` (lowercase, arrow, no house glyph).
3. VERSION BADGE (every app, no exceptions): fixed bottom-right pill, tappable, toasts "vX.Y loaded".
   `.mb-ver{position:fixed;right:10px;bottom:calc(10px + env(safe-area-inset-bottom));z-index:900;font:600 10px var(--mb-mono);letter-spacing:.04em;color:var(--mb-teal);background:var(--mb-glass);border:1px solid rgba(76,240,224,.25);border-radius:999px;padding:4px 9px;backdrop-filter:blur(8px);cursor:pointer;user-select:none;opacity:.85}`
   Markup: `<button class="mb-ver" id="mbVer" type="button">v1.1 &middot; Sep 21</button>` + `document.getElementById('mbVer').onclick=function(){/* toast */}` using the app's own toast if it has one, else a tiny inline one. Existing badges (any style) get REPLACED by this, keep the app's number, bump patch (v0.7 -> v0.7.1, v1.0 -> v1.1, v3.0.2 -> v3.0.3), date Sep 21. If the badge would collide with a bottom toolbar, move it above the toolbar (bottom offset), never delete it.
4. BUTTONS: primary = `background:var(--mb-teal);color:#06110f;font:800 15px var(--mb-ui);border:0;border-radius:13px;padding:13px 18px` ; secondary/ghost = `background:var(--mb-glass);color:var(--mb-ink);border:1px solid var(--mb-line);border-radius:13px;font:700 14px var(--mb-ui);padding:11px 16px`. Destructive/warning may use orange. Apply to menu/overlay/start buttons and dialog buttons. In-game controls that are part of the board (number pad, keyboard keys, piano keys, chips) keep their own look.
5. TAB PILLS / MODE TOGGLES: pill group, selected = teal fill dark text, others = ghost. Font 700 13px var(--mb-ui).
6. CARDS/PANELS (menus, overlays, rules sheets): radius 16px, background rgba(16,21,28,.92) or the app's dark panel, 1px var(--mb-line), no colored left accent bars.
7. GROUND: keep the app's ground. Cream/warm-light grounds are banned as CHROME (Nazca's paper is content). Knight School and Sudoku's cream BOARDS stay; their brown chrome panels and gold buttons become the shared chrome.
8. NO em dashes anywhere. No curly quotes in code or copy. No emoji as icons in chrome.
9. Nothing else changes: no gameplay, no copy rewrites, no layout restructures beyond what the chrome swap needs. Keep every id and function name; the site index and other pages may reference them.

## Validation gate per file
node --check on every inline <script> (extract, check), 0 em dashes, 0 `{{`, headless Playwright screenshot at 390x844 (mobile, touch) of the menu AND of one in-play state, badge visible in the shot, and a real coordinate tap on the primary button proving it still starts the app. Save shots to /home/claude/site/_chk/<app>-1.jpg and -2.jpg (jpeg q80).
