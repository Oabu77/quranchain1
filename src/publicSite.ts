import { Hono } from "hono";
import type { Context, Next } from "hono";
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
import { auth, requireAuth } from "./endpoints/auth";
import { messagingRouter } from "./endpoints/messaging/router";
import { MESSAGING_PAGE } from "./components/MessagingSystem";
import {
  MESHTALK_CHILD_SAFETY_PAGE,
  MESHTALK_HOME_PAGE,
  MESHTALK_PRIVACY_PAGE,
  MESHTALK_TERMS_PAGE,
} from "./public/policies";
import {
  createCheckoutSession,
  createCustomerPortal,
  handleStripeWebhook,
} from "./public/payments";
import type { PublicAppEnv } from "./public/types";

const app = new Hono<PublicAppEnv>();
const MAX_PUBLIC_WRITE_BYTES = 1024 * 1024;

const SAFE_SUBDOMAIN_WRITE_PATHS = new Set([
  "/api/auth/signup",
  "/api/auth/login",
  "/api/auth/logout",
  "/api/contact",
  "/api/hwc/apply",
  "/api/privacy-request",
  "/api/checkout/session",
  "/api/stripe/portal",
  "/api/stripe/webhook",
  "/api/webhooks/stripe",
]);

function isAllowedOrigin(origin: string): boolean {
  return /^https:\/\/([a-z0-9-]+\.)?darcloud\.(host|net)$/i.test(origin);
}

function isDarCloudSubdomain(hostname: string): boolean {
  return /^[a-z0-9-]+\.darcloud\.(host|net)$/i.test(hostname);
}

function appendVary(headers: Headers, value: string): void {
  const values = (headers.get("vary") || "")
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean);
  if (!values.some((item) => item.toLowerCase() === value.toLowerCase())) {
    values.push(value);
  }
  if (values.length > 0) headers.set("Vary", values.join(", "));
}

function applyPublicHeaders(response: Response, origin: string, apiPath: boolean): Response {
  const headers = new Headers(response.headers);
  for (const name of [
    "access-control-allow-origin",
    "access-control-allow-credentials",
    "access-control-allow-methods",
    "access-control-allow-headers",
  ]) {
    headers.delete(name);
  }

  if (origin) appendVary(headers, "Origin");
  if (isAllowedOrigin(origin)) {
    headers.set("Access-Control-Allow-Origin", origin);
    headers.set("Access-Control-Allow-Credentials", "true");
  }

  headers.set("Strict-Transport-Security", "max-age=31536000; includeSubDomains; preload");
  headers.set("X-Content-Type-Options", "nosniff");
  headers.set("X-Frame-Options", "DENY");
  headers.set("Referrer-Policy", "strict-origin-when-cross-origin");
  headers.set("Permissions-Policy", "camera=(), microphone=(), geolocation=(), payment=(self)");
  headers.set(
    "Content-Security-Policy",
    "default-src 'self'; base-uri 'self'; object-src 'none'; frame-ancestors 'none'; form-action 'self' https://checkout.stripe.com; script-src 'self' 'unsafe-inline'; style-src 'self' 'unsafe-inline'; img-src 'self' data: https:; connect-src 'self' https://*.darcloud.host https://*.darcloud.net https://api.stripe.com; upgrade-insecure-requests",
  );
  if (apiPath) headers.set("Cache-Control", "no-store");

  return new Response(response.body, {
    status: response.status,
    statusText: response.statusText,
    headers,
  });
}

app.use("*", async (c, next) => {
  const origin = c.req.header("origin") || "";
  const path = new URL(c.req.url).pathname;

  if (c.req.method === "OPTIONS") {
    const headers = new Headers({
      "Access-Control-Allow-Methods": "GET,HEAD,POST,OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type,Authorization,Stripe-Signature",
      "Access-Control-Max-Age": "600",
      "Strict-Transport-Security": "max-age=31536000; includeSubDomains; preload",
      "X-Content-Type-Options": "nosniff",
    });
    appendVary(headers, "Origin");
    if (isAllowedOrigin(origin)) {
      headers.set("Access-Control-Allow-Origin", origin);
      headers.set("Access-Control-Allow-Credentials", "true");
    }
    return new Response(null, { status: 204, headers });
  }

  await next();
  c.res = applyPublicHeaders(c.res, origin, path.startsWith("/api/") || path.startsWith("/messaging/"));
});

app.use("*", async (c, next) => {
  if (!["GET", "HEAD", "OPTIONS"].includes(c.req.method)) {
    const declaredLength = Number(c.req.header("content-length") || "0");
    if (Number.isFinite(declaredLength) && declaredLength > MAX_PUBLIC_WRITE_BYTES) {
      return c.json({ error: "Request body is too large" }, 413);
    }
  }
  await next();
});

app.use("*", async (c, next) => {
  const url = new URL(c.req.url);
  const isSubdomain = isDarCloudSubdomain(url.hostname);
  const isNetApex = url.hostname === "darcloud.net";

  if (!isSubdomain && !isNetApex) {
    await next();
    return;
  }

  const isRead = c.req.method === "GET" || c.req.method === "HEAD";
  const isApiPath = url.pathname.startsWith("/api/") || url.pathname.startsWith("/messaging/");

  if (!isRead) {
    const safeWrite = SAFE_SUBDOMAIN_WRITE_PATHS.has(url.pathname) || url.pathname.startsWith("/messaging/");
    if (!safeWrite) return c.json({ error: "This operation is not available on the public site" }, 405);
    await next();
    return;
  }

  if (isApiPath) {
    await next();
    return;
  }

  if (url.hostname === "checkout.darcloud.host" || url.hostname === "checkout.darcloud.net") {
    if (url.pathname === "/" || url.pathname === "/checkout") {
      return c.html(checkoutPage("pro"));
    }
    if (url.pathname.startsWith("/checkout/")) {
      return c.html(checkoutPage(url.pathname.split("/").filter(Boolean).at(-1) || "pro"));
    }
    if (url.pathname === "/success") {
      return c.html(pendingCheckoutPage(url.searchParams.get("session_id") || ""));
    }
    if (url.pathname === "/cancel") return c.html(checkoutResultPage("cancel"));
    return c.notFound();
  }

  const response = await handleSubdomain(c.req.raw);
  if (response) return response;
  if (isSubdomain || isNetApex) return c.notFound();
  await next();
});

function simplePage(title: string, body: string): string {
  return `<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>${title} | DarCloud</title><style>:root{color-scheme:dark;background:#07090f;color:#e6edf3;font-family:Inter,system-ui,sans-serif}body{margin:0;min-height:100vh;background:linear-gradient(180deg,#07111c,#07090f)}main{width:min(900px,calc(100% - 2rem));margin:auto;padding:3rem 0}a{color:#55d7ff}.card{background:#0d1520;border:1px solid #243142;border-radius:16px;padding:1.5rem}h1{font-size:clamp(2rem,6vw,3.5rem)}p{line-height:1.7;color:#c4cedd}code{overflow-wrap:anywhere}</style></head><body><main><div class="card"><h1>${title}</h1>${body}</div></main></body></html>`;
}

function pendingCheckoutPage(sessionId: string): string {
  const safeSession = sessionId.replace(/[^a-zA-Z0-9_-]/g, "").slice(0, 128);
  return simplePage(
    "Payment received — verification pending",
    `<p>Your secure checkout returned successfully. DarCloud activates paid service only after Stripe sends a verified payment webhook.</p><p>Checkout reference: <code>${safeSession || "pending"}</code></p><p><a href="/dashboard">Open your dashboard</a> · <a href="https://www.darcloud.host/">DarCloud home</a></p>`,
  );
}

const PUBLIC_ADMIN_PAGE = simplePage(
  "DarCloud Admin",
  `<p id="adminStatus">Sign in with an authorized administrator account to view operational statistics.</p><pre id="adminData" style="white-space:pre-wrap;overflow-wrap:anywhere"></pre><p><a href="/dashboard">Back to dashboard</a></p><script>(async()=>{const token=localStorage.getItem('darcloud_token');if(!token){document.getElementById('adminStatus').textContent='Admin sign-in required.';return;}const r=await fetch('/api/admin/stats',{headers:{Authorization:'Bearer '+token}});if(r.status===403){document.getElementById('adminStatus').textContent='Admin access is required for this page.';return;}if(!r.ok){document.getElementById('adminStatus').textContent='Admin data is temporarily unavailable.';return;}const data=await r.json();document.getElementById('adminStatus').textContent='Authorized admin overview';document.getElementById('adminData').textContent=JSON.stringify(data,null,2);})().catch(()=>{document.getElementById('adminStatus').textContent='Admin data is temporarily unavailable.';});</script>`,
);

const DOCS_PAGE = simplePage(
  "DarCloud Public API",
  `<p>This public Worker intentionally exposes only account, contact, privacy, secure checkout, verified Stripe webhook, and authenticated messaging routes.</p><ul><li>GET /health</li><li>POST /api/auth/signup</li><li>POST /api/auth/login</li><li>GET /api/auth/session</li><li>GET /api/auth/me</li><li>POST /api/contact</li><li>POST /api/hwc/apply</li><li>POST /api/privacy-request</li><li>POST /api/checkout/session</li><li>POST /api/stripe/portal</li><li>POST /api/stripe/webhook</li><li>Authenticated /messaging routes</li></ul><p>Infrastructure control-plane routes are not published from this Worker.</p>`,
);

async function forwardToAuth(
  c: Context<PublicAppEnv>,
  internalPath: string,
  body?: string,
): Promise<Response> {
  const target = new URL(c.req.url);
  target.pathname = internalPath;
  target.search = internalPath === "/lookup" ? new URL(c.req.url).search : "";
  const headers = new Headers(c.req.raw.headers);
  headers.delete("content-length");
  const request = new Request(target.toString(), {
    method: c.req.method,
    headers,
    body,
  });
  return auth.fetch(request, c.env, c.executionCtx);
}

app.get("/", (c) => c.redirect("https://www.darcloud.host/", 302));
app.get("/signup", (c) => c.html(SIGNUP_PAGE));
app.get("/login", (c) => c.html(LOGIN_PAGE));
app.get("/onboarding", (c) => c.html(ONBOARDING_PAGE));
app.get("/dashboard", (c) => c.html(DASHBOARD_PAGE));
app.get("/admin", (c) => c.html(PUBLIC_ADMIN_PAGE));
app.get("/checkout", (c) => c.redirect("/checkout/pro", 302));
app.get("/checkout/success", (c) => c.html(pendingCheckoutPage(c.req.query("session_id") || "")));
app.get("/checkout/cancel", (c) => c.html(checkoutResultPage("cancel")));
app.get("/checkout/:plan", (c) => c.html(checkoutPage(c.req.param("plan"))));
app.get("/privacy", (c) => c.html(PRIVACY_PAGE));
app.get("/privacy-policy", (c) => c.html(PRIVACY_PAGE));
app.get("/terms", (c) => c.html(TERMS_PAGE));
app.get("/messages", (c) => c.html(MESSAGING_PAGE));
app.get("/meshtalk", (c) => c.html(MESHTALK_HOME_PAGE));
app.get("/meshtalk/privacy", (c) => c.html(MESHTALK_PRIVACY_PAGE));
app.get("/meshtalk/terms", (c) => c.html(MESHTALK_TERMS_PAGE));
app.get("/meshtalk/child-safety", (c) => c.html(MESHTALK_CHILD_SAFETY_PAGE));
app.get("/docs", (c) => c.html(DOCS_PAGE));

app.get("/health", async (c) => {
  let tables = 0;
  let database = "healthy";
  try {
    const result = await c.env.DB.prepare(
      "SELECT COUNT(*) AS count FROM sqlite_master WHERE type = 'table'",
    ).first<{ count: number }>();
    tables = Number(result?.count || 0);
  } catch {
    database = "unavailable";
  }
  return c.json({
    status: database === "healthy" ? "healthy" : "degraded",
    service: "darcloud-public",
    version: "2026.09.02",
    components: {
      database: { status: database, tables },
      ai_agents: 77,
      control_plane: "not publicly routed",
    },
  });
});

app.post("/api/auth/signup", async (c) => {
  let body: Record<string, unknown>;
  try {
    body = await c.req.json<Record<string, unknown>>();
  } catch {
    return c.json({ error: "Invalid JSON body" }, 400);
  }
  return forwardToAuth(c, "/auth/signup", JSON.stringify({ ...body, plan: "starter" }));
});

app.post("/api/auth/login", (c) => forwardToAuth(c, "/auth/login", c.req.raw.body ? undefined : undefined));
app.post("/api/auth/login", async (c, next) => {
  await next();
});

async function proxyBody(c: Context<PublicAppEnv>, path: string): Promise<Response> {
  const body = ["GET", "HEAD"].includes(c.req.method) ? undefined : await c.req.text();
  return forwardToAuth(c, path, body);
}

app.post("/api/auth/login", (c) => proxyBody(c, "/auth/login"));
app.post("/api/auth/logout", (c) => proxyBody(c, "/auth/logout"));
app.get("/api/auth/session", (c) => proxyBody(c, "/auth/session"));
app.get("/api/auth/me", (c) => proxyBody(c, "/auth/me"));
app.get("/api/lookup", (c) => proxyBody(c, "/lookup"));
app.post("/api/contact", (c) => proxyBody(c, "/contact"));
app.post("/api/hwc/apply", (c) => proxyBody(c, "/hwc/apply"));

app.post("/api/checkout/session", createCheckoutSession);
app.post("/api/stripe/portal", createCustomerPortal);
app.post("/api/stripe/webhook", handleStripeWebhook);
app.post("/api/webhooks/stripe", handleStripeWebhook);

app.post("/api/privacy-request", async (c) => {
  let body: Record<string, unknown>;
  try {
    body = await c.req.json<Record<string, unknown>>();
  } catch {
    return c.json({ error: "Invalid JSON body" }, 400);
  }

  const email = typeof body.email === "string" ? body.email.trim().toLowerCase().slice(0, 254) : "";
  const type = typeof body.type === "string" ? body.type.trim().slice(0, 40) : "";
  const details = typeof body.details === "string" ? body.details.trim().slice(0, 2000) : "";
  const allowedTypes = new Set(["data-access", "data-deletion", "data-export", "opt-out", "other"]);
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) || !allowedTypes.has(type)) {
    return c.json({ error: "A valid email and request type are required" }, 400);
  }

  const reference = `PR-${Date.now()}-${crypto.randomUUID().slice(0, 8)}`;
  try {
    await c.env.DB.prepare(
      "INSERT INTO privacy_requests (email, request_type, details, reference, status, created_at) VALUES (?, ?, ?, ?, 'pending', datetime('now'))",
    )
      .bind(email, type, details, reference)
      .run();
    return c.json({ success: true, reference });
  } catch {
    return c.json({ error: "Privacy request service is temporarily unavailable" }, 503);
  }
});

app.get("/api/admin/stats", async (c) => {
  const authResponse = await requireAuth(c as never);
  if (authResponse) return authResponse;
  const user = c.get("user");
  const email = typeof user?.email === "string" ? user.email.toLowerCase() : "";
  const admins = (c.env.DARCLOUD_ADMIN_EMAILS || "")
    .split(",")
    .map((value) => value.trim().toLowerCase())
    .filter(Boolean);
  if (!email || admins.length === 0 || !admins.includes(email)) {
    return c.json({ error: "Admin access required" }, 403);
  }

  const count = async (table: string): Promise<number> => {
    try {
      const result = await c.env.DB.prepare(`SELECT COUNT(*) AS count FROM ${table}`).first<{ count: number }>();
      return Number(result?.count || 0);
    } catch {
      return 0;
    }
  };

  const [users, companies, contracts, legalFilings, ipProtections, contacts, hwc] = await Promise.all([
    count("users"),
    count("companies"),
    count("contracts"),
    count("legal_filings"),
    count("ip_protections"),
    count("contact_submissions"),
    count("hwc_applications"),
  ]);
  const recentUsers = await c.env.DB.prepare(
    "SELECT email, name, plan, created_at FROM users ORDER BY created_at DESC LIMIT 20",
  ).all();
  const planBreakdown = await c.env.DB.prepare(
    "SELECT plan, COUNT(*) AS count FROM users GROUP BY plan ORDER BY plan",
  ).all();

  return c.json({
    success: true,
    stats: {
      users,
      companies,
      contracts,
      legal_filings: legalFilings,
      ip_protections: ipProtections,
      contact_submissions: contacts,
      hwc_applications: hwc,
    },
    recent_users: recentUsers.results,
    plan_breakdown: planBreakdown.results,
  });
});

app.route("/messaging", messagingRouter);

app.notFound((c) => c.json({ error: "Not found" }, 404));
app.onError((_error, c) => c.json({ error: "Internal service error" }, 500));

export default app;
