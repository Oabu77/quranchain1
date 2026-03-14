import { ApiException, fromHono } from "chanfana";
import { Hono } from "hono";
import { tasksRouter } from "./endpoints/tasks/router";
import { backupsRouter } from "./endpoints/backups/router";
import { meshRouter } from "./endpoints/mesh/router";
import { aiRouter } from "./endpoints/ai/router";
import { minecraftRouter } from "./endpoints/minecraft/router";
import { multipassRouter } from "./endpoints/multipass/router";
import { telecomRouter } from "./endpoints/telecom/router";
import { wifiRouter } from "./endpoints/wifi/router";
import { ispRouter } from "./endpoints/isp/router";
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
  const response = await handleSubdomain(c.req.raw);
  if (response) return response;
  await next();
});

// ── CORS middleware for all routes (support cross-subdomain SSO cookies) ──
app.use("*", async (c, next) => {
  const origin = c.req.header("Origin") || "";
  // Allow any *.darcloud.host or *.darcloud.net origin, or the apex domains
  const isAllowedOrigin = /^https?:\/\/([\w-]+\.)?darcloud\.(host|net)(:\d+)?$/.test(origin);
  const allowOrigin = isAllowedOrigin ? origin : "*";

  if (c.req.method === "OPTIONS") {
    return new Response(null, {
      status: 204,
      headers: {
        "Access-Control-Allow-Origin": allowOrigin,
        "Access-Control-Allow-Methods": "GET,POST,PUT,DELETE,OPTIONS",
        "Access-Control-Allow-Headers": "Content-Type,Authorization",
        "Access-Control-Allow-Credentials": "true",
      },
    });
  }
  await next();
  c.res.headers.set("Access-Control-Allow-Origin", allowOrigin);
  if (isAllowedOrigin) {
    c.res.headers.set("Access-Control-Allow-Credentials", "true");
  }
});

// ── Root redirect → www landing page ──
app.get("/", (c) => {
  return c.redirect("https://www.darcloud.host/", 302);
});

// ── HTML Pages (signup, login, checkout, onboarding, dashboard, admin) ──
app.get("/signup", (c) => c.html(SIGNUP_PAGE));
app.get("/login", (c) => c.html(LOGIN_PAGE));
app.get("/onboarding", (c) => c.html(ONBOARDING_PAGE));
app.get("/dashboard", (c) => c.html(DASHBOARD_PAGE));
app.get("/admin", (c) => c.html(ADMIN_PAGE));
app.get("/checkout/success", (c) => c.html(checkoutResultPage("success", c.req.query("session_id") || "")));
app.get("/checkout/cancel", (c) => c.html(checkoutResultPage("cancel")));
app.get("/checkout/:plan", (c) => c.html(checkoutPage(c.req.param("plan"))));
app.get("/privacy", (c) => c.html(PRIVACY_PAGE));
app.get("/privacy-policy", (c) => c.html(PRIVACY_PAGE));

// ── Auth & Checkout API ──
app.route("/api", auth);

// ── Stripe Webhook Endpoint (with signature verification) ──
app.post("/api/stripe/webhook", async (c) => {
  try {
    const body = await c.req.text();
    const signature = c.req.header("stripe-signature") || "";
    const webhookSecret = c.env.STRIPE_WEBHOOK_SECRET;

    // Verify webhook signature if secret is configured
    if (webhookSecret && signature) {
      const parts = signature.split(",").reduce((acc: Record<string, string>, part: string) => {
        const [key, val] = part.split("=");
        acc[key] = val;
        return acc;
      }, {} as Record<string, string>);
      const timestamp = parts["t"];
      const sig = parts["v1"];
      if (!timestamp || !sig) {
        return c.json({ error: "Invalid signature format" }, 400);
      }
      // Reject timestamps older than 5 minutes to prevent replay attacks
      const tolerance = 300;
      const now = Math.floor(Date.now() / 1000);
      if (Math.abs(now - parseInt(timestamp)) > tolerance) {
        return c.json({ error: "Webhook timestamp too old" }, 400);
      }
      const payload = `${timestamp}.${body}`;
      const encoder = new TextEncoder();
      const key = await crypto.subtle.importKey(
        "raw", encoder.encode(webhookSecret), { name: "HMAC", hash: "SHA-256" }, false, ["sign"]
      );
      const sigBytes = await crypto.subtle.sign("HMAC", key, encoder.encode(payload));
      const hmac = Array.from(new Uint8Array(sigBytes)).map(b => b.toString(16).padStart(2, "0")).join("");
      if (hmac !== sig) {
        console.error("[Stripe Webhook] Signature verification FAILED");
        return c.json({ error: "Invalid signature" }, 400);
      }
    }

    const event = JSON.parse(body);
    console.log(`[Stripe Webhook] Event: ${event.type} (verified: ${!!webhookSecret})`);

    // Store webhook event in D1 for processing by bots
    try {
      const db = c.env.DB;
      await db.prepare(
        "INSERT INTO onboarding_events (discord_id, event_type, event_data, bot_source) VALUES (?, ?, ?, ?)"
      ).bind(
        event.data?.object?.metadata?.discord_id || "unknown",
        event.type,
        body,
        "stripe"
      ).run();
    } catch (dbErr) {
      console.error("Webhook DB error:", dbErr);
    }

    // Process payment events
    const db = c.env.DB;
    if (event.type === "checkout.session.completed") {
      const session = event.data.object;
      const discordId = session.metadata?.discord_id || "unknown";
      const product = session.metadata?.product || "unknown";
      const amount = session.amount_total || 0;
      if (amount > 0) {
        const splits = {
          founder: Math.floor(amount * 0.30),
          validators: Math.floor(amount * 0.40),
          hardware: Math.floor(amount * 0.10),
          ecosystem: Math.floor(amount * 0.18),
          zakat: Math.floor(amount * 0.02),
        };
        const net = splits.founder + splits.validators + splits.hardware + splits.ecosystem + splits.zakat;
        const period = new Date().toISOString().slice(0, 7);

        // Record in revenue ledger (immutable audit trail)
        try {
          await db.prepare(
            `INSERT INTO revenue_ledger (payment_id, stripe_session_id, discord_id, product, gross_amount, founder_amount, validators_amount, hardware_amount, ecosystem_amount, zakat_amount, discord_cut, net_amount, source, status, period)
             VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'stripe', 'confirmed', ?)`
          ).bind(
            session.payment_intent || session.id, session.id, discordId, product,
            amount, splits.founder, splits.validators, splits.hardware, splits.ecosystem, splits.zakat,
            amount - net, net, period
          ).run();

          // Update treasury account balances
          const accounts = ["founder", "validators", "hardware", "ecosystem", "zakat"] as const;
          for (const acct of accounts) {
            await db.prepare(
              `UPDATE treasury_accounts SET balance_cents = balance_cents + ?, total_received_cents = total_received_cents + ?, updated_at = datetime('now') WHERE account_type = ?`
            ).bind(splits[acct], splits[acct], acct).run();
          }

          // Update user plan if it's a subscription product
          if (product === "pro" || product === "enterprise") {
            await db.prepare(
              `UPDATE users SET plan = ?, updated_at = datetime('now') WHERE email LIKE ?`
            ).bind(product, `%${discordId}%`).run().catch(() => {});
          }

          // Track subscription
          if (session.subscription) {
            await db.prepare(
              `INSERT OR REPLACE INTO active_subscriptions (discord_id, stripe_subscription_id, stripe_customer_id, product, plan, amount_cents, status, current_period_start)
               VALUES (?, ?, ?, ?, ?, ?, 'active', datetime('now'))`
            ).bind(discordId, session.subscription, session.customer || "", product, product, amount).run();
          }

          console.log(`[Stripe] ✅ Revenue recorded: $${(amount / 100).toFixed(2)} | ${product} | ${discordId} | Ledger + Treasury updated`);
        } catch (ledgerErr) {
          console.error("[Stripe] Revenue ledger error:", ledgerErr);
        }
      }
    }

    // Handle subscription lifecycle
    if (event.type === "customer.subscription.updated" || event.type === "customer.subscription.deleted") {
      const sub = event.data.object;
      const discordId = sub.metadata?.discord_id;
      const status = sub.status === "active" ? "active" : sub.status === "canceled" ? "cancelled" : sub.status;
      if (discordId) {
        try {
          await db.prepare(
            `UPDATE active_subscriptions SET status = ?, updated_at = datetime('now') WHERE stripe_subscription_id = ?`
          ).bind(status, sub.id).run();
          if (status === "cancelled") {
            await db.prepare(`UPDATE users SET plan = 'starter', updated_at = datetime('now') WHERE email LIKE ?`)
              .bind(`%${discordId}%`).run().catch(() => {});
          }
        } catch (subErr) { console.error("[Stripe] Subscription update error:", subErr); }
      }
    }

    if (event.type === "invoice.payment_failed") {
      const invoice = event.data.object;
      const discordId = invoice.metadata?.discord_id || invoice.subscription_details?.metadata?.discord_id;
      if (discordId) {
        try {
          await db.prepare(
            `INSERT INTO revenue_ledger (payment_id, stripe_session_id, discord_id, product, gross_amount, founder_amount, validators_amount, hardware_amount, ecosystem_amount, zakat_amount, discord_cut, net_amount, source, status, period)
             VALUES (?, ?, ?, 'failed', ?, 0, 0, 0, 0, 0, 0, 0, 'stripe', 'failed', ?)`
          ).bind(invoice.payment_intent || invoice.id, invoice.id, discordId, invoice.amount_due || 0, new Date().toISOString().slice(0, 7)).run();
        } catch (failErr) { console.error("[Stripe] Failed payment log error:", failErr); }
      }
    }

    return c.json({ received: true });
  } catch (err) {
    console.error("Webhook error:", err);
    return c.json({ error: "Webhook processing failed" }, 400);
  }
});

// ── Payment Checkout Session API (real Stripe) ──
app.post("/api/checkout/session", async (c) => {
  try {
    const { plan, discord_id, email } = await c.req.json();
    const plans: Record<string, { name: string; price: number; price_id: string; mode: string }> = {
      pro: { name: "DarCloud Professional", price: 4900, price_id: "price_1TAR0SAqs2ifkfkqOKa2Rzq3", mode: "subscription" },
      enterprise: { name: "DarCloud Enterprise", price: 49900, price_id: "price_1TAR0TAqs2ifkfkqdtr8kWEf", mode: "subscription" },
      fungimesh: { name: "FungiMesh Node", price: 1999, price_id: "price_1TAR0TAqs2ifkfkqqrjzoLdm", mode: "subscription" },
      hwc: { name: "HWC Premium", price: 9900, price_id: "price_1TAR0TAqs2ifkfkqKFPTW7hM", mode: "subscription" },
    };

    const selectedPlan = plans[plan];
    if (!selectedPlan) {
      return c.json({ error: "Invalid plan" }, 400);
    }

    const stripeKey = c.env.STRIPE_SECRET_KEY;
    if (!stripeKey) {
      return c.json({ error: "Payment system not configured" }, 500);
    }

    // Create real Stripe Checkout Session via API
    const params = new URLSearchParams();
    params.append("mode", selectedPlan.mode);
    params.append("line_items[0][price]", selectedPlan.price_id);
    params.append("line_items[0][quantity]", "1");
    params.append("success_url", "https://darcloud.host/checkout/success?session_id={CHECKOUT_SESSION_ID}");
    params.append("cancel_url", "https://darcloud.host/checkout/cancel");
    if (email) params.append("customer_email", email);
    if (discord_id) params.append("metadata[discord_id]", discord_id);
    params.append("metadata[product]", plan);

    const stripeRes = await fetch("https://api.stripe.com/v1/checkout/sessions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${stripeKey}`,
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: params.toString(),
    });

    const session = await stripeRes.json() as any;
    if (session.error) {
      console.error("[Checkout] Stripe error:", session.error.message);
      return c.json({ error: session.error.message }, 400);
    }

    return c.json({
      success: true,
      session_id: session.id,
      checkout_url: session.url,
      plan: selectedPlan.name,
      amount: selectedPlan.price,
      currency: "usd",
    });
  } catch (err) {
    return c.json({ error: "Failed to create checkout session" }, 500);
  }
});

// ── Customer Portal (manage subscriptions) ──
app.post("/api/stripe/portal", async (c) => {
  try {
    const { customer_id } = await c.req.json();
    const stripeKey = c.env.STRIPE_SECRET_KEY;
    if (!stripeKey || !customer_id) {
      return c.json({ error: "Missing customer or configuration" }, 400);
    }
    const params = new URLSearchParams();
    params.append("customer", customer_id);
    params.append("return_url", "https://darcloud.host/dashboard");
    const res = await fetch("https://api.stripe.com/v1/billing_portal/sessions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${stripeKey}`,
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: params.toString(),
    });
    const portal = await res.json() as any;
    if (portal.error) return c.json({ error: portal.error.message }, 400);
    return c.json({ success: true, portal_url: portal.url });
  } catch {
    return c.json({ error: "Failed to create portal session" }, 500);
  }
});

// ── Revenue Dashboard API ──
app.get("/api/revenue/dashboard", async (c) => {
  const db = c.env.DB;
  try {
    const totalRow = await db.prepare("SELECT SUM(gross_amount) as total, COUNT(*) as count FROM revenue_ledger WHERE status='confirmed'").first() as any;
    const treasury = await db.prepare("SELECT * FROM treasury_accounts ORDER BY account_type").all();
    const monthly = await db.prepare("SELECT period, SUM(gross_amount) as revenue, COUNT(*) as transactions FROM revenue_ledger WHERE status='confirmed' GROUP BY period ORDER BY period DESC LIMIT 12").all();
    const byProduct = await db.prepare("SELECT product, SUM(gross_amount) as revenue, COUNT(*) as count FROM revenue_ledger WHERE status='confirmed' GROUP BY product").all();
    const subs = await db.prepare("SELECT product, COUNT(*) as count, SUM(amount_cents) as mrr FROM active_subscriptions WHERE status='active' GROUP BY product").all();
    const total = totalRow?.total || 0;
    return c.json({
      success: true,
      revenue: {
        total_cents: total,
        total_display: `$${(total / 100).toFixed(2)}`,
        transactions: totalRow?.count || 0,
        splits: {
          founder: `$${(total * 0.30 / 100).toFixed(2)} (30%)`,
          validators: `$${(total * 0.40 / 100).toFixed(2)} (40%)`,
          hardware: `$${(total * 0.10 / 100).toFixed(2)} (10%)`,
          ecosystem: `$${(total * 0.18 / 100).toFixed(2)} (18%)`,
          zakat: `$${(total * 0.02 / 100).toFixed(2)} (2%)`,
        },
      },
      treasury: treasury.results,
      monthly_breakdown: monthly.results,
      by_product: byProduct.results,
      active_subscriptions: subs.results,
    });
  } catch (err: any) {
    return c.json({ success: false, error: err.message }, 500);
  }
});

app.get("/api/revenue/treasury", async (c) => {
  const db = c.env.DB;
  try {
    const treasury = await db.prepare("SELECT * FROM treasury_accounts ORDER BY account_type").all();
    const recentPayouts = await db.prepare("SELECT * FROM payout_history ORDER BY created_at DESC LIMIT 20").all();
    const zakatDist = await db.prepare("SELECT * FROM zakat_distributions ORDER BY created_at DESC LIMIT 20").all();
    return c.json({
      success: true,
      accounts: treasury.results,
      recent_payouts: recentPayouts.results,
      zakat_distributions: zakatDist.results,
    });
  } catch (err: any) {
    return c.json({ success: false, error: err.message }, 500);
  }
});

// ── Member Onboarding Status API ──
app.get("/api/onboarding/status/:discordId", async (c) => {
  const discordId = c.req.param("discordId");
  try {
    const db = c.env.DB;
    const user = await db.prepare("SELECT * FROM users WHERE email LIKE ?").bind(`%${discordId}%`).first();
    return c.json({
      success: true,
      member: user || null,
      onboarded: !!user?.onboarded_at,
    });
  } catch {
    return c.json({ success: false, member: null });
  }
});

// ── Inter-Company Contracts, DarLaw, & IP Protection ──
app.route("/api/contracts", contracts);

// ── Privacy Request Endpoint ──
app.post("/api/privacy-request", async (c) => {
  try {
    const { email, type, details } = await c.req.json();
    if (!email || !type) {
      return c.json({ error: "Email and request type are required" }, 400);
    }
    const reference = `PR-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;
    try {
      const db = c.env.DB;
      await db.prepare(
        "INSERT INTO privacy_requests (email, request_type, details, reference, status, created_at) VALUES (?, ?, ?, ?, ?, datetime('now'))"
      ).bind(email, type, details || "", reference, "pending").run();
    } catch {
      // Table may not exist yet — still return success with reference
    }
    return c.json({ success: true, reference, message: "Privacy request submitted. We will respond within 30 days." });
  } catch {
    return c.json({ error: "Failed to submit privacy request" }, 500);
  }
});

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

// Setup OpenAPI registry
const openapi = fromHono(app, {
  docs_url: "/docs",
  schema: {
    info: {
      title: "QuranChain™ — DarCloud API",
      version: "6.0.0",
      description:
        "QuranChain™ production API powering the DarCloud infrastructure stack. " +
        "All endpoints produce real-world results from live upstream services — nothing is mocked. " +
        "Subsystems: 77 AI agents (66 fleet + 11 DarLaw legal AI) + 12 GPT-4o assistants (ai.darcloud.host), " +
        "FungiMesh dual-layer encrypted network (mesh.darcloud.host), " +
        "DarTelecom™ ISP (Open5GS 5G SA + 4G EPC, subscriber provisioning, SIM/eSIM, billing, mesh ISP relays), " +
        "Multipass VM fleet management, Minecraft server tracking (Qcmesh1/Qcmesh2), " +
        "backup registry with mesh replication, and operational task management. " +
        "Authentication: JWT HMAC-SHA256 tokens (24h expiry) via /signup, /login — protected routes at /api/auth/me, /api/admin/stats. " +
        "Dashboard (/dashboard) and Admin panel (/admin) for real-time system management. " +
        "Payments: DarPay™ halal checkout at /api/checkout/session (Stripe backend). " +
        "Rate limiting: 5 attempts/min per IP on auth endpoints. " +
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

// Telecom / ISP routes (DarTelecom MeshTalk 5G)
app.route("/telecom", telecomRouter);

// WiFi Gateway mesh routes (B.A.T.M.A.N. + hostapd)
openapi.route("/wifi", wifiRouter);

// ISP routes (Home, Business, Cellular, Devices, Firmware, Coverage)
openapi.route("/isp", ispRouter);

// System health check — replaces the old dummy endpoint
openapi.get("/health", SystemHealth);

// Export the Hono app
export default app;
