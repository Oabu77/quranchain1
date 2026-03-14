#!/bin/bash
# ==========================================================
# QuranChain™ / Dar Al-Nas™ Proprietary System
# FungiMesh Node Bootstrap
# ==========================================================
set -e

echo "============================================"
echo "  QuranChain™ FungiMesh Node Bootstrap"
echo "  Node: ${NODE_NAME}"
echo "  Role: ${NODE_ROLE}"
echo "============================================"

# Generate WireGuard keys
echo "[1/5] Generating WireGuard keys..."
WG_PRIVKEY=$(wg genkey 2>/dev/null || echo "sim-privkey-$(hostname)")
WG_PUBKEY=$(echo "$WG_PRIVKEY" | wg pubkey 2>/dev/null || echo "sim-pubkey-$(hostname)")
echo "  Public key: ${WG_PUBKEY:0:20}..."

# Write node config
echo "[2/5] Writing node config..."
cat > /etc/fungimesh/node.conf <<EOF
[node]
name = ${NODE_NAME}
role = ${NODE_ROLE}
mesh_upstream = ${MESH_UPSTREAM}

[wireguard]
public_key = ${WG_PUBKEY}
listen_port = 51820

[health]
port = 8080
interval = 30

[quranchain]
network = mainnet
label = quranchain
trademark = QuranChain™ / Dar Al-Nas™
EOF

# Register with mesh via /mesh/connect API — now sends WireGuard peering info
echo "[3/6] Registering with FungiMesh mesh..."

# Get public IP for WireGuard endpoint
PUBLIC_IP=$(curl -sf https://ifconfig.me 2>/dev/null || curl -sf https://api.ipify.org 2>/dev/null || echo "")
MESH_IP="10.0.$(( RANDOM % 255 )).$(( RANDOM % 254 + 1 ))"

CONNECT_PAYLOAD=$(cat <<EOF
{
  "node_id": "${NODE_NAME}",
  "hardware": "docker",
  "region": "auto-detect",
  "capabilities": ["${NODE_ROLE}"],
  "wireguard_pubkey": "${WG_PUBKEY}",
  "wireguard_endpoint": "${PUBLIC_IP}",
  "listen_port": 51820,
  "mesh_ip": "${MESH_IP}",
  "role": "${NODE_ROLE}",
  "device_type": "docker"
}
EOF
)

# Try to register with main API (darcloud.host/mesh/connect)
API_BASE="${API_URL:-https://darcloud.host}"
curl -sf -X POST "${API_BASE}/mesh/connect" \
    -H "Content-Type: application/json" \
    -d "$CONNECT_PAYLOAD" 2>/dev/null && echo "  Registered with API!" || echo "  API unavailable, running standalone"

# ── Step 4: Fetch Peer Configs from Coordinator ──
echo "[4/6] Fetching peer configs from mesh coordinator..."

configure_peers() {
    PEERS_JSON=$(curl -sf "${API_BASE}/mesh/peers/${NODE_NAME}" 2>/dev/null) || return 1
    PEER_COUNT=$(echo "$PEERS_JSON" | python3 -c "import sys,json; print(json.load(sys.stdin).get('total_peers',0))" 2>/dev/null || echo "0")
    
    if [ "$PEER_COUNT" -gt 0 ]; then
        echo "  Found ${PEER_COUNT} peers, configuring WireGuard..."
        
        # Set up WireGuard interface
        ip link add wg0 type wireguard 2>/dev/null || true
        wg set wg0 private-key <(echo "$WG_PRIVKEY") listen-port 51820 2>/dev/null || true
        ip addr add "${MESH_IP}/24" dev wg0 2>/dev/null || true
        ip link set wg0 up 2>/dev/null || true
        
        # Add each peer
        echo "$PEERS_JSON" | python3 -c "
import sys, json, subprocess
data = json.load(sys.stdin)
for peer in data.get('peers', []):
    pubkey = peer.get('wireguard_pubkey', '')
    endpoint = peer.get('endpoint', '')
    allowed = peer.get('allowed_ips', '10.0.0.0/24')
    if pubkey and endpoint:
        cmd = ['wg', 'set', 'wg0', 'peer', pubkey, 'endpoint', endpoint, 'allowed-ips', allowed, 'persistent-keepalive', '25']
        subprocess.run(cmd, capture_output=True)
        print(f'  Added peer: {peer[\"node_id\"]} ({pubkey[:20]}...)')
" 2>/dev/null || echo "  Peer config deferred (will retry)"
    else
        echo "  No peers available yet (solo node)"
    fi
}

configure_peers || echo "  Peer exchange deferred"

echo "[5/6] Starting health check server..."
python3 /opt/fungimesh/health-server.py &
HEALTH_PID=$!

echo "[6/6] Node is online!"
echo "============================================"
echo "  FungiMesh Node: ${NODE_NAME}"
echo "  Role: ${NODE_ROLE}"
echo "  Health: http://0.0.0.0:8080/health"
echo "  WireGuard: ${WG_PUBKEY:0:20}..."
echo "  Status: RUNNING"
echo "============================================"

# Write status file
cat > /var/log/fungimesh/status.json <<EOF
{
  "node": "${NODE_NAME}",
  "role": "${NODE_ROLE}",
  "status": "running",
  "wireguard_pubkey": "${WG_PUBKEY}",
  "wireguard_endpoint": "${PUBLIC_IP}",
  "mesh_ip": "${MESH_IP}",
  "started_at": "$(date -u +%Y-%m-%dT%H:%M:%SZ)",
  "health_pid": ${HEALTH_PID}
}
EOF

# Keep running - wait for health server
wait $HEALTH_PID
