#!/usr/bin/env bash
#
# Fernway — one-command deploy (run ON the server).
#
# Usage:
#   1) From your machine, upload the bundle (+ this script the first time):
#        scp deploy/fernway-site.tar.gz deploy/deploy.sh root@144.172.114.222:/root/
#   2) On the server:
#        chmod +x /root/deploy.sh      # first time only
#        /root/deploy.sh               # deploys /root/fernway-site.tar.gz
#
#   Optional: pass a different bundle path -> /root/deploy.sh /path/to/bundle.tar.gz
#
# Optional Cloudflare cache purge after deploy — export these before running
# (get a token at Cloudflare → My Profile → API Tokens, "Zone → Cache Purge"):
#   export CF_ZONE_ID=xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
#   export CF_API_TOKEN=xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
#
set -euo pipefail

# ---- config -----------------------------------------------------------------
WEBROOT="/var/www/shopfernway.us"
BUNDLE="${1:-/root/fernway-site.tar.gz}"
OWNER="www-data:www-data"
KEEP_ROLLBACK=1        # keep the previous release as ${WEBROOT}.old for quick rollback

# ---- helpers ----------------------------------------------------------------
say()  { printf '\033[1;36m==>\033[0m %s\n' "$*"; }
ok()   { printf '\033[1;32m  ✓\033[0m %s\n' "$*"; }
die()  { printf '\033[1;31m  ✗ %s\033[0m\n' "$*" >&2; exit 1; }

# ---- checks -----------------------------------------------------------------
[ "$(id -u)" -eq 0 ] || die "Run as root (sudo)."
[ -f "$BUNDLE" ]     || die "Bundle not found: $BUNDLE  (scp it up first)"
command -v nginx >/dev/null || die "nginx is not installed."

say "Deploying $BUNDLE -> $WEBROOT"

# ---- extract to a fresh staging dir (atomic swap) ---------------------------
STAGE="$(mktemp -d /tmp/fernway.XXXXXX)"
tar xzf "$BUNDLE" -C "$STAGE"
[ -f "$STAGE/index.html" ] || die "Bundle has no index.html — wrong archive?"
ok "Extracted $(find "$STAGE" -type f | wc -l) files"

# ---- permissions ------------------------------------------------------------
chown -R "$OWNER" "$STAGE"
find "$STAGE" -type d -exec chmod 755 {} \;
find "$STAGE" -type f -exec chmod 644 {} \;
ok "Permissions set"

# ---- atomic swap ------------------------------------------------------------
mkdir -p "$(dirname "$WEBROOT")"
if [ -d "$WEBROOT" ]; then
  rm -rf "${WEBROOT}.old"
  mv "$WEBROOT" "${WEBROOT}.old"
fi
mv "$STAGE" "$WEBROOT"
ok "Swapped in new release"
[ "$KEEP_ROLLBACK" -eq 1 ] || rm -rf "${WEBROOT}.old"

# ---- reload nginx (rollback if config is bad) -------------------------------
if nginx -t 2>/dev/null; then
  systemctl reload nginx
  ok "nginx reloaded"
else
  if [ -d "${WEBROOT}.old" ]; then
    rm -rf "$WEBROOT"; mv "${WEBROOT}.old" "$WEBROOT"
    die "nginx config test failed — rolled back to previous release."
  fi
  die "nginx config test failed."
fi

# ---- optional: purge Cloudflare cache ---------------------------------------
if [ -n "${CF_ZONE_ID:-}" ] && [ -n "${CF_API_TOKEN:-}" ]; then
  say "Purging Cloudflare cache"
  resp="$(curl -s -X POST \
    "https://api.cloudflare.com/client/v4/zones/${CF_ZONE_ID}/purge_cache" \
    -H "Authorization: Bearer ${CF_API_TOKEN}" \
    -H "Content-Type: application/json" \
    --data '{"purge_everything":true}')"
  if printf '%s' "$resp" | grep -q '"success":true'; then
    ok "Cloudflare cache purged"
  else
    printf '\033[1;33m  ! cache purge failed: %s\033[0m\n' "$resp"
  fi
else
  say "Skipping Cloudflare purge (set CF_ZONE_ID and CF_API_TOKEN to enable)"
fi

# ---- done -------------------------------------------------------------------
ok "Deployed. Live site: https://shopfernway.us"
say "Local origin check:"
curl -sk -o /dev/null -w "  HTTP %{http_code} in %{time_total}s\n" https://127.0.0.1/ -H "Host: shopfernway.us" || true
