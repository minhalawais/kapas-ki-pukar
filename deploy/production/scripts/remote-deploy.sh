#!/usr/bin/env bash
# Runs on the VPS after CI writes /etc/kapas/image.env
set -Eeuo pipefail

APP_ROOT="${APP_ROOT:-/opt/kapas}"
export ENV_FILE="${ENV_FILE:-/etc/kapas/production.env}"
export IMAGE_ENV_FILE="${IMAGE_ENV_FILE:-/etc/kapas/image.env}"
REPO_URL="${REPO_URL:-}"

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
if [[ ! -d .git ]]; then
  : "${REPO_URL:?REPO_URL is required when ${APP_ROOT} is not a Git checkout}"
  # Older bootstrap installs unpacked a tarball and therefore had no .git
  # directory. Initialise the checkout in place so CI/CD can take ownership
  # without another manual file upload or a destructive directory replacement.
  git init
  git remote add origin "$REPO_URL"
elif ! git remote get-url origin >/dev/null 2>&1; then
  : "${REPO_URL:?REPO_URL is required when origin is not configured}"
  git remote add origin "$REPO_URL"
fi

git fetch --depth=1 origin "${DEPLOY_REF:-main}"
if [[ -n "${DEPLOY_SHA:-}" ]]; then
  # Fetch the exact workflow commit even when it is not reachable from the
  # branch ref (for example, a detached/manual deployment).
  git fetch --depth=1 origin "$DEPLOY_SHA"
  git checkout --detach "$DEPLOY_SHA"
else
  git checkout FETCH_HEAD
fi

bash deploy/production/scripts/release.sh
