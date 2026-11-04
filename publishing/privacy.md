# Privacy preparation

Internal publication draft, 4 November 2026. This is an implementation inventory and a list of unresolved disclosures, not a published policy for the final product.

## Verified current extension behaviour

The packaged scaffold contains only a manifest and icons. It has no scripts, page access, storage permissions, account system, analytics, network calls or connection to the backend. The prepared Firefox package therefore declares no data collection for this scaffold only.

This statement stops being sufficient as soon as extension functionality is added. Recheck the archive and the actual network/storage behaviour before making store declarations.

## Separate backend

The backend is a public Cloudflare Worker at `naughty-list-api.40for40.workers.dev`. It receives company lookup inputs, compares them with a small manually maintained registry and returns evidence. At the time of this preparation, the extension does not call it.

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
