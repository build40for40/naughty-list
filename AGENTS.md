# The Naughty List

Day 3 of 40 for 40, built live on Twitch on Wednesday 4 November 2026. The problem is "Hard to know which brands are ethical", from Santa. Work is tracked on the Superthread `day3` board.

- **Form factor:** a browser extension, for Chrome first and Firefox second.
- **MVP (v1):** a single-brand shop, starting with H&M on its own shop, with a Naughty or Nice stamp for the brand.
- **Reach goal (v2):** multi-brand shops such as John Lewis, sorting the brands on the page into Naughty and Nice lists.

## Status (4 November 2026, afternoon)

- **`extension/`:** Manifest V3, version `0.0.1`. Elf Cam badge mode runs on the reviewed single-brand shops (Patagonia and Tony's Chocolonely; no H&M entry yet). See "Extension: Elf Cam badge mode" below.
- **`worker/`:** the `naughty-list-api` Cloudflare Worker, deployed at https://naughty-list-api.40for40.workers.dev. It reads reviewed evidence from its dedicated `naughty-list` D1 database: 20 reviewed entities and 22 records from six sources (B Lab, UK minimum-wage naming, CMA, HSE, US EPA and Wikirate). Selected records refresh daily at 05:17 UTC. **There is no H&M entry yet.**
- **`publishing/`:** release preparation for both stores (card 152): Firefox manifest overlay, packaging script, privacy inventory, browser test matrix and update procedure. Nothing is ready to submit.
- **`launch-assets` branch (card 156, not merged):** festive store graphics, store copy with a pun bank, a download page draft and a demo storyboard, in `publishing/launch/`.
- **Backend detail:** `docs/evidence.md` (operating guide) and `docs/implementation-status.md` (what is deployed and verified).

## Commands

- Node.js 22.13 or later. `npm ci`, then initialise the local database: `npm run wrangler -- d1 migrations apply naughty-list --local`, `npm run evidence -- seed`, `npm run evidence -- import us-epa data/epa-reviewed.json` and `npm run evidence -- sync`.
- `npm run dev` (local Worker), `npm run check` (tests plus a Wrangler dry run) and `npm run deploy` (manual; CI never deploys). Remote migrations, seeding and imports come before deploying; see `docs/evidence.md`.
- `npm run extension:package:chrome` / `npm run extension:package:firefox` build runtime-only ZIPs into `dist/` from an explicit allowlist. Update the allowlist in `scripts/package-extension.mjs` whenever the extension gains files.
- Always run Wrangler as `npm run wrangler -- <args>`. It uses the `40for40` auth profile and unsets `CLOUDFLARE_API_KEY` and `CLOUDFLARE_EMAIL`. On a new machine, create the profile with `env -u CLOUDFLARE_API_KEY -u CLOUDFLARE_EMAIL npx wrangler auth create 40for40`.
- Wikirate credentials live in the ignored `.dev.vars` locally and in Cloudflare secrets in production. Never commit them or paste them into chat.
- CI runs `npm run check` and a `jq` check on `extension/manifest.json`.

## Superthread `day3` board

| Card | Title | State |
| --- | --- | --- |
| 150 | Define the 5 W's | Done |
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

## Locked decisions: the what (4 November)

- **MVP (v1): single-brand shops get a Naughty or Nice stamp.** Every product on a single-brand shop comes from the same company, so the shop gets one stamp for its brand, not a sorted list. The first shop is H&M.
- **Reach goal (v2): multi-brand shops get Naughty and Nice lists.** On a shop such as John Lewis, the extension sorts the brands on the page into a Naughty list and a Nice list.
- **The stamp needs a method.** Which brands are naughty or nice is decided by card 157's scoring method. Until that's agreed, the backend keeps the verdict unset and the stamp must not show one. Today's evidence (such as B Corp status) can explain a verdict but doesn't produce one by itself.
- **Unknown stays unknown.** A brand with too little evidence gets neither stamp and goes in neither list. It must never be shown as naughty.

## Launch decisions (card 156, 4 November)

- **Scope:** one brand, H&M, on H&M's own shop. This replaces the earlier idea of seller lookup on marketplaces such as Amazon or Argos for the first release.
- **What the overlay shows today:** whether H&M is a Certified B Corp, with the source (B Lab directory) and the check date. The Naughty or Nice stamp only appears once card 157's method is agreed and the backend returns a verdict. The card 156 store copy, which promises B Corp evidence only, needs rewriting when that happens.
- **Support email:** help@build40for40.com. The `publishing/` docs on `main` still say `hello@40for40.app` and need updating.
- **Look:** a Christmas identity of its own: Santa red, pine green, snow, gold and candy-cane stripes, with playful puns. 40 for 40 appears only as a small "made by" credit. The festive icon on `launch-assets` replaces the draft icons in `extension/icons/`.
- **Chrome Web Store:** Ben owns the developer account (fee paid), publishing as 40 for 40 Ltd.
- **Firefox add-on ID:** `{c2591c57-0224-4d4a-bdb4-a3223e58c354}` in `publishing/manifest.firefox.json`. Never change it; updates depend on it.

## Design rule: stamp or lists (card 158, 4 November)

- **v1, single-brand shops (e.g. H&M): a Naughty or Nice stamp.** All products share one company's evidence, so a Nice/Naughty split would put the whole shop in one group.
- **v2, multi-brand shops (e.g. John Lewis, Argos, Amazon): Naughty and Nice lists, plus Unknown.** Show the shop's record as a badge and group products by their own brand; never let the shop's record apply to other brands it sells. Own-label products take the shop's record. If a tile's brand can't be read reliably, it goes in Unknown. Unknown must look neutral.
- **Rearranging the page:** reorder or label the shop's own tiles and buttons; never copy tiles or rebuild buttons, so the basket, quantities and Buy now keep working. Never click for the shopper, and never hide or cover purchase controls.
- How much a single action (such as one donation) counts is a scoring question for card 157, not a design one.

## Extension: Elf Cam badge mode (card 158)

- **Visual direction:** Elf Cam, a North Pole CCTV parody chosen by Lawrence. Jokes target brands, never shoppers. Design reference: https://claude.ai/artifact/2wxJoMkbyGVb71Af4eRZ1d. It differs from the launch look above (Santa red, pine green, snow, gold); reconcile the two before store assets are final.
- **The store decides the mode.** Single-brand shops get **badge mode** (the v1 stamp); multi-brand shops will get **sorting mode** (v2 lists, designed as Cleared and Flagged for Coal feeds, not built). Reviewed domains record `storeType` in `domainEvidence`, returned as `match.storeType`; only `single_brand` turns badge mode on.
- **Badge mode:** on the first visit to a shop each day, a viewfinder overlay shows the evidence for about four seconds at the top of the page, then collapses on timeout or any scroll, click or key into a corner badge. The badge opens a case file with evidence, source, check date and scope. Nothing is clickable except Elf Cam's own controls.
- **No verdict yet:** the badge shows **Certified B Corp, verdict pending** for current B Corp evidence, and **Unidentified** for everything else (not listed, ambiguous, stale, not certified, offline). It never shows Naughty or Nice until card 157 agrees a method and the backend returns a verdict.
- **Site access:** content scripts run only on reviewed single-brand domains; `test/extension.test.js` keeps `extension/manifest.json` in sync with the registry. The extension calls the Worker with the current tab's hostname only. That is one answer to the open "local check or API" question, and Ben can still switch it to a bundled record.
- **H&M:** add H&M's reviewed entry with `storeType: 'single_brand'` and its hostnames, then add the same hostnames to the manifest matches.

## Open before launch

- **H&M entry:** hand-check H&M against the B Lab directory, then add it to the reviewed registry with a source, check date and explicit mappings for every H&M hostname the extension runs on, and seed it into D1 (see `docs/evidence.md`). Until then every H&M page shows unknown. Copy, screenshots and video must not state H&M's status before the entry exists.
- **Local check or API:** either the extension carries H&M's record itself (recommended: nothing leaves the browser) or it calls the Worker. Ben's call. It decides the privacy notice (version B or A in `copy.md`), the Chrome privacy tab and the Firefox data-collection declaration.
- **Build the overlay**, then capture real screenshots and the demo recording. The H&M overlay mock is labelled NOT FOR STORE and must never be uploaded.
- **Publisher setup:** EU trader declaration with company details, ideally a Google Group publisher, verify build40for40.com and choose a licence (MIT if the repo is public).

## Backend rules

- `POST /v1/assessments` accepts exactly one domain hostname, brand name or typed identifier (`b_lab` directory slug or nine-digit DUNS string). Identifier support does not imply an external DUNS resolution service; only verified registry mappings resolve. `GET /v1/sources` returns source coverage and freshness.
- Domain lookup uses exact reviewed hostname mappings with source/check dates. Case and a trailing DNS dot are normalised; subdomains and regional domains require explicit mappings. A marketplace domain identifies the marketplace, not a product brand or selected seller. No seller extraction or automatic domain research is implemented.
- Return B Corp certification evidence, provenance and check/refresh dates. Do not equate B Corp certification with a product-level ethical judgment.
- Unmatched and ambiguous identities are unknown, never automatically uncertified or naughty. Stale certification becomes unknown; historical enforcement evidence remains visible with freshness and event dates. There is no complete B Lab feed or per-request research integration. `validUntil` is our evidence refresh deadline, not the certificate's expiry; never extend it without rechecking the source.
- Each reviewed domain may record `storeType` (`single_brand` or `multi_brand`) in `domainEvidence`; domain lookups return it as `match.storeType`, `null` when unrecorded.
- Never invent identifiers, DUNS numbers or ownership links. Record the source for every company and domain mapping.
- Keep overall score and naughty/nice verdict unset until the scoring task is settled. No new scoring criteria are authorised by the backend work.

## Locked decisions: evidence backend

- Use the dedicated `naughty-list` D1 database, binding `DB`, in the shared Cloudflare account. This repo owns its migrations. Never write to the site's shared `40for40` database.
- D1 is the evidence store. Vector search is deferred; semantic similarity must not establish company identity.
- Public requests read stored evidence only. No scraping, paid lookups or AI research triggered by shopper requests. Database failure is a 503, not an unknown company.
- Use reviewed exact aliases, identifiers and hostnames. Corporate relationships do not automatically transfer evidence. Regional legal entities, brands and product claims retain their assessed scope.
- B Lab and EPA snapshots are manually reviewed. Selected minimum-wage, CMA and HSE records refresh daily using source-specific importers. Environment Agency and WBA remain blocked pending specific licence resolution.
- Wikirate's B Corp connector uses API credentials and reviewed provider company IDs. The audited metric contains only 2022 observations; the current import is Tony's Chocolonely's historical report. Preserve reporting years and secondary-source attribution in `criteria.bCorpReports`; do not silently promote these reports into direct B Lab verification. Patagonia has no answer in that metric, which is not evidence of non-certification.
- Imports validate all records before writing; scheduled writes use a D1 transaction per source. Retain prior evidence on failed refreshes, track import outcomes, keep evidence history and expose source coverage and freshness.
- Dates distinguish events, publication, checking and refresh deadlines. Historical findings are not claims of current misconduct. Undertakings, changed practices, guilty pleas, civil settlements and orders remain distinct outcomes.
- Data, operating commands and limitations are documented in `docs/evidence.md`.

## Data sources (card 155)

- **In use:** B Lab (hand-checked), UK minimum-wage naming, CMA, HSE, US EPA (reviewed snapshots) and Wikirate (one historical 2022 report). There is no supported public B Lab API, and its data.world dataset was retired on 13 July 2026.
- **Blocked pending licence:** Environment Agency and WBA.
- **Commercial shortlist for later, subject to access and display licensing:** Good On You (brand ratings) and Provenance (specific claims). EcoVadis is a negotiated commercial fallback.
- **Excluded for now:** Ethical Consumer, ClimateChoice, KindBuys, Climatiq, HowGood and TrusTrace.

## Scoring (card 157)

The v1 stamp depends on this card. Keep the overall score and naughty/nice verdict unset until card 157 agrees a method. No scoring criteria, weights or thresholds are agreed. Missing certification or missing records must never mean naughty or nice. Evidence about a seller or brand must not silently become a claim about an individual product.

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

- **How a verdict is worked out:** the criteria, weights and thresholds behind Naughty or Nice, and whether the reasons are shown alongside the stamp (card 157).
- **v2 details:** which multi-brand shops after John Lewis, and how brands are read from each product tile. Marketplace seller lookup, a precached list and automatic research for unknown sellers were proposed but not agreed.
- **Where the data comes from** beyond the current six sources (card 155).

## The problem as submitted

> Around this time every single year, The world starts spreading Christmas cheer. We start thinking about gifts that will bring out the "Yay", And the timing is even better, it's almost Black Friday.
> Their billboards all twinkle, their TV ads all glow, But who's been naughty or nice? We don't really know. Who treated their staff and local community with care? Who polluted the rivers, the land, and the air?
>
> Christmas is the busiest shopping period of the year, but it's hard to know which brands have actually been good all year. Nobody has time to research every company behind the toys and gifts on their list. The Naughty List tracks how brands treat their staff, communities and the environment, so we know who to buy from.
>
> The MVP is knowing who's been naughty or nice this year. The dream is a list that stays up to date all year round.
