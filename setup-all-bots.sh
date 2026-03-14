#!/bin/bash
# ══════════════════════════════════════════════════════════════
# DarCloud Service Bots — Master Setup Script
# Sets up all 6 service bots: configure tokens, register
# slash commands, and launch via pm2
# ══════════════════════════════════════════════════════════════

set -e

WORKSPACE="/workspaces/quranchain1"
GUILD_ID="1481826708721242165"
API_BASE="http://localhost:8787"

BOTS=(
  "fungimesh-bot"
  "meshtalk-bot"
  "aifleet-bot"
  "hwc-bot"
  "darlaw-bot"
  "darpay-bot"
)

BOT_NAMES=(
  "FungiMesh"
  "MeshTalk OS"
  "AI Fleet"
  "Halal Wealth Club"
  "DarLaw Legal AI"
  "DarPay Revenue"
)

echo "══════════════════════════════════════════════════════════"
echo "  DarCloud Service Bots — Setup"
echo "  6 bots to configure and launch"
echo "══════════════════════════════════════════════════════════"
echo ""

# ── Step 1: Check dependencies ────────────────────────────────
echo "▸ Checking dependencies..."
for bot in "${BOTS[@]}"; do
  if [ ! -d "$WORKSPACE/$bot/node_modules" ]; then
    echo "  Installing deps for $bot..."
    (cd "$WORKSPACE/$bot" && npm install --quiet)
  else
    echo "  ✓ $bot — deps installed"
  fi
done
echo ""

# ── Step 2: Configure tokens ─────────────────────────────────
echo "▸ Configuring bot tokens..."
echo "  Each bot needs a Discord Application token and client ID."
echo "  Create them at: https://discord.com/developers/applications"
echo ""

for i in "${!BOTS[@]}"; do
  bot="${BOTS[$i]}"
  name="${BOT_NAMES[$i]}"
  env_file="$WORKSPACE/$bot/.env"

  if [ -f "$env_file" ] && grep -q "PASTE_" "$env_file" 2>/dev/null; then
    echo "  ⚠ $name bot needs token configuration"
    read -p "    Enter DISCORD_TOKEN for $name (or 'skip'): " token
    if [ "$token" != "skip" ] && [ -n "$token" ]; then
      read -p "    Enter DISCORD_CLIENT_ID for $name: " client_id
      cat > "$env_file" << EOF
DISCORD_TOKEN=$token
DISCORD_CLIENT_ID=$client_id
GUILD_ID=$GUILD_ID
API_BASE=$API_BASE
EOF
      echo "    ✓ $name .env configured"
    else
      echo "    → Skipped $name"
    fi
  elif [ -f "$env_file" ]; then
    echo "  ✓ $name — already configured"
  else
    echo "  ⚠ $name — no .env file, creating placeholder..."
    cat > "$env_file" << EOF
DISCORD_TOKEN=PASTE_TOKEN_HERE
DISCORD_CLIENT_ID=PASTE_CLIENT_ID_HERE
GUILD_ID=$GUILD_ID
API_BASE=$API_BASE
EOF
  fi
done
echo ""

# ── Step 3: Invite bots to guild ─────────────────────────────
echo "▸ Bot invite URLs (open each in browser to add to server):"
for i in "${!BOTS[@]}"; do
  bot="${BOTS[$i]}"
  name="${BOT_NAMES[$i]}"
  env_file="$WORKSPACE/$bot/.env"

  if [ -f "$env_file" ]; then
    client_id=$(grep DISCORD_CLIENT_ID "$env_file" | cut -d= -f2)
    if [ "$client_id" != "PASTE_CLIENT_ID_HERE" ] && [ -n "$client_id" ]; then
      echo "  $name: https://discord.com/oauth2/authorize?client_id=$client_id&scope=bot+applications.commands&permissions=277025770560"
    fi
  fi
done
echo ""

# ── Step 4: Register slash commands ──────────────────────────
echo "▸ Registering slash commands..."
for i in "${!BOTS[@]}"; do
  bot="${BOTS[$i]}"
  name="${BOT_NAMES[$i]}"
  env_file="$WORKSPACE/$bot/.env"

  if [ -f "$env_file" ] && ! grep -q "PASTE_" "$env_file" 2>/dev/null; then
    echo "  Registering $name commands..."
    (cd "$WORKSPACE/$bot" && node register-commands.js 2>&1) || echo "  ⚠ Failed to register $name commands"
  else
    echo "  → Skipping $name (no token configured)"
  fi
done
echo ""

# ── Step 5: Launch via pm2 ───────────────────────────────────
echo "▸ Launching bots via pm2..."
for i in "${!BOTS[@]}"; do
  bot="${BOTS[$i]}"
  name="${BOT_NAMES[$i]}"
  env_file="$WORKSPACE/$bot/.env"

  if [ -f "$env_file" ] && ! grep -q "PASTE_" "$env_file" 2>/dev/null; then
    # Check if already running
    if pm2 describe "$bot" > /dev/null 2>&1; then
      echo "  Restarting $name..."
      pm2 restart "$bot"
    else
      echo "  Starting $name..."
      pm2 start "$WORKSPACE/ecosystem.config.js" --only "$bot"
    fi
  else
    echo "  → Skipping $name (no token configured)"
  fi
done
echo ""

# ── Summary ──────────────────────────────────────────────────
echo "══════════════════════════════════════════════════════════"
echo "  Setup Complete!"
echo "══════════════════════════════════════════════════════════"
pm2 status
echo ""
echo "  Commands:"
echo "    pm2 logs           — view all bot logs"
echo "    pm2 status         — service status"
echo "    pm2 restart all    — restart everything"
echo "    pm2 save           — persist process list"
echo ""
