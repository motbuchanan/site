# Measure Up, Public Edition - ROADMAP (lives in the site repo at measureup/ROADMAP.md)

Updated with every upload. Claude reads this back from the repo before working, to check what was actually uploaded.
Live URL: https://motbuchanan.com/measureup/

## What this is
A learning town where friendly neighbors help kids count, read and explore. Forked on Nov 4 2026 from the family version of Measure Up (v1.67) and redesigned for a first-time player, including a 5-year-old who can't read yet and plays alone. It is a separate game: its own save (mupub_save_v1), its own offline cache (mupub-*). The family version is not changed by anything here.

## Current
- **v2.2 · Nov 4 2026** (sw cache `mupub-v2-2`). Phase 2 of the public plan: the new opening.
- Files in this folder: `index.html`, `voice.js`, `voice2.js`, `sw.js`, `manifest.json`, `apple-touch-icon.png`, `icon-192.png`, `icon-512.png`, `ROADMAP.md`.

## What shipped
- **v2.2 (Nov 4).** A new way in, built for a child who can't read and plays alone. Elly says hi, the child taps one of three buddies and one of three spoken names, they walk to Elly's Schoolhouse together, and the child counts apples with Elly for a first star (about 20 to 60 seconds after Play). A wrong answer never buzzes: Elly counts together and the right number glows. The child lands in Elly's Schoolhouse, where Count with Elly can be played again; the town is one small button away. One thing glows at a time and every step is spoken. The old band intro, music quiz and news cards are skipped for new players. Saves from before v2.2 open the town as before.
- **v2.1 (Nov 4).** Elly reads the game out loud. Every card (lessons, game instructions, news, guides) reads its intro line when it opens, never its buttons or the tappable rows under it, with a big speaker button to hear it again. Quiz questions and each game's instruction line are read too. Recorded lines use Elly's voice (made with the Kokoro voice model); anything not recorded yet uses the iPad's own voice, never both in one line. All 1,014 lines are recorded: the first-hour lines in voice.js (2.7 MB) and the rest in voice2.js (15.5 MB, loaded a moment later and saved for offline in the background, so it never holds up the install). Fast tapping can't skip a card. The 49 Phonicademy letter sounds are built in for the starter level. Grown-ups can turn reading aloud off in the Grown-Ups corner.
- **v2.0 (Nov 4).** The same game as the family version, moved here and cleaned for the public: no family names, no family real-candy deal, no link back to the family shelf, a friendlier error box, its own save and offline cache. Installable from Safari (Share, then Add to Home Screen) and plays offline.

## Next (each is its own gate)
- v2.3 The starter level below level 1: counting, more or less, numbers, shapes, colors, letter names and sounds, rhymes, first words.
- v2.4 The town opens one building at a time.
- v2.5 The website tile and card.

## Credits
- Phonics sounds: Phonicademy (phonicademy.com), built in under the Phonicademy Audio License v2.0.
- Elly's voice: generated with Kokoro (Apache-2.0).
