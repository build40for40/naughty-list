# Santa Score (draft)

**Method `santa-v0.3-draft`, proposed on card 157 on 4 November 2026. Not signed off.** Until Samira and Ben sign off on card 157, the API keeps `scoring.total` and `scoring.verdict` null and draft scores stay off the live API, the extension and the Santa Score page. The code is `worker/scoring.js`; nothing in the Worker imports it yet.

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

## Points

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

Total = gifts − coal.

| Verdict | Rule |
| --- | --- |
| Nice | Total of 0 or more, with at least one counted record |
| Naughty | Total of −2 or below |
| Not enough evidence | No counted records, or a total of −1 (a single warning). The warning is still shown |

No records never means naughty or nice. A stale B Corp record is not a gift.

## Worked examples (4 November 2026)

| Retailer | Counted | Total | Verdict |
| --- | --- | ---: | --- |
| Patagonia, Tony's Chocolonely | B Corp | +1 | Nice |
| B&Q | Minimum-wage naming, published 3 Sept 2026 | −2 | Naughty |
| ASOS, Boohoo, Asda (George), Wowcher, Simba | One CMA undertaking each | −1 | Not enough evidence, warning shown |
| Amazon UK | CMA commitments of 3 Nov 2023, one day outside the window | – | Not enough evidence |
| Made up: B Corp plus one warning | 1 − 1 | 0 | Nice |
| Made up: two warnings | 1 × 2 | −2 | Naughty |

## Running it

`npm run scores` reads published evidence from the deployed API for every retailer in `data/santa-retailers.js` and prints a markdown table. Use `-- --json` for machine-readable output, `-- --api http://localhost:8787` for a local Worker and `-- --as-of YYYY-MM-DD` to fix the date. To add a retailer, add a reviewed identity (source and check date) to the registry, seed it, then list its exact brand names under `lookups`.

## Open before sign-off

- The owner rule conflicts with the backend rule that corporate relationships don't transfer evidence. Update `AGENTS.md` and `docs/evidence.md` on sign-off.
- Employee voice: Glassdoor has no public API and bans scraping. Proposed: employment tribunal judgments as coal and Living Wage Foundation accreditation as a gift, subject to licence (card 155).
- Whether Amazon's competition commitments should count the same as misleading shoppers.
- Whether the window counts by exact day or calendar year.
- Severity by fine size, appeals and a changelog are v1 limitations.
