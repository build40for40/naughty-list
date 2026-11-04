# The Naughty List

A Chrome extension for Day 3 of [40 for 40](https://build40for40.com).

The extension is a bare scaffold with no behaviour yet. A separate Cloudflare Worker provides the initial company assessment API. Product decisions are recorded in [AGENTS.md](AGENTS.md).

## Load locally

1. Clone this repository.
2. Open `chrome://extensions` in Chrome.
3. Enable **Developer mode**.
4. Click **Load unpacked** and select the repository's `extension/` folder.

No dependencies or build step are required. After changing extension files, click **Reload** on its card in `chrome://extensions`.

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

## Backend

Deployed API: https://naughty-list-api.40for40.workers.dev

Requires Node.js 22 or later and npm.

```sh
npm ci
npm run dev
npm run check
```

`npm run dev` starts the Worker locally. `npm run check` runs the API tests and a Wrangler deployment dry run. CI runs these checks too.

### API

`GET /health` returns service health.

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

The starter mappings cover `patagonia.com`, `www.patagonia.com`, `tonyschocolonely.com` and `www.tonyschocolonely.com`. Subdomains and regional sites need their own reviewed entries: neither `shop.patagonia.com` nor `patagonia.com.example.org` inherits a match. Domain matches include `match.method: "reviewed_domain"`, the normalised `match.domain` and source/check dates in `match.evidence`. This identifies the website's company; a marketplace domain cannot identify the selected seller or product brand. Those still need separate extraction and lookups.

Example request against the local Worker:

```sh
curl http://localhost:8787/v1/assessments \
  -H 'Content-Type: application/json' \
  --data '{"brand":"Patagonia"}'
```

Example response while the evidence is fresh:

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

[worker/companies.js](worker/companies.js) is a manually maintained starter registry containing **Patagonia and Tony's Chocolonely**, checked against their B Lab directory profiles on 4 November 2026. It is not a complete or live B Corp directory. There is no automatic enrichment or refresh job yet. `verified` means supported by the recorded source at `checkedAt`, not checked live on each request.

`validUntil` is our evidence refresh deadline, not the certificate's expiry. At that date the API returns unknown with reason `stale_evidence` until the record is rechecked and updated. Do not extend this deadline without checking the source. Missing records must not be marked uncertified, and certification does not establish whether an individual product is ethical.

To add coverage, review a primary source, add the company and confirmed aliases/identifiers/domains with the source and dates, run checks, then redeploy. Record the source that links each domain to the company in `domainEvidence`; do not infer ownership from page text or a similar name. A supported B Lab feed or licensed provider can replace this registry later. Never invent DUNS numbers or infer corporate ownership from similar names.

### Cloudflare deployment

The Worker is named `naughty-list-api`; its account is configured in [wrangler.jsonc](wrangler.jsonc). It uses a separate Worker and does not touch the site's shared D1 database. No database, credentials or paid external service are needed by this first version.

On a new machine, create the account auth profile:

```sh
env -u CLOUDFLARE_API_KEY -u CLOUDFLARE_EMAIL npx wrangler auth create 40for40
```

Then deploy using the repo script, which preserves the `40for40` profile:

```sh
npm run deploy
```

Wrangler prints the deployed `workers.dev` URL. Test `/health` and `/v1/assessments` at that URL after deployment. Deployment is manual; CI does not deploy automatically.
