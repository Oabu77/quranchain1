import { ApiException, fromHono } from "chanfana";
import { Hono } from "hono";
import { tasksRouter } from "./endpoints/tasks/router";
import { backupsRouter } from "./endpoints/backups/router";
import { meshRouter } from "./endpoints/mesh/router";
import { aiRouter } from "./endpoints/ai/router";
import { minecraftRouter } from "./endpoints/minecraft/router";
import { multipassRouter } from "./endpoints/multipass/router";
import { ContentfulStatusCode } from "hono/utils/http-status";
import { SystemHealth } from "./endpoints/systemHealth";

// Start a Hono app
const app = new Hono<{ Bindings: Env }>();

app.onError((err, c) => {
if (err instanceof ApiException) {
return c.json(
{ success: false, errors: err.buildResponse() },
err.status as ContentfulStatusCode,
);
}

console.error("Unhandled error:", err);

return c.json(
{
success: false,
errors: [{ code: 7000, message: "Internal Server Error" }],
},
500,
);
});

// Setup OpenAPI registry
const openapi = fromHono(app, {
docs_url: "/",
schema: {
info: {
title: "QuranChain™ — DarCloud API",
version: "5.0.0",
description:
"QuranChain™ production API powering the DarCloud infrastructure stack. " +
"All endpoints produce real-world results from live upstream services — nothing is mocked. " +
"Subsystems: 66 AI agents + 12 GPT-4o assistants (ai.darcloud.host), " +
"FungiMesh dual-layer encrypted network (mesh.darcloud.host), " +
"Multipass VM fleet management, Minecraft server tracking (Qcmesh1/Qcmesh2), " +
"backup registry with mesh replication, and operational task management. " +
"Built on Cloudflare Workers + D1 + Hono + chanfana OpenAPI.",
},
},
});

// Register routers
openapi.route("/tasks", tasksRouter);
openapi.route("/backups", backupsRouter);
openapi.route("/mesh", meshRouter);
openapi.route("/ai", aiRouter);
openapi.route("/minecraft", minecraftRouter);
openapi.route("/multipass", multipassRouter);

// System health check — replaces the old dummy endpoint
openapi.get("/health", SystemHealth);

// Export the Hono app
export default app;
