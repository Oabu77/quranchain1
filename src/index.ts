import { ApiException, fromHono } from "chanfana";
import { Hono } from "hono";
import { auth } from "./endpoints/auth";
import { ContentfulStatusCode } from "hono/utils/http-status";
import {
  SIGNUP_PAGE,
  LOGIN_PAGE,
  ONBOARDING_PAGE,
  DASHBOARD_PAGE,
  PRIVACY_PAGE,
  TERMS_PAGE,
  checkoutPage,
  checkoutResultPage,
} from "./pages";
import { handleSubdomain } from "./subdomainRouter";

// Start a Hono app
const app = new Hono<{ Bindings: Env }>();

// ── Subdomain routing — intercept *.darcloud.host/net before other routes ──
app.use("*", async (c, next) => {
  const pathname = new URL(c.req.url).pathname;
  if (pathname === "/sw.js" || pathname === "/manifest.json") {
    await next();
    return;
  }
  const response = await handleSubdomain(c.req.raw);
  if (response) return response;
  await next();
});

// ── Same-origin CORS policy ──
app.use("*", async (c, next) => {
  const origin = c.req.header("Origin") || "";
  const requestOrigin = new URL(c.req.url).origin;
  const isSameOrigin = origin === "" || origin === requestOrigin;

  // CORS response headers do not prevent a browser from sending a "simple"
  // cross-origin write. Reject the request itself before any route can mutate
  // state, even when no preflight occurs.
  if (origin && !isSameOrigin) {
    return c.json({ error: "Cross-origin access is not allowed." }, 403);
  }

  if (c.req.method === "OPTIONS") {
    return new Response(null, {
      status: 204,
      headers: {
        ...(origin ? { "Access-Control-Allow-Origin": origin } : {}),
        "Access-Control-Allow-Methods": "GET,POST,PUT,DELETE,OPTIONS",
        "Access-Control-Allow-Headers": "Content-Type,Authorization",
        "Access-Control-Allow-Credentials": "true",
      },
    });
  }
  await next();
  if (origin && isSameOrigin) {
    c.res.headers.set("Access-Control-Allow-Origin", origin);
    c.res.headers.set("Access-Control-Allow-Credentials", "true");
  }
});

// Harden every apex HTML response. Subdomain preview modules set their own
// equivalent or stricter headers before this middleware is reached.
app.use("*", async (c, next) => {
  await next();
  if (!(c.res.headers.get("Content-Type") || "").includes("text/html")) return;
  c.res.headers.set(
    "Content-Security-Policy",
    "default-src 'none'; base-uri 'none'; frame-ancestors 'none'; form-action 'self'; style-src 'self' 'unsafe-inline' https://cdn.jsdelivr.net; script-src 'self' 'unsafe-inline' https://cdn.jsdelivr.net; img-src 'self' data: https:; connect-src 'self'",
  );
  c.res.headers.set("X-Content-Type-Options", "nosniff");
  c.res.headers.set("X-Frame-Options", "DENY");
  c.res.headers.set("Referrer-Policy", "no-referrer");
  c.res.headers.set(
    "Permissions-Policy",
    "camera=(), microphone=(), geolocation=(), payment=(), usb=(), bluetooth=()",
  );
  c.res.headers.set("Cache-Control", "no-store");
});

// ── Root redirect → www landing page ──
app.get("/", (c) => {
  return c.redirect("https://www.darcloud.host/", 302);
});

// Replace the legacy root-scoped, cache-first QuranChain service worker. That
// worker can otherwise keep serving a rejected financial/DeFi shell from the
// browser cache after a production cutover. Keep this cleanup route deployed
// long enough for existing registrations to update before removing it.
app.get("/sw.js", (c) => {
  const cleanupWorker = `
self.addEventListener("install", (event) => event.waitUntil(self.skipWaiting()));
self.addEventListener("activate", (event) => {
  event.waitUntil((async () => {
    const keys = await caches.keys();
    await Promise.all(
      keys.filter((key) => key.startsWith("quranchain-"))
        .map((key) => caches.delete(key)),
    );
    await self.clients.claim();
    const windows = await self.clients.matchAll({ type: "window" });
    await self.registration.unregister();
    await Promise.all(windows.map((client) => client.navigate(client.url)));
  })());
});
self.addEventListener("fetch", (event) => {
  event.respondWith(fetch(event.request));
});
`;
  return new Response(cleanupWorker.trimStart(), {
    status: 200,
    headers: {
      "Content-Type": "application/javascript; charset=utf-8",
      "Cache-Control": "no-store, no-cache, must-revalidate",
      "Service-Worker-Allowed": "/",
      "X-Content-Type-Options": "nosniff",
    },
  });
});

app.get("/manifest.json", (c) => c.json(
  {
    id: "/onboarding",
    name: "DarCloud Preview Catalog",
    short_name: "DarCloud Preview",
    description: "Restricted, non-transactional DarCloud software previews.",
    start_url: "/onboarding",
    scope: "/",
    display: "standalone",
    background_color: "#07090f",
    theme_color: "#07090f",
  },
  200,
  { "Cache-Control": "no-store" },
));

// ── HTML Pages (account surfaces fail closed; guide and policies remain) ──
app.get("/signup", (c) => c.html(SIGNUP_PAGE, 410));
app.get("/login", (c) => c.html(LOGIN_PAGE, 410));
app.get("/onboarding", (c) => c.html(ONBOARDING_PAGE));
app.get("/dashboard", (c) => c.html(DASHBOARD_PAGE, 410));
app.get("/admin", (c) => c.html(
  "<!doctype html><html lang=\"en\"><head><meta charset=\"utf-8\"><meta name=\"viewport\" content=\"width=device-width,initial-scale=1\"><title>Admin unavailable</title></head><body><main><h1>Admin access is unavailable</h1><p>No production administrator role has been configured for this pre-release service.</p></main></body></html>",
  410,
));
app.get("/checkout/success", (c) => c.html(checkoutResultPage("success", c.req.query("session_id") || ""), 410));
app.get("/checkout/cancel", (c) => c.html(checkoutResultPage("cancel"), 410));
app.get("/checkout", (c) => c.html(checkoutPage("disabled"), 410));
app.get("/checkout/:plan", (c) => c.html(checkoutPage(c.req.param("plan")), 410));
app.get("/checkout/:plan/", (c) => c.html(checkoutPage(c.req.param("plan")), 410));
app.get("/privacy", (c) => c.html(PRIVACY_PAGE));
app.get("/privacy-policy", (c) => c.html(PRIVACY_PAGE));

// ── Auth & Checkout API ──
app.route("/api", auth);

// Stripe event processing is not part of this release candidate. Do not parse,
// acknowledge, persist, or act on webhook payloads. Any endpoint registered in
// Stripe must be removed by the account owner before a production deployment.
app.all("/api/stripe/webhook", (c) => c.json(
  {
    error: "Stripe webhook processing is unavailable.",
    received: false,
    payments: false,
    subscriptions: false,
  },
  410,
  { Allow: "GET, HEAD, OPTIONS" },
));

// ── Checkout is disabled until fulfillment and disclosures are verified. ──
app.post("/api/checkout/session", (c) => {
  return c.json(
    {
      error: "Checkout is disabled.",
      mode: "non-transactional-preview",
      payments: false,
      subscriptions: false,
    },
    405,
    { Allow: "GET, HEAD, OPTIONS" },
  );
});

// Do not accept arbitrary customer IDs. A future portal must require an
// authenticated user and verify ownership server-side before creating a link.
app.post("/api/stripe/portal", (c) => {
  return c.json(
    { error: "The subscription portal is disabled.", subscriptions: false },
    405,
    { Allow: "GET, HEAD, OPTIONS" },
  );
});

// Historical revenue tables contain pre-release planning records and are not
// presented as verified revenue, balances, subscriptions, or distributions.
app.get("/api/revenue/dashboard", (c) => {
  return c.json({
    error: "Revenue reporting is unavailable.",
    mode: "internal-planning-only",
    revenue_verified: false,
    subscriptions_enabled: false,
  }, 410);
});

app.get("/api/revenue/treasury", (c) => {
  return c.json({
    error: "Treasury reporting is unavailable.",
    mode: "internal-planning-only",
    balances_verified: false,
    payouts_enabled: false,
  }, 410);
});

// The former member-status route accepted an arbitrary account identifier and
// returned a full user row. Keep it retired until a scoped, self-service route
// with explicit response fields and an administrator authorization model exists.
const onboardingStatusUnavailable = (c: any) => c.json(
  {
    error: "Onboarding status lookup is unavailable.",
    mode: "internal-planning-only",
    account_lookup_enabled: false,
  },
  410,
  { Allow: "GET, HEAD, OPTIONS" },
);
app.all("/api/onboarding/status", onboardingStatusUnavailable);
app.all("/api/onboarding/status/*", onboardingStatusUnavailable);

// ── Inter-Company Contracts, DarLaw, & IP Protection ──
const contractsUnavailable = (c: any) => c.json(
  {
    error: "Contract and legal automation endpoints are retired.",
    mode: "internal-planning-only",
    signed: false,
    filed: false,
    licensed: false,
    revenue_verified: false,
  },
  410,
  { Allow: "GET, HEAD, OPTIONS" },
);
app.all("/api/contracts", contractsUnavailable);
app.all("/api/contracts/*", contractsUnavailable);

// Production routes under /meshtalk* belong to the separately deployed
// `quranchain` Worker. If this broader Worker ever receives one of those paths,
// fail closed instead of serving a misleading 404 or an unrelated application.
const meshTalkRouteGuard = (c: any) => c.json(
  {
    error: "MeshTalk is unavailable through this deployment.",
    service: "meshtalk",
    expected_route_owner: "quranchain",
    handled_here: false,
    writes_enabled: false,
  },
  503,
  {
    "Cache-Control": "no-store",
    "Retry-After": "300",
  },
);
app.all("/meshtalk", meshTalkRouteGuard);
app.all("/meshtalk/*", meshTalkRouteGuard);

// ── Privacy Request Endpoint ──
// No monitored, identity-verified intake workflow exists yet. Fail closed
// rather than collecting requests that cannot be safely fulfilled.
app.all("/api/privacy-request", (c) => c.json(
  {
    error: "Automated privacy-request intake is unavailable.",
    stored: false,
  },
  410,
));

// ── Terms of Service Page ──
app.get("/terms", (c) => c.html(TERMS_PAGE));

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

// Retire operational prototypes that previously allowed unauthenticated reads
// and mutations. No administrator role model exists yet, so fail closed rather
// than presenting these routes as live infrastructure.
const operationalEndpointUnavailable = (c: any) => c.json(
  {
    error: "Operational endpoint is unavailable.",
    mode: "internal-planning-only",
    writes_enabled: false,
    live_infrastructure_verified: false,
  },
  410,
  { Allow: "GET, HEAD, OPTIONS" },
);

for (const path of [
  "/tasks",
  "/backups",
  "/mesh",
  "/ai",
  "/minecraft",
  "/multipass",
  "/messages",
  "/messaging",
  "/telecom",
  "/wifi",
  "/isp",
]) {
  app.all(path, operationalEndpointUnavailable);
  app.all(`${path}/*`, operationalEndpointUnavailable);
}

app.get("/health", (c) => c.json({
  status: "preview",
  service: "DarCloud pre-release API",
  version: "5.4.0",
  mode: "restricted",
  payments: false,
  contracts: false,
  operational_writes: false,
  live_infrastructure_verified: false,
}));

// Setup OpenAPI documentation after every public route is registered.
fromHono(app, {
  docs_url: "/docs",
  schema: {
    info: {
      title: "QuranChain™ — DarCloud API",
      version: "5.4.0",
      description:
        "Pre-release DarCloud software API. Availability and persistence vary by endpoint. " +
        "Some operational endpoints are internal prototypes and must not be treated as proof of live infrastructure, customers, companies, contracts, licenses, filings, revenue, or regulated activity. " +
        "Checkout, paid entitlements, contract/legal automation, financial services, token activity, and real-world fulfillment are disabled. " +
        "Main account access and payment processing are retired. Built on Cloudflare Workers, D1, Hono, and chanfana.",
    },
  },
});

// Export the Hono app
export default app;
