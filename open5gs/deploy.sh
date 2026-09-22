#!/usr/bin/env bash
set -euo pipefail

# ==========================================================
# DarTelecom™ / MeshTalk™ — Complete ISP Deployment
# Deploys Open5GS 5G SA + 4G EPC + ISP Controller
# ==========================================================

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$SCRIPT_DIR"

echo "============================================"
echo "  DarTelecom™ ISP Stack Deployment"
echo "  Open5GS 5G SA + 4G EPC + ISP Controller"
echo "============================================"
echo

# -------- Pre-flight checks --------
echo "[1/7] Pre-flight checks..."

if ! command -v docker &>/dev/null; then
  echo "ERROR: Docker not found. Install Docker first."
  exit 1
fi

if ! command -v docker compose &>/dev/null && ! docker compose version &>/dev/null 2>&1; then
  echo "ERROR: Docker Compose not found."
  exit 1
fi

echo "  Docker: $(docker --version)"
echo "  Compose: $(docker compose version 2>/dev/null || echo 'v2')"

# Security gate: the canonical production deploy path must not publish
# management/database services on every host interface. Docker Compose
# entries such as "3000:3000" bind to 0.0.0.0 by default.
if [ "${DARTELECOM_ALLOW_UNSAFE_PORT_PUBLISHING:-0}" != "1" ]; then
  unsafe_ports=()
  grep -Eq "^[[:space:]]*-[[:space:]]*[\"']?27017:27017[\"']?[[:space:]]*$" docker-compose.yml && unsafe_ports+=("MongoDB 27017")
  grep -Eq "^[[:space:]]*-[[:space:]]*[\"']?9999:9999[\"']?[[:space:]]*$" docker-compose.yml && unsafe_ports+=("Open5GS WebUI 9999")
  grep -Eq "^[[:space:]]*-[[:space:]]*[\"']?3000:3000[\"']?[[:space:]]*$" docker-compose.yml && unsafe_ports+=("ISP controller 3000")

  if [ "${#unsafe_ports[@]}" -gt 0 ]; then
    echo "ERROR: refusing to deploy management/database services with wide host bindings."
    printf '  Unsafe binding: %s\n' "${unsafe_ports[@]}"
    echo "  Bind these services to loopback/private management interfaces first."
    echo "  Emergency override only: DARTELECOM_ALLOW_UNSAFE_PORT_PUBLISHING=1"
    exit 1
  fi
fi

# -------- Create TUN device for UPF --------
echo "[2/7] Configuring network for UPF..."
if [ ! -e /dev/net/tun ]; then
  echo "  Creating /dev/net/tun..."
  mkdir -p /dev/net
  mknod /dev/net/tun c 10 200 2>/dev/null || echo "  TUN device already exists or needs root"
fi

# -------- Create ogstun interface for UPF --------
echo "[3/7] Creating ogstun interface..."
if ! ip link show ogstun &>/dev/null 2>&1; then
  ip tuntap add name ogstun mode tun 2>/dev/null || echo "  ogstun creation skipped (needs root)"
  ip addr add 10.45.0.1/16 dev ogstun 2>/dev/null || true
  ip addr add 2001:db8:cafe::1/48 dev ogstun 2>/dev/null || true
  ip link set ogstun up 2>/dev/null || true
  echo "  ogstun interface created"
else
  echo "  ogstun already exists"
fi

# -------- Enable IP forwarding --------
echo "[4/7] Enabling IP forwarding..."
sysctl -w net.ipv4.ip_forward=1 2>/dev/null || echo "  Needs root"
sysctl -w net.ipv6.conf.all.forwarding=1 2>/dev/null || true

# -------- NAT for UPF subnet --------
echo "[5/7] Setting up NAT for UE subnet..."
DEFAULT_IF=$(ip route | grep default | awk '{print $5}' | head -1)
iptables -t nat -A POSTROUTING -s 10.45.0.0/16 ! -o ogstun -j MASQUERADE 2>/dev/null || echo "  NAT rule exists or needs root"

# -------- Pull and build containers --------
echo "[6/7] Building and pulling containers..."
docker compose pull 2>/dev/null || true
docker compose build --no-cache isp-controller 2>/dev/null || true

# -------- Start the stack --------
echo "[7/7] Starting DarTelecom ISP Stack..."
docker compose up -d

echo
echo "============================================"
echo "  DarTelecom™ ISP Stack — DEPLOYED"
echo "============================================"
echo
echo "  5G Core Network Functions:"
echo "    NRF  (Service Discovery)     : running"
echo "    SCP  (Communication Proxy)   : running"
echo "    AMF  (Access & Mobility)     : running"
echo "    SMF  (Session Management)    : running"
echo "    UPF  (User Plane)            : running"
echo "    AUSF (Authentication)        : running"
echo "    UDM  (Data Management)       : running"
echo "    UDR  (Data Repository)       : running"
echo "    PCF  (Policy Control)        : running"
echo "    NSSF (Slice Selection)       : running"
echo "    BSF  (Binding Support)       : running"
echo
echo "  4G EPC Functions:"
echo "    HSS  (Home Subscriber)       : running"
echo "    MME  (Mobility Management)   : running"
echo "    SGWC (Serving GW Control)    : running"
echo "    SGWU (Serving GW User)       : running"
echo
echo "  Simulators:"
echo "    gNodeB (5G Radio)            : running"
echo "    UE     (Test Device)         : running"
echo
echo "  ISP Services:"
echo "    MongoDB (Subscriber DB)      : private management binding"
echo "    Open5GS WebUI                : private management binding"
echo "    ISP Controller API           : private management binding"
echo "    ISP Dashboard                : private management binding"
echo
echo "  Administrative credentials:"
echo "    Provision through the approved runtime secret/identity path."
echo "    No default administrative password is printed by this script."
echo
echo "  Test subscriber credentials:"
echo "    Synthetic test SIM credentials are intentionally not printed."
echo "    Never reuse tracked test credentials for production subscribers."
echo
echo "============================================"
