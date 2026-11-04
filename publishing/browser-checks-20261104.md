# Browser and live-service checks, 4 November 2026

## Completed

Installed the actual unpacked extension in Chrome for Testing 156.0.8078.4, using a new temporary profile. No existing browser profile was modified.

A labelled fictional shopping page on the reserved `shop.example.test` hostname exercised real extension scripts and the live Cloudflare API. Verified:

- Product/offer and purchase-control detection displays a neutral unknown stamp.
- A purchase button in the preferred corner is not covered.
- Choosing top left in the actual options page moves the existing stamp.
- Disabling removes the stamp; preferences persist after reloading options.
- Dismissal hides the current page's stamp; a page reload restores it.
- Only `{"domain":"shop.example.test"}` is transmitted to the assessment API. One request serves repeated checks in the session cache.

The [settings screenshot](screenshots/settings-validated-20261104.png) captures the installed extension's real options page at 1280×800. The controlled shopping-fixture capture is intentionally excluded from store materials. It is not a screenshot of a live retailer.

Live API checks passed for H&M and Tony's UK hostnames after seeding and deployment. H&M resolves with reviewed identity and unknown certification; verdict and score remain null. Tony's regional host resolves as a reviewed brand shop.

## Limitations

H&M returned an Access Denied page to the isolated automated browser. No CAPTCHA, security warning or access restriction was bypassed. A live H&M product-page visual check, including actual size selection and responsive layout, remains a manual release gate. Other retail sites and Firefox live visual flows have not been verified by this run. The prior headless Firefox temporary-install and lint checks are recorded in testing.md.

The Chrome Web Store extensions gallery cannot be scripted through the available browser connector. Native access is unavailable while the Mac is locked. No store form was submitted or account security setting changed during this pass.
