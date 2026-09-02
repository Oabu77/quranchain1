import { SELF } from "cloudflare:test";
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
];

let uniqueCounter = 0;

async function signup(plan = "starter") {
  uniqueCounter += 1;
  const email = `public_${Date.now()}_${uniqueCounter}@darcloud.host`;
  const response = await SELF.fetch("https://darcloud.host/api/auth/signup", {
    method: "POST",
    headers: {
      "content-type": "application/json",
      "cf-connecting-ip": `203.0.113.${(uniqueCounter % 200) + 1}`,
    },
    body: JSON.stringify({
      name: "Public Test User",
      email,
      password: "SafeTestPassword123!",
      plan,
    }),
  });
  return { response, email };
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
