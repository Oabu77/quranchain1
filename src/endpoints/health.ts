// ==========================================================
// QuranChain™ / Dar Al-Nas™ Proprietary System
// Founder: Omar Mohammad Abunadi
// All Rights Reserved. Trademark Protected.
// ==========================================================

import { OpenAPIRoute, contentJson } from "chanfana";
import { AppContext } from "../types";
import { z } from "zod";

/**
 * Health check endpoint
 * Returns system health status for monitoring
 */
export class HealthEndpoint extends OpenAPIRoute {
public schema = {
tags: ["System"],
summary: "Health check endpoint",
operationId: "health-check",
responses: {
"200": {
description: "System is healthy",
...contentJson({
success: z.boolean(),
result: z.object({
status: z.string(),
timestamp: z.string(),
version: z.string(),
uptime: z.number(),
}),
}),
},
},
};

public async handle(c: AppContext) {
return {
success: true,
result: {
status: "healthy",
timestamp: new Date().toISOString(),
version: "1.0.0",
uptime: Date.now(),
},
};
}
}

/**
 * Readiness check endpoint
 * Checks if system is ready to handle requests
 */
export class ReadinessEndpoint extends OpenAPIRoute {
public schema = {
tags: ["System"],
summary: "Readiness check endpoint",
operationId: "readiness-check",
responses: {
"200": {
description: "System is ready",
...contentJson({
success: z.boolean(),
result: z.object({
ready: z.boolean(),
checks: z.object({
database: z.boolean(),
}),
}),
}),
},
},
};

public async handle(c: AppContext) {
// Check database connectivity
let dbReady = false;
try {
// Simple query to check D1 connection
await c.env.DB.prepare("SELECT 1").first();
dbReady = true;
} catch (error) {
dbReady = false;
}

const ready = dbReady;

return {
success: true,
result: {
ready,
checks: {
database: dbReady,
},
},
};
}
}
