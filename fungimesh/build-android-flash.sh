#!/bin/bash
##############################################################################
# DarCloud MeshTalk OS — Build Flashable ZIP
# Packages everything into a TWRP-flashable ZIP
# Run from: /workspaces/quranchain1/
##############################################################################

set -e

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
BUILD_DIR="$SCRIPT_DIR/android-flash"
OUTPUT="$SCRIPT_DIR/DarCloud-MeshTalk-OS-v1.0.zip"

echo "╔══════════════════════════════════════════╗"
echo "║  Building DarCloud MeshTalk OS Flash ZIP ║"
echo "╚══════════════════════════════════════════╝"
echo ""

# Verify structure
if [ ! -f "$BUILD_DIR/META-INF/com/google/android/update-binary" ]; then
    echo "ERROR: Missing META-INF/com/google/android/update-binary"
    exit 1
fi

# Set permissions
echo "[1/4] Setting file permissions..."
chmod 755 "$BUILD_DIR/META-INF/com/google/android/update-binary"
chmod 755 "$BUILD_DIR/system/darcloud/bin/"*
chmod 644 "$BUILD_DIR/system/darcloud/etc/"*
chmod 644 "$BUILD_DIR/system/etc/init/"*.rc

# Verify all required files
echo "[2/4] Verifying package contents..."
REQUIRED_FILES=(
    "META-INF/com/google/android/update-binary"
    "META-INF/com/google/android/updater-script"
    "system/darcloud/bin/darcloud-register"
    "system/darcloud/bin/darcloud-meshnode"
    "system/darcloud/bin/darcloud-discovery"
    "system/darcloud/bin/darcloud-gateway"
    "system/darcloud/bin/darcloud-meshtalk"
    "system/darcloud/bin/darcloud-telecom"
    "system/darcloud/bin/darcloud-esim"
    "system/darcloud/bin/darcloud-voice"
    "system/darcloud/bin/darcloud-messaging"
    "system/darcloud/bin/darcloud-5g-modem"
    "system/darcloud/bin/darcloud-ctl"
    "system/darcloud/etc/darcloud.conf"
    "system/etc/init/darcloud-meshnode.rc"
    "system/etc/init/darcloud-discovery.rc"
    "system/etc/init/darcloud-gateway.rc"
    "system/etc/init/darcloud-meshtalk.rc"
    "system/etc/init/darcloud-telecom.rc"
    "system/etc/init/darcloud-esim.rc"
    "system/etc/init/darcloud-voice.rc"
    "system/etc/init/darcloud-messaging.rc"
    "system/etc/init/darcloud-5g-modem.rc"
    "system/darcloud/bin/darcloud-tunnel"
    "system/etc/init/darcloud-tunnel.rc"
)

MISSING=0
for f in "${REQUIRED_FILES[@]}"; do
    if [ ! -f "$BUILD_DIR/$f" ]; then
        echo "  MISSING: $f"
        MISSING=$((MISSING + 1))
    fi
done

if [ "$MISSING" -gt 0 ]; then
    echo "ERROR: $MISSING required files missing!"
    exit 1
fi
echo "  All ${#REQUIRED_FILES[@]} files present"

# Build ZIP
echo "[3/4] Creating flashable ZIP..."
rm -f "$OUTPUT"
cd "$BUILD_DIR"
zip -r "$OUTPUT" \
    META-INF/ \
    system/ \
    -x "*.DS_Store" -x "__MACOSX/*"
cd -

# Show result
echo "[4/4] Build complete!"
echo ""
SIZE=$(du -h "$OUTPUT" | cut -f1)
echo "╔══════════════════════════════════════════╗"
echo "║  Output: DarCloud-MeshTalk-OS-v1.0.zip  ║"
echo "║  Size: $SIZE                              "
echo "║                                          ║"
echo "║  Flash via TWRP Recovery:                ║"
echo "║  1. Boot into TWRP                       ║"
echo "║  2. Install > select ZIP                 ║"
echo "║  3. Swipe to flash                       ║"
echo "║  4. Reboot                               ║"
echo "║                                          ║"
echo "║  Or via ADB sideload:                    ║"
echo "║  adb sideload $OUTPUT                    ║"
echo "╚══════════════════════════════════════════╝"

echo ""
echo "Services installed:"
echo "  1. 5G Modem Manager — NR/SA data + band selection"
echo "  2. eSIM Provisioner — LPA + APN + VoLTE/VoWiFi"
echo "  3. FungiMesh Node   — WireGuard mesh routing"
echo "  4. Discovery Node   — ARP/WiFi/BT/Cell scanning"
echo "  5. WiFi Gateway     — AP + captive portal"
echo "  6. MeshTalk         — P2P voice/text relay"
echo "  7. Telecom          — Cell tower relay + DNS"
echo "  8. Voice Calls      — SIP/VoIP/VoLTE/VoNR"
echo "  9. Messaging        — SMS/MMS/RCS gateway"
echo ""
echo "All 9 services auto-start on boot via Android init."
