import { contentJson, OpenAPIRoute } from "chanfana";
import { AppContext } from "../../types";
import { z } from "zod";

export class MultipassVmLaunch extends OpenAPIRoute {
public schema = {
tags: ["Multipass Fleet"],
summary: "Register and launch a new Multipass VM into the FungiMesh fleet",
description:
"Registers a new Multipass virtual machine in the D1 fleet registry. Validates the name is unique " +
"(returns 409 on conflict), assigns resource allocation (CPU, RAM, disk), and generates the exact " +
"shell command to execute on the Leopard host. The VM is created in 'launching' status and should " +
"be updated to 'running' after cloud-init completes. Each VM gets a local health endpoint.",
operationId: "multipass-vm-launch",
request: {
body: contentJson(
z.object({
name: z.string().min(3).max(64).describe("VM name (e.g. fungimesh-relay1). Must be unique."),
cpus: z.number().int().min(1).max(16).default(2).describe("vCPUs to allocate (1-16)"),
memory_mb: z.number().int().min(512).max(32768).default(2048).describe("RAM in MB (512-32768)"),
disk_gb: z.number().int().min(5).max(500).default(10).describe("Disk in GB (5-500)"),
image: z.string().default("ubuntu-24.04").describe("Ubuntu cloud image to use"),
role: z
.enum(["relay", "compute", "backup", "gateway"])
.default("relay")
.describe("FungiMesh role assignment"),
hardware: z.string().default("leopard").describe("Host hardware class"),
}),
),
},
responses: {
"201": {
description: "VM registered and launch command generated",
...contentJson(
z.object({
success: z.literal(true),
vm: z.object({
id: z.string(),
name: z.string(),
status: z.string(),
role: z.string(),
cpus: z.number(),
memory_mb: z.number(),
disk_gb: z.number(),
health_endpoint: z.string(),
}),
launch_command: z.string().describe("Shell command to run on host to create the VM"),
instructions: z.string(),
execution_ms: z.number(),
}),
),
},
"409": {
description: "VM with that name already exists in the registry",
...contentJson(
z.object({
success: z.literal(false),
error: z.string(),
existing_vm_id: z.string(),
}),
),
},
},
};

public async handle(c: AppContext) {
const started = Date.now();
const db = c.env.DB;
const validated = await this.getValidatedData<typeof this.schema>();
const body = validated.body;

const { name, cpus, memory_mb, disk_gb, image, role, hardware } = body;

// Check for duplicate
const existing = await db
.prepare("SELECT id FROM multipass_vms WHERE name = ?")
.bind(name)
.first();

if (existing) {
return c.json(
{
success: false as const,
error: `VM '${name}' already exists — use a different name or delete the existing VM first`,
existing_vm_id: existing.id as string,
},
409,
);
}

const id = name;
const healthEndpoint = `http://${name}.local:8080/health`;

await db
.prepare(
`INSERT INTO multipass_vms (id, name, cpus, memory_mb, disk_gb, image, role, status, hardware, health_endpoint)
 VALUES (?, ?, ?, ?, ?, ?, ?, 'launching', ?, ?)`,
)
.bind(id, name, cpus, memory_mb, disk_gb, image, role, hardware, healthEndpoint)
.run();

const memStr = memory_mb >= 1024 ? `${Math.round(memory_mb / 1024)}G` : `${memory_mb}M`;
const launchCmd = `bash multipass/launch.sh ${name} ${cpus} ${memStr} ${disk_gb}G`;

return c.json(
{
success: true as const,
vm: {
id,
name,
status: "launching",
role,
cpus,
memory_mb,
disk_gb,
health_endpoint: healthEndpoint,
},
launch_command: launchCmd,
instructions: `Execute on your ${hardware} host: ${launchCmd}`,
execution_ms: Date.now() - started,
},
201,
);
}
}
