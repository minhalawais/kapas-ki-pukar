# Host Kapas ki Pukaar on Hostinger VPS (production)

**All servers and shared maintenance:** [`docs/HOSTING-AND-MAINTENANCE.md`](../../docs/HOSTING-AND-MAINTENANCE.md).

This guide wires **portal + API + worker + PostgreSQL + Redis + MinIO + tusd + ClamAV** on one VPS with **HTTPS** and **GitHub Actions CI/CD**.

Domain example (adjust if yours differs):

| Host | Service |
|------|---------|
| `kapaskipukar.com` | PUWF portal (Next.js) |
| `api.kapaskipukar.com` | API + `/files/` evidence uploads |

Both DNS **A records** must point at the VPS public IP.

---

## Security first

- **Never** commit VPS passwords, database passwords, or root credentials to Git.
- **Never** paste production passwords into chat, tickets, or screenshots.
- If credentials were exposed, **rotate them immediately** (VPS root, Postgres, Redis, MinIO, app secrets).
- Use **SSH keys** for deploy (`DEPLOY_SSH_KEY`), not root password login.
- Keep `/etc/kapas/production.env` mode `600`, owned by root or a dedicated deploy user.

---

## 1. One-time VPS bootstrap

SSH into the server (after rotating credentials and setting up keys):

```bash
export REPO_URL='git@github.com:YOUR_ORG/kapas-ki-pukaar.git'
bash -c "$(curl -fsSL https://raw.githubusercontent.com/YOUR_ORG/kapas-ki-pukaar/main/deploy/production/scripts/bootstrap-server.sh)"
```

Or clone the repo and run `deploy/production/scripts/bootstrap-server.sh` from a local copy.

Create production secrets:

```bash
cp /opt/kapas/deploy/production/kapaskipukar.env.example /etc/kapas/production.env
nano /etc/kapas/production.env   # replace every "generate-..." value
chmod 600 /etc/kapas/production.env
```

Ensure `MIGRATION_DATABASE_URL` uses the **migrator** user and `DATABASE_URL` uses **kapas_app** (see example file).

Log in to GitHub Container Registry on the VPS (required to pull private images):

```bash
echo 'YOUR_GHCR_READ_TOKEN' | docker login ghcr.io -u YOUR_GITHUB_USERNAME --password-stdin
```

Use a fine-scoped PAT with `read:packages`.

---

## 2. GitHub repository configuration

### Secrets (Settings → Secrets and variables → Actions)

| Secret | Purpose |
|--------|---------|
| `DEPLOY_HOST` | VPS public IP or hostname |
| `DEPLOY_USER` | SSH user (`deploy` recommended, not root) |
| `DEPLOY_SSH_KEY` | Private key for deploy user |
| `GHCR_PULL_TOKEN` | (Recommended) PAT with `read:packages` so the VPS can `docker pull` private GHCR images |

### Variables (same page → Variables)

| Variable | Example |
|----------|---------|
| `PRODUCTION_API_URL` | `https://api.kapaskipukar.com` (portal **build-time** API URL) |
| `PRODUCTION_API_HOST` | `api.kapaskipukar.com` (post-deploy smoke checks) |
| `PRODUCTION_PORTAL_HOST` | `kapaskipukar.com` (optional; public `/privacy` and `/support` smoke checks) |
| `DEPLOY_APP_ROOT` | `/opt/kapas` (optional) |

### Environment

Create a GitHub **environment** named `production` and optionally require manual approval before deploy jobs run.

---

## 3. What CI/CD does

See [`.github/CICD.md`](../../.github/CICD.md) for the full picture.

| Workflow | Role |
|----------|------|
| **`ci.yml`** | Test, lint, build images in CI, scan — **no deploy** |
| **`deploy-production.yml`** | After **green CI on `main`**, build/push GHCR → SSH → **migrate** → restart stack |

Manual **Run workflow** on deploy is for hotfixes without waiting for another CI cycle.

Set `EDGE_TLS=nginx` in `/etc/kapas/production.env` when host **nginx** keeps ports 80/443 (Hostinger default). Use `EDGE_TLS=caddy` only if Caddy in Docker owns 80/443.

Production VPS for **kapaskipukar.com** is **187.53.136.207** (DNS A record). GitHub secret `DEPLOY_HOST` must match that IP. If Kapas was installed on another VPS by mistake, run `deploy/production/scripts/teardown-kapas.sh` there before redeploying.

Migrations run **before** API/worker start on every deploy.

---

## 4. First production deploy (manual check)

Before enabling CI, you can dry-run on the VPS:

```bash
export COMPOSE_FILE=/opt/kapas/deploy/production/compose.yml
export ENV_FILE=/etc/kapas/production.env
export IMAGE_ENV_FILE=/etc/kapas/image.env
export RELEASE_VERSION=manual-1
# populate image.env with local or GHCR tags
bash /opt/kapas/deploy/production/scripts/release.sh
```

Smoke tests:

```bash
curl -fsS https://api.kapaskipukar.com/api/v1/health/live
curl -fsS https://api.kapaskipukar.com/api/v1/health/ready
curl -I https://kapaskipukar.com/login
```

Bootstrap first staff user (once DB is up):

```bash
docker compose --env-file /etc/kapas/production.env -f /opt/kapas/deploy/production/compose.yml \
  exec api node -e "console.log('use pnpm db:bootstrap-admin from a ops machine with DATABASE_URL')"
```

Run `pnpm --filter @kapas/database db:bootstrap-admin` from an operator workstation with a tunnel to Postgres, or add a documented one-off ops command your team approves.

---

## 5. Replacing “frontend-only on VPS”

If the VPS currently serves only static/frontend:

1. Stop the old web server from binding **80/443** (nginx/apache on host must not conflict with Caddy in Docker).
2. Deploy this stack; Caddy terminates TLS and routes by hostname.
3. Set portal env `NEXT_PUBLIC_BACKEND_ENABLED=true` (already in compose).

---

## 6. Mobile app after backend is live

Set EAS production env:

```env
EXPO_PUBLIC_API_URL=https://api.kapaskipukar.com
EXPO_PUBLIC_COMPLAINT_PIPELINE_V3_ENABLED=true
```

Enable push on the worker: `EXPO_PUSH_ENABLED=true` in `/etc/kapas/production.env`.

---

## 7. Operations

See `OPERATIONS.md` for backups, rollback, and incidents. **Never** `docker compose down -v` in production.

Recommended: daily Postgres backup (`scripts/backup-postgres.sh`), monitor disk (evidence + ClamAV + MinIO).

---

## 8. Checklist before go-live

- [ ] DNS for portal + API → VPS
- [ ] `/etc/kapas/production.env` filled with unique secrets
- [ ] GHCR login on VPS
- [ ] GitHub Actions secrets/variables set
- [ ] `production` environment approval configured
- [ ] Migrations applied; staff bootstrap completed
- [ ] Portal login + case workflow tested against live API
- [ ] Privacy policy URL ready for Play Store (separate from this doc)
