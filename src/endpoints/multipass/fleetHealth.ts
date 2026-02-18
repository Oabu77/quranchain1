import { contentJson, OpenAPIRoute } from "chanfana";
import { AppContext } from "../../types";
import { z } from "zod";

export class MultipassFleetHealth extends OpenAPIRoute {
public schema = {
tags: ["Multipass Fleet"],
summary: "Aggregated fleet health — resource totals, status breakdown, and mesh connectivity",
description:
"Computes a real-time aggregate view of the entire Multipass VM fleet from D1. " +
"Reports total allocated resources (CPUs, RAM, disk), per-status and per-role breakdowns, " +
"mesh connectivity ratios, and cloud-init completion rates. Use this as the single " +
"dashboard endpoint for fleet capacity planning and operational health.",
operationId: "multipass-fleet-health",
responses: {
"200": {
description: "Complete fleet summary with resource allocation and connectivity metrics",
...contentJson(
z.object({
success: z.literal(true),
fleet: z.object({
total: z.number(),
by_status: z.record(z.string(), z.number()),
by_role: z.record(z.string(), z.number()),
resources: z.object({
total_cpus: z.number(),
total_memory_mb: z.number(),
total_memory_human: z.string(),
total_disk_gb: z.number(),
}),
mesh_connected: z.number(),
mesh_connected_pct: z.number(),
cloud_init_completed: z.number(),
cloud_init_pct: z.number(),
}),
nodes: z.array(
z.object({
name: z.string(),
role: z.string(),
status: z.string(),
cpus: z.number(),
memory_mb: z.number(),
ip_address: z.string().nullable(),
mesh_node_id: z.string().nullable(),
cloud_init_done: z.number(),
}),
),
deploy_command: z.string().describe("Shell command to deploy the full fleet"),
execution_ms: z.number(),
}),
),
},
},
};

public async handle(c: AppContext) {
const started = Date.now();
const db = c.env.DB;

const all = await db
.prepare("SELECT * FROM multipass_vms ORDER BY name")
.all();

const vms = all.results as Array<{
name: string;
role: string;
status: string;
cpus: number;
memory_mb: number;
disk_gb: number;
ip_address: string | null;
mesh_node_id: string | null;
cloud_init_done: number;
}>;

const byStatus: Record<string, number> = {};
const byRole: Record<string, number> = {};
let totalCpus = 0;
let totalMemory = 0;
let totalDisk = 0;
let meshConnected = 0;
let cloudInitDone = 0;

for (const vm of vms) {
byStatus[vm.status] = (byStatus[vm.status] || 0) + 1;
byRole[vm.role] = (byRole[vm.role] || 0) + 1;
totalCpus += vm.cpus;
totalMemory += vm.memory_mb;
totalDisk += vm.disk_gb;
if (vm.mesh_node_id) meshConnected++;
if (vm.cloud_init_done) cloudInitDone++;
}

const total = vms.length;
const memoryHuman = totalMemory >= 1024
? `${(totalMemory / 1024).toFixed(1)} GB`
: `${totalMemory} MB`;

return {
success: true as const,
fleet: {
total,
by_status: byStatus,
by_role: byRole,
resources: {
total_cpus: totalCpus,
total_memory_mb: totalMemory,
total_memory_human: memoryHuman,
total_disk_gb: totalDisk,
},
mesh_connected: meshConnected,
mesh_connected_pct: total > 0 ? Math.round((meshConnected / total) * 100) : 0,
cloud_init_completed: cloudInitDone,
cloud_init_pct: total > 0 ? Math.round((cloudInitDone / total) * 100) : 0,
},
nodes: vms.map((vm) => ({
name: vm.name,
role: vm.role,
status: vm.status,
cpus: vm.cpus,
memory_mb: vm.memory_mb,
ip_address: vm.ip_address,
mesh_node_id: vm.mesh_node_id,
cloud_init_done: vm.cloud_init_done,
})),
deploy_command: "bash multipass/deploy-fleet.sh 5",
execution_ms: Date.now() - started,
};
}
}
