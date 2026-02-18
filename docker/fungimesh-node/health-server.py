#!/usr/bin/env python3
"""QuranChain™ FungiMesh Node Health Check Server"""
import http.server
import json
import os
import time
import socket

NODE_NAME = os.environ.get("NODE_NAME", "fungimesh-node")
NODE_ROLE = os.environ.get("NODE_ROLE", "relay")
START_TIME = time.time()


class HealthHandler(http.server.BaseHTTPRequestHandler):
    def do_GET(self):
        if self.path == "/health":
            uptime = int(time.time() - START_TIME)
            body = {
                "status": "healthy",
                "node": NODE_NAME,
                "role": NODE_ROLE,
                "uptime_seconds": uptime,
                "hostname": socket.gethostname(),
                "ip": self._get_ip(),
                "timestamp": time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime()),
                "system": {
                    "trademark": "QuranChain™ / Dar Al-Nas™",
                    "network": "FungiMesh",
                    "mesh_layer": "dual (Node.js + Python)",
                },
            }
            self._respond(200, body)
        elif self.path == "/status":
            try:
                with open("/var/log/fungimesh/status.json") as f:
                    status = json.load(f)
                self._respond(200, status)
            except FileNotFoundError:
                self._respond(503, {"error": "Status file not found"})
        elif self.path == "/mesh/info":
            body = {
                "node": NODE_NAME,
                "role": NODE_ROLE,
                "mesh_upstream": os.environ.get("MESH_UPSTREAM", "https://mesh.darcloud.host"),
                "wireguard_port": 51820,
                "health_port": 8080,
                "encryption": "Kyber-1024 + Dilithium-5 + BB84 QKD",
            }
            self._respond(200, body)
        else:
            self._respond(404, {"error": "Not found"})

    def _get_ip(self):
        try:
            s = socket.socket(socket.AF_INET, socket.SOCK_DGRAM)
            s.connect(("8.8.8.8", 80))
            ip = s.getsockname()[0]
            s.close()
            return ip
        except Exception:
            return "0.0.0.0"

    def _respond(self, code, body):
        self.send_response(code)
        self.send_header("Content-Type", "application/json")
        self.end_headers()
        self.wfile.write(json.dumps(body, indent=2).encode())

    def log_message(self, format, *args):
        # Suppress default logging for cleaner output
        pass


if __name__ == "__main__":
    server = http.server.HTTPServer(("0.0.0.0", 8080), HealthHandler)
    print(f"[health] Listening on :8080 for {NODE_NAME} ({NODE_ROLE})")
    server.serve_forever()
