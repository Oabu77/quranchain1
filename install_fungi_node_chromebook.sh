#!/usr/bin/env bash
set -euo pipefail

APP_DIR="$HOME/fungi-mesh-node"
VENV_DIR="$APP_DIR/.venv"
PYTHON_BIN="python3"
PORT="8080"

echo "==> Updating packages"
sudo apt update
sudo apt install -y \
  python3 python3-venv python3-pip \
  iproute2 net-tools dnsutils curl wget jq \
  nmap arp-scan avahi-daemon

mkdir -p "$APP_DIR/templates" "$APP_DIR/static" "$APP_DIR/data"

echo "==> Creating Python virtual environment"
$PYTHON_BIN -m venv "$VENV_DIR"
source "$VENV_DIR/bin/activate"
pip install --upgrade pip
pip install flask psutil

echo "==> Writing application files"

cat > "$APP_DIR/fungi_node.py" <<'PY'
import json
import os
import re
import socket
import subprocess
import threading
import time
from datetime import datetime
from ipaddress import ip_network

import psutil
from flask import Flask, jsonify, render_template

BASE_DIR = os.path.dirname(os.path.abspath(__file__))
DATA_DIR = os.path.join(BASE_DIR, "data")
STATE_FILE = os.path.join(DATA_DIR, "state.json")
LOG_FILE = os.path.join(DATA_DIR, "fungi.log")

app = Flask(__name__)

state = {
    "started_at": datetime.utcnow().isoformat() + "Z",
    "hostname": socket.gethostname(),
    "internet_up": False,
    "public_ip": None,
    "default_interface": None,
    "default_gateway": None,
    "local_ips": [],
    "subnets": [],
    "neighbors": [],
    "last_scan": None,
    "last_error": None,
    "ssh_tunnel": {
        "enabled": False,
        "host": None,
        "user": None,
        "port": None,
        "status": "disabled"
    }
}

def log(msg: str):
    line = f"[{datetime.utcnow().isoformat()}Z] {msg}"
    print(line, flush=True)
    with open(LOG_FILE, "a", encoding="utf-8") as f:
        f.write(line + "\n")

def run(cmd):
    return subprocess.run(cmd, capture_output=True, text=True)

def get_default_route():
    r = run(["ip", "route", "show", "default"])
    if r.returncode != 0 or not r.stdout.strip():
        return None, None
    line = r.stdout.strip().splitlines()[0]
    m = re.search(r"default via ([0-9.]+) dev (\S+)", line)
    if not m:
        return None, None
    return m.group(2), m.group(1)

def get_local_ips():
    ips = []
    for ifname, addrs in psutil.net_if_addrs().items():
        for addr in addrs:
            if getattr(addr, "family", None) == socket.AF_INET:
                if not addr.address.startswith("127."):
                    ips.append({"iface": ifname, "ip": addr.address, "netmask": addr.netmask})
    return ips

def get_subnets():
    subnets = []
    for entry in get_local_ips():
        ip = entry["ip"]
        mask = entry["netmask"]
        try:
            network = ip_network(f"{ip}/{mask}", strict=False)
            subnets.append({
                "iface": entry["iface"],
                "ip": ip,
                "cidr": str(network)
            })
        except Exception:
            pass
    return subnets

def internet_check():
    targets = [
        ["curl", "-4", "-s", "--max-time", "5", "https://api.ipify.org"],
        ["curl", "-4", "-s", "--max-time", "5", "https://ifconfig.me/ip"],
    ]
    for cmd in targets:
        r = run(cmd)
        if r.returncode == 0 and r.stdout.strip():
            return True, r.stdout.strip()
    ping = run(["ping", "-c", "1", "-W", "2", "1.1.1.1"])
    if ping.returncode == 0:
        return True, None
    return False, None

def scan_neighbors():
    neighbors = []
    seen = set()

    # ARP table first
    arp = run(["ip", "neigh", "show"])
    if arp.returncode == 0:
        for line in arp.stdout.splitlines():
            parts = line.split()
            if len(parts) >= 5 and re.match(r"\d+\.\d+\.\d+\.\d+", parts[0]):
                ip = parts[0]
                mac = None
                iface = None
                if "lladdr" in parts:
                    mac = parts[parts.index("lladdr") + 1]
                if "dev" in parts:
                    iface = parts[parts.index("dev") + 1]
                key = (ip, mac or "")
                if key not in seen:
                    seen.add(key)
                    neighbors.append({
                        "ip": ip,
                        "mac": mac,
                        "iface": iface,
                        "source": "arp"
                    })

    # Ping sweep local subnets /24 and smaller
    for subnet in get_subnets():
        cidr = subnet["cidr"]
        try:
            network = ip_network(cidr, strict=False)
            if network.num_addresses > 256:
                continue
            for host in network.hosts():
                ip = str(host)
                run(["ping", "-c", "1", "-W", "1", ip])
        except Exception:
            continue

    # Re-read ARP after ping sweep
    arp2 = run(["ip", "neigh", "show"])
    if arp2.returncode == 0:
        for line in arp2.stdout.splitlines():
            parts = line.split()
            if len(parts) >= 5 and re.match(r"\d+\.\d+\.\d+\.\d+", parts[0]):
                ip = parts[0]
                mac = None
                iface = None
                if "lladdr" in parts:
                    mac = parts[parts.index("lladdr") + 1]
                if "dev" in parts:
                    iface = parts[parts.index("dev") + 1]
                key = (ip, mac or "")
                if key not in seen:
                    seen.add(key)
                    neighbors.append({
                        "ip": ip,
                        "mac": mac,
                        "iface": iface,
                        "source": "ping+arp"
                    })

    neighbors.sort(key=lambda x: tuple(int(p) for p in x["ip"].split(".")))
    return neighbors

def refresh_state():
    iface, gw = get_default_route()
    state["default_interface"] = iface
    state["default_gateway"] = gw
    state["local_ips"] = get_local_ips()
    state["subnets"] = get_subnets()
    ok, pub = internet_check()
    state["internet_up"] = ok
    state["public_ip"] = pub
    state["neighbors"] = scan_neighbors()
    state["last_scan"] = datetime.utcnow().isoformat() + "Z"
    state["last_error"] = None
    save_state()

def save_state():
    os.makedirs(DATA_DIR, exist_ok=True)
    with open(STATE_FILE, "w", encoding="utf-8") as f:
        json.dump(state, f, indent=2)

def background_loop():
    while True:
        try:
            refresh_state()
            log(f"scan complete: internet_up={state['internet_up']} neighbors={len(state['neighbors'])}")
        except Exception as e:
            state["last_error"] = str(e)
            save_state()
            log(f"scan error: {e}")
        time.sleep(20)

@app.route("/")
def index():
    return render_template("index.html", state=state)

@app.route("/api/status")
def api_status():
    return jsonify(state)

@app.route("/api/neighbors")
def api_neighbors():
    return jsonify(state.get("neighbors", []))

@app.route("/api/refresh")
def api_refresh():
    refresh_state()
    return jsonify({"ok": True, "last_scan": state["last_scan"]})

if __name__ == "__main__":
    os.makedirs(DATA_DIR, exist_ok=True)
    save_state()
    t = threading.Thread(target=background_loop, daemon=True)
    t.start()
    app.run(host="0.0.0.0", port=8080)
PY

cat > "$APP_DIR/templates/index.html" <<'HTML'
<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <title>Fungi Mesh Node</title>
  <meta name="viewport" content="width=device-width,initial-scale=1">
  <style>
    body{font-family:Arial,sans-serif;background:#0f172a;color:#e2e8f0;margin:0;padding:24px}
    h1,h2{margin:0 0 12px}
    .grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(280px,1fr));gap:16px}
    .card{background:#111827;border:1px solid #334155;border-radius:16px;padding:16px}
    .ok{color:#22c55e}.bad{color:#ef4444}.muted{color:#94a3b8}
    table{width:100%;border-collapse:collapse}
    td,th{padding:8px;border-bottom:1px solid #1f2937;text-align:left;font-size:14px}
    button{background:#2563eb;color:#fff;border:none;border-radius:10px;padding:10px 14px;cursor:pointer}
    code{background:#020617;padding:2px 6px;border-radius:6px}
  </style>
</head>
<body>
  <h1>Fungi Mesh Chromebook Node</h1>
  <p class="muted">User-space discovery and control plane</p>

  <div class="grid">
    <div class="card">
      <h2>Node</h2>
      <p><strong>Hostname:</strong> {{ state.hostname }}</p>
      <p><strong>Started:</strong> {{ state.started_at }}</p>
      <p><strong>Internet:</strong>
        {% if state.internet_up %}
          <span class="ok">ONLINE</span>
        {% else %}
          <span class="bad">OFFLINE</span>
        {% endif %}
      </p>
      <p><strong>Public IP:</strong> {{ state.public_ip or "unknown" }}</p>
      <p><strong>Default Interface:</strong> {{ state.default_interface or "unknown" }}</p>
      <p><strong>Gateway:</strong> {{ state.default_gateway or "unknown" }}</p>
      <p><strong>Last Scan:</strong> {{ state.last_scan or "never" }}</p>
      <p><strong>Last Error:</strong> {{ state.last_error or "none" }}</p>
      <button onclick="location.href='/api/refresh'">Refresh now</button>
    </div>

    <div class="card">
      <h2>Local IPs</h2>
      <table>
        <tr><th>Interface</th><th>IP</th><th>Netmask</th></tr>
        {% for x in state.local_ips %}
        <tr><td>{{ x.iface }}</td><td>{{ x.ip }}</td><td>{{ x.netmask }}</td></tr>
        {% endfor %}
      </table>
    </div>

    <div class="card">
      <h2>Subnets</h2>
      <table>
        <tr><th>Interface</th><th>IP</th><th>CIDR</th></tr>
        {% for x in state.subnets %}
        <tr><td>{{ x.iface }}</td><td>{{ x.ip }}</td><td>{{ x.cidr }}</td></tr>
        {% endfor %}
      </table>
    </div>
  </div>

  <div class="card" style="margin-top:16px">
    <h2>Neighbors</h2>
    <table>
      <tr><th>IP</th><th>MAC</th><th>Interface</th><th>Source</th></tr>
      {% for n in state.neighbors %}
      <tr><td>{{ n.ip }}</td><td>{{ n.mac }}</td><td>{{ n.iface }}</td><td>{{ n.source }}</td></tr>
      {% endfor %}
    </table>
  </div>

  <div class="card" style="margin-top:16px">
    <h2>API</h2>
    <p><code>/api/status</code></p>
    <p><code>/api/neighbors</code></p>
    <p><code>/api/refresh</code></p>
  </div>
</body>
</html>
HTML

cat > "$APP_DIR/run_fungi_node.sh" <<'SH'
#!/usr/bin/env bash
set -euo pipefail
APP_DIR="$HOME/fungi-mesh-node"
source "$APP_DIR/.venv/bin/activate"
cd "$APP_DIR"
exec python3 fungi_node.py
SH
chmod +x "$APP_DIR/run_fungi_node.sh"

cat > "$APP_DIR/start_bg.sh" <<'SH'
#!/usr/bin/env bash
set -euo pipefail
APP_DIR="$HOME/fungi-mesh-node"
LOG="$APP_DIR/data/web.log"
PIDFILE="$APP_DIR/data/web.pid"

if [ -f "$PIDFILE" ] && kill -0 "$(cat "$PIDFILE")" 2>/dev/null; then
  echo "Already running with PID $(cat "$PIDFILE")"
  exit 0
fi

nohup "$APP_DIR/run_fungi_node.sh" > "$LOG" 2>&1 &
echo $! > "$PIDFILE"
echo "Started on http://127.0.0.1:8080 with PID $(cat "$PIDFILE")"
SH
chmod +x "$APP_DIR/start_bg.sh"

cat > "$APP_DIR/stop_bg.sh" <<'SH'
#!/usr/bin/env bash
set -euo pipefail
APP_DIR="$HOME/fungi-mesh-node"
PIDFILE="$APP_DIR/data/web.pid"
if [ -f "$PIDFILE" ]; then
  PID="$(cat "$PIDFILE")"
  kill "$PID" 2>/dev/null || true
  rm -f "$PIDFILE"
  echo "Stopped."
else
  echo "No PID file found."
fi
SH
chmod +x "$APP_DIR/stop_bg.sh"

cat > "$APP_DIR/ssh_reverse_tunnel.sh" <<'SH'
#!/usr/bin/env bash
set -euo pipefail

# Usage:
# ./ssh_reverse_tunnel.sh USER HOST REMOTE_PORT LOCAL_PORT
# Example:
# ./ssh_reverse_tunnel.sh ubuntu my-vps.example.com 18080 8080

USER_NAME="${1:-}"
HOST_NAME="${2:-}"
REMOTE_PORT="${3:-18080}"
LOCAL_PORT="${4:-8080}"

if [ -z "$USER_NAME" ] || [ -z "$HOST_NAME" ]; then
  echo "Usage: $0 USER HOST REMOTE_PORT LOCAL_PORT"
  exit 1
fi

exec ssh -o ServerAliveInterval=30 -o ServerAliveCountMax=3 \
  -N -R "${REMOTE_PORT}:127.0.0.1:${LOCAL_PORT}" "${USER_NAME}@${HOST_NAME}"
SH
chmod +x "$APP_DIR/ssh_reverse_tunnel.sh"

echo "==> Starting node in background"
"$APP_DIR/start_bg.sh"

echo
echo "Done."
echo "Open this in the Chromebook browser:"
echo "  http://127.0.0.1:${PORT}"
echo
echo "If you want ChromeOS to expose it to your LAN:"
echo "  Settings -> Developers -> Linux development environment -> Port forwarding"
echo "  Add TCP ${PORT}"
echo
echo "Useful commands:"
echo "  $APP_DIR/start_bg.sh"
echo "  $APP_DIR/stop_bg.sh"
echo "  tail -f $APP_DIR/data/web.log"
echo "  curl http://127.0.0.1:${PORT}/api/status | jq"
echo
echo "Optional SSH reverse tunnel to a VPS:"
echo "  $APP_DIR/ssh_reverse_tunnel.sh ubuntu YOUR_SERVER 18080 8080"
