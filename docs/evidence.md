# Evidence backend

The API uses the dedicated Cloudflare D1 database `naughty-list` through the `DB` binding. It never writes to the website's `40for40` database. SQL is a good fit for exact company lookups, evidence and source/import relationships; vector search is not needed for this version.

## Coverage at launch

20 reviewed entities and 22 evidence records, including one historical Wikirate report:

| Source | Records | Maintenance |
| --- | ---: | --- |
| B Lab | 2 | Manually checked directory facts. Original check/refresh dates are preserved. |
| UK minimum wage naming | 4 | Selected naming publication, exact reviewed employer names. |
| CMA | 10 | Selected cases with reviewed company associations and supporting assertions. |
| HSE | 2 | Selected prosecution announcements through its public WordPress interface. |
| US EPA | 3 | Manually reviewed factual summaries linked to primary announcements. |
| Wikirate | 1 | Secondary certification report for Tony's Chocolonely, observation year 2022. |

These counts describe our reviewed starter dataset, not the complete coverage of each publisher. Sources do not automatically discover every brand, seller or product. Minimum wage rows for unreviewed entities are skipped; personal names, locations, addresses and entire source pages are not persisted. Keep sample test fixtures fictional.

`data/companies.js` contains reviewed identities. `scripts/evidence.mjs` adds reviewed exact website mappings before seeding. Some entities support name lookup only. A reviewed `www` host does not automatically approve its bare hostname, subdomains or regional variants.

The UK Amazon marketplace and Amazon Services LLC in the US are separate entries. EPA evidence concerning the latter does not appear on a UK marketplace lookup. The PlayStation and Xbox entries concern the named gaming services; do not extend their evidence to every Sony or Microsoft product. George at Asda does not stand for every Asda business. Manufacturer evidence is not automatically applied to its brands or products. The relationships table is reserved for explicitly sourced mappings; there are no inherited evidence joins.

## Public API

`POST /v1/assessments` still accepts exactly one `domain`, `brand` or supported typed identifier. Existing company matching and `criteria.bCorp` response fields remain; additive fields are:

- `evidence`: published records for the exact matched entity. Each includes an outcome, assessed entity, scope, source URL, event/publication/check/refresh dates, facts and freshness. Unavailable event dates are null. Never render returned text as HTML.
- `sources`: source access status, published record count, attribution/licence, last attempt/success, refresh deadline, freshness and limitations.
- `coverage`: explicitly partial. No records means unknown.

`GET /v1/sources` returns the source catalogue, including sources we cannot publish yet. `GET /health` checks the database and seeded registries. Missing bindings, failed database queries and unseeded stores return 503. An unknown company still returns 200. There is no public write/import endpoint.

`scoring.total` and `scoring.verdict` remain null. Criterion weights, thresholds and verdict decisions belong to task #157. Consumer-practice evidence is labelled as such rather than silently mapped into the communities criterion.

## Local setup and refresh

Use Node.js 22.13 or later (tests use built-in `node:sqlite`). All Wrangler commands use the repository script and `40for40` auth profile.

```sh
npm ci
npm run wrangler -- d1 migrations apply naughty-list --local
npm run evidence -- seed
npm run evidence -- import us-epa data/epa-reviewed.json
npm run evidence -- preview
npm run evidence -- sync
npm run dev
npm run check
```

`preview` fetches and validates without database writes. `sync` refreshes the configured minimum-wage, CMA and HSE selections. It fails loudly on HTTP errors, unexpected empty results, schema changes, removal of reviewed supporting assertions or a reopened CMA case. It does not infer new outcomes from arbitrary text. Each configured source is independent; one failure does not prevent the others from refreshing. A source with new/changed facts requires a reviewed configuration update before publication.

For restricted agent environments, set `WRANGLER_LOG_PATH` to a writable log file and `WRANGLER_REGISTRY_PATH` to a writable temporary directory before starting dev. Do not change the authentication profile.

## Deployment and scheduled imports

```sh
npm run wrangler -- d1 migrations apply naughty-list --remote
npm run evidence -- seed --remote
npm run evidence -- import us-epa data/epa-reviewed.json --remote
npm run evidence -- sync --remote
npm run deploy
```

Seed before deploying the D1-backed Worker. Re-seeding updates configured selectors/source metadata and imports the original B Lab snapshot; it does not renew its check date or certification refresh deadline. It does not remove companies absent from the seed file. Explicitly withdraw/remove mappings when corrections require it.

The Worker refreshes the three automated sources daily at `05:17 UTC` (05:17 London in winter, 06:17 in summer). Each source is fetched/validated first, then its evidence, history and successful import marker are committed in a single D1 batch transaction. Failed fetches retain prior records and last-success dates and record an unsuccessful attempt. Scheduled failures also fail the invocation for operational visibility. All outbound URLs are fixed trusted source endpoints; shopper-provided domains are never fetched.

Requests do not call upstream sources. Source freshness measures when our configured records were last checked, not whether the source has complete coverage. Records have their own refresh deadlines as well. Old enforcement findings remain historical facts; a fresh import does not make their event date recent. An import failure alone does not withdraw a historical finding.

## Storage and corrections

Tables: `companies`, `selectors`, `company_relationships`, `sources`, `import_runs`, `evidence`, `evidence_history`. Published evidence is unique by source, stable source record ID and assessed company. Each import retains a historical copy linked to its run. Do not add or count a second copy of the same case just because its publication URL or update date changed. Multiple publishers' reports may concern the same incident; the future scoring algorithm must deduplicate incidents across sources.

The trusted file importer accepts normalized JSON arrays for manual sources:

```sh
npm run evidence -- import us-epa data/epa-reviewed.json --remote
```

Use the checked-in EPA snapshot as the format reference. New records require a reviewed company ID and a primary HTTPS URL on the source's allowlist. Keep legal scope, original outcome and relevant remediation. `publicationStatus` supports `published`, `pending` and `withdrawn`; only published rows are returned. To withdraw a record, import its same source record/company key with `withdrawn`, then update the configuration that produced it so the next sync does not republish it. A missing upstream record does not automatically delete stored evidence. There is no automated reviewer or dashboard in this version.

The file importer is an operator tool, not an untrusted upload service. Do not import personal information, source-page contact sections, full copyrighted documents, fabricated identifiers or unreviewed corporate associations. Runtime database contents are not a complete source dump. Credentials belong in environment variables or Cloudflare secrets, never in imported JSON or the repository.

## Sources held back

- Environment Agency: its specific register licence page lists enforcement data under OGL, but the API and API specification declare a conditional licence. No records are published while this conflict remains unresolved.
- WBA: specific dataset licence and acquisition must be established. No API key is configured and no CSV is imported.
- Commercial providers: no contracts or credentials; none are called or represented as active data feeds.
- EPA ECHO: public API discovery was investigated, but filtered case retrieval and identity matching have not been validated. The current EPA integration uses reviewed factual snapshots, not an automated ECHO feed.

## Wikirate B Corp connector

The Wikirate connector reads metric `13660491`, B Lab / B Corp Certification Status. It is a secondary source. Its public metric page declares CC BY 4.0; each actual answer must also carry that exact licence and supporting source URLs before publication.

The authenticated audit on 4 November 2026 found 4,712 answers for 4,712 companies, all observation year 2022: 3,611 Certified and 1,101 De-certified. All carried CC BY 4.0. There is one reviewed match against our registry: Tony's Chocolonely (provider company 975185, answer 13863474). Its source is an archived 2022 B Corp Impact Data snapshot, not a current directory check. Patagonia's company record exists on Wikirate but has no answer for this metric. No missing answer is interpreted as de-certification. This source does not extend our present-day certification coverage.

Create a free Wikirate account and generate a personal token from Account → API access. Put `WIKIRATE_PUBLISHABLE_KEY` and `WIKIRATE_API_TOKEN` in the ignored `.dev.vars` file, using the empty names in `.env.example` as a reference. The CLI loads this file; never paste tokens into chat or commit them. All API credentials are sent in headers to the fixed `data.wikirate.org` origin; redirects fail closed.

```sh
npm run evidence -- wikirate-audit
```

The audit reports record/company counts, observation-year distribution, status values, licences and potential matches against our reviewed registry. Candidate matches are proposals only. Check the returned provider company record, website, legal scope and supporting sources; add approved stable company IDs and identity provenance to `data/wikirate-mappings.js`. An empty metric, poor coverage or old observations should be reported honestly rather than used to invent current certification. Scheduled imports query only approved provider IDs rather than downloading the whole dataset on every refresh.

Once usable records and mappings are confirmed:

```sh
npm run evidence -- sources --remote
npm run evidence -- preview
npm run evidence -- sync --remote
npm run evidence -- wikirate-secrets
npm run deploy
```

`sources` updates only the source catalogue. `wikirate-secrets` uploads the two credentials to the existing Worker through the named Wrangler profile, without printing values. It creates a restricted temporary file and removes it afterwards. The existing daily schedule includes Wikirate when its credentials are configured. All records are fetched and validated before writing; missing mapped companies, conflicting latest-year values, unsupported licences and unknown values fail the import and retain prior evidence.

For each mapped company we retain its latest reporting year and explicit Certified/De-certified value. Database update times are not certification dates. API consumers receive these observations as `evidence` and `criteria.bCorpReports`, with reporting year, historical/current-year observation status, attribution and retrieval freshness. Original and archived supporting source URLs are preserved. These reports do not automatically set the direct-verification field `criteria.bCorp.certified`. No observation, a missing company or failed access is not proof of non-certification. No overall ethical score is introduced.

References: [metric and licence](https://wikirate.org/B_Lab%2BB_Corp_Certification_Status), [self-service API documentation](https://wikirate.org/api), [API usage policy](https://wikirate.org/API_Licensing). High-volume or commercial API use may require discussion under that policy, even though the selected data licence permits attributed reuse.

Official references:

- [GOV.UK Content API](https://content-api.publishing.service.gov.uk/)
- [HSE reuse terms](https://www.hse.gov.uk/help/copyright.htm)
- [EPA public developer services](https://echo.epa.gov/tools/web-services)
- [Environment Agency register licences](https://environment.data.gov.uk/public-register/view/data-licence)
- [WBA API access](https://www.worldbenchmarkingalliance.org/documentation/api-specification)
