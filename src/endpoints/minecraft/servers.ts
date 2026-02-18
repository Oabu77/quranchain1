import { contentJson, OpenAPIRoute } from "chanfana";
import { AppContext } from "../../types";
import { z } from "zod";

export class MinecraftServers extends OpenAPIRoute {
	public schema = {
		tags: ["Minecraft"],
		summary: "List all Minecraft servers (Qcmesh1, Qcmesh2)",
		operationId: "minecraft-servers",
		responses: {
			"200": {
				description: "All registered Minecraft servers",
				...contentJson(
					z.object({
						success: z.boolean(),
						servers: z.array(
							z.object({
								id: z.string(),
								name: z.string(),
								host: z.string().nullable(),
								port: z.number(),
								version: z.string().nullable(),
								status: z.string(),
								players_online: z.number(),
								max_players: z.number(),
								hardware: z.string().nullable(),
								mesh_node_id: z.string().nullable(),
							}),
						),
					}),
				),
			},
		},
	};

	public async handle(c: AppContext) {
		const db = c.env.DB;
		const result = await db
			.prepare("SELECT * FROM minecraft_servers ORDER BY id")
			.all();

		return {
			success: true,
			servers: result.results,
		};
	}
}
