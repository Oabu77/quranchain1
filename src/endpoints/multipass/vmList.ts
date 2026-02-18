import { contentJson, OpenAPIRoute } from "chanfana";
import { AppContext } from "../../types";
import { z } from "zod";

export class MultipassVmList extends OpenAPIRoute {
public schema = {
tags: ["Multipass Fleet"],
summary: "List all Multipass VMs in the FungiMesh fleet with status and role filtering",
description:
"Queries the D1 registry of Multipass virtual machines that form the FungiMesh compute layer. " +
"Supports filtering by operational status (planned, launching, running, stopped, error) and " +
"by mesh role (relay, compute, backup, gateway). Returns full VM specs including CPU, RAM, " +
"disk, WireGuard keys, and mesh connectivity state. Use this to audit fleet capacity.",
operationId: "multipass-vm-list",
request: {
query: z.object({
status: z
.enum(["planned", "launching", "running", "stopped", "error"])
.optional()
.describe("Filter VMs by operational status"),
role: z
.enum(["relay", "compute", "backup", "gateway"])
.optional()
.describe("Filter VMs by FungiMesh role"),
}),
},
responses: {
"200": {
description: "Filtered VM list with specs and mesh connectivity info",
...contentJson(
z.object({
success: z.literal(true),
total: z.number().describe("Number of VMs matching the filter"),
filters_applied: z.record(z.string()).describe("Active query filters"),
vms: z.array(
z.object({
id: z.string(),
name: z.string(),
cpus: z.number(),
memory_mb: z.number(),
disk_gb: z.number(),
image: z.string(),
ip_address: z.string().nullable(),
wireguard_pubkey: z.string().nullable(),
mesh_node_id: z.string().nullable(),
role: z.string(),
status: z.string(),
hardware: z.string(),
health_endpoint: z.string().nullable(),
cloud_init_done: z.number(),
created_at: z.string(),
updated_at: z.string(),
}),
),
execution_ms: z.number(),
}),
),
},
},
};

public async handle(c: AppContext) {
const started = Date.now();
const db = c.env.DB;
const data = await this.getValidatedData<typeof this.schema>();
const { status, role } = data.query;

let sql = "SELECT * FROM multipass_vms";
const conditions: string[] = [];
const params: string[] = [];
const filtersApplied: Record<string, string> = {};

if (status) {
conditions.push("status = ?");
params.push(status);
filtersApplied.status = status;
}
if (role) {
conditions.push("role = ?");
params.push(role);
filtersApplied.role = role;
}

if (conditions.length > 0) {
sql += " WHERE " + conditions.join(" AND ");
}
sql += " ORDER BY name";

const stmt = db.prepare(sql);
const result = params.length > 0 ? await stmt.bind(...params).all() : await stmt.all();

return {
success: true as const,
total: result.results.length,
filters_applied: filtersApplied,
vms: result.results,
execution_ms: Date.now() - started,
};
}
}
