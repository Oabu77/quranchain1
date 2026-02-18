import { contentJson, OpenAPIRoute } from "chanfana";
import { AppContext } from "../../types";
import { z } from "zod";

const MESH_UPSTREAM = "https://mesh.darcloud.host";
const FETCH_TIMEOUT_MS = 10_000;
const MAX_RETRIES = 2;

export class MeshStatus extends OpenAPIRoute {
public schema = {
tags: ["FungiMesh"],
summary: "Get live FungiMesh dual-layer network status with tunnel health",
description:
"Probes the FungiMesh network at mesh.darcloud.host to return real-time status of both " +
"Layer 1 (Node.js relay mesh) and Layer 2 (Python compute mesh). Reports total active nodes, " +
"encryption protocol, continent coverage, and Cloudflare tunnel connectivity. " +
"This is the primary health check for the entire mesh network. Retry-enabled.",
operationId: "mesh-status-live",
responses: {
"200": {
description: "Live mesh network status with dual-layer health and tunnel info",
...contentJson(
z.object({
success: z.literal(true),
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
latency_ms: z.number(),
}),
execution_ms: z.number(),
checked_at: z.string(),
}),
),
},
"502": {
description: "Mesh network unreachable after retries",
...contentJson(
z.object({
success: z.literal(false),
error: z.string(),
tunnel: z.object({
connected: z.literal(false),
upstream: z.string(),
}),
retries_attempted: z.number(),
execution_ms: z.number(),
}),
),
},
},
};

public async handle(c: AppContext) {
const started = Date.now();

for (let attempt = 0; attempt <= MAX_RETRIES; attempt++) {
try {
const fetchStart = Date.now();
const meshRes = await fetch(`${MESH_UPSTREAM}/api/status`, {
signal: AbortSignal.timeout(FETCH_TIMEOUT_MS),
});

if (!meshRes.ok) {
if (attempt < MAX_RETRIES) continue;
return c.json(
{
success: false as const,
error: `Mesh upstream returned HTTP ${meshRes.status}`,
tunnel: { connected: false as const, upstream: MESH_UPSTREAM },
retries_attempted: attempt,
execution_ms: Date.now() - started,
},
502,
);
}

const meshData = (await meshRes.json()) as Record<string, unknown>;
const latency = Date.now() - fetchStart;

return {
success: true as const,
mesh: meshData,
tunnel: {
connected: true,
upstream: MESH_UPSTREAM,
latency_ms: latency,
},
execution_ms: Date.now() - started,
checked_at: new Date().toISOString(),
};
} catch (error) {
if (attempt < MAX_RETRIES) continue;

return c.json(
{
success: false as const,
error: error instanceof Error ? error.message : "Mesh network unreachable",
tunnel: { connected: false as const, upstream: MESH_UPSTREAM },
retries_attempted: attempt,
execution_ms: Date.now() - started,
},
502,
);
}
}

return c.json(
{
success: false as const,
error: "Unexpected retry loop exit",
tunnel: { connected: false as const, upstream: MESH_UPSTREAM },
retries_attempted: MAX_RETRIES,
execution_ms: Date.now() - started,
},
502,
);
}
}
