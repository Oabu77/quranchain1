#!/bin/bash
# ==========================================================
# QuranChain™ / Dar Al-Nas™ Proprietary System
# Full Deploy Script — Workers + D1 + Docker Fleet
# ==========================================================
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
cd "$SCRIPT_DIR"

echo "╔══════════════════════════════════════════════════╗"
echo "║  QuranChain™ Full Deploy                        ║"
echo "╚══════════════════════════════════════════════════╝"

# Load .env if exists
if [ -f .env ]; then
    export $(grep -v '^#' .env | xargs)
    echo "✓ Loaded .env"
fi

# Check auth
if [ -z "${CLOUDFLARE_API_TOKEN:-}" ]; then
    echo "⚠ CLOUDFLARE_API_TOKEN not set"
    echo "  Option 1: Create API token at https://dash.cloudflare.com/profile/api-tokens"
    echo "  Option 2: Run 'npx wrangler login' for OAuth"
    echo ""
    echo "  Then either:"
    echo "    export CLOUDFLARE_API_TOKEN=your-token"
    echo "    or add it to .env file"
    echo ""
    
    # Try OAuth as fallback
    echo "Attempting wrangler login..."
    npx wrangler login 2>/dev/null || true
fi

# Step 1: TypeScript check
echo ""
echo "─── [1/5] TypeScript Check ───"
npx tsc --noEmit && echo "✓ No type errors" || { echo "✗ TypeScript errors found"; exit 1; }

# Step 2: Apply D1 migrations remotely
echo ""
echo "─── [2/5] D1 Migrations ───"
echo "y" | npx wrangler d1 migrations apply openapi-template-db --remote 2>&1 && echo "✓ Migrations applied" || echo "⚠ Migration failed (may already be applied)"

# Step 3: Deploy Worker
echo ""
echo "─── [3/5] Deploy Worker ───"
npx wrangler deploy 2>&1 && echo "✓ Worker deployed" || { echo "✗ Worker deploy failed"; exit 1; }

# Step 4: Docker Fleet
echo ""
echo "─── [4/5] Docker FungiMesh Fleet ───"
if command -v docker &>/dev/null; then
    docker compose up -d --build 2>&1 && echo "✓ Fleet running" || echo "⚠ Docker fleet failed"
    docker ps --format "  {{.Names}}: {{.Status}}" 2>/dev/null | sort
else
    echo "⚠ Docker not available, skipping fleet"
fi

# Step 5: Verify
echo ""
echo "─── [5/5] Verification ───"
WORKER_URL=$(npx wrangler deploy --dry-run 2>&1 | grep -oP 'https://\S+\.workers\.dev' | head -1 || echo "")
if [ -n "$WORKER_URL" ]; then
    echo "  Worker: $WORKER_URL"
    curl -sf "${WORKER_URL}/multipass/fleet/health" 2>/dev/null | python3 -c "import sys,json;d=json.load(sys.stdin);print(f'  Fleet: {d[\"fleet\"][\"total\"]} nodes')" 2>/dev/null || echo "  (waiting for propagation)"
fi

# Health check Docker nodes
for port in 8081 8082 8083 8084 8085; do
    node=$(curl -sf http://localhost:${port}/health 2>/dev/null | jq -r '.node' 2>/dev/null || echo "")
    if [ -n "$node" ]; then
        echo "  ✓ $node @ :$port"
    fi
done

echo ""
echo "╔══════════════════════════════════════════════════╗"
echo "║  Deploy Complete!                               ║"
echo "╚══════════════════════════════════════════════════╝"
