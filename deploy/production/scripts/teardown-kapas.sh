#!/usr/bin/env bash
# Remove Kapas Docker stack and install paths only (does not touch other nginx sites or apps).
set -Eeuo pipefail

APP_ROOT="${APP_ROOT:-/opt/kapas}"
PROJECT="${COMPOSE_PROJECT_NAME:-kapas-production}"

if [[ -d "${APP_ROOT}/deploy/production" ]]; then
  PROD_DIR="${APP_ROOT}/deploy/production"
  if [[ -f /etc/kapas/production.env && -f /etc/kapas/image.env ]]; then
    compose_files=(-f "${PROD_DIR}/compose.yml")
    if grep -q '^EDGE_TLS=nginx' /etc/kapas/production.env 2>/dev/null; then
      compose_files+=(-f "${PROD_DIR}/compose.nginx-edge.yml")
    fi
    docker compose --env-file /etc/kapas/production.env --env-file /etc/kapas/image.env \
      "${compose_files[@]}" down -v --remove-orphans || true
  fi
fi

docker ps -aq --filter "name=${PROJECT}-" | xargs -r docker rm -f
docker volume ls -q --filter "label=com.docker.compose.project=${PROJECT}" | xargs -r docker volume rm

rm -rf "$APP_ROOT"
rm -rf /etc/kapas
rm -f /etc/nginx/sites-enabled/kapaskipukar.conf
rm -f /etc/nginx/sites-available/kapaskipukar.conf
nginx -t && systemctl reload nginx

printf '%s\n' "Kapas teardown complete on $(hostname)."
