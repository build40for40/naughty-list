# The Naughty List

Day 3 of 40 for 40, built live on Twitch on Wednesday 4 November 2026. The problem is "Hard to know which brands are ethical", from Santa. Work is tracked on the Superthread `day3` board.

- **Form factor:** a browser extension, for Chrome first and Firefox second.
- **First release scope:** one brand, H&M, on H&M's own shop (decided on card 156).

## Status (4 November 2026, afternoon)

- **`extension/`:** a Manifest V3 scaffold at version `0.0.1` with only a manifest and draft icons. It has no content scripts, permissions, UI or backend calls yet.
- **`worker/`:** the `naughty-list-api` Cloudflare Worker, deployed at https://naughty-list-api.40for40.workers.dev. It checks B Corp status against a hand-checked starter registry in `worker/companies.js` covering **Patagonia and Tony's Chocolonely only. There is no H&M entry yet.**
- **`publishing/`:** release preparation for both stores (card 152): Firefox manifest overlay, packaging script, privacy inventory, browser test matrix and update procedure. Nothing is ready to submit.
- **`launch-assets` branch (card 156, not merged):** festive store graphics, store copy with a pun bank, a download page draft and a demo storyboard, in `publishing/launch/`.

## Commands

- `npm ci`, then `npm run dev` (local Worker), `npm run check` (tests plus a Wrangler dry run) and `npm run deploy` (manual; CI never deploys).
- `npm run extension:package:chrome` / `npm run extension:package:firefox` build runtime-only ZIPs into `dist/` from an explicit allowlist. Update the allowlist in `scripts/package-extension.mjs` whenever the extension gains files.
- Always run Wrangler as `npm run wrangler -- <args>`. It uses the `40for40` auth profile and unsets `CLOUDFLARE_API_KEY` and `CLOUDFLARE_EMAIL`. On a new machine, create the profile with `env -u CLOUDFLARE_API_KEY -u CLOUDFLARE_EMAIL npx wrangler auth create 40for40`.
- CI runs `npm run check` and a `jq` check on `extension/manifest.json`.

## Superthread `day3` board

| Card | Title | State |
| --- | --- | --- |
| 150 | Define the 5 W's | Doing |
| 151 | Where are we on content progress? | To do |
| 152 | Publish extension: common steps | Doing |
| 153 | Publish Chrome extension | To do |
| 154 | Publish Firefox add-on | To do |
| 155 | Scoring Sources | To do |
| 156 | Launch kit: store assets + download page | Doing |
| 157 | Scoring Algorithm and Criteria | To do |
| 158 | Extension UI and design (Lawrence) | Doing |

## Locked decisions: four Ws

- **Who:** Santa.
- **Why:** Don't choose evil.
- **Where:** a browser extension that overlays helpful information about a brand or product.
- **When:** Black Friday and Christmas shopping.

## Launch decisions (card 156, 4 November)

- **Scope:** one brand, H&M, on H&M's own shop. This replaces the earlier idea of seller lookup on marketplaces such as Amazon or Argos for the first release.
- **What the overlay shows today:** whether H&M is a Certified B Corp, with the source (B Lab directory) and the check date. Nothing else, and never a naughty/nice verdict.
- **Support email:** help@build40for40.com. The `publishing/` docs on `main` still say `hello@40for40.app` and need updating.
- **Look:** a Christmas identity of its own: Santa red, pine green, snow, gold and candy-cane stripes, with playful puns. 40 for 40 appears only as a small "made by" credit. The festive icon on `launch-assets` replaces the draft icons in `extension/icons/`.
- **Chrome Web Store:** Ben owns the developer account (fee paid), publishing as 40 for 40 Ltd.
- **Firefox add-on ID:** `{c2591c57-0224-4d4a-bdb4-a3223e58c354}` in `publishing/manifest.firefox.json`. Never change it; updates depend on it.

## Design rule: badge or split (card 158, 4 November)

- **Single-brand shops (e.g. H&M): a brand badge.** All products share one company's evidence, so a Nice/Naughty split would put the whole shop in one group.
- **Multi-brand shops (e.g. John Lewis, Argos, Amazon): group products into Nice, Naughty and Unknown.** Later, after the H&M release. Show the shop's record as a badge and group products by their own brand; never let the shop's record apply to other brands it sells. Own-label products take the shop's record. If a tile's brand can't be read reliably, it goes in Unknown. Unknown must look neutral.
- **Rearranging the page:** reorder or label the shop's own tiles and buttons; never copy tiles or rebuild buttons, so the basket, quantities and Buy now keep working. Never click for the shopper, and never hide or cover purchase controls.
- How much a single action (such as one donation) counts is a scoring question for card 157, not a design one.

## Open before launch

- **H&M registry entry:** hand-check H&M against the B Lab directory, then add it to `worker/companies.js` with a source, check date and explicit mappings for every H&M hostname the extension runs on. Until then every H&M page shows unknown. Copy, screenshots and video must not state H&M's status before the registry entry exists.
- **Local check or API:** either the extension carries H&M's record itself (recommended: nothing leaves the browser) or it calls the Worker. Ben's call. It decides the privacy notice (version B or A in `copy.md`), the Chrome privacy tab and the Firefox data-collection declaration.
- **Build the overlay**, then capture real screenshots and the demo recording. The H&M overlay mock is labelled NOT FOR STORE and must never be uploaded.
- **Publisher setup:** EU trader declaration with company details, ideally a Google Group publisher, verify build40for40.com and choose a licence (MIT if the repo is public).

## Backend rules

- `POST /v1/assessments` accepts exactly one domain hostname, brand name or typed identifier (`b_lab` directory slug or nine-digit DUNS string). Identifier support does not imply an external DUNS resolution service; only verified registry mappings resolve.
- Domain lookup uses exact reviewed hostname mappings with source/check dates. Case and a trailing DNS dot are normalised; subdomains and regional domains require explicit mappings. A marketplace domain identifies the marketplace, not a product brand or selected seller. No seller extraction or automatic domain research is implemented.
- Return B Corp certification evidence, provenance and check/refresh dates. Do not equate B Corp certification with a product-level ethical judgment.
- Unmatched, ambiguous and stale records are unknown, never automatically uncertified or naughty. `validUntil` is our evidence refresh deadline, not the certificate's expiry; never extend it without rechecking the source.
- Never invent identifiers, DUNS numbers or ownership links. Record the source for every company and domain mapping.
- The Worker is separate from the site's Worker and does not touch its D1 database. It has no API key, database or paid external service.

## Data sources (card 155)

- **B Lab directory** is the only source in use, checked by hand. There is no supported public B Lab API, and its data.world dataset was retired on 13 July 2026.
- **Shortlist for later, subject to access and display licensing:** Good On You (brand ratings) and Provenance (specific claims). EcoVadis is a negotiated commercial fallback.
- **Excluded for now:** Ethical Consumer, ClimateChoice, KindBuys, Climatiq, HowGood and TrusTrace.

## Scoring (card 157)

Keep the overall score and naughty/nice verdict unset until card 157 agrees a method. No scoring criteria, weights or thresholds are agreed. Missing certification or missing records must never mean naughty or nice. Evidence about a seller or brand must not silently become a claim about an individual product.

## The problem

Christmas and Black Friday are the busiest shopping weeks of the year, and every brand's ads look lovely. What the ads don't say is how that brand treated its staff, its local communities and the environment all year. Nobody has time to research every company behind every gift on their list, so people buy blind.

The Naughty List tells shoppers which brands have been naughty or nice, so they know who to buy from.

- **MVP:** knowing who's been naughty or nice this year.
- **The dream:** a list that stays up to date all year round.

## What we know

- A brand is judged on three things: how it treats its staff, its communities and the environment.
- The tone is festive and playful: Santa's list, naughty or nice, not a compliance report. Puns never change the facts.
- Distribution is through the Chrome Web Store and Firefox Add-ons, with a download page drafted for the 40 for 40 site.

## Still open after the first release

- **What a verdict looks like:** a simple naughty or nice, a score, or the reasons behind it (card 157).
- **More brands and shops:** the Nice/Naughty/Unknown split for multi-brand shops is the agreed design direction (card 158). Marketplace seller lookup, a precached list and automatic research for unknown sellers were proposed but not agreed.
- **Where the data comes from** beyond B Corp evidence (card 155).

## The problem as submitted

> Around this time every single year, The world starts spreading Christmas cheer. We start thinking about gifts that will bring out the "Yay", And the timing is even better, it's almost Black Friday.
> Their billboards all twinkle, their TV ads all glow, But who's been naughty or nice? We don't really know. Who treated their staff and local community with care? Who polluted the rivers, the land, and the air?
>
> Christmas is the busiest shopping period of the year, but it's hard to know which brands have actually been good all year. Nobody has time to research every company behind the toys and gifts on their list. The Naughty List tracks how brands treat their staff, communities and the environment, so we know who to buy from.
>
> The MVP is knowing who's been naughty or nice this year. The dream is a list that stays up to date all year round.
