# Production deployment and handover

Initial VPS setup and GitHub Actions deploy: see [HOSTING.md](./HOSTING.md).

The release operator owns the change window; the PUWF operations owner owns go/no-go; the security/privacy owner may stop intake. Never run `docker compose down -v` in production. Database, Redis and evidence volumes are persistent.

## Release

1. Verify the release commit, immutable image digests, SBOM, vulnerability report and backup age.
2. Inject the production `.env` from a root-owned secret file outside Git.
3. Run `docker compose config --quiet` and confirm secrets are not printed.
4. Start PostgreSQL/Redis, verify health, then apply `MIGRATION_DATABASE_URL` with `pnpm --filter @kapas/database db:migrate:deploy`.
5. Run `deploy/production/scripts/release.sh` and verify API liveness/readiness, worker readiness, portal login, audit writes and metrics.
6. Record release version, image digests, migration IDs, operator, backup checksum and smoke-test result.

## Rollback

Stop intake, preserve audit evidence, restore previous compatible image digests, and run smoke tests. Do not reverse migrations. If schema compatibility is in doubt, restore the last verified backup into an isolated database and reconcile evidence hashes before deciding.

## Backup and restore

Run `backup-postgres.sh` daily and send the encrypted dump and checksum to an off-VPS destination. Verify with `verify-backup.sh` weekly and perform a quarterly isolated restore. WAL/PITR must be enabled at the Hostinger/PostgreSQL layer before claiming the 15-minute database RPO.

## Incident runbooks

- **Readiness failure:** inspect `docker compose ps`, API dependency details, PostgreSQL connections and Redis authentication before restarting services.
- **Queue backlog:** inspect outbox age/dead letters, restart only the affected worker, then replay approved events idempotently.
- **Disk pressure:** stop exports, preserve the evidence volume, remove only expired exports/quarantine artifacts, and never delete evidence ciphertext manually.
- **Credential/key compromise:** disable affected accounts/providers, preserve audit logs, rotate secrets/keys, re-authenticate staff, and record the incident owner.
- **Privacy incident:** disable external processing/intake if necessary, preserve the minimum audit record, notify the privacy owner, and follow the approved breach process.
