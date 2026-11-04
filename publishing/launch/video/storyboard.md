# Demo video: script and shot list

Final draft, 4 Nov 15:45. About 42 seconds. It shows only what version 1 does: Lawrence's **Elf Cam** badge (card 158, PR #6). The page goes "on camera" for a few seconds, shrinks to a corner badge, and the badge opens a case file. On H&M today it reads **"Subject unidentified · No verdict"** with the B Lab source and check date (see the wording flag in copy.md). Never say or show a naughty/nice verdict.

**Record:** OBS, 1920×1080, 30fps, on a clean Chrome profile with only The Naughty List installed. Use the 16:9 cut for the download page and for YouTube (unlisted, as the Chrome store promo video). Then cut a 9:16 version for shorts.

**Needs before filming:** Ben merges `hm-registry` (fixed so his new evidence store accepts it), Lawrence's Elf Cam (PR #6) is merged with H&M added to the manifest matches and `storeType: 'single_brand'`, and the Worker is redeployed and D1 reseeded.

## 16:9 cut (≈42s)

| # | Time | On screen | Voice-over | Burned-in caption |
| --- | --- | --- | --- | --- |
| 1 | 0–4s | `cards/hook-1920x1080.png` for 1s, then the H&M homepage full of Christmas gifts, scrolling slowly | "Every brand's ads are merry and bright at Christmas." | Every brand looks merry and bright at Christmas… |
| 2 | 4–9s | Click into a Christmas jumper. **Elf Cam goes live:** viewfinder corners, REC light, timestamp, the evidence panel at the top | "But who's been naughty or nice? Elf Cam is rolling." | Elf Cam is rolling 🔴 |
| 3 | 9–15s | Hold on the panel: "SUBJECT: H&M (BRAND) · SUBJECT UNIDENTIFIED" | "Elf Cam checks the company behind the gift. For H&M: no verdict yet." | H&M: no verdict yet |
| 4 | 15–19s | Scroll: the intro collapses into the corner badge, "UNIDENTIFIED · NO VERDICT" | "Then it gets out of your way." | Then it shrinks to a badge |
| 5 | 19–28s | Click the badge. The case file opens: subject, evidence, verdict pending, source, check date, scope | "Open the case file for the evidence, the source and the date. Santa hasn't agreed his rules yet, so no naughty or nice." | Source: B Lab · checked 4 Nov 2026 |
| 6 | 28–34s | Twitch VOD: the team building it on stream, 2–3 quick cuts | "We built it live, in one day." | Built live on Twitch, in one day |
| 7 | 34–40s | `cards/end-1920x1080.png` | "The Naughty List. The brands are on camera. Not you." | (on the card) |

Captions: `captions-16x9.srt`.

**Music:** something light and jingly, ducked under the voice. Use royalty-free or YouTube Audio Library only, not a commercial Christmas song.

## 9:16 shorts cut (≈25s)

| # | Time | On screen | Caption |
| --- | --- | --- | --- |
| 1 | 0–2s | `cards/shorts-hook-1080x1920.png` | Who's been naughty or nice? |
| 2 | 2–8s | Screen recording, cropped: Elf Cam going live on the jumper page | Elf Cam is rolling 🔴 |
| 3 | 8–13s | The panel: "SUBJECT UNIDENTIFIED" | H&M: no verdict yet |
| 4 | 13–20s | The case file open | Evidence, source + date. Verdicts wait for Santa's rules. |
| 5 | 20–25s | `cards/shorts-end-1080x1920.png` | Free for Chrome & Firefox · link in bio |

Captions: `captions-9x16.srt`. File naming follows the content-cloud scheme: inputs in `Day 03/Inputs`, outputs in `Day 03/Outputs` as `Day03_demo_16x9_v1.mp4` and `Day03_short_v1.mp4`.

## YouTube upload

- **File:** the 16:9 cut · **Visibility:** Unlisted · **Thumbnail:** `cards/youtube-thumb-1280x720.png`
- **Title:** The Naughty List: H&M on Elf Cam (demo)
- **Description:** The Naughty List is a free Chrome and Firefox extension that checks the company behind the gift. Version 1 puts H&M's online shop on Elf Cam: it shows the evidence our elves have on the company behind the gift, with the source and the date we checked. No naughty-or-nice verdicts until Santa's rules are agreed. Built live in one day on Twitch by 40 for 40. Download: build40for40.com/naughty-list · Questions: help@build40for40.com
- Paste the video link into the Chrome dashboard → Store listing → Promo video.

## Store screenshots (from the same session)

Once the badge works, set Chrome DevTools device mode to 1280×800, then use ⋮ → Capture screenshot:

1. Elf Cam going live on a product page (lead screenshot), framed like `store/screenshot-1-elfcam-intro-…png`
2. The corner badge, framed like `store/screenshot-2-elfcam-badge-…png`
3. The case file open, framed like `store/screenshot-3-elfcam-file-…png`
4. Optional: a second H&M product page
5. Title card: already made, `store/screenshot-5-title-card-1280x800.png`

Screenshots 1–3 in `store/` are Lawrence's real Elf Cam code rendered on a mock H&M page (`src/elfcam/render-elfcam.sh`). They're labelled and must be recaptured on www2.hm.com before upload.

## Never say

- "H&M is naughty", or anything that puts H&M on the naughty side
- "Elf Cam is watching you": it watches brands, not shoppers
- "ethical rating", "score" or "verdict" (none exist yet)
- Anything about a specific product: B Corp status is about the company
