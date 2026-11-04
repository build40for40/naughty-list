# The Naughty List: store and site copy (draft)

Drafted 4 November 2026 for Superthread card 156. For Samira to review. Nothing here has been pasted into a store.

**Rule this copy follows** (from `AGENTS.md`): today the backend returns **B Corp certification evidence** only, with a source and a check date. There is no naughty/nice verdict until the scoring card (157) is agreed. A brand that isn't found shows as *unknown*, never naughty. So the "today" copy promises B Corp evidence and nothing more. The "later" copy is held back for when verdicts exist.

**Decided by Samira, 4 Nov afternoon:**
- Support email: **help@build40for40.com**
- Icon: the festive icon in `store/` (red tile, Santa's scroll, gold "checked" badge). Replaced the 40(40) navy one after Ben's steer to go more Christmassy
- Scope: **one brand, H&M**, on H&M's own shop (hm.com)
- Chrome developer account: **Ben owns it**, published as 40 for 40 (the company)
- **Ship with B Corp only** (Samira, 4 Nov 15:10): launch now with H&M's B Corp result on the brand badge; don't wait for scoring card 157

Every `[square bracket]` is something the build still has to confirm before this goes live.

**H&M result (from Ben's assessment code, 4 Nov 15:10).** H&M is now in the registry on branch `hm-registry` (commit 8aee2d1, waiting for Ben to review and merge). I searched the B Lab directory for "H&M", "H&M Group" and "Hennes & Mauritz" and found no H&M listing, so it's recorded as a hand-checked *not certified*. Ben's `assess()` returns, for `{brand: "H&M"}`, `www2.hm.com` and `www.hm.com`:

- match: **matched** (H&M)
- B Corp: **status verified · certified: false**
- source: B Lab directory search · checked 2026-11-04 · recheck by 2026-12-04
- scoring: **deferred** (no total, no verdict) until card 157

So the honest message today is: *H&M isn't a Certified B Corp, here's the source and date, and that's one fact, not a verdict.* Copy must never turn "not a B Corp" into "naughty" (most companies aren't B Corps).

## What Elf Cam shows on H&M today (Lawrence's PR #6, rendered from his code)

Card 158: single-brand shops get a badge. Lawrence built it as **Elf Cam**, a North Pole CCTV parody (black, phosphor green, REC red, VT323). The strings below come from his `verdict.js` and `content.js`, fed with Ben's H&M result.

- **Intro (first visit each day, ~4s):** REC · CAM 01 · WWW2.HM.COM · SUBJECT: H&M (BRAND) · **SUBJECT UNIDENTIFIED** · "No current evidence either way. No verdict."
- **Corner badge:** **UNIDENTIFIED** · No verdict
- **Case file:** Subject: H&M (the company behind this store) · Evidence: "No current evidence either way. No verdict." · Verdict: "Pending. Santa hasn't agreed his rules yet" · Source: B Lab · Checked: 4 Nov 2026 · Scope: The company, not individual products · "Not being on the list isn't the same as being naughty. The elves just haven't vouched for this one yet."

**⚠️ Wording flag for Lawrence:** `verdict.js` treats "checked, not certified" the same as "no evidence", so H&M's evidence line reads "No current evidence either way" while the same case file shows a B Lab source and a 4 Nov check date. We did check, and H&M isn't in the directory. Suggested evidence line for that case: *"Not in the B Lab directory of Certified B Corps."* It would stay grey and Unidentified, with no verdict. The script and captions avoid quoting the evidence line until this is settled.

## Voice

Ben's steer (4 Nov): it's Santa's idea, so it should feel like Christmas, not a compliance report. Playful, warm, pun-happy, and no 40 for 40 branding beyond a small "made by" credit. The puns never change the facts: we still only show B Corp status, the source and the date, and never call a brand naughty.

Pun bank (use freely): Elf Cam is rolling · caught on Elf Cam · the brands are on camera, not you · case file · subject unidentified · check it twice · sleigh informed · yule know before you buy · ho ho hold on · elf-explanatory · what's in the sack · coming down the chimney · no coal · Santa's little helper · under the tree · season's readings

## Chrome Web Store: today's version

**Name:** The Naughty List

**Summary** (Chrome limit 132 characters, this is 125):

> Who's been naughty or nice? Elf Cam puts the company behind the gift on camera: evidence, source and date. Starting with H&M.

**Description:**

> Ho ho hold on a sec, before you buy.
>
> At Christmas every brand's ads are merry and bright. But who's actually been nice to their workers, their communities and the planet? The Naughty List is Santa's little helper for your shopping: it checks the company behind the gift so you don't have to.
>
> We're starting small (even Santa started with one sleigh). This first version works on H&M's online shop. Open a product page and Elf Cam goes live for a few seconds, then shrinks to a badge in the corner. Click it for the case file: what our elves have on the company, where it came from (starting with the B Lab directory of Certified B Corps) and when they last checked. Elf Cam watches brands, not you.
>
> What's in the sack
> • One shop to start, H&M, checked by hand. No elves were overworked.
> • The source and check date with every result, so you can check it twice
> • No account, no sign-up, no coal
>
> Coming down the chimney next: more shops, more brands, then full naughty-or-nice ratings for staff, communities and the environment, with the reasons shown.
>
> The small print from the North Pole: B Corp certification is about a company, not any single product.
>
> Wrapped up live in one day on Twitch by 40 for 40. Watch the build: [link]
>
> Questions, corrections or letters to Santa: help@build40for40.com

**Category:** Shopping · **Language:** English (UK)

## Chrome privacy tab: today's version

Fill this in from the final manifest. Ben's `publishing/privacy.md` lists what to verify first.

- **Single purpose:** "Shows shoppers on H&M product pages whether H&M is a Certified B Corp, with the source and check date."
- **Permission reasons** (use only the ones the manifest has):
  - Host access to [H&M domains, e.g. `https://www2.hm.com/*`: confirm the exact ones]: "To show the B Corp result on H&M product pages."
  - `storage`, only if used: "To remember the user's settings."
- **Remote code:** No.
- **Data use:** see the recommendation below. With a local check, tick nothing collected. If the extension calls the Worker, declare **website content** (the shop domain), used only to look up the result, not sold or shared.

### Recommendation: check H&M inside the extension (privacy version B)

With one brand there's nothing to look up remotely. If the extension carries H&M's registry entry (status, source, check date) inside it, nothing leaves the browser. That makes the privacy tab, the Firefox declaration and the privacy notice the simplest possible, and review faster. The Worker can come back when there are more brands. This is Ben's call as the builder; version A below is ready if he keeps the API.

## Firefox Add-ons

- **Summary** (limit 250): reuse the Chrome summary.
- **Data collection:** Ben's Firefox manifest says `required: ["none"]`. That stays true with the local check (version B). If the extension calls the API with the page's domain, change it to the matching Mozilla category (likely `websiteContent`) before signing.
- **Support email:** help@build40for40.com

## Privacy notice section for build40for40.com/privacy

Add as a new section. Use B unless the build calls the API.

**B. Everything happens inside the extension (recommended)**

> **The Naughty List browser extension.** The extension only runs on H&M's online shop. It shows H&M's B Corp status from a list stored inside the extension. Nothing you browse leaves your browser, and there's no account or tracking. Questions: help@build40for40.com.

**A. If the extension calls our API**

> **The Naughty List browser extension.** The extension only runs on H&M's online shop. When you open a product page, it sends the shop's web address to our server, which checks it against our list and sends back the result. We don't send your browsing history, the page content, or who you are, and there's no account. Our server runs on Cloudflare, which processes connection details such as IP addresses to deliver the service [retention: confirm from the Cloudflare settings]. Questions: help@build40for40.com.

---

## Later version (when scoring is agreed)

Don't use until card 157 has an agreed method.

> **Summary:** See who's been naughty or nice. Check how a brand treats its staff, communities and the planet before you buy their gifts.
>
> **Description opener:** While you shop, The Naughty List spots the brand behind the product and tells you whether it's been naughty or nice, with the reasons and where they came from.

---

## Publisher setup (Ben's account, 40 for 40 as the company)

Recommendation, for Samira and Ben to confirm:

1. **Publish as a company, and declare trader status.** 40 for 40 Ltd is a business putting this out as part of its work, so under the EU rules it's a trader, even though the extension is free. The store then shows the company's name, address, email and phone on the listing. Use the registered company address, help@build40for40.com and a company phone number, not anyone's personal details.
2. **Don't tie it to one person's Google account.** Set up a Google Group (e.g. a build40for40.com group with Ben and Samira in it) and make it a *group publisher* in the Chrome developer dashboard. Ben still runs it day to day, but the 40 extensions over the next 40 days don't depend on one login.
3. **Verify build40for40.com** in Google Search Console under that account, so the listing shows the site as the verified publisher.
4. **Licence:** pick one before submitting. If the repo is public, MIT is the usual choice; if not, leave it "all rights reserved" and say nothing in the listing.
