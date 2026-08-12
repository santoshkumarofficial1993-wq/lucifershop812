# Deploy Fernway over SSH — no control panel (nginx static hosting)

Cleanest setup for a static site: a plain Ubuntu box running **nginx**, with **Cloudflare** in front
doing SSL + geo-block. No cPanel/CloudPanel needed.

Server: `144.172.114.222` · Domain: `shopfernway.us` · Web root: `/var/www/shopfernway.us`

---

## 0. Start from a clean OS

Your current VPS has a failed cPanel attempt on it. In your provider's panel, **rebuild the server as
plain Ubuntu 24.04 LTS** (no application/panel). Then SSH in as root:

```bash
ssh root@144.172.114.222
apt update && apt -y upgrade
```

## 1. Basic firewall + nginx

```bash
apt -y install nginx ufw
ufw allow OpenSSH
ufw allow 80
ufw allow 443
ufw --force enable
systemctl enable --now nginx
```

Visit `http://144.172.114.222` — you should see the nginx welcome page. Good.

## 2. Upload the site bundle

From **your Windows machine** (PowerShell or Git Bash), in the project folder, push the bundle we built
(`deploy/fernway-site.tar.gz`):

```bash
scp deploy/fernway-site.tar.gz root@144.172.114.222:/root/
```

Back **on the server**, unpack it into the web root:

```bash
mkdir -p /var/www/shopfernway.us
tar xzf /root/fernway-site.tar.gz -C /var/www/shopfernway.us
chown -R www-data:www-data /var/www/shopfernway.us
find /var/www/shopfernway.us -type d -exec chmod 755 {} \;
find /var/www/shopfernway.us -type f -exec chmod 644 {} \;
```

## 3. SSL — Cloudflare Origin Certificate (Full strict)

In Cloudflare → **SSL/TLS → Origin Server → Create Certificate** (accept defaults, 15-year). Copy the
two blocks it gives you. On the server:

```bash
mkdir -p /etc/ssl/cloudflare
nano /etc/ssl/cloudflare/shopfernway.us.pem   # paste the CERTIFICATE, save
nano /etc/ssl/cloudflare/shopfernway.us.key   # paste the PRIVATE KEY, save
chmod 600 /etc/ssl/cloudflare/shopfernway.us.key
```

Then in Cloudflare → **SSL/TLS → Overview**, set the mode to **Full (strict)**, and under **Edge
Certificates** turn on **Always Use HTTPS** + **Automatic HTTPS Rewrites**.

## 4. nginx site config

Upload `deploy/nginx-shopfernway.conf` (scp it up the same way), then:

```bash
mv /root/nginx-shopfernway.conf /etc/nginx/sites-available/shopfernway.us
ln -sf /etc/nginx/sites-available/shopfernway.us /etc/nginx/sites-enabled/
rm -f /etc/nginx/sites-enabled/default
nginx -t          # test config
systemctl reload nginx
```

## 5. Point DNS at the server (Cloudflare)

In Cloudflare → **DNS**:
- `A` record: `shopfernway.us` → `144.172.114.222` — **Proxied (orange cloud)**
- `A` (or CNAME) record: `www` → `144.172.114.222` — **Proxied**

Wait a minute, then open **https://shopfernway.us** — you should see the store, valid padlock.

## 6. Lock the origin to Cloudflare (so nobody bypasses it)

Restore real visitor IPs and only accept traffic from Cloudflare. Create the include:

```bash
# Fetch current Cloudflare ranges and build an allowlist + real-ip config
{
  echo "# Cloudflare real IP + allowlist (regenerate if CF changes ranges)"
  for ip in $(curl -s https://www.cloudflare.com/ips-v4) $(curl -s https://www.cloudflare.com/ips-v6); do
    echo "set_real_ip_from $ip;"
  done
  echo "real_ip_header CF-Connecting-IP;"
} > /etc/nginx/cloudflare.conf
```

Add `include /etc/nginx/cloudflare.conf;` inside the `http { }` block of `/etc/nginx/nginx.conf`, then
in the port-443 `server` block add an allow/deny so only Cloudflare can reach the origin:

```nginx
# inside the 443 server { } — accept only Cloudflare, deny direct hits
include /etc/nginx/cloudflare-allow.conf;   # generated below
deny all;
```

```bash
for ip in $(curl -s https://www.cloudflare.com/ips-v4) $(curl -s https://www.cloudflare.com/ips-v6); do
  echo "allow $ip;"
done > /etc/nginx/cloudflare-allow.conf
nginx -t && systemctl reload nginx
```

(You may also keep UFW open on 80/443 to all, since nginx now enforces Cloudflare-only. Optionally
tighten UFW to Cloudflare ranges too.)

## 7. US-only backup at the origin (optional)

The real geo-block is the Cloudflare WAF rule (see `US-ONLY-GEO-BLOCK.md`). To also enforce it in nginx,
add this to the `http { }` block:

```nginx
map $http_cf_ipcountry $allow_us { default 0; US 1; }
```

…and uncomment `if ($allow_us = 0) { return 403; }` in the site config. Requires Cloudflare →
Network → IP Geolocation → On.

---

## Updating the site later

Rebuild the bundle locally (`tar czf deploy/fernway-site.tar.gz *.html css js assets` from the project
root), then:

```bash
scp deploy/fernway-site.tar.gz root@144.172.114.222:/root/
ssh root@144.172.114.222 'rm -rf /var/www/shopfernway.us/* && tar xzf /root/fernway-site.tar.gz -C /var/www/shopfernway.us && chown -R www-data:www-data /var/www/shopfernway.us'
```

Purge the Cloudflare cache (Caching → Configuration → Purge Everything) after an update.

## Email

No mailserver here (by design). Use **Cloudflare Email Routing** (free) to forward `hello@` /
`support@shopfernway.us` to your inbox, and a transactional sender (Zoho/SES) for outbound.

## Checklist

- [ ] Ubuntu 24.04 rebuilt, `apt upgrade` done
- [ ] nginx installed, UFW allows 22/80/443
- [ ] bundle uploaded + extracted to `/var/www/shopfernway.us`, perms set
- [ ] Cloudflare Origin cert installed, mode = Full (strict)
- [ ] site config enabled, `nginx -t` passes
- [ ] DNS A records proxied (orange)
- [ ] https://shopfernway.us loads with valid padlock
- [ ] origin locked to Cloudflare ranges
- [ ] Cloudflare "US only" WAF rule active
