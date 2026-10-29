#!/usr/bin/env bash
set -Eeuo pipefail
TAG="${1:?Usage: remote-portal-up.sh IMAGE_TAG}"
ENV_FILE=/etc/kapas/production.env
IMAGE_ENV_FILE="$HOME/kapas-image.env"
# shellcheck disable=SC1091
source /etc/kapas/image.env 2>/dev/null || true
# shellcheck disable=SC1091
source "$IMAGE_ENV_FILE" 2>/dev/null || true
cat > "$IMAGE_ENV_FILE" <<EOF
RELEASE_VERSION=${RELEASE_VERSION:-local-202610290953}
API_IMAGE=${API_IMAGE:-kapas-api:local-202610290953}
WORKER_IMAGE=${WORKER_IMAGE:-kapas-worker:local-202610290953}
PORTAL_IMAGE=kapas-portal:${TAG}
MIGRATE_IMAGE=${MIGRATE_IMAGE:-kapas-migrate:local-202610290953}
MINIO_IMAGE=${MINIO_IMAGE:-kapas-minio:RELEASE.2025-10-15T17-29-55Z}
EOF
export ENV_FILE IMAGE_ENV_FILE RELEASE_VERSION="${RELEASE_VERSION:-local-202610290953}"
export SKIP_COMPOSE_PULL=true
COMPOSE=(docker compose -p kapas-production --env-file "$ENV_FILE" --env-file "$IMAGE_ENV_FILE")
COMPOSE+=(-f /opt/kapas/deploy/production/compose.yml)
if [[ -f "$HOME/kapas-worker-tmpfs.override.yml" ]]; then
  COMPOSE+=(-f "$HOME/kapas-worker-tmpfs.override.yml")
fi
"${COMPOSE[@]}" up -d portal --force-recreate --no-deps
printf '%s\n' "Portal recreated with kapas-portal:${TAG}"
