#!/usr/bin/env bash
set -Eeuo pipefail

APP_ROOT="${APP_ROOT:-/opt/kapas}"
RELEASE_TAG="${RELEASE_TAG:-local-$(date +%Y%m%d%H%M)}"
TARBALL="${TARBALL:-/tmp/kapas-deploy.tgz}"

export DEBIAN_FRONTEND=noninteractive
apt-get update
apt-get install -y ca-certificates curl git nginx certbot python3-certbot-nginx openssl

if ! command -v docker >/dev/null 2>&1; then
  curl -fsSL https://get.docker.com | sh
fi
apt-get install -y docker-compose-plugin

rm -rf "$APP_ROOT"
mkdir -p "$APP_ROOT"
tar -xzf "$TARBALL" -C "$APP_ROOT"
if [[ -d /tmp/kapas-overlay/deploy ]]; then
  cp -a /tmp/kapas-overlay/deploy "$APP_ROOT/"
fi
chmod +x "$APP_ROOT"/deploy/production/scripts/*.sh

install -d -m 700 /etc/kapas
if [[ ! -f /etc/kapas/production.env ]]; then
  MIG_PW="$(openssl rand -hex 24)"
  APP_PW="$(openssl rand -hex 24)"
  REDIS_PW="$(openssl rand -hex 24)"
  MINIO_PW="$(openssl rand -hex 24)"
  SESSION_SECRET="$(openssl rand -hex 32)"
  IDENTITY_PEPPER="$(openssl rand -hex 32)"
  METRICS_TOKEN="$(openssl rand -hex 24)"
  WEBHOOK_SECRET="$(openssl rand -hex 32)"
  TUSD_SECRET="$(openssl rand -hex 32)"
  EVIDENCE_KEK="$(openssl rand -hex 32)"
  cat > /etc/kapas/production.env <<EOF
RELEASE_VERSION=${RELEASE_TAG}
EDGE_TLS=nginx
PORTAL_HOST=kapaskipukar.com
API_HOST=api.kapaskipukar.com
TLS_ADMIN_EMAIL=ops@kapaskipukar.com
NEXT_PUBLIC_API_URL=https://api.kapaskipukar.com
PUBLIC_API_URL=https://api.kapaskipukar.com
PORTAL_ORIGIN=https://kapaskipukar.com
POSTGRES_DB=kapas_production
POSTGRES_MIGRATOR_USER=kapas_migrator
POSTGRES_MIGRATOR_PASSWORD=${MIG_PW}
POSTGRES_APP_USER=kapas_app
POSTGRES_APP_PASSWORD=${APP_PW}
MIGRATION_DATABASE_URL=postgresql://kapas_migrator:${MIG_PW}@postgres:5432/kapas_production?schema=public
DATABASE_URL=postgresql://kapas_app:${APP_PW}@postgres:5432/kapas_production?schema=public
REDIS_PASSWORD=${REDIS_PW}
REDIS_URL=redis://:${REDIS_PW}@redis:6379/0
ENCRYPTION_KEY_ID=production-v1
SESSION_SECRET=${SESSION_SECRET}
IDENTITY_LOOKUP_PEPPER=${IDENTITY_PEPPER}
INTERNAL_METRICS_TOKEN=${METRICS_TOKEN}
PROVIDER_WEBHOOK_SECRET=${WEBHOOK_SECRET}
TUSD_HOOK_SECRET=${TUSD_SECRET}
EVIDENCE_KEK_SECRET=${EVIDENCE_KEK}
MINIO_ROOT_USER=kapas-minio-prod
MINIO_ROOT_PASSWORD=${MINIO_PW}
EXPO_PUSH_ENABLED=false
LOG_LEVEL=info
TRUST_PROXY_COUNT=1
QUEUE_PREFIX=kapas-production
WORKER_CONCURRENCY=2
EOF
  chmod 640 /etc/kapas/production.env
fi

set -a
# shellcheck disable=SC1091
source /etc/kapas/production.env
set +a

cd "$APP_ROOT"
docker build -t "kapas-minio:RELEASE.2025-10-15T17-29-55Z" -f deploy/minio/Dockerfile deploy/minio
docker build -t "kapas-api:${RELEASE_TAG}" -f apps/api/Dockerfile .
docker build -t "kapas-worker:${RELEASE_TAG}" -f apps/worker/Dockerfile .
docker build -t "kapas-migrate:${RELEASE_TAG}" -f packages/database/Dockerfile .
docker build -t "kapas-portal:${RELEASE_TAG}" \
  --build-arg "NEXT_PUBLIC_API_URL=${NEXT_PUBLIC_API_URL}" \
  --build-arg "NEXT_PUBLIC_BACKEND_ENABLED=true" \
  --build-arg "NEXT_PUBLIC_ENABLE_DEMO_CREDENTIALS=false" \
  -f apps/puwf-portal/Dockerfile .

cat > /etc/kapas/image.env <<EOF
RELEASE_VERSION=${RELEASE_TAG}
API_IMAGE=kapas-api:${RELEASE_TAG}
WORKER_IMAGE=kapas-worker:${RELEASE_TAG}
PORTAL_IMAGE=kapas-portal:${RELEASE_TAG}
MIGRATE_IMAGE=kapas-migrate:${RELEASE_TAG}
MINIO_IMAGE=kapas-minio:RELEASE.2025-10-15T17-29-55Z
EOF
chmod 640 /etc/kapas/image.env
chown root:deploy /etc/kapas /etc/kapas/production.env /etc/kapas/image.env
chmod 750 /etc/kapas

export ENV_FILE=/etc/kapas/production.env
export IMAGE_ENV_FILE=/etc/kapas/image.env
export EDGE_TLS=nginx
bash "$APP_ROOT/deploy/production/scripts/release.sh"

if [[ -f /etc/nginx/sites-enabled/kapas-portal ]]; then
  ln -sf "$APP_ROOT/deploy/production/nginx/cottonworkersvoice-legacy.conf" \
    /etc/nginx/sites-available/cottonworkersvoice-legacy.conf
  ln -sf /etc/nginx/sites-available/cottonworkersvoice-legacy.conf \
    /etc/nginx/sites-enabled/cottonworkersvoice-legacy.conf
  rm -f /etc/nginx/sites-enabled/kapas-portal
fi
ln -sf "$APP_ROOT/deploy/production/nginx/kapaskipukar-production.conf" \
  /etc/nginx/sites-available/kapaskipukar-production.conf
ln -sf /etc/nginx/sites-available/kapaskipukar-production.conf \
  /etc/nginx/sites-enabled/kapaskipukar-production.conf
rm -f /etc/nginx/sites-enabled/kapaskipukar.conf
nginx -t
systemctl reload nginx

certbot certonly --nginx --expand \
  -d cottonworkersvoice.com -d www.cottonworkersvoice.com \
  -d kapaskipukar.com -d www.kapaskipukar.com -d api.kapaskipukar.com \
  --non-interactive --agree-tos -m "${TLS_ADMIN_EMAIL}" || true
nginx -t && systemctl reload nginx

curl -fsS "http://127.0.0.1:4002/api/v1/health/live" || curl -fsS "http://127.0.0.1:4002/api/v1/health/ready" || true
echo "Deploy finished tag=${RELEASE_TAG}"
