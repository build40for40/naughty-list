## Community voting addition, 4 November 2026 (local only)

Implemented a separate community percentage, with a hard minimum of 20 current Nice/Naughty votes, editable/withdrawable votes, 12-month expiry, optional reasons, account write limits, burst review flags and recorded operator moderation. The API returns a null percentage below the floor. Evidence scoring remains deferred and independent.

The extension opens a hosted voting page; account tokens never enter shopping pages. Authentication reuses Joyo's WorkOS AuthKit/JWKS pattern and additionally checks verified email server-side. The matching pair from Joyo's local `.env.local` has now been transferred into ignored `.dev.vars` without displaying secret values. It uses a temporary sandbox, distinct from Joyo's deployed staging/production clients. Local callback/CORS settings are registered and read back, preserving Joyo's existing settings. Both local sign-in entry points reach hosted AuthKit. Full account sign-in/refresh/sign-out, dashboard-level Sign-out/Initiate login settings and production credentials/configuration remain pending. Tracked in [#162](https://app.superthread.com/40for40/card-162).

All 53 automated tests, community build, Worker deployment dry run and both browser package builds passed. The voting page was checked at 390px wide in a real local Worker with an isolated D1 database: 19 fixture votes hide the percentage; 20 show it. Live sign-in and browser extension release checks remain unverified. Nothing from this addition has been deployed. Migration `0003_community.sql`, H&M's reviewed identity/category/enrolment and the final privacy notice remain release requirements. See [community voting](community-voting.md).

## Evidence backend implementation, 4 November 2026

Dedicated D1 database `naughty-list` created in the shared Cloudflare account. Both production migrations have been applied, the reviewed evidence has been imported, and the Worker is deployed at https://naughty-list-api.40for40.workers.dev. Deployment version: `15236fa9-d6c5-4456-bdce-8aa3ae58842b`. The daily refresh schedule is enabled.

### Implemented and verified

- D1 storage for reviewed entities/selectors, corporate relationships, sources, evidence, import runs and evidence history. The site's shared `40for40` database is untouched.
- 20 reviewed entities with 22 records across six sources: B Lab (2), minimum-wage naming (4), CMA (10), HSE (2), EPA (3), Wikirate (1 historical report).
- Automated daily refresh for selected minimum-wage/CMA/HSE/Wikirate records. Real scheduled execution passed in the local Cloudflare runtime. No complete feeds or universal seller lookup claimed.
- B Lab and EPA are reviewed snapshots. EPA uses factual summaries of primary announcements, not an automated ECHO feed. US Amazon Services LLC remains distinct from the UK Amazon marketplace.
- The assessment endpoint reads D1, preserves existing B Corp fields and adds evidence/source coverage and freshness. New read-only `/v1/sources` endpoint. No public import endpoint and no source fetching on shopper requests.
- Transactional scheduled writes, stable source record keys, import history, pending/withdrawn publication states and preservation of previous data on failed refreshes. Database failures return 503 rather than unknown.
- Exact reviewed company and hostname matching. Unreviewed companies in source lists are skipped; no fuzzy name matching, automatic corporate inheritance or personal contact/location data imports.

### Still held back

- Environment Agency: specific register page and generic API licence declarations conflict. No records published.
- WBA: specific dataset licence/acquisition unconfirmed. No credentials or CSV imported.
- Commercial providers remain future options requiring agreements, not the launch integration path.

Scoring remains deferred to [Scoring Algorithm and Criteria (#157)](https://app.superthread.com/40for40/card-157). No weights, thresholds or naughty/nice verdicts were introduced. Consumer-practice evidence retains that label, rather than being treated as a settled communities criterion.

Operating guide: `docs/evidence.md` in the naughty-list repository. Includes setup, deployment, record review/corrections, source limitations and the distinction between historical events and fresh checking.

### Production verification

Live health and source catalogue checks passed. The database exposes 22 published records across six populated sources, with zero published records for the two blocked sources. Live assessment checks passed for B&Q, ASOS by domain, Samworth Brothers, Amazon Services LLC, Nintendo, Patagonia by domain, Tony's Chocolonely and an unknown example brand. All responses retained unset overall score and verdict. Automated scheduler execution was validated in the local Cloudflare runtime; the production daily trigger is configured. All 26 tests and a Wrangler deployment dry run passed.

### Wikirate activation and coverage audit

The authenticated B Corp metric audit found 4,712 companies, all observation year 2022: 3,611 Certified and 1,101 De-certified. All records declared CC BY 4.0. This is historical coverage, not current certification. Tony's Chocolonely is the only reviewed match against the existing registry (provider company 975185). Patagonia exists as a provider company but has no answer in this metric, so it was not mapped.

One historical Tony's report was imported, giving 22 records across six populated sources and 20 reviewed entities. API credentials are configured as Cloudflare secrets. Daily refreshes query the approved company ID only. Production checks passed: the source catalogue reports one Wikirate record and successful import; Tony's response labels the observation historical and 2022; Patagonia has no Wikirate report; both existing direct B Lab records remain intact and overall scoring stays unset. All 26 tests and the deployment dry run passed.
