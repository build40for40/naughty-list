# Privacy preparation

Internal publication draft, 4 November 2026. This is an implementation inventory and a list of unresolved disclosures, not a published policy for the final product.

## Implemented extension behaviour

Version 0.0.2 runs content scripts on HTTPS pages in the top frame. It reads limited structured Product/Offer data, price elements and purchase-control labels locally to decide whether the page is likely a shopping page. Product markup alone does not trigger a lookup. Local navigation checks compare the current URL to update or dismiss the stamp; that URL is not transmitted.

On a candidate page, the background script sends a JSON body containing only `{ "domain": "the-page-hostname" }` to the fixed HTTPS Naughty List API. No page path, query string, product title, price, page HTML, shopping-signal flags, cookies or full browsing history are included. Requests omit credentials and referrers. Normal HTTP/network connection information still reaches Cloudflare.

The extension stores enable/disable and corner-position preferences in `storage.local`. It stores up to 50 hostname assessment results in `storage.session`, with five-minute validity. These results are not synced to another device. Expired cache entries are ignored and removed during subsequent cache writes; browser-session storage is cleared when the browser session ends. There is no analytics SDK or extension-generated tracking identifier. Turning automatic checks off stops new lookups and removes the stamp; it cannot retract a request already sent.

## Separate backend

The backend is a public Cloudflare Worker at `naughty-list-api.40for40.workers.dev`. It receives the hostname, uses exact reviewed identity selectors in D1 and returns stored evidence. Its domain relevance module uses reviewed categories, not a live classifier or arbitrary URL fetch. Shopper requests do not initiate external research. Separate scheduled importers refresh selected public evidence sources without receiving shopper hostnames.

The request handler does not write shopper lookup inputs to the evidence database or log them in application code. Do not infer from this that there are no server or network logs. Cloudflare may process connection information, and the account's observability, security and retention settings have not been audited for this release preparation. Confirm those settings before publishing retention, deletion, IP-address or third-party processing claims.

## Remaining public notice work

Record and verify:

- Exact page information read: business name, identifier, hostname, product information or other fields.
- Whether any of that information is stored locally, cached, sent to the Worker or logged.
- Whether the page URL, title, selected product, browsing activity or tracking parameters are transmitted. Prefer only what the lookup needs; never assume that local-only processing has no Chrome disclosure requirements.
- Required site permissions and permission explanations based on actual behaviour.
- Cloudflare processing, application/platform logs, retention periods, deletion/correction process and any later providers.
- Whether a consent prompt or Firefox data-collection declaration must change before transmission.
- Whether analytics, error tracking or other telemetry is introduced. The shared project's use of PostHog does not establish that this extension has analytics.

Then prepare a public notice that names the operator and support contact, explains data categories and purpose, identifies recipients, states confirmed retention/deletion practices, and explains any user controls. The current Chrome publisher is 40 for 40 Ltd and support is `help@build40for40.com`. Confirm the final notice's operator details and hosting URL before submission.

Do not claim “we collect no data”, “we never log IP addresses”, “all processing stays on-device”, or a fixed retention period for a connected release without verifying those statements.

## Firefox declaration

`publishing/manifest.firefox.json` uses `required: ["browsingActivity"]` because candidate page hostnames are sent for the lookup. Extracted page content and signal flags are not transmitted. Chrome's store disclosures must also cover local processing of web content and browsing activity. Changes that transmit more than the hostname require a fresh implementation/declaration review.

## Sources

- [Chrome user-data FAQ](https://developer.chrome.com/docs/webstore/program-policies/user-data-faq): disclosure applies to data handled locally as well as remotely, and includes web content and browsing activity.
- [Firefox manifest declarations](https://developer.mozilla.org/en-US/docs/Mozilla/Add-ons/WebExtensions/manifest.json/browser_specific_settings): required data categories and add-on identity.
- [Firefox submission](https://extensionworkshop.com/documentation/publish/submitting-an-add-on/): privacy policy for data transmitted from the device.
