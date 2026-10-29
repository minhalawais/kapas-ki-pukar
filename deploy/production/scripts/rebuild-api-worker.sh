#!/usr/bin/env bash
# Rebuild and roll the API + worker images from /opt/kapas (fixes missing intake routes).
set -Eeuo pipefail
APP_ROOT="${APP_ROOT:-/opt/kapas}"
TAG="${RELEASE_TAG:-local-$(date -u +%Y%m%d%H%M)}"

set -a
# shellcheck disable=SC1091
source /etc/kapas/production.env
# shellcheck disable=SC1091
source /etc/kapas/image.env
set +a

cd "$APP_ROOT"
docker build -t "kapas-api:${TAG}" -f apps/api/Dockerfile .
docker build -t "kapas-worker:${TAG}" -f apps/worker/Dockerfile .

cat > /etc/kapas/image.env <<EOF
RELEASE_VERSION=${TAG}
API_IMAGE=kapas-api:${TAG}
WORKER_IMAGE=kapas-worker:${TAG}
PORTAL_IMAGE=${PORTAL_IMAGE}
MIGRATE_IMAGE=${MIGRATE_IMAGE}
MINIO_IMAGE=${MINIO_IMAGE}
EOF
chown root:deploy /etc/kapas/image.env

export ENV_FILE=/etc/kapas/production.env
export IMAGE_ENV_FILE=/etc/kapas/image.env
export RELEASE_VERSION="${TAG}"
export SKIP_COMPOSE_PULL=true
bash "$APP_ROOT/deploy/production/scripts/release.sh"

echo "API/worker rebuilt tag=${TAG}. Verify intake route returns 400/422 (not 404):"
echo "  curl -s -o /dev/null -w '%{http_code}' -X POST https://api.kapaskipukar.com/api/v3/intake-submissions -H 'content-type: application/json' -d '{}'"
