#!/usr/bin/env bash
set -euo pipefail

# ==========================================
# Auto Proxy Setup Script (Ubuntu/Debian)
# Installs and configures Tinyproxy
# ==========================================

# -------- Configurable values --------
PROXY_PORT="${PROXY_PORT:-8888}"
ALLOWED_IP="${ALLOWED_IP:-127.0.0.1}"
LISTEN_IP="${LISTEN_IP:-0.0.0.0}"
LOG_LEVEL="${LOG_LEVEL:-Info}"
CONFIG_FILE="/etc/tinyproxy/tinyproxy.conf"
BACKUP_FILE="/etc/tinyproxy/tinyproxy.conf.bak.$(date +%s)"

# -------- Root check --------
if [[ "${EUID}" -ne 0 ]]; then
  echo "Please run as root:"
  echo "  sudo bash $0"
  exit 1
fi

echo "[1/6] Updating packages..."
apt-get update -y

echo "[2/6] Installing tinyproxy..."
DEBIAN_FRONTEND=noninteractive apt-get install -y tinyproxy ufw

echo "[3/6] Backing up current config..."
if [[ -f "$CONFIG_FILE" ]]; then
  cp "$CONFIG_FILE" "$BACKUP_FILE"
  echo "Backup saved to: $BACKUP_FILE"
fi

echo "[4/6] Writing Tinyproxy config..."
cat > "$CONFIG_FILE" <<EOF
User tinyproxy
Group tinyproxy
Port ${PROXY_PORT}
Listen ${LISTEN_IP}
Timeout 600
DefaultErrorFile "/usr/share/tinyproxy/default.html"
StatFile "/usr/share/tinyproxy/stats.html"
LogLevel ${LOG_LEVEL}
PidFile "/run/tinyproxy/tinyproxy.pid"
MaxClients 100
StartServers 10
MinSpareServers 5
MaxSpareServers 20
MaxRequestsPerChild 0
ViaProxyName "AutoProxy"
DisableViaHeader Yes

# Allow only your IP or subnet below
Allow ${ALLOWED_IP}

# Optional upstream example:
# Upstream http 1.2.3.4:8080

# Basic anonymous headers
Anonymous "Host"
Anonymous "Authorization"
Anonymous "Cookie"
Anonymous "Set-Cookie"

# CONNECT support for HTTPS
ConnectPort 443
ConnectPort 563
EOF

echo "[5/6] Enabling and restarting tinyproxy..."
systemctl daemon-reload
systemctl enable tinyproxy
systemctl restart tinyproxy

echo "[6/6] Opening firewall port..."
ufw allow "${PROXY_PORT}/tcp" >/dev/null 2>&1 || true

echo
echo "=========================================="
echo "Proxy setup complete."
echo "Port:        ${PROXY_PORT}"
echo "Listen IP:   ${LISTEN_IP}"
echo "Allowed IP:  ${ALLOWED_IP}"
echo "=========================================="
echo
echo "Test from your client with:"
echo "  curl -x http://SERVER_IP:${PROXY_PORT} http://example.com"
echo
echo "To view status:"
echo "  systemctl status tinyproxy"
echo
echo "To view logs:"
echo "  journalctl -u tinyproxy -f"
