import { ApiException, fromHono } from "chanfana";
import { Hono } from "hono";
import { tasksRouter } from "./endpoints/tasks/router";
import { backupsRouter } from "./endpoints/backups/router";
import { meshRouter } from "./endpoints/mesh/router";
import { aiRouter } from "./endpoints/ai/router";
import { ContentfulStatusCode } from "hono/utils/http-status";
import { DummyEndpoint } from "./endpoints/dummyEndpoint";

// Start a Hono app
const app = new Hono<{ Bindings: Env }>();

app.onError((err, c) => {
	if (err instanceof ApiException) {
		// If it's a Chanfana ApiException, let Chanfana handle the response
		return c.json(
			{ success: false, errors: err.buildResponse() },
			err.status as ContentfulStatusCode,
		);
	}

	console.error("Global error handler caught:", err); // Log the error if it's not known

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
			title: "QuranChain™ — DarCloud API",
			version: "3.0.0",
			description:
				"QuranChain™ backend API with FungiMesh connectivity, backup management, and Cloudflare tunnel integration. Serving darcloud.host & darcloud.net.",
		},
	},
});

// Register Tasks Sub router
openapi.route("/tasks", tasksRouter);

// Register Backups Sub router
openapi.route("/backups", backupsRouter);

// Register FungiMesh Sub router
openapi.route("/mesh", meshRouter);

// Register AI Workers & Benchmark Sub router
openapi.route("/ai", aiRouter);

// Register other endpoints
openapi.post("/dummy/:slug", DummyEndpoint);

// Export the Hono app
export default app;
