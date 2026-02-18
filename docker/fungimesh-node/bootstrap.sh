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

# Register with mesh via /mesh/connect API
echo "[3/5] Registering with FungiMesh mesh..."
CONNECT_PAYLOAD=$(cat <<EOF
{
  "node_id": "${NODE_NAME}",
  "hardware": "docker",
  "region": "auto-detect",
  "capabilities": ["${NODE_ROLE}"]
}
EOF
)

# Try to register with main API (darcloud.host/mesh/connect)
API_BASE="${API_URL:-https://darcloud.host}"
curl -sf -X POST "${API_BASE}/mesh/connect" \
    -H "Content-Type: application/json" \
    -d "$CONNECT_PAYLOAD" 2>/dev/null && echo "  Registered with API!" || echo "  API unavailable, running standalone"

echo "[4/5] Starting health check server..."
python3 /opt/fungimesh/health-server.py &
HEALTH_PID=$!

echo "[5/5] Node is online!"
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
  "started_at": "$(date -u +%Y-%m-%dT%H:%M:%SZ)",
  "health_pid": ${HEALTH_PID}
}
EOF

# Keep running - wait for health server
wait $HEALTH_PID
