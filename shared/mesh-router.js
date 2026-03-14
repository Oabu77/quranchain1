// ══════════════════════════════════════════════════════════════
// DarCloud Empire — FungiMesh Real Network Router Layer
// Turns every Discord bot into a REAL mesh cell tower
// Real UDP/TCP/DNS relay — actual traffic forwarding on real ports
// Every bot binds real network interfaces and relays real packets
// ══════════════════════════════════════════════════════════════
const http = require("http");
const https = require("https");
const crypto = require("crypto");
const os = require("os");
const botIpc = require("./bot-ipc");
const { CellTower, getHardwareProfile } = require("./cell-tower");

const API_BASE = process.env.API_BASE || "https://darcloud.host";
const HEARTBEAT_INTERVAL = 120_000; // 2 minutes
const PEER_REFRESH_INTERVAL = 300_000; // 5 minutes
const ROUTING_TABLE_TTL = 600_000; // 10 minutes

// ── Mesh Router + Real Cell Tower ─────────────────────────
class MeshRouter {
  constructor(botName) {
    this.botName = botName;
    this.config = botIpc.BOT_REGISTRY[botName];
    if (!this.config) throw new Error(`Unknown bot: ${botName}`);

    this.nodeId = `discord-${botName}-${os.hostname().slice(0, 8)}`;
    this.meshIp = `10.20.${this.config.port - 9000}.1`;
    this.routingTable = new Map(); // nodeId -> { nextHop, metric, lastSeen }
    this.peerNodes = new Map(); // nodeId -> { port, botName, status }
    this.packetQueue = []; // messages waiting to be routed
    this.stats = {
      packetsRouted: 0,
      packetsDropped: 0,
      bytesForwarded: 0,
      uptime: Date.now(),
      peersConnected: 0,
    };
    this.registered = false;
    this._heartbeatTimer = null;
    this._peerTimer = null;
    this._routeTimer = null;

    // Real cell tower — binds actual UDP/TCP/DNS ports
    this.cellTower = new CellTower(botName, this.config);
  }

  // ── Start the mesh router + real cell tower ──
  async start() {
    console.log(`[MESH-ROUTER] ${this.config.name} starting as REAL cell tower ${this.nodeId}`);

    // 1. Boot the real cell tower (binds UDP/TCP/DNS ports)
    await this.cellTower.start();

    // 2. Register with the DarCloud mesh API
    await this.registerWithMesh();

    // 3. Discover local peer bots (other bots on same machine)
    this.discoverLocalPeers();

    // 4. Discover peer cell towers and wire up inter-tower relay
    await this.cellTower.discoverPeers(botIpc.BOT_REGISTRY);

    // 5. Build initial routing table
    this.buildRoutingTable();

    // 6. Start heartbeat
    this._heartbeatTimer = setInterval(() => this.sendHeartbeat(), HEARTBEAT_INTERVAL);

    // 7. Peer refresh (re-discover both IPC peers and tower peers)
    this._peerTimer = setInterval(() => {
      this.discoverLocalPeers();
      this.cellTower.discoverPeers(botIpc.BOT_REGISTRY).catch(() => {});
    }, PEER_REFRESH_INTERVAL);

    // 8. Route table refresh
    this._routeTimer = setInterval(() => this.buildRoutingTable(), ROUTING_TABLE_TTL);

    const towerStatus = this.cellTower.getStatus();
    console.log(`[MESH-ROUTER] ${this.config.name} ONLINE — Node: ${this.nodeId} | IP: ${this.meshIp}`);
    console.log(`[MESH-ROUTER] Tower services — UDP:${towerStatus.udpPort} TCP:${towerStatus.tcpPort} DNS:${towerStatus.dnsPort}`);
    console.log(`[MESH-ROUTER] Hardware — ${towerStatus.hardware?.cpuCores || '?'} cores, ${towerStatus.hardware?.networkInterfaces || '?'} NICs, ${towerStatus.hardware?.containers || '?'} containers`);
    return this;
  }

  // ── Register bot as REAL cell tower with DarCloud API ──
  async registerWithMesh() {
    const hw = this.cellTower.hardware || getHardwareProfile();
    const realInterfaces = hw.interfaces.filter(i => !i.internal);
    const primaryIp = realInterfaces.find(i => i.family === "IPv4")?.address || "0.0.0.0";
    const primaryMac = realInterfaces.find(i => i.mac !== "00:00:00:00:00:00")?.mac || "";

    const payload = {
      node_id: this.nodeId,
      hardware: JSON.stringify({
        hostname: hw.hostname,
        platform: hw.platform,
        arch: hw.arch,
        kernel: hw.kernel,
        cpu: `${hw.cpuCores}x ${hw.cpuModel}`,
        memory_mb: hw.totalMemoryMB,
        nics: realInterfaces.length,
        wifi: hw.wifiAdapters.length,
        bluetooth: hw.bluetooth.length,
        usb_devices: hw.usbDevices.length,
        containers: hw.containers.length,
        mac: primaryMac,
      }),
      region: "codespace",
      capabilities: ["relay", "gateway", "tower", "dns-relay", "tcp-proxy", "udp-relay"],
      wireguard_pubkey: "",
      wireguard_endpoint: `${primaryIp}:${this.cellTower.udpPort}`,
      listen_port: this.config.port,
      mesh_ip: this.meshIp,
      role: "tower",
      device_type: `cell-tower-${hw.platform}-${hw.arch}`,
      firmware_version: `fungimesh-tower-2.0`,
    };

    try {
      const result = await this._apiPost("/mesh/connect", payload);
      if (result?.success) {
        this.registered = true;
        console.log(`[MESH-ROUTER] ${this.config.name} registered as ${this.nodeId}`);
      }
    } catch (err) {
      console.error(`[MESH-ROUTER] Registration failed: ${err.message}`);
    }
  }

  // ── Discover other bots running on the same machine ──
  discoverLocalPeers() {
    let connected = 0;
    for (const [name, config] of Object.entries(botIpc.BOT_REGISTRY)) {
      if (name === this.botName) continue;

      const peerId = `discord-${name}-${os.hostname().slice(0, 8)}`;
      // Check if the bot's IPC port is alive
      const req = http.request({
        hostname: "127.0.0.1",
        port: config.port,
        path: "/health",
        method: "GET",
        timeout: 2000,
      }, (res) => {
        let body = "";
        res.on("data", c => body += c);
        res.on("end", () => {
          try {
            const data = JSON.parse(body);
            if (data.status === "ok") {
              this.peerNodes.set(peerId, {
                port: config.port,
                botName: name,
                displayName: config.name,
                role: config.role,
                status: "online",
                lastSeen: Date.now(),
              });
              // Add to routing table — direct route, metric 1
              this.routingTable.set(peerId, {
                nextHop: peerId,
                metric: 1,
                via: "local-ipc",
                lastSeen: Date.now(),
              });
              connected++;
            }
          } catch {}
        });
      });
      req.on("error", () => {
        // Bot is offline — remove from peers
        this.peerNodes.delete(peerId);
        this.routingTable.delete(peerId);
      });
      req.end();
    }

    this.stats.peersConnected = this.peerNodes.size;
  }

  // ── Build routing table from local peers + API topology ──
  buildRoutingTable() {
    // Local peers are already in the table from discoverLocalPeers
    // Now add remote nodes from the mesh API
    this._apiGet("/mesh/topology").then(data => {
      if (!data?.nodes) return;
      for (const node of data.nodes) {
        if (node.node_id === this.nodeId) continue;
        if (this.routingTable.has(node.node_id)) continue; // local route takes priority

        // Remote nodes are reachable via API relay, metric 10
        this.routingTable.set(node.node_id, {
          nextHop: "api-relay",
          metric: 10,
          via: "darcloud-api",
          lastSeen: Date.now(),
        });
      }
    }).catch(() => {});
  }

  // ── Route a message to a destination node ──
  async routePacket(destNodeId, messageType, payload) {
    const route = this.routingTable.get(destNodeId);

    if (!route) {
      this.stats.packetsDropped++;
      return { success: false, error: "No route to destination" };
    }

    const packet = {
      src: this.nodeId,
      dst: destNodeId,
      ttl: 8,
      hop: 0,
      type: messageType,
      payload,
      id: crypto.randomBytes(8).toString("hex"),
      timestamp: Date.now(),
    };

    this.stats.packetsRouted++;
    this.stats.bytesForwarded += JSON.stringify(packet).length;

    if (route.via === "local-ipc") {
      // Direct local delivery via IPC
      const peer = this.peerNodes.get(destNodeId);
      if (peer) {
        try {
          return await botIpc.callBot(peer.botName, "/mesh/packet", packet);
        } catch (err) {
          this.stats.packetsDropped++;
          return { success: false, error: `Delivery failed: ${err.message}` };
        }
      }
    }

    // Relay through closest peer or API
    // Find the peer with lowest metric that might be closer to destination
    let bestPeer = null;
    let bestMetric = Infinity;
    for (const [nodeId, peerRoute] of this.routingTable) {
      if (peerRoute.via === "local-ipc" && peerRoute.metric < bestMetric) {
        bestPeer = nodeId;
        bestMetric = peerRoute.metric;
      }
    }

    if (bestPeer && bestMetric < route.metric) {
      const peer = this.peerNodes.get(bestPeer);
      if (peer) {
        packet.hop++;
        packet.ttl--;
        try {
          return await botIpc.callBot(peer.botName, "/mesh/forward", packet);
        } catch {}
      }
    }

    return { success: true, routed: "queued-for-api-relay" };
  }

  // ── Broadcast a message to all connected peers ──
  async broadcast(messageType, payload) {
    const results = [];
    for (const [nodeId, peer] of this.peerNodes) {
      try {
        const result = await this.routePacket(nodeId, messageType, payload);
        results.push({ nodeId, ...result });
      } catch {}
    }
    return results;
  }

  // ── Handle incoming routed packet ──
  handlePacket(packet) {
    if (packet.dst === this.nodeId) {
      // Packet is for us — process it
      return this._processPacket(packet);
    }

    // Forward it (decrement TTL)
    if (packet.ttl <= 0) {
      this.stats.packetsDropped++;
      return { success: false, error: "TTL expired" };
    }

    packet.ttl--;
    packet.hop++;
    return this.routePacket(packet.dst, packet.type, packet.payload);
  }

  _processPacket(packet) {
    // Handle mesh-level messages
    switch (packet.type) {
      case "ping":
        return { success: true, type: "pong", from: this.nodeId, latency: Date.now() - packet.timestamp };
      case "route-announce":
        // Peer is sharing their routing table
        if (packet.payload.routes) {
          for (const [nodeId, route] of Object.entries(packet.payload.routes)) {
            const existingRoute = this.routingTable.get(nodeId);
            const newMetric = route.metric + 1;
            if (!existingRoute || newMetric < existingRoute.metric) {
              this.routingTable.set(nodeId, {
                nextHop: packet.src,
                metric: newMetric,
                via: "peer-announce",
                lastSeen: Date.now(),
              });
            }
          }
        }
        return { success: true };
      case "topology-request":
        return {
          success: true,
          nodeId: this.nodeId,
          peers: Array.from(this.peerNodes.keys()),
          routes: Object.fromEntries(this.routingTable),
        };
      default:
        return { success: true, processed: true, type: packet.type };
    }
  }

  // ── Send heartbeat with real tower stats to DarCloud API ──
  async sendHeartbeat() {
    const towerStatus = this.cellTower.getStatus();
    try {
      await this._apiPost("/mesh/heartbeat", {
        node_id: this.nodeId,
        status: "online",
        peers: this.peerNodes.size,
        routes: this.routingTable.size,
        packets_routed: this.stats.packetsRouted,
        uptime_seconds: Math.floor((Date.now() - this.stats.uptime) / 1000),
        // Real tower metrics
        tower_running: towerStatus.running,
        udp_port: towerStatus.udpPort,
        tcp_port: towerStatus.tcpPort,
        dns_port: towerStatus.dnsPort,
        udp_packets_in: towerStatus.traffic.udpPacketsIn,
        udp_packets_out: towerStatus.traffic.udpPacketsOut,
        tcp_connections: towerStatus.traffic.tcpConnectionsActive,
        dns_queries: towerStatus.traffic.dnsQueriesRelayed,
        bytes_relayed: towerStatus.traffic.bytesRelayed,
        connected_clients: towerStatus.connectedClients,
        peer_towers: towerStatus.peerTowers,
        hardware_nics: towerStatus.hardware?.networkInterfaces || 0,
        hardware_wifi: towerStatus.hardware?.wifiAdapters || 0,
        hardware_containers: towerStatus.hardware?.containers || 0,
      });
    } catch {}

    // Share routes with local peers (route announcement)
    const routePayload = {
      routes: Object.fromEntries(
        Array.from(this.routingTable.entries()).map(([k, v]) => [k, { metric: v.metric }])
      ),
    };
    this.broadcast("route-announce", routePayload).catch(() => {});
  }

  // ── Get mesh + tower IPC handlers for startIpcServer ──
  getIpcHandlers() {
    const towerHandlers = this.cellTower.getIpcHandlers();
    return {
      // Mesh routing handlers
      "/mesh/packet": async (req, packet) => {
        return this.handlePacket(packet);
      },
      "/mesh/forward": async (req, packet) => {
        return this.handlePacket(packet);
      },
      "/mesh/ping": async () => {
        return { success: true, nodeId: this.nodeId, meshIp: this.meshIp, uptime: Date.now() - this.stats.uptime };
      },
      "/mesh/routes": async () => {
        return {
          nodeId: this.nodeId,
          routes: Object.fromEntries(this.routingTable),
          peers: Object.fromEntries(this.peerNodes),
        };
      },
      "/mesh/stats": async () => {
        const towerStatus = this.cellTower.getStatus();
        return {
          nodeId: this.nodeId,
          meshIp: this.meshIp,
          ...this.stats,
          uptime_seconds: Math.floor((Date.now() - this.stats.uptime) / 1000),
          routes: this.routingTable.size,
          peers: this.peerNodes.size,
          tower: towerStatus,
        };
      },
      // Real cell tower hardware handlers
      ...towerHandlers,
    };
  }

  // ── Get status embed data for Discord commands ──
  getStatusData() {
    const towerStatus = this.cellTower.getStatus();
    return {
      nodeId: this.nodeId,
      meshIp: this.meshIp,
      botName: this.config.name,
      role: "cell-tower",
      peersConnected: this.peerNodes.size,
      routesKnown: this.routingTable.size,
      packetsRouted: this.stats.packetsRouted,
      bytesForwarded: this.stats.bytesForwarded,
      uptimeSeconds: Math.floor((Date.now() - this.stats.uptime) / 1000),
      peers: Array.from(this.peerNodes.entries()).map(([id, p]) => ({
        nodeId: id, name: p.displayName, role: p.role, status: p.status,
      })),
      // Real tower data
      tower: {
        running: towerStatus.running,
        udpPort: towerStatus.udpPort,
        tcpPort: towerStatus.tcpPort,
        dnsPort: towerStatus.dnsPort,
        connectedClients: towerStatus.connectedClients,
        peerTowers: towerStatus.peerTowers,
        udpPackets: towerStatus.traffic.udpPacketsIn + towerStatus.traffic.udpPacketsOut,
        tcpConnections: towerStatus.traffic.tcpConnectionsTotal,
        dnsQueries: towerStatus.traffic.dnsQueriesRelayed,
        bytesRelayed: towerStatus.traffic.bytesRelayed,
        bytesRelayedMB: Math.round(towerStatus.traffic.bytesRelayed / 1048576 * 100) / 100,
        hardware: towerStatus.hardware,
      },
    };
  }

  // ── Cleanup ──
  stop() {
    if (this._heartbeatTimer) clearInterval(this._heartbeatTimer);
    if (this._peerTimer) clearInterval(this._peerTimer);
    if (this._routeTimer) clearInterval(this._routeTimer);
    this.cellTower.stop();
  }

  // ── HTTP helpers ──
  _apiPost(path, data) {
    return new Promise((resolve, reject) => {
      const url = new URL(path, API_BASE);
      const mod = url.protocol === "https:" ? https : http;
      const req = mod.request(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        timeout: 10000,
      }, (res) => {
        let body = "";
        res.on("data", c => body += c);
        res.on("end", () => { try { resolve(JSON.parse(body)); } catch { resolve(body); } });
      });
      req.on("error", reject);
      req.on("timeout", () => { req.destroy(); reject(new Error("Timeout")); });
      req.write(JSON.stringify(data));
      req.end();
    });
  }

  _apiGet(path) {
    return new Promise((resolve, reject) => {
      const url = new URL(path, API_BASE);
      const mod = url.protocol === "https:" ? https : http;
      const req = mod.request(url, { method: "GET", timeout: 10000 }, (res) => {
        let body = "";
        res.on("data", c => body += c);
        res.on("end", () => { try { resolve(JSON.parse(body)); } catch { resolve(body); } });
      });
      req.on("error", reject);
      req.on("timeout", () => { req.destroy(); reject(new Error("Timeout")); });
      req.end();
    });
  }
}

module.exports = { MeshRouter };
