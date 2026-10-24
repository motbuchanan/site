# fonts/

The site's shared font folder. Started Oct 24 2026.

## The rule
Every app on motbuchanan.com loads its fonts from this folder. Nothing loads fonts from Google Fonts or any other outside server, so the site's promise holds: nothing leaves your device.

- A new build headed for the site links `fonts/fonts.css` (or `../fonts/fonts.css` from inside a subfolder) instead of any Google Fonts link.
- A project can still use a new font. Pick or make it, then add it here first: the .woff2 file in this folder, an @font-face block in fonts.css, and a line in the table below. Then the app links fonts.css like everything else.
- Use the family's own name in @font-face (for example 'Archivo', not 'Archivo Variable') so app CSS stays the same.
- Only fonts whose license allows hosting on a website go in here (SIL Open Font License or similar). Add the font's copyright line to OFL.txt.
- Apps with a service worker: add `../fonts/fonts.css` and the .woff2 files they use to the offline list so fonts work offline.

## What's here
| Family | File(s) | Weights | Used by |
|---|---|---|---|
| Archivo | archivo.woff2 | 100-900 (variable) | the site and most apps |
| JetBrains Mono | jetbrains-mono.woff2 | 100-800 (variable) | the site and most apps |
| Space Grotesk | space-grotesk.woff2 | 300-700 (variable) | Production Triangle |
| Space Mono | space-mono-400.woff2, space-mono-700.woff2 | 400, 700 | Production Triangle |
| Playfair Display | playfair-display.woff2, playfair-display-italic.woff2 | 400-900 (variable), normal and italic | The Brew Deck |
| DM Sans | dm-sans.woff2 | 100-1000 (variable) | The Brew Deck |
| DM Mono | dm-mono-400.woff2, dm-mono-500.woff2 | 400, 500 | The Brew Deck |

Latin character set only (English and Western European). Characters outside it fall back to the phone's own fonts.

Source: Fontsource packages (v5.3.0) of the same Google Fonts families, all SIL Open Font License 1.1. See OFL.txt.
