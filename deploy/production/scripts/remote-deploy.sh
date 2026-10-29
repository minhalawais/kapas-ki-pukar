#!/usr/bin/env bash
# Runs on the VPS after CI writes /etc/kapas/image.env
set -Eeuo pipefail

APP_ROOT="${APP_ROOT:-/opt/kapas}"
export ENV_FILE="${ENV_FILE:-/etc/kapas/production.env}"
export IMAGE_ENV_FILE="${IMAGE_ENV_FILE:-/etc/kapas/image.env}"

if [[ ! -f "$ENV_FILE" ]]; then
  echo "Missing ${ENV_FILE}. Copy deploy/production/kapaskipukar.env.example and fill secrets." >&2
  exit 1
fi
if [[ ! -f "$IMAGE_ENV_FILE" ]]; then
  echo "Missing ${IMAGE_ENV_FILE}. CI should write image tags before deploy." >&2
  exit 1
fi

set -a
# shellcheck disable=SC1091
source "$ENV_FILE"
set +a

cd "$APP_ROOT"
if [[ -d .git ]]; then
  git fetch --depth=1 origin "${DEPLOY_REF:-main}"
  if [[ -n "${DEPLOY_SHA:-}" ]]; then
    git checkout --detach "${DEPLOY_SHA}"
  else
    git checkout FETCH_HEAD
  fi
fi

bash deploy/production/scripts/release.sh
