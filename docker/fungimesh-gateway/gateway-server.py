#!/usr/bin/env python3
"""
DarCloud FungiMesh WiFi Gateway Server
- Captive portal for new WiFi clients
- Health monitoring API
- Heartbeat to DarCloud API
- Client tracking & bandwidth metering
"""
import os, json, time, threading, subprocess, socket
from http.server import HTTPServer, BaseHTTPRequestHandler
from urllib.parse import urlparse
import urllib.request
from typing import Any

NODE_ID = os.environ.get("NODE_NAME", os.environ.get("NODE_ID", "fungi-gw-unknown"))
API_URL = os.environ.get("DARCLOUD_API", "https://darcloud.host")
HEALTH_PORT = int(os.environ.get("HEALTH_PORT", "8080"))
PORTAL_PORT = int(os.environ.get("PORTAL_PORT", "8888"))
HEARTBEAT_SEC = int(os.environ.get("HEARTBEAT_SEC", "30"))

start_time = time.time()
stats = {
    "clients_connected": 0,
    "clients_total": 0,
    "bytes_forwarded": 0,
    "mesh_peers": 0,
    "batman_neighbors": 0,
    "wifi_clients": 0,
}

def get_batman_info() -> dict[str, Any]:
    info: dict[str, Any] = {"neighbors": [], "originators": [], "gw_mode": "unknown", "version": "unknown"}
    try:
        r = subprocess.run(["batctl", "n"], capture_output=True, text=True, timeout=5)
        for line in r.stdout.strip().split("\n")[2:]:
            parts = line.split()
            if len(parts) >= 3:
                info["neighbors"].append({"iface": parts[0], "mac": parts[1], "last_seen": parts[2]})
        stats["batman_neighbors"] = len(info["neighbors"])
    except: pass
    try:
        r = subprocess.run(["batctl", "o"], capture_output=True, text=True, timeout=5)
        for line in r.stdout.strip().split("\n")[2:]:
            parts = line.split()
            if len(parts) >= 4:
                info["originators"].append({"mac": parts[0].strip("*"), "tq": parts[2].strip("()"), "next_hop": parts[3]})
    except: pass
    try:
        r = subprocess.run(["batctl", "gw_mode"], capture_output=True, text=True, timeout=5)
        info["gw_mode"] = r.stdout.strip()
    except: pass
    return info

def get_wifi_clients() -> list[dict[str, Any]]:
    clients: list[dict[str, Any]] = []
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

def get_dhcp_leases() -> list[dict[str, str]]:
    leases: list[dict[str, str]] = []
    try:
        with open("/var/lib/misc/dnsmasq.leases") as f:
            for line in f:
                parts = line.strip().split()
                if len(parts) >= 5:
                    leases.append({"expires": parts[0], "mac": parts[1], "ip": parts[2],
                                   "hostname": parts[3], "client_id": parts[4]})
    except: pass
    stats["clients_connected"] = len(leases)
    return leases

def get_traffic_stats() -> dict[str, dict[str, int]]:
    traffic: dict[str, dict[str, int]] = {}
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

def get_wireguard_peers() -> list[dict[str, Any]]:
    peers: list[dict[str, Any]] = []
    try:
        r = subprocess.run(["wg", "show", "wg-fungi", "dump"], capture_output=True, text=True, timeout=5)
        for line in r.stdout.strip().split("\n")[1:]:
            parts = line.split("\t")
            if len(parts) >= 8:
                peers.append({"pubkey": parts[0][:16] + "...", "endpoint": parts[2],
                              "allowed_ips": parts[3], "rx_bytes": int(parts[5]), "tx_bytes": int(parts[6])})
        stats["mesh_peers"] = len(peers)
    except: pass
    return peers

def heartbeat():
    while True:
        try:
            traffic = get_traffic_stats()
            total_bytes = traffic.get("br-mesh", {}).get("rx_bytes", 0) + traffic.get("br-mesh", {}).get("tx_bytes", 0)
            payload = json.dumps({
                "node_id": NODE_ID, "status": "online", "hardware": "wifi-gateway",
                "role": "gateway", "clients": stats["clients_connected"],
                "wifi_clients": stats["wifi_clients"], "batman_neighbors": stats["batman_neighbors"],
                "mesh_peers": stats["mesh_peers"], "bytes_forwarded": total_bytes,
                "uptime": int(time.time() - start_time),
            }).encode()
            req = urllib.request.Request(f"{API_URL}/mesh/heartbeat", data=payload,
                                         headers={"Content-Type": "application/json"}, method="POST")
            urllib.request.urlopen(req, timeout=10)
        except: pass
        time.sleep(HEARTBEAT_SEC)


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
.container { max-width: 420px; width: 90%%; padding: 2rem; }
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
.btn { width: 100%%; padding: 14px; border: none; border-radius: 12px; font-size: 1rem;
  font-weight: 600; cursor: pointer; margin-top: 1rem; transition: all 0.3s; }
.btn-free { background: linear-gradient(90deg, #00f5ff, #0099ff); color: #000; }
.btn-paid { background: linear-gradient(90deg, #7b2ff7, #ff2fd5); color: #fff; }
.btn:hover { transform: translateY(-2px); box-shadow: 0 8px 25px rgba(0,245,255,0.3); }
.mesh-info { text-align: center; color: #8b8ba7; font-size: 0.75rem; margin-top: 2rem; }
.mesh-info .node { color: #00f5ff; }
</style>
</head>
<body>
<div class="container">
  <div class="logo">
    <h1>DarCloud WiFi</h1>
    <div class="sub">Powered by FungiMesh x B.A.T.M.A.N.</div>
  </div>
  <div class="card">
    <div class="plan selected" onclick="selectPlan('free')">
      <h3>Free Tier <span class="price">$0</span></h3>
      <p>100 MB/day - Basic speed - Ad-supported</p>
    </div>
    <div class="plan" onclick="selectPlan('starter')">
      <h3>Starter <span class="price">$19.99/mo</span></h3>
      <p>10 GB/mo - 50 Mbps - No ads</p>
    </div>
    <div class="plan" onclick="selectPlan('pro')">
      <h3>Pro <span class="price">$39.99/mo</span></h3>
      <p>50 GB/mo - 200 Mbps - Priority routing</p>
    </div>
    <div class="plan" onclick="selectPlan('unlimited')">
      <h3>Unlimited <span class="price">$59.99/mo</span></h3>
      <p>Unlimited - 500 Mbps - VPN included</p>
    </div>
    <button class="btn btn-free" id="connectBtn" onclick="connect()">
      Connect Free (100 MB/day)
    </button>
    <div id="status" style="text-align:center;margin-top:1rem"></div>
  </div>
  <div class="mesh-info">
    <span class="node">%s</span> -
    B.A.T.M.A.N. + WireGuard -
    %d neighbors - %d clients online
  </div>
</div>
<script>
let plan='free';
function selectPlan(p){plan=p;document.querySelectorAll('.plan').forEach(e=>e.classList.remove('selected'));
event.currentTarget.classList.add('selected');const btn=document.getElementById('connectBtn');
if(p==='free'){btn.className='btn btn-free';btn.textContent='Connect Free (100 MB/day)'}
else{btn.className='btn btn-paid';btn.textContent='Subscribe & Connect - '+{starter:'$19.99/mo',pro:'$39.99/mo',unlimited:'$59.99/mo'}[p]}}
function connect(){const s=document.getElementById('status');
if(plan==='free'){fetch('/api/connect',{method:'POST',headers:{'Content-Type':'application/json'},
body:JSON.stringify({plan:'free'})}).then(r=>r.json()).then(d=>{
s.innerHTML='<span style="color:#00f5ff">Connected! 100MB daily limit active.</span>';
setTimeout(()=>{window.location.href='http://darcloud.host'},2000)})
.catch(()=>{s.innerHTML='<span style="color:#ff4444">Connection failed.</span>'})}
else{window.location.href='https://darcloud.host/telecom/subscribe?plan='+plan}}
</script>
</body>
</html>"""


class GatewayHandler(BaseHTTPRequestHandler):
    def log_message(self, format: str, *args: Any) -> None: pass

    def do_GET(self):
        path = urlparse(self.path).path
        if path == "/health":
            self._json({"status": "healthy", "node_id": NODE_ID, "type": "wifi-gateway",
                         "uptime": int(time.time() - start_time), "hostname": socket.gethostname()})
        elif path in ("/status", "/api/status"):
            self._json({"node_id": NODE_ID, "type": "wifi-gateway",
                         "uptime": int(time.time() - start_time),
                         "batman": get_batman_info(), "wifi_clients": get_wifi_clients(),
                         "dhcp_leases": get_dhcp_leases(), "wireguard_peers": get_wireguard_peers(),
                         "traffic": get_traffic_stats(), "stats": stats})
        elif path == "/api/mesh":
            self._json({"protocol": "B.A.T.M.A.N. Advanced + 802.11s",
                         "batman": get_batman_info(), "wireguard_peers": get_wireguard_peers()})
        else:
            batman = get_batman_info()
            html = PORTAL_HTML % (NODE_ID, len(batman["neighbors"]), stats["wifi_clients"])
            self.send_response(200)
            self.send_header("Content-Type", "text/html; charset=utf-8")
            self.end_headers()
            self.wfile.write(html.encode())

    def do_POST(self):
        path = urlparse(self.path).path
        length = int(self.headers.get("Content-Length", 0))
        body: dict[str, Any] = json.loads(self.rfile.read(length)) if length > 0 else {}
        if path == "/api/connect":
            client_ip = self.client_address[0]
            try:
                subprocess.run(["nft", "add", "element", "inet", "fungimesh",
                                "authenticated", "{", client_ip, "}"], capture_output=True, timeout=5)
            except:
                subprocess.run(["iptables", "-I", "FORWARD", "-s", client_ip, "-j", "ACCEPT"],
                               capture_output=True, timeout=5)
            stats["clients_total"] += 1
            self._json({"status": "connected", "ip": client_ip, "plan": body.get("plan", "free")})
        else:
            self._json({"error": "not found"}, 404)

    def _json(self, data: dict[str, Any], code: int = 200) -> None:
        body = json.dumps(data).encode()
        self.send_response(code)
        self.send_header("Content-Type", "application/json")
        self.send_header("Content-Length", str(len(body)))
        self.send_header("Access-Control-Allow-Origin", "*")
        self.end_headers()
        self.wfile.write(body)


def run_portal():
    HTTPServer(("0.0.0.0", PORTAL_PORT), GatewayHandler).serve_forever()

def run_health():
    HTTPServer(("0.0.0.0", HEALTH_PORT), GatewayHandler).serve_forever()

if __name__ == "__main__":
    print(f"FungiMesh WiFi Gateway — {NODE_ID}")
    threading.Thread(target=heartbeat, daemon=True).start()
    threading.Thread(target=run_portal, daemon=True).start()
    run_health()
