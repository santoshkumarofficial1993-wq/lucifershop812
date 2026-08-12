# Project Rules

## 1. Goal

Build a modern e-commerce storefront for **Fernway**, a **US-based** Home & Garden retailer
selling outdoor furniture, planters, indoor greenery, garden tools, outdoor lighting, and decor. The
catalogue holds **100+ products** across those six categories.

The site must be usable as a **Google Ads landing destination**, which means policy compliance is a
build requirement, not a later cleanup pass.

Market: United States. Currency US dollars; prices shown pre-tax with sales tax estimated at checkout
(US convention). Spelling and units are American.

## 2. Scope

Static, hand-written HTML/CSS/JS. No backend. Cart state lives in `localStorage`; checkout collects
details and stops at a confirmation step rather than taking real payment.

**Pages**

| Page | File | Purpose |
|---|---|---|
| Home | `index.html` | Hero, categories, featured products, trust signals |
| Shop | `shop.html` | Full catalogue with filtering and sorting |
| Product | `product.html` | Gallery, price, delivery, specs |
| Cart | `cart.html` | Line items, quantity, running total |
| Checkout | `checkout.html` | Address/payment form, full cost breakdown |
| About | `about.html` | Who the business is |
| Contact | `contact.html` | Address, phone, email, hours, form |
| Shipping | `shipping.html` | Delivery costs and timeframes |
| Returns | `returns.html` | Returns and refunds policy |
| FAQ | `faq.html` | Common pre-purchase questions |
| Privacy | `privacy.html` | Privacy and cookie policy |
| Terms | `terms.html` | Terms and conditions of sale |

## 3. Rules

### 3.1 Google Ads policy

Sourced from Google Ads *Destination requirements*, *Misrepresentation*, and *Personalised
advertising* policies. These are hard requirements.

- **Working destination.** Every link resolves. No dead ends, no "coming soon", no under-construction
  pages, no broken images. The site works with JavaScript on and degrades readably without it.
- **Business transparency.** Legal business name, physical address, phone, email, and opening hours
  are reachable from every page via the footer, and stated in full on `contact.html`.
- **Required policy pages.** Privacy, Terms, Shipping, and Returns each exist as a real page with
  real content and are linked in the footer of every page.
- **Pricing transparency.** The advertised price is the price. Shipping cost, estimated sales tax, and
  the order total are shown before the customer commits. No fees appear for the first time at the last
  step.
- **No misrepresentation.** No invented reviews, ratings, testimonials, endorsements, press logos,
  customer counts, or awards. If there is no data, the honest empty state ships instead.
- **No false urgency.** No countdown timers, no fake "only 2 left", no rotating "37 people are
  viewing this". Stock and delivery statements must be things a real shop could actually assert.
- **No deceptive interstitials.** Nothing covers the page content on arrival. The cookie notice is
  dismissible, does not block reading, and never uses a pre-ticked consent box.
- **Data collection is consented.** Every form that captures personal data states what it is used
  for and links to the privacy policy. Newsletter opt-in is an unticked checkbox.
- **Restricted goods stay out.** No pesticides, herbicides, weed killers, or garden chemicals. No
  health or environmental claims that cannot be substantiated.

### 3.2 Images

- **Photographs only.** Product, hero, category, and editorial imagery must be real photography.
  SVG or CSS placeholders standing in for a photograph are not acceptable.
- **Downloaded and local.** Images are fetched once, stored in `assets/images/`, and referenced by
  relative path. No hotlinking to a remote host at runtime.
- **Licensed for commercial use.** Unsplash License only. Unsplash+ / premium results are excluded.
  Provenance for every file is recorded in `assets/images/CREDITS.txt`.
- **SVG is still correct for UI icons** — cart, search, chevrons, and similar interface glyphs are
  inline SVG. That rule is about imagery, not iconography.
- Every image has a descriptive `alt`, explicit `width`/`height` to reserve layout space, and
  `loading="lazy"` below the fold.

### 3.3 No third-party branding

- No mention of Claude, Anthropic, AI, or any tool used to build the site — not in visible copy, not
  in comments, not in metadata, commit messages, or file names.
- No "generated with", no badges, no attribution footers.

### 3.4 Design system — "Botanic Teal"

Cool botanical base, warm coral pop, on pure white. All pairings verified to WCAG AA.

| Token | Value | Use |
|---|---|---|
| Ink (primary) | `#13211F` | Headings, body text |
| Brand (teal) | `#0E6E63` | Links, prices, in-stock, brand accents (6.1:1) |
| Accent (coral) | `#CB4A22` | CTA buttons — white text passes AA (4.6:1) |
| Accent bright | `#E9663F` | Decorative coral (badge fills with ink text) |
| Mist | `#EEF3F1` | Section panels |
| Background | `#FFFFFF` | Page (pure white) |
| Border | `#DEE7E4` | Dividers, card edges |
| Destructive | `#B3261E` | Errors, removals |

- **Type:** Fraunces (display serif) for headings h1–h3; Nunito Sans for body, UI labels and small
  headings. Self-hosted `.woff2` in `assets/fonts/`, declared in `css/fonts.css`. No font CDN.
- **Logo:** a stroked fern-frond mark in a teal roundel + "Fernway" wordmark set in Fraunces. Inline
  SVG (interface/brand, not a photograph). Favicon at `assets/favicon.svg`.
- **Style:** restrained glass — translucent blurred header only. Blur is not applied behind body text,
  and never over an image that would drop contrast below 4.5:1.
- **Motion:** 200–450ms, `cubic-bezier(.22,.61,.36,1)`. Grids stagger in on scroll at 60ms intervals.
  All motion is disabled under `prefers-reduced-motion`.
- **Spacing:** 4px base scale, standard density (16–64px section rhythm).
- Section eyebrows are used sparingly (not above every section); Fraunces headings carry hierarchy.

### 3.5 Technical

- Vanilla HTML/CSS/JS, ES modules, no build step, no framework, no runtime CDN. Opening
  `index.html` in a browser runs the site.
- Catalogue data lives in `js/data.js` as the single source of truth. No product name, price, or
  image path is hard-coded into a page.
- Business details (address, phone, email) live in `js/data.js` as `BUSINESS` so they are changed in
  one place.
- Prices are stored in **cents as integers** and formatted for display. No floating-point money.
- No inline `style` attributes, no inline event handlers, no `!important`, no ID selectors in CSS.

### 3.6 Accessibility

- Contrast 4.5:1 for body text, 3:1 for large text and UI boundaries.
- Every interactive element is keyboard reachable with a visible focus ring, and has an accessible
  name. Touch targets are at least 44×44px.
- Skip link to `#main` on every page. One `<h1>` per page, heading levels never skip.
- Colour is never the sole carrier of meaning.

### 3.7 Quality bar

- Zero console errors or warnings.
- No horizontal scroll and no layout break from 320px to 1920px. Checked at 375 / 768 / 1024 / 1440.
- No lorem ipsum, no dead code, no commented-out blocks in delivered work.

---

## Before this site runs live

`BUSINESS-DETAILS.md` lists every placeholder value (legal entity, state of formation, address,
phone, email) that must be replaced with real details. Google Ads will reject the destination if
these are left as-is.
