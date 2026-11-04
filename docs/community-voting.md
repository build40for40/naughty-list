# Community voting

Approved 4 November 2026. Implemented locally; deployment and live WorkOS flows require the setup below.

Tracked in [community voting (#162)](https://app.superthread.com/40for40/card-162), Doing. Separate from evidence scoring (#157).

## WorkOS setup completed, 4 November 2026

- Reused the matching `WORKOS_API_KEY` / `WORKOS_CLIENT_ID` pair from Joyo's ignored `.env.local` in this repo's ignored `.dev.vars`. The transfer preserved existing Wikirate settings, set file permissions to 0600 and never displayed secret values. No claim token or cookie secret was copied.
- The copied pair works against WorkOS's API. Registered `http://localhost:8787/community/` as an additional redirect and `http://localhost:8787` as an additional CORS origin using the API-key-backed REST commands. Read-back confirmed both. Joyo's existing `http://localhost:5173/callback` redirect remains the default and its CORS origin is preserved.
- WorkOS doctor with normal host access and internally supplied credentials reports no configuration errors. Its cookie-domain warning does not apply to this client-only, local-storage AuthKit flow.
- In a real local Worker with an isolated test database, the vote button and `/community/login` both reached hosted AuthKit sign-in with the correct callback. No person was signed in or account created. The OAuth return, verified-email voting, refresh and sign-out are still unverified.
- The hosted page explicitly identifies this as a **temporary environment**. These credentials are local development credentials, not the current staging/production IDs used by Joyo's deployed code. They have not been uploaded to Cloudflare or used for production URLs.
- After the WorkOS dashboard login, confirmed that Joyo's real Staging and Production environments match the public client IDs below. Registered the voting callback, CORS origin and additional Sign-out URI in each: `http://localhost:8787/community/` / `http://localhost:8787` in Staging, and `https://naughty-list-api.40for40.workers.dev/community/` / `https://naughty-list-api.40for40.workers.dev` in Production. Read-back verified all six entries and preserved Joyo's existing callback defaults, CORS origins and preview hosts.
- Both real environments previously had empty Sign-out URI lists. Added Joyo and the voting page, with Joyo as the default: `http://localhost:5173/joyo/` in Staging and `https://build40for40.com/joyo/` in Production. Voting supplies its own explicit return destination. The WorkOS CLI failed to save redirect lists and rejected the existing staging wildcard origin; the application dashboard successfully saved those additions without removing the existing entries. Production CORS and both Sign-out lists were saved using the CLI.
- The shared application's Initiate login URI is unset. It remains unset: assigning the voting page globally would route Joyo's externally initiated logins into voting. A dedicated application or an agreed shared login router is still needed for independent external-login flows. The voting page's own `/community/login` route works, but that does not establish the global setting.
- Local credentials still use the original temporary sandbox. They have not been replaced, claimed or uploaded to Cloudflare. Supply the matching real Staging/Production key/client pair securely before using those environments; never send secret values through chat or committed files. Full account sign-in, refresh, verified-email voting and sign-out remain release checks.

## Product rules

The evidence assessment and community vote are independent. Community votes never set `scoring.total`, `scoring.verdict`, certification or an individual product claim. The community percentage is the fraction of current Nice votes among current Nice + Naughty votes. Display it only at **20 or more** eligible votes. Below that the API returns `nicePercentage: null` and the UI says “Early voting”. This is a participation floor, not a statistical confidence claim. Counts remain available in the detail view.

Not sure, excluded and expired votes do not count towards the floor or denominator. Votes expire after 12 calendar months, including leap-day clamping. Each email-verified WorkOS account has one current vote per reviewed brand; saving replaces it and renews its expiry. Withdrawing removes the vote. Staff, communities and environment are optional reason tags, not additional votes. No purchase, public comments or public profiles are required. Only aggregate counts are public.

Email verification establishes email access, not one unique human or truthful claims. The community score is self-selected opinion. It must never look like our evidence verdict or a representative poll.

## Identity and launch scope

`community_brands` is an explicit enrolment list, initially empty. An enrolled entity must have reviewed domain evidence and a `brand_shop` entry in `worker/relevance.js`. Domain assessment responses display community voting only when that exact hostname is eligible for a brand verdict. Regional hosts use the same company ID only when explicitly reviewed and mapped; retailer and marketplace evidence never flows into other product brands.

**H&M remains the launch target. Its reviewed registry entry is still missing.** Do not enable some other brand as a substitute. Finish the H&M source/identity review described in `docs/evidence.md`, seed its exact hosts, add its reviewed brand-shop category, then enrol the actual reviewed company ID:

```sql
INSERT INTO community_brands(company_id) VALUES('<reviewed-hm-company-id>');
```

Use the dedicated `naughty-list` database only. Never fabricate a company ID or certification to turn voting on. Test fixtures enrol Patagonia only in isolated test databases. Local manual preview can explicitly enrol Patagonia as technical coverage, without enabling it in production.

## Authentication reused from Joyo

Browser: `@workos-inc/authkit-js`, with an awaited `createClient`, hosted AuthKit sign-in and `devMode: true` as in Joyo. Refresh tokens persist in the hosted voting origin's local storage. This carries Joyo's accepted XSS/storage trade-off; the voting page has a restrictive CSP and renders data with textContent. The extension never holds or receives account tokens. It opens a fixed voting origin via its background script after resolving the sender's hostname again.

Worker: `jose` verifies RS256 signatures against WorkOS's per-client JWKS, the configured issuer and required subject/expiry/issued-at claims. The signed subject identifies the voter; the body cannot supply a user ID. Every own-vote read/write also retrieves that user through the WorkOS API and requires `email_verified === true`. Names and emails from the response are not stored or returned. Account lookup failure fails closed; it does not count an unverified vote.

The public assessment API still reads stored evidence only. WorkOS requests happen only when a signed-in person explicitly accesses their voting account, never for shopping lookups or public aggregates.

### Configuration and remaining live verification

1. Install dependencies and run `npm run community:build`. `npm run dev`, `npm run check` and `npm run deploy` build the page automatically. The Worker serves static voting assets at `/community/` on its existing origin. No separate website or extension identity permissions are needed.
2. Apply `0003_community.sql` to the dedicated database before using the updated Worker: `npm run wrangler -- d1 migrations apply naughty-list --local` (or explicitly `--remote` for deployment).
3. Reuse a complete key/client pair from the intended Joyo environment. Local `.dev.vars` is now configured from its temporary sandbox pair. The example leaves both fields blank to avoid combining a published client ID with a key from a different environment. Supply production `WORKOS_API_KEY` through `npm run wrangler -- secret put WORKOS_API_KEY`, with a matching `WORKOS_CLIENT_ID`. Do not copy production secrets into public files. Joyo's production public client ID is `client_01M6E5ZDQ9XBYYE28XYN7H3XTJ`; staging is `client_01M6E5ZDCH31RFHPJTD8N5JQZY`. These differ from its older local temporary sandbox. Never use the temporary pair in production.
4. `WORKOS_ISSUER` defaults to Joyo's `https://api.workos.com/user_management/<client-id>`. Check the actual environment's issuer and override this value if necessary. Do not accept arbitrary issuers or keys supplied by a browser.
5. The callback/CORS entries are registered in the reused temporary environment and the real Staging/Production environments. The real environments also have the voting Sign-out destinations, with Joyo remaining the default. See the verified setup above. Local temporary credentials do not grant access to either real environment.
6. `/community/login` is the SDK-backed Initiate login route. The real shared application's global setting is currently unset and remains a release decision: use a dedicated voting application or an agreed shared login router rather than routing Joyo's external logins into voting. Preserve Joyo's current callback defaults and origins.
7. Verify a complete account sign-in, the OAuth return, unverified-email rejection, verified voting, token refresh, sign-out returning to this page, and externally initiated sign-in. The local hosted sign-in entry points and callback/CORS registration have been checked, but these full account flows are **not verified by unit tests, reaching a sign-in page or a build**.
8. Deploy manually after the H&M review, authentication settings, privacy review and migrations. Update extension/store version and capture real browser release checks. Existing assessment caches refresh in at most five minutes after a vote; the voting page updates immediately.

When authentication variables are absent, public results remain available, and the UI explicitly says sign-in is not configured. There is no development fake-login path in the product.

Sources: [AuthKit JS](https://github.com/workos/authkit-js), [sessions and Sign-out URIs](https://workos.com/docs/authkit/sessions), [server-side user email verification field](https://workos.com/docs/reference/user-management/user).

## API

- `GET /v1/community/config`: public client ID, sign-in readiness and the minimum.
- `GET /v1/community/brands`: enrolled reviewed brand shops.
- `GET /v1/community/brands/:id`: public aggregate and brand name.
- `GET /v1/community/brands/:id/vote`: the signed-in verified account's own vote, including its expiry and exclusion state.
- `PUT /v1/community/brands/:id/vote`: `{ "choice": "nice|naughty|unsure", "reasons": ["staff", "communities", "environment"] }`; reasons may be omitted or empty. Requires Bearer access token.
- `DELETE /v1/community/brands/:id/vote`: withdraw the signed-in account's vote. Requires Bearer access token.

Own-vote routes return 401 for invalid/missing tokens, 403 for unverified email and 503 for missing authentication configuration or failed dependencies. Bodies are limited to 4096 bytes. Writes accept only the documented choice/reasons; the client cannot supply identity, totals, dates, expiry or moderation status. Unknown/unenrolled brands return 404.

## Abuse controls and moderation

An atomic account rate limit allows 10 write attempts per minute, including withdrawals. Thirty distinct accounts with recently updated votes for a brand within ten minutes create a review flag. Alerts do not automatically exclude votes or freeze the score. Repeated edits by one account cannot create 30 votes. A burst can represent real news and is not grounds for exclusion by itself.

Operators review pending flags using the existing Cloudflare profile:

```sh
npm run community:moderate -- queue
npm run community:moderate -- reviewed <brand-id> <window-start>
npm run community:moderate -- exclude <brand-id> <user-id> spam
npm run community:moderate -- restore <brand-id> <user-id> review_correction
```

Commands default to local D1. Add `--remote` explicitly to operate on production. Exclusion reasons are `spam`, `automation` or `coordinated_manipulation`. A low score, criticism or disagreement with our evidence is never sufficient grounds. Decisions are written to `community_moderation`; reversals are recorded too. This is an operator CLI, not a public administrative API. Inspect relevant rows through authenticated D1 tooling; never publish user IDs or include them in screenshots/issues. Support requests go to help@build40for40.com.

Excluded accounts retain a marker across withdrawal and revoting so edits cannot bypass review. Withdrawal clears their choice/reasons and expiry but retains the exclusion marker. Daily maintenance deletes expired non-excluded votes and rate-limit entries inactive for a day. Moderation records and exclusion markers remain until a reviewed account-data request is processed. This version does not claim that email verification and account limits eliminate multi-account abuse.

## Release/privacy checks

`publishing/privacy.md` inventories the additional account data and recipients. The voting page has a readable voting-specific privacy explanation; the final operator/platform retention notice remains a release requirement. Shopper lookup requests remain hostname-only and carry no account token. The user-triggered link passes the reviewed brand ID to the voting page. WorkOS receives authentication traffic only from that page or protected voting operations.
