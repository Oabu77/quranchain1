import { SELF } from "cloudflare:test";
import { fromHono } from "chanfana";
import { Hono } from "hono";
import { describe, expect, it } from "vitest";
import { SystemHealth } from "../../src/endpoints/systemHealth";

type HealthReport = {
	success: boolean;
	status: string;
	version: string;
	uptime_info: { checked_at: string };
	components: {
		database: {
			status: string;
			tables: number | null;
			source: string;
			checked_at: string;
			reason: string | null;
		};
		ai_fleet: UncheckedComponent;
		mesh_network: UncheckedComponent;
	};
	execution_ms: number;
};

type UncheckedComponent = {
	status: string;
	verification: string;
	source: string;
	checked_at: string | null;
	response_ms: number | null;
	reason: string;
};

describe("GET /health", () => {
	it("reports an observed database check and unverified fleet as degraded", async () => {
		const response = await SELF.fetch("http://local.test/health");
		const body = await response.json<HealthReport>();

		expect(response.status).toBe(200);
		expect(body.success).toBe(true);
		expect(body.status).toBe("degraded");
		expect(body.version).toBe("5.4.0");
		expect(body.components.database.status).toBe("up");
		expect(body.components.database.tables).toBeGreaterThan(0);
		expect(body.components.database.source).toBe("D1:DB");
		expect(Number.isNaN(Date.parse(body.components.database.checked_at))).toBe(false);
		for (const component of [body.components.ai_fleet, body.components.mesh_network]) {
			expect(component).toMatchObject({
				status: "unknown",
				verification: "not_checked",
				source: "unconfigured",
				checked_at: null,
				response_ms: null,
			});
			expect(component.reason).toContain("Runtime health probe is not configured");
		}
		expect(body.execution_ms).toBeGreaterThanOrEqual(0);
	});

	it("returns 503 when the database check fails without exposing error details", async () => {
		const app = new Hono<{ Bindings: Env }>();
		fromHono(app).get("/health", SystemHealth);
		const failingDb = {
			prepare() {
				throw new Error("private database endpoint and secret");
			},
		} as unknown as D1Database;
		const response = await app.request("http://local.test/health", undefined, {
			DB: failingDb,
		} as Env);
		const body = await response.json() as HealthReport;

		expect(response.status).toBe(503);
		expect(body.success).toBe(false);
		expect(body.status).toBe("unhealthy");
		expect(body.components.database).toMatchObject({
			status: "down",
			tables: null,
			source: "D1:DB",
			reason: "Database health query failed",
		});
		expect(Number.isNaN(Date.parse(body.components.database.checked_at))).toBe(false);
		expect(JSON.stringify(body)).not.toContain("private database endpoint and secret");
		expect(body.components.ai_fleet.status).toBe("unknown");
	});
});
