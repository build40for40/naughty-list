# Publication preparation

Prepared on 4 November 2026 for Superthread card #152, **Publish extension: common steps**.

Version 0.0.2 implements local shopping detection, hostname-only backend lookup, an evidence stamp and position/enable settings. Scoring is deferred, so the current backend produces neutral states. Store submission and real browser compatibility testing are still pending.

## Manifest information

| Field | Prepared value | Status |
| --- | --- | --- |
| Manifest format | `3` | Set |
| Name | The Naughty List | Set |
| Short name | Naughty List | Set |
| Version | `0.0.2` | Shopping overlay prerelease |
| Description | Source-backed business information on shopping pages | Full description is in the manifest; no promise of universal coverage |
| Author | 40 for 40 | Project name, not a registered publisher identity |
| Homepage | Repository URL | Existing project URL |
| Icons | PNG at 16, 32, 48 and 128 pixels | Draft artwork included; editable source is `publishing/icon.svg` |
| Chrome extension ID | Assigned by the Chrome Web Store | Not yet available; do not invent or change the signing identity |
| Firefox add-on ID | `{c2591c57-0224-4d4a-bdb4-a3223e58c354}` | Generated stable UUID in the Firefox overlay; uniqueness checked by AMO on first signing |
| Firefox minimum version | Desktop `140.0`, Android `142.0` | Declaration compatibility floors; Android support has not been selected or tested |
| Firefox data collection | `required: ["browsingActivity"]` | Shopping hostname sent to the API; no page contents or signal flags transmitted |
| Permissions / host permissions | `storage`; fixed API origin | Preferences and session cache; background API access |
| Content scripts | HTTPS sites, top frame only | Product/offer, price and purchase signals evaluated locally |
| Background | Chrome service worker; Firefox scripts | Sender validation, lookup and session cache |
| Options | `options.html` | Enable/disable and four corner positions |
| Update URL | Absent | Store-managed updates; revisit only if self-distribution is chosen |
| Localisation | Not configured | No locale bundles; no `default_locale` claim |

`extension/manifest.json` is the Chrome source manifest. `publishing/manifest.firefox.json` is an overlay, not a standalone runnable manifest. Packaging merges it into the Firefox archive and leaves it out of the Chrome archive. The Firefox UUID is a technical add-on identifier, not an email address, credential or publisher identity. Preserve it for future updates.

The icon is a simple original vector list on a festive red tile, with transparent outer padding. PNG exports were rendered from the SVG with `@resvg/resvg-js`; they contain no camera or location metadata. This is a draft project asset, not an approved final brand identity. Keep the source outside the runtime package.

## Build the archives

Requires Node.js and the `zip` executable, available by default on macOS and the Ubuntu CI runner.

```sh
npm run extension:package:chrome
npm run extension:package:firefox
```

Outputs:

- `dist/naughty-list-chrome-0.0.2.zip`
- `dist/naughty-list-firefox-0.0.2.zip`

Both contain `manifest.json` at the root, four icons, packaged scripts and the options HTML/CSS. The packaging script uses an explicit runtime allowlist and rejects unreviewed root files or symlinks. It does not include the backend, dependencies, environment files or publication drafts. `dist/` is ignored by Git.

Validate an archive before upload:

```sh
unzip -l dist/naughty-list-chrome-0.0.2.zip
unzip -p dist/naughty-list-firefox-0.0.2.zip manifest.json
```

## Common card progress

| Checklist item | Preparation | Remaining work |
| --- | --- | --- |
| Release version | `0.0.2` set | Increase when cutting a later release |
| Runtime-only package | Chrome and Firefox archives built and inspected | Rebuild after implementation changes |
| Browser installation and functionality tests | [Test matrix](testing.md) prepared | Run against actual supported browsers and working extension |
| Metadata, icons, screenshots, support, privacy | [Metadata](store-metadata.md), draft icons and [privacy preparation](privacy.md) prepared | Real UI screenshots, final implemented-feature copy, publisher details, licence and hosted privacy notice |
| Later releases | [Update procedure](updates.md) prepared | Future action after the first store listing exists |

## Submission blockers

1. Agree the naughty/nice scoring rule if the release promises verdicts. Current evidence remains neutral and B Corp is not a product certification.
2. Review and deploy the backend relevance changes, and seed the reviewed regional hostname mappings before end-to-end release testing. This PR does not deploy them.
3. Capture screenshots of the actual implemented extension. No fabricated UI screenshot has been supplied.
4. Host the privacy notice after confirming Cloudflare platform logging/retention and the operator details. The Firefox declaration now covers hostname transmission; Chrome disclosures also need to cover local page-content processing.
5. Confirm the store publisher's identity and accounts, the software licence and the public privacy-policy URL. No store account or licence has been invented.
6. Complete browser installation, functionality and update testing. Source checks and backend tests are not browser tests.

## Official references

- [Chrome manifest fields](https://developer.chrome.com/docs/extensions/reference/manifest)
- [Chrome store image requirements](https://developer.chrome.com/docs/webstore/images)
- [Chrome user-data disclosure requirements](https://developer.chrome.com/docs/webstore/program-policies/user-data-faq)
- [Firefox browser-specific manifest fields and data declaration](https://developer.mozilla.org/en-US/docs/Mozilla/Add-ons/WebExtensions/manifest.json/browser_specific_settings)
- [Firefox packaging](https://extensionworkshop.com/documentation/publish/package-your-extension/)
- [Firefox submission and updates](https://extensionworkshop.com/documentation/publish/submitting-an-add-on/)
