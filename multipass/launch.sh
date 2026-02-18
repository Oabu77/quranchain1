#!/bin/bash
# ==========================================================
# QuranChain™ / Dar Al-Nas™ Proprietary System
# Founder: Omar Mohammad Abunadi
# All Rights Reserved. Trademark Protected.
# ==========================================================
#
# Multipass FungiMesh Server — Launch & Deploy
# Usage: bash multipass/launch.sh [node-name] [cpus] [memory] [disk]
#
set -euo pipefail

# ─── Configuration ────────────────────────────────────────
NODE_NAME="${1:-fungimesh-node1}"
CPUS="${2:-2}"
MEMORY="${3:-2G}"
DISK="${4:-10G}"
CLOUD_INIT="$(dirname "$0")/cloud-init-fungimesh.yml"
API_URL="https://darcloud.host"

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
CYAN='\033[0;36m'
NC='\033[0m'

log() { echo -e "${CYAN}[QuranChain]${NC} $1"; }
ok()  { echo -e "${GREEN}[✓]${NC} $1"; }
warn(){ echo -e "${YELLOW}[!]${NC} $1"; }
err() { echo -e "${RED}[✗]${NC} $1"; exit 1; }

# ─── Pre-flight Checks ───────────────────────────────────
log "QuranChain™ FungiMesh Multipass Deployer"
echo "============================================"
echo "  Node:   $NODE_NAME"
echo "  CPUs:   $CPUS"
echo "  Memory: $MEMORY"
echo "  Disk:   $DISK"
echo "============================================"

# Check multipass installed
if ! command -v multipass &>/dev/null; then
    warn "Multipass not installed. Installing..."
    
    if [[ "$(uname)" == "Darwin" ]]; then
        brew install --cask multipass
    elif command -v snap &>/dev/null; then
        sudo snap install multipass
    else
        err "Cannot install Multipass automatically. Install from https://multipass.run"
    fi
    
    ok "Multipass installed"
fi

MULTIPASS_VERSION=$(multipass version 2>/dev/null | head -1)
ok "Multipass: $MULTIPASS_VERSION"

# Check cloud-init exists
if [[ ! -f "$CLOUD_INIT" ]]; then
    err "Cloud-init file not found: $CLOUD_INIT"
fi
ok "Cloud-init: $CLOUD_INIT"

# ─── Check if VM Already Exists ──────────────────────────
if multipass info "$NODE_NAME" &>/dev/null; then
    warn "VM '$NODE_NAME' already exists"
    
    STATE=$(multipass info "$NODE_NAME" --format json | python3 -c "
import json,sys
d=json.load(sys.stdin)
print(d['info']['$NODE_NAME']['state'])
" 2>/dev/null || echo "unknown")
    
    if [[ "$STATE" == "Running" ]]; then
        ok "VM is already running"
        IP=$(multipass info "$NODE_NAME" --format json | python3 -c "
import json,sys
d=json.load(sys.stdin)
ips = d['info']['$NODE_NAME'].get('ipv4',['unknown'])
print(ips[0] if ips else 'unknown')
" 2>/dev/null)
        ok "IP: $IP"
    else
        log "Starting existing VM..."
        multipass start "$NODE_NAME"
        ok "VM started"
    fi
else
    # ─── Launch New VM ────────────────────────────────────
    log "Launching new Multipass VM: $NODE_NAME"
    log "This may take 3-5 minutes..."
    
    multipass launch \
        --name "$NODE_NAME" \
        --cpus "$CPUS" \
        --memory "$MEMORY" \
        --disk "$DISK" \
        --cloud-init "$CLOUD_INIT" \
        24.04
    
    ok "VM launched successfully"
fi

# ─── Wait for Cloud-Init ─────────────────────────────────
log "Waiting for cloud-init to complete..."
for i in $(seq 1 60); do
    STATUS=$(multipass exec "$NODE_NAME" -- cloud-init status 2>/dev/null | grep -o 'done\|running\|error' || echo "waiting")
    if [[ "$STATUS" == "done" ]]; then
        ok "Cloud-init complete"
        break
    elif [[ "$STATUS" == "error" ]]; then
        warn "Cloud-init had errors. Check: multipass exec $NODE_NAME -- cloud-init status --long"
        break
    fi
    sleep 5
done

# ─── Get VM Info ──────────────────────────────────────────
log "VM Details:"
multipass info "$NODE_NAME"

IP=$(multipass info "$NODE_NAME" --format json | python3 -c "
import json,sys
d=json.load(sys.stdin)
ips = d['info']['$NODE_NAME'].get('ipv4',['unknown'])
print(ips[0] if ips else 'unknown')
" 2>/dev/null)

# ─── Verify FungiMesh ────────────────────────────────────
log "Verifying FungiMesh node..."

# Check WireGuard
WG_STATUS=$(multipass exec "$NODE_NAME" -- sudo wg show 2>/dev/null && echo "active" || echo "inactive")
if [[ "$WG_STATUS" == *"active"* ]]; then
    ok "WireGuard mesh interface: active"
else
    warn "WireGuard not yet active (may need manual peer setup)"
fi

# Check health endpoint
HEALTH=$(curl -s --max-time 5 "http://$IP:8080/health" 2>/dev/null || echo '{"status":"unreachable"}')
log "Health check: $HEALTH"

# ─── Register with API ───────────────────────────────────
log "Registering VM with QuranChain API..."

REGISTER=$(curl -s -X POST "$API_URL/mesh/connect" \
    -H "Content-Type: application/json" \
    -d "{
        \"node_name\": \"$NODE_NAME\",
        \"hardware\": \"multipass\",
        \"public_key\": \"multipass-$(date +%s)\",
        \"endpoint\": \"$IP:51820\",
        \"capabilities\": [\"relay\", \"backup\", \"compute\"]
    }" 2>/dev/null || echo '{"error":"API unreachable"}')

log "Registration: $REGISTER"

# ─── Summary ─────────────────────────────────────────────
echo ""
echo "============================================"
echo -e "${GREEN}  QuranChain™ FungiMesh Node Deployed${NC}"
echo "============================================"
echo "  Name:     $NODE_NAME"
echo "  IP:       $IP"
echo "  CPUs:     $CPUS"
echo "  Memory:   $MEMORY"
echo "  Disk:     $DISK"
echo "  Mesh:     wss://mesh.darcloud.host/ws"
echo "  Health:   http://$IP:8080/health"
echo "  WG Port:  51820/udp"
echo "============================================"
echo ""
echo "Quick commands:"
echo "  multipass shell $NODE_NAME          # SSH into VM"
echo "  multipass exec $NODE_NAME -- wg show  # Check WireGuard"
echo "  curl http://$IP:8080/health           # Health check"
echo "  multipass stop $NODE_NAME           # Stop VM"
echo "  multipass delete $NODE_NAME         # Delete VM"
echo "============================================"
