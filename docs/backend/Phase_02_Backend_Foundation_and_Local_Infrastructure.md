# Phase 02 — Backend Foundation and Local Infrastructure

**Implementation status:** Complete for local implementation and verification as of 2026-10-17. Code quality, unit and integration tests, migrations, application builds, Expo export, live readiness, non-root container builds, image scans, graceful shutdown and volume-preserving recovery all pass. Two high-severity transitive build-tool advisories have no patched release and are covered by a time-boxed security-owner decision. Remote GitHub-hosted execution awaits selection of a repository and first push. See [phase-02/VERIFICATION.md](phase-02/VERIFICATION.md).

**Phase objective:** Add production-shaped backend applications and reproducible infrastructure without implementing business workflows.  
**Depends on:** Phase 01 approved and repository quality gates green.  
**Produces:** Runnable API and worker, local PostgreSQL/Redis stack, configuration validation, health checks, CI pipelines and engineering conventions.

**Implementation approval:** Approved by the project owner on 2026-10-16. The six stale voice assets are an acknowledged, fail-closed mobile release gate but do not block backend-foundation development. No voice approval is waived, and production/staging access still requires named PUWF role assignments and formal policy ratification.

## 1. Scope

Create:

- `apps/api` for the NestJS/Fastify REST API;
- `apps/worker` for asynchronous job consumers;
- `packages/api-contracts` for shared Zod request/response schemas;
- `packages/database` for Prisma client, migrations and database test utilities;
- `packages/security` for redaction and cryptographic interfaces;
- `packages/observability` for logging, metrics and trace conventions;
- local Docker Compose services for PostgreSQL and Redis;
- production-shaped configuration and health checks.

## 2. Bootstrap requirements

The API must include:

- `/api/v1/health/live` process liveness;
- `/api/v1/health/ready` dependency readiness;
- `/api/v1/meta` safe build/version metadata;
- global request ID handling;
- JSON body and parameter validation;
- a consistent error envelope;
- bounded request-body limits;
- security headers;
- explicit CORS allowlist;
- graceful shutdown;
- structured logging with redaction;
- OpenAPI generation disabled or protected in production.

The worker must include:

- graceful startup and shutdown;
- queue connection health;
- structured job logging;
- bounded concurrency;
- retry classification;
- dead-letter/final-failure recording interface;
- no business jobs beyond a harmless diagnostics job.

## 3. Configuration contract

Validate configuration at process startup. At minimum define:

```text
NODE_ENV
APP_VERSION
API_PORT
PUBLIC_API_URL
PORTAL_ORIGIN
DATABASE_URL
REDIS_URL
LOG_LEVEL
TRUST_PROXY_COUNT
EVIDENCE_ROOT
QUARANTINE_ROOT
ENCRYPTION_KEY_ID
SESSION_SECRET
```

Rules:

- missing or malformed required settings stop startup;
- secrets never receive defaults in staging or production;
- production rejects wildcard CORS;
- environment variables are mapped once into a typed configuration object;
- application code does not read `process.env` directly outside the configuration module;
- configuration diagnostics show keys and validation status, never secret values.

## 4. API conventions

Implement centrally:

- URI versioning with `/api/v1`;
- UTC timestamps;
- maximum pagination size;
- request correlation ID propagation;
- standard validation field errors;
- safe `404`, `409`, `413`, `415`, `422`, `429` and `503` responses;
- proxy-aware client IP handling with a fixed trusted-proxy count;
- route-level rate-limit hooks;
- response serialization from explicit schemas.

Database rows or ORM objects must never be returned directly from controllers.

## 5. Observability baseline

Every request log may include:

- timestamp;
- severity;
- service and version;
- environment;
- request ID;
- route template, method and status;
- duration;
- authenticated actor ID when available;
- error code.

It must not include request/response bodies, passwords, session tokens, authorization headers, contact details, CNIC data, exact coordinates, transcripts, evidence filenames supplied by users, or database connection strings.

Expose Prometheus-compatible process and HTTP metrics only on a private path or network. Establish OpenTelemetry interfaces even if the first deployment exports only traces to logs or a local collector.

## 6. Local infrastructure

The development Compose file must provide:

- PostgreSQL with a health check and named volume;
- Redis with authentication or private-only binding and health check;
- isolated network;
- deterministic ports documented for developers;
- safe local credentials in a non-production example file;
- one-command startup and teardown;
- no destructive volume removal in ordinary developer commands.

Do not add production evidence storage or ClamAV until Phase 05.

## 7. Database foundation

Initialize Prisma with:

- separate runtime and migration database credentials where feasible;
- migration directory committed to source;
- an initial metadata migration only;
- connection pooling configuration appropriate to a single VPS;
- explicit transaction timeout policy;
- test database reset utilities restricted to local/CI;
- a production guard that rejects seed/reset operations.

No complaint business schema is finalized until Phase 03.

## 8. CI pipeline

CI must run on a supported Node.js LTS version and include:

1. Frozen dependency install.
2. Formatting check.
3. Lint.
4. Typecheck.
5. Unit tests with bounded concurrency.
6. PostgreSQL-backed integration tests.
7. Migration from empty database.
8. OpenAPI generation and diff check.
9. Application builds.
10. Container image build.
11. Dependency and image vulnerability reports.

Secrets used in CI must be ephemeral and isolated from production.

## 9. Developer workflow

Document commands for:

- starting dependencies;
- running API and worker in watch mode;
- creating and reviewing a migration;
- running unit and integration tests;
- regenerating OpenAPI and typed clients;
- checking health endpoints;
- viewing safe local logs;
- resetting only the local test database.

## 10. Security requirements

- Run application processes as non-root.
- Pin image major/minor versions and review upgrades.
- Do not expose PostgreSQL or Redis outside the Docker host in production templates.
- Add dependency lockfile integrity to CI.
- Add secret scanning.
- Ensure production images exclude source maps unless access-controlled and justified.
- Return generic internal-server errors while retaining request IDs for diagnosis.

## 11. Tests

- Configuration schema accepts valid local configuration and rejects missing production secrets.
- Health readiness fails when PostgreSQL or Redis is unavailable.
- Liveness does not depend on external services.
- Error envelopes are stable and redact internal stack traces.
- Request IDs are generated and propagated.
- Oversized JSON bodies are rejected.
- CORS permits only configured origins.
- Graceful shutdown stops accepting work and closes dependencies.
- OpenAPI generation is deterministic.

## 12. Deliverables

- API, worker and new shared packages.
- Local Compose environment.
- Typed configuration module.
- Error, logging and observability foundations.
- CI pipeline and container builds.
- Developer setup/runbook documentation.
- Approved initial OpenAPI shell.

## 13. Exit criteria

- A new developer can start dependencies and both processes from documented commands.
- CI passes from a clean checkout.
- Health checks accurately represent process and dependency state.
- No sensitive configuration is logged or committed.
- Containers stop gracefully and run without root privileges.
- Empty-database migration and rollback/recovery procedure are demonstrated.

## 14. Non-goals

- No real staff authentication.
- No complaint persistence.
- No evidence uploads.
- No AI or notification providers.
- No frontend service is switched to the API.

