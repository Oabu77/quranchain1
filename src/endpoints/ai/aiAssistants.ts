import { contentJson, OpenAPIRoute } from "chanfana";
import { AppContext } from "../../types";
import { z } from "zod";

const AI_UPSTREAM = "https://ai.darcloud.host";
const FETCH_TIMEOUT_MS = 10_000;
const MAX_RETRIES = 2;

export class AIAssistants extends OpenAPIRoute {
public schema = {
tags: ["AI Workers"],
summary: "List all 12 OpenAI GPT-4o assistants with their specializations and capabilities",
description:
"Fetches the live assistant roster from the DarCloud AI orchestrator. Each assistant is a fine-tuned " +
"GPT-4o instance with a specific domain expertise (e.g. Quranic scholarship, infrastructure DevOps, " +
"revenue optimization). Returns real upstream data — not mocked. Retry-enabled with timeout protection.",
operationId: "ai-assistants-list",
responses: {
"200": {
description: "Full assistant roster with model and capability metadata",
...contentJson(
z.object({
success: z.literal(true),
total: z.number().describe("Number of registered assistants"),
models_used: z.record(z.string(), z.number()).describe("Count of assistants per model version"),
assistants: z.array(
z.object({
name: z.string(),
model: z.string().describe("OpenAI model ID (e.g. gpt-4o)"),
description: z.string().optional().describe("Assistant specialization summary"),
}),
),
source: z.string(),
execution_ms: z.number(),
fetched_at: z.string(),
}),
),
},
"502": {
description: "Upstream AI service unreachable after retries",
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
const res = await fetch(`${AI_UPSTREAM}/api/assistants`, {
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
total: number;
assistants: Array<{ name: string; model: string; description?: string }>;
};

const assistants = data.assistants || [];

// Build model usage breakdown
const models_used: Record<string, number> = {};
for (const a of assistants) {
models_used[a.model] = (models_used[a.model] || 0) + 1;
}

return {
success: true as const,
total: data.total || assistants.length,
models_used,
assistants,
source: AI_UPSTREAM,
execution_ms: Date.now() - started,
fetched_at: new Date().toISOString(),
};
} catch (error) {
if (attempt < MAX_RETRIES) continue;

return c.json(
{
success: false as const,
error: error instanceof Error ? error.message : "Failed to reach assistants API after retries",
source: AI_UPSTREAM,
retries_attempted: attempt,
execution_ms: Date.now() - started,
},
502,
);
}
}

return c.json(
{ success: false as const, error: "Unexpected retry loop exit", source: AI_UPSTREAM, retries_attempted: MAX_RETRIES, execution_ms: Date.now() - started },
502,
);
}
}
