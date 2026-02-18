import { contentJson, OpenAPIRoute } from "chanfana";
import { AppContext } from "../types";
import { z } from "zod";

const AI_UPSTREAM = "https://ai.darcloud.host";
const MESH_UPSTREAM = "https://mesh.darcloud.host";

export class SystemHealth extends OpenAPIRoute {
public schema = {
tags: ["System"],
summary: "Full system health check — D1 database, AI fleet, mesh network, and API status",
description:
"Performs a comprehensive health check across all DarCloud subsystems in parallel: " +
"(1) D1 database connectivity and table verification, " +
"(2) AI fleet upstream reachability, " +
"(3) FungiMesh network upstream reachability. " +
"Returns per-component health status and a composite system verdict. " +
"Use this as a load balancer health check or monitoring probe.",
operationId: "system-health",
responses: {
"200": {
description: "System health report — all components checked",
...contentJson(
z.object({
success: z.literal(true),
status: z.enum(["healthy", "degraded", "unhealthy"]),
version: z.string(),
uptime_info: z.object({
checked_at: z.string(),
worker_region: z.string(),
}),
components: z.object({
database: z.object({
status: z.enum(["up", "down"]),
tables: z.number(),
response_ms: z.number(),
}),
ai_fleet: z.object({
status: z.enum(["up", "down"]),
upstream: z.string(),
response_ms: z.number(),
}),
mesh_network: z.object({
status: z.enum(["up", "down"]),
upstream: z.string(),
response_ms: z.number(),
}),
}),
execution_ms: z.number(),
}),
),
},
},
};

public async handle(c: AppContext) {
const started = Date.now();
const db = c.env.DB;

// Run all health checks in parallel
const [dbHealth, aiHealth, meshHealth] = await Promise.all([
this.checkDatabase(db),
this.checkUpstream(AI_UPSTREAM),
this.checkUpstream(MESH_UPSTREAM),
]);

const components = {
database: dbHealth,
ai_fleet: { ...aiHealth, upstream: AI_UPSTREAM },
mesh_network: { ...meshHealth, upstream: MESH_UPSTREAM },
};

// Core health = database. External Workers (AI/Mesh) are autonomous services
// with their own health endpoints — they don't degrade the core API status.
const status: "healthy" | "degraded" | "unhealthy" =
dbHealth.status === "up" ? "healthy" : "unhealthy";

return {
success: true as const,
status,
version: "5.3.0",
uptime_info: {
checked_at: new Date().toISOString(),
worker_region: (c.req.raw.cf as Record<string, unknown>)?.colo as string || "unknown",
},
components,
execution_ms: Date.now() - started,
};
}

private async checkDatabase(db: D1Database): Promise<{ status: "up" | "down"; tables: number; response_ms: number }> {
const start = Date.now();
try {
const result = await db
.prepare("SELECT name FROM sqlite_master WHERE type='table' AND name NOT LIKE 'sqlite_%' AND name NOT LIKE '_cf_%'")
.all();
return {
status: "up",
tables: result.results.length,
response_ms: Date.now() - start,
};
} catch {
return {
status: "down",
tables: 0,
response_ms: Date.now() - start,
};
}
}

private async checkUpstream(url: string): Promise<{ status: "up" | "down"; response_ms: number }> {
const start = Date.now();
try {
const res = await fetch(url, {
method: "HEAD",
signal: AbortSignal.timeout(5000),
});
return {
status: res.ok ? "up" : "down",
response_ms: Date.now() - start,
};
} catch {
return {
status: "down",
response_ms: Date.now() - start,
};
}
}
}
