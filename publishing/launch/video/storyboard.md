# Demo video storyboard (draft)

About 40 seconds. Record once in OBS at 1920×1080 on a clean Chrome profile. Use that cut for the download page and YouTube (unlisted, for the Chrome store's promo video link). Then cut a 9:16 version for shorts with burned-in captions.

Show only what the extension does on camera. Today that means B Corp status, the source and the date. Don't say or show "naughty" or "nice" verdicts until the scoring card (157) is agreed.

| Time | On screen | Voice-over / caption |
| --- | --- | --- |
| 0–4s | A shop homepage full of Christmas gift ads | "Every brand looks lovely at Christmas." |
| 4–9s | Open an H&M product page (a Christmas jumper works) | "But who's been naughty or nice?" |
| 9–17s | The Naughty List badge appears beside the product: H&M, "Certified B Corp? Not listed" | "The Naughty List checks the company behind the gift. H&M isn't a Certified B Corp." |
| 17–24s | Hover or point at the source and date | "Here's where that came from, and when we checked. One fact, not a verdict: full naughty-or-nice ratings are on the way." |
| 24–31s | A second H&M product, same result | "It works on every H&M product page. More shops are coming." |
| 31–36s | Quick cut of the team on stream (Twitch VOD) | "We built it live, in one day." |
| 36–42s | End card: `store/screenshot-5-title-card-1280x800.png`, plus the download link | "The Naughty List. Free for Chrome and Firefox. Day 3 of 40 for 40." |

## Brand to film

H&M, on H&M's own shop. Ben's assessment returns **not a Certified B Corp** (B Lab directory, checked 4 Nov 2026) once branch `hm-registry` is merged. Say it exactly like that, with the source and date on screen. Don't call it naughty, H&M gets the brand badge (card 158); the Nice / Naughty split is for multi-brand shops later.

## Shorts cut (9:16)

- Open on the overlay appearing (the 9–17s beat), then the hook line as a caption: "Who's been naughty or nice?"
- Keep it under 30 seconds, captions burned in, end on the 40(40) logo with the download link.
- Inputs and outputs go in the content cloud: `Day 03/Inputs` and `Day 03/Outputs`, named `Day03_short_v1.mp4` (same scheme as the intern brief).

## Screenshots (from the same session)

Once the overlay works, set Chrome DevTools device mode to 1280×800, then use ⋮ → Capture screenshot:

1. The overlay on a product page (lead screenshot)
2. The source and date visible
3. A second H&M product page, or the overlay closed/collapsed
4. The toolbar popup, if there is one
5. Title card: already made, `store/screenshot-5-title-card-1280x800.png`

`store/screenshot-1-overlay-CONCEPT-…png` and `screenshot-2-sources-CONCEPT-…png` show the current target: the H&M brand badge from card 158 (Lawrence is building the real one). They're renders and must not be uploaded; recapture from the real extension in the same framing.
