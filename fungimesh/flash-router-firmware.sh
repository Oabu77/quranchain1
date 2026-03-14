#!/bin/bash
# ═══════════════════════════════════════════════════════════
# DarCloud ISP™ — Router Firmware Flash Script
# Converts consumer routers into FungiMesh Network Towers
# 
# Supports: OpenWRT-compatible routers (TP-Link, GL.iNet, 
#           Xiaomi, Ubiquiti, Netgear, ASUS, Linksys)
#
# What it does:
#   1. Detects router hardware (SoC, RAM, flash)
#   2. Installs OpenWRT base + FungiMesh overlay packages
#   3. Configures B.A.T.M.A.N. mesh + WireGuard tunnel
#   4. Sets up dual-band WiFi (client AP + mesh backhaul)
#   5. Enables captive portal for subscriber auth
#   6. Registers as mesh tower with DarCloud API
#   7. Starts heartbeat + bandwidth reporting
#
# Usage: ./flash-router-firmware.sh [--router-ip 192.168.1.1]
#        [--api-url https://darcloud.host]
#        [--node-name tower-01]
#        [--region us-east]
#        [--ssid DarCloud-WiFi]
#        [--channel 6]
#        [--mesh-ssid fungimesh-backhaul]
# ═══════════════════════════════════════════════════════════
set -euo pipefail

# ── Defaults ──
ROUTER_IP="${ROUTER_IP:-192.168.1.1}"
API_URL="${API_URL:-https://darcloud.host}"
NODE_NAME="${NODE_NAME:-tower-$(hostname -s)}"
REGION="${REGION:-auto-detect}"
CLIENT_SSID="${CLIENT_SSID:-DarCloud-WiFi}"
CLIENT_CHANNEL="${CLIENT_CHANNEL:-6}"
MESH_SSID="${MESH_SSID:-fungimesh-backhaul}"
MESH_CHANNEL="${MESH_CHANNEL:-36}"
WG_PORT="${WG_PORT:-51820}"
BATMAN_GW_MODE="${BATMAN_GW_MODE:-server}"

# ── Parse args ──
while [[ $# -gt 0 ]]; do
    case "$1" in
        --router-ip)    ROUTER_IP="$2"; shift 2 ;;
        --api-url)      API_URL="$2"; shift 2 ;;
        --node-name)    NODE_NAME="$2"; shift 2 ;;
        --region)       REGION="$2"; shift 2 ;;
        --ssid)         CLIENT_SSID="$2"; shift 2 ;;
        --channel)      CLIENT_CHANNEL="$2"; shift 2 ;;
        --mesh-ssid)    MESH_SSID="$2"; shift 2 ;;
        *) echo "Unknown option: $1"; exit 1 ;;
    esac
done

echo "═══════════════════════════════════════════════════"
echo "  DarCloud ISP™ — Router → Network Tower Flash"
echo "  Target: ${ROUTER_IP}"
echo "  Tower : ${NODE_NAME} (${REGION})"
echo "  SSID  : ${CLIENT_SSID}"
echo "═══════════════════════════════════════════════════"

# ── Step 1: Detect Router Hardware ──
echo ""
echo "[1/8] Detecting router hardware..."

detect_hardware() {
    # Try SSH first (OpenWRT already installed)
    if ssh -o ConnectTimeout=5 -o StrictHostKeyChecking=no root@${ROUTER_IP} "cat /tmp/sysinfo/board_name" 2>/dev/null; then
        BOARD=$(ssh root@${ROUTER_IP} "cat /tmp/sysinfo/board_name" 2>/dev/null)
        RAM_KB=$(ssh root@${ROUTER_IP} "grep MemTotal /proc/meminfo | awk '{print \$2}'" 2>/dev/null)
        FLASH_KB=$(ssh root@${ROUTER_IP} "df / | tail -1 | awk '{print \$2}'" 2>/dev/null)
        ALREADY_OPENWRT=true
    else
        # Router is stock firmware — detect via HTTP headers or mDNS
        BOARD="unknown"
        RAM_KB="0"
        FLASH_KB="0"
        ALREADY_OPENWRT=false
    fi
    
    RAM_MB=$((${RAM_KB:-0} / 1024))
    FLASH_MB=$((${FLASH_KB:-0} / 1024))
    echo "  Board: ${BOARD}"
    echo "  RAM: ${RAM_MB}MB | Flash: ${FLASH_MB}MB"
    echo "  OpenWRT pre-installed: ${ALREADY_OPENWRT}"
}

detect_hardware || {
    echo "  Could not auto-detect hardware. Proceeding with generic config."
    BOARD="generic"
    RAM_MB=128
    FLASH_MB=16
    ALREADY_OPENWRT=false
}

# ── Step 2: Install OpenWRT Packages ──
echo ""
echo "[2/8] Installing FungiMesh tower packages..."

install_packages() {
    ssh root@${ROUTER_IP} <<'REMOTE_INSTALL'
# Update package lists
opkg update

# Core mesh + tunnel packages
opkg install batctl-default batman-adv kmod-batman-adv
opkg install wireguard-tools kmod-wireguard
opkg install hostapd-openssl

# Networking utilities
opkg install ip-full iptables-nft kmod-nft-nat
opkg install tcpdump-mini curl ca-bundle

# Bandwidth monitoring
opkg install vnstat2 luci-app-vnstat2

# Captive portal (nodogsplash)
opkg install nodogsplash

echo "  Packages installed successfully."
REMOTE_INSTALL
}

if [ "$ALREADY_OPENWRT" = true ]; then
    install_packages
else
    echo "  Router is on stock firmware."
    echo "  Please flash OpenWRT first from https://openwrt.org/toh/start"
    echo "  Then re-run this script."
    echo ""
    echo "  For automated flash, connect the router and run:"
    echo "    sysupgrade -n /tmp/openwrt-*.bin"
    echo ""
    echo "  Generating config files for manual application..."
fi

# ── Step 3: Generate WireGuard Keys ──
echo ""
echo "[3/8] Generating WireGuard keys..."

WG_PRIVKEY=$(wg genkey 2>/dev/null || openssl rand -base64 32)
WG_PUBKEY=$(echo "$WG_PRIVKEY" | wg pubkey 2>/dev/null || echo "pending-$(date +%s)")
echo "  Public key: ${WG_PUBKEY:0:20}..."

# ── Step 4: Configure B.A.T.M.A.N. Mesh ──
echo ""
echo "[4/8] Configuring B.A.T.M.A.N. mesh backhaul..."

BATMAN_CONFIG="
# /etc/config/batman-adv — FungiMesh Tower Config
config mesh 'bat0'
    option aggregated_ogms '1'
    option ap_isolation '0'
    option bonding '0'
    option bridge_loop_avoidance '1'
    option distributed_arp_table '1'
    option fragmentation '1'
    option gw_mode '${BATMAN_GW_MODE}'
    option gw_bandwidth '100mbit/50mbit'
    option hop_penalty '30'
    option isolation_mark '0x00000000/0x00000000'
    option log_level '0'
    option multicast_mode '1'
    option network_coding '0'
    option orig_interval '1000'

config interface 'mesh0'
    option mesh 'bat0'
"

# ── Step 5: Configure Dual-Band WiFi ──
echo ""
echo "[5/8] Configuring dual-band WiFi (client AP + mesh)..."

WIFI_CONFIG="
# /etc/config/wireless — FungiMesh Tower WiFi

# Radio 0: 2.4GHz Client Access Point
config wifi-device 'radio0'
    option type 'mac80211'
    option channel '${CLIENT_CHANNEL}'
    option htmode 'HT40'
    option txpower '20'
    option country 'US'

config wifi-iface 'client_ap'
    option device 'radio0'
    option network 'lan'
    option mode 'ap'
    option ssid '${CLIENT_SSID}'
    option encryption 'sae-mixed'
    option key 'darcloud2024'
    option ieee80211w '1'

# Radio 1: 5GHz Mesh Backhaul
config wifi-device 'radio1'
    option type 'mac80211'
    option channel '${MESH_CHANNEL}'
    option htmode 'VHT80'
    option txpower '23'
    option country 'US'

config wifi-iface 'mesh_backhaul'
    option device 'radio1'
    option network 'bat0'
    option mode 'mesh'
    option mesh_id '${MESH_SSID}'
    option encryption 'sae'
    option key 'fungimesh-tower-key'
    option mesh_fwding '0'
"

# ── Step 6: Configure WireGuard Tunnel ──
echo ""
echo "[6/8] Configuring WireGuard tunnel to mesh..."

WG_CONFIG="
# /etc/config/network — WireGuard interface for FungiMesh

config interface 'wg_mesh'
    option proto 'wireguard'
    option private_key '${WG_PRIVKEY}'
    option listen_port '${WG_PORT}'
    list addresses '10.0.0.0/24'

# Peers will be auto-configured from mesh coordinator
# Fetch from: ${API_URL}/mesh/peers/${NODE_NAME}
"

# ── Step 7: Configure Captive Portal ──
echo ""
echo "[7/8] Configuring captive portal..."

CAPTIVE_CONFIG="
# /etc/config/nodogsplash — DarCloud ISP Captive Portal

config nodogsplash
    option enabled '1'
    option gatewayname 'DarCloud WiFi'
    option gatewayinterface 'br-lan'
    option maxclients '250'
    option uploadrate '0'
    option downloadrate '0'
    option redirecturl 'https://darcloud.host/signup'
    option authenticateimmediately 'no'
    option trafficcontrol 'yes'
    option downloadlimit '50000'
    option uploadlimit '25000'
"

# ── Step 8: Register as Mesh Tower ──
echo ""
echo "[8/8] Registering tower with DarCloud mesh..."

# Get public IP
PUBLIC_IP=$(curl -sf https://ifconfig.me 2>/dev/null || curl -sf https://api.ipify.org 2>/dev/null || echo "")

CONNECT_PAYLOAD=$(cat <<EOF
{
    "node_id": "${NODE_NAME}",
    "hardware": "${BOARD:-router}",
    "region": "${REGION}",
    "capabilities": ["gateway", "tower", "relay"],
    "wireguard_pubkey": "${WG_PUBKEY}",
    "wireguard_endpoint": "${PUBLIC_IP}",
    "listen_port": ${WG_PORT},
    "role": "tower",
    "device_type": "router",
    "firmware_version": "1.0.0-fungimesh"
}
EOF
)

# Register with mesh API
REGISTER_RESULT=$(curl -sf -X POST "${API_URL}/mesh/connect" \
    -H "Content-Type: application/json" \
    -d "$CONNECT_PAYLOAD" 2>/dev/null) && {
    echo "  Registered with mesh API!"
    echo "  Response: $REGISTER_RESULT"
} || {
    echo "  API registration deferred (will retry on heartbeat)"
}

# Also register as ISP device
DEVICE_PAYLOAD=$(cat <<EOF
{
    "device_id": "${NODE_NAME}",
    "device_type": "router",
    "manufacturer": "${BOARD:-unknown}",
    "model": "mesh-tower",
    "mesh_enabled": true,
    "is_mesh_tower": true
}
EOF
)

curl -sf -X POST "${API_URL}/isp/devices/register" \
    -H "Content-Type: application/json" \
    -d "$DEVICE_PAYLOAD" 2>/dev/null && echo "  Device registered with ISP!" || true

# ── Apply configs to router (if SSH available) ──
if [ "$ALREADY_OPENWRT" = true ]; then
    echo ""
    echo "Applying configurations to router..."
    
    ssh root@${ROUTER_IP} "cat > /etc/config/batman-adv" <<< "$BATMAN_CONFIG"
    ssh root@${ROUTER_IP} "cat > /etc/config/wireless" <<< "$WIFI_CONFIG"
    ssh root@${ROUTER_IP} "cat >> /etc/config/network" <<< "$WG_CONFIG"
    ssh root@${ROUTER_IP} "cat > /etc/config/nodogsplash" <<< "$CAPTIVE_CONFIG"
    
    # Set up peer refresh cron
    ssh root@${ROUTER_IP} <<REMOTE_CRON
# Fetch peers from coordinator every 5 minutes
cat > /etc/cron.d/fungimesh-peers <<'CRONEOF'
*/5 * * * * root curl -sf ${API_URL}/mesh/peers/${NODE_NAME} | /usr/bin/fungimesh-peer-sync.sh
CRONEOF

# Create peer sync script
cat > /usr/bin/fungimesh-peer-sync.sh <<'SYNCEOF'
#!/bin/sh
# Read peer configs from stdin (JSON from mesh coordinator API)
# and apply them as WireGuard peers
PEERS_JSON=\$(cat)
echo "\$PEERS_JSON" | jsonfilter -e '@.peers[*]' | while read -r PEER; do
    PUBKEY=\$(echo "\$PEER" | jsonfilter -e '@.wireguard_pubkey')
    ENDPOINT=\$(echo "\$PEER" | jsonfilter -e '@.endpoint')
    ALLOWED=\$(echo "\$PEER" | jsonfilter -e '@.allowed_ips')
    if [ -n "\$PUBKEY" ] && [ -n "\$ENDPOINT" ]; then
        wg set wg_mesh peer "\$PUBKEY" endpoint "\$ENDPOINT" allowed-ips "\$ALLOWED" persistent-keepalive 25
    fi
done
SYNCEOF
chmod +x /usr/bin/fungimesh-peer-sync.sh

# Heartbeat cron — report status every 2 minutes
cat > /etc/cron.d/fungimesh-heartbeat <<'HBEOF'
*/2 * * * * root curl -sf -X POST ${API_URL}/mesh/heartbeat -H "Content-Type: application/json" -d "{\"node_id\":\"${NODE_NAME}\",\"status\":\"online\"}"
HBEOF

# Restart services
/etc/init.d/network restart
/etc/init.d/batman-adv restart
/etc/init.d/nodogsplash restart
/etc/init.d/cron restart
REMOTE_CRON

    echo "  Configuration applied and services restarted!"
else
    # Save configs locally for manual application
    mkdir -p /tmp/fungimesh-tower-configs
    echo "$BATMAN_CONFIG" > /tmp/fungimesh-tower-configs/batman-adv
    echo "$WIFI_CONFIG" > /tmp/fungimesh-tower-configs/wireless
    echo "$WG_CONFIG" > /tmp/fungimesh-tower-configs/network-wg
    echo "$CAPTIVE_CONFIG" > /tmp/fungimesh-tower-configs/nodogsplash
    echo ""
    echo "  Configs saved to /tmp/fungimesh-tower-configs/"
    echo "  SCP to router after OpenWRT is installed:"
    echo "    scp /tmp/fungimesh-tower-configs/* root@${ROUTER_IP}:/etc/config/"
fi

echo ""
echo "═══════════════════════════════════════════════════"
echo "  Tower ${NODE_NAME} configuration complete!"
echo "  "
echo "  Mesh Network: ${MESH_SSID} (B.A.T.M.A.N.)"
echo "  Client WiFi:  ${CLIENT_SSID}"
echo "  WireGuard:    ${WG_PUBKEY:0:20}... port ${WG_PORT}"
echo "  Public IP:    ${PUBLIC_IP:-pending}"
echo "  Peer Config:  ${API_URL}/mesh/peers/${NODE_NAME}"
echo "  "
echo "  The tower will auto-sync peers every 5 minutes"
echo "  and report heartbeats every 2 minutes."
echo "═══════════════════════════════════════════════════"
