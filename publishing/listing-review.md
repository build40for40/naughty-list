# Elf Cam listing correction — 4 November 2026

Chrome 0.0.2 was submitted with manual publication, then returned to Draft to correct the homepage and update the listing. Firefox remains unsubmitted at the publisher's request.

## Release 0.0.3

- Uses the committed Elf Cam extension, including its bundled VT323 font.
- Homepage for both packaged manifests: https://build40for40.com/naughty-list
- Firefox retains its stable Gecko ID and browsingActivity disclosure; desktop only, as tested for 0.0.2.
- Excludes unfinished community features in other working copies.

## Google great-listing audit

Reference: https://developer.chrome.com/docs/webstore/best-listing

| Element | Correction / acceptance criterion |
| --- | --- |
| Name | The Naughty List; concise, unique brand name |
| Summary | Describe reviewed company evidence; no promise of computed ethical ratings |
| Description | Explain Elf Cam intro, corner badge and expandable case file; list settings and source dates; state limited evidence coverage and unknown state |
| Screenshots | Replace old neutral-stamp images with real current Elf Cam badge, expanded case file and settings; 1280×800, full bleed, JPEG or RGB PNG |
| Promotional art | Use the latest Elf Cam 440×280 tile and 1400×560 marquee after visual review |
| Branding | Make promotional art and screenshots consistent; preserve the agreed festive extension icon unless the publisher changes that decision |
| Homepage | Product page, not repository; page deployed successfully and HTTP 200 checked |
| Support | help@build40for40.com; working support link |
| Truthfulness | No score or naughty/nice verdict claims before an agreed method and backend verdict; H&M currently has no B Corp evidence |

The launch-assets screenshot 1–3 files render actual code and live API data on a mock H&M page. They are references only and must not be uploaded as live captures. The original submitted Chrome screenshots were real captures of the older UI; Firefox has no screenshot uploads yet.

## Remaining gates

- Capture and inspect the installed 0.0.3 UI on a real shopping page.
- Upload 0.0.3 and current screenshots to Chrome; retain manual publication.
- Replace the Firefox package and listing materials without submitting it; the existing held wizard does not expose a separate homepage metadata field.
- Do not describe the Firefox held form as a submitted release.
