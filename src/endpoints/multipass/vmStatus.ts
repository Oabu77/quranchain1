import { contentJson, OpenAPIRoute } from "chanfana";
import { AppContext } from "../../types";
import { z } from "zod";

export class MultipassVmStatus extends OpenAPIRoute {
	public schema = {
		tags: ["Multipass"],
		summary: "Get status of a specific Multipass VM",
		operationId: "multipass-vm-status",
		request: {
			params: z.object({
				id: z.string().describe("VM identifier (e.g. fungimesh-relay1)"),
			}),
		},
		responses: {
			"200": {
				description: "VM status with health check",
				...contentJson(
					z.object({
						success: z.boolean(),
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
							response: z.unknown().nullable(),
						}),
					}),
				),
			},
			"404": {
				description: "VM not found",
				...contentJson(
					z.object({ success: z.boolean(), error: z.string() }),
				),
			},
		},
	};

	public async handle(c: AppContext) {
		const db = c.env.DB;
		const { id } = c.req.param() as { id: string };

		const vm = await db
			.prepare("SELECT * FROM multipass_vms WHERE id = ?")
			.bind(id)
			.first();

		if (!vm) {
			return c.json({ success: false, error: `VM '${id}' not found` }, 404);
		}

		// Try health check if the VM has an endpoint
		let health: { reachable: boolean; checked_at: string; response: unknown } = {
			reachable: false,
			checked_at: new Date().toISOString(),
			response: null,
		};

		if (vm.health_endpoint && vm.status === "running") {
			try {
				const res = await fetch(vm.health_endpoint as string, {
					signal: AbortSignal.timeout(5000),
				});
				const data = await res.json();
				health = {
					reachable: true,
					checked_at: new Date().toISOString(),
					response: data,
				};

				// Update heartbeat
				await db
					.prepare(
						"UPDATE multipass_vms SET last_heartbeat = ?, updated_at = ? WHERE id = ?",
					)
					.bind(new Date().toISOString(), new Date().toISOString(), id)
					.run();
			} catch {
				health.reachable = false;
			}
		}

		return {
			success: true,
			vm,
			health,
		};
	}
}
