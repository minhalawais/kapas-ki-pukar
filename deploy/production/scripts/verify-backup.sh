#!/usr/bin/env bash
set -Eeuo pipefail
: "${BACKUP_FILE:?BACKUP_FILE is required}"
sha256sum --check "${BACKUP_FILE}.sha256"
pg_restore --list "$BACKUP_FILE" >/dev/null
printf 'verified=%s\n' "$BACKUP_FILE"
