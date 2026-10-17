# Phase 02 Verification Evidence

**Evidence date:** 2026-10-17  
**Overall status:** Complete

## Environment

- Windows development host with Docker Desktop 4.83 and Linux Engine 29.6.2.
- Node.js 24 and pnpm 9.15.0.
- PostgreSQL 18.0 exposed only on `127.0.0.1:5433` for this project.
- Redis 8.2.2 exposed only on `127.0.0.1:6380` for this project.
- Synthetic local credentials and data only.

## Observed results

| Check                      | Observed result                                                                                                                            |
| -------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------ |
| `pnpm db:generate`         | Prisma Client 7.10.1 generated successfully.                                                                                               |
| `pnpm format:check`        | All Phase 02-owned files passed Prettier verification.                                                                                     |
| `pnpm typecheck`           | Passed in 17/17 workspaces.                                                                                                                |
| `pnpm lint`                | Passed in 17/17 workspaces with zero warnings.                                                                                             |
| `pnpm test`                | Passed in 17/17 workspaces.                                                                                                                |
| Empty migration and replay | `20261016000100_foundation_metadata` applied; the second deploy reported no pending migrations.                                            |
| `pnpm test:integration`    | PostgreSQL CRUD, API dependency health, and Redis worker diagnostics each passed; 3/3 tasks.                                               |
| `pnpm openapi:check`       | Committed OpenAPI artifact is deterministic/current.                                                                                       |
| API and worker builds      | Both Node 24 `tsup` production builds passed.                                                                                              |
| Portal build               | Next.js production build completed and generated all expected routes.                                                                      |
| Expo export                | Android, iOS, and web production bundles exported successfully under Expo SDK 57.                                                          |
| API image                  | Built successfully, runs as `node`, with a pruned production dependency tree.                                                              |
| Worker image               | Built successfully, runs as `node`, with a pruned production dependency tree.                                                              |
| Image vulnerability scan   | Trivy 0.67.2 with current DB, `--ignore-unfixed`, and CRITICAL/HIGH gate returned exit code 0 for both images.                             |
| Live API readiness         | Returned HTTP 200 with PostgreSQL `up` and Redis `up`.                                                                                     |
| Safe logging               | Configuration diagnostics reported only validation state; connection strings and secret values were not logged.                            |
| Graceful shutdown          | API and worker both exited 0 after SIGTERM; worker logged shutdown start and completion.                                                   |
| Recovery                   | Compose down/up without `--volumes` restored both healthy dependencies and preserved the migration ledger.                                 |
| Dependency audit           | 0 critical, 2 high, 4 moderate. The two high findings have no patched release and have a scoped decision in `SECURITY_RISK_ACCEPTANCE.md`. |

## Container hardening evidence

The runtime stages apply available Debian security updates, remove npm/Corepack because production starts directly with `node`, copy only the pruned production dependency tree and compiled output, and switch to the unprivileged `node` user. Trivy initially found fixed vulnerabilities in the stale pinned base layer and bundled npm toolchain; the hardened rebuild removed them, and both final scans passed.

Final runtime checks:

```text
/kapas-api-phase02-verify    exit=0 user=node
/kapas-worker-phase02-verify exit=0 user=node
readiness HTTP 200: postgres=up, redis=up
```

## CI and repository evidence

The repository was initialized locally on the evidence date. The commands represented by `.github/workflows/ci.yml` were executed against the local PostgreSQL/Redis services: frozen dependency state, Prisma generation, formatting, migrations and clean replay, typecheck, lint, unit and integration tests, OpenAPI drift, application/portal/mobile builds, both image builds, and both Trivy image scans.

A clean tracked snapshot was also produced from `git archive`, installed with `pnpm install --frozen-lockfile`, and replayed independently of the main working tree's generated files. That replay exposed and corrected an overly broad `storage` ignore rule which had omitted `packages/mock-services/src/storage/KeyValueStore.ts`; the corrected snapshot then passed the complete application command set.

The initialized `main` branch was pushed to `https://github.com/minhalawais/kapas-ki-pukar`. GitHub Actions run [#2](https://github.com/minhalawais/kapas-ki-pukar/actions/runs/39032805131) verified commit `909da24fa82b384d23ad8a4dd4947a678b5ce650` successfully in 4m 55s. The hosted run passed secret scanning, frozen dependency installation, Prisma generation, formatting, migration application and replay, typecheck, lint, unit and integration tests, OpenAPI drift detection, all application builds, both non-root container builds, and both fixed CRITICAL/HIGH image vulnerability scans.

## Accepted and unrelated observations

- `pnpm audit` reports `node-forge` GHSA-86w9-cpqp-85rv and `braces` GHSA-vfj7-8cjw-p6xm as high-severity transitive build-tool findings with no patched version. They remain visible and are governed by `SECURITY_RISK_ACCEPTANCE.md`.
- Four moderate dependency findings remain visible for ongoing dependency maintenance.
- The six stale voice prompts remain a fail-closed mobile release gate from Phase 01 and are not bypassed by Phase 02.
- The existing Next.js ESLint-plugin warning and React Native Metro peer-version warning are pre-existing dependency-maintenance items; builds and checks pass.
- Repository-wide historical files are not uniformly Prettier-formatted. The formatting gate is intentionally scoped to Phase 02-owned files.

## Exit criteria

- [x] A new developer can start PostgreSQL/Redis and both processes from documented commands.
- [x] Health checks accurately represent process and dependency state.
- [x] Empty-database migration and idempotent replay are demonstrated.
- [x] PostgreSQL/Redis integrations and healthy readiness are demonstrated.
- [x] Both production images build, run non-root, pass fixed CRITICAL/HIGH scans, and stop gracefully.
- [x] Volume-preserving rollback/recovery is demonstrated.
- [x] No sensitive runtime configuration is logged or included in the images.
- [x] The two no-patch high advisories have a scoped, expiring security-owner decision.
- [x] Local Git metadata is initialized and the workflow command set passes locally.
- [x] GitHub-hosted execution passed on the published `main` branch.

All Phase 02 implementation and verification gates are green, so Phase 03 may begin. Production deployment remains subject to the named-owner, policy, and voice-asset release gates documented elsewhere.
