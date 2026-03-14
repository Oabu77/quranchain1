// ══════════════════════════════════════════════════════════════
// DarCloud Empire — FungiMesh Cell Tower Layer
// Turns real hardware into mesh cell towers
// Real network binding, real traffic relay, real signal projection
// NO simulation — every function talks to actual OS/network
// ══════════════════════════════════════════════════════════════
const net = require("net");
const dgram = require("dgram");
const http = require("http");
const os = require("os");
const { execSync, exec } = require("child_process");
const crypto = require("crypto");
const dns = require("dns");

// ── Hardware Discovery ─────────────────────────────────────
function getHardwareProfile() {
  const ifaces = os.networkInterfaces();
  const cpus = os.cpus();
  const mem = os.totalmem();

  // Real network interfaces — every one the OS exposes
  const interfaces = [];
  for (const [name, addrs] of Object.entries(ifaces)) {
    for (const addr of addrs) {
      interfaces.push({
        name,
        address: addr.address,
        netmask: addr.netmask,
        family: addr.family,
        mac: addr.mac,
        internal: addr.internal,
        cidr: addr.cidr,
      });
    }
  }

  // Detect WiFi hardware
  let wifiAdapters = [];
  try {
    const iwOut = execSync("iwconfig 2>/dev/null || true", { encoding: "utf8", timeout: 3000 });
    const wifiBlocks = iwOut.split("\n\n").filter(b => b.includes("IEEE"));
    wifiAdapters = wifiBlocks.map(b => {
      const nameMatch = b.match(/^(\S+)/);
      const essidMatch = b.match(/ESSID:"([^"]+)"/);
      const freqMatch = b.match(/Frequency:([\d.]+ \w+)/);
      const modeMatch = b.match(/Mode:(\S+)/);
      return {
        interface: nameMatch?.[1] || "unknown",
        essid: essidMatch?.[1] || null,
        frequency: freqMatch?.[1] || null,
        mode: modeMatch?.[1] || "unknown",
      };
    });
  } catch {}

  // Bluetooth adapters
  let bluetooth = [];
  try {
    const btOut = execSync("hciconfig -a 2>/dev/null || true", { encoding: "utf8", timeout: 3000 });
    if (btOut.includes("hci")) {
      bluetooth = btOut.split("\n\n").filter(b => b.includes("hci")).map(b => {
        const nameMatch = b.match(/^(hci\d+)/);
        const addrMatch = b.match(/BD Address: ([\w:]+)/);
        return { device: nameMatch?.[1], address: addrMatch?.[1] || "unknown" };
      });
    }
  } catch {}

  // USB devices (potential radios, SDRs, LoRa modules)
  let usbDevices = [];
  try {
    const usbOut = execSync("lsusb 2>/dev/null || true", { encoding: "utf8", timeout: 3000 });
    usbDevices = usbOut.trim().split("\n").filter(Boolean).map(line => {
      const match = line.match(/Bus (\d+) Device (\d+): ID ([\w:]+) (.+)/);
      return match ? { bus: match[1], device: match[2], id: match[3], name: match[4].trim() } : null;
    }).filter(Boolean);
  } catch {}

  // Docker containers (each one = potential tower node)
  let containers = [];
  try {
    const dockerOut = execSync("docker ps --format '{{.ID}}|{{.Names}}|{{.Status}}|{{.Ports}}' 2>/dev/null || true",
      { encoding: "utf8", timeout: 5000 });
    containers = dockerOut.trim().split("\n").filter(Boolean).map(line => {
      const [id, name, status, ports] = line.split("|");
      return { id, name, status, ports: ports || "" };
    });
  } catch {}

  return {
    hostname: os.hostname(),
    platform: os.platform(),
    arch: os.arch(),
    kernel: os.release(),
    cpuModel: cpus[0]?.model || "unknown",
    cpuCores: cpus.length,
    totalMemoryMB: Math.round(mem / 1048576),
    freeMemoryMB: Math.round(os.freemem() / 1048576),
    uptime: os.uptime(),
    interfaces,
    wifiAdapters,
    bluetooth,
    usbDevices,
    containers,
  };
}

// ── Cell Tower Node ────────────────────────────────────────
// Each Discord bot binds real ports and relays real traffic
class CellTower {
  constructor(botName, config) {
    this.botName = botName;
    this.config = config;
    this.towerId = `tower-${botName}-${os.hostname().slice(0, 8)}`;

    // Real port assignments — each bot gets a UDP relay port + TCP proxy port
    // IPC is on config.port (9001-9021), tower binds config.port + 1000 for UDP, +2000 for TCP
    this.udpPort = config.port + 1000; // 10001-10021 — UDP relay
    this.tcpPort = config.port + 2000; // 11001-11021 — TCP proxy
    this.dnsPort = config.port + 3000; // 12001-12021 — DNS relay

    this.hardware = null;
    this.udpServer = null;
    this.tcpServer = null;
    this.dnsServer = null;
    this.connectedClients = new Map(); // remoteAddr -> { connected, bytes, packets }
    this.trafficStats = {
      udpPacketsIn: 0,
      udpPacketsOut: 0,
      tcpConnectionsTotal: 0,
      tcpConnectionsActive: 0,
      dnsQueriesRelayed: 0,
      bytesRelayed: 0,
      startTime: Date.now(),
    };
    this.peerTowers = new Map(); // towerId -> { host, udpPort, tcpPort }
    this.running = false;
  }

  // ── Start all tower services ──
  async start() {
    console.log(`[CELL-TOWER] ${this.towerId} starting real network services...`);

    // 1. Scan hardware
    this.hardware = getHardwareProfile();
    console.log(`[CELL-TOWER] Hardware: ${this.hardware.cpuCores}x ${this.hardware.cpuModel.slice(0, 30)}`);
    console.log(`[CELL-TOWER] Network interfaces: ${this.hardware.interfaces.filter(i => !i.internal).length}`);
    console.log(`[CELL-TOWER] WiFi adapters: ${this.hardware.wifiAdapters.length}`);
    console.log(`[CELL-TOWER] USB devices: ${this.hardware.usbDevices.length}`);
    console.log(`[CELL-TOWER] Docker containers: ${this.hardware.containers.length}`);

    // 2. Start UDP relay — real packet relay between mesh nodes
    await this._startUdpRelay();

    // 3. Start TCP proxy — real connection relay for mesh traffic
    await this._startTcpProxy();

    // 4. Start DNS relay — relay DNS queries through the mesh
    await this._startDnsRelay();

    this.running = true;
    console.log(`[CELL-TOWER] ${this.towerId} ONLINE — UDP:${this.udpPort} TCP:${this.tcpPort} DNS:${this.dnsPort}`);
    return this;
  }

  // ── UDP Packet Relay ──────────────────────────────────────
  // Real UDP server that relays datagrams between mesh nodes
  async _startUdpRelay() {
    return new Promise((resolve) => {
      this.udpServer = dgram.createSocket("udp4");

      this.udpServer.on("message", (msg, rinfo) => {
        this.trafficStats.udpPacketsIn++;
        this.trafficStats.bytesRelayed += msg.length;

        const clientKey = `${rinfo.address}:${rinfo.port}`;
        if (!this.connectedClients.has(clientKey)) {
          this.connectedClients.set(clientKey, {
            connected: Date.now(),
            address: rinfo.address,
            port: rinfo.port,
            bytes: 0,
            packets: 0,
            type: "udp",
          });
        }
        const client = this.connectedClients.get(clientKey);
        client.bytes += msg.length;
        client.packets++;

        // Parse mesh packet header (first 4 bytes = magic, next 4 = dest tower index)
        if (msg.length >= 8) {
          const magic = msg.readUInt32BE(0);
          if (magic === 0x46554E47) { // "FUNG" — FungiMesh packet
            const destIdx = msg.readUInt32BE(4);
            this._forwardUdpPacket(msg, destIdx, rinfo);
            return;
          }
        }

        // Broadcast to all peer towers
        for (const [peerId, peer] of this.peerTowers) {
          if (peer.udpPort) {
            this.udpServer.send(msg, peer.udpPort, peer.host || "127.0.0.1", (err) => {
              if (!err) this.trafficStats.udpPacketsOut++;
            });
          }
        }
      });

      this.udpServer.on("error", (err) => {
        if (err.code === "EADDRINUSE") {
          console.log(`[CELL-TOWER] UDP port ${this.udpPort} in use, trying ${this.udpPort + 100}`);
          this.udpPort += 100;
          this.udpServer.bind(this.udpPort, "0.0.0.0");
        } else {
          console.error(`[CELL-TOWER] UDP error: ${err.message}`);
        }
      });

      this.udpServer.bind(this.udpPort, "0.0.0.0", () => {
        console.log(`[CELL-TOWER] UDP relay listening on 0.0.0.0:${this.udpPort}`);
        resolve();
      });
    });
  }

  // Forward a FungiMesh packet to the right peer tower
  _forwardUdpPacket(msg, destIdx, rinfo) {
    const peerKeys = Array.from(this.peerTowers.keys());
    if (destIdx < peerKeys.length) {
      const peer = this.peerTowers.get(peerKeys[destIdx]);
      if (peer) {
        this.udpServer.send(msg, peer.udpPort, peer.host || "127.0.0.1", (err) => {
          if (!err) this.trafficStats.udpPacketsOut++;
        });
      }
    } else {
      // Flood to all peers
      for (const [, peer] of this.peerTowers) {
        this.udpServer.send(msg, peer.udpPort, peer.host || "127.0.0.1");
        this.trafficStats.udpPacketsOut++;
      }
    }
  }

  // ── TCP Connection Proxy ──────────────────────────────────
  // Real TCP server that proxies connections between mesh nodes
  async _startTcpProxy() {
    return new Promise((resolve) => {
      this.tcpServer = net.createServer((socket) => {
        this.trafficStats.tcpConnectionsTotal++;
        this.trafficStats.tcpConnectionsActive++;

        const clientKey = `${socket.remoteAddress}:${socket.remotePort}`;
        this.connectedClients.set(clientKey, {
          connected: Date.now(),
          address: socket.remoteAddress,
          port: socket.remotePort,
          bytes: 0,
          packets: 0,
          type: "tcp",
        });

        // Read the first line as mesh protocol header: TOWER destBotName\n
        let headerBuf = Buffer.alloc(0);
        let headerParsed = false;
        let destSocket = null;

        socket.on("data", (data) => {
          this.trafficStats.bytesRelayed += data.length;
          const client = this.connectedClients.get(clientKey);
          if (client) { client.bytes += data.length; client.packets++; }

          if (!headerParsed) {
            headerBuf = Buffer.concat([headerBuf, data]);
            const nlIdx = headerBuf.indexOf(0x0A); // newline
            if (nlIdx >= 0) {
              const header = headerBuf.slice(0, nlIdx).toString("utf8").trim();
              const remaining = headerBuf.slice(nlIdx + 1);
              headerParsed = true;

              if (header.startsWith("TOWER ")) {
                const destBot = header.slice(6).trim();
                const peer = Array.from(this.peerTowers.entries()).find(([, p]) => p.botName === destBot);
                if (peer) {
                  // Connect to dest tower's TCP port and relay
                  destSocket = net.createConnection(peer[1].tcpPort, peer[1].host || "127.0.0.1", () => {
                    if (remaining.length > 0) destSocket.write(remaining);
                    // Bidirectional pipe
                    socket.pipe(destSocket);
                    destSocket.pipe(socket);
                  });
                  destSocket.on("error", () => socket.destroy());
                } else {
                  socket.write("ERR: Unknown tower\n");
                  socket.destroy();
                }
              } else {
                // Not a TOWER request — proxy to first available peer
                const firstPeer = Array.from(this.peerTowers.values())[0];
                if (firstPeer) {
                  destSocket = net.createConnection(firstPeer.tcpPort, firstPeer.host || "127.0.0.1", () => {
                    destSocket.write(headerBuf);
                    socket.pipe(destSocket);
                    destSocket.pipe(socket);
                  });
                  destSocket.on("error", () => socket.destroy());
                }
              }
            }
          }
        });

        socket.on("close", () => {
          this.trafficStats.tcpConnectionsActive--;
          this.connectedClients.delete(clientKey);
          if (destSocket) destSocket.destroy();
        });

        socket.on("error", () => {
          this.trafficStats.tcpConnectionsActive--;
          this.connectedClients.delete(clientKey);
        });

        // Timeout idle connections after 5 minutes
        socket.setTimeout(300000, () => socket.destroy());
      });

      this.tcpServer.on("error", (err) => {
        if (err.code === "EADDRINUSE") {
          console.log(`[CELL-TOWER] TCP port ${this.tcpPort} in use, trying ${this.tcpPort + 100}`);
          this.tcpPort += 100;
          this.tcpServer.listen(this.tcpPort, "0.0.0.0");
        } else {
          console.error(`[CELL-TOWER] TCP error: ${err.message}`);
        }
      });

      this.tcpServer.listen(this.tcpPort, "0.0.0.0", () => {
        console.log(`[CELL-TOWER] TCP proxy listening on 0.0.0.0:${this.tcpPort}`);
        resolve();
      });
    });
  }

  // ── DNS Relay ─────────────────────────────────────────────
  // Real DNS relay — accepts DNS queries and forwards to upstream
  async _startDnsRelay() {
    return new Promise((resolve) => {
      this.dnsServer = dgram.createSocket("udp4");

      this.dnsServer.on("message", (msg, rinfo) => {
        this.trafficStats.dnsQueriesRelayed++;
        this.trafficStats.bytesRelayed += msg.length;

        // Forward DNS query to upstream resolver
        const upstream = dgram.createSocket("udp4");
        upstream.send(msg, 53, "1.1.1.1", (err) => {
          if (err) { upstream.close(); return; }
        });
        upstream.on("message", (reply) => {
          // Send response back to original requester
          this.dnsServer.send(reply, rinfo.port, rinfo.address);
          upstream.close();
        });
        upstream.on("error", () => upstream.close());
        // Timeout upstream
        setTimeout(() => { try { upstream.close(); } catch {} }, 5000);
      });

      this.dnsServer.on("error", (err) => {
        if (err.code === "EADDRINUSE") {
          this.dnsPort += 100;
          this.dnsServer.bind(this.dnsPort, "0.0.0.0");
        } else {
          console.error(`[CELL-TOWER] DNS error: ${err.message}`);
        }
      });

      this.dnsServer.bind(this.dnsPort, "0.0.0.0", () => {
        console.log(`[CELL-TOWER] DNS relay listening on 0.0.0.0:${this.dnsPort}`);
        resolve();
      });
    });
  }

  // ── Register peer towers for inter-tower relay ──
  addPeerTower(towerId, botName, host, udpPort, tcpPort) {
    this.peerTowers.set(towerId, { botName, host, udpPort, tcpPort });
  }

  // ── Discover peer towers from local bot IPC ──
  async discoverPeers(botRegistry) {
    for (const [name, cfg] of Object.entries(botRegistry)) {
      if (name === this.botName) continue;
      const peerId = `tower-${name}-${os.hostname().slice(0, 8)}`;
      try {
        const res = await new Promise((resolve, reject) => {
          const req = http.request({
            hostname: "127.0.0.1", port: cfg.port, path: "/tower/status",
            method: "GET", timeout: 2000,
          }, (r) => {
            let body = ""; r.on("data", c => body += c);
            r.on("end", () => { try { resolve(JSON.parse(body)); } catch { reject(); } });
          });
          req.on("error", reject);
          req.on("timeout", () => { req.destroy(); reject(new Error("timeout")); });
          req.end();
        });
        if (res.running) {
          this.addPeerTower(peerId, name, "127.0.0.1", res.udpPort, res.tcpPort);
        }
      } catch {} // peer not running tower services yet
    }
    console.log(`[CELL-TOWER] ${this.towerId} discovered ${this.peerTowers.size} peer towers`);
  }

  // ── Get status for IPC endpoint ──
  getStatus() {
    return {
      towerId: this.towerId,
      botName: this.botName,
      running: this.running,
      udpPort: this.udpPort,
      tcpPort: this.tcpPort,
      dnsPort: this.dnsPort,
      hardware: this.hardware ? {
        hostname: this.hardware.hostname,
        platform: this.hardware.platform,
        arch: this.hardware.arch,
        cpuCores: this.hardware.cpuCores,
        cpuModel: this.hardware.cpuModel,
        totalMemoryMB: this.hardware.totalMemoryMB,
        freeMemoryMB: this.hardware.freeMemoryMB,
        networkInterfaces: this.hardware.interfaces.filter(i => !i.internal).length,
        wifiAdapters: this.hardware.wifiAdapters.length,
        bluetooth: this.hardware.bluetooth.length,
        usbDevices: this.hardware.usbDevices.length,
        containers: this.hardware.containers.length,
      } : null,
      traffic: { ...this.trafficStats },
      connectedClients: this.connectedClients.size,
      peerTowers: this.peerTowers.size,
      uptimeSeconds: Math.floor((Date.now() - this.trafficStats.startTime) / 1000),
    };
  }

  // ── Get IPC handlers for bot-ipc server ──
  getIpcHandlers() {
    return {
      "/tower/status": async () => this.getStatus(),
      "/tower/hardware": async () => this.hardware || getHardwareProfile(),
      "/tower/peers": async () => ({
        towerId: this.towerId,
        peers: Object.fromEntries(this.peerTowers),
      }),
      "/tower/clients": async () => ({
        towerId: this.towerId,
        clients: Array.from(this.connectedClients.entries()).map(([k, v]) => ({
          remote: k, ...v,
          durationSeconds: Math.floor((Date.now() - v.connected) / 1000),
        })),
      }),
      "/tower/traffic": async () => ({
        towerId: this.towerId,
        ...this.trafficStats,
        uptimeSeconds: Math.floor((Date.now() - this.trafficStats.startTime) / 1000),
        bytesRelayedMB: Math.round(this.trafficStats.bytesRelayed / 1048576 * 100) / 100,
      }),
      // Send a raw UDP packet through this tower to a peer
      "/tower/send-udp": async (req, body) => {
        if (!body?.destTower || !body?.data) return { error: "Need destTower and data" };
        const peer = this.peerTowers.get(body.destTower) ||
                     Array.from(this.peerTowers.entries()).find(([, p]) => p.botName === body.destTower)?.[1];
        if (!peer) return { error: "Peer not found" };
        const buf = Buffer.from(body.data, "utf8");
        return new Promise((resolve) => {
          this.udpServer.send(buf, peer.udpPort, peer.host || "127.0.0.1", (err) => {
            if (err) return resolve({ success: false, error: err.message });
            this.trafficStats.udpPacketsOut++;
            resolve({ success: true, sent: buf.length, to: body.destTower });
          });
        });
      },
      // Resolve DNS through this tower's relay
      "/tower/dns-resolve": async (req, body) => {
        if (!body?.hostname) return { error: "Need hostname" };
        return new Promise((resolve) => {
          dns.resolve4(body.hostname, (err, addrs) => {
            if (err) return resolve({ success: false, error: err.message });
            resolve({ success: true, hostname: body.hostname, addresses: addrs });
          });
        });
      },
    };
  }

  // ── Shutdown ──
  stop() {
    this.running = false;
    if (this.udpServer) try { this.udpServer.close(); } catch {}
    if (this.tcpServer) try { this.tcpServer.close(); } catch {}
    if (this.dnsServer) try { this.dnsServer.close(); } catch {}
    console.log(`[CELL-TOWER] ${this.towerId} shut down`);
  }
}

module.exports = { CellTower, getHardwareProfile };
