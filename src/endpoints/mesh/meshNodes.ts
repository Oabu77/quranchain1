import { contentJson, OpenAPIRoute } from "chanfana";
import { AppContext } from "../../types";
import { z } from "zod";

/**
 * Mesh nodes — queries D1 mesh_nodes table directly.
 * Groups registered nodes by region with status counts.
 */
export class MeshNodes extends OpenAPIRoute {
	public schema = {
		tags: ["FungiMesh"],
		summary: "List all FungiMesh nodes grouped by geographic region",
		description:
			"Retrieves the full node map from the D1 mesh_nodes table, organized by geographic region. " +
			"Each region reports its node count and operational status. Also returns the encryption " +
			"protocol in use and total node count across all regions.",
		operationId: "mesh-nodes-list",
		responses: {
			"200": {
				description: "Node inventory grouped by region with encryption metadata",
				...contentJson(
					z.object({
						success: z.literal(true),
						regions: z.array(
							z.object({
								name: z.string().describe("Geographic region name"),
								nodes: z.number().describe("Active nodes in this region"),
								status: z.string().describe("Region health: online | degraded | offline"),
							}),
						),
						total: z.number().describe("Total nodes across all regions"),
						encryption: z.string().describe("Network encryption protocol"),
						execution_ms: z.number(),
						fetched_at: z.string(),
					}),
				),
			},
		},
	};

	public async handle(c: AppContext) {
		const started = Date.now();
		const db = c.env.DB;

		// Group nodes by region
		const rows = await db
			.prepare(
				`SELECT
					region,
					COUNT(*) as total,
					SUM(CASE WHEN last_heartbeat > datetime('now', '-5 minutes') THEN 1 ELSE 0 END) as active
				 FROM mesh_nodes
				 GROUP BY region
				 ORDER BY region`
			)
			.all<{ region: string; total: number; active: number }>();

		const regions = (rows.results || []).map((r) => ({
			name: r.region || "unknown",
			nodes: r.total,
			status: r.active > 0 ? "online" : r.total > 0 ? "offline" : "empty",
		}));

		const total = regions.reduce((sum, r) => sum + r.nodes, 0);

		return {
			success: true as const,
			regions,
			total,
			encryption: "WireGuard + AES-256-GCM",
			execution_ms: Date.now() - started,
			fetched_at: new Date().toISOString(),
		};
	}
}
