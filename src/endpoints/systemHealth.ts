import { contentJson, OpenAPIRoute } from "chanfana";
import { AppContext } from "../types";
import { z } from "zod";

// These are configured service locations, not evidence of deployment or health.
// Probing these public hosts could recurse through this Worker's wildcard routes.
const FLEET_UPSTREAMS = {
	ai_fleet: "https://ai.darcloud.host",
	mesh_network: "https://mesh.darcloud.host",
} as const;

const uncheckedComponentSchema = z.object({
	status: z.literal("unknown"),
	verification: z.literal("not_checked"),
	upstream: z.string(),
	source: z.literal("unconfigured"),
	checked_at: z.null(),
	response_ms: z.null(),
	reason: z.string(),
});

const healthReportSchema = z.object({
	success: z.boolean(),
	status: z.enum(["degraded", "unhealthy"]),
	version: z.string(),
	uptime_info: z.object({
		checked_at: z.string(),
		worker_region: z.string(),
	}),
	components: z.object({
		database: z.object({
			status: z.enum(["up", "down"]),
			tables: z.number().nullable(),
			response_ms: z.number(),
			source: z.literal("D1:DB"),
			checked_at: z.string(),
			reason: z.string().nullable(),
		}),
		ai_fleet: uncheckedComponentSchema,
		mesh_network: uncheckedComponentSchema,
	}),
	execution_ms: z.number(),
});

export class SystemHealth extends OpenAPIRoute {
	public schema = {
		tags: ["System"],
		summary: "Observed database health and fleet verification status",
		description:
			"Checks D1 connectivity and counts visible tables. Fleet runtime probes are not " +
			"configured, so fleet components are unknown and the composite report is degraded " +
			"when the database is available (HTTP 200), or unhealthy when it is unavailable " +
			"(HTTP 503). HTTP 200 confirms database availability, not full system readiness. " +
			"A deployment or shared CI pipeline is not proof of runtime health.",
		operationId: "system-health",
		responses: {
			"200": {
				description: "Database available; fleet health unknown; composite status degraded",
				...contentJson(healthReportSchema),
			},
			"503": {
				description: "Database health check failed; composite status unhealthy",
				...contentJson(healthReportSchema),
			},
		},
	};

	public async handle(c: AppContext) {
		const started = Date.now();
		const database = await this.checkDatabase(c.env.DB);
		const databaseAvailable = database.status === "up";

		return c.json({
			success: databaseAvailable,
			status: databaseAvailable ? "degraded" : "unhealthy",
			version: "5.4.0",
			uptime_info: {
				checked_at: new Date().toISOString(),
				worker_region: (c.req.raw.cf as Record<string, unknown>)?.colo as string || "unknown",
			},
			components: {
				database,
				ai_fleet: this.uncheckedFleetComponent(FLEET_UPSTREAMS.ai_fleet),
				mesh_network: this.uncheckedFleetComponent(FLEET_UPSTREAMS.mesh_network),
			},
			execution_ms: Date.now() - started,
		}, databaseAvailable ? 200 : 503);
	}

	private async checkDatabase(db: D1Database) {
		const started = Date.now();
		try {
			const result = await db
				.prepare("SELECT name FROM sqlite_master WHERE type='table' AND name NOT LIKE 'sqlite_%' AND name NOT LIKE '_cf_%'")
				.all();
			if (!result.success || !Array.isArray(result.results)) {
				throw new Error("Database health query failed");
			}
			return {
				status: "up" as const,
				tables: result.results.length,
				response_ms: Date.now() - started,
				source: "D1:DB" as const,
				checked_at: new Date().toISOString(),
				reason: null,
			};
		} catch {
			return {
				status: "down" as const,
				tables: null,
				response_ms: Date.now() - started,
				source: "D1:DB" as const,
				checked_at: new Date().toISOString(),
				reason: "Database health query failed",
			};
		}
	}

	private uncheckedFleetComponent(upstream: string) {
		return {
			status: "unknown" as const,
			verification: "not_checked" as const,
			upstream,
			source: "unconfigured" as const,
			checked_at: null,
			response_ms: null,
			reason: "Runtime health probe is not configured; deployment does not establish runtime health",
		};
	}
}
