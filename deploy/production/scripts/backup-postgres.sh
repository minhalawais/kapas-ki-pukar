#!/usr/bin/env bash
set -Eeuo pipefail

: "${BACKUP_DIR:?BACKUP_DIR is required}"
: "${POSTGRES_CONTAINER:?POSTGRES_CONTAINER is required}"
: "${POSTGRES_DB:?POSTGRES_DB is required}"
: "${POSTGRES_USER:?POSTGRES_USER is required}"
umask 077
mkdir -p "$BACKUP_DIR"
timestamp="$(date -u +%Y%m%dT%H%M%SZ)"
output="$BACKUP_DIR/${POSTGRES_DB}-${timestamp}.dump"
docker exec "$POSTGRES_CONTAINER" pg_dump --format=custom --no-owner --no-acl --username="$POSTGRES_USER" --dbname="$POSTGRES_DB" > "$output"
sha256sum "$output" > "$output.sha256"
find "$BACKUP_DIR" -type f -name '*.dump' -mtime +30 -delete
find "$BACKUP_DIR" -type f -name '*.sha256' -mtime +30 -delete
printf 'backup=%s\n' "$output"
