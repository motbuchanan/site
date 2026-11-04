# Measure Up, Public Edition - ROADMAP (lives in the site repo at measureup/ROADMAP.md)

Updated with every upload. Claude reads this back from the repo before working, to check what was actually uploaded.
Live URL: https://motbuchanan.com/measureup/

## What this is
A learning town where friendly neighbors help kids count, read and explore. Forked on Nov 4 2026 from the family version of Measure Up (v1.67) and redesigned for a first-time player, including a 5-year-old who can't read yet and plays alone. It is a separate game: its own save (mupub_save_v1), its own offline cache (mupub-*). The family version is not changed by anything here.

## Current
- **v2.1 · Nov 4 2026** (sw cache `mupub-v2-1`). Phase 1 of the public plan: Elly's voice.
- Files in this folder: `index.html`, `voice.js`, `voice2.js`, `sw.js`, `manifest.json`, `apple-touch-icon.png`, `icon-192.png`, `icon-512.png`, `ROADMAP.md`.

## What shipped
- **v2.1 (Nov 4).** Elly reads the game out loud. Every card (lessons, game instructions, news, guides) is read when it opens, with a big speaker button to hear it again. Quiz questions and each game's instruction line are read too. Recorded lines use Elly's voice (made with the Kokoro voice model); anything not recorded yet uses the iPad's own voice, never both in one line. Every line a new player meets in the first hour is recorded (196 lines); about 76 more are recorded so far and the rest follow in later uploads. Fast tapping can't skip a card. The 49 Phonicademy letter sounds are built in for the starter level. Grown-ups can turn reading aloud off in the Grown-Ups corner.
- **v2.0 (Nov 4).** The same game as the family version, moved here and cleaned for the public: no family names, no family real-candy deal, no link back to the family shelf, a friendlier error box, its own save and offline cache. Installable from Safari (Share, then Add to Home Screen) and plays offline.

## Next (each is its own gate)
- v2.2 A new opening: no reading, one glowing target, a first win in under 30 seconds.
- v2.3 The starter level below level 1: counting, more or less, numbers, shapes, colors, letter names and sounds, rhymes, first words.
- v2.4 The town opens one building at a time.
- v2.5 The website tile and card.

## Credits
- Phonics sounds: Phonicademy (phonicademy.com), built in under the Phonicademy Audio License v2.0.
- Elly's voice: generated with Kokoro (Apache-2.0).
