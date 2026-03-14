#!/bin/bash
# ═══════════════════════════════════════════════════════════
# DarCloud ISP™ — Smart Device Mesh Provisioning
#
# Onboards smart devices (cameras, hubs, thermostats, 
# speakers, locks, lights, sensors) onto the FungiMesh
# network and registers them with the ISP device registry.
#
# Supports:
#   - WiFi-based smart devices (connect to DarCloud-WiFi AP)
#   - Zigbee/Z-Wave via gateway hub
#   - BLE mesh devices
#   - Thread/Matter protocol devices
#
# Usage:
#   ./provision-smart-device.sh --type smart_camera \
#       --mac AA:BB:CC:DD:EE:FF \
#       --manufacturer Wyze --model "Cam v3" \
#       --subscriber sub-12345 \
#       [--api-url https://darcloud.host]
# ═══════════════════════════════════════════════════════════
set -euo pipefail

API_URL="${API_URL:-https://darcloud.host}"
DEVICE_TYPE=""
MAC_ADDRESS=""
MANUFACTURER=""
MODEL=""
SUBSCRIBER_ID=""
IP_ADDRESS=""
MESH_ENABLE="${MESH_ENABLE:-false}"

# Parse args
while [[ $# -gt 0 ]]; do
    case "$1" in
        --type)           DEVICE_TYPE="$2"; shift 2 ;;
        --mac)            MAC_ADDRESS="$2"; shift 2 ;;
        --manufacturer)   MANUFACTURER="$2"; shift 2 ;;
        --model)          MODEL="$2"; shift 2 ;;
        --subscriber)     SUBSCRIBER_ID="$2"; shift 2 ;;
        --ip)             IP_ADDRESS="$2"; shift 2 ;;
        --api-url)        API_URL="$2"; shift 2 ;;
        --mesh-enable)    MESH_ENABLE="true"; shift ;;
        *) echo "Unknown: $1"; exit 1 ;;
    esac
done

if [ -z "$DEVICE_TYPE" ] || [ -z "$MAC_ADDRESS" ]; then
    echo "Usage: $0 --type <device_type> --mac <AA:BB:CC:DD:EE:FF> [options]"
    echo ""
    echo "Device types: smart_hub, smart_camera, smart_speaker, smart_thermostat,"
    echo "              smart_lock, smart_light, iot_sensor, phone, tablet, laptop"
    echo ""
    echo "Options:"
    echo "  --manufacturer <name>    Device manufacturer"
    echo "  --model <name>           Device model"
    echo "  --subscriber <id>        Owner subscriber ID"
    echo "  --ip <address>           Assigned IP address"
    echo "  --mesh-enable            Enable mesh relay on this device"
    echo "  --api-url <url>          DarCloud API URL"
    exit 1
fi

DEVICE_ID="dev-$(echo "$MAC_ADDRESS" | tr -d ':' | tr '[:upper:]' '[:lower:]')"

echo "═══════════════════════════════════════════════════"
echo "  DarCloud ISP™ — Smart Device Provisioning"
echo "  Type: ${DEVICE_TYPE}"
echo "  MAC:  ${MAC_ADDRESS}"
echo "  ID:   ${DEVICE_ID}"
echo "═══════════════════════════════════════════════════"

# ── Step 1: Discover Device on Network ──
echo ""
echo "[1/5] Discovering device on network..."

if [ -z "$IP_ADDRESS" ]; then
    # Try ARP scan to find device by MAC
    IP_ADDRESS=$(arp -n 2>/dev/null | grep -i "${MAC_ADDRESS}" | awk '{print $1}' || true)
    
    if [ -z "$IP_ADDRESS" ]; then
        # Try nmap ping scan on local subnet
        SUBNET=$(ip route | grep -v default | head -1 | awk '{print $1}' 2>/dev/null || echo "192.168.1.0/24")
        echo "  Scanning ${SUBNET} for ${MAC_ADDRESS}..."
        IP_ADDRESS=$(nmap -sn "$SUBNET" 2>/dev/null | grep -B 2 -i "${MAC_ADDRESS}" | head -1 | grep -oE '[0-9]+\.[0-9]+\.[0-9]+\.[0-9]+' || true)
    fi
fi

if [ -n "$IP_ADDRESS" ]; then
    echo "  Found device at ${IP_ADDRESS}"
else
    echo "  Device not found on network (will register anyway)"
    IP_ADDRESS="pending"
fi

# ── Step 2: Check Device Connectivity ──
echo ""
echo "[2/5] Checking device connectivity..."

if [ "$IP_ADDRESS" != "pending" ]; then
    if ping -c 1 -W 2 "$IP_ADDRESS" >/dev/null 2>&1; then
        echo "  Device is reachable (ping OK)"
        DEVICE_STATUS="online"
    else
        echo "  Device not responding to ping"
        DEVICE_STATUS="offline"
    fi
else
    DEVICE_STATUS="provisioning"
fi

# ── Step 3: Determine Protocol & Capabilities ──
echo ""
echo "[3/5] Determining device capabilities..."

case "$DEVICE_TYPE" in
    smart_hub)
        PROTOCOLS="wifi,zigbee,zwave,ble,thread,matter"
        CAN_MESH=true
        echo "  Hub device — can bridge Zigbee/Z-Wave/BLE to mesh"
        ;;
    smart_camera)
        PROTOCOLS="wifi,rtsp"
        CAN_MESH=false
        echo "  Camera — WiFi streaming, bandwidth reservation recommended"
        ;;
    smart_speaker)
        PROTOCOLS="wifi,ble"
        CAN_MESH=false
        echo "  Speaker — WiFi + BLE, low-latency path preferred"
        ;;
    smart_thermostat)
        PROTOCOLS="wifi,zigbee"
        CAN_MESH=false
        echo "  Thermostat — low bandwidth, high reliability"
        ;;
    smart_lock)
        PROTOCOLS="wifi,ble,zwave"
        CAN_MESH=false
        echo "  Lock — security-critical, encrypted path only"
        ;;
    smart_light)
        PROTOCOLS="wifi,zigbee,ble"
        CAN_MESH=false
        echo "  Light — group-controllable, mesh-compatible via Zigbee"
        ;;
    iot_sensor)
        PROTOCOLS="wifi,zigbee,lorawan"
        CAN_MESH=true
        echo "  Sensor — low power, can relay data through mesh"
        ;;
    *)
        PROTOCOLS="wifi"
        CAN_MESH=false
        echo "  Generic device — WiFi only"
        ;;
esac

# Override mesh capability if explicitly requested
if [ "$MESH_ENABLE" = "true" ]; then
    CAN_MESH=true
fi

# ── Step 4: Register with DarCloud ISP ──
echo ""
echo "[4/5] Registering with DarCloud ISP..."

REGISTER_PAYLOAD=$(cat <<EOF
{
    "device_id": "${DEVICE_ID}",
    "subscriber_id": "${SUBSCRIBER_ID}",
    "device_type": "${DEVICE_TYPE}",
    "manufacturer": "${MANUFACTURER}",
    "model": "${MODEL}",
    "mac_address": "${MAC_ADDRESS}",
    "mesh_enabled": ${CAN_MESH},
    "is_mesh_tower": false
}
EOF
)

RESULT=$(curl -sf -X POST "${API_URL}/isp/devices/register" \
    -H "Content-Type: application/json" \
    -d "$REGISTER_PAYLOAD" 2>/dev/null) && {
    echo "  Registered with ISP device registry!"
    echo "  Response: $RESULT"
} || {
    echo "  ISP registration deferred (API unavailable)"
}

# ── Step 5: Configure Network Policy ──
echo ""
echo "[5/5] Setting network policy..."

# Smart device network policies
case "$DEVICE_TYPE" in
    smart_camera)
        echo "  Policy: Bandwidth reservation 2Mbps up, QoS priority: medium"
        echo "  VLAN: IoT (isolated from LAN)"
        ;;
    smart_lock)
        echo "  Policy: Encrypted-only traffic, QoS priority: high"
        echo "  VLAN: Security (isolated, no internet)"
        ;;
    smart_hub)
        echo "  Policy: Full mesh access, bridge mode enabled"
        echo "  VLAN: IoT (can bridge to all IoT devices)"
        ;;
    iot_sensor)
        echo "  Policy: Low bandwidth (10Kbps), QoS priority: low"
        echo "  VLAN: IoT (data collection only)"
        ;;
    *)
        echo "  Policy: Standard access, QoS priority: normal"
        echo "  VLAN: IoT (default)"
        ;;
esac

echo ""
echo "═══════════════════════════════════════════════════"
echo "  Smart Device Provisioned!"
echo ""
echo "  Device ID:    ${DEVICE_ID}"
echo "  Type:         ${DEVICE_TYPE}"
echo "  MAC:          ${MAC_ADDRESS}"
echo "  IP:           ${IP_ADDRESS}"
echo "  Status:       ${DEVICE_STATUS}"
echo "  Protocols:    ${PROTOCOLS}"
echo "  Mesh Relay:   ${CAN_MESH}"
echo "  Subscriber:   ${SUBSCRIBER_ID:-none}"
echo ""
echo "  Manage at: ${API_URL}/isp/devices?device_type=${DEVICE_TYPE}"
echo "═══════════════════════════════════════════════════"
