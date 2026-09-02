import { env, SELF } from "cloudflare:test";
import { describe, expect, it } from "vitest";

const publicHosts = [
  "www",
  "ai",
  "api-gateway",
  "blockchain",
  "checkout",
  "commerce",
  "defi",
  "edu",
  "energy",
  "health",
  "hr",
  "law",
  "media",
  "community",
  "darnas",
  "pay",
  "security",
  "telecom",
  "trade",
  "transport",
  "enterprise",
  "hwc",
  "halalwealthclub",
  "mesh",
  "meshtalk",
  "fungios",
  "realestate",
  "revenue",
  "omarai",
  "referral",
];

let uniqueCounter = 0;

async function signup(plan = "starter", requestedEmail?: string) {
  uniqueCounter += 1;
  const email = requestedEmail || `public_${Date.now()}_${uniqueCounter}@darcloud.host`;
  const password = "SafeTestPassword123!";
  const response = await SELF.fetch("https://darcloud.host/api/auth/signup", {
    method: "POST",
    headers: {
      "content-type": "application/json",
      "cf-connecting-ip": `203.0.113.${(uniqueCounter % 200) + 1}`,
    },
    body: JSON.stringify({
      name: "Public Test User",
      email,
      password,
      plan,
    }),
  });
  return { response, email, password };
}

function userIdFromToken(token: string): number {
  const part = token.split(".")[1] || "";
  const padded = part.replace(/-/g, "+").replace(/_/g, "/").padEnd(Math.ceil(part.length / 4) * 4, "=");
  const payload = JSON.parse(atob(padded)) as { sub?: number | string };
  return Number(payload.sub || 0);
}

function authHeaders(token: string): HeadersInit {
  return { authorization: `Bearer ${token}`, "content-type": "application/json" };
}

describe("DarCloud public Worker", () => {
  it("redirects the apex home to the canonical www page", async () => {
    const response = await SELF.fetch("https://darcloud.host/", { redirect: "manual" });
    expect(response.status).toBe(302);
    expect(response.headers.get("location")).toBe("https://www.darcloud.host/");
  });

  it.each(publicHosts)("serves the %s public host without a server error", async (host) => {
    const response = await SELF.fetch(`https://${host}.darcloud.host/`, { redirect: "manual" });
    expect(response.status).toBeLessThan(400);
    if (response.status === 302) {
      expect(response.headers.get("location")).toBe("https://darcloud.host/messages");
    } else {
      const body = await response.text();
      expect(body.length).toBeGreaterThan(20);
      expect(body).not.toContain("Loading platform...");
    }
  });

  it.each([
    "/signup",
    "/login",
    "/onboarding",
    "/dashboard",
    "/admin",
    "/checkout/pro",
    "/checkout/success",
    "/checkout/cancel",
    "/privacy",
    "/privacy-policy",
    "/terms",
    "/messages",
    "/meshtalk",
    "/meshtalk/privacy",
    "/meshtalk/terms",
    "/meshtalk/child-safety",
    "/docs",
    "/health",
  ])("serves the apex page %s", async (path) => {
    const response = await SELF.fetch(`https://darcloud.host${path}`, { redirect: "manual" });
    expect(response.status).toBe(200);
    const body = await response.text();
    expect(body.length).toBeGreaterThan(20);
  });

  it("never grants a paid plan directly during signup", async () => {
    const { response } = await signup("enterprise");
    expect(response.status).toBe(200);
    const body = await response.json<{ user: { plan: string }; token: string }>();
    expect(body.user.plan).toBe("starter");
    expect(body.token).toBeTruthy();
  });

  it("grants a server-verified subscription when payment preceded account creation", async () => {
    uniqueCounter += 1;
    const entitlementNumber = uniqueCounter;
    const email = `paid_before_signup_${Date.now()}_${entitlementNumber}@darcloud.host`;
    const expectedCustomerId = `cus_test_${entitlementNumber}`;
    const expectedSubscriptionId = `sub_test_${entitlementNumber}`;
    await env.DB.prepare(
      `INSERT INTO active_subscriptions (
        discord_id, stripe_subscription_id, stripe_customer_id,
        product, plan, amount_cents, status, current_period_start
      ) VALUES (?, ?, ?, 'pro', 'pro', 4900, 'active', datetime('now'))`,
    )
      .bind(email, expectedSubscriptionId, expectedCustomerId)
      .run();

    const { response } = await signup("enterprise", email);
    expect(response.status).toBe(200);
    const body = await response.json<{ user: { plan: string } }>();
    expect(body.user.plan).toBe("pro");

    const stored = await env.DB.prepare(
      "SELECT plan, darpay_customer_id FROM users WHERE email = ?",
    )
      .bind(email)
      .first<{ plan: string; darpay_customer_id: string | null }>();
    expect(stored?.plan).toBe("pro");
    expect(stored?.darpay_customer_id).toBe(expectedCustomerId);

    const linked = await env.DB.prepare(
      "SELECT user_id FROM active_subscriptions WHERE stripe_subscription_id = ?",
    )
      .bind(expectedSubscriptionId)
      .first<{ user_id: number | null }>();
    expect(linked?.user_id).toBeTypeOf("number");
  });

  it("returns a clear authentication failure for invalid login credentials", async () => {
    const response = await SELF.fetch("https://darcloud.host/api/auth/login", {
      method: "POST",
      headers: { "content-type": "application/json", "cf-connecting-ip": "203.0.113.220" },
      body: JSON.stringify({ email: "missing@darcloud.host", password: "not-a-real-password" }),
    });
    expect(response.status).toBe(401);
    expect(response.headers.get("content-type") || "").toContain("application/json");
  });

  it("accepts the public contact form and persists its synthetic submission", async () => {
    const email = `contact_${Date.now()}_${++uniqueCounter}@darcloud.host`;
    const response = await SELF.fetch("https://darcloud.host/api/contact", {
      method: "POST",
      headers: { "content-type": "application/json", "cf-connecting-ip": "203.0.113.221" },
      body: JSON.stringify({ name: "Contact Test", email, subject: "Website test", message: "Synthetic CI submission" }),
    });
    expect(response.status).toBeLessThan(300);
    const stored = await env.DB.prepare(
      "SELECT COUNT(*) AS count FROM contact_submissions WHERE email = ?",
    ).bind(email).first<{ count: number }>();
    expect(Number(stored?.count || 0)).toBe(1);
  });

  it("accepts the HWC application form and persists its synthetic submission", async () => {
    const email = `hwc_${Date.now()}_${++uniqueCounter}@darcloud.host`;
    const response = await SELF.fetch("https://darcloud.host/api/hwc/apply", {
      method: "POST",
      headers: { "content-type": "application/json", "cf-connecting-ip": "203.0.113.222" },
      body: JSON.stringify({ name: "HWC Test", email, experience: "Synthetic integration test", interests: "ethical investing" }),
    });
    expect(response.status).toBeLessThan(300);
    const stored = await env.DB.prepare(
      "SELECT COUNT(*) AS count FROM hwc_applications WHERE email = ?",
    ).bind(email).first<{ count: number }>();
    expect(Number(stored?.count || 0)).toBe(1);
  });

  it("accepts a bounded privacy request and returns a reference", async () => {
    const email = `privacy_${Date.now()}_${++uniqueCounter}@darcloud.host`;
    const response = await SELF.fetch("https://darcloud.host/api/privacy-request", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ email, type: "data-access", details: "Synthetic integration request" }),
    });
    expect(response.status).toBe(200);
    const body = await response.json<{ reference?: string }>();
    expect(body.reference).toMatch(/^PR-/);
  });

  it("keeps every AI browse-agents link functional", async () => {
    const page = await SELF.fetch("https://ai.darcloud.host/");
    const html = await page.text();
    const links = [...html.matchAll(/href=["'](\/api\/(?:fleet|assistants|agent\/[a-z0-9_-]+))["']/gi)]
      .map((match) => match[1]);
    expect(links.length).toBeGreaterThanOrEqual(3);
    for (const link of new Set(links)) {
      const response = await SELF.fetch(new URL(link, "https://ai.darcloud.host/").href);
      expect(response.status, `${link} returned ${response.status}`).toBe(200);
      expect(response.headers.get("content-type") || "").toContain("application/json");
    }
  });

  it("keeps every mesh status link functional", async () => {
    const page = await SELF.fetch("https://mesh.darcloud.host/");
    const html = await page.text();
    const links = [...html.matchAll(/href=["'](\/api\/(?:status|nodes))["']/gi)].map((match) => match[1]);
    expect(new Set(links)).toEqual(new Set(["/api/status", "/api/nodes"]));
    for (const link of new Set(links)) {
      const response = await SELF.fetch(new URL(link, "https://mesh.darcloud.host/").href);
      expect(response.status, `${link} returned ${response.status}`).toBe(200);
      expect(response.headers.get("content-type") || "").toContain("application/json");
    }
  });

  it("does not ship placeholder blockchain links", async () => {
    const response = await SELF.fetch("https://blockchain.darcloud.host/");
    const html = await response.text();
    expect(html).not.toMatch(/href=["']#["']/i);
  });

  it("exchanges an authenticated message through the public Worker", async () => {
    const aliceSignup = await signup();
    const bobSignup = await signup();
    const alice = await aliceSignup.response.json<{ token: string }>();
    const bob = await bobSignup.response.json<{ token: string }>();
    const bobId = userIdFromToken(bob.token);
    expect(bobId).toBeGreaterThan(0);

    const create = await SELF.fetch("https://darcloud.host/messaging/conversations", {
      method: "POST",
      headers: authHeaders(alice.token),
      body: JSON.stringify({ type: "direct", participants: [bobId] }),
    });
    expect(create.status).toBe(201);
    const conversation = await create.json<{ conversation_id: number }>();

    const send = await SELF.fetch(
      `https://darcloud.host/messaging/conversations/${conversation.conversation_id}/messages`,
      {
        method: "POST",
        headers: authHeaders(alice.token),
        body: JSON.stringify({ content: "Synthetic public Worker message" }),
      },
    );
    expect(send.status).toBe(201);

    const read = await SELF.fetch(
      `https://darcloud.host/messaging/conversations/${conversation.conversation_id}/messages`,
      { headers: authHeaders(bob.token) },
    );
    expect(read.status).toBe(200);
    const messages = await read.json<{ messages: Array<{ content: string }> }>();
    expect(messages.messages.some((message) => message.content === "Synthetic public Worker message")).toBe(true);
  });

  it("fails checkout closed when Stripe is not configured", async () => {
    const response = await SELF.fetch("https://darcloud.host/api/checkout/session", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        plan: "pro",
        email: "checkout-test@darcloud.host",
        name: "Checkout Test",
      }),
    });
    expect(response.status).toBe(503);
    const body = await response.json<{ success?: boolean; error?: string }>();
    expect(body.success).not.toBe(true);
    expect(body.error).toMatch(/unavailable|configured/i);
  });

  it("requires authentication for Stripe customer portal creation", async () => {
    const response = await SELF.fetch("https://darcloud.host/api/stripe/portal", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ customer_id: "cus_attacker_controlled" }),
    });
    expect(response.status).toBe(401);
  });

  it("rejects an ordinary user from admin statistics", async () => {
    const { response: signupResponse } = await signup();
    const { token } = await signupResponse.json<{ token: string }>();
    const response = await SELF.fetch("https://darcloud.host/api/admin/stats", {
      headers: { authorization: `Bearer ${token}` },
    });
    expect(response.status).toBe(403);
  });

  it("rejects unsigned Stripe webhooks", async () => {
    const response = await SELF.fetch("https://darcloud.host/api/stripe/webhook", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ id: "evt_synthetic", type: "checkout.session.completed" }),
    });
    expect(response.status).toBeGreaterThanOrEqual(400);
  });

  it.each([
    ["POST", "/tasks"],
    ["POST", "/backups"],
    ["POST", "/multipass/vms/launch"],
    ["POST", "/telecom/subscribers"],
    ["POST", "/api/contracts/bootstrap"],
    ["POST", "https://ai.darcloud.host/api/chat"],
  ])("does not expose control-plane mutation %s %s", async (method, path) => {
    const url = path.startsWith("http") ? path : `https://darcloud.host${path}`;
    const response = await SELF.fetch(url, {
      method,
      headers: { "content-type": "application/json" },
      body: "{}",
    });
    expect([403, 404, 405]).toContain(response.status);
  });

  it("does not grant CORS to an untrusted browser origin", async () => {
    const response = await SELF.fetch("https://darcloud.host/login", {
      headers: { origin: "https://attacker.example" },
    });
    expect(response.headers.get("access-control-allow-origin")).toBeNull();
    expect(response.headers.get("access-control-allow-credentials")).toBeNull();
  });

  it("echoes only an approved DarCloud origin for credentialed CORS", async () => {
    const origin = "https://ai.darcloud.host";
    const response = await SELF.fetch("https://darcloud.host/api/auth/session", {
      headers: { origin },
    });
    expect(response.headers.get("access-control-allow-origin")).toBe(origin);
    expect(response.headers.get("access-control-allow-credentials")).toBe("true");
    expect(response.headers.get("vary")).toContain("Origin");
  });
});
