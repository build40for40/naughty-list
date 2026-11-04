# Versioning and later releases

The current prerelease version is `0.0.1`. There is no published store listing yet. This procedure prepares future updates; no update has been uploaded.

1. Increase `extension/manifest.json`'s numeric version. Keep Chrome and Firefox on the same release number unless a browser-specific release needs an explicit divergence. Chrome versions use one to four integer components, each from 0 to 65535; avoid leading zeroes and an all-zero version.
2. Preserve the Firefox add-on ID in `publishing/manifest.firefox.json`. Preserve the Chrome Web Store listing/signing identity. Do not create a new store item just to ship an update.
3. Review runtime files, permissions, privacy disclosures and the Firefox data-collection declaration for the new behaviour. Update the packaging allowlist deliberately.
4. Rebuild both target ZIPs. Verify the version and inventory of each archive. Run the browser matrix and test the upgrade from the previously published version, including any storage migration.
5. Record release notes and archive hashes. Keep a copy of the tested release artifacts outside the public source tree if needed; `dist/` is ignored.
6. Upload the correct ZIP to the existing Chrome listing and Firefox add-on version page. Provide source/build instructions if required. Complete any new review or declaration requirements.
7. After store availability, install the update through each store and verify the version and functionality. Keep earlier code/artifacts available for diagnosis. A rollback may need a new, higher version number under the same identity.

Initial release notes draft:

> 0.0.1 prepares the extension manifest, icons and packaging. It does not yet implement a shopping overlay or company lookup interface.

Replace these release notes when publishing useful functionality. Do not market the scaffold as a completed product.

References: [Chrome version format](https://developer.chrome.com/docs/extensions/reference/manifest/version), [Firefox update submission](https://extensionworkshop.com/documentation/publish/submitting-an-add-on/).
