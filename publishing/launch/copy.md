# The Naughty List: store and site copy (draft)

Drafted 4 November 2026 for Superthread card 156. For Samira to review. Nothing here has been pasted into a store.

**Rule this copy follows** (from `AGENTS.md`): today the backend returns **B Corp certification evidence** only, with a source and a check date. There is no naughty/nice verdict until the scoring card (157) is agreed. A brand that isn't found shows as *unknown*, never naughty. So the "today" copy promises B Corp evidence and nothing more. The "later" copy is held back for when verdicts exist.

Every `[square bracket]` is something the build has to confirm before this goes live.

---

## Chrome Web Store: today's version

**Name:** The Naughty List

**Summary** (Chrome limit 132 characters, this is 125):

> Who's been naughty or nice? Check if the brand behind a gift is a Certified B Corp, with the source and date, before you buy.

**Description:**

> Every brand looks lovely at Christmas. The Naughty List helps you check the company behind the gift.
>
> On a product page at [supported shops], The Naughty List spots the brand and tells you whether it's a Certified B Corp. That's a company that has been independently assessed on how it treats its workers, communities and the environment. You see the source (the B Lab directory) and the date we last checked.
>
> If we haven't checked a brand yet, it says so. "Not on our list yet" never means naughty.
>
> What's in this first version
> • B Corp status for [N] brands, each checked by hand against the B Lab directory
> • The source and check date for every result
> • No account and no sign-up
>
> Coming next: naughty-or-nice ratings across staff, communities and the environment, with the reasons shown.
>
> B Corp certification is about a company, not any single product.
>
> Built live in one day on Twitch by 40 for 40: 40 apps in 40 days, each for someone who paid to have their problem solved. Watch the build: [link]

**Category:** Shopping · **Language:** English (UK)

## Chrome privacy tab: today's version

Fill this in from the final manifest. Ben's `publishing/privacy.md` lists what to verify first.

- **Single purpose:** "Shows shoppers whether the brand on the product page they're viewing is a Certified B Corp, with the source and check date."
- **Permission reasons** (use only the ones the manifest has):
  - `activeTab`: "To read the brand name on the product page the user is viewing, only after they click the extension."
  - Host access to [shop sites]: "To read the brand name on product pages of supported shops so the B Corp result can be shown on the page."
  - `storage`: "To remember the user's settings."
- **Remote code:** No.
- **Data use:** if the extension sends the brand name or shop domain to `naughty-list-api.40for40.workers.dev`, that counts as **website content** under Chrome's rules, even with no account. Declare it, and state it's used only to look up the result and is not sold or shared. Only tick "no data collected" if everything happens inside the extension.

## Firefox Add-ons

- **Summary** (limit 250): reuse the Chrome summary.
- **Data collection:** Ben's Firefox manifest says `required: ["none"]`, which is true of the empty scaffold only. If the extension calls the API with page content, change it to the matching Mozilla category (likely `websiteContent`) before signing.

## Privacy notice section for build40for40.com/privacy

Add as a new section. Two versions; pick the one that matches the build.

**A. If the brand name is sent to our API**

> **The Naughty List browser extension.** The extension reads the product page you're on only to find the brand name. It sends that brand name [and the shop's web address] to our server, which checks it against our list and sends back the result. We don't send your browsing history, the full page, or who you are, and there's no account. Our server runs on Cloudflare, which processes connection details such as IP addresses to deliver the service [retention: confirm from the Cloudflare settings]. Questions: [support email].

**B. If everything happens inside the extension**

> **The Naughty List browser extension.** The extension reads the product page you're on only to find the brand name, and checks it against a list stored inside the extension. Nothing you browse leaves your browser, and there's no account or tracking. Questions: [support email].

---

## Later version (when scoring is agreed)

Don't use until card 157 has an agreed method.

> **Summary:** See who's been naughty or nice. Check how a brand treats its staff, communities and the planet before you buy their gifts.
>
> **Description opener:** While you shop, The Naughty List spots the brand behind the product and tells you whether it's been naughty or nice, with the reasons and where they came from.

---

## Open decisions for Samira

1. **Support email:** Ben's metadata uses hello@40for40.app, the site uses help@build40for40.com. Pick one for the store, the privacy notice and the download page.
2. **Which shops** the overlay works on (fills `[supported shops]`).
3. **API or local list** (decides privacy version A or B, the Chrome data boxes and the Firefox declaration).
4. **Trader status** of 40 for 40 Ltd for the EU, and which Google account owns the Chrome developer account.
5. **Licence** for the extension (Ben's notes flag it as unconfirmed).
