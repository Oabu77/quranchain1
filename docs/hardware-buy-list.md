# DarCloud ISP™ — Hardware Expansion Buy List
## Turn any router/device into a DarCloud mesh tower

---

## TIER 1: Budget Mesh Nodes ($25–$80)
> Best for filling gaps, indoor coverage, and neighbors who want to host a node

| Device | Price | Why | Flash? |
|--------|-------|-----|--------|
| **GL.iNet GL-MT3000 (Beryl AX)** | $79 | WiFi 6, OpenWRT pre-installed, USB-C, tiny | Already runs OpenWRT — just install B.A.T.M.A.N. + WireGuard |
| **GL.iNet GL-MT300N-V2 (Mango)** | $29 | Ultra-cheap, pocket-sized, OpenWRT built-in | Perfect relay node, limited range |
| **GL.iNet GL-AXT1800 (Slate AX)** | $75 | WiFi 6, 512MB RAM, great for mesh | Full mesh tower capable |
| **TP-Link Archer A7 (v5)** | $40 (used) | Excellent OpenWRT support, dual-band | Flash with OpenWRT + FungiMesh |
| **Raspberry Pi 4 + USB WiFi adapter** | $55–$75 | Most flexible, run anything | Install hostapd + B.A.T.M.A.N. |
| **Raspberry Pi 5 + USB WiFi 6 adapter** | $80–$100 | Fastest Pi, great for compute+mesh | Same as Pi 4 but faster |

---

## TIER 2: Outdoor Mesh Towers ($100–$300)
> These are your neighborhood towers — weatherproof, long-range, mount on roofs/poles

| Device | Price | Why | Flash? |
|--------|-------|-----|--------|
| **Ubiquiti UniFi UAP-AC-Mesh** | $99 | Outdoor rated, dual-band, PoE powered, 183m range | Flash with OpenWRT, mount on pole |
| **Ubiquiti UAP-AC-Mesh-Pro** | $179 | 3x3 MIMO, 450Mbps, serious outdoor tower | OpenWRT compatible, 3-pack for block coverage |
| **Mikrotik hAP ac³** | $69 | Dual-band, 5x Gigabit, RouterOS → OpenWRT flashable | Strong community OpenWRT support |
| **Mikrotik SXT LTE6 kit** | $159 | Built-in LTE modem, outdoor, PoE | Cellular backhaul + WiFi mesh |
| **TP-Link EAP225-Outdoor** | $79 | IP65 weatherproof, PoE, 802.11ac | OpenWRT compatible, ceiling/pole mount |
| **TP-Link CPE710** | $79 | 5GHz, 23dBi antenna, 30km+ point-to-point | Backhaul between towers |

---

## TIER 3: Carrier-Grade / 5G Towers ($300–$2000)
> Serious ISP equipment — covers neighborhoods, connects to Open5GS core

| Device | Price | Why | Flash? |
|--------|-------|-----|--------|
| **Baicells Nova 436Q** | $500–$800 | CBRS LTE/5G small cell, FCC approved | Integrates with Open5GS, outdoor mount |
| **Baicells Nova 243** | $400–$600 | LTE Band 48 (CBRS), PoE, small cell | Entry-level CBRS cell site |
| **BLiNQ FW-600** | $800–$1200 | 5G mmWave fixed wireless, 1Gbps | Point-to-multipoint, 5G NR |
| **Telrad BreezeCOMPACT 2000** | $300–$500 | LTE TDD, Band 41/42, compact small cell | Used for rural ISP, Open5GS compatible |
| **Additional TMO-G4AR gateways** | $50–$100 (used) | Same as your current tower! | Flash with our PowerShell script |
| **Sierra Wireless RV55** | $400 | Industrial LTE/5G router, GPS, RS-232 | Rugged outdoor cellular backhaul |

---

## TIER 4: Smart Devices (IoT Mesh Extension) ($10–$50)
> Every smart device becomes a mesh relay extending your network

| Device | Price | Why | Use |
|--------|-------|-----|-----|
| **ESP32 DevKit** | $5–$10 | WiFi + BLE, runs custom firmware | Mesh relay, sensor node, IoT gateway |
| **ESP32-S3 with external antenna** | $12 | Better range, USB-C, WiFi 4 | Extended range relay |
| **Sonoff NSPanel Pro** | $50 | Touch screen, Zigbee + WiFi, smart home hub | Home mesh node + smart home control |
| **TP-Link Tapo Smart Plug** | $10 | WiFi, energy monitoring | Network presence + power monitoring |
| **Ring Doorbell / Camera** | $30–$60 (used) | WiFi, always-on, outdoor | Mesh relay (with custom firmware) |

---

## RECOMMENDED STARTER KIT — $200 Total
Build a 3-node mesh covering a full block:

1. **Your TMO-G4AR** (already owned) — Primary 5G tower → `$0`
2. **GL.iNet GL-MT3000 (Beryl AX)** x1 — Indoor relay → `$79`
3. **TP-Link EAP225-Outdoor** x1 — Outdoor tower → `$79`
4. **Raspberry Pi 4 + WiFi adapter** x1 — Compute node → `$60`

**Total: ~$218** → 4 towers, full block coverage, "DarCloud-WiFi" everywhere

---

## SCALE TO NEIGHBORHOOD — $500 Total
Cover 4-5 blocks with 5G backhaul:

1. **Your TMO-G4AR** — Primary 5G tower → `$0`
2. **GL.iNet GL-AXT1800** x2 — Indoor relays → `$150`
3. **Ubiquiti UAP-AC-Mesh** x2 — Outdoor towers → `$198`
4. **TP-Link CPE710** x1 — Point-to-point backhaul → `$79`
5. **Raspberry Pi 5** x1 — Edge compute → `$80`

**Total: ~$507** → 7 towers, neighborhood coverage

---

## FLASH INSTRUCTIONS
Every device above can be flashed using our scripts:

```bash
# For OpenWRT-compatible routers:
./fungimesh/flash-router-firmware.sh

# For the TMO-G4AR specifically:
# Run on Windows while connected to the gateway WiFi:
powershell -ExecutionPolicy Bypass -File fungimesh/flash-tmo-g4ar.ps1

# For smart devices / IoT:
./fungimesh/provision-smart-device.sh

# For Raspberry Pi:
# 1. Flash Ubuntu Server to SD card
# 2. Boot Pi and SSH in
# 3. Run: curl -s https://darcloud.host/mesh/bootstrap.sh | bash
```

## REVENUE FOR TOWER HOSTS
Every device you or a neighbor host earns **10% of subscriber revenue** through that tower:
- Home Basic subscriber ($29.99/mo) = $3/mo per tower used
- Business Pro ($99.99/mo) = $10/mo per tower used
- Scale to 100 subscribers on your tower = $300–$1000/mo passive income

---

*All prices approximate as of 2026. Buy used on eBay/Swappa for 50% off.*
*Revenue split: 30% Founder, 40% AI Validators, 10% Hardware Hosts, 18% Ecosystem, 2% Zakat*
