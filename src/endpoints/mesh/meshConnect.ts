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
.describe("Hardware class (e.g. leopard, standard, arm64, gpu-node)"),
region: z
.string()
.optional()
.describe("Geographic region (e.g. us-east, eu-west). Defaults to auto-detect."),
capabilities: z
.array(z.enum(["backup", "compute", "relay", "gateway", "validator"]))
.optional()
.describe("Node capabilities. Defaults to ['backup', 'relay']."),
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
};

// Persist in D1 with upsert semantics
const db = c.env.DB;
await db
.prepare(
`INSERT OR REPLACE INTO mesh_nodes (node_id, hardware, region, status, connected_at)
 VALUES (?, ?, ?, ?, ?)`,
)
.bind(
nodeRecord.node_id,
nodeRecord.hardware,
nodeRecord.region,
nodeRecord.status,
nodeRecord.connected_at,
)
.run();

return {
success: true as const,
node: nodeRecord,
execution_ms: Date.now() - started,
};
}
}
