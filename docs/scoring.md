# Santa Score (draft)

**Method `santa-v0.4-draft`, proposed on card 157 on 4 November 2026. Not signed off.** Samira signed off v0.3; v0.4 adds the report card below and needs Samira and Ben's sign-off. Until Samira and Ben sign off on card 157, the API keeps `scoring.total` and `scoring.verdict` null and draft scores stay off the live API, the extension and the Santa Score page. The code is `worker/scoring.js`; nothing in the Worker imports it yet.

Santa doesn't judge on rumours. He checks his list twice, believes in second chances, and only proven, recent naughtiness earns coal.

## What is scored

- The company behind the shop or brand. Brands count under the company that owns them, so George at Asda counts as Asda and PlayStation as Sony. Every owner link needs a recorded source (Companies House or the owner's own brand list), kept in `data/santa-retailers.js`.
- A shop counts only as itself. John Lewis is scored as John Lewis, and the brands it sells never inherit its verdict. Own-label products take the shop's record.
- Products are never scored separately.

## Santa's values

| Value | Area | Sources today |
| --- | --- | --- |
| Kindness to the elves | Staff | UK minimum-wage naming, HSE |
| Honesty and generosity | Communities | CMA, B Corp |
| Caring for the North Pole | Environment | US EPA (UK-relevant only), CMA green-claims cases |

## Why v0.4 adds a report card

Under v0.3, 81 of the 100 retailers came out "not enough evidence" even after every one was researched. The only gift was B Corp, and every other source only records wrongdoing, so a clean record had nothing to count. v0.4 adds two statutory gov.uk filings that almost every large UK employer must make every year. They are public, free (Open Government Licence v3.0) and cover 86 of the 100.

## Report card (v0.4)

| Value | Measure | Source | Gift (best quarter) | Coal (worst quarter) |
| --- | --- | --- | --- | --- |
| Kindness to the elves | Median hourly gender pay gap, either direction | [Gender pay gap service](https://gender-pay-gap.service.gov.uk/viewing/download-data) | 1.25% or less | 6.94% or more |
| Honesty and generosity | Invoices not paid within the company's own agreed terms | [Payment practices reporting](https://check-payment-practices.service.gov.uk/export/csv/) | 2% or less | 20% or more |

- **Thresholds are quartiles of the 100**, frozen in `data/santa-scorecard.json` for each publication, so a gift means "better than three quarters of the list".
- **Each measure is worth +1, 0 or −1.** Report-card coal never doubles and never counts as a repeat incident.
- **Report-card gifts can balance warnings but never cancel a proven offence.** A retailer with a proven offence in the window keeps at least its incident total, so it stays Naughty.
- **A filed report is a counted record**, even when it scores 0. A middling report card with nothing else is Nice, following the v0.2 rule that neutral with evidence is Nice.
- **Freshness:** the pay gap snapshot must be from the last two years and the payment report must cover a period ending in the last 18 months.
- **Missing, stale or invalid filings are left out, never scored as bad.** Some companies are below the payment-reporting size threshold. Impossible values (one Boohoo filing reports 4,323,394 days to pay) are skipped.
- **Shown, but no points:** filing the pay gap report after the deadline (Liberty, H&M, Schuh, Pets at Home, IKEA in 2025).
- **Which company files:** `data/santa-filings.js` maps each retailer to the UK legal entity whose filings stand for it, using the company number in the filing. Judgement calls are noted there (Waitrose's pay gap is reported by John Lewis plc; Zara is ITX UK; Debenhams uses Boohoo's filing).

## Incident points

| Evidence | Points | Examples |
| --- | ---: | --- |
| Proven offence | 2 coal | Guilty plea or conviction, fine, minimum-wage naming, regulator's order or settlement |
| Warning | 1 coal | CMA undertakings or commitments: the practice was real and the regulator stepped in, but nothing was proven or admitted |
| Gift | 1 | Current Certified B Corp, checked directly in the B Lab directory |
| Nothing | 0 | Self-reported CSR, policies, promises, allegations, open investigations, secondary or historical reports (Wikirate 2022), practices changed before any formal action |

- **Repeats double.** Within the window, total coal is the worst incident's coal, doubled for each further incident. Offences: 2, 4, 8, 16. Warnings: 1, 2, 4. A warning plus an offence: 4.
- **One incident, one penalty.** The same record reached through several lookups, or revised undertakings in one case, counts once.
- **Second chances.** Only events from the last 3 years count, to the day. If a record has no event date (minimum-wage naming), its publication date is used and labelled as such. Older events are shown as history and earn nothing.

## Verdict

Total = gifts − coal + report card.

| Verdict | Rule |
| --- | --- |
| Nice | Total of 0 or more, with at least one counted record |
| Watch list | Total of −1: a single warning, or a poor report card with nothing to balance it. New in v0.4; the reason is shown |
| Naughty | Total of −2 or below |
| Not enough evidence | No counted records at all |

No records never means naughty or nice. A stale B Corp record is not a gift.

## Worked examples (4 November 2026)

| Retailer | Counted | Total | Verdict |
| --- | --- | ---: | --- |
| Patagonia, Tony's Chocolonely | B Corp | +1 | Nice |
| B&Q | Minimum-wage naming, published 3 Sept 2026 | −2 | Naughty |
| Boohoo, Asda (George), Wowcher, Simba | One CMA undertaking each; middling or no report card | −1 | Watch list, warning shown |
| Amazon UK | CMA commitments one day outside the window; report card +2 | +2 | Nice (v0.4) |
| Lidl | Minimum-wage naming; report card +2 | −2 | Naughty: gifts never cancel a proven offence |
| ASOS | One warning; pay gap 41%, 28% of invoices late | −3 | Naughty (v0.4) |
| Argos | No incidents; middling report card | 0 | Nice (v0.4) |
| Temu | No UK filing entity, no incidents | – | Not enough evidence |
| Made up: B Corp plus one warning | 1 − 1 | 0 | Nice |
| Made up: two warnings | 1 × 2 | −2 | Naughty |

## Running it

`npm run scorecard -- --pay-gap <gpg.csv> --payments <payments.csv> --as-of YYYY-MM-DD` rebuilds `data/santa-scorecard.json` from the two gov.uk downloads, validating every value and recomputing the thresholds. `npm run scores` reads published evidence from the deployed API for every retailer in `data/santa-retailers.js` and prints a markdown table. Use `-- --json` for machine-readable output, `-- --api http://localhost:8787` for a local Worker and `-- --as-of YYYY-MM-DD` to fix the date. To add a retailer, add a reviewed identity (source and check date) to the registry, seed it, then list its exact brand names under `lookups`.

Incidents in `npm run scores` come only from the registry. The card 159 research for the other 85 retailers (Samira's v0.3 run on the `launch-assets` branch) is not in the registry yet, so those rows say "incidents not in registry" and their verdict can be too kind. The combined v0.4 draft is posted on card 157.

## Open before sign-off

- v0.4: whether the gender pay gap belongs in the score (it reflects job mix as much as fairness), the quartile thresholds, the new Watch list verdict (needs a card 158 design) and every company-number match in `data/santa-filings.js`.
- Add the card 159 incident research to the registry so `npm run scores` reproduces the combined draft.

- The owner rule conflicts with the backend rule that corporate relationships don't transfer evidence. Update `AGENTS.md` and `docs/evidence.md` on sign-off.
- Employee voice: Glassdoor has no public API and bans scraping. Proposed: employment tribunal judgments as coal and Living Wage Foundation accreditation as a gift, subject to licence (card 155).
- Whether Amazon's competition commitments should count the same as misleading shoppers.
- Whether the window counts by exact day or calendar year.
- Severity by fine size, appeals and a changelog are v1 limitations.

## Draft results for all 100 (4 November 2026, `santa-v0.3-draft`)

Hand-computed from `data/research/`. Not yet in the registry or API.

| Verdict | Retailers |
| --- | --- |
| Nice | Patagonia, Tony's Chocolonely, FatFace (B Corp), Simba (B Corp +1 balances its CMA undertaking −1) |
| Naughty | B&Q (named twice: −4); Wayfair (CMA £4.8m fine, Oct 2026); minimum-wage naming (−2): Currys, Morrisons (Wm Morrison Produce), GAME, River Island, Wickes, Harrods, Lidl, Halfords, The Range (CDS), Holland & Barrett, Iceland, B&M, Tesco |
| Not enough evidence, warning shown | Wowcher, Asda (George), ASOS, Boohoo, Amazon UK (CMA undertakings from Amazon Europe Core SARL, Jun 2025) |
| Not enough evidence | Everyone else |

**Open before sign-off:**
- **Severity:** Tesco (£227.84, 1 worker), Harrods (£775.04, 1 worker), B&M (£3,304.80, 1 worker) and Iceland (£1,709.93, 6 workers) count the same as B&Q's £456,934. A minimum amount or number of workers may be needed.
- **Halfords:** two Halfords companies in the same round are counted as one incident.
- **Not counted:** regional co-operative societies are not the Co-op Group. Land-agreement letters (Morrisons, Co-op, M&S) are "changed its ways".
- **Unverified links:** owner links and some legal entities are unverified (see the notes in each JSON).
- **Importer changes needed:** the minimum-wage importer must accept unnumbered lists and use `first_published_at` before these rounds can be imported.
