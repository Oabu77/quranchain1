import { contentJson, OpenAPIRoute } from "chanfana";
import { AppContext } from "../../types";
import { z } from "zod";

export class WifiGatewayRegister extends OpenAPIRoute {
  public schema = {
    tags: ["WiFi Gateway"],
    summary: "Register a WiFi gateway node with B.A.T.M.A.N. mesh",
    operationId: "wifi-gateway-register",
    request: {
      body: contentJson(
        z.object({
          node_id: z.string().min(3).max(64),
          hostname: z.string().optional(),
          hardware: z.string().default("unknown"),
          region: z.string().default("auto"),
          ap_ssid: z.string().optional(),
          ap_channel: z.number().default(6),
          wifi_mode: z.string().default("single-radio"),
          batman_gw_mode: z.string().default("client"),
          mesh_ssid: z.string().default("FungiMesh-Backhaul"),
          wireguard_pubkey: z.string().optional(),
          wireguard_ip: z.string().optional(),
          public_ip: z.string().optional(),
        }),
      ),
    },
    responses: {
      "200": {
        description: "Gateway registered",
        ...contentJson(z.object({ success: z.literal(true), node_id: z.string() })),
      },
    },
  };

  public async handle(c: AppContext) {
    const data = await this.getValidatedData<typeof this.schema>();
    const b = data.body;
    const now = new Date().toISOString();
    const db = c.env.DB;

    await db
      .prepare(
        `INSERT OR REPLACE INTO wifi_gateways
         (node_id, hostname, hardware, region, ap_ssid, ap_channel, wifi_mode,
          batman_gw_mode, mesh_ssid, wireguard_pubkey, wireguard_ip, public_ip,
          status, registered_at, last_heartbeat)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'online', ?, ?)`,
      )
      .bind(
        b.node_id, b.hostname || b.node_id, b.hardware, b.region,
        b.ap_ssid || "DarCloud-WiFi", b.ap_channel, b.wifi_mode,
        b.batman_gw_mode, b.mesh_ssid, b.wireguard_pubkey || "",
        b.wireguard_ip || "", b.public_ip || "", now, now,
      )
      .run();

    return { success: true as const, node_id: b.node_id };
  }
}

export class WifiGatewayHeartbeat extends OpenAPIRoute {
  public schema = {
    tags: ["WiFi Gateway"],
    summary: "WiFi gateway heartbeat with client/traffic stats",
    operationId: "wifi-gateway-heartbeat",
    request: {
      body: contentJson(
        z.object({
          node_id: z.string(),
          wifi_clients: z.number().default(0),
          dhcp_leases: z.number().default(0),
          batman_neighbors: z.number().default(0),
          bytes_forwarded: z.number().default(0),
          uptime_seconds: z.number().default(0),
        }),
      ),
    },
    responses: {
      "200": {
        description: "Heartbeat acknowledged",
        ...contentJson(z.object({ success: z.literal(true), node_id: z.string() })),
      },
    },
  };

  public async handle(c: AppContext) {
    const data = await this.getValidatedData<typeof this.schema>();
    const b = data.body;
    const now = new Date().toISOString();
    const db = c.env.DB;

    await db
      .prepare(
        `UPDATE wifi_gateways SET
         status = 'online', last_heartbeat = ?, wifi_clients = ?,
         dhcp_leases = ?, batman_neighbors = ?, bytes_forwarded = ?,
         uptime_seconds = ? WHERE node_id = ?`,
      )
      .bind(now, b.wifi_clients, b.dhcp_leases, b.batman_neighbors, b.bytes_forwarded, b.uptime_seconds, b.node_id)
      .run();

    return { success: true as const, node_id: b.node_id };
  }
}

export class WifiGatewayStatus extends OpenAPIRoute {
  public schema = {
    tags: ["WiFi Gateway"],
    summary: "Get WiFi gateway mesh network status",
    operationId: "wifi-gateway-status",
    responses: {
      "200": {
        description: "WiFi gateway mesh status",
        ...contentJson(
          z.object({
            success: z.literal(true),
            gateways: z.object({
              total: z.number(),
              online: z.number(),
              total_wifi_clients: z.number(),
              total_bytes_forwarded: z.number(),
            }),
            nodes: z.array(z.any()),
          }),
        ),
      },
    },
  };

  public async handle(c: AppContext) {
    const db = c.env.DB;
    let nodes: any[] = [];
    let total = 0, online = 0, totalClients = 0, totalBytes = 0;

    try {
      const result = await db.prepare("SELECT * FROM wifi_gateways ORDER BY last_heartbeat DESC").all();
      nodes = result.results || [];
      total = nodes.length;
      for (const n of nodes) {
        if (n.status === "online") online++;
        totalClients += (n.wifi_clients as number) || 0;
        totalBytes += (n.bytes_forwarded as number) || 0;
      }
    } catch {
      // Table may not exist yet
    }

    return {
      success: true as const,
      gateways: { total, online, total_wifi_clients: totalClients, total_bytes_forwarded: totalBytes },
      nodes,
    };
  }
}

export class WifiGatewayClients extends OpenAPIRoute {
  public schema = {
    tags: ["WiFi Gateway"],
    summary: "Get WiFi clients connected across all gateways",
    operationId: "wifi-gateway-clients",
    responses: {
      "200": {
        description: "Connected WiFi clients",
        ...contentJson(
          z.object({
            success: z.literal(true),
            total: z.number(),
            clients: z.array(z.any()),
          }),
        ),
      },
    },
  };

  public async handle(c: AppContext) {
    const db = c.env.DB;
    let clients: any[] = [];

    try {
      const result = await db
        .prepare("SELECT * FROM wifi_clients WHERE status = 'connected' ORDER BY session_start DESC LIMIT 100")
        .all();
      clients = result.results || [];
    } catch {
      // Table may not exist yet
    }

    return { success: true as const, total: clients.length, clients };
  }
}
