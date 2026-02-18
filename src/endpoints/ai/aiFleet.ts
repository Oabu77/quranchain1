import { contentJson, OpenAPIRoute } from "chanfana";
import { AppContext } from "../../types";
import { z } from "zod";

const AI_UPSTREAM = "https://ai.darcloud.host";
const FETCH_TIMEOUT_MS = 10_000;
const MAX_RETRIES = 2;

export class AIFleet extends OpenAPIRoute {
public schema = {
tags: ["AI Workers"],
summary: "Retrieve the live inventory of all 66 AI agents deployed across the DarCloud AI fleet",
description:
"Queries the upstream AI orchestrator at ai.darcloud.host to return every registered agent with its " +
"deployment status, host platform, and operational role. This endpoint produces real-time data from the " +
"production fleet — not cached or mocked. Use this to audit agent availability, detect offline workers, " +
"and feed dashboards with live agent counts. Includes automatic retry on transient failures.",
operationId: "ai-fleet-list",
responses: {
"200": {
description: "Live AI fleet inventory with per-agent details",
...contentJson(
z.object({
success: z.literal(true),
total: z.number().describe("Total agents in the fleet"),
active: z.number().describe("Agents currently deployed and responsive"),
fleet: z.array(
z.object({
id: z.number(),
name: z.string(),
status: z.string().describe("deployed | offline | degraded"),
platform: z.string().describe("Hosting platform (e.g. cloudflare, vercel, docker)"),
}),
),
source: z.string().describe("Upstream API base URL"),
execution_ms: z.number().describe("Total request processing time in milliseconds"),
fetched_at: z.string().describe("ISO timestamp of when upstream was queried"),
}),
),
},
"502": {
description: "AI fleet upstream is unreachable after retries",
...contentJson(
z.object({
success: z.literal(false),
error: z.string(),
source: z.string(),
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
const res = await fetch(`${AI_UPSTREAM}/api/fleet`, {
signal: AbortSignal.timeout(FETCH_TIMEOUT_MS),
});

if (!res.ok) {
if (attempt < MAX_RETRIES) continue;
return c.json(
{
success: false as const,
error: `Upstream returned HTTP ${res.status}`,
source: AI_UPSTREAM,
retries_attempted: attempt,
execution_ms: Date.now() - started,
},
502,
);
}

const data = (await res.json()) as {
fleet: Array<{ id: number; name: string; status: string; platform: string }>;
};

const fleet = data.fleet || [];
const active = fleet.filter((a) => a.status === "deployed").length;

return {
success: true as const,
total: fleet.length,
active,
fleet,
source: AI_UPSTREAM,
execution_ms: Date.now() - started,
fetched_at: new Date().toISOString(),
};
} catch (error) {
if (attempt < MAX_RETRIES) continue;

return c.json(
{
success: false as const,
error: error instanceof Error ? error.message : "Failed to reach AI fleet after retries",
source: AI_UPSTREAM,
retries_attempted: attempt,
execution_ms: Date.now() - started,
},
502,
);
}
}

// TypeScript exhaustiveness — should never reach here
return c.json(
{ success: false as const, error: "Unexpected retry loop exit", source: AI_UPSTREAM, retries_attempted: MAX_RETRIES, execution_ms: Date.now() - started },
502,
);
}
}
