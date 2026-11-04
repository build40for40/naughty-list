# The Naughty List

A Chrome extension for Day 3 of [40 for 40](https://build40for40.com).

This is a bare scaffold. The extension loads but has no behaviour yet. Product decisions are recorded in [AGENTS.md](AGENTS.md).

## Load locally

1. Clone this repository.
2. Open `chrome://extensions` in Chrome.
3. Enable **Developer mode**.
4. Click **Load unpacked** and select the repository's `extension/` folder.

No dependencies or build step are required. After changing extension files, click **Reload** on its card in `chrome://extensions`.

## Check the manifest

With [jq](https://jqlang.github.io/jq/) installed, run the same check as CI from the repository root:

```sh
jq -e '
  .manifest_version == 3 and
  (.name | type == "string" and length > 0 and length <= 75) and
  (.version | type == "string" and test("^[0-9]{1,5}([.][0-9]{1,5}){0,3}$"))
' extension/manifest.json
```

The check validates JSON syntax and basic required manifest fields. Chrome validates the full manifest when loading the extension.
