# First store submission

Historical submission record for version 0.0.2, updated 4 November 2026. The prepared 0.0.3 release uses Elf Cam; current listing copy is in listing-elf-cam.txt and the current screenshots/status are in listing-review.md.

## Shared listing fields

- Name: The Naughty List
- Publisher: 40 for 40
- Support: help@build40for40.com
- Support website: https://github.com/build40for40/naughty-list/issues
- Homepage: https://build40for40.com/naughty-list
- Licence: MIT (approved by Ben on 4 November 2026)
- Category: Shopping
- Language: English (UK)
- Price: Free

## Summary

Check it twice before you buy. See reviewed business evidence, B Corp records, sources and check dates while you shop.

## Description

Ho ho hold on a sec, before you buy.

The Naughty List is Santa's little helper for Black Friday and Christmas shopping. On likely shopping pages, it shows a small information stamp with reviewed business evidence, sources and check dates.

What's in the sack:

- Business evidence, including B Corp certification records where available.
- Source links and check dates so you can check it twice.
- Settings to move the stamp to any corner or switch automatic checks off.
- A dismiss button for the current page, with a retry if a check fails.

We're starting small. Evidence coverage uses reviewed, exact website mappings. Unknown shops remain unknown. On a marketplace or multi-brand retailer, the website does not identify the selected seller or product manufacturer.

This version shows neutral information. Naughty-or-nice scoring is still being agreed. B Corp certification describes a company, not an individual product, and a missing record is not a naughty mark.

Shopping detection happens in your browser. On a likely shopping page, only the hostname is sent to our Cloudflare service to look up stored evidence. Product text, prices, page paths and page HTML are not sent. Results are cached for five minutes in the browser session. Settings stay on this device. There is no account or analytics SDK in the extension.

Made by 40 for 40. Questions, corrections or letters to Santa: help@build40for40.com

## Chrome privacy tab

Single purpose: Show reviewed business information, with evidence sources and check dates, while people shop online.

Storage: Remembers the automatic-check and stamp-position settings locally and caches up to 50 hostname assessments in browser-session storage for five minutes.

Website access: Reads product/offer metadata, price elements and purchase controls locally on HTTPS pages to detect likely shopping pages and insert the information stamp. Sends only the page hostname to the fixed assessment service.

API host: Contacts naughty-list-api.40for40.workers.dev to retrieve stored business evidence for the hostname. No arbitrary external code is downloaded or executed.

Remote code: No. All executable extension code is bundled. The API returns JSON evidence.

Data categories: Web history (the current hostname on candidate shopping pages), website content (product/offer metadata, price elements and purchase-control labels processed locally), and Location (the IP address processed by Cloudflare to deliver the request). Local processing must also be declared. Do not use the outdated H&M-only/no-data answers in launch/copy.md.

Use is limited to the extension's single purpose. No advertising, sale of data, credit decisions or unrelated tracking. Review the platform's exact certification statements before accepting them.

## Firefox reviewer notes

Choose a public listing on Mozilla Add-ons, rather than the self-distribution option on card 156. Use the Firefox ZIP, which contains the stable Gecko UUID and required browsingActivity declaration. The Chrome ZIP uses a service worker and must not be uploaded to Firefox.

All JavaScript is readable, bundled source with no build transformation, minification or remote executable code. No account or test credentials are required to use the extension. Enable automatic checks in its settings, then visit a product page with a priced offer and an enabled Add to basket/bag/cart control. Detection is heuristic. Expand Evidence and source on the stamp to inspect provenance. Unknown websites remain neutral. Disable automatic checks to stop new requests.

Desktop support must be tested before selecting operating systems. Android has not been tested; do not select Android for this release.

## Branding provenance

Samira's launch kit was retrieved from launch-assets commit 1f167232a30e6a536d2fc893764e3df07cde9a1e. The festive 16/32/48/128 PNGs replace the draft runtime icons. Editable originals and promotional art are retained in launch/.

Never upload the CONCEPT screenshots. Capture the actual installed extension. The title card may follow real product screenshots.

## Remaining release gates

- Real Chrome screenshots are in screenshots/: the unknown-shop stamp on an Allbirds product page and the installed settings page, captured at 1280×800 with device pixel ratio 1. JPEG exports are provided for the store's no-alpha requirement. These show the actual neutral 0.0.2 build, not the H&M concept.
- Chrome's existing unpacked 0.0.2 installation was reloaded from the release checkout. Settings loaded successfully. Selecting an available Allbirds size exposed the purchase button and triggered the neutral unknown stamp, which stayed clear of Add to Cart. Ben also confirmed the Firefox stamp and Settings smoke test in fresh Profile 1. H&M returned Access Denied, Patagonia returned unavailable/maintenance pages, and Tony's used an unsupported purchase-button label. The H&M browser check and broader manual test matrix remain incomplete; these observations do not establish universal site coverage.
- Public extension privacy notice is live at https://build40for40.com/privacy/ following site PR #28. A read-only check of the active Cloudflare script settings returned logpush=false, no tail consumers and no observability configuration. Application code does not log shopper lookups. This does not establish retention for Cloudflare's own operational/security records; do not make more specific platform retention claims.
- The live API now resolves www2.hm.com to H&M with reviewed brand_shop relevance and an unset verdict. The earlier missing-mapping/relevance blocker was resolved during preparation. H&M's website returned Access Denied in the browser test, so its live page/overlay check still needs completing.
- Chrome 0.0.2 was submitted, then its review was cancelled to correct the homepage and update the Elf Cam listing. The item is now Draft; the 0.0.3 package and current screenshots still need uploading. Item ID: lpmanenekkbbfhbaiedmnnalahdnldck. Listing text, UK English, Shopping category, icon, small promo tile, both real screenshots, privacy disclosures, all three approved data-use certifications and reviewer instructions are saved. Distribution is free/public/all regions. Ben confirmed keeping the existing non-trader declaration. Automatic publication is off: publish manually after approval. Chrome warns that broad host permissions may lengthen review. Dashboard: https://chrome.google.com/webstore/devconsole/08864d14-6fa6-42e2-a142-f34b551e4a17/lpmanenekkbbfhbaiedmnnalahdnldck/edit/status
- Mozilla's 40 for 40 profile is created and Ben accepted its distribution agreement. The final desktop-only Firefox ZIP was uploaded and validated with zero errors and the one documented Android warning. Android is deselected. Ben loaded the ZIP in fresh Profile 1 and confirmed that the neutral stamp and Settings button work on the Allbirds test page. The public listing form has the description, Shopping category, MIT licence, support details, privacy notice and reviewer instructions filled out. Ben explicitly requested leaving the prepared form open without submitting; do not click Submit Version without a new instruction. Form: https://addons.mozilla.org/en-GB/developers/addon/the-naughty-list/submit/details

The desktop-only package has zero web-ext errors and one Android-minimum-version warning: the linter checks the desktop 140 minimum against Android's 142 data-declaration floor even though Android is not opted in. Keep Android deselected in AMO. Mozilla documents that omitting gecko_android makes the extension available only on desktop: https://developer.mozilla.org/en-US/docs/Mozilla/Add-ons/WebExtensions/manifest.json/browser_specific_settings#firefox_gecko_properties

Chrome is back in Draft awaiting the 0.0.3 correction and resubmission. Firefox's final review submission and signing are deferred at Ben's request. The Firefox form has not been submitted or published; keep its tab open because the entered listing text may not survive closing the unsaved form.

## Current live capture check

Chrome 0.0.3 was loaded from the isolated release checkout. The live H&M product page matched H&M and its expanded case file correctly reported unknown current B Corp certification. Real badge, expanded case-file, Allbirds unknown-state and settings screenshots are in screenshots/elf-cam-*. These resolve the earlier live H&M capture blocker. The earlier 0.0.2 images and limitations above are retained as historical test records, not the proposed current store gallery. The homepage is live and is saved on Chrome; Firefox's held website field points to the same product page.
