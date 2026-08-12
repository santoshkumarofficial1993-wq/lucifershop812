# Before this site goes live

The storefront is complete, but the business identity uses **placeholder values**. Google Ads will
reject the destination — and you may run into consumer-protection issues — if these are advertised
before being replaced with the real details of the operating company.

## Replace every occurrence of these

All of the following live in one place: `js/data.js`, in the `BUSINESS` object. Change them there and
they update wherever the pages read from the catalogue. The footer and legal pages also repeat them as
static text (so the site works without JavaScript), so search the project for each value and replace
it everywhere.

| Placeholder | Appears as | Replace with |
|---|---|---|
| Company name | `Fernway` | Your trading name |
| Legal entity | `Fernway LLC` | Your registered company name |
| State of formation | `Oregon` | Your state of formation |
| Address | `1420 SE Cedar Mill Road, Suite 5, Portland, OR 97214` | Your registered / business address |
| Phone | `1 (800) 555-0142` | A monitored phone number |
| Email | `hello@shopfernway.us` | Create this mailbox in cPanel |
| Support email | `support@shopfernway.us` | Create this mailbox in cPanel |

**Domain is set to `shopfernway.us`** (canonical + Open Graph URLs use `https://shopfernway.us`). Before
launch, create the `hello@` and `support@shopfernway.us` mailboxes (or forwarders) in cPanel → Email
Accounts so those addresses actually receive mail. The `1 (800) 555-0142` phone still uses the 555-01xx
range reserved for fiction — replace it with a monitored number.

US-only visitor restriction is documented in `deploy/US-ONLY-GEO-BLOCK.md`.

## Also confirm before advertising

- **Products, prices and stock** in `js/data.js` reflect what you actually sell and hold. Prices are
  in **cents** and exclude sales tax.
- **Sales tax** — `DELIVERY.salesTaxRate` in `js/data.js` is a flat estimate (7.25%) shown at
  checkout. A live store must calculate tax by the customer's shipping address (state, county, city)
  using a tax service or your platform's tax engine, and register where you have nexus.
- **Policy dates** — the "Last updated" date on `privacy.html` and `terms.html` is set in
  `scratchpad/build_legal.py`; set it to the date you publish.
- **Payment** — the checkout is a demonstration and takes no money. Connect a real PCI-compliant
  payment processor before taking orders, and remove the "demonstration store" notices on
  `checkout.html`, `terms.html` (section 2) and the FAQ.
- **Privacy law** — the privacy policy references California / state privacy rights in general terms.
  Have it reviewed for the states you sell into (e.g. CCPA/CPRA specifics) before you rely on it.

## Google Ads policy checklist (already built in)

- Working destination: every link resolves, no dead ends, no broken images.
- Business identity and contact details reachable from every page footer.
- Privacy, Terms, Shipping and Returns pages all present and linked.
- Prices shown pre-tax (US convention); shipping and estimated sales tax shown before checkout.
- No fake reviews, countdown timers, false scarcity, or deceptive pop-ups.
- Cookie notice is dismissible and uses no pre-checked consent.
- No restricted goods (garden chemicals, pesticides) in the catalogue.
