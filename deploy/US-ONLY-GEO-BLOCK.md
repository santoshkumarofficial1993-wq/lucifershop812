# Restrict Fernway to U.S. visitors only

Goal: allow visitors from the **United States** and block every other country. You're on
**Cloudflare (proxied / orange cloud)** in front of a server managed with **your panel + cPanel**.

**Do the block at Cloudflare's edge — that's the right place.** Because Cloudflare proxies your traffic,
your origin server (Apache/cPanel) sees *Cloudflare's* IP addresses, not the visitor's. So an ordinary
IP/GeoIP block on the server won't see the real country. Cloudflare knows the real country and can stop
foreign traffic before it ever reaches your server.

Below: (1) the primary block at Cloudflare, (2) locking the origin so nobody bypasses Cloudflare, and
(3) an optional in-server backup using Cloudflare's country header.

---

## 1. Primary: block non-U.S. at Cloudflare (do this first)

**Where:** Cloudflare dashboard → select **shopfernway.us** → **Security → WAF → Custom rules →
Create rule**. (On some accounts it's **Security → WAF → Custom rules**; older UI: **Security → WAF →
Firewall rules**.) The free plan includes up to 5 custom rules — this uses one.

Configure:
- **Rule name:** `US only`
- **When incoming requests match** — use the expression editor and paste:
  ```
  (ip.geoip.country ne "US")
  ```
  (Equivalent in the visual builder: Field **Country**, Operator **is not**, Value **United States**.)
- **Then take action:** **Block**
- **Deploy.**

That's it — anyone outside the U.S. gets a Cloudflare 1020 "Access denied" page and never touches your
server.

### Recommended additions to that expression
- **Keep your own access if you're ever outside the U.S.** (or travelling). Find your IP at
  `ip.me`, then use:
  ```
  (ip.geoip.country ne "US" and ip.src ne 203.0.113.45)
  ```
  Replace `203.0.113.45` with your IP. Add more with `and ip.src ne <ip>`.
- **Let payment/webhook callbacks through.** If you later add Stripe/PayPal/etc., their servers may
  call your site from outside the U.S. Exempt their paths, e.g.:
  ```
  (ip.geoip.country ne "US" and not starts_with(http.request.uri.path, "/webhooks/"))
  ```

### Note on search & monitoring
Googlebot crawls U.S. stores primarily from U.S. IPs, so normal SEO is unaffected. If you use an
uptime monitor, pick a **U.S. checking location** or add its IP with `and ip.src ne <monitor-ip>` as
above.

---

## 2. Lock the origin to Cloudflare (so the block can't be bypassed)

A geo-block at Cloudflare only helps if visitors can't skip Cloudflare by hitting your server's raw IP.
Close that door:

**Option A — server firewall (best).** In your panel/cPanel firewall (CSF, or the panel's firewall),
allow inbound **80/443 only from Cloudflare's IP ranges**, deny the rest. Cloudflare publishes the
current list at **https://www.cloudflare.com/ips/** — add both the IPv4 and IPv6 ranges. If you use
**CSF**, this is the "cloudflare" allow list; many cPanel/CSF setups have a one-click Cloudflare option.

**Option B — Cloudflare "Authenticated Origin Pulls"** (mutual TLS) so your origin only accepts
connections carrying Cloudflare's client certificate. Enable under **SSL/TLS → Origin Server →
Authenticated Origin Pulls**, then require it on the origin.

Either way, also make sure your DNS records for `shopfernway.us` and `www` are **Proxied (orange
cloud)**, not "DNS only (grey cloud)".

---

## 3. Optional backup: block by country inside the server (.htaccess)

Belt-and-suspenders. Cloudflare adds a **`CF-IPCountry`** header to every request (enable
**Network → IP Geolocation → On** in Cloudflare if it isn't already). Apache can read it. Copy the
snippet in **`deploy/htaccess-us-only.txt`** into the `.htaccess` file in your site's document root
(`public_html`). It allows the request only when `CF-IPCountry` is `US`; anything else — including
someone hitting the origin directly without the header — is denied.

> This is a *secondary* control. Keep the Cloudflare rule in step 1 as the real gate; the `.htaccess`
> just makes sure a foreign request can't slip through if it ever reaches Apache.

---

## Quick verification

1. From the U.S. (or a U.S. VPN / your own connection): the site loads normally.
2. From a non-U.S. VPN: you should get Cloudflare's **1020 Access denied** page.
3. Cloudflare **Security → Events** shows the blocked requests with the matched "US only" rule.
4. Try your server's raw IP in a browser — it should fail/timeout (step 2 working).

## Where each setting lives — summary

| What | Where |
|---|---|
| Block non-U.S. visitors | Cloudflare → Security → WAF → Custom rules → "US only" → Block |
| Enable country header | Cloudflare → Network → IP Geolocation → On |
| Keep DNS proxied | Cloudflare → DNS → orange cloud on `@` and `www` |
| Only accept Cloudflare IPs | Panel/cPanel firewall (CSF) allow Cloudflare ranges; or SSL/TLS → Authenticated Origin Pulls |
| Server-side backup block | `public_html/.htaccess` (see `deploy/htaccess-us-only.txt`) |
| Create hello@/support@ mailboxes | cPanel → Email Accounts |
