# Privacy preparation

Internal publication draft, 4 November 2026. This is an implementation inventory and a list of unresolved disclosures, not a published policy for the final product.

## Verified current extension behaviour

Elf Cam badge mode, added 4 November 2026:

- **Page access:** content scripts run only on `patagonia.com`, `www.patagonia.com`, `tonyschocolonely.com` and `www.tonyschocolonely.com`. They read no page content; they add an overlay and badge in a closed shadow root.
- **Sent to the Worker:** the current tab's hostname only, as `{ "domain": "<hostname>" }`, without cookies. No URL path, query, title, product or account data. The lookup happens on each page load on those sites, cached in the background worker for up to an hour while it stays alive.
- **Stored locally:** `chrome.storage.local` keeps `introSeen:<hostname>` with the date the intro was last shown. Nothing else.
- **Not present:** analytics, accounts, remote code or third-party requests. The font is bundled.

The Firefox `data_collection_permissions` declaration still says `none` and is now out of date: sending the visited store's hostname is likely to count as browsing activity under Mozilla's definitions. Decide the category before any Firefox submission. The Chrome Web Store privacy disclosures need the same review.

## Separate backend

The backend is a public Cloudflare Worker at `naughty-list-api.40for40.workers.dev`. It receives company lookup inputs, compares them with a small manually maintained registry and returns evidence. The extension calls it as described above.

The Worker code does not itself write requests to a database or call an external research provider. Do not infer from this that there are no server or network logs. Cloudflare may process connection information, and the account's observability, security and retention settings have not been audited for this release preparation. Those settings need to be checked before publishing retention, deletion, IP-address or third-party processing claims.

## Disclosure work when the extension is connected

Record and verify:

- Exact page information read: business name, identifier, hostname, product information or other fields.
- Whether any of that information is stored locally, cached, sent to the Worker or logged.
- Whether the page URL, title, selected product, browsing activity or tracking parameters are transmitted. Prefer only what the lookup needs; never assume that local-only processing has no Chrome disclosure requirements.
- Required site permissions and permission explanations based on actual behaviour.
- Cloudflare processing, application/platform logs, retention periods, deletion/correction process and any later providers.
- Whether a consent prompt or Firefox data-collection declaration must change before transmission.
- Whether analytics, error tracking or other telemetry is introduced. The shared project's use of PostHog does not establish that this extension has analytics.

Then prepare a public notice that names the operator and support contact, explains data categories and purpose, identifies recipients, states confirmed retention/deletion practices, and explains any user controls. Use `hello@40for40.app` as the existing project support contact. Hosting URL and operator details remain to be confirmed.

Do not claim “we collect no data”, “we never log IP addresses”, “all processing stays on-device”, or a fixed retention period for a connected release without verifying those statements.

## Firefox declaration

`publishing/manifest.firefox.json` currently uses `required: ["none"]`. This accurately describes the scaffold but not necessarily a future connected overlay. Mozilla requires new submissions to declare data collection; sending page-derived information may require categories such as website content or browsing activity, depending on the final implementation. Use Mozilla's definitions to choose the declaration rather than copying an example blindly.

## Sources

- [Chrome user-data FAQ](https://developer.chrome.com/docs/webstore/program-policies/user-data-faq): disclosure applies to data handled locally as well as remotely, and includes web content and browsing activity.
- [Firefox manifest declarations](https://developer.mozilla.org/en-US/docs/Mozilla/Add-ons/WebExtensions/manifest.json/browser_specific_settings): required data categories and add-on identity.
- [Firefox submission](https://extensionworkshop.com/documentation/publish/submitting-an-add-on/): privacy policy for data transmitted from the device.
