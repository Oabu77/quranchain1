import { contentJson, OpenAPIRoute } from "chanfana";
import { AppContext } from "../../types";
import { z } from "zod";

export class MultipassVmStatus extends OpenAPIRoute {
public schema = {
tags: ["Multipass Fleet"],
summary: "Get detailed status and live health check for a specific Multipass VM",
description:
"Retrieves full VM specification from the D1 registry and performs a real-time health check " +
"against the VM's health endpoint (if status is 'running'). On successful health probe, " +
"updates the last_heartbeat timestamp. Returns the complete VM record plus health check results. " +
"Health checks have a 5-second timeout to avoid blocking.",
operationId: "multipass-vm-status",
request: {
params: z.object({
id: z.string().describe("VM identifier (matches the VM name, e.g. fungimesh-relay1)"),
}),
},
responses: {
"200": {
description: "VM record with live health probe results",
...contentJson(
z.object({
success: z.literal(true),
vm: z.object({
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
last_heartbeat: z.string().nullable(),
}),
health: z.object({
reachable: z.boolean(),
checked_at: z.string(),
response_ms: z.number().nullable(),
response: z.unknown().nullable(),
}),
execution_ms: z.number(),
}),
),
},
"404": {
description: "VM not found in the registry",
...contentJson(
z.object({
success: z.literal(false),
error: z.string(),
hint: z.string(),
}),
),
},
},
};

public async handle(c: AppContext) {
const started = Date.now();
const db = c.env.DB;
const data = await this.getValidatedData<typeof this.schema>();
const { id } = data.params;

const vm = await db
.prepare("SELECT * FROM multipass_vms WHERE id = ?")
.bind(id)
.first();

if (!vm) {
return c.json(
{
success: false as const,
error: `VM '${id}' not found in the fleet registry`,
hint: "Use GET /multipass/vms to list all registered VMs",
},
404,
);
}

// Real health check for running VMs
let health: { reachable: boolean; checked_at: string; response_ms: number | null; response: unknown } = {
reachable: false,
checked_at: new Date().toISOString(),
response_ms: null,
response: null,
};

if (vm.health_endpoint && vm.status === "running") {
const healthStart = Date.now();
try {
const res = await fetch(vm.health_endpoint as string, {
signal: AbortSignal.timeout(5000),
});
const data = await res.json();
health = {
reachable: true,
checked_at: new Date().toISOString(),
response_ms: Date.now() - healthStart,
response: data,
};

// Update heartbeat on successful probe
await db
.prepare(
"UPDATE multipass_vms SET last_heartbeat = ?, updated_at = ? WHERE id = ?",
)
.bind(new Date().toISOString(), new Date().toISOString(), id)
.run();
} catch {
health.reachable = false;
health.response_ms = Date.now() - healthStart;
}
}

return {
success: true as const,
vm,
health,
execution_ms: Date.now() - started,
};
}
}
