import { contentJson, OpenAPIRoute } from "chanfana";
import { AppContext } from "../../types";
import { z } from "zod";

export class MultipassVmList extends OpenAPIRoute {
	public schema = {
		tags: ["Multipass"],
		summary: "List all Multipass VMs in the FungiMesh fleet",
		operationId: "multipass-vm-list",
		request: {
			query: z.object({
				status: z.string().optional().describe("Filter by VM status (planned, launching, running, stopped, error)"),
				role: z.string().optional().describe("Filter by role (relay, compute, backup, gateway)"),
			}),
		},
		responses: {
			"200": {
				description: "All registered Multipass VMs",
				...contentJson(
					z.object({
						success: z.boolean(),
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
						total: z.number(),
					}),
				),
			},
		},
	};

	public async handle(c: AppContext) {
		const db = c.env.DB;
		const { status, role } = c.req.query() as { status?: string; role?: string };

		let sql = "SELECT * FROM multipass_vms";
		const conditions: string[] = [];
		const params: string[] = [];

		if (status) {
			conditions.push("status = ?");
			params.push(status);
		}
		if (role) {
			conditions.push("role = ?");
			params.push(role);
		}

		if (conditions.length > 0) {
			sql += " WHERE " + conditions.join(" AND ");
		}
		sql += " ORDER BY name";

		const stmt = db.prepare(sql);
		const result = params.length > 0 ? await stmt.bind(...params).all() : await stmt.all();

		return {
			success: true,
			vms: result.results,
			total: result.results.length,
		};
	}
}
