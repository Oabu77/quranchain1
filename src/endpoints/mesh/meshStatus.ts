import { contentJson, OpenAPIRoute } from "chanfana";
import { AppContext } from "../../types";
import { z } from "zod";

/**
 * Mesh status — queries D1 mesh_nodes table directly.
 * No upstream fetch to mesh.darcloud.host (that's a landing page).
 */
export class MeshStatus extends OpenAPIRoute {
	public schema = {
		tags: ["FungiMesh"],
		summary: "Get live FungiMesh dual-layer network status",
		description:
			"Returns real-time status of both Layer 1 (Node.js relay mesh) and Layer 2 (Python compute mesh) " +
			"by querying the D1 mesh_nodes table directly. Reports total active nodes, encryption protocol, " +
			"continent coverage, and overall network health.",
		operationId: "mesh-status-live",
		responses: {
			"200": {
				description: "Live mesh network status with dual-layer health",
				...contentJson(
					z.object({
						success: z.literal(true),
						mesh: z.object({
							service: z.string(),
							timestamp: z.string(),
							layer1_nodejs: z.object({ status: z.string(), nodes: z.number() }),
							layer2_python: z.object({ status: z.string(), nodes: z.number() }),
							summary: z.object({
								total_nodes: z.number(),
								encryption: z.string(),
								continents: z.number(),
								design: z.string(),
							}),
						}),
						execution_ms: z.number(),
						checked_at: z.string(),
					}),
				),
			},
		},
	};

	public async handle(c: AppContext) {
		const started = Date.now();
		const db = c.env.DB;

		// Total nodes
		const totalRow = await db.prepare("SELECT COUNT(*) as cnt FROM mesh_nodes").first<{ cnt: number }>();
		const totalNodes = totalRow?.cnt ?? 0;

		// Active nodes (heartbeat within last 5 min)
		const activeRow = await db
			.prepare("SELECT COUNT(*) as cnt FROM mesh_nodes WHERE last_heartbeat > datetime('now', '-5 minutes')")
			.first<{ cnt: number }>();
		const activeNodes = activeRow?.cnt ?? 0;

		// Distinct regions as proxy for continent count
		const regionRow = await db
			.prepare("SELECT COUNT(DISTINCT region) as cnt FROM mesh_nodes")
			.first<{ cnt: number }>();
		const continents = regionRow?.cnt ?? 0;

		// Layer breakdown by hardware type
		const dockerRow = await db
			.prepare("SELECT COUNT(*) as cnt FROM mesh_nodes WHERE hardware = 'docker'")
			.first<{ cnt: number }>();
		const dockerNodes = dockerRow?.cnt ?? 0;
		const cloudflareNodes = totalNodes - dockerNodes;

		const layer1Status = cloudflareNodes > 0 ? "operational" : "no_nodes";
		const layer2Status = dockerNodes > 0 ? "operational" : "no_nodes";

		return {
			success: true as const,
			mesh: {
				service: "FungiMesh™ Dual-Layer Network",
				timestamp: new Date().toISOString(),
				layer1_nodejs: { status: layer1Status, nodes: cloudflareNodes },
				layer2_python: { status: layer2Status, nodes: dockerNodes },
				summary: {
					total_nodes: totalNodes,
					active_nodes: activeNodes,
					encryption: "WireGuard + AES-256-GCM",
					continents,
					design: "Mycelium-inspired resilient mesh topology",
				},
			},
			execution_ms: Date.now() - started,
			checked_at: new Date().toISOString(),
		};
	}
}
