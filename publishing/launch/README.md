# Launch assets (drafts for review)

Made on 4 November 2026 for Superthread card 156 while Samira was at lunch. Everything here is a draft. Nothing has been uploaded, submitted or published.

This adds to Ben's `publishing/` prep on main and doesn't replace it. His icons and manifests are unchanged.

| File | What it is | Status |
| --- | --- | --- |
| `store/icon-branded-{16,32,48,128}.png` | 40(40)-branded icon **option** (navy tile, list, lime tick, yellow star). Source: `src/icon-branded.svg` | Compare with Ben's red icon on main; pick one |
| `store/promo-small-440x280.png` | Chrome small promo tile | Ready to review |
| `store/marquee-1400x560.png` | Chrome marquee tile (optional) | Ready to review |
| `store/screenshot-5-title-card-1280x800.png` | Title-card screenshot. Upload it as the last screenshot, never the first | Ready to review |
| `store/concept-mock-overlay-NOT-FOR-STORE.png` | How the overlay could look, built from the real registry data (Tony's Chocolonely, B Corp, checked 4 Nov). **Design target for Ben. Never upload it.** | For discussion |
| `copy.md` | Store listing, privacy tab answers, Firefox notes, privacy notice (two versions), open decisions | Needs the [brackets] filled |
| `site/download.html` | Download page draft for build40for40.com, standalone. Open it in a browser | Port to `site/src/pages/naughty-list.astro` once approved |
| `video/storyboard.md` | 40s demo shot list and voice-over, the shorts cut, and the real-screenshot list | Record once the overlay works |
| `src/` | Editable HTML/SVG sources and `render.sh` (headless Chrome to PNG) | |

All copy follows the repo rule: today we only show **B Corp evidence with a source and date**, "not on our list" never means naughty, and naughty/nice verdicts wait for the scoring card (157).

Re-render after editing a source:

```sh
cd publishing/launch/src
./render.sh "$PWD/promo-small.html" "$PWD/../store/promo-small-440x280.png" 440 280
```
