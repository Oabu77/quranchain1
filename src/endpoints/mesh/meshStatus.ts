import { contentJson, OpenAPIRoute } from "chanfana";
import { AppContext } from "../../types";
import { z } from "zod";

const MESH_UPSTREAM = "https://mesh.darcloud.host";

export class MeshStatus extends OpenAPIRoute {
	public schema = {
		tags: ["FungiMesh"],
		summary: "Get FungiMesh network status and connect local node",
		operationId: "mesh-status",
		responses: {
			"200": {
				description: "Current mesh network status",
				...contentJson(
					z.object({
						success: z.boolean(),
						mesh: z.object({
							service: z.string(),
							timestamp: z.string(),
							layer1_nodejs: z.object({ status: z.string() }),
							layer2_python: z.object({ status: z.string() }),
							summary: z.object({
								total_nodes: z.number(),
								encryption: z.string(),
								continents: z.number(),
								design: z.string(),
							}),
						}),
						tunnel: z.object({
							connected: z.boolean(),
							upstream: z.string(),
						}),
					}),
				),
			},
		},
	};

	public async handle(c: AppContext) {
		try {
			const meshRes = await fetch(`${MESH_UPSTREAM}/api/status`);
			const meshData = await meshRes.json() as Record<string, unknown>;

			return {
				success: true,
				mesh: meshData,
				tunnel: {
					connected: true,
					upstream: MESH_UPSTREAM,
				},
			};
		} catch (error) {
			return c.json(
				{
					success: false,
					mesh: null,
					tunnel: {
						connected: false,
						upstream: MESH_UPSTREAM,
						error: error instanceof Error ? error.message : "Connection failed",
					},
				},
				502,
			);
		}
	}
}
