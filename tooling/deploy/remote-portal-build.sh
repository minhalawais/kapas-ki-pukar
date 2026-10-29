#!/usr/bin/env bash
set -Eeuo pipefail
TAG="${1:?Usage: remote-portal-build.sh IMAGE_TAG}"
ARCHIVE="${2:-$HOME/kapas-portal-prebuilt.tgz}"
BUILD="$HOME/kapas-portal-build-${TAG}"
rm -rf "$BUILD"
mkdir -p "$BUILD"
tar -xzf "$ARCHIVE" -C "$BUILD"
cd "$BUILD"
if [[ -f Dockerfile && -d standalone ]]; then
  docker build -t "kapas-portal:${TAG}" -f Dockerfile .
else
  set -a
  # shellcheck disable=SC1091
  source /etc/kapas/production.env
  set +a
  docker build -t "kapas-portal:${TAG}" \
    --build-arg "NEXT_PUBLIC_API_URL=${NEXT_PUBLIC_API_URL}" \
    --build-arg "NEXT_PUBLIC_BACKEND_ENABLED=true" \
    --build-arg "NEXT_PUBLIC_ENABLE_DEMO_CREDENTIALS=false" \
    -f apps/puwf-portal/Dockerfile .
fi
printf '%s\n' "Built kapas-portal:${TAG}"
