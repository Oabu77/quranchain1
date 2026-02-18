import { contentJson, OpenAPIRoute } from "chanfana";
import { AppContext } from "../../types";
import { z } from "zod";

export class MultipassFleetHealth extends OpenAPIRoute {
	public schema = {
		tags: ["Multipass"],
		summary: "Get aggregated fleet health status for all FungiMesh VMs",
		operationId: "multipass-fleet-health",
		responses: {
			"200": {
				description: "Fleet-wide health summary",
				...contentJson(
					z.object({
						success: z.boolean(),
						fleet: z.object({
							total: z.number(),
							by_status: z.record(z.string(), z.number()),
							by_role: z.record(z.string(), z.number()),
							total_cpus: z.number(),
							total_memory_mb: z.number(),
							total_disk_gb: z.number(),
							mesh_connected: z.number(),
							cloud_init_completed: z.number(),
						}),
						nodes: z.array(
							z.object({
								name: z.string(),
								role: z.string(),
								status: z.string(),
								ip_address: z.string().nullable(),
								mesh_node_id: z.string().nullable(),
								cloud_init_done: z.number(),
							}),
						),
						deploy_command: z.string(),
					}),
				),
			},
		},
	};

	public async handle(c: AppContext) {
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

		return {
			success: true,
			fleet: {
				total: vms.length,
				by_status: byStatus,
				by_role: byRole,
				total_cpus: totalCpus,
				total_memory_mb: totalMemory,
				total_disk_gb: totalDisk,
				mesh_connected: meshConnected,
				cloud_init_completed: cloudInitDone,
			},
			nodes: vms.map((vm) => ({
				name: vm.name,
				role: vm.role,
				status: vm.status,
				ip_address: vm.ip_address,
				mesh_node_id: vm.mesh_node_id,
				cloud_init_done: vm.cloud_init_done,
			})),
			deploy_command: "bash multipass/deploy-fleet.sh 5",
		};
	}
}
