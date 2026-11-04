# The Naughty List

Day 3 of 40 for 40, built live on Twitch on Wednesday 4 November 2026. The problem is "Hard to know which brands are ethical", from Santa. Shared project context, services and rules live in `../AGENTS.md`.

- **Form factor:** a Chrome extension.
- **Status:** the Manifest V3 extension in `extension/` implements Elf Cam badge mode on reviewed single-brand stores. The Cloudflare Worker backend in `worker/` checks B Corp status against a small source-checked registry. Multi-brand sorting mode is designed but not built. Full ethical scoring is deferred to the `scoring & criteria` card on the Superthread `day3` board.

## Backend decisions

- Deploy `naughty-list-api` to the shared `40for40` Cloudflare account. Always use `npm run wrangler -- <args>` with the named auth profile, as required by the shared context.
- `POST /v1/assessments` accepts exactly one domain hostname, brand name or typed identifier (`b_lab` directory slug or nine-digit DUNS string). Identifier support does not imply an external DUNS resolution service; only verified registry mappings resolve.
- Domain lookup uses exact reviewed hostname mappings with source/check dates. Case and a trailing DNS dot are normalised; subdomains and regional domains require explicit mappings. A marketplace domain identifies the marketplace, not a product brand or selected seller. No seller extraction or automatic domain research is implemented.
- Return B Corp certification evidence, provenance and check/refresh dates. Do not equate B Corp certification with a product-level ethical judgment.
- Unmatched, ambiguous and stale records are unknown, never automatically uncertified or naughty. There is no complete B Lab feed or automatic research integration yet.
- Keep overall score and naughty/nice verdict unset until the scoring task is settled. No new scoring criteria are authorised by the initial backend work.
- Each reviewed domain records `storeType` in `domainEvidence` (`single_brand` today), returned as `match.storeType` for domain lookups.

## Extension decisions: Elf Cam

- **Visual direction:** Elf Cam, a North Pole CCTV parody. Jokes target brands, never shoppers. Design reference: https://claude.ai/artifact/2wxJoMkbyGVb71Af4eRZ1d
- **The store decides the mode.** Single-brand stores get **badge mode**: one brand-level verdict for the whole store. Multi-brand stores will get **sorting mode** (Cleared and Flagged for Coal feeds); not built yet, because it needs per-product brand extraction for each store.
- **Badge mode:** on the first visit to a store each day, a viewfinder overlay shows the verdict for about four seconds, then collapses on timeout or any scroll, click or key into a corner badge. The badge opens a case file with evidence, source, check date and scope.
- **Display rule:** the extension shows **Nice** only for current B Corp certification on a reviewed single-brand domain. Everything else (not listed, ambiguous, stale, uncertified, offline) is **Unidentified**. The extension never shows Naughty until the scoring work defines it. The backend verdict stays unset.
- **Site access:** content scripts run only on reviewed single-brand domains, and `test/extension.test.js` keeps `manifest.json` in sync with the registry. Only the current tab's hostname is sent to the Worker. Adding a store means adding a reviewed registry entry and its manifest match.
- Supported sites beyond the starter registry, sorting mode and the research pipeline remain undecided.

## Locked decisions: four Ws

- **Who:** Santa.
- **Why:** Don't choose evil.
- **Where:** a browser extension that overlays helpful information about a brand or product.
- **When:** Black Friday and Christmas shopping.

## Proposed direction: not yet decided

The what is still open. The current idea is an overlay on a specific product page, on shopping sites such as Amazon or Argos. It would identify the seller and look it up in a precached list. If the seller is missing, a backend would automatically try to research it and use a scoring algorithm to assess whether the product is ethical.

Treat this as a proposal, not an implementation specification. The supported sites, seller/brand/product identity, sources, scoring method, cache/update strategy and handling of unknown results are not yet agreed. Evidence about a seller or brand must not silently become a claim about an individual product.

## The problem

Christmas and Black Friday are the busiest shopping weeks of the year, and every brand's ads look lovely. What the ads don't say is how that brand treated its staff, its local communities and the environment all year. Nobody has time to research every company behind every gift on their list, so people buy blind.

The Naughty List tells shoppers which brands have been naughty or nice, so they know who to buy from.

- **MVP:** knowing who's been naughty or nice this year.
- **The dream:** a list that stays up to date all year round.

## What we know

- Santa is the locked audience; Black Friday and Christmas shopping are the locked occasion.
- A brand is judged on three things: how it treats its staff, its communities and the environment.
- It overlays helpful information about a brand or product in the browser. The existing scaffold targets Chrome; Firefox publishing has also been explored.
- The tone is festive and playful: Santa's list, naughty or nice, not a compliance report.

## Still open

- **What the overlay does:** product-page seller lookup is the current proposal; exact triggers, placement and interaction are still open.
- **What a verdict looks like:** a simple naughty or nice, a score, or the reasons behind it.
- **Where the data comes from:** which sources say how a brand behaves, and how a verdict gets worked out from them.
- **Which brands:** every brand, or a starter list of the big gift brands.
- **Getting it to people:** the Chrome Web Store, or a download from the 40 for 40 site.

## The problem as submitted

> Around this time every single year, The world starts spreading Christmas cheer. We start thinking about gifts that will bring out the "Yay", And the timing is even better, it's almost Black Friday.
> Their billboards all twinkle, their TV ads all glow, But who's been naughty or nice? We don't really know. Who treated their staff and local community with care? Who polluted the rivers, the land, and the air?
>
> Christmas is the busiest shopping period of the year, but it's hard to know which brands have actually been good all year. Nobody has time to research every company behind the toys and gifts on their list. The Naughty List tracks how brands treat their staff, communities and the environment, so we know who to buy from.
>
> The MVP is knowing who's been naughty or nice this year. The dream is a list that stays up to date all year round.
