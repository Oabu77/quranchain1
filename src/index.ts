// ==========================================================
// QuranChain™ / Dar Al-Nas™ Proprietary System
// Founder: Omar Mohammad Abunadi
// All Rights Reserved. Trademark Protected.
// ==========================================================

import { ApiException, fromHono } from "chanfana";
import { Hono } from "hono";
import { tasksRouter } from "./endpoints/tasks/router";
import { ContentfulStatusCode } from "hono/utils/http-status";
import { DummyEndpoint } from "./endpoints/dummyEndpoint";
import { HealthEndpoint, ReadinessEndpoint } from "./endpoints/health";
import { securityHeaders, requestId, requestSizeLimit } from "./middleware/security";
import { logError, logInfo } from "./utils/logger";

// Start a Hono app
const app = new Hono<{ Bindings: Env }>();

// Global middleware
app.use("*", requestId);
app.use("*", securityHeaders);
app.use("*", requestSizeLimit(2 * 1024 * 1024)); // 2MB limit

app.onError((err, c) => {
	if (err instanceof ApiException) {
		// If it's a Chanfana ApiException, let Chanfana handle the response
		return c.json(
			{ success: false, errors: err.buildResponse() },
			err.status as ContentfulStatusCode,
		);
	}

	// Structured JSON logging for production monitoring
	logError("Global error handler caught", err, {
		requestId: c.get("requestId"),
		path: c.req.path,
		method: c.req.method,
	});

	// For other errors, return a generic 500 response
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
			title: "QuranChain™ Blockchain API",
			version: "1.0.0",
			description: "QuranChain™ blockchain infrastructure API - A sovereign-grade blockchain platform for the Dar Al-Nas™ ecosystem.",
		},
	},
});

// System endpoints
openapi.get("/health", HealthEndpoint);
openapi.get("/ready", ReadinessEndpoint);

// Register Tasks Sub router
openapi.route("/tasks", tasksRouter);

// Register other endpoints
openapi.post("/dummy/:slug", DummyEndpoint);

// Log startup
logInfo("QuranChain™ Worker initialized", { version: "1.0.0" });

// Export the Hono app
export default app;
