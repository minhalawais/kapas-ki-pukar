#!/usr/bin/env bash
set -Eeuo pipefail
: "${ENV_FILE:?ENV_FILE is required}"
: "${IMAGE_ENV_FILE:?IMAGE_ENV_FILE is required}"
: "${RELEASE_VERSION:?RELEASE_VERSION is required}"

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROD_DIR="$(cd "${SCRIPT_DIR}/.." && pwd)"

set -a
# shellcheck disable=SC1090
source "$ENV_FILE"
set +a

compose_files=(-f "${PROD_DIR}/compose.yml")
if [[ "${EDGE_TLS:-nginx}" == "nginx" ]]; then
  compose_files+=(-f "${PROD_DIR}/compose.nginx-edge.yml")
fi

compose() {
  docker compose --env-file "$ENV_FILE" --env-file "$IMAGE_ENV_FILE" "${compose_files[@]}" "$@"
}

compose config --quiet
if [[ "${SKIP_COMPOSE_PULL:-false}" == "true" ]]; then
  printf '%s\n' "Skipping compose pull (local or pre-loaded images)."
else
  compose pull
fi

compose up -d postgres redis
compose up -d minio
compose run --rm minio-init
compose up -d clamav hook-proxy

printf '%s\n' "Waiting for PostgreSQL before migrations..."
until compose exec -T postgres pg_isready -U "$POSTGRES_MIGRATOR_USER" -d "$POSTGRES_DB"; do sleep 2; done

printf '%s\n' "Applying database migrations..."
compose --profile migrate run --rm --user root migrate

compose exec -T postgres psql -U "$POSTGRES_MIGRATOR_USER" -d "$POSTGRES_DB" <<SQL
GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA public TO "${POSTGRES_APP_USER}";
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO "${POSTGRES_APP_USER}";
SQL

compose up -d api worker portal tusd
if [[ "${EDGE_TLS:-nginx}" == "caddy" ]]; then
  compose --profile with-caddy up -d --wait caddy
fi
compose ps

printf '%s\n' "Release ${RELEASE_VERSION} is up. Verify portal login and API readiness."
