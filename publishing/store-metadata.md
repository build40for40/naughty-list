# Store metadata preparation

Internal draft, 4 November 2026. The described functionality is implemented in 0.0.2; complete browser tests and review the final release before submitting.

## Known details

| Field | Value |
| --- | --- |
| Product name | The Naughty List |
| Project | 40 for 40 |
| Homepage | https://github.com/build40for40/naughty-list |
| Project website | https://build40for40.com |
| Support email | help@build40for40.com |
| Chrome publisher | 40 for 40 Ltd |
| Support website | https://github.com/build40for40/naughty-list/issues |
| Current version | 0.0.2 |
| Current icon | `extension/icons/icon-128.png` |
| Language of prepared copy | English |

These are project details from the current shared context. Ben's Chrome developer account is registered as 40 for 40 Ltd. Trader details, domain verification and software licence still need the release checks; project author metadata is not a substitute for account verification.

## Copy for the implemented MVP

Short description:

> See source-backed business information on shopping pages. Ethical verdicts appear only when a reviewed assessment is available.

Reviewer preparation notes:

> The extension checks product/offer, price and purchase-control signals locally on HTTPS pages. On a likely shopping page it sends only the hostname to the Cloudflare Worker, which reads reviewed evidence from D1. A fixed stamp displays neutral evidence/unknown states and supports explicit future verdicts for eligible reviewed brand shops. Position and automatic checks are configurable. There is no seller extraction, product-level ethical rating or per-request AI research. Overall scoring and verdicts remain deferred. Backend relevance changes must be reviewed and deployed before release testing.

Suggested longer description:

> A little context for Black Friday and Christmas shopping. The Naughty List looks for shopping signals on the page and shows reviewed business information, with sources and check dates. Move the information stamp to any corner, dismiss it for the current page, or turn automatic checks off in settings.
>
> Coverage is limited. H&M is the first launch target, but its reviewed identity/evidence entry is not present yet and must remain unknown. Patagonia and Tony's Chocolonely are technical coverage examples, including explicitly reviewed Tony's UK and US websites. Unknown websites and multi-brand retailers or marketplaces do not receive product-brand verdicts. Current ethical scoring is still being agreed, so the stamp shows evidence without calling a business naughty or nice. A B Corp record describes a business, not an individual product.
>
> Shopping signals stay on your device. On a candidate page only its hostname is sent to our Cloudflare service; product text, prices and page paths are not sent. Results are cached for up to five minutes in this browser session. Your settings stay on this device.

## Coverage and permission explanations

The single purpose is to show reviewed business information during shopping. HTTPS site access is needed to detect the combination of shopping signals and place the stamp. `storage` is used for local preferences and an expiring browser-session result cache. The background script contacts only the fixed Naughty List API origin. No tab-history or cookie permissions are requested.

Detection is heuristic, not a guarantee that every store works. It requires a priced product/offer and an actionable purchase control, rather than Product markup alone. The backend checks exact reviewed hostnames; it does not inspect arbitrary websites or infer marketplace sellers. Stale evidence and unknown identities remain neutral.

Avoid promises of universal site support, automatic research, instant seller resolution, product-level certification, carbon calculations or overall ethical scores while those features are absent. B Corp certification must not be described as proof that an individual product is ethical.

## Images

Draft manifest icons are included at 16, 32, 48 and 128 pixels. The 128-pixel image includes transparent padding around 96-pixel square artwork and is PNG, matching the Chrome store format requirement. Inspect the icon in both light and dark browser themes before release.

Chrome requires a store icon and at least one real screenshot. Capture the finished extension at 1280×800 or 640×400, using a clean test profile with no personal information. Take a second screenshot of the unknown/evidence-missing state if that is part of the final product. Review current Firefox upload requirements in AMO when preparing its screenshots; do not assume every Chrome asset is accepted unchanged.

Optional promotional images can be deferred. Chrome's small promotional image is 440×280 and its marquee image is 1400×560. These are not substitutes for the mandatory screenshot.

## Final dashboard values to confirm

- Publisher name, legal/trader status and contact details.
- Chrome category and Firefox category/categories.
- Distribution regions, visibility and supported platforms.
- Licence for the extension and all bundled assets/dependencies.
- Publicly hosted privacy-policy URL.
- Final single-purpose description, permission justifications and data-use declarations.
- Test instructions and any test credentials, only if the implemented product needs them.

References: [Chrome images](https://developer.chrome.com/docs/webstore/images), [Chrome publishing](https://developer.chrome.com/docs/webstore/publish), [Firefox submission](https://extensionworkshop.com/documentation/publish/submitting-an-add-on/).
