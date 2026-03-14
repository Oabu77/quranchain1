import { contentJson, OpenAPIRoute } from "chanfana";
import { AppContext } from "../../types";
import { z } from "zod";

const MESH_UPSTREAM = "https://mesh.darcloud.host";

export class MeshConnect extends OpenAPIRoute {
public schema = {
tags: ["FungiMesh"],
summary: "Register and connect a new node to the FungiMesh encrypted mesh network",
description:
"Accepts a node registration request and persists it in the D1 mesh_nodes table. " +
"The node is assigned a 'connected' status and linked to the FungiMesh upstream. " +
"Validates that the node_id is unique — duplicate registrations are silently updated " +
"via INSERT OR REPLACE. Capabilities default to ['backup', 'relay'] if not specified. " +
"Returns the complete connection record with timestamps for audit trails.",
operationId: "mesh-node-connect",
request: {
body: contentJson(
z.object({
node_id: z
.string()
.min(3)
.max(64)
.describe("Unique node identifier (e.g. leopard-relay-01). Must be 3-64 chars."),
hardware: z
.string()
.min(1)
.describe("Hardware class (e.g. leopard, standard, arm64, gpu-node, docker, router, smart-device)"),
region: z
.string()
.optional()
.describe("Geographic region (e.g. us-east, eu-west). Defaults to auto-detect."),
capabilities: z
.array(z.enum(["backup", "compute", "relay", "gateway", "validator", "tower", "iot"]))
.optional()
.describe("Node capabilities. Defaults to ['backup', 'relay']."),
wireguard_pubkey: z
.string()
.optional()
.describe("WireGuard public key for mesh peering"),
wireguard_endpoint: z
.string()
.optional()
.describe("Public IP or hostname for WireGuard endpoint"),
listen_port: z
.number()
.optional()
.describe("WireGuard listen port. Defaults to 51820."),
mesh_ip: z
.string()
.optional()
.describe("Assigned mesh IP (e.g. 10.0.0.x/32)"),
role: z
.string()
.optional()
.describe("Node role: relay, gateway, tower, compute, iot. Defaults to relay."),
device_type: z
.string()
.optional()
.describe("Device type: linux, docker, router, access_point, smart_device, phone"),
firmware_version: z
.string()
.optional()
.describe("Current firmware version"),
}),
),
},
responses: {
"200": {
description: "Node successfully registered and connected to the mesh",
...contentJson(
z.object({
success: z.literal(true),
node: z.object({
node_id: z.string(),
hardware: z.string(),
status: z.string(),
region: z.string(),
capabilities: z.array(z.string()),
mesh_endpoint: z.string(),
connected_at: z.string(),
}),
execution_ms: z.number(),
}),
),
},
"400": {
description: "Invalid request body — validation failed",
...contentJson(
z.object({
success: z.literal(false),
error: z.string(),
}),
),
},
},
};

public async handle(c: AppContext) {
const started = Date.now();
const data = await this.getValidatedData<typeof this.schema>();
const body = data.body;

const nodeRecord = {
node_id: body.node_id,
hardware: body.hardware,
status: "connected",
mesh_endpoint: MESH_UPSTREAM,
connected_at: new Date().toISOString(),
region: body.region || "auto-detect",
capabilities: body.capabilities || ["backup", "relay"],
wireguard_pubkey: body.wireguard_pubkey || "",
wireguard_endpoint: body.wireguard_endpoint || "",
listen_port: body.listen_port || 51820,
mesh_ip: body.mesh_ip || "",
role: body.role || "relay",
device_type: body.device_type || "linux",
firmware_version: body.firmware_version || "1.0.0",
};

// Persist in D1 with upsert semantics — now includes WireGuard peering info
const db = c.env.DB;
await db
.prepare(
`INSERT OR REPLACE INTO mesh_nodes
 (node_id, hardware, region, status, connected_at, wireguard_pubkey, wireguard_endpoint,
  public_ip, listen_port, mesh_ip, role, device_type, firmware_version)
 VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
)
.bind(
nodeRecord.node_id,
nodeRecord.hardware,
nodeRecord.region,
nodeRecord.status,
nodeRecord.connected_at,
nodeRecord.wireguard_pubkey,
nodeRecord.wireguard_endpoint,
nodeRecord.wireguard_endpoint,
nodeRecord.listen_port,
nodeRecord.mesh_ip,
nodeRecord.role,
nodeRecord.device_type,
nodeRecord.firmware_version,
)
.run();

// Count total peers available for this node
const peerCount = await db
.prepare("SELECT COUNT(*) as cnt FROM mesh_nodes WHERE node_id != ? AND wireguard_pubkey != ''")
.bind(nodeRecord.node_id)
.first<{ cnt: number }>();

return {
success: true as const,
node: nodeRecord,
peers_available: peerCount?.cnt || 0,
peer_config_url: `/mesh/peers/${nodeRecord.node_id}`,
execution_ms: Date.now() - started,
};
}
}
