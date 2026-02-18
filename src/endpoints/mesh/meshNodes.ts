import { contentJson, OpenAPIRoute } from "chanfana";
import { AppContext } from "../../types";
import { z } from "zod";

const MESH_UPSTREAM = "https://mesh.darcloud.host";
const FETCH_TIMEOUT_MS = 10_000;
const MAX_RETRIES = 2;

export class MeshNodes extends OpenAPIRoute {
public schema = {
tags: ["FungiMesh"],
summary: "List all FungiMesh nodes grouped by geographic region with encryption status",
description:
"Retrieves the full node map from the FungiMesh network, organized by geographic region. " +
"Each region reports its node count and operational status. Also returns the encryption " +
"protocol in use (e.g. WireGuard) and total node count across all regions. " +
"Use this to visualize mesh coverage and identify under-provisioned regions.",
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
"502": {
description: "Mesh node API unreachable after retries",
...contentJson(
z.object({
success: z.literal(false),
error: z.string(),
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
const nodesRes = await fetch(`${MESH_UPSTREAM}/api/nodes`, {
signal: AbortSignal.timeout(FETCH_TIMEOUT_MS),
});

if (!nodesRes.ok) {
if (attempt < MAX_RETRIES) continue;
return c.json(
{
success: false as const,
error: `Mesh nodes API returned HTTP ${nodesRes.status}`,
retries_attempted: attempt,
execution_ms: Date.now() - started,
},
502,
);
}

const nodesData = (await nodesRes.json()) as Record<string, unknown>;

return {
success: true as const,
...nodesData,
execution_ms: Date.now() - started,
fetched_at: new Date().toISOString(),
};
} catch (error) {
if (attempt < MAX_RETRIES) continue;

return c.json(
{
success: false as const,
error: error instanceof Error ? error.message : "Failed to reach mesh node API",
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
retries_attempted: MAX_RETRIES,
execution_ms: Date.now() - started,
},
502,
);
}
}
