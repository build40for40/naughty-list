# The Naughty List

Day 3 of 40 for 40, built live on Twitch on Wednesday 4 November 2026. The problem is "Hard to know which brands are ethical", from Santa. Shared project context, services and rules live in `../AGENTS.md`.

- **Form factor:** a Chrome extension.
- **Status:** a bare Manifest V3 scaffold lives in `extension/`. It loads in Chrome but has no behaviour yet. Four Ws are locked in below; the what is still undecided. Don't add product behaviour until the team settles the plan and asks for implementation.

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
