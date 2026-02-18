import { contentJson, OpenAPIRoute } from "chanfana";
import { AppContext } from "../../types";
import { z } from "zod";

const MESH_UPSTREAM = "https://mesh.darcloud.host";

export class MeshConnect extends OpenAPIRoute {
	public schema = {
		tags: ["FungiMesh"],
		summary: "Connect/register a node to the FungiMesh network",
		operationId: "mesh-connect",
		request: {
			body: contentJson(
				z.object({
					node_id: z.string().describe("Unique identifier for this node"),
					hardware: z.string().describe("Hardware platform (e.g. leopard, standard)"),
					region: z.string().optional().describe("Geographic region"),
					capabilities: z
						.array(z.string())
						.optional()
						.describe("Node capabilities (backup, compute, relay)"),
				}),
			),
		},
		responses: {
			"200": {
				description: "Node connection result",
				...contentJson(
					z.object({
						success: z.boolean(),
						node: z.object({
							node_id: z.string(),
							hardware: z.string(),
							status: z.string(),
							mesh_endpoint: z.string(),
							connected_at: z.string(),
						}),
					}),
				),
			},
		},
	};

	public async handle(c: AppContext) {
		const data = await this.getValidatedData<typeof this.schema>();
		const body = data.body;

		// Register the node in the mesh
		const nodeRecord = {
			node_id: body.node_id,
			hardware: body.hardware,
			status: "connected",
			mesh_endpoint: MESH_UPSTREAM,
			connected_at: new Date().toISOString(),
			region: body.region || "auto-detect",
			capabilities: body.capabilities || ["backup", "relay"],
		};

		// Store node registration in D1
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
			success: true,
			node: nodeRecord,
		};
	}
}
