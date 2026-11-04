# Launch assets (drafts for review)

Made on 4 November 2026 for Superthread card 156 while Samira was at lunch. Everything here is a draft. Nothing has been uploaded, submitted or published.

This adds to Ben's `publishing/` prep on main and doesn't replace it. His icons and manifests are unchanged.

| File | What it is | Status |
| --- | --- | --- |
| `store/icon-elfcam-{16,32,48,128}.png` | Elf Cam icon (black tile, green viewfinder corners, lens, REC light). Source: `src/icon-elfcam.svg` | Swap into `extension/icons/` |
| `store/promo-small-440x280.png` | Chrome small promo tile | Ready to review |
| `store/marquee-1400x560.png` | Chrome marquee tile (optional) | Ready to review |
| `store/screenshot-5-title-card-1280x800.png` | Title-card screenshot. Upload it as the last screenshot, never the first | Ready to review |
| `store/screenshot-{1,2,3}-elfcam-…-1280x800.png` | **Lawrence's real Elf Cam code** (PR #6) on a mock H&M page at www2.hm.com: intro, corner badge, case file. Render with `src/elfcam/render-elfcam.sh <ref> store` | Labelled; recapture on the live site before upload |
| `copy.md` | Store listing, privacy tab answers, Firefox notes, privacy notice, publisher setup | Decisions applied (H&M only, help@build40for40.com); a few [brackets] left for the build |
| `site/download.html` | Download page draft for build40for40.com, standalone. Open it in a browser | Port to `site/src/pages/naughty-list.astro` once approved |
| `video/cards/` | Demo cards: opening hook and end card (1920×1080), YouTube thumbnail (1280×720), shorts hook and end card (1080×1920). Source: `src/demo-cards.html?k=…` | Ready to review |
| `video/captions-16x9.srt`, `video/captions-9x16.srt` | Burned-in captions for both cuts | Ready to review |
| `video/storyboard.md` | 40s demo shot list and voice-over, the shorts cut, and the real-screenshot list | Record once the overlay works |
| `src/` | Editable HTML/SVG sources and `render.sh` (headless Chrome to PNG) | |

**Look and voice (4 Nov, 16:00): Elf Cam**, Lawrence's North Pole CCTV parody (card 158, PR #6): black #0a0e0b, phosphor green #7dff9a, REC red #ff3b30, neutral grey for unknown, VT323. Replaces the earlier red/green festive look. 40 for 40 is only a small "made by" credit. See the pun bank in `copy.md`.

**Decisions (4 Nov):** ship with B Corp only (no waiting for scoring) · support email help@build40for40.com · festive icon · one brand, H&M, on hm.com · Ben owns the Chrome developer account, published as 40 for 40. **Blocker:** H&M isn't in `worker/companies.js` yet.

All copy follows the repo rule: today we only show **B Corp evidence with a source and date**, "not on our list" never means naughty, and naughty/nice verdicts wait for the scoring card (157).

Re-render after editing a source:

```sh
cd publishing/launch/src
./render.sh "$PWD/promo-small.html" "$PWD/../store/promo-small-440x280.png" 440 280
```
