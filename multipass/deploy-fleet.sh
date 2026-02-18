#!/bin/bash
# ==========================================================
# QuranChain™ / Dar Al-Nas™ Proprietary System
# Founder: Omar Mohammad Abunadi
# All Rights Reserved. Trademark Protected.
# ==========================================================
#
# Deploy FungiMesh Fleet — Launches multiple Multipass nodes
# Usage: bash multipass/deploy-fleet.sh [count]
#
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
COUNT="${1:-3}"
BASE_NAME="fungimesh"

echo "============================================"
echo "  QuranChain™ FungiMesh Fleet Deployer"
echo "  Deploying $COUNT mesh nodes..."
echo "============================================"

# Node configurations
declare -A NODE_CONFIGS=(
    ["fungimesh-relay1"]="2 2G 10G"
    ["fungimesh-relay2"]="2 2G 10G"
    ["fungimesh-compute1"]="4 4G 20G"
    ["fungimesh-backup1"]="2 2G 30G"
    ["fungimesh-gateway1"]="2 2G 10G"
)

DEPLOYED=0
FAILED=0

for node in $(echo "${!NODE_CONFIGS[@]}" | tr ' ' '\n' | sort | head -n "$COUNT"); do
    IFS=' ' read -r cpus mem disk <<< "${NODE_CONFIGS[$node]}"
    
    echo ""
    echo "─── Deploying: $node ($cpus CPUs, $mem RAM, $disk disk) ───"
    
    if bash "$SCRIPT_DIR/launch.sh" "$node" "$cpus" "$mem" "$disk"; then
        DEPLOYED=$((DEPLOYED + 1))
        echo "✓ $node deployed"
    else
        FAILED=$((FAILED + 1))
        echo "✗ $node failed"
    fi
done

echo ""
echo "============================================"
echo "  Fleet Deployment Complete"
echo "  Deployed: $DEPLOYED / $COUNT"
echo "  Failed:   $FAILED"
echo "============================================"

# List all running nodes
echo ""
echo "Active Multipass VMs:"
multipass list 2>/dev/null || echo "  (multipass not available)"

echo ""
echo "Mesh Status:"
curl -s "https://mesh.darcloud.host/api/status" 2>/dev/null | python3 -m json.tool 2>/dev/null || echo "  (mesh API unreachable)"
