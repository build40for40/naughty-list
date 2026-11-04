# Demo video storyboard (draft)

About 40 seconds. Record once in OBS at 1920×1080 on a clean Chrome profile. Use that cut for the download page and YouTube (unlisted, for the Chrome store's promo video link). Then cut a 9:16 version for shorts with burned-in captions.

Show only what the extension does on camera. Today that means B Corp status, the source and the date. Don't say or show "naughty" or "nice" verdicts until the scoring card (157) is agreed.

| Time | On screen | Voice-over / caption |
| --- | --- | --- |
| 0–4s | A shop homepage full of Christmas gift ads | "Every brand looks lovely at Christmas." |
| 4–9s | Open a product page for a brand on our list, e.g. Tony's Chocolonely | "But who's been naughty or nice?" |
| 9–17s | The Naughty List overlay appears: brand name, "Certified B Corp" | "The Naughty List checks the company behind the gift." |
| 17–24s | Hover or point at the source and date | "Here's where that came from, and when we checked." |
| 24–31s | A brand that isn't on the list yet: the overlay says "not on our list yet" | "If we haven't checked a brand, we say so. That's not the same as naughty." |
| 31–36s | Quick cut of the team on stream (Twitch VOD) | "We built it live, in one day." |
| 36–42s | End card: `store/screenshot-5-title-card-1280x800.png`, plus the download link | "The Naughty List. Free for Chrome and Firefox. Day 3 of 40 for 40." |

## Which brands to film

The registry in `worker/companies.js` has two brands checked by hand: **Patagonia** and **Tony's Chocolonely**, both certified, with dates. Film those. For the "not on our list" shot, use a brand that simply isn't in the registry and say only that. Don't imply anything about that brand.

## Shorts cut (9:16)

- Open on the overlay appearing (the 9–17s beat), then the hook line as a caption: "Who's been naughty or nice?"
- Keep it under 30 seconds, captions burned in, end on the 40(40) logo with the download link.
- Inputs and outputs go in the content cloud: `Day 03/Inputs` and `Day 03/Outputs`, named `Day03_short_v1.mp4` (same scheme as the intern brief).

## Screenshots (from the same session)

Once the overlay works, set Chrome DevTools device mode to 1280×800, then use ⋮ → Capture screenshot:

1. The overlay on a product page (lead screenshot)
2. The source and date visible
3. The "not on our list yet" state
4. The toolbar popup, if there is one
5. Title card: already made, `store/screenshot-5-title-card-1280x800.png`

`store/concept-mock-overlay-NOT-FOR-STORE.png` shows the target look for shot 1. It is a mock and must not be uploaded as a screenshot.
