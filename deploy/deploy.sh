#!/bin/bash
# Trien khai / cap nhat Thang Tin Hoc tren VPS Ubuntu
# Chay: bash deploy/deploy.sh   (tu thu muc goc repo)
set -e

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT"

CONF="$ROOT/deploy/deploy.conf"
if [ ! -f "$CONF" ]; then
  echo "Thieu deploy/deploy.conf â€” chay: cp deploy/deploy.conf.example deploy/deploy.conf"
  exit 1
fi
# Bo UTF-8 BOM
if [ -f "$CONF" ]; then sed -i '1s/^\xEF\xBB\xBF//' "$CONF" 2>/dev/null || true; fi
# shellcheck source=/dev/null
source "$CONF"

DOMAIN="${DOMAIN:-thangtinhoc.vn}"
ADMIN_DOMAIN="${ADMIN_DOMAIN:-admin.$DOMAIN}"
APP_DIR="${APP_DIR:-/www/wwwroot/thangtinhoc}"
PORT="${PORT:-5001}"
API_URL="https://${DOMAIN}/api"
CORS="https://${DOMAIN},https://${ADMIN_DOMAIN}"

if [ -z "$JWT_SECRET" ]; then
  JWT_SECRET=$(openssl rand -base64 48 | tr -d '\n')
  echo "Da tao JWT_SECRET ngau nhien."
fi

echo "==> Domain: $DOMAIN | Admin: $ADMIN_DOMAIN"
echo "==> App dir: $APP_DIR | Port: $PORT"

if [ "$ROOT" != "$APP_DIR" ] && [ ! -d "$APP_DIR/.git" ]; then
  echo "Clone repo vao $APP_DIR..."
  mkdir -p "$(dirname "$APP_DIR")"
  git clone https://github.com/thangcomputer/THANGTINHOC.git "$APP_DIR"
  cd "$APP_DIR"
elif [ "$ROOT" != "$APP_DIR" ]; then
  cd "$APP_DIR"
  git pull origin main || git pull
else
  git pull origin main 2>/dev/null || true
fi

echo "==> Cau hinh server/.env..."
cat > server/.env <<EOF
DATABASE_URL=file:./prod.db
JWT_SECRET=${JWT_SECRET}
JWT_EXPIRE=7d
NODE_ENV=production
PORT=${PORT}
CORS_ORIGIN=${CORS}
SITE_URL=https://${DOMAIN}
GOOGLE_CLIENT_ID=${GOOGLE_CLIENT_ID:-}
RESEND_API_KEY=${RESEND_API_KEY:-}
EMAIL_FROM=${EMAIL_FROM:-noreply@thangtinhoc.vn}
GEMINI_API_KEY=
GROQ_API_KEY=
MAX_FILE_SIZE=104857600
EOF

echo "==> Cai dat API..."
cd server
npm ci --omit=dev 2>/dev/null || npm install --omit=dev
npx prisma generate
npx prisma migrate deploy
if [ "$RUN_SEED" = "true" ]; then
  node prisma/seed.js || true
fi
cd ..

echo "==> Build client..."
echo "VITE_API_URL=/api" > client/.env
cd client
npm ci 2>/dev/null || npm install
npm run build
cd ..

echo "==> Build admin..."
echo "VITE_API_URL=/api" > admin/.env
cd admin
npm ci 2>/dev/null || npm install
npm run build
cd ..

echo "==> PM2..."
pm2 delete thangtinhoc-api 2>/dev/null || true
pm2 start deploy/ecosystem.config.cjs
pm2 save

if [ -d "/www/server/panel" ]; then
  echo "==> aaPanel: Trang web -> Reverse proxy:"
  echo "    /api     -> http://127.0.0.1:${PORT}"
  echo "    /uploads -> http://127.0.0.1:${PORT}"
else
  SITE_CONF="/etc/nginx/sites-available/thangtinhoc"
  ADMIN_CONF="/etc/nginx/sites-available/thangtinhoc-admin"
  sed "s|__DOMAIN__|${DOMAIN}|g; s|__APP_DIR__|${APP_DIR}|g; s|__PORT__|${PORT}|g" deploy/nginx/site.conf.template > "$SITE_CONF"
  sed "s|__ADMIN_DOMAIN__|${ADMIN_DOMAIN}|g; s|__APP_DIR__|${APP_DIR}|g" deploy/nginx/admin.conf.template > "$ADMIN_CONF"
  ln -sf "$SITE_CONF" /etc/nginx/sites-enabled/thangtinhoc 2>/dev/null || true
  ln -sf "$ADMIN_CONF" /etc/nginx/sites-enabled/thangtinhoc-admin 2>/dev/null || true
  nginx -t && systemctl reload nginx
fi

echo ""
echo "=========================================="
echo " DEPLOY THANH CONG!"
echo " Website: https://${DOMAIN}"
echo " Admin:   https://${ADMIN_DOMAIN}"
echo " Test:    curl http://127.0.0.1:${PORT}/api/health"
echo "=========================================="