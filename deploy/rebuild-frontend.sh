#!/bin/bash
# Build lai client + admin + site_dist (sau khi sua code)
set -e
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT"

# Lay GOOGLE_CLIENT_ID tu server/.env de nhung vao build client (Vite)
GOOGLE_ID=""
if [ -f server/.env ]; then
  GOOGLE_ID=$(grep -E '^GOOGLE_CLIENT_ID=' server/.env | head -1 | cut -d= -f2- | tr -d '\r" ')
fi
rm -f client/.env admin/.env 2>/dev/null || true
if [ -n "$GOOGLE_ID" ]; then
  cat > client/.env <<EOF
VITE_API_URL=/api
VITE_GOOGLE_CLIENT_ID=${GOOGLE_ID}
EOF
  echo "==> client/.env: VITE_GOOGLE_CLIENT_ID da gan"
fi

echo "==> build:merged..."
npm run build:merged

if grep -rq "127.0.0.1" client/dist/assets/ 2>/dev/null; then
  echo "CANH BAO: client build van con 127.0.0.1"
  exit 1
fi

if ! test -f site_dist/admin/index.html; then
  echo "LOI: thieu site_dist/admin/index.html"
  exit 1
fi

if ! test -f site_dist/.htaccess; then
  echo "LOI: thieu site_dist/.htaccess (Apache se 404 /admin/login)"
  exit 1
fi

if ! test -f site_dist/admin/.htaccess; then
  echo "LOI: thieu site_dist/admin/.htaccess"
  exit 1
fi

if ! test -f site_dist/admin/login/index.html; then
  echo "LOI: thieu site_dist/admin/login/index.html"
  exit 1
fi

if ! grep -q 'src="/admin/assets/' site_dist/admin/index.html 2>/dev/null; then
  echo "CANH BAO: admin index khong dung base /admin/ - kiem tra admin/vite.config.js"
fi

echo "OK! site_dist san sang."
echo "  Website: https://thangtinhoc.vn/"
echo "  Admin:   https://thangtinhoc.vn/admin/login"
echo "Trong aaPanel dat Thu muc web = $ROOT/site_dist (KHONG phai client/dist)"
