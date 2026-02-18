import { ApiException, fromHono } from "chanfana";
import { Hono } from "hono";
import { tasksRouter } from "./endpoints/tasks/router";
import { backupsRouter } from "./endpoints/backups/router";
import { meshRouter } from "./endpoints/mesh/router";
import { aiRouter } from "./endpoints/ai/router";
import { minecraftRouter } from "./endpoints/minecraft/router";
import { multipassRouter } from "./endpoints/multipass/router";
import { auth } from "./endpoints/auth";
import { contracts } from "./endpoints/contracts";
import { ContentfulStatusCode } from "hono/utils/http-status";
import { SystemHealth } from "./endpoints/systemHealth";
import {
  SIGNUP_PAGE,
  LOGIN_PAGE,
  ONBOARDING_PAGE,
  DASHBOARD_PAGE,
  ADMIN_PAGE,
  checkoutPage,
} from "./pages";

// Start a Hono app
const app = new Hono<{ Bindings: Env }>();

// ── CORS middleware for all routes ──
app.use("*", async (c, next) => {
  if (c.req.method === "OPTIONS") {
    return new Response(null, {
      status: 204,
      headers: {
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Methods": "GET,POST,PUT,DELETE,OPTIONS",
        "Access-Control-Allow-Headers": "Content-Type,Authorization",
      },
    });
  }
  await next();
  c.res.headers.set("Access-Control-Allow-Origin", "*");
});

// ── HTML Pages (signup, login, checkout, onboarding, dashboard, admin) ──
app.get("/signup", (c) => c.html(SIGNUP_PAGE));
app.get("/login", (c) => c.html(LOGIN_PAGE));
app.get("/onboarding", (c) => c.html(ONBOARDING_PAGE));
app.get("/dashboard", (c) => c.html(DASHBOARD_PAGE));
app.get("/admin", (c) => c.html(ADMIN_PAGE));
app.get("/checkout/:plan", (c) => c.html(checkoutPage(c.req.param("plan"))));

// ── Auth & Checkout API ──
app.route("/api", auth);

// ── Inter-Company Contracts, DarLaw, & IP Protection ──
app.route("/api/contracts", contracts);

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
  docs_url: "/docs",
  schema: {
    info: {
      title: "QuranChain™ — DarCloud API",
      version: "5.3.0",
      description:
        "QuranChain™ production API powering the DarCloud infrastructure stack. " +
        "All endpoints produce real-world results from live upstream services — nothing is mocked. " +
        "Subsystems: 77 AI agents (66 fleet + 11 DarLaw legal AI) + 12 GPT-4o assistants (ai.darcloud.host), " +
        "FungiMesh dual-layer encrypted network (mesh.darcloud.host), " +
        "Multipass VM fleet management, Minecraft server tracking (Qcmesh1/Qcmesh2), " +
        "backup registry with mesh replication, and operational task management. " +
        "Authentication: /signup, /login, /checkout/:plan, /onboarding. " +
        "Payments: DarPay™ halal checkout at /api/checkout/session (Stripe backend). " +
        "Inter-Company Contracts: 101 companies, 175 contracts ($402K+/mo), monthly autopay on all. " +
        "DarLaw AI™: 11 legal AI agents handling corporate filings, IP protection, " +
        "75 trademarks, 27 patents, 8 copyrights, 6 trade secrets, international IP across 153 countries. " +
        "Islamic Finance: Takaful, Sukuk, Murabaha, Musharakah, Mudarabah, Ijarah, Istisna, Wakala, Zakat, Waqf. " +
        "Blockchain/DeFi: DarDeFi, DarNFT, DarStaking, DarSwap, DarBridge, DarDAO, DarWallet. " +
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
