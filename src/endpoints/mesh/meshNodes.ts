import { contentJson, OpenAPIRoute } from "chanfana";
import { AppContext } from "../../types";
import { z } from "zod";

const MESH_UPSTREAM = "https://mesh.darcloud.host";

export class MeshNodes extends OpenAPIRoute {
	public schema = {
		tags: ["FungiMesh"],
		summary: "List all FungiMesh nodes by region",
		operationId: "mesh-nodes",
		responses: {
			"200": {
				description: "Mesh node list by region",
				...contentJson(
					z.object({
						success: z.boolean(),
						regions: z.array(
							z.object({
								name: z.string(),
								nodes: z.number(),
								status: z.string(),
							}),
						),
						total: z.number(),
						encryption: z.string(),
					}),
				),
			},
		},
	};

	public async handle(c: AppContext) {
		try {
			const nodesRes = await fetch(`${MESH_UPSTREAM}/api/nodes`);
			const nodesData = await nodesRes.json() as Record<string, unknown>;

			return {
				success: true,
				...nodesData,
			};
		} catch (error) {
			return c.json(
				{
					success: false,
					error: error instanceof Error ? error.message : "Failed to reach mesh network",
				},
				502,
			);
		}
	}
}
