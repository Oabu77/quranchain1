#!/bin/bash
##############################################################################
# DarCloud MeshTalk OS — Samsung Flash Guide (Heimdall / TWRP)
# Flash from Chromebook Linux terminal to Samsung phone in Odin/Download Mode
##############################################################################

set -e

echo "╔══════════════════════════════════════════════════════════╗"
echo "║   DarCloud MeshTalk OS — Samsung Flash Utility          ║"
echo "║   Bismillah — Flash your Samsung with MeshTalk OS       ║"
echo "╚══════════════════════════════════════════════════════════╝"
echo ""

# --- Step 1: Install Heimdall (open-source Odin alternative) ---
install_heimdall() {
    echo "[STEP 1] Installing Heimdall (Samsung flash tool for Linux)..."
    if command -v heimdall > /dev/null 2>&1; then
        echo "  Heimdall already installed: $(heimdall version 2>&1 | head -1)"
        return 0
    fi

    sudo apt-get update
    sudo apt-get install -y heimdall-flash adb
    echo "  Heimdall installed successfully"
}

# --- Step 2: Detect phone ---
detect_phone() {
    echo ""
    echo "[STEP 2] Detecting Samsung phone..."
    echo "  Make sure your phone is in DOWNLOAD/ODIN MODE:"
    echo "    - Power off the phone"
    echo "    - Hold Volume Down + Power (or Volume Down + Bixby + Power)"
    echo "    - Connect USB cable"
    echo ""

    # Check if device is detected
    if lsusb 2>/dev/null | grep -qi "samsung"; then
        echo "  ✓ Samsung device detected via USB!"
        lsusb | grep -i samsung
    else
        echo "  Checking Heimdall..."
        if heimdall detect 2>/dev/null; then
            echo "  ✓ Samsung device detected by Heimdall!"
        else
            echo "  ✗ No Samsung device found."
            echo ""
            echo "  Troubleshooting:"
            echo "    1. Is the phone in Download/Odin mode? (blue screen)"
            echo "    2. Is the USB cable connected?"
            echo "    3. On Chromebook: Settings > Linux > USB Devices > enable Samsung"
            echo "    4. Try: sudo chmod 666 /dev/bus/usb/*/*"
            echo ""
            return 1
        fi
    fi
}

# --- Step 3: Flash TWRP Recovery ---
flash_twrp() {
    echo ""
    echo "[STEP 3] Flashing TWRP Custom Recovery..."
    echo ""
    echo "  You need the TWRP image for your SPECIFIC Samsung model."
    echo "  Download from: https://twrp.me/Devices/Samsung/"
    echo ""

    read -p "  Enter path to TWRP recovery image (.img): " TWRP_IMG

    if [ ! -f "$TWRP_IMG" ]; then
        echo "  ERROR: File not found: $TWRP_IMG"
        return 1
    fi

    echo "  Flashing TWRP to recovery partition..."
    echo "  WARNING: This replaces Samsung's stock recovery!"
    echo ""
    read -p "  Continue? (yes/no): " CONFIRM
    if [ "$CONFIRM" != "yes" ]; then
        echo "  Aborted."
        return 1
    fi

    sudo heimdall flash --RECOVERY "$TWRP_IMG" --no-reboot
    echo ""
    echo "  ✓ TWRP flashed successfully!"
    echo ""
    echo "  NOW: Boot into TWRP Recovery:"
    echo "    - Disconnect USB"
    echo "    - Hold Volume Up + Power (or Volume Up + Bixby + Power)"
    echo "    - When Samsung logo appears, release Power but keep Volume Up"
    echo "    - TWRP should appear"
    echo ""
}

# --- Step 4: Flash DarCloud MeshTalk OS ---
flash_darcloud() {
    echo ""
    echo "[STEP 4] Flashing DarCloud MeshTalk OS..."
    echo ""

    FLASH_ZIP="$(dirname "$0")/DarCloud-MeshTalk-OS-v1.0.zip"

    if [ ! -f "$FLASH_ZIP" ]; then
        echo "  Building flash ZIP first..."
        bash "$(dirname "$0")/build-android-flash.sh"
    fi

    echo "  Flash ZIP ready: $FLASH_ZIP"
    echo ""
    echo "  Choose flash method:"
    echo "    1) ADB Sideload (phone must be in TWRP)"
    echo "    2) Copy to phone storage (then flash from TWRP)"
    echo ""
    read -p "  Enter choice (1 or 2): " METHOD

    case "$METHOD" in
        1)
            echo ""
            echo "  In TWRP: go to Advanced > ADB Sideload > Swipe to start"
            read -p "  Ready? (press Enter)"
            adb sideload "$FLASH_ZIP"
            echo ""
            echo "  ✓ DarCloud MeshTalk OS flashed via ADB sideload!"
            ;;
        2)
            echo ""
            echo "  Pushing ZIP to phone storage..."
            adb push "$FLASH_ZIP" /sdcard/
            echo ""
            echo "  ✓ ZIP copied to /sdcard/"
            echo "  In TWRP: Install > select DarCloud-MeshTalk-OS-v1.0.zip > Swipe to flash"
            ;;
        *)
            echo "  Invalid choice"
            return 1
            ;;
    esac
}

# --- Step 5: Post-flash verification ---
verify_flash() {
    echo ""
    echo "[STEP 5] Post-flash verification..."
    echo ""
    echo "  After rebooting, verify services are running:"
    echo ""
    echo "  adb shell /system/darcloud/bin/darcloud-ctl status"
    echo ""
    echo "  Or check the health API:"
    echo "  curl http://<phone-ip>:8080"
    echo ""
    echo "  Services that should be running:"
    echo "    ● darcloud_meshnode  — WireGuard mesh routing"
    echo "    ● darcloud_discovery — Network scanning"
    echo "    ● darcloud_gateway   — WiFi AP + captive portal"
    echo "    ● darcloud_meshtalk  — P2P voice/text"
    echo "    ● darcloud_telecom   — Cell tower relay"
    echo ""
}

# --- Main menu ---
echo "What do you want to do?"
echo ""
echo "  1) Full flash (install Heimdall + TWRP + DarCloud MeshTalk OS)"
echo "  2) Flash TWRP only (recovery already prepared)"
echo "  3) Flash DarCloud OS only (TWRP already installed)"
echo "  4) Just build the flash ZIP"
echo "  5) Check if phone is detected"
echo ""
read -p "Enter choice (1-5): " CHOICE

case "$CHOICE" in
    1)
        install_heimdall
        detect_phone
        flash_twrp
        echo "  Boot into TWRP now, then run this script again with option 3"
        ;;
    2)
        detect_phone
        flash_twrp
        ;;
    3)
        flash_darcloud
        verify_flash
        ;;
    4)
        bash "$(dirname "$0")/build-android-flash.sh"
        ;;
    5)
        install_heimdall
        detect_phone
        ;;
    *)
        echo "Invalid choice"
        exit 1
        ;;
esac

echo ""
echo "╔══════════════════════════════════════════════════════════╗"
echo "║   DarCloud MeshTalk OS — Flash Complete                 ║"
echo "║   Your Samsung is now a sovereign mesh supernode.       ║"
echo "╚══════════════════════════════════════════════════════════╝"
