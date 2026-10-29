#!/usr/bin/env bash
set -Eeuo pipefail
APP_ROOT="${APP_ROOT:-/opt/kapas}"
TAG="${RELEASE_TAG:-local-202610281503}"

set -a
# shellcheck disable=SC1091
source /etc/kapas/production.env
set +a

cd "$APP_ROOT"
if grep -q '^apps/puwf-portal$' .dockerignore 2>/dev/null; then
  sed -i '/^apps\/puwf-portal$/d' .dockerignore
fi
docker build -t "kapas-api:${TAG}" -f apps/api/Dockerfile .
docker build -t "kapas-worker:${TAG}" -f apps/worker/Dockerfile .
docker build -t "kapas-migrate:${TAG}" -f packages/database/Dockerfile .
docker build -t "kapas-portal:${TAG}" \
  --build-arg "NEXT_PUBLIC_API_URL=${NEXT_PUBLIC_API_URL}" \
  --build-arg "NEXT_PUBLIC_BACKEND_ENABLED=true" \
  --build-arg "NEXT_PUBLIC_ENABLE_DEMO_CREDENTIALS=false" \
  -f apps/puwf-portal/Dockerfile .

cat > /etc/kapas/image.env <<EOF
RELEASE_VERSION=${TAG}
API_IMAGE=kapas-api:${TAG}
WORKER_IMAGE=kapas-worker:${TAG}
PORTAL_IMAGE=kapas-portal:${TAG}
MIGRATE_IMAGE=kapas-migrate:${TAG}
MINIO_IMAGE=kapas-minio:RELEASE.2025-10-15T17-29-55Z
EOF
chown root:deploy /etc/kapas/image.env

export ENV_FILE=/etc/kapas/production.env
export IMAGE_ENV_FILE=/etc/kapas/image.env
export RELEASE_VERSION="${TAG}"
export SKIP_COMPOSE_PULL=true
bash "$APP_ROOT/deploy/production/scripts/release.sh"

# nginx split (if not done)
ln -sf "$APP_ROOT/deploy/production/nginx/cottonworkersvoice-legacy.conf" /etc/nginx/sites-available/cottonworkersvoice-legacy.conf
ln -sf /etc/nginx/sites-available/cottonworkersvoice-legacy.conf /etc/nginx/sites-enabled/cottonworkersvoice-legacy.conf
rm -f /etc/nginx/sites-enabled/kapas-portal
ln -sf "$APP_ROOT/deploy/production/nginx/kapaskipukar-production.conf" /etc/nginx/sites-available/kapaskipukar-production.conf
ln -sf /etc/nginx/sites-available/kapaskipukar-production.conf /etc/nginx/sites-enabled/kapaskipukar-production.conf
nginx -t && systemctl reload nginx

echo "Continue deploy finished tag=${TAG}"
