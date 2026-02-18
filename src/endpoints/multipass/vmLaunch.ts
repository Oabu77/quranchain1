import { contentJson, OpenAPIRoute } from "chanfana";
import { AppContext } from "../../types";
import { z } from "zod";

export class MultipassVmLaunch extends OpenAPIRoute {
	public schema = {
		tags: ["Multipass"],
		summary: "Register a new Multipass VM launch for FungiMesh",
		operationId: "multipass-vm-launch",
		request: {
			body: {
				content: {
					"application/json": {
						schema: z.object({
							name: z.string().describe("VM name (e.g. fungimesh-relay1)"),
							cpus: z.number().default(2).describe("vCPUs to allocate"),
							memory_mb: z.number().default(2048).describe("RAM in MB"),
							disk_gb: z.number().default(10).describe("Disk in GB"),
							image: z.string().default("ubuntu-24.04").describe("Ubuntu image"),
							role: z
								.enum(["relay", "compute", "backup", "gateway"])
								.default("relay")
								.describe("Node role in FungiMesh"),
							hardware: z.string().default("leopard").describe("Host hardware"),
						}),
					},
				},
			},
		},
		responses: {
			"201": {
				description: "VM launch registered",
				...contentJson(
					z.object({
						success: z.boolean(),
						vm: z.object({
							id: z.string(),
							name: z.string(),
							status: z.string(),
							role: z.string(),
							health_endpoint: z.string(),
						}),
						launch_command: z.string(),
						instructions: z.string(),
					}),
				),
			},
			"409": {
				description: "VM with that name already exists",
				...contentJson(
					z.object({
						success: z.boolean(),
						error: z.string(),
					}),
				),
			},
		},
	};

	public async handle(c: AppContext) {
		const db = c.env.DB;
		const body = await c.req.json() as {
			name: string;
			cpus?: number;
			memory_mb?: number;
			disk_gb?: number;
			image?: string;
			role?: string;
			hardware?: string;
		};

		const name = body.name;
		const cpus = body.cpus ?? 2;
		const memory_mb = body.memory_mb ?? 2048;
		const disk_gb = body.disk_gb ?? 10;
		const image = body.image ?? "ubuntu-24.04";
		const role = body.role ?? "relay";
		const hardware = body.hardware ?? "leopard";

		// Check for existing VM
		const existing = await db
			.prepare("SELECT id FROM multipass_vms WHERE name = ?")
			.bind(name)
			.first();

		if (existing) {
			return c.json({ success: false, error: `VM '${name}' already exists` }, 409);
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
				success: true,
				vm: {
					id,
					name,
					status: "launching",
					role,
					health_endpoint: healthEndpoint,
				},
				launch_command: launchCmd,
				instructions: `Run from your Leopard host: ${launchCmd}`,
			},
			201,
		);
	}
}
