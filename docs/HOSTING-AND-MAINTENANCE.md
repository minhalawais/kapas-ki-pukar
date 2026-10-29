# Hosting inventory and maintenance

Single reference for **where apps run**, **how they are deployed**, and **routine maintenance**. Kapas-specific detail also lives in [`deploy/production/HOSTING.md`](../deploy/production/HOSTING.md) and [`deploy/production/OPERATIONS.md`](../deploy/production/OPERATIONS.md).

---

## 1. Server inventory

| Server | Hostname (typical) | Public IP | Role |
|--------|-------------------|-----------|------|
| **Primary Hostinger VPS** | `srv1965684` | **187.53.136.207** | Kapas production, Cotton Workers Voice, MoIP-GP API, shared nginx + Docker |
| **Other Hostinger VPS** | (varies) | **187.53.139.52** | **Not** Kapas. Other FOS apps (e.g. inventory portal) if still deployed there |

Always confirm IP in Hostinger panel before changing DNS or GitHub deploy secrets.

---

## 2. Applications on 187.53.136.207

| Product | Public URL | Process / stack | App root on server | Deploy path |
|---------|------------|-----------------|-------------------|-------------|
| **Kapas ki Pukaar** (portal + API + worker) | `https://kapaskipukar.com`, `https://api.kapaskipukar.com` | Docker Compose project `kapas-production` | `/opt/kapas` | GitHub Actions → [`deploy-production.yml`](../.github/workflows/deploy-production.yml) |
| **Cotton Workers Voice** (legacy Next) | `https://cottonworkersvoice.com` | Node `next-server` on **3050** | (PM2/systemd under `/var/www` — confirm on server) | Separate from Kapas repo |
| **MoIP-GP** (SOE backend API) | `https://moip-gp.fruitofsustainability.com` | Node on **3001**; Postgres container `moip-gp-postgres` | `/var/www/moip-gp`, `/opt/soe-gp-backend` | Repos `soe-gp-backend` + frontend; see [`DEPLOYMENT-MASTER-CHECKLIST-SOE-APP.md`](../DEPLOYMENT-MASTER-CHECKLIST-SOE-APP.md) |

### Kapas internal ports (localhost only)

Host **nginx** terminates TLS and proxies:

| Port | Service |
|------|---------|
| `127.0.0.1:3002` | Kapas portal (Next.js container) |
| `127.0.0.1:4002` | Kapas API |
| `127.0.0.1:8082` | tusd (evidence uploads under `/files/` on API host) |

Nginx configs (Kapas): `deploy/production/nginx/kapaskipukar-production.conf`, `cottonworkersvoice-legacy.conf` → symlinked under `/etc/nginx/sites-enabled/`.

### Kapas secrets and env (never in Git)

| Path | Purpose |
|------|---------|
| `/etc/kapas/production.env` | DB, Redis, MinIO, session, app secrets (`chmod 640`, group `deploy`) |
| `/etc/kapas/image.env` | Image tags/digests; written by CI on each deploy |

---

## 3. DNS (GoDaddy — kapaskipukar.com)

Nameservers: GoDaddy (`ns19/ns20.domaincontrol.com`).

| Type | Name | Value | Purpose |
|------|------|-------|---------|
| **A** | `@` | `187.53.136.207` | `kapaskipukar.com` |
| **A** or **CNAME** | `www` | `@` or `187.53.136.207` | `www.kapaskipukar.com` |
| **A** | `api` | `187.53.136.207` | `api.kapaskipukar.com` |

Use **DNS records**, not domain forwarding, for the API host.

Other domains (`cottonworkersvoice.com`, `*.fruitofsustainability.com`) are managed in their respective DNS panels; certificates on the VPS are under `/etc/letsencrypt/live/`.

---

## 4. SSH and deploy users

| User | Use |
|------|-----|
| **`deploy`** | Kapas GitHub Actions SSH, Docker, `/opt/kapas` deploys |
| **`root`** | Bootstrap, nginx/certbot, volume permissions, break-glass |

Kapas GitHub secrets: `DEPLOY_HOST=187.53.136.207`, `DEPLOY_USER=deploy`, `DEPLOY_SSH_KEY` (private key). Optional: `GHCR_PULL_TOKEN` for `docker pull` on the VPS.

MoIP-GP uses the same host/user pattern with repo secret name `VPS_SSH_PRIVATE_KEY` (see SOE checklist).

**Do not** commit passwords or private keys to this repository.

---

## 5. Kapas — deploy and release

### Normal release (preferred)

1. Merge to **`main`** → **CI** passes → **Deploy production (VPS)** runs (or manual workflow dispatch).
2. CI pushes images to **GHCR** and SSH runs `deploy/production/scripts/remote-deploy.sh` → `release.sh`.
3. Order: Postgres/Redis/MinIO → **migrations** → API, worker, portal, tusd.

See [`.github/CICD.md`](../.github/CICD.md).

### Manual release on VPS (break-glass)

```bash
sudo -u deploy bash -lc '
  export ENV_FILE=/etc/kapas/production.env
  export IMAGE_ENV_FILE=/etc/kapas/image.env
  export RELEASE_VERSION=<tag>
  export SKIP_COMPOSE_PULL=true
  bash /opt/kapas/deploy/production/scripts/release.sh
'
```

Use `SKIP_COMPOSE_PULL=true` when images were built locally on the server.

### Smoke tests

```bash
curl -fsS https://api.kapaskipukar.com/api/v1/health/live
curl -fsS https://api.kapaskipukar.com/api/v1/health/ready
curl -I https://kapaskipukar.com/login
```

### First staff user (once per environment)

Run your approved bootstrap command against production Postgres (see `HOSTING.md`). Requires migrator or admin DB access.

### Remove Kapas from a wrong server only

```bash
bash /opt/kapas/deploy/production/scripts/teardown-kapas.sh
```

Does not remove other nginx sites or non-Kapas apps.

---

## 6. Kapas — maintenance schedule

| Frequency | Task | How |
|-----------|------|-----|
| **Each deploy** | Migrations, stack health | CI + `release.sh`; check Actions logs |
| **Daily** | Postgres backup | `deploy/production/scripts/backup-postgres.sh` with env: `BACKUP_DIR`, `POSTGRES_CONTAINER=kapas-production-postgres-1`, `POSTGRES_DB`, `POSTGRES_USER` (migrator) |
| **Weekly** | Backup verify | `verify-backup.sh`; `docker compose ps`; disk `df -h` |
| **Monthly** | OS updates, cert expiry | `certbot certificates`; Hostinger panel; review ClamAV/MinIO volume size |
| **On incident** | See runbooks | [`OPERATIONS.md`](../deploy/production/OPERATIONS.md) |

### Common Kapas operations

```bash
# Stack status (on VPS, as deploy)
cd /opt/kapas/deploy/production
docker compose --env-file /etc/kapas/production.env --env-file /etc/kapas/image.env \
  -f compose.yml -f compose.nginx-edge.yml ps

# Logs
docker logs kapas-production-api-1 --tail 100
docker logs kapas-production-worker-1 --tail 100

# Migrations only
docker compose ... --profile migrate run --rm --user root migrate

# Nginx reload after config change
nginx -t && systemctl reload nginx
```

**Never** run `docker compose down -v` in production (destroys Postgres/Redis/evidence volumes).

### Known operational notes

- **MinIO** data volume must be owned by UID **10001** if the container is unhealthy after first create:  
  `chown -R 10001:10001 /var/lib/docker/volumes/kapas-production_minio-data/_data`
- **Portal/worker** may show Docker “unhealthy” while HTTPS health endpoints still return 200 (in-container probe vs nginx).
- **Shared nginx**: editing Kapas configs must not remove `cottonworkersvoice-legacy.conf` or MoIP site files.

---

## 7. Cotton Workers Voice — maintenance

| Item | Detail |
|------|--------|
| URL | `https://cottonworkersvoice.com` |
| Upstream | `http://127.0.0.1:3050` |
| TLS | Same cert lineage as Kapas apex (Let’s Encrypt `cottonworkersvoice.com` cert) |

**Deploy:** independent of Kapas repo. On the VPS, identify the process manager for port **3050** (`ss -tlnp | grep 3050`) before restarting.

**After nginx changes:** keep `cottonworkersvoice-legacy.conf` enabled so Kapas and CWV hostnames stay split.

---

## 8. MoIP-GP — maintenance

| Item | Detail |
|------|--------|
| URL | `https://moip-gp.fruitofsustainability.com` |
| API upstream | `http://127.0.0.1:3001/api/v1/` |
| Secrets | `/var/www/moip-gp/shared/postgres.env`, `backend.env` |
| Postgres | Docker `moip-gp-postgres` |

**Deploy:** push **`main`** on backend and frontend repos; workflows use `VPS_HOST=187.53.136.207`, `VPS_USER=deploy`.

**Checklist:** [`DEPLOYMENT-MASTER-CHECKLIST-SOE-APP.md`](../DEPLOYMENT-MASTER-CHECKLIST-SOE-APP.md).

**Health:**

```bash
curl -fsS https://moip-gp.fruitofsustainability.com/api/v1/health/live
```

**Backups:** follow SOE infra scripts under `/opt/soe-gp-backend/infra/`; keep cron on VPS for Postgres dumps.

---

## 9. TLS (Let’s Encrypt)

Certificates are managed with **certbot** on the VPS. Kapas/API apex uses the expanded cert that includes `api.kapaskipukar.com`.

Renewal is automatic via certbot timer. Check:

```bash
certbot certificates
```

After adding a new hostname to DNS, expand or re-issue:

```bash
certbot certonly --nginx --expand \
  -d kapaskipukar.com -d www.kapaskipukar.com -d api.kapaskipukar.com \
  -d cottonworkersvoice.com -d www.cottonworkersvoice.com \
  --non-interactive --agree-tos -m ops@kapaskipukar.com
nginx -t && systemctl reload nginx
```

Adjust `-d` list to match live nginx `server_name` entries.

---

## 10. Mobile app (Kapas) vs production API

EAS / production builds should use:

```env
EXPO_PUBLIC_API_URL=https://api.kapaskipukar.com
```

Worker push (optional): set `EXPO_PUSH_ENABLED=true` in `/etc/kapas/production.env` and restart worker.

---

## 11. Repository map (Kapas hosting files)

| File | Purpose |
|------|---------|
| `deploy/production/compose.yml` | Production stack |
| `deploy/production/compose.nginx-edge.yml` | Localhost port bindings for host nginx |
| `deploy/production/scripts/release.sh` | Migrate + up services |
| `deploy/production/scripts/remote-deploy.sh` | CI entry on VPS |
| `deploy/production/scripts/teardown-kapas.sh` | Remove Kapas from a VPS |
| `deploy/production/kapaskipukar.env.example` | Template for `production.env` |
| `.github/workflows/ci.yml` | Verify |
| `.github/workflows/deploy-production.yml` | CD |

---

## 12. Change log (hosting)

| Date | Change |
|------|--------|
| 2026-10-29 | Kapas production moved to **187.53.136.207**; DNS `api.kapaskipukar.com` added; nginx split Kapas vs Cotton Workers Voice |

Update this table when IPs, domains, or deploy paths change.
