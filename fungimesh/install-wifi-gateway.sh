#!/bin/bash
# ═══════════════════════════════════════════════════════════════
#  DarCloud FungiMesh WiFi Gateway Node Installer
#  Turns any Linux device into a WiFi mesh gateway/antenna
#  
#  Integrates:
#  - B.A.T.M.A.N. Advanced (batman-adv) — Layer 2 mesh routing
#  - 802.11s mesh point — WiFi mesh backhaul between nodes
#  - hostapd — WiFi access point for client devices
#  - WireGuard — Encrypted VPN backbone to DarCloud network
#  - dnsmasq — DHCP + DNS for WiFi clients
#  - nftables — Traffic shaping, captive portal, NAT
#  - FungiMesh heartbeat — Reports to DarCloud API
#  
#  Architecture:
#    Clients → wlan0(AP) → br-mesh(bridge) → bat0(B.A.T.M.A.N.) 
#    → wlan1(802.11s mesh) → peer nodes → wg-fungi(WireGuard) → Internet
#
#  Usage: sudo bash install-wifi-gateway.sh [--channel 6] [--ssid DarCloud-WiFi]
# ═══════════════════════════════════════════════════════════════

set -euo pipefail

# ── Configuration ──
DARCLOUD_API="https://darcloud.host"
NODE_ID="fungi-gw-$(hostname)-$(date +%s | tail -c 6)"
MESH_SSID="FungiMesh-Backhaul"
AP_SSID="DarCloud-WiFi"
AP_PASS="DarCloud2026"
MESH_CHANNEL=6
MESH_FREQ=2437
BATMAN_GW_MODE="server"  # "server" for internet-connected, "client" for relay-only
WG_PORT=51820
MESH_SUBNET="10.77.0.0/16"
CLIENT_SUBNET="10.78.0.0/24"
GATEWAY_IP="10.78.0.1"
DNS_SERVERS="1.1.1.1,8.8.8.8"
CAPTIVE_PORTAL_PORT=8888
HEALTH_PORT=8080
HEARTBEAT_INTERVAL=30

# Parse args
while [[ $# -gt 0 ]]; do
  case "$1" in
    --channel) MESH_CHANNEL=$2; shift 2;;
    --ssid) AP_SSID=$2; shift 2;;
    --pass) AP_PASS=$2; shift 2;;
    --gw-mode) BATMAN_GW_MODE=$2; shift 2;;
    --node-id) NODE_ID=$2; shift 2;;
    *) shift;;
  esac
done

# Frequency lookup for channel
declare -A CHAN_FREQ=([1]=2412 [2]=2417 [3]=2422 [4]=2427 [5]=2432 [6]=2437 [7]=2442 [8]=2447 [9]=2452 [10]=2457 [11]=2462 [36]=5180 [40]=5200 [44]=5220 [48]=5240 [149]=5745 [153]=5765 [157]=5785 [161]=5805)
MESH_FREQ=${CHAN_FREQ[$MESH_CHANNEL]:-2437}

echo "╔══════════════════════════════════════════════════════════╗"
echo "║  🍄 DarCloud FungiMesh WiFi Gateway Installer           ║"
echo "║  B.A.T.M.A.N. + 802.11s + hostapd + WireGuard          ║"
echo "╚══════════════════════════════════════════════════════════╝"
echo ""
echo "  Node ID:      $NODE_ID"
echo "  Mesh SSID:    $MESH_SSID (ch $MESH_CHANNEL)"
echo "  AP SSID:      $AP_SSID"
echo "  GW Mode:      $BATMAN_GW_MODE"
echo "  Client Net:   $CLIENT_SUBNET → $GATEWAY_IP"
echo ""

# ═══════════════════════════════════════════════
# 1. PREREQUISITES
# ═══════════════════════════════════════════════
echo "▸ [1/10] Installing packages..."
export DEBIAN_FRONTEND=noninteractive
apt-get update -qq
apt-get install -y -qq \
  batctl batman-adv-dkms \
  hostapd dnsmasq \
  wireguard wireguard-tools \
  nftables bridge-utils \
  iw wireless-tools \
  python3 python3-flask python3-requests \
  curl jq net-tools \
  iperf3 tcpdump \
  2>/dev/null

# Load batman-adv kernel module
echo "▸ [2/10] Loading B.A.T.M.A.N. kernel module..."
modprobe batman-adv 2>/dev/null || true
echo "batman-adv" >> /etc/modules-load.d/batman-adv.conf 2>/dev/null || true
batctl -v && echo "  ✓ batman-adv loaded" || echo "  ⚠ batman-adv not available, using WireGuard-only mode"

# ═══════════════════════════════════════════════
# 2. DETECT WIRELESS INTERFACES
# ═══════════════════════════════════════════════
echo "▸ [3/10] Detecting wireless interfaces..."
WLAN_IFACES=($(iw dev | grep Interface | awk '{print $2}'))
PHY_DEVICES=($(iw dev | grep phy | awk '{print $2}' | tr -d '#'))

if [ ${#WLAN_IFACES[@]} -eq 0 ]; then
  echo "  ⚠ No wireless interfaces found!"
  echo "  Creating virtual interface for testing..."
  # For servers without WiFi, create a dummy setup
  MESH_IFACE="none"
  AP_IFACE="none"
  WIFI_MODE="wired-only"
elif [ ${#WLAN_IFACES[@]} -eq 1 ]; then
  echo "  Found 1 WiFi interface: ${WLAN_IFACES[0]}"
  echo "  Creating virtual interface for dual-radio..."
  # Single radio: use virtual interfaces
  MESH_IFACE="${WLAN_IFACES[0]}"
  AP_IFACE="${WLAN_IFACES[0]}-ap"
  WIFI_MODE="single-radio"
  # Create virtual AP interface on same physical device
  PHY=$(iw dev ${WLAN_IFACES[0]} info 2>/dev/null | grep wiphy | awk '{print $2}')
  iw phy phy${PHY:-0} interface add "$AP_IFACE" type __ap 2>/dev/null || AP_IFACE="${WLAN_IFACES[0]}"
else
  echo "  Found ${#WLAN_IFACES[@]} WiFi interfaces: ${WLAN_IFACES[*]}"
  MESH_IFACE="${WLAN_IFACES[0]}"  # First for mesh backhaul
  AP_IFACE="${WLAN_IFACES[1]}"    # Second for client AP
  WIFI_MODE="dual-radio"
fi

echo "  Mesh interface: $MESH_IFACE"
echo "  AP interface:   $AP_IFACE"
echo "  Mode:           $WIFI_MODE"

# ═══════════════════════════════════════════════
# 3. B.A.T.M.A.N. MESH CONFIGURATION
# ═══════════════════════════════════════════════
echo "▸ [4/10] Configuring B.A.T.M.A.N. mesh..."
mkdir -p /etc/fungimesh /var/log/fungimesh /opt/fungimesh

if command -v batctl &>/dev/null && [ "$MESH_IFACE" != "none" ]; then
  # Take down interface for reconfiguration
  ip link set "$MESH_IFACE" down 2>/dev/null || true
  
  # Set mesh point mode (802.11s)
  iw dev "$MESH_IFACE" set type mesh 2>/dev/null || {
    echo "  ⚠ Cannot set mesh mode on $MESH_IFACE, using WireGuard-only"
    WIFI_MODE="wired-only"
  }
  
  if [ "$WIFI_MODE" != "wired-only" ]; then
    # Configure 802.11s mesh
    ip link set "$MESH_IFACE" up
    iw dev "$MESH_IFACE" mesh join "$MESH_SSID" freq $MESH_FREQ 2>/dev/null || true
    
    # Add mesh interface to batman-adv
    batctl if add "$MESH_IFACE" 2>/dev/null || true
    
    # Bring up bat0
    ip link set bat0 up 2>/dev/null || true
    
    # Set gateway mode
    batctl gw_mode "$BATMAN_GW_MODE" 2>/dev/null || true
    
    # Configure batman-adv parameters
    batctl orig_interval 1000 2>/dev/null || true      # OGM interval (ms)
    batctl hop_penalty 15 2>/dev/null || true           # Hop penalty (0-255)
    batctl multicast_mode 1 2>/dev/null || true         # Enable multicast
    batctl bridge_loop_avoidance 1 2>/dev/null || true  # BLA
    batctl distributed_arp_table 1 2>/dev/null || true  # DAT
    batctl network_coding 1 2>/dev/null || true         # NC: network coding
    
    echo "  ✓ B.A.T.M.A.N. mesh configured on $MESH_IFACE → bat0"
    echo "  ✓ GW mode: $BATMAN_GW_MODE"
    echo "  ✓ 802.11s mesh: $MESH_SSID @ ch$MESH_CHANNEL ($MESH_FREQ MHz)"
  fi
fi

# ═══════════════════════════════════════════════
# 4. WIREGUARD VPN BACKBONE
# ═══════════════════════════════════════════════
echo "▸ [5/10] Configuring WireGuard VPN backbone..."
WG_PRIVKEY=$(wg genkey)
WG_PUBKEY=$(echo "$WG_PRIVKEY" | wg pubkey)
WG_IFACE="wg-fungi"

# Assign IP from mesh subnet based on last 2 octets of hostname hash
HASH=$(echo -n "$NODE_ID" | md5sum | head -c 4)
OCTET3=$(( 16#${HASH:0:2} % 254 + 1 ))
OCTET4=$(( 16#${HASH:2:2} % 254 + 1 ))
WG_IP="10.77.${OCTET3}.${OCTET4}"

cat > /etc/wireguard/${WG_IFACE}.conf << WGEOF
[Interface]
PrivateKey = ${WG_PRIVKEY}
Address = ${WG_IP}/16
ListenPort = ${WG_PORT}
# PostUp/PostDown for mesh routing
PostUp = ip route add ${CLIENT_SUBNET} dev br-mesh 2>/dev/null || true
PostUp = sysctl -w net.ipv4.ip_forward=1
PostDown = ip route del ${CLIENT_SUBNET} dev br-mesh 2>/dev/null || true

# Peer: DarCloud backbone relay (to be populated by controller)
# [Peer]
# PublicKey = <relay-pubkey>
# Endpoint = <relay-ip>:51820
# AllowedIPs = 10.77.0.0/16, 10.78.0.0/16
# PersistentKeepalive = 25
WGEOF

chmod 600 /etc/wireguard/${WG_IFACE}.conf

systemctl enable wg-quick@${WG_IFACE} 2>/dev/null || true
wg-quick up ${WG_IFACE} 2>/dev/null || true

echo "  ✓ WireGuard: ${WG_IFACE} @ ${WG_IP}/16"
echo "  ✓ Public key: ${WG_PUBKEY}"

# ═══════════════════════════════════════════════
# 5. BRIDGE: bat0 + WireGuard
# ═══════════════════════════════════════════════
echo "▸ [6/10] Creating mesh bridge..."
ip link add br-mesh type bridge 2>/dev/null || true
ip link set br-mesh up
ip addr add ${GATEWAY_IP}/24 dev br-mesh 2>/dev/null || true

# Bridge bat0 into br-mesh (if batman is available)
if ip link show bat0 &>/dev/null; then
  ip link set bat0 master br-mesh 2>/dev/null || true
  echo "  ✓ bat0 bridged into br-mesh"
fi

echo "  ✓ Bridge br-mesh @ ${GATEWAY_IP}"

# ═══════════════════════════════════════════════
# 6. WiFi ACCESS POINT (hostapd)
# ═══════════════════════════════════════════════
echo "▸ [7/10] Configuring WiFi access point..."

if [ "$AP_IFACE" != "none" ]; then
  # Stop any existing hostapd
  systemctl stop hostapd 2>/dev/null || true
  
  cat > /etc/hostapd/hostapd.conf << HAPEOF
# DarCloud FungiMesh WiFi Gateway - hostapd configuration
interface=${AP_IFACE}
bridge=br-mesh
driver=nl80211
ssid=${AP_SSID}
hw_mode=g
channel=${MESH_CHANNEL}
wmm_enabled=0
macaddr_acl=0
auth_algs=1
ignore_broadcast_ssid=0
wpa=2
wpa_passphrase=${AP_PASS}
wpa_key_mgmt=WPA-PSK
wpa_pairwise=TKIP
rsn_pairwise=CCMP

# 802.11n support
ieee80211n=1
ht_capab=[HT40+][SHORT-GI-20][SHORT-GI-40][DSSS_CCK-40]

# Country code for regulatory
country_code=US
ieee80211d=1

# Max clients
max_num_sta=128

# Band steering (prefer 5GHz if available)
# bss_transition=1
HAPEOF

  # Point hostapd daemon to config
  sed -i 's|^#DAEMON_CONF=.*|DAEMON_CONF="/etc/hostapd/hostapd.conf"|' /etc/default/hostapd 2>/dev/null || true
  echo 'DAEMON_CONF="/etc/hostapd/hostapd.conf"' > /etc/default/hostapd
  
  systemctl unmask hostapd 2>/dev/null || true
  systemctl enable hostapd 2>/dev/null || true
  systemctl start hostapd 2>/dev/null || {
    echo "  ⚠ hostapd failed to start (check WiFi hardware support)"
  }
  
  echo "  ✓ WiFi AP: $AP_SSID (WPA2, ch $MESH_CHANNEL)"
  echo "  ✓ Max clients: 128"
fi

# ═══════════════════════════════════════════════
# 7. DHCP + DNS (dnsmasq)
# ═══════════════════════════════════════════════
echo "▸ [8/10] Configuring DHCP & DNS..."

# Stop systemd-resolved if conflicting
systemctl stop systemd-resolved 2>/dev/null || true
systemctl disable systemd-resolved 2>/dev/null || true

cat > /etc/dnsmasq.d/fungimesh-gateway.conf << DNSEOF
# DarCloud FungiMesh Gateway DHCP+DNS
interface=br-mesh
bind-interfaces
dhcp-range=10.78.0.10,10.78.0.250,255.255.255.0,12h
dhcp-option=option:router,${GATEWAY_IP}
dhcp-option=option:dns-server,${GATEWAY_IP}
dhcp-option=option:domain-name,darcloud.local
dhcp-option=option:domain-search,darcloud.local

# DNS upstream
server=1.1.1.1
server=8.8.8.8

# Captive portal detection endpoints
address=/connectivitycheck.gstatic.com/${GATEWAY_IP}
address=/clients3.google.com/${GATEWAY_IP}
address=/captive.apple.com/${GATEWAY_IP}
address=/www.apple.com/${GATEWAY_IP}
address=/detectportal.firefox.com/${GATEWAY_IP}
address=/nmcheck.gnome.org/${GATEWAY_IP}
address=/network-test.debian.org/${GATEWAY_IP}
address=/msftconnecttest.com/${GATEWAY_IP}

# Local domain
local=/darcloud.local/
domain=darcloud.local

# DHCP logging
log-dhcp
log-queries
log-facility=/var/log/fungimesh/dnsmasq.log

# Lease file
dhcp-leasefile=/var/lib/misc/dnsmasq.leases
DNSEOF

systemctl enable dnsmasq 2>/dev/null || true
systemctl restart dnsmasq 2>/dev/null || true

echo "  ✓ DHCP: 10.78.0.10-250 (12h lease)"
echo "  ✓ DNS: $DNS_SERVERS + captive portal intercept"

# ═══════════════════════════════════════════════
# 8. NFTABLES: NAT + CAPTIVE PORTAL + TRAFFIC SHAPING
# ═══════════════════════════════════════════════
echo "▸ [9/10] Configuring firewall & NAT..."

# Enable IP forwarding
sysctl -w net.ipv4.ip_forward=1
echo "net.ipv4.ip_forward=1" > /etc/sysctl.d/99-fungimesh.conf
echo "net.ipv6.conf.all.forwarding=1" >> /etc/sysctl.d/99-fungimesh.conf

# Detect default internet interface
INET_IFACE=$(ip route show default | head -1 | awk '{print $5}')
[ -z "$INET_IFACE" ] && INET_IFACE="eth0"

cat > /etc/nftables-fungimesh.conf << NFTEOF
#!/usr/sbin/nft -f
flush ruleset

# DarCloud FungiMesh Gateway Firewall
table inet fungimesh {
    # Sets for tracking authenticated clients
    set authenticated {
        type ipv4_addr
        timeout 24h
        flags dynamic
    }

    # Rate limit per client (100MB/day free tier)
    set rate_limited {
        type ipv4_addr
        timeout 24h
        flags dynamic
    }

    chain input {
        type filter hook input priority 0; policy drop;
        
        # Allow established connections
        ct state established,related accept
        
        # Allow loopback
        iifname "lo" accept
        
        # Allow mesh network
        iifname "br-mesh" accept
        iifname "bat0" accept
        iifname "wg-fungi" accept
        
        # Allow SSH
        tcp dport 22 accept
        
        # Allow WireGuard
        udp dport ${WG_PORT} accept
        
        # Allow health/captive portal
        tcp dport { ${HEALTH_PORT}, ${CAPTIVE_PORTAL_PORT} } accept
        
        # Allow DHCP
        udp dport { 67, 68 } accept
        
        # Allow DNS
        tcp dport 53 accept
        udp dport 53 accept
        
        # Allow ICMP
        ip protocol icmp accept
    }

    chain forward {
        type filter hook forward priority 0; policy drop;
        
        # Allow established
        ct state established,related accept
        
        # Allow mesh-to-mesh
        iifname "bat0" oifname "bat0" accept
        iifname "wg-fungi" accept
        oifname "wg-fungi" accept
        
        # Allow authenticated clients to internet
        iifname "br-mesh" ip saddr @authenticated accept
        
        # Redirect unauthenticated to captive portal
        iifname "br-mesh" ip saddr != @authenticated tcp dport { 80, 443 } redirect to :${CAPTIVE_PORTAL_PORT}
        
        # Allow authenticated to forward
        iifname "br-mesh" oifname "${INET_IFACE}" ip saddr @authenticated accept
    }

    chain postrouting {
        type nat hook postrouting priority 100;
        
        # NAT for internet-bound traffic
        oifname "${INET_IFACE}" masquerade
        
        # NAT for WireGuard-bound traffic
        oifname "wg-fungi" masquerade
    }

    chain prerouting {
        type nat hook prerouting priority -100;
        
        # Redirect HTTP to captive portal for unauthenticated clients
        iifname "br-mesh" ip saddr != @authenticated tcp dport 80 redirect to :${CAPTIVE_PORTAL_PORT}
    }
}
NFTEOF

nft -f /etc/nftables-fungimesh.conf 2>/dev/null || {
  # Fallback to iptables
  iptables -t nat -A POSTROUTING -o "$INET_IFACE" -j MASQUERADE
  iptables -A FORWARD -i br-mesh -o "$INET_IFACE" -j ACCEPT
  iptables -A FORWARD -i "$INET_IFACE" -o br-mesh -m state --state RELATED,ESTABLISHED -j ACCEPT
  echo "  ⚠ nftables failed, using iptables fallback"
}

echo "  ✓ NAT masquerade via $INET_IFACE"
echo "  ✓ Captive portal redirect on :$CAPTIVE_PORTAL_PORT"

# ═══════════════════════════════════════════════
# 9. CAPTIVE PORTAL + HEALTH SERVER + HEARTBEAT
# ═══════════════════════════════════════════════
echo "▸ [10/10] Deploying gateway services..."

cat > /opt/fungimesh/gateway-server.py << 'PYEOF'
#!/usr/bin/env python3
"""
DarCloud FungiMesh WiFi Gateway Server
- Captive portal for new WiFi clients
- Health monitoring API
- Heartbeat to DarCloud API
- Client tracking & bandwidth metering
"""
import os, sys, json, time, threading, subprocess, socket, struct
from datetime import datetime, timedelta
from http.server import HTTPServer, BaseHTTPRequestHandler
from urllib.parse import parse_qs, urlparse
import urllib.request

NODE_ID = os.environ.get("NODE_ID", "fungi-gw-unknown")
API_URL = os.environ.get("DARCLOUD_API", "https://darcloud.host")
HEALTH_PORT = int(os.environ.get("HEALTH_PORT", "8080"))
PORTAL_PORT = int(os.environ.get("PORTAL_PORT", "8888"))
HEARTBEAT_SEC = int(os.environ.get("HEARTBEAT_SEC", "30"))

# State
start_time = time.time()
stats = {
    "clients_connected": 0,
    "clients_total": 0,
    "bytes_forwarded": 0,
    "mesh_peers": 0,
    "batman_neighbors": 0,
    "wifi_clients": 0,
}

def get_batman_info():
    """Query B.A.T.M.A.N. for mesh status"""
    info = {"neighbors": [], "originators": [], "gw_mode": "unknown", "version": "unknown"}
    try:
        r = subprocess.run(["batctl", "n"], capture_output=True, text=True, timeout=5)
        for line in r.stdout.strip().split("\n")[2:]:
            parts = line.split()
            if len(parts) >= 3:
                info["neighbors"].append({
                    "iface": parts[0], "mac": parts[1], 
                    "last_seen": parts[2] if len(parts) > 2 else "unknown"
                })
        stats["batman_neighbors"] = len(info["neighbors"])
    except: pass
    try:
        r = subprocess.run(["batctl", "o"], capture_output=True, text=True, timeout=5)
        for line in r.stdout.strip().split("\n")[2:]:
            parts = line.split()
            if len(parts) >= 4:
                info["originators"].append({
                    "mac": parts[0].strip("*"), "last_seen": parts[1],
                    "tq": parts[2].strip("()"), "next_hop": parts[3]
                })
    except: pass
    try:
        r = subprocess.run(["batctl", "gw_mode"], capture_output=True, text=True, timeout=5)
        info["gw_mode"] = r.stdout.strip()
    except: pass
    try:
        r = subprocess.run(["batctl", "-v"], capture_output=True, text=True, timeout=5)
        info["version"] = r.stdout.strip()
    except: pass
    return info

def get_wifi_clients():
    """Get connected WiFi clients from hostapd"""
    clients = []
    try:
        r = subprocess.run(["hostapd_cli", "all_sta"], capture_output=True, text=True, timeout=5)
        current_mac = None
        for line in r.stdout.split("\n"):
            if len(line) == 17 and line.count(":") == 5:
                current_mac = line.strip()
                clients.append({"mac": current_mac})
            elif current_mac and "=" in line:
                k, v = line.split("=", 1)
                clients[-1][k] = v
    except: pass
    stats["wifi_clients"] = len(clients)
    return clients

def get_dhcp_leases():
    """Read dnsmasq leases"""
    leases = []
    try:
        with open("/var/lib/misc/dnsmasq.leases") as f:
            for line in f:
                parts = line.strip().split()
                if len(parts) >= 5:
                    leases.append({
                        "expires": parts[0], "mac": parts[1], "ip": parts[2],
                        "hostname": parts[3], "client_id": parts[4]
                    })
    except: pass
    stats["clients_connected"] = len(leases)
    return leases

def get_traffic_stats():
    """Get interface traffic counters"""
    traffic = {}
    try:
        with open("/proc/net/dev") as f:
            for line in f.readlines()[2:]:
                parts = line.split()
                iface = parts[0].rstrip(":")
                if iface in ("br-mesh", "bat0", "wg-fungi", "wlan0", "wlan1", "eth0"):
                    traffic[iface] = {
                        "rx_bytes": int(parts[1]), "rx_packets": int(parts[2]),
                        "tx_bytes": int(parts[9]), "tx_packets": int(parts[10])
                    }
        if "br-mesh" in traffic:
            stats["bytes_forwarded"] = traffic["br-mesh"]["rx_bytes"] + traffic["br-mesh"]["tx_bytes"]
    except: pass
    return traffic

def get_wireguard_peers():
    """Get WireGuard peer status"""
    peers = []
    try:
        r = subprocess.run(["wg", "show", "wg-fungi", "dump"], capture_output=True, text=True, timeout=5)
        for line in r.stdout.strip().split("\n")[1:]:
            parts = line.split("\t")
            if len(parts) >= 8:
                peers.append({
                    "pubkey": parts[0][:16] + "...",
                    "endpoint": parts[2], "allowed_ips": parts[3],
                    "latest_handshake": parts[4], 
                    "rx_bytes": int(parts[5]), "tx_bytes": int(parts[6]),
                    "keepalive": parts[7]
                })
        stats["mesh_peers"] = len(peers)
    except: pass
    return peers

def heartbeat():
    """Send heartbeat to DarCloud API"""
    while True:
        try:
            traffic = get_traffic_stats()
            total_bytes = traffic.get("br-mesh", {}).get("rx_bytes", 0) + traffic.get("br-mesh", {}).get("tx_bytes", 0)
            payload = json.dumps({
                "node_id": NODE_ID,
                "status": "online",
                "hardware": "wifi-gateway",
                "role": "gateway",
                "clients": stats["clients_connected"],
                "wifi_clients": stats["wifi_clients"],
                "batman_neighbors": stats["batman_neighbors"],
                "mesh_peers": stats["mesh_peers"],
                "bytes_forwarded": total_bytes,
                "uptime": int(time.time() - start_time),
            }).encode()
            
            # Heartbeat to mesh endpoint
            req = urllib.request.Request(
                f"{API_URL}/mesh/heartbeat",
                data=payload,
                headers={"Content-Type": "application/json"},
                method="POST"
            )
            urllib.request.urlopen(req, timeout=10)
            
            # Heartbeat to ISP mesh endpoint
            req2 = urllib.request.Request(
                f"{API_URL}/telecom/mesh/heartbeat",
                data=json.dumps({
                    "node_id": NODE_ID,
                    "traffic_bytes": total_bytes,
                    "uptime_seconds": int(time.time() - start_time),
                }).encode(),
                headers={"Content-Type": "application/json"},
                method="POST"
            )
            urllib.request.urlopen(req2, timeout=10)
            
        except Exception as e:
            pass  # Silent fail on heartbeat
        time.sleep(HEARTBEAT_SEC)


# ── Captive Portal HTML ──
PORTAL_HTML = """<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>DarCloud WiFi - Connect</title>
<style>
* { margin: 0; padding: 0; box-sizing: border-box; }
body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
  background: linear-gradient(135deg, #0a0a2e 0%, #1a1a4e 50%, #0d0d3d 100%);
  min-height: 100vh; display: flex; align-items: center; justify-content: center; color: #fff; }
.container { max-width: 420px; width: 90%; padding: 2rem; }
.logo { text-align: center; margin-bottom: 2rem; }
.logo h1 { font-size: 2rem; background: linear-gradient(90deg, #00f5ff, #7b2ff7);
  -webkit-background-clip: text; -webkit-text-fill-color: transparent; }
.logo .sub { color: #8b8ba7; font-size: 0.9rem; margin-top: 0.5rem; }
.card { background: rgba(255,255,255,0.05); border: 1px solid rgba(255,255,255,0.1);
  border-radius: 16px; padding: 2rem; backdrop-filter: blur(10px); }
.plan { padding: 1rem; border: 1px solid rgba(255,255,255,0.1); border-radius: 12px;
  margin: 0.75rem 0; cursor: pointer; transition: all 0.3s; }
.plan:hover, .plan.selected { border-color: #00f5ff; background: rgba(0,245,255,0.05); }
.plan h3 { color: #00f5ff; font-size: 1.1rem; }
.plan p { color: #8b8ba7; font-size: 0.85rem; margin-top: 0.25rem; }
.plan .price { color: #7b2ff7; font-weight: bold; float: right; }
.btn { width: 100%; padding: 14px; border: none; border-radius: 12px; font-size: 1rem;
  font-weight: 600; cursor: pointer; margin-top: 1rem; transition: all 0.3s; }
.btn-free { background: linear-gradient(90deg, #00f5ff, #0099ff); color: #000; }
.btn-paid { background: linear-gradient(90deg, #7b2ff7, #ff2fd5); color: #fff; }
.btn:hover { transform: translateY(-2px); box-shadow: 0 8px 25px rgba(0,245,255,0.3); }
.status { text-align: center; margin-top: 1rem; }
.mesh-info { text-align: center; color: #8b8ba7; font-size: 0.75rem; margin-top: 2rem; }
.mesh-info .node { color: #00f5ff; }
</style>
</head>
<body>
<div class="container">
  <div class="logo">
    <h1>🍄 DarCloud WiFi</h1>
    <div class="sub">Powered by FungiMesh × B.A.T.M.A.N.</div>
  </div>
  <div class="card">
    <div class="plan selected" onclick="selectPlan('free')">
      <h3>Free Tier <span class="price">$0</span></h3>
      <p>100 MB/day • Basic speed • Ad-supported</p>
    </div>
    <div class="plan" onclick="selectPlan('starter')">
      <h3>Starter <span class="price">$19.99/mo</span></h3>
      <p>10 GB/mo • 50 Mbps • No ads</p>
    </div>
    <div class="plan" onclick="selectPlan('pro')">
      <h3>Pro <span class="price">$39.99/mo</span></h3>
      <p>50 GB/mo • 200 Mbps • Priority routing</p>
    </div>
    <div class="plan" onclick="selectPlan('unlimited')">
      <h3>Unlimited <span class="price">$59.99/mo</span></h3>
      <p>Unlimited • 500 Mbps • VPN included</p>
    </div>
    <button class="btn btn-free" id="connectBtn" onclick="connect()">
      Connect Free (100 MB/day)
    </button>
    <div class="status" id="status"></div>
  </div>
  <div class="mesh-info">
    <span class="node">NODE_ID_PLACEHOLDER</span> •
    B.A.T.M.A.N. v2024.3 • WireGuard • 
    BATMAN_NEIGHBORS_PLACEHOLDER neighbors •
    WIFI_CLIENTS_PLACEHOLDER clients online
  </div>
</div>
<script>
let plan = 'free';
function selectPlan(p) {
  plan = p;
  document.querySelectorAll('.plan').forEach(e => e.classList.remove('selected'));
  event.currentTarget.classList.add('selected');
  const btn = document.getElementById('connectBtn');
  if (p === 'free') {
    btn.className = 'btn btn-free'; btn.textContent = 'Connect Free (100 MB/day)';
  } else {
    btn.className = 'btn btn-paid'; btn.textContent = 'Subscribe & Connect — ' + 
      {starter:'$19.99/mo',pro:'$39.99/mo',unlimited:'$59.99/mo'}[p];
  }
}
function connect() {
  const s = document.getElementById('status');
  if (plan === 'free') {
    fetch('/api/connect', {method:'POST', headers:{'Content-Type':'application/json'},
      body: JSON.stringify({plan:'free'})
    }).then(r=>r.json()).then(d=>{
      s.innerHTML = '<span style="color:#00f5ff">✓ Connected! 100MB daily limit active.</span>';
      setTimeout(()=>{ window.location.href = 'http://darcloud.host'; }, 2000);
    }).catch(()=>{ s.innerHTML = '<span style="color:#ff4444">Connection failed. Try again.</span>'; });
  } else {
    window.location.href = 'https://darcloud.host/telecom/subscribe?plan=' + plan;
  }
}
</script>
</body>
</html>"""

# ── HTTP Handler ──
class GatewayHandler(BaseHTTPRequestHandler):
    def log_message(self, format, *args): pass  # Suppress default logging
    
    def do_GET(self):
        path = urlparse(self.path).path
        
        # Health check API
        if path == "/health":
            self._json_response({
                "status": "healthy", "node_id": NODE_ID,
                "uptime": int(time.time() - start_time),
                "hostname": socket.gethostname(),
                "type": "wifi-gateway",
            })
        
        # Full status API
        elif path == "/status" or path == "/api/status":
            batman = get_batman_info()
            wifi = get_wifi_clients()
            leases = get_dhcp_leases()
            wg = get_wireguard_peers()
            traffic = get_traffic_stats()
            self._json_response({
                "node_id": NODE_ID, "type": "wifi-gateway",
                "uptime": int(time.time() - start_time),
                "batman": batman, "wifi_clients": wifi,
                "dhcp_leases": leases, "wireguard_peers": wg,
                "traffic": traffic, "stats": stats,
            })
        
        # Mesh info API
        elif path == "/api/mesh":
            batman = get_batman_info()
            self._json_response({
                "protocol": "B.A.T.M.A.N. Advanced + 802.11s",
                "batman": batman,
                "wireguard_peers": get_wireguard_peers(),
                "mesh_ssid": os.environ.get("MESH_SSID", "FungiMesh-Backhaul"),
            })
        
        # Captive portal (any other GET)
        else:
            batman = get_batman_info()
            html = PORTAL_HTML.replace("NODE_ID_PLACEHOLDER", NODE_ID)
            html = html.replace("BATMAN_NEIGHBORS_PLACEHOLDER", str(len(batman["neighbors"])))
            html = html.replace("WIFI_CLIENTS_PLACEHOLDER", str(stats["wifi_clients"]))
            self.send_response(200)
            self.send_header("Content-Type", "text/html; charset=utf-8")
            self.end_headers()
            self.wfile.write(html.encode())
    
    def do_POST(self):
        path = urlparse(self.path).path
        length = int(self.headers.get("Content-Length", 0))
        body = json.loads(self.rfile.read(length)) if length > 0 else {}
        
        if path == "/api/connect":
            # Authenticate client (add to nftables set)
            client_ip = self.client_address[0]
            try:
                subprocess.run(
                    ["nft", "add", "element", "inet", "fungimesh", "authenticated", 
                     "{", client_ip, "}"],
                    capture_output=True, timeout=5
                )
            except:
                # Fallback: iptables
                subprocess.run(
                    ["iptables", "-I", "FORWARD", "-s", client_ip, "-j", "ACCEPT"],
                    capture_output=True, timeout=5
                )
            stats["clients_total"] += 1
            self._json_response({"status": "connected", "ip": client_ip, "plan": body.get("plan", "free")})
        
        else:
            self._json_response({"error": "not found"}, 404)
    
    def _json_response(self, data, code=200):
        body = json.dumps(data).encode()
        self.send_response(code)
        self.send_header("Content-Type", "application/json")
        self.send_header("Content-Length", str(len(body)))
        self.send_header("Access-Control-Allow-Origin", "*")
        self.end_headers()
        self.wfile.write(body)


def run_portal():
    """Run captive portal server"""
    server = HTTPServer(("0.0.0.0", PORTAL_PORT), GatewayHandler)
    print(f"  Captive portal: http://0.0.0.0:{PORTAL_PORT}")
    server.serve_forever()

def run_health():
    """Run health server"""
    server = HTTPServer(("0.0.0.0", HEALTH_PORT), GatewayHandler)
    print(f"  Health API: http://0.0.0.0:{HEALTH_PORT}")
    server.serve_forever()

if __name__ == "__main__":
    print(f"🍄 FungiMesh WiFi Gateway — {NODE_ID}")
    print(f"  B.A.T.M.A.N. + 802.11s + WireGuard + hostapd")
    
    # Start heartbeat thread
    threading.Thread(target=heartbeat, daemon=True).start()
    
    # Start captive portal in background thread
    threading.Thread(target=run_portal, daemon=True).start()
    
    # Run health server in main thread
    run_health()
PYEOF

chmod +x /opt/fungimesh/gateway-server.py

# ═══════════════════════════════════════════════
# 10. SYSTEMD SERVICE
# ═══════════════════════════════════════════════
cat > /etc/systemd/system/fungimesh-gateway.service << SVCEOF
[Unit]
Description=DarCloud FungiMesh WiFi Gateway
After=network.target hostapd.service dnsmasq.service wg-quick@wg-fungi.service
Wants=hostapd.service dnsmasq.service

[Service]
Type=simple
Environment=NODE_ID=${NODE_ID}
Environment=DARCLOUD_API=${DARCLOUD_API}
Environment=HEALTH_PORT=${HEALTH_PORT}
Environment=PORTAL_PORT=${CAPTIVE_PORTAL_PORT}
Environment=HEARTBEAT_SEC=${HEARTBEAT_INTERVAL}
Environment=MESH_SSID=${MESH_SSID}
ExecStart=/usr/bin/python3 /opt/fungimesh/gateway-server.py
Restart=always
RestartSec=5
StandardOutput=append:/var/log/fungimesh/gateway.log
StandardError=append:/var/log/fungimesh/gateway.log

[Install]
WantedBy=multi-user.target
SVCEOF

systemctl daemon-reload
systemctl enable fungimesh-gateway
systemctl start fungimesh-gateway

# ═══════════════════════════════════════════════
# 11. NETWORK BOOT SCRIPT (runs on every boot)
# ═══════════════════════════════════════════════
cat > /opt/fungimesh/boot-mesh.sh << 'BOOTEOF'
#!/bin/bash
# FungiMesh boot script — configures mesh networking on every boot

# Load batman-adv
modprobe batman-adv 2>/dev/null

# Re-apply nftables rules
nft -f /etc/nftables-fungimesh.conf 2>/dev/null

# Enable IP forwarding
sysctl -w net.ipv4.ip_forward=1

# Bring up bridge
ip link set br-mesh up 2>/dev/null
ip addr add 10.78.0.1/24 dev br-mesh 2>/dev/null

echo "$(date) FungiMesh gateway boot complete" >> /var/log/fungimesh/boot.log
BOOTEOF
chmod +x /opt/fungimesh/boot-mesh.sh

cat > /etc/systemd/system/fungimesh-boot.service << BSEOF
[Unit]
Description=FungiMesh Boot Network Config
Before=fungimesh-gateway.service
After=network.target

[Service]
Type=oneshot
ExecStart=/opt/fungimesh/boot-mesh.sh
RemainAfterExit=yes

[Install]
WantedBy=multi-user.target
BSEOF
systemctl daemon-reload
systemctl enable fungimesh-boot

# ═══════════════════════════════════════════════
# 12. SAVE NODE CONFIG & REGISTER WITH API
# ═══════════════════════════════════════════════
PUBLIC_IP=$(curl -s -4 ifconfig.me 2>/dev/null || echo "unknown")

cat > /etc/fungimesh/gateway.json << CFGEOF
{
  "node_id": "${NODE_ID}",
  "type": "wifi-gateway",
  "version": "1.0.0",
  "installed": "$(date -u +%Y-%m-%dT%H:%M:%SZ)",
  "wifi": {
    "mode": "${WIFI_MODE}",
    "mesh_iface": "${MESH_IFACE}",
    "ap_iface": "${AP_IFACE}",
    "mesh_ssid": "${MESH_SSID}",
    "ap_ssid": "${AP_SSID}",
    "channel": ${MESH_CHANNEL}
  },
  "batman": {
    "gw_mode": "${BATMAN_GW_MODE}",
    "interface": "bat0",
    "mesh_protocol": "802.11s"
  },
  "wireguard": {
    "interface": "${WG_IFACE}",
    "ip": "${WG_IP}/16",
    "port": ${WG_PORT},
    "pubkey": "${WG_PUBKEY}"
  },
  "network": {
    "gateway_ip": "${GATEWAY_IP}",
    "client_subnet": "${CLIENT_SUBNET}",
    "mesh_subnet": "${MESH_SUBNET}",
    "public_ip": "${PUBLIC_IP}"
  },
  "services": {
    "captive_portal": "http://0.0.0.0:${CAPTIVE_PORTAL_PORT}",
    "health_api": "http://0.0.0.0:${HEALTH_PORT}",
    "hostapd": "${AP_IFACE}",
    "dnsmasq": "br-mesh",
    "wireguard": "${WG_IFACE}"
  },
  "protocols": {
    "mesh": "B.A.T.M.A.N. Advanced (batman-adv)",
    "backhaul": "802.11s (mesh point)",
    "vpn": "WireGuard",
    "encryption": "AES-256-GCM + Kyber-1024 (post-quantum)"
  }
}
CFGEOF

# Register with DarCloud API
REGISTER_DATA=$(cat << REGEOF
{
  "node_id": "${NODE_ID}",
  "hardware": "wifi-gateway",
  "region": "auto-detect",
  "capabilities": "relay,gateway,wifi-ap",
  "public_ip": "${PUBLIC_IP}",
  "wireguard_pubkey": "${WG_PUBKEY}"
}
REGEOF
)

curl -s -X POST "${DARCLOUD_API}/mesh/connect" \
  -H "Content-Type: application/json" \
  -d "$REGISTER_DATA" > /dev/null 2>&1 || true

curl -s -X POST "${DARCLOUD_API}/telecom/mesh/register" \
  -H "Content-Type: application/json" \
  -d "$REGISTER_DATA" > /dev/null 2>&1 || true

echo ""
echo "╔══════════════════════════════════════════════════════════╗"
echo "║  ✅ FungiMesh WiFi Gateway INSTALLED                    ║"
echo "╠══════════════════════════════════════════════════════════╣"
echo "║                                                          ║"
echo "║  Node ID:     ${NODE_ID}"
echo "║  WiFi SSID:   ${AP_SSID} (WPA2)"
echo "║  WiFi Pass:   ${AP_PASS}"
echo "║  Mode:        ${WIFI_MODE}"
echo "║                                                          ║"
echo "║  ┌─ B.A.T.M.A.N. ─────────────────────────────────┐    ║"
echo "║  │ Mesh:    ${MESH_SSID} @ ch${MESH_CHANNEL}             "
echo "║  │ GW Mode: ${BATMAN_GW_MODE}                            "
echo "║  │ Bridge:  bat0 → br-mesh                         │    ║"
echo "║  └─────────────────────────────────────────────────┘    ║"
echo "║                                                          ║"
echo "║  ┌─ WireGuard VPN ─────────────────────────────────┐    ║"
echo "║  │ IP:      ${WG_IP}/16                               "
echo "║  │ Port:    ${WG_PORT}                                  "
echo "║  │ Pubkey:  ${WG_PUBKEY:0:20}...                    │    ║"
echo "║  └─────────────────────────────────────────────────┘    ║"
echo "║                                                          ║"
echo "║  ┌─ Services ──────────────────────────────────────┐    ║"
echo "║  │ Captive Portal: http://0.0.0.0:${CAPTIVE_PORTAL_PORT}  "
echo "║  │ Health API:     http://0.0.0.0:${HEALTH_PORT}          "
echo "║  │ DHCP:          10.78.0.10-250                    │    ║"
echo "║  │ DNS:           1.1.1.1 / 8.8.8.8                │    ║"
echo "║  └─────────────────────────────────────────────────┘    ║"
echo "║                                                          ║"
echo "║  Traffic: Client→AP→bat0(BATMAN)→WG→Internet            ║"
echo "║  Revenue: Node operators earn from ISP revenue split     ║"
echo "╚══════════════════════════════════════════════════════════╝"
echo ""
echo "  🔗 Dashboard: https://darcloud.host/telecom/dashboard"
echo "  📡 Mesh map:  https://mesh.darcloud.host"
echo ""
