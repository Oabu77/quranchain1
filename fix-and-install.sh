#!/bin/bash
# ══════════════════════════════════════════════════════════════
# DarCloud Empire — Fix & Install All Dependencies
# Installs better-sqlite3, dotenv, discord.js in every bot
# ══════════════════════════════════════════════════════════════
set -e
cd /workspaces/quranchain1

echo "╔═══════════════════════════════════════════════════════╗"
echo "║   DarCloud Empire — Fix & Install All Dependencies    ║"
echo "╚═══════════════════════════════════════════════════════╝"
echo ""

# Step 1: Root install
echo "━━━ Step 1: Root Dependencies ━━━"
npm install 2>&1 | tail -3
echo "✓ Root deps installed"
echo ""

# Step 2: Install in each bot directory
echo "━━━ Step 2: Bot Dependencies (all 22 bots) ━━━"
BOT_DIRS=(
  discord-bot quranchain-bot darpay-bot fungimesh-bot meshtalk-bot
  darnas-bot hwc-bot darhealth-bot darmedia-bot darrealty-bot
  darcommerce-bot dartrade-bot daredu-bot darenergy-bot darsecurity-bot
  dartransport-bot dartelecom-bot omarai-bot dardefi-bot darhr-bot
  aifleet-bot darlaw-bot
)

SUCCESS=0
FAIL=0
for dir in "${BOT_DIRS[@]}"; do
    if [ -f "$dir/package.json" ]; then
        echo -n "  Installing $dir... "
        if (cd "$dir" && npm install 2>&1 | tail -1); then
            SUCCESS=$((SUCCESS + 1))
        else
            echo "⚠ FAILED"
            FAIL=$((FAIL + 1))
        fi
    else
        echo "  ⚠ $dir/package.json not found"
        FAIL=$((FAIL + 1))
    fi
done
echo ""
echo "✓ Installed: $SUCCESS/$((SUCCESS + FAIL))"
echo ""

# Step 3: Verify critical modules resolve
echo "━━━ Step 3: Verify Critical Modules ━━━"
VERIFY_OK=0
VERIFY_FAIL=0
for dir in "${BOT_DIRS[@]}"; do
    result=$(cd "$dir" && node -e "
        try {
            require('discord.js');
            require('better-sqlite3');
            require('dotenv');
            console.log('OK');
        } catch(e) {
            console.log('FAIL: ' + e.message.split('\\n')[0]);
        }
    " 2>&1)
    if [ "$result" = "OK" ]; then
        echo "  ✓ $dir: all modules resolved"
        VERIFY_OK=$((VERIFY_OK + 1))
    else
        echo "  ✗ $dir: $result"
        VERIFY_FAIL=$((VERIFY_FAIL + 1))
    fi
done
echo ""
echo "  Verified: $VERIFY_OK/$((VERIFY_OK + VERIFY_FAIL))"
echo ""

# Step 4: Verify .env files have DISCORD_TOKEN
echo "━━━ Step 4: Verify .env Files ━━━"
ENV_OK=0
ENV_MISSING=0
for dir in "${BOT_DIRS[@]}"; do
    if [ -f "$dir/.env" ]; then
        if grep -q "DISCORD_TOKEN=" "$dir/.env" 2>/dev/null; then
            echo "  ✓ $dir/.env has DISCORD_TOKEN"
            ENV_OK=$((ENV_OK + 1))
        else
            echo "  ✗ $dir/.env MISSING DISCORD_TOKEN"
            ENV_MISSING=$((ENV_MISSING + 1))
        fi
    else
        echo "  ✗ $dir/.env FILE NOT FOUND"
        ENV_MISSING=$((ENV_MISSING + 1))
    fi
done
echo ""
echo "  .env OK: $ENV_OK/$((ENV_OK + ENV_MISSING))"
echo ""

echo "╔═══════════════════════════════════════════════════════╗"
echo "║   Fix Complete!                                       ║"
echo "║   Run: bash deploy-all.sh  (to deploy everything)    ║"
echo "╚═══════════════════════════════════════════════════════╝"
