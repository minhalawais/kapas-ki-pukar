#!/usr/bin/env bash
set -Eeuo pipefail
TAG="local-$(date -u +%Y%m%d%H%M)"
BUILD_DIR="${HOME}/kapas-release-${TAG}"
mkdir -p "${BUILD_DIR}"
tar -xzf ~/kapas-docker.tgz -C "${BUILD_DIR}"
cd "${BUILD_DIR}"
echo "=== Building ${TAG} ==="
docker build -t "kapas-api:${TAG}" -f apps/api/Dockerfile .
docker build -t "kapas-worker:${TAG}" -f apps/worker/Dockerfile .
docker build -t "kapas-migrate:${TAG}" -f packages/database/Dockerfile .
# shellcheck disable=SC1091
source /etc/kapas/image.env
cat > ~/kapas-image.env <<EOF
RELEASE_VERSION=${TAG}
API_IMAGE=kapas-api:${TAG}
WORKER_IMAGE=kapas-worker:${TAG}
PORTAL_IMAGE=kapas-portal:local-202610291600
MIGRATE_IMAGE=kapas-migrate:${TAG}
MINIO_IMAGE=${MINIO_IMAGE}
EOF
export ENV_FILE=/etc/kapas/production.env
export IMAGE_ENV_FILE=~/kapas-image.env
export RELEASE_VERSION="${TAG}"
export SKIP_COMPOSE_PULL=true
bash deploy/production/scripts/release.sh
echo "DONE_TAG=${TAG}"
