import { contentJson, OpenAPIRoute } from "chanfana";
import { AppContext } from "../../types";
import { z } from "zod";

export class MeshHeartbeat extends OpenAPIRoute {
	public schema = {
		tags: ["FungiMesh"],
		summary: "Receive a heartbeat from a FungiMesh node and update its last_heartbeat timestamp",
		description:
			"Called periodically by mesh nodes (Docker containers, Multipass VMs) to report they are alive. " +
			"Updates the node's last_heartbeat and status in the D1 mesh_nodes table. " +
			"If the node_id is not found, the heartbeat is accepted but no record is updated.",
		operationId: "mesh-node-heartbeat",
		request: {
			body: contentJson(
				z.object({
					node_id: z
						.string()
						.min(1)
						.describe("Node identifier (e.g. fungimesh-relay1)"),
					status: z
						.string()
						.optional()
						.describe("Current node status. Defaults to 'online'."),
				}),
			),
		},
		responses: {
			"200": {
				description: "Heartbeat acknowledged",
				...contentJson(
					z.object({
						success: z.literal(true),
						node_id: z.string(),
						status: z.string(),
						received_at: z.string(),
					}),
				),
			},
		},
	};

	public async handle(c: AppContext) {
		const data = await this.getValidatedData<typeof this.schema>();
		const body = data.body;
		const now = new Date().toISOString();
		const status = body.status || "online";

		const db = c.env.DB;
		await db
			.prepare(
				`UPDATE mesh_nodes SET last_heartbeat = ?, status = ? WHERE node_id = ?`,
			)
			.bind(now, status, body.node_id)
			.run();

		return {
			success: true as const,
			node_id: body.node_id,
			status,
			received_at: now,
		};
	}
}
