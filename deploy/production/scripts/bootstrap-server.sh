#!/usr/bin/env bash
# One-time VPS bootstrap (Ubuntu/Debian). Run as root.
set -Eeuo pipefail

APP_ROOT="${APP_ROOT:-/opt/kapas}"
DEPLOY_USER="${DEPLOY_USER:-deploy}"
REPO_URL="${REPO_URL:?Set REPO_URL to your Git remote (HTTPS or SSH)}"

apt-get update
apt-get install -y ca-certificates curl git ufw

if ! command -v docker >/dev/null 2>&1; then
  curl -fsSL https://get.docker.com | sh
fi

if ! docker compose version >/dev/null 2>&1; then
  apt-get install -y docker-compose-plugin
fi

if ! id "$DEPLOY_USER" >/dev/null 2>&1; then
  useradd -m -s /bin/bash "$DEPLOY_USER"
  usermod -aG docker "$DEPLOY_USER"
fi

ufw allow OpenSSH
ufw allow 80/tcp
ufw allow 443/tcp
ufw --force enable

install -d -m 700 /etc/kapas
if [[ ! -f /etc/kapas/production.env ]]; then
  echo "Copy deploy/production/kapaskipukar.env.example to /etc/kapas/production.env and edit secrets." >&2
fi

if [[ ! -d "$APP_ROOT/.git" ]]; then
  git clone "$REPO_URL" "$APP_ROOT"
fi

chown -R "$DEPLOY_USER:$DEPLOY_USER" "$APP_ROOT"
chmod +x "$APP_ROOT"/deploy/production/scripts/*.sh

echo "Next steps:"
echo "  1) Add deploy user SSH public key (no password SSH)."
echo "  2) docker login ghcr.io (read:packages PAT) as ${DEPLOY_USER}."
echo "  3) Fill /etc/kapas/production.env"
echo "  4) Point DNS: kapaskipukar.com and api.kapaskipukar.com -> this server."
echo "  5) Configure GitHub Actions secrets (see deploy/production/HOSTING.md)."
