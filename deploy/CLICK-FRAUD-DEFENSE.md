# Reducing fake / invalid clicks — Fernway (Cloudflare + cPanel + Google Ads Demand Gen)

You already block non-U.S. traffic at Cloudflare, which kills most foreign click-farm traffic. This is
the rest of the stack. You can't *prevent* 100% of invalid clicks, but you can (a) filter the obvious
junk, (b) make bots worthless by optimizing for conversions, and (c) recover cost via Google's
automatic invalid-click credits.

Note on campaign type: **Demand Gen and Performance Max do NOT support campaign IP exclusions** (that's
a Search-campaign feature). Demand Gen runs mostly on Google-owned inventory (YouTube, Discover, Gmail),
which is lower-fraud than open display. So your Demand Gen levers are the bidding + account-level
exclusions + the infra side below.

---

## 1. Google Ads settings

- **Bid for conversions, not clicks.** Use Maximize Conversions / Target CPA (or ROAS once you have
  data) with solid conversion tracking + **enhanced conversions**. Bots almost never buy, so
  conversion-based bidding automatically stops paying for them. This is the single highest-impact move.
- **Frequency capping** on the Demand Gen campaign (e.g., a few impressions per user per day) to limit
  repeat exposure that drives repeat junk clicks.
- **Account-level exclusions** (Tools → Content suitability / Exclusions):
  - Placement exclusions: exclude junk mobile-app categories and any placement report offenders.
  - Content exclusions: exclude sensitive/parked-domain/low-quality content.
- **Ad schedule (dayparting):** if you see spikes of no-conversion clicks at odd hours (e.g., 2–5am),
  pause those hours.
- **Watch the signals** weekly: add the **"Invalid clicks"** and **"Invalid click rate"** columns
  (Google auto-filters these and credits you — verify it's happening). Review the **placement report**
  and pause anything with clicks but zero engagement/conversions.
- **Exclude your own team.** Don't click your own ads; if you run Search later, add your office/home IPs
  under Campaign settings → IP exclusions (max 500 per campaign — Search/Display only).

## 2. Cloudflare (the layer you control)

- **Bot Fight Mode: ON** (Security → Bots). It challenges automated traffic and *respects verified
  bots*, so Googlebot and Google's ad/landing-page verifiers still get through. Don't hand-block
  Googlebot.
- **Rate limiting** (Security → WAF → Rate limiting rules — free plan includes one rule). Stop a single
  IP hammering your landing pages:
  - Match: requests to your site · **Same IP** · e.g. **> 20 requests / 1 minute**
  - Action: **Managed Challenge** (or Block) for 10 minutes.
  - Tune the threshold so real shoppers browsing fast aren't caught.
- **Security Level: High** (Security → Settings) so Cloudflare challenges known-bad IPs.
- **Challenge datacenter / VPN traffic (optional).** A lot of paid-click abuse comes from hosting IPs,
  not homes. On the free WAF you can Managed-Challenge specific known-bad hosting networks by ASN:
  ```
  (ip.geoip.asnum in {16509 14618 15169 396982 14061 63949 20473})
  ```
  (Example ASNs: AWS, Google Cloud, DigitalOcean, Vultr/Linode, etc. — verify before using, and
  **don't** block Google's ad-verification ranges; Managed Challenge is safer than Block here.)
- You already have the **US-only** rule and origin lock (see `US-ONLY-GEO-BLOCK.md`) — keep them.

## 3. Detect and feed the loop

- **Cloudflare Analytics + Security Events**: watch for repeat IPs, one ASN, or a burst of hits with no
  further page views. Those are your block/challenge candidates.
- **GA4 / server logs**: bot-y sessions show as 0-second, single-page, no scroll. Segment ad traffic
  (by `utm_*`) and compare bounce/engagement vs. organic. A campaign with clicks but ~0 engaged
  sessions is being hit.
- Feed confirmed bad IPs back into a Cloudflare **Block** rule (and into Google Ads IP exclusions *if*
  you also run Search).

## 4. A dedicated click-fraud tool (optional, if spend grows)

Services like **ClickCease, Lunio, ClickGUARD, Fraud Blocker** auto-detect fraudulent clicks and push
IP exclusions to Google Ads via a small site tag + the Ads API, and complement Cloudflare. Caveat: they
lean on **Search/Display IP exclusions**, which Demand Gen doesn't expose — so on a Demand-Gen-only
account their value is mostly the analytics/monitoring, not auto-blocking. Best ROI once you also run
Search campaigns.

## 5. Protect the forms too (spam ≠ clicks, but same family)

The contact/checkout forms already validate input. To stop bot spam leads, add a **honeypot** (a hidden
field real users never fill; if it's filled, drop the submission) and let the Cloudflare rate-limit
cover abusive POSTs. This keeps your inbox and any future lead metrics clean.

---

### Reality check
Google already filters a meaningful share of invalid clicks and credits your account automatically —
confirm that in the Invalid-clicks column before assuming you're being drained. The goal here is to
reduce what gets through and to make the clicks that do land worthless to a bot by paying only for
conversions.
