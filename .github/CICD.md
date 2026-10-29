# CI/CD overview

Two workflows — **verify** then **deploy**.

## CI (`ci.yml`)

Runs on every push/PR to `main` / `master`:

- Format, typecheck, lint, unit + integration tests
- OpenAPI drift check
- Build API, worker, portal, MinIO **images locally** (sanity check)
- Trivy scan on API/worker/MinIO images
- Validate production Compose file

**CI does not deploy** and does not need VPS secrets.

## CD (`deploy-production.yml`)

Runs when:

1. **CI completes successfully** on `main` (`workflow_run`), or
2. You click **Actions → Deploy production (VPS) → Run workflow** (manual hotfix)

Steps:

1. **Build & push** immutable images to GitHub Container Registry (`ghcr.io`):
   - `kapas-api`, `kapas-worker`, `kapas-portal`, `kapas-migrate`, `kapas-minio`
   - Tags: `<12-char-sha>` and `latest`
2. **SSH deploy** to VPS:
   - Write `/etc/kapas/image.env` with image digests/tags
   - `git fetch` deploy scripts at the same SHA
   - `release.sh`: Postgres/Redis up → **migrations** → API/worker/portal/tusd up
3. **Smoke test** HTTPS API live + ready

Production secrets stay on the server in `/etc/kapas/production.env` (never in GitHub except SSH key).

## Required GitHub configuration

See [deploy/production/HOSTING.md](../deploy/production/HOSTING.md).

| Kind | Name |
|------|------|
| Secret | `DEPLOY_HOST`, `DEPLOY_USER`, `DEPLOY_SSH_KEY` |
| Secret (recommended) | `GHCR_PULL_TOKEN` — PAT with `read:packages` for VPS `docker pull` |
| Variable | `PRODUCTION_API_URL`, `PRODUCTION_API_HOST` |
| Environment | `production` (optional approval gate) |

## What is *not* CI/CD

- Uploading a tarball over SSH and building Docker on the VPS (bootstrap only; slow, not repeatable).
- Committing `.env` or passwords to the repo.

After first VPS bootstrap, **every release should go through GitHub Actions**.
