# Publication preparation

Prepared on 4 November 2026 for Superthread card #152, **Publish extension: common steps**.

The extension now implements Elf Cam badge mode on two reviewed stores and calls the backend. These materials prepare publication; they do not establish that the extension is ready to submit.

## Manifest information

| Field | Prepared value | Status |
| --- | --- | --- |
| Manifest format | `3` | Set |
| Name | The Naughty List | Set |
| Short name | Naughty List | Set |
| Version | `0.0.1` | Current prerelease version |
| Description | The Naughty List browser extension. Built for Black Friday and Christmas shopping. | Updated to describe Elf Cam; review against store listing copy before submission |
| Author | 40 for 40 | Project name, not a registered publisher identity |
| Homepage | Repository URL | Existing project URL |
| Icons | PNG at 16, 32, 48 and 128 pixels | Draft artwork included; editable source is `publishing/icon.svg` |
| Chrome extension ID | Assigned by the Chrome Web Store | Not yet available; do not invent or change the signing identity |
| Firefox add-on ID | `{c2591c57-0224-4d4a-bdb4-a3223e58c354}` | Generated stable UUID in the Firefox overlay; uniqueness checked by AMO on first signing |
| Firefox minimum version | Desktop `140.0`, Android `142.0` | Declaration compatibility floors; Android support has not been selected or tested |
| Firefox data collection | `required: ["none"]` | **Out of date.** The extension now sends the store hostname to the Worker; choose the correct category before submission |
| Permissions / host permissions | `storage`; no host permissions | `storage` remembers which stores showed the intro today. The Worker allows CORS, so no API host permission is needed |
| Content scripts / background / action | Content scripts on the four reviewed store hostnames; background service worker (Firefox: background script); no action | Test keeps matches in sync with the registry |
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

- `dist/naughty-list-chrome-0.0.1.zip`
- `dist/naughty-list-firefox-0.0.1.zip`

Both contain `manifest.json` at the root, the three runtime scripts, `icons/` and `fonts/`. The packaging script copies an explicit runtime allowlist into a temporary staging directory and rejects unreviewed root files or symlinks. It does not include the backend, dependencies, environment files or publication drafts. Review the allowlist when extension functionality adds files. `dist/` is ignored by Git.

Validate an archive before upload:

```sh
unzip -l dist/naughty-list-chrome-0.0.1.zip
unzip -p dist/naughty-list-firefox-0.0.1.zip manifest.json
```

## Common card progress

| Checklist item | Preparation | Remaining work |
| --- | --- | --- |
| Release version | `0.0.1` set | Increase when cutting a later release |
| Runtime-only package | Chrome and Firefox archives built and inspected | Rebuild after implementation changes |
| Browser installation and functionality tests | [Test matrix](testing.md) prepared | Run against actual supported browsers and working extension |
| Metadata, icons, screenshots, support, privacy | [Metadata](store-metadata.md), draft icons and [privacy preparation](privacy.md) prepared | Real UI screenshots, final implemented-feature copy, publisher details, licence and hosted privacy notice |
| Later releases | [Update procedure](updates.md) prepared | Future action after the first store listing exists |

## Submission blockers

1. The extension has no useful shopper-facing behaviour yet. Do not submit a metadata-only scaffold as a finished product.
2. Decide and implement the supported sites, trigger and overlay. Current backend B Corp evidence is not an overall ethical score or a product certification.
3. Capture screenshots of the actual implemented extension. No fabricated UI screenshot has been supplied.
4. Finalise data handling, consent, permissions and privacy disclosures from the implementation and Cloudflare account configuration. The scaffold's `none` declaration must not carry over automatically.
5. Confirm the store publisher's identity and accounts, the software licence and the public privacy-policy URL. No store account or licence has been invented.
6. Complete browser installation, functionality and update testing. Source checks and backend tests are not browser tests.

## Official references

- [Chrome manifest fields](https://developer.chrome.com/docs/extensions/reference/manifest)
- [Chrome store image requirements](https://developer.chrome.com/docs/webstore/images)
- [Chrome user-data disclosure requirements](https://developer.chrome.com/docs/webstore/program-policies/user-data-faq)
- [Firefox browser-specific manifest fields and data declaration](https://developer.mozilla.org/en-US/docs/Mozilla/Add-ons/WebExtensions/manifest.json/browser_specific_settings)
- [Firefox packaging](https://extensionworkshop.com/documentation/publish/package-your-extension/)
- [Firefox submission and updates](https://extensionworkshop.com/documentation/publish/submitting-an-add-on/)
