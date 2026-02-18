import { contentJson, OpenAPIRoute } from "chanfana";
import { AppContext } from "../../types";
import { z } from "zod";

export class MinecraftServerStatus extends OpenAPIRoute {
	public schema = {
		tags: ["Minecraft"],
		summary: "Get detailed status for a specific Minecraft server",
		operationId: "minecraft-server-status",
		request: {
			params: z.object({
				serverId: z
					.string()
					.describe("Server ID (qcmesh1 or qcmesh2)"),
			}),
		},
		responses: {
			"200": {
				description: "Server status with backup summary",
				...contentJson(
					z.object({
						success: z.boolean(),
						server: z.object({
							id: z.string(),
							name: z.string(),
							host: z.string().nullable(),
							port: z.number(),
							version: z.string().nullable(),
							status: z.string(),
							players_online: z.number(),
							max_players: z.number(),
							hardware: z.string().nullable(),
						}),
						backup_summary: z.object({
							total_backups: z.number(),
							latest_backup: z.string().nullable(),
							total_size_bytes: z.number(),
							total_size_human: z.string(),
						}),
					}),
				),
			},
		},
	};

	public async handle(c: AppContext) {
		const data = await this.getValidatedData<typeof this.schema>();
		const { serverId } = data.params;

		const db = c.env.DB;

		const server = await db
			.prepare("SELECT * FROM minecraft_servers WHERE id = ?")
			.bind(serverId)
			.first();

		if (!server) {
			return c.json(
				{ success: false, error: `Server '${serverId}' not found` },
				404,
			);
		}

		const backupStats = await db
			.prepare(
				`SELECT COUNT(*) as total, MAX(created_at) as latest, SUM(size_bytes) as total_size
         FROM minecraft_backups WHERE server_id = ?`,
			)
			.bind(serverId)
			.first();

		const totalSize = Number(backupStats?.total_size || 0);

		return {
			success: true,
			server,
			backup_summary: {
				total_backups: Number(backupStats?.total || 0),
				latest_backup: (backupStats?.latest as string) || null,
				total_size_bytes: totalSize,
				total_size_human: this.formatBytes(totalSize),
			},
		};
	}

	private formatBytes(bytes: number): string {
		if (bytes === 0) return "0 B";
		const k = 1024;
		const sizes = ["B", "KB", "MB", "GB", "TB"];
		const i = Math.floor(Math.log(bytes) / Math.log(k));
		return `${parseFloat((bytes / Math.pow(k, i)).toFixed(2))} ${sizes[i]}`;
	}
}
