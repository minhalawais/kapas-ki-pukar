# Phase 02 Developer Runbook

## Prerequisites

- Node.js 24 LTS and pnpm 9.15.0.
- Docker Engine with Compose v2 support.
- Ports `4000`, `5432` and `6379` available, or corresponding local overrides.
- Synthetic data only.

On Windows, `corepack enable` may require Administrator access because Node is installed under `Program Files`. It is not required when `pnpm --version` already reports `9.15.0`; use the existing pnpm executable instead.

## First-time setup

From the repository root:

```powershell
Copy-Item -LiteralPath deploy/compose/.env.local.example -Destination deploy/compose/.env.local
pnpm install --frozen-lockfile
pnpm db:generate
pnpm infra:up
```

The copied Compose environment contains intentionally non-production local credentials and is Git-ignored. Never reuse them outside a developer machine.

Create a process environment from `.env.example` using your preferred secret-aware environment loader. Do not import the entire frontend `.env` implicitly into staging or production. Required backend keys are validated at startup, and values are never printed by configuration diagnostics.

## Database migration

For local development, set `MIGRATION_DATABASE_URL` to the local migrator URL and run:

```powershell
pnpm db:migrate:deploy
pnpm --filter @kapas/database db:migrate:status
```

Use `pnpm db:migrate` only when intentionally authoring a reviewed migration. Review generated SQL before committing it. Phase 02 contains only `system_metadata`; complaint business tables belong to Phase 03.

`pnpm db:reset:test` is deliberately destructive but refuses production and refuses any database whose name does not end in `_test`. Never work around that guard.

## Run API and worker

In separate terminals with the validated backend environment loaded:

```powershell
pnpm dev:api
pnpm dev:worker
```

The API defaults to `http://127.0.0.1:4000`. Verify:

```powershell
Invoke-RestMethod http://127.0.0.1:4000/api/v1/health/live
Invoke-RestMethod http://127.0.0.1:4000/api/v1/health/ready
Invoke-RestMethod http://127.0.0.1:4000/api/v1/meta
```

Readiness must return `503` if PostgreSQL or Redis is unavailable; liveness must remain `200` while the process is healthy. Local OpenAPI is available only when `OPENAPI_ENABLED=true`. Production configuration rejects enabled public OpenAPI.

Metrics require the `x-internal-metrics-token` header and should be reachable only over a private network:

```powershell
Invoke-WebRequest http://127.0.0.1:4000/internal/metrics -Headers @{
  'x-internal-metrics-token' = $env:INTERNAL_METRICS_TOKEN
}
```

## Tests and contract generation

```powershell
pnpm typecheck
pnpm lint
pnpm test
pnpm test:integration
pnpm openapi:generate
pnpm openapi:check
pnpm format:check
```

Integration tests activate only when `TEST_DATABASE_URL` and `REDIS_URL` are present. A skipped integration suite is not successful integration evidence.

## Logs and shutdown

Use `pnpm infra:logs` for dependency logs. Application logs are structured JSON and omit bodies, authorization/cookie values, contact/CNIC data, coordinates, transcripts, evidence metadata and connection strings.

Stop processes with `Ctrl+C`; Nest shutdown hooks close database, Redis, queue and worker resources. Stop dependencies without deleting data:

```powershell
pnpm infra:down
```

Do not add `--volumes` to the ordinary shutdown command.

## Container builds

```powershell
docker build -f apps/api/Dockerfile -t kapas-api:phase02 .
docker build -f apps/worker/Dockerfile -t kapas-worker:phase02 .
```

Both final images run as the unprivileged `node` user and exclude source maps. Production Compose/Caddy deployment is Phase 10, not Phase 02.

## Recovery and rollback

- Application rollback: deploy the preceding immutable image only when its schema compatibility is confirmed.
- Migration failure: stop application promotion, retain the migration error and database backup evidence, and prefer a reviewed forward fix. Restore only from a verified disposable backup during this phase.
- Redis loss: Phase 02 contains diagnostics only. Stop the worker, restore/recreate Redis, then restart it. Business outbox recovery starts in Phase 08.
- Docker failure: collect `docker info`, Docker Desktop/backend logs and Compose output. Repair the engine without removing named volumes, then rerun the verification sequence.
