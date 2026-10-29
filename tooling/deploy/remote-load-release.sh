#!/usr/bin/env bash
set -Eeuo pipefail
TAG="${1:?Usage: remote-load-release.sh IMAGE_TAG}"
IMAGES_TAR="${HOME}/kapas-images-${TAG}.tar"
if [[ ! -f "${IMAGES_TAR}" ]]; then
  echo "Missing ${IMAGES_TAR}" >&2
  exit 1
fi
echo "Loading images from ${IMAGES_TAR}..."
docker load -i "${IMAGES_TAR}"
# shellcheck disable=SC1091
source /etc/kapas/image.env
cat > "${HOME}/kapas-image.env" <<EOF
RELEASE_VERSION=${TAG}
API_IMAGE=kapas-api:${TAG}
WORKER_IMAGE=kapas-worker:${TAG}
PORTAL_IMAGE=kapas-portal:local-202610291600
MIGRATE_IMAGE=kapas-migrate:${TAG}
MINIO_IMAGE=${MINIO_IMAGE}
EOF
export ENV_FILE=/etc/kapas/production.env
export IMAGE_ENV_FILE="${HOME}/kapas-image.env"
export RELEASE_VERSION="${TAG}"
export SKIP_COMPOSE_PULL=true
bash "${HOME}/kapas-prod-compose/scripts/release.sh"
echo "Release complete tag=${TAG}"
