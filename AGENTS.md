# The Naughty List

Day 3 of 40 for 40, built live on Twitch on Wednesday 4 November 2026. The problem is "Hard to know which brands are ethical", from Santa. Work is tracked on the Superthread `day3` board.

- **Form factor:** a browser extension, for Chrome first and Firefox second.
- **MVP (v1):** a single-brand shop, starting with H&M on its own shop, with a Naughty or Nice stamp for the brand.
- **Reach goal (v2):** multi-brand shops such as John Lewis, sorting the brands on the page into Naughty and Nice lists.

## Status (4 November 2026, afternoon)

- **`extension/`:** the version `0.0.2` shopping overlay MVP is implemented for Chrome and Firefox. Local shopping signals trigger hostname-only API requests; one neutral evidence stamp supports settings, dismissal, pending/unknown/error states and explicit future verdicts. Real browser visual/end-to-end release checks remain pending.
- **`worker/`:** the `naughty-list-api` Cloudflare Worker, deployed at https://naughty-list-api.40for40.workers.dev. It reads reviewed evidence from its dedicated `naughty-list` D1 database: 20 reviewed entities and 22 records from six sources (B Lab, UK minimum-wage naming, CMA, HSE, US EPA and Wikirate). Selected records refresh daily at 05:17 UTC. **There is no H&M entry yet.**
- **`publishing/`:** release preparation for both stores (card 152): browser-specific backgrounds and runtime ZIPs, actual hostname-transmission disclosures, privacy inventory, browser test matrix and update procedure. Store submission is still pending.
- **`launch-assets` branch (card 156, not merged):** festive store graphics, store copy with a pun bank, a download page draft and a demo storyboard, in `publishing/launch/`.
- **Backend detail:** `docs/evidence.md` (operating guide) and `docs/implementation-status.md` (what is deployed and verified).

## Commands

- Node.js 22.13 or later. `npm ci`, then initialise the local database: `npm run wrangler -- d1 migrations apply naughty-list --local`, `npm run evidence -- seed`, `npm run evidence -- import us-epa data/epa-reviewed.json` and `npm run evidence -- sync`.
- `npm run dev` (local Worker), `npm run check` (tests plus a Wrangler dry run) and `npm run deploy` (manual; CI never deploys). Remote migrations, seeding and imports come before deploying; see `docs/evidence.md`.
- `npm run extension:package:chrome` / `npm run extension:package:firefox` build runtime-only ZIPs into `dist/` from an explicit allowlist. Update the allowlist in `scripts/package-extension.mjs` whenever the extension gains files.
- Always run Wrangler as `npm run wrangler -- <args>`. It uses the `40for40` auth profile and unsets `CLOUDFLARE_API_KEY` and `CLOUDFLARE_EMAIL`. On a new machine, create the profile with `env -u CLOUDFLARE_API_KEY -u CLOUDFLARE_EMAIL npx wrangler auth create 40for40`.
- Wikirate credentials live in the ignored `.dev.vars` locally and in Cloudflare secrets in production. Never commit them or paste them into chat.
- CI runs `npm run check`, both extension package builds and a `jq` check on `extension/manifest.json`.

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
| 162 | Community Naughty/Nice voting alongside the evidence score | Doing |

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
- **Support email:** help@build40for40.com. Use this in publication materials and the final public privacy notice.
- **Look:** a Christmas identity of its own: Santa red, pine green, snow, gold and candy-cane stripes, with playful puns. 40 for 40 appears only as a small "made by" credit. The festive icon on `launch-assets` replaces the draft icons in `extension/icons/`.
- **Chrome Web Store:** Ben owns the developer account (fee paid), publishing as 40 for 40 Ltd.
- **Firefox add-on ID:** `{c2591c57-0224-4d4a-bdb4-a3223e58c354}` in `publishing/manifest.firefox.json`. Never change it; updates depend on it.

## Design rule: stamp or lists (card 158, 4 November)

- **v1, single-brand shops (e.g. H&M): a Naughty or Nice stamp.** All products share one company's evidence, so a Nice/Naughty split would put the whole shop in one group.
- **v2, multi-brand shops (e.g. John Lewis, Argos, Amazon): Naughty and Nice lists, plus Unknown.** Show the shop's record as a badge and group products by their own brand; never let the shop's record apply to other brands it sells. Own-label products take the shop's record. If a tile's brand can't be read reliably, it goes in Unknown. Unknown must look neutral.
- **Rearranging the page:** reorder or label the shop's own tiles and buttons; never copy tiles or rebuild buttons, so the basket, quantities and Buy now keep working. Never click for the shopper, and never hide or cover purchase controls.
- How much a single action (such as one donation) counts is a scoring question for card 157, not a design one.

## Elf Cam look (card 158, 4 November)

- **Direction:** Lawrence chose Elf Cam, a North Pole CCTV parody, for the stamp. Jokes target brands, never shoppers. Design reference: https://claude.ai/artifact/2wxJoMkbyGVb71Af4eRZ1d. Single-brand badge mode is the way forward; the multi-brand Elf Cam sorting view is v2 and not built.
- **Stamp:** the existing stamp (logic, states, settings, dismissal and purchase-control placement unchanged) is styled as a camera feed: black panel, scanlines, a lens and blinking REC in the header, and the bundled VT323 pixel font (SIL OFL, `extension/fonts/`). Neutral is pale grey; nice green and naughty red only when the backend supplies a verdict. Evidence sits under "Case file".
- **Intro:** once per shop per day, after a successful lookup, corner brackets and a REC/clock readout show for 3.5 seconds, ending early on scroll, key or click. It never takes clicks, and it is skipped if a purchase control sits in the top 90px or bottom 70px of the window. The date is stored locally as `elfCamIntro:<hostname>`.
- **Still to reconcile:** the launch look above (Santa red, pine green, snow, gold) and the store graphics on `launch-assets` predate Elf Cam.

## Implemented technical MVP flow

- Shopping detection is local and heuristic: require price evidence plus product/offer metadata and an actionable purchase control. Product markup alone is insufficient. Current purchase-control matching uses English labels.
- Send only the candidate hostname to `POST /v1/assessments` through the background script. Product details, prices, page paths, HTML and signal flags stay local. No separately deployed service or per-request AI classifier is used.
- The same Worker returns exact reviewed `brand_shop`, `retailer`, `marketplace`, `unrelated` or `unknown` domain categories. An exact resolved brand-shop identity is required for verdict eligibility. Marketplaces/retailers cannot pass the shop's evidence onto product brands.
- Patagonia and Tony's Chocolonely are source-checked technical coverage examples, including explicitly reviewed Tony's UK/US hosts. They do not replace H&M as the first launch target. H&M has no reviewed entry and must remain unknown until one is added.
- One fixed stamp prefers bottom right. Settings allow all four corners and disabling automatic checks; dismissal lasts for the current page. If purchase controls overlap, try another corner or hide until there is room. Never duplicate, move or cover purchase controls. Navigation, pending responses, retries and unknown evidence are handled.
- Deduplicate hostname requests and cache assessments for five minutes in browser-session storage, with a maximum of 50 entries. Store preferences locally. Validate that messages come from the sending top-frame hostname.
- Nice/naughty is rendered only when explicitly supplied by the backend for an eligible reviewed brand shop. Until card 157 agrees a rule, the current backend keeps total/verdict null and the stamp is neutral. B Corp never implies nice and missing evidence never implies naughty.
- HTTPS content-script access is required for local detection; background requests use only the fixed API host. Firefox declares required `browsingActivity` transmission. Chrome disclosures must also cover local page-content processing.
- This MVP branch does not deploy the backend. After review, seed the reviewed regional hostname selectors and deploy before release checks. Older backends without relevance information fail closed to a neutral unknown state.

## Open before launch

- **H&M entry:** hand-check H&M against the B Lab directory, then add it to the reviewed registry with a source, check date and explicit mappings for every H&M hostname the extension runs on, and seed it into D1 (see `docs/evidence.md`). Until then every H&M page shows unknown. Copy, screenshots and video must not state H&M's status before the entry exists.
- **API and privacy:** the implemented MVP uses hostname-only Worker calls. Use the networked privacy copy (version A in the launch draft), complete the Chrome privacy tab and keep Firefox's `browsingActivity` declaration. Confirm Cloudflare logging/retention and host the final notice before store submission.
- **Verify the overlay**, then capture real screenshots and the demo recording. The H&M overlay mock is labelled NOT FOR STORE and must never be uploaded.
- **Publisher setup:** EU trader declaration with company details, ideally a Google Group publisher, verify build40for40.com and choose a licence (MIT if the repo is public).

## Backend rules

- `POST /v1/assessments` accepts exactly one domain hostname, brand name or typed identifier (`b_lab` directory slug or nine-digit DUNS string). Identifier support does not imply an external DUNS resolution service; only verified registry mappings resolve. `GET /v1/sources` returns source coverage and freshness.
- Domain lookup uses exact reviewed hostname mappings with source/check dates. Case and a trailing DNS dot are normalised; subdomains and regional domains require explicit mappings. A marketplace domain identifies the marketplace, not a product brand or selected seller. No seller extraction or automatic domain research is implemented.
- Return B Corp certification evidence, provenance and check/refresh dates. Do not equate B Corp certification with a product-level ethical judgment.
- Unmatched and ambiguous identities are unknown, never automatically uncertified or naughty. Stale certification becomes unknown; historical enforcement evidence remains visible with freshness and event dates. There is no complete B Lab feed or per-request research integration. `validUntil` is our evidence refresh deadline, not the certificate's expiry; never extend it without rechecking the source.
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

## Community voting (approved 4 November 2026)

- Separate community opinion from the evidence assessment. Votes never change our scoring/verdict or certification fields.
- One current Nice, Naughty or Not sure vote per email-verified WorkOS account per reviewed brand. Reuse Joyo's AuthKit pattern; the Worker additionally checks WorkOS's server-side email-verification flag. No email/name is stored in the voting database.
- Show the percentage of Nice among Nice + Naughty only after **20 active eligible votes**. Not sure, expired and excluded votes do not count towards the minimum or percentage. The API returns null below the minimum; displays enforce the same floor. The minimum is a participation rule, not a statistical reliability claim.
- Votes expire after 12 calendar months and can be changed or withdrawn. Optional reasons: staff, communities, environment. No public comments in v1.
- H&M remains the first launch target. Enrolment is explicit and requires the reviewed identity/domain/category first. The migration starts with no enrolled brands. Tests use Patagonia only as technical coverage.
- Code is implemented locally, not deployed, tracked on card 162. Joyo's matching local temporary WorkOS pair has been reused in ignored `.dev.vars` without displaying secret values; local callback/CORS are registered and hosted sign-in opens. Production credentials/URLs, Sign-out/Initiate login settings, full account-flow checks, H&M review/enrolment, remote migration, public privacy and real extension checks remain release prerequisites. See `docs/community-voting.md`.

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
