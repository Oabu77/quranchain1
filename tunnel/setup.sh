#!/usr/bin/env bash
# QuranChain Tunnel Setup Script
# Connects DarCloud domains to this worker via Cloudflare Argo Tunnel
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
TUNNEL_NAME="quranchain-tunnel"
CONFIG_FILE="$SCRIPT_DIR/config.yml"

echo "╔══════════════════════════════════════════════════════════╗"
echo "║  QuranChain™ — Argo Tunnel Setup                        ║"
echo "║  Connecting DarCloud services to Cloudflare edge         ║"
echo "╚══════════════════════════════════════════════════════════╝"

# Step 1: Check cloudflared
if ! command -v cloudflared &>/dev/null; then
  echo "⏳ Installing cloudflared..."
  curl -sL -o /tmp/cloudflared \
    https://github.com/cloudflare/cloudflared/releases/latest/download/cloudflared-linux-amd64
  chmod +x /tmp/cloudflared
  sudo mv /tmp/cloudflared /usr/local/bin/cloudflared
fi
echo "✅ cloudflared $(cloudflared --version 2>&1 | head -1)"

# Step 2: Authenticate (if not already)
if ! cloudflared tunnel list 2>/dev/null | grep -q "$TUNNEL_NAME"; then
  echo ""
  echo "🔐 Authenticating with Cloudflare..."
  echo "   A browser window will open. Log in and authorize the tunnel."
  cloudflared tunnel login

  echo ""
  echo "🚇 Creating tunnel: $TUNNEL_NAME"
  cloudflared tunnel create "$TUNNEL_NAME"

  # Save credentials path
  CRED_FILE=$(cloudflared tunnel info "$TUNNEL_NAME" 2>&1 | grep -oP 'Credentials file: \K.*')
  if [ -n "$CRED_FILE" ]; then
    cp "$CRED_FILE" "$SCRIPT_DIR/credentials.json"
    echo "✅ Credentials saved to $SCRIPT_DIR/credentials.json"
  fi
else
  echo "✅ Tunnel '$TUNNEL_NAME' already exists"
fi

# Step 3: Configure DNS routes
echo ""
echo "🌐 Setting up DNS routes..."
TUNNEL_ID=$(cloudflared tunnel list 2>/dev/null | grep "$TUNNEL_NAME" | awk '{print $1}')

if [ -n "$TUNNEL_ID" ]; then
  for domain in darcloud.host "*.darcloud.host" darcloud.net "*.darcloud.net"; do
    echo "   → $domain"
    cloudflared tunnel route dns "$TUNNEL_NAME" "$domain" 2>/dev/null || true
  done
  echo "✅ DNS routes configured"
else
  echo "⚠️  Could not find tunnel ID. Configure DNS manually:"
  echo "   cloudflared tunnel route dns $TUNNEL_NAME darcloud.host"
fi

# Step 4: Start the tunnel
echo ""
echo "🚀 Starting tunnel..."
echo "   Config: $CONFIG_FILE"
echo ""
exec cloudflared tunnel --config "$CONFIG_FILE" run "$TUNNEL_NAME"
