import { contentJson, OpenAPIRoute } from "chanfana";
import { AppContext } from "../../types";
import { z } from "zod";

export class MinecraftBackups extends OpenAPIRoute {
	public schema = {
		tags: ["Minecraft"],
		summary:
			"List backup files for Minecraft servers, filterable by server, date, label, and hardware",
		operationId: "minecraft-backups",
		request: {
			query: z.object({
				server_id: z
					.string()
					.optional()
					.describe("Filter by server ID (qcmesh1 or qcmesh2)"),
				date: z
					.string()
					.optional()
					.describe("Filter by date (YYYY-MM-DD)"),
				label: z
					.string()
					.optional()
					.describe("Filter by backup label (e.g. quranchain)"),
				hardware: z
					.string()
					.optional()
					.describe("Filter by hardware platform (e.g. leopard)"),
			}),
		},
		responses: {
			"200": {
				description: "Backup files matching filters",
				...contentJson(
					z.object({
						success: z.boolean(),
						total: z.number(),
						filters_applied: z.record(z.string()),
						backups: z.array(
							z.object({
								id: z.number(),
								server_id: z.string(),
								filename: z.string(),
								world_name: z.string().nullable(),
								size_bytes: z.number(),
								size_human: z.string(),
								backup_type: z.string(),
								label: z.string(),
								hardware: z.string(),
								storage_path: z.string().nullable(),
								mesh_replicated: z.boolean(),
								status: z.string(),
								created_at: z.string(),
							}),
						),
					}),
				),
			},
		},
	};

	public async handle(c: AppContext) {
		const data = await this.getValidatedData<typeof this.schema>();
		const query = data.query;

		const db = c.env.DB;
		const conditions: string[] = [];
		const params: string[] = [];

		if (query.server_id) {
			conditions.push("server_id = ?");
			params.push(query.server_id);
		}
		if (query.date) {
			conditions.push("DATE(created_at) = ?");
			params.push(query.date);
		}
		if (query.label) {
			conditions.push("label = ?");
			params.push(query.label);
		}
		if (query.hardware) {
			conditions.push("hardware = ?");
			params.push(query.hardware);
		}

		const where =
			conditions.length > 0 ? `WHERE ${conditions.join(" AND ")}` : "";
		const sql = `SELECT * FROM minecraft_backups ${where} ORDER BY created_at DESC`;

		const stmt = db.prepare(sql);
		const result =
			params.length > 0
				? await stmt.bind(...params).all()
				: await stmt.all();

		const backups = result.results.map(
			(b: Record<string, unknown>) => ({
				...b,
				size_human: this.formatBytes(b.size_bytes as number),
				mesh_replicated: Boolean(b.mesh_replicated),
			}),
		);

		const filtersApplied: Record<string, string> = {};
		if (query.server_id) filtersApplied.server_id = query.server_id;
		if (query.date) filtersApplied.date = query.date;
		if (query.label) filtersApplied.label = query.label;
		if (query.hardware) filtersApplied.hardware = query.hardware;

		return {
			success: true,
			total: backups.length,
			filters_applied: filtersApplied,
			backups,
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
