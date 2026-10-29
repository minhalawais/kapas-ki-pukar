#!/usr/bin/env bash
# Build Kapas images from ~/kapas-docker.tgz and roll the kapas-production stack.
# Does not require write access to /opt/kapas (uses extracted tree + ~/kapas-image.env).
set -Eeuo pipefail

ARCHIVE="${1:-${HOME}/kapas-docker.tgz}"
if [[ ! -f "$ARCHIVE" ]]; then
  echo "Missing archive: ${ARCHIVE}" >&2
  exit 1
fi

TAG="local-$(date -u +%Y%m%d%H%M)"
BUILD="$(mktemp -d "${TMPDIR:-/tmp}/kapas-release-${TAG}.XXXXXX")"
chmod u+rwx "$BUILD"
cleanup() {
  if [[ -d "$BUILD" ]]; then
    chmod -R u+rwX "$BUILD" 2>/dev/null || true
    rm -rf "$BUILD"
  fi
}
trap cleanup EXIT
printf '%s\n' "Extracting into ${BUILD}..."
tar -xzf "$ARCHIVE" -C "$BUILD" --no-same-owner --no-same-permissions --no-xattrs 2>/dev/null \
  || tar -xzf "$ARCHIVE" -C "$BUILD" --no-same-owner --no-same-permissions
chmod -R u+rwX "$BUILD"
cd "$BUILD"

set -a
# shellcheck disable=SC1091
source /etc/kapas/production.env
# shellcheck disable=SC1091
source /etc/kapas/image.env
set +a

echo "=== Building images ${TAG} ==="
docker build -t "kapas-api:${TAG}" -f apps/api/Dockerfile .
docker build -t "kapas-worker:${TAG}" -f apps/worker/Dockerfile .
docker build -t "kapas-migrate:${TAG}" -f packages/database/Dockerfile .
docker build -t "kapas-portal:${TAG}" -f apps/puwf-portal/Dockerfile \
  --build-arg "NEXT_PUBLIC_API_URL=${NEXT_PUBLIC_API_URL}" \
  --build-arg "NEXT_PUBLIC_BACKEND_ENABLED=true" \
  --build-arg "NEXT_PUBLIC_ENABLE_DEMO_CREDENTIALS=false" .

IMAGE_ENV="${HOME}/kapas-image.env"
cat > "$IMAGE_ENV" <<EOF
RELEASE_VERSION=${TAG}
API_IMAGE=kapas-api:${TAG}
WORKER_IMAGE=kapas-worker:${TAG}
PORTAL_IMAGE=kapas-portal:${TAG}
MIGRATE_IMAGE=kapas-migrate:${TAG}
MINIO_IMAGE=${MINIO_IMAGE}
EOF

export ENV_FILE=/etc/kapas/production.env
export IMAGE_ENV_FILE="$IMAGE_ENV"
export RELEASE_VERSION="${TAG}"
export SKIP_COMPOSE_PULL=true

bash deploy/production/scripts/release.sh

echo "DONE_TAG=${TAG}"
echo "Verify: curl -fsS https://api.kapaskipukar.com/api/v1/health/ready"
echo "Verify: curl -sI https://kapaskipukar.com/privacy | head -1"
