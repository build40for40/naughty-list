# The Naughty List

A Chrome extension for Day 3 of [40 for 40](https://build40for40.com).

The extension detects likely shopping pages locally and overlays source-backed information about reviewed businesses. A Cloudflare Worker provides a D1-backed evidence API. Ethical scoring remains deferred, so the current stamp is neutral rather than assigning naughty or nice. Product decisions are recorded in [AGENTS.md](AGENTS.md).

## Load locally

1. Clone this repository.
2. Open `chrome://extensions` in Chrome.
3. Enable **Developer mode**.
4. Click **Load unpacked** and select the repository's `extension/` folder.

No dependencies or build step are required. After changing extension files, click **Reload** on its card in `chrome://extensions`.

For Firefox, build the Firefox ZIP below, extract it, and load its `manifest.json` through `about:debugging#/runtime/this-firefox` → **Load Temporary Add-on**. The source manifest uses Chrome's service worker; Firefox packaging replaces that with background scripts.

The stamp prefers the bottom right. Open the extension's **Options/Preferences**, or use **Settings** on the stamp, to choose another corner or disable automatic lookups. It tries other corners if it would cover a purchase control, and stays hidden while none is clear. Dismissal applies to the current page. Only candidate HTTPS pages trigger a lookup; a product review with Product metadata alone does not.

H&M is the first launch target. Its shopping domains are now matched to the reviewed H&M brand identity, but its B Corp certification stays unknown because no direct certification evidence is recorded. Patagonia and Tony's Chocolonely are the current technical coverage examples. These do not replace the agreed launch scope. No scoring rule has been inferred from certification.

Only the hostname is sent to the fixed API endpoint. Product information, prices and page paths remain local. Assessments are cached for five minutes in this browser session. See [privacy preparation](publishing/privacy.md) for storage and network metadata details.

## Check the manifest

With [jq](https://jqlang.github.io/jq/) installed, run the same check as CI from the repository root:

```sh
jq -e '
  .manifest_version == 3 and
  (.name | type == "string" and length > 0 and length <= 75) and
  (.version | type == "string" and test("^[0-9]{1,5}([.][0-9]{1,5}){0,3}$"))
' extension/manifest.json
```

The check validates JSON syntax and basic required manifest fields. Chrome validates the full manifest when loading the extension.

Publication preparation and current blockers are recorded in [publishing/README.md](publishing/README.md). Build Chrome/Firefox ZIPs with `npm run extension:package:chrome` / `npm run extension:package:firefox`. Store submission and real browser compatibility testing remain separate release steps.

## Backend

Deployed API: https://naughty-list-api.40for40.workers.dev

Requires Node.js 22.13 or later and npm. Initialise the local database before starting:

```sh
npm ci
npm run wrangler -- d1 migrations apply naughty-list --local
npm run evidence -- seed
npm run evidence -- import us-epa data/epa-reviewed.json
npm run evidence -- sync
npm run dev
npm run check
```

`npm run dev` starts the Worker locally. `npm run check` runs the API tests and a Wrangler deployment dry run. CI runs these checks too.

### API

`GET /health` returns service health.

`GET /v1/sources` returns source coverage, record counts, freshness, attribution and access limitations. Assessments include published `evidence` and the same `sources` metadata alongside the existing B Corp fields. See [the evidence operating guide](docs/evidence.md) for response semantics, source setup, corrections and scheduling.

`POST /v1/assessments` accepts JSON with exactly one of:

```json
{ "domain": "patagonia.com" }
```

```json
{ "brand": "Patagonia" }
```

```json
{ "identifier": { "scheme": "b_lab", "value": "patagonia-inc" } }
```

```json
{ "identifier": { "scheme": "duns", "value": "000000000" } }
```

The DUNS example is a placeholder, not a real company mapping. Keep identifiers as strings to preserve leading zeroes. DUNS is an accepted format but no DUNS mappings or external resolver are configured yet. Domain, brand and identifier selectors cannot be combined. Names match only reviewed exact names/aliases, ignoring case and extra whitespace; there is no fuzzy matching or inheritance from a parent company.

Domain input is a hostname, such as the browser URL's `hostname`, rather than a full URL. It is lowercased and trimmed; a trailing DNS dot is removed. URLs, paths, ports, IP addresses and raw Unicode hostnames are rejected. Browser-normalised ASCII/punycode hostnames are accepted, but only exact reviewed entries match. No submitted domain is fetched by the backend.

The starter mappings include `patagonia.com`, `www.patagonia.com`, `tonyschocolonely.com`, `www.tonyschocolonely.com`, `uk.tonyschocolonely.com`, `us.tonyschocolonely.com` and selected reviewed websites in the seed script. Subdomains and regional sites need their own reviewed entries: neither `shop.patagonia.com` nor `patagonia.com.example.org` inherits a match. Domain matches include `match.method: "reviewed_domain"`, the normalised `match.domain` and source/check dates in `match.evidence`. This identifies the website's company; a marketplace domain cannot identify the selected seller or product brand. Those still need separate extraction and lookups.

Domain responses also include `relevance: { category, status, eligibleForVerdict, reason, evidence }`. Categories are exact reviewed `brand_shop`, `retailer`, `marketplace`, `unrelated`, or `unknown`. Only an exact resolved identity for a reviewed brand shop is eligible for a brand verdict. This is separate from the extension's local shopping-page signal and does not manufacture a score. `scoring.total` and `scoring.verdict` remain null. Brand and identifier clients retain their existing response shape.

`worker/relevance.js` is the reviewed category registry. No shopper domain is fetched or sent to a separate classifier. Before deploying this change, re-run `npm run evidence -- seed --remote` to add the reviewed Tony's regional hostname selectors to the dedicated database. Deploy the Worker only after review. An older deployed API without relevance information causes the extension to show a neutral unknown state.

Example request against the local Worker:

```sh
curl http://localhost:8787/v1/assessments \
  -H 'Content-Type: application/json' \
  --data '{"brand":"Patagonia"}'
```

Abbreviated response while the certification evidence is fresh (additional `evidence`, `sources` and `coverage` fields omitted):

```json
{
  "schemaVersion": "1",
  "input": { "brand": "Patagonia" },
  "match": { "status": "matched", "method": "brand_name" },
  "company": {
    "id": "patagonia",
    "name": "Patagonia",
    "identifiers": [{ "scheme": "b_lab", "value": "patagonia-inc" }]
  },
  "criteria": {
    "bCorp": {
      "status": "verified",
      "certified": true,
      "reason": null,
      "source": {
        "name": "B Lab",
        "url": "https://www.bcorporation.net/en-us/find-a-b-corp/company/patagonia-inc/"
      },
      "checkedAt": "2026-11-04",
      "validUntil": "2026-12-04"
    }
  },
  "scoring": { "status": "deferred", "total": null, "verdict": null }
}
```

An unknown company is a successful lookup (`200`), with `match.status: "not_found"`, `company: null` and `criteria.bCorp.certified: null`. Ambiguous identities also remain unknown. `false` is reserved for explicit evidence of non-certification, never inferred from absence. The initial registry contains no negative records. Ethical scoring and naughty/nice judgments are deferred.

Errors use `{ "error": { "code": "...", "message": "..." } }`: `400` invalid input/JSON, `404` unknown route, `405` wrong method, `413` body over 4096 bytes, `415` wrong content type. Public CORS allows extension/browser clients without credentials. There is no API key, outbound paid lookup or per-request research job.

### Evidence and coverage

The dedicated D1 database contains a starter set of **21 reviewed entities and 22 records from six sources**: B Lab, UK minimum wage naming, CMA, HSE, US EPA and Wikirate. Selected minimum-wage, CMA, HSE and Wikirate records refresh daily. B Lab and EPA are manually reviewed snapshots. Wikirate adds one explicitly historical 2022 certification report; it is not current B Corp verification. Environment Agency and WBA remain explicitly blocked pending licence resolution. This is partial coverage, not a complete directory, and historical records do not establish present misconduct.

[worker/companies.js](worker/companies.js) retains the original **Patagonia and Tony's Chocolonely** B Lab seed, checked on 4 November 2026. It is not a complete or live B Corp directory. `verified` means supported by the recorded source at `checkedAt`, not checked live on each request. Re-running the seed does not renew those dates.

`validUntil` is our evidence refresh deadline, not the certificate's expiry. At that date the API returns unknown with reason `stale_evidence` until the record is rechecked and updated. Do not extend this deadline without checking the source. Missing records must not be marked uncertified, and certification does not establish whether an individual product is ethical.

To add coverage, review a primary source, add the exact company mappings and source configuration, then seed and import the database using the [operating guide](docs/evidence.md). Record the source that links each domain to the company in `domainEvidence`; do not infer ownership from similar names. Never invent DUNS numbers or infer corporate ownership. Database failures return 503 instead of pretending no evidence exists. Published historical evidence remains visible with its freshness status; certification past its refresh deadline becomes unknown.

### Cloudflare deployment

The Worker is named `naughty-list-api`; its account and dedicated `naughty-list` D1 binding are configured in [wrangler.jsonc](wrangler.jsonc). It does not touch the site's shared D1 database. Public evidence sources need no provider API credentials. Source data and imports belong to this repository's database.

On a new machine, create the account auth profile:

```sh
env -u CLOUDFLARE_API_KEY -u CLOUDFLARE_EMAIL npx wrangler auth create 40for40
```

Apply migrations and import the starter evidence before deploying. These scripts preserve the `40for40` profile:

```sh
npm run wrangler -- d1 migrations apply naughty-list --remote
npm run evidence -- seed --remote
npm run evidence -- import us-epa data/epa-reviewed.json --remote
npm run evidence -- sync --remote
npm run deploy
```

Wrangler prints the deployed `workers.dev` URL. Test `/health` and `/v1/assessments` at that URL after deployment. Deployment is manual; CI does not deploy automatically.
