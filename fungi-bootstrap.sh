#!/usr/bin/env bash
set -euo pipefail

echo "© QuranChain™ | Omar Mohammad Abunadi™ — Fungi Mesh Bootstrap"

# ---- CONFIG (edit if needed) ----
MESH_HTTP="${MESH_HTTP:-http://127.0.0.1:8787}"
QURAN_RPC="${QURAN_RPC:-http://127.0.0.1:26657}"
SETTLE_HTTP="${SETTLE_HTTP:-http://127.0.0.1:9999}"
PRICE_PER_MB_USD="${PRICE_PER_MB_USD:-0.01}"
MIN_CHARGE_USD="${MIN_CHARGE_USD:-0.05}"
# --------------------------------

echo "[1/6] Stopping old processes (best-effort)…"
pkill -f fungi || true
pkill -f mesh || true
pkill -f darcloud || true
sleep 2

echo "[2/6] Relaunching Fungi Mesh node…"
( command -v python3 >/dev/null && \
  python3 fungi_mesh_node.py \
    --node-name "$(hostname)" \
    --auto-discover \
    --mesh-mode full \
    --transport wifi,bluetooth,tcp \
    --heartbeat 5 \
    --log-level INFO ) >/tmp/fungi_mesh.log 2>&1 &

sleep 3

echo "[3/6] Announcing to QuranChain overlay…"
curl -sS -X POST "$MESH_HTTP/mesh/announce" \
  -H "Content-Type: application/json" \
  -d "{\"quranchain_rpc\":\"$QURAN_RPC\"}" || true

echo "[4/6] Force peer rebalance…"
curl -sS -X POST "$MESH_HTTP/mesh/rebalance" || true

echo "[5/6] Bind MeshTalk OS telecom + enable paid routing…"
curl -sS -X POST "$MESH_HTTP/mesh/services/register" \
  -H "Content-Type: application/json" \
  -d "{\"service\":\"meshtalk-telecom\"}" || true

curl -sS -X POST "$MESH_HTTP/mesh/billing/metering/enable" \
  -H "Content-Type: application/json" \
  -d "{\"enabled\":true}" || true

curl -sS -X POST "$MESH_HTTP/mesh/billing/pricing" \
  -H "Content-Type: application/json" \
  -d "{\"price_per_mb_usd\":$PRICE_PER_MB_USD,\"min_charge_usd\":$MIN_CHARGE_USD}" || true

curl -sS -X POST "$MESH_HTTP/mesh/billing/settlement_sink" \
  -H "Content-Type: application/json" \
  -d "{\"type\":\"quranchain\",\"endpoint\":\"$SETTLE_HTTP/api/v1/mesh/settle\"}" || true

echo "[6/6] Status report (local + peers)…"
echo "--- LOCAL STATUS ---"
curl -sS "$MESH_HTTP/mesh/status" || true
echo
echo "--- PEERS ---"
curl -sS "$MESH_HTTP/mesh/peers" || true

echo "✅ Bootstrap complete. Logs: /tmp/fungi_mesh.log"
