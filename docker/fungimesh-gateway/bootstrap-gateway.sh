#!/bin/bash
# ==========================================================
# DarCloud FungiMesh WiFi Gateway Bootstrap
# B.A.T.M.A.N. + WireGuard + Captive Portal
# ==========================================================
set -e

echo "╔══════════════════════════════════════════════════════════╗"
echo "║  🍄 FungiMesh WiFi Gateway Bootstrap                    ║"
echo "║  B.A.T.M.A.N. + WireGuard + Captive Portal             ║"
echo "╚══════════════════════════════════════════════════════════╝"
echo "  Node: ${NODE_NAME}"
echo "  Role: ${NODE_ROLE} (${BATMAN_GW_MODE})"

# ── WireGuard Setup ──
echo "[1/5] Configuring WireGuard..."
WG_PRIVKEY=$(wg genkey 2>/dev/null || echo "sim-$(hostname)-privkey")
WG_PUBKEY=$(echo "$WG_PRIVKEY" | wg pubkey 2>/dev/null || echo "sim-$(hostname)-pubkey")

HASH=$(echo -n "$NODE_NAME" | md5sum | head -c 4)
OCTET3=$(( 16#${HASH:0:2} % 254 + 1 ))
OCTET4=$(( 16#${HASH:2:2} % 254 + 1 ))
WG_IP="10.77.${OCTET3}.${OCTET4}"

cat > /etc/wireguard/wg-fungi.conf <<EOF
[Interface]
PrivateKey = ${WG_PRIVKEY}
Address = ${WG_IP}/16
ListenPort = 51820
EOF

wg-quick up wg-fungi 2>/dev/null || echo "  WireGuard in simulated mode (no kernel module)"
echo "  WG IP: ${WG_IP} | Pubkey: ${WG_PUBKEY:0:20}..."

# ── B.A.T.M.A.N. Setup ──
echo "[2/5] Initializing B.A.T.M.A.N...."
modprobe batman-adv 2>/dev/null && {
    batctl gw_mode "${BATMAN_GW_MODE}" 2>/dev/null || true
    echo "  batman-adv loaded, GW mode: ${BATMAN_GW_MODE}"
} || echo "  batman-adv not available (simulated mode)"

# ── Bridge Setup ──
echo "[3/5] Creating mesh bridge..."
ip link add br-mesh type bridge 2>/dev/null || true
ip link set br-mesh up 2>/dev/null || true
ip addr add 10.78.0.1/24 dev br-mesh 2>/dev/null || true
echo "  Bridge br-mesh @ 10.78.0.1"

# ── IP Forwarding & NAT ──
echo "[4/5] Configuring NAT..."
sysctl -w net.ipv4.ip_forward=1 2>/dev/null || true
INET_IFACE=$(ip route show default | head -1 | awk '{print $5}')
[ -z "$INET_IFACE" ] && INET_IFACE="eth0"
iptables -t nat -A POSTROUTING -o "$INET_IFACE" -j MASQUERADE 2>/dev/null || true
iptables -A FORWARD -i br-mesh -o "$INET_IFACE" -j ACCEPT 2>/dev/null || true
iptables -A FORWARD -i "$INET_IFACE" -o br-mesh -m state --state RELATED,ESTABLISHED -j ACCEPT 2>/dev/null || true
echo "  NAT via $INET_IFACE"

# ── Register with API ──
echo "[5/5] Registering with DarCloud..."
API_BASE="${DARCLOUD_API:-https://darcloud.host}"
curl -sf -X POST "${API_BASE}/mesh/connect" \
  -H "Content-Type: application/json" \
  -d "{
    \"node_id\": \"${NODE_NAME}\",
    \"hardware\": \"docker-gateway\",
    \"region\": \"auto-detect\",
    \"capabilities\": \"relay,gateway,wifi-ap\"
  }" 2>/dev/null && echo "  Registered with mesh API" || echo "  API offline, running standalone"

# Write status
cat > /var/log/fungimesh/status.json <<EOF
{
  "node": "${NODE_NAME}",
  "role": "${NODE_ROLE}",
  "type": "wifi-gateway",
  "status": "running",
  "wireguard_ip": "${WG_IP}",
  "wireguard_pubkey": "${WG_PUBKEY}",
  "batman_gw_mode": "${BATMAN_GW_MODE}",
  "bridge": "br-mesh @ 10.78.0.1",
  "started_at": "$(date -u +%Y-%m-%dT%H:%M:%SZ)",
  "protocols": {
    "mesh": "B.A.T.M.A.N. Advanced",
    "backhaul": "802.11s",
    "vpn": "WireGuard",
    "portal": "DarCloud Captive Portal"
  }
}
EOF

echo ""
echo "  ✅ Gateway online: ${NODE_NAME}"
echo "  Health: http://0.0.0.0:${HEALTH_PORT}"
echo "  Portal: http://0.0.0.0:${PORTAL_PORT}"
echo ""

# Start gateway server (health + captive portal + heartbeat)
exec python3 /opt/fungimesh/gateway-server.py
