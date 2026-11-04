# Browser release test matrix

Prepared on 4 November 2026. Automated DOM, messaging, caching and API tests cover the implemented 0.0.2 flow. A headless Firefox temporary-profile smoke check installed the generated add-on successfully. Visual and shopping-flow browser tests below remain unrun. Automated DOM tests do not establish visual compatibility in a real shopping session.

Record browser version, operating system, archive hash, date and result for each run. Use a clean test profile with fictional test inputs and no personal browsing data.

| Check | Chrome | Firefox | Expected evidence |
| --- | --- | --- | --- |
| Load unpacked / temporary add-on | Not run | Headless temporary-profile installation passed | Browser accepts the target manifest without errors |
| Name, icon and version | Not run | Not run | Correct metadata on the extensions page; icon readable in light/dark themes |
| Permissions and installation notices | Not run | Not run | Only actual feature permissions; declarations match behaviour |
| Supported shopping page / trigger | Not run | Not run | Intended overlay appears once, in the agreed location |
| Supported company lookup | Not run | Not run | Company match, certification evidence, source and date are accurate |
| Unknown and stale evidence | Not run | Not run | Unknown state; no inferred naughty/uncertified label |
| Variant or seller change / client-side navigation | Not run | Not run | Entity and displayed evidence update or clear correctly |
| Unsupported page / site | Not run | Not run | No misleading overlay or requests |
| Offline, timeout and backend failure | Not run | Not run | Clear recoverable state without blocking shopping |
| Privacy inspection | Not run | Not run | Network/storage behaviour matches disclosures; no unintended page fields |
| Keyboard, zoom and layout | Not run | Not run | Controls usable without obscuring purchase controls |
| Reload / disable / uninstall | Not run | Not run | No broken page or retained UI artifacts |
| Update from previous version | First release pending | First release pending | Same extension identity; data and behaviour migrate as intended |
| Install signed store release | Store submission pending | Store submission pending | Store installation matches the tested release |

## Loading the extension

Chrome: open `chrome://extensions`, enable Developer mode, choose **Load unpacked**, and select `extension/`.

Firefox: extract the Firefox ZIP into a temporary folder, open `about:debugging#/runtime/this-firefox`, choose **Load Temporary Add-on**, and select its `manifest.json`. Temporary loading is a development check, not production signing.

## Package-level checks completed

Both target archives use `manifest.json` at the root. The runtime allowlist includes icons, content/background/shared scripts and settings HTML/CSS. The Firefox package replaces Chrome's service worker with background scripts and includes its browser-specific data declaration. No application secrets, backend code, environment files or development dependencies are included.

Firefox validation must run against the generated Firefox package, not the Chrome source directory. Automated tests cover shopping vs review pages, hidden/disabled purchase controls, exact reviewed domain eligibility, unknown/retailer/marketplace exclusions, neutral B Corp handling, explicit verdict rendering, settings, sender-hostname checks, request minimisation and session caching. The DOM integration test renders the actual stamp and tests preference updates. No automated test asserts that every shopping website is supported.

The generated 0.0.2 Firefox package passed `web-ext lint` with zero errors, warnings or notices. `web-ext run` installed it in a new temporary headless profile using the installed Firefox binary. This verifies installation only, not a successful live lookup or visual layout. No active user profile was modified. Full Chrome installation and both browsers' visual/end-to-end checks remain release tasks. Backend changes were not deployed as part of this PR.
