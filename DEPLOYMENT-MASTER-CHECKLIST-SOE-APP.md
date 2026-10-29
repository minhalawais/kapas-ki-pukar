# MoIP-GP — First Production Go-Live Checklist

Shared VPS inventory and Kapas maintenance: [`docs/HOSTING-AND-MAINTENANCE.md`](docs/HOSTING-AND-MAINTENANCE.md).

Complete these steps once, in order.

## 1. VPS bootstrap (backend repo files)

```bash
ssh root@187.53.136.207
git clone https://github.com/minhalawais/soe-gp-backend.git /opt/soe-gp-backend
cd /opt/soe-gp-backend
bash infra/bootstrap-vps.sh
```

## 2. Configure server secrets

```bash
nano /var/www/moip-gp/shared/postgres.env
nano /var/www/moip-gp/shared/backend.env
```

Generate strong values:

```bash
openssl rand -base64 32   # JWT secrets
openssl rand -base64 32   # MFA key
openssl rand -base64 24   # Postgres password
```

## 3. Deploy SSH key for GitHub Actions

```bash
cat /root/deploy_key.pub >> /home/deploy/.ssh/authorized_keys
chown deploy:deploy /home/deploy/.ssh/authorized_keys
chmod 600 /home/deploy/.ssh/authorized_keys
```

Add **private** key to both GitHub repos as `VPS_SSH_PRIVATE_KEY`.

## 4. Import local database

From your **Windows dev machine** (already exported once):

```powershell
cd backend
powershell -ExecutionPolicy Bypass -File infra/export-local-database.ps1
```

Dump file: `backend/moip-gp-local.dump` (~118 KB)

Upload to VPS (use Hostinger file manager, or SCP after copying `/root/deploy_key` to your PC):

```powershell
scp backend/moip-gp-local.dump deploy@187.53.136.207:/var/www/moip-gp/backups/
```

On VPS:

```bash
bash /opt/soe-gp-backend/infra/import-database.sh /var/www/moip-gp/backups/moip-gp-local.dump
```

## 5. Nginx sudo for frontend deploy

```bash
echo 'deploy ALL=(ALL) NOPASSWD: /usr/sbin/nginx, /bin/systemctl reload nginx' > /etc/sudoers.d/deploy-nginx
chmod 440 /etc/sudoers.d/deploy-nginx
```

## 6. GitHub repo setup (both repos)

Secrets:

- `VPS_HOST` = `187.53.136.207`
- `VPS_USER` = `deploy`
- `VPS_SSH_PRIVATE_KEY` = (private key)

Environment: `production` (no manual approval).

## 7. First deploy

1. Push backend to `main` → wait for green deploy workflow
2. Verify: `curl https://moip-gp.fruitofsustainability.com/api/v1/health/live`
3. Push frontend to `main` → wait for green deploy workflow
4. Open https://moip-gp.fruitofsustainability.com and sign in

## 8. Post go-live

- Add Resend SMTP to `backend.env` when ready
- Set up daily backup cron for Postgres
- Enable UptimeRobot on `/api/v1/health/live`
