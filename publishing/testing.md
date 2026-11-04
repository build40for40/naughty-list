# Browser release test matrix

Prepared on 4 November 2026. None of the manual browser rows below has been run. There is no overlay or company lookup UI in the extension yet. Backend tests do not establish extension functionality.

Record browser version, operating system, archive hash, date and result for each run. Use a clean test profile with fictional test inputs and no personal browsing data.

| Check | Chrome | Firefox | Expected evidence |
| --- | --- | --- | --- |
| Load unpacked / temporary add-on | Not run | Not run | Browser accepts the target manifest without errors |
| Name, icon and version | Not run | Not run | Correct metadata on the extensions page; icon readable in light/dark themes |
| Permissions and installation notices | Not run | Not run | Only actual feature permissions; declarations match behaviour |
| Supported shopping page / trigger | Awaiting implementation | Awaiting implementation | Intended overlay appears once, in the agreed location |
| Supported company lookup | Awaiting implementation | Awaiting implementation | Company match, certification evidence, source and date are accurate |
| Unknown and stale evidence | Awaiting implementation | Awaiting implementation | Unknown state; no inferred naughty/uncertified label |
| Variant or seller change / client-side navigation | Awaiting implementation | Awaiting implementation | Entity and displayed evidence update or clear correctly |
| Unsupported page / site | Awaiting implementation | Awaiting implementation | No misleading overlay or requests |
| Offline, timeout and backend failure | Awaiting implementation | Awaiting implementation | Clear recoverable state without blocking shopping |
| Privacy inspection | Awaiting implementation | Awaiting implementation | Network/storage behaviour matches disclosures; no unintended page fields |
| Keyboard, zoom and layout | Awaiting implementation | Awaiting implementation | Controls usable without obscuring purchase controls |
| Reload / disable / uninstall | Not run | Not run | No broken page or retained UI artifacts |
| Update from previous version | First release pending | First release pending | Same extension identity; data and behaviour migrate as intended |
| Install signed store release | Store submission pending | Store submission pending | Store installation matches the tested release |

## Loading the prepared scaffold

Chrome: open `chrome://extensions`, enable Developer mode, choose **Load unpacked**, and select `extension/`.

Firefox: extract the Firefox ZIP into a temporary folder, open `about:debugging#/runtime/this-firefox`, choose **Load Temporary Add-on**, and select its `manifest.json`. Temporary loading is a development check, not production signing.

## Package-level checks completed

Both draft archives were built with `manifest.json` at the root. The file inventory contains only the manifest and four PNG icons. The Firefox package includes its browser-specific overlay; the Chrome package does not. No application secrets, backend code, environment files or development dependencies are included.

The Firefox package passed `web-ext lint` with zero errors, warnings or notices. The source Chrome manifest intentionally has no Firefox-specific fields; Firefox validation must run against the generated Firefox package, not the Chrome source directory. Icon PNG dimensions were checked at all four sizes, and the 128-pixel draft was visually inspected. JSON field lengths and packaging-script syntax passed local checks.
