# The Naughty List: store and site copy (draft)

Drafted 4 November 2026 for Superthread card 156. For Samira to review. Nothing here has been pasted into a store.

**Rule this copy follows** (from `AGENTS.md`): today the backend returns **B Corp certification evidence** only, with a source and a check date. There is no naughty/nice verdict until the scoring card (157) is agreed. A brand that isn't found shows as *unknown*, never naughty. So the "today" copy promises B Corp evidence and nothing more. The "later" copy is held back for when verdicts exist.

**Decided by Samira, 4 Nov afternoon:**
- Support email: **help@build40for40.com**
- Icon: the 40(40) branded icon in `store/` (navy tile, list, lime tick, yellow star)
- Scope: **one brand, H&M**, on H&M's own shop (hm.com)
- Chrome developer account: **Ben owns it**, published as 40 for 40 (the company)

Every `[square bracket]` is something the build still has to confirm before this goes live.

**Build check before any of this is used:** `worker/companies.js` has no H&M entry yet. Someone has to hand-check H&M against the B Lab directory and add it with a source and date, plus explicit hostname mappings for the H&M domains the extension runs on (the Worker doesn't match subdomains or regional domains automatically). Until then the extension would show "unknown" on every H&M page. This copy deliberately doesn't say what H&M's status is: the registry entry decides that, not the copy.

---

## Chrome Web Store: today's version

**Name:** The Naughty List

**Summary** (Chrome limit 132 characters, this is 128):

> Who's been naughty or nice? Check if the brand behind a gift is a Certified B Corp, with the source and date. Starting with H&M.

**Description:**

> Every brand looks lovely at Christmas. The Naughty List helps you check the company behind the gift.
>
> This first version works on H&M's online shop. Open a product page and The Naughty List shows whether H&M is a Certified B Corp: a company independently assessed on how it treats its workers, communities and the environment. You see the source (the B Lab directory) and the date we last checked.
>
> What's in this first version
> • One brand, H&M, checked by hand against the B Lab directory
> • The source and check date shown with every result
> • No account and no sign-up
>
> Coming next: more shops and brands, then naughty-or-nice ratings across staff, communities and the environment, with the reasons shown.
>
> B Corp certification is about a company, not any single product.
>
> Built live in one day on Twitch by 40 for 40: 40 apps in 40 days, each for someone who paid to have their problem solved. Watch the build: [link]
>
> Questions or corrections: help@build40for40.com

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
