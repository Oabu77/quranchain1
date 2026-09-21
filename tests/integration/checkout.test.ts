import { env } from "cloudflare:test";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import app from "../../src/index";

const stripeEnv = { ...env, STRIPE_SECRET_KEY: "sk_test_checkout_fixture_only" };
const customerId = "cus_checkoutFixture";
let sequence = 0;

async function tokenFor(payload: Record<string, unknown>) {
  const encode = (value: string) => btoa(value).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
  const input = `${encode(JSON.stringify({ alg: "HS256", typ: "JWT" }))}.${encode(JSON.stringify({ ...payload, exp: Math.floor(Date.now() / 1000) + 60 }))}`;
  const key = await crypto.subtle.importKey("raw", new TextEncoder().encode(env.JWT_SECRET), { name: "HMAC", hash: "SHA-256" }, false, ["sign"]);
  const signature = await crypto.subtle.sign("HMAC", key, new TextEncoder().encode(input));
  return `${input}.${encode(String.fromCharCode(...new Uint8Array(signature)))}`;
}

async function member(mapping: string | null = null) {
  const result = await env.DB.prepare("INSERT INTO users (email, name, password_hash, plan, darpay_customer_id) VALUES (?, 'Checkout Fixture', 'unused', 'starter', ?)")
    .bind(`checkout-${++sequence}@example.com`, mapping).run();
  const id = Number(result.meta.last_row_id);
  return { id, token: await tokenFor({ sub: id, userId: id }) };
}

function checkout(token?: string, body: unknown = { plan: "pro" }, bindings = stripeEnv) {
  return app.request("https://darcloud.host/api/checkout/session", {
    method: "POST",
    headers: { "Content-Type": "application/json", ...(token ? { Authorization: `Bearer ${token}` } : {}) },
    body: JSON.stringify(body),
  }, bindings);
}

function response(value: unknown, status = 200) {
  return new Response(JSON.stringify(value), { status, headers: { "Content-Type": "application/json" } });
}

function customer(userId: number, id = customerId) {
  return { id, object: "customer", metadata: { darcloud_user_id: String(userId), darcloud_application: "quranchain1" } };
}

function session(userId: number, id = customerId) {
  return {
    id: "cs_test_checkoutFixture", object: "checkout.session", customer: id,
    client_reference_id: String(userId), mode: "subscription", status: "open",
    url: "https://checkout.stripe.com/c/pay/cs_test_checkoutFixture",
  };
}

async function stored(userId: number) {
  return env.DB.prepare("SELECT plan, darpay_customer_id FROM users WHERE id = ?").bind(userId)
    .first<{ plan: string; darpay_customer_id: string | null }>();
}

describe("Authenticated checkout customer ownership", () => {
  beforeEach(() => {
    vi.spyOn(globalThis, "fetch").mockRejectedValue(new Error("Unexpected outbound request: fixture secret must never be exposed"));
  });
  afterEach(() => vi.restoreAllMocks());

  it.each([undefined, "invalid.token.here"])("rejects unauthenticated token %s without Stripe", async (token) => {
    const res = await checkout(token, { plan: "pro", email: "someone@example.com" });
    expect(res.status).toBe(401);
    expect(res.headers.get("Cache-Control")).toBe("no-store");
    expect(globalThis.fetch).not.toHaveBeenCalled();
  });

  it("rejects inconsistent signed identifiers and deleted users", async () => {
    const user = await member();
    const inconsistent = await tokenFor({ sub: user.id, userId: user.id + 1 });
    expect((await checkout(inconsistent)).status).toBe(401);
    await env.DB.prepare("DELETE FROM users WHERE id = ?").bind(user.id).run();
    expect((await checkout(user.token)).status).toBe(401);
    expect(globalThis.fetch).not.toHaveBeenCalled();
  });

  it.each(["JWT_SECRET", "STRIPE_SECRET_KEY"])("fails closed when %s is missing", async (key) => {
    const user = await member();
    const res = await checkout(user.token, { plan: "pro" }, { ...stripeEnv, [key]: "" });
    expect(res.status).toBe(503);
    expect(await res.json()).not.toHaveProperty("checkout_url");
    expect(globalThis.fetch).not.toHaveBeenCalled();
    expect(await stored(user.id)).toEqual({ plan: "starter", darpay_customer_id: null });
  });

  it.each([{}, { plan: "unknown" }, { plan: "toString" }, null, { plan: 49 }])("rejects unsupported catalog input %j", async (body) => {
    const user = await member();
    expect((await checkout(user.token, body)).status).toBe(400);
    expect(globalThis.fetch).not.toHaveBeenCalled();
  });

  it("returns 400 for malformed JSON", async () => {
    const user = await member();
    const res = await app.request("https://darcloud.host/api/checkout/session", {
      method: "POST", headers: { Authorization: `Bearer ${user.token}`, "Content-Type": "application/json" }, body: "{",
    }, stripeEnv);
    expect(res.status).toBe(400);
    expect(globalThis.fetch).not.toHaveBeenCalled();
  });

  it("creates and stores a customer for the signed D1 identity without trusting body identity or changing plan", async () => {
    const user = await member();
    vi.mocked(globalThis.fetch).mockResolvedValueOnce(response(customer(user.id))).mockResolvedValueOnce(response(session(user.id)));
    const res = await checkout(user.token, {
      plan: "pro", email: "other@example.com", name: "Other", user_id: 999,
      customer_id: "cus_other", discord_id: "999", price_id: "price_other",
    });
    expect(res.status).toBe(200);
    expect(await res.json()).toMatchObject({ success: true, checkout_url: session(user.id).url, session_id: session(user.id).id });
    expect(await stored(user.id)).toEqual({ plan: "starter", darpay_customer_id: customerId });
    const calls = vi.mocked(globalThis.fetch).mock.calls;
    expect(calls).toHaveLength(2);
    expect(calls[0][0]).toBe("https://api.stripe.com/v1/customers");
    const customerParams = new URLSearchParams(String(calls[0][1]?.body));
    expect(customerParams.get("metadata[darcloud_user_id]")).toBe(String(user.id));
    expect(customerParams.get("metadata[darcloud_application]")).toBe("quranchain1");
    expect(customerParams.has("email")).toBe(false);
    expect(new Headers(calls[0][1]?.headers).get("Idempotency-Key")).toBe(`quranchain1:user:${user.id}:customer:v1`);
    expect(calls[1][0]).toBe("https://api.stripe.com/v1/checkout/sessions");
    const params = new URLSearchParams(String(calls[1][1]?.body));
    expect(params.get("customer")).toBe(customerId);
    expect(params.get("client_reference_id")).toBe(String(user.id));
    expect(params.get("metadata[darcloud_user_id]")).toBe(String(user.id));
    expect(params.get("line_items[0][price]")).toBe("price_1TAR0SAqs2ifkfkqOKa2Rzq3");
    expect(params.has("customer_email")).toBe(false);
    expect(params.has("metadata[discord_id]")).toBe(false);
    expect(params.has("payment_method_types[0]")).toBe(false);
  });

  it("uses an existing mapping only after Stripe confirms the server-owned user reference", async () => {
    const user = await member(customerId);
    vi.mocked(globalThis.fetch).mockResolvedValueOnce(response(customer(user.id))).mockResolvedValueOnce(response(session(user.id)));
    expect((await checkout(user.token)).status).toBe(200);
    const calls = vi.mocked(globalThis.fetch).mock.calls;
    expect(calls[0][0]).toBe(`https://api.stripe.com/v1/customers/${customerId}`);
    expect(calls[0][1]?.method).toBe("GET");
    expect(await stored(user.id)).toEqual({ plan: "starter", darpay_customer_id: customerId });
  });

  it.each([{ metadata: {} }, { metadata: { darcloud_user_id: "999", darcloud_application: "quranchain1" } }, { deleted: true }])("rejects unverified existing mapping %j without rewriting it", async (overrides) => {
    const user = await member(customerId);
    vi.mocked(globalThis.fetch).mockResolvedValueOnce(response({ ...customer(user.id), ...overrides }));
    const res = await checkout(user.token);
    expect(res.status).toBe(409);
    expect(globalThis.fetch).toHaveBeenCalledTimes(1);
    expect(await stored(user.id)).toEqual({ plan: "starter", darpay_customer_id: customerId });
  });

  it("does not share one stored customer between two D1 users", async () => {
    const user = await member(customerId);
    await member(customerId);
    const res = await checkout(user.token);
    expect(res.status).toBe(409);
    expect(globalThis.fetch).not.toHaveBeenCalled();
  });

  it("does not replace a customer mapping written by a concurrent request", async () => {
    const user = await member();
    vi.mocked(globalThis.fetch).mockImplementationOnce(async () => {
      await env.DB.prepare("UPDATE users SET darpay_customer_id = ? WHERE id = ?").bind("cus_concurrentWinner", user.id).run();
      return response(customer(user.id));
    });
    const res = await checkout(user.token);
    expect(res.status).toBe(409);
    expect(globalThis.fetch).toHaveBeenCalledTimes(1);
    expect(await stored(user.id)).toEqual({ plan: "starter", darpay_customer_id: "cus_concurrentWinner" });
  });

  it("sanitizes network failures and does not claim success", async () => {
    const user = await member();
    const res = await checkout(user.token);
    expect(res.status).toBe(502);
    const body = await res.json();
    expect(body).not.toHaveProperty("checkout_url");
    expect(JSON.stringify(body)).not.toContain("fixture secret");
    expect(await stored(user.id)).toEqual({ plan: "starter", darpay_customer_id: null });
  });

  it("rejects non-success Stripe responses even with superficially valid content", async () => {
    const user = await member();
    vi.mocked(globalThis.fetch).mockResolvedValueOnce(response(customer(user.id), 429));
    expect((await checkout(user.token)).status).toBe(502);
    expect(await stored(user.id)).toEqual({ plan: "starter", darpay_customer_id: null });
  });

  it("rejects malformed customer responses before persisting mapping", async () => {
    const user = await member();
    vi.mocked(globalThis.fetch).mockResolvedValueOnce(response({ id: customerId }));
    expect((await checkout(user.token)).status).toBe(502);
    expect(await stored(user.id)).toEqual({ plan: "starter", darpay_customer_id: null });
  });

  it.each([
    { url: "https://example.com/not-stripe" }, { customer: "cus_someoneElse" },
    { object: "invalid" }, { id: "synthetic" }, { client_reference_id: "999" },
  ])("rejects malformed checkout response %j without claiming payment or upgrading", async (overrides) => {
    const user = await member();
    vi.mocked(globalThis.fetch).mockResolvedValueOnce(response(customer(user.id))).mockResolvedValueOnce(response({ ...session(user.id), ...overrides }));
    const res = await checkout(user.token);
    expect(res.status).toBe(502);
    expect(await res.json()).not.toHaveProperty("checkout_url");
    expect(await stored(user.id)).toEqual({ plan: "starter", darpay_customer_id: customerId });
  });

  it("creates a starter account even when signup requests a paid plan", async () => {
    const res = await app.request("https://darcloud.host/api/auth/signup", {
      method: "POST", headers: { "Content-Type": "application/json", "X-Forwarded-For": "10.88.0.1" },
      body: JSON.stringify({ name: "Plan Fixture", email: "paid-intent@example.com", password: "fixture-long-password", plan: "enterprise" }),
    }, env);
    expect(res.status).toBe(200);
    expect(await res.json()).toMatchObject({ user: { plan: "starter" } });
    const row = await env.DB.prepare("SELECT plan FROM users WHERE email = ?").bind("paid-intent@example.com").first();
    expect(row).toEqual({ plan: "starter" });
    expect(globalThis.fetch).not.toHaveBeenCalled();
  });

  it.each([["hwc", "HWC Premium", "$99"], ["fungimesh", "FungiMesh Node", "$19.99"]])("shows the matching catalog quote for %s", async (plan, label, price) => {
    const res = await app.request(`https://darcloud.host/checkout/${plan}`, {}, env);
    const html = await res.text();
    expect(res.status).toBe(200);
    expect(html).toContain(label);
    expect(html).toContain(price);
    expect(html).not.toContain("Professional");
  });

  it("does not present an unsupported plan as a purchasable Professional plan", async () => {
    const res = await app.request("https://darcloud.host/checkout/unsupported", {}, env);
    const html = await res.text();
    expect(html).toContain("Plan unavailable");
    expect(html).not.toContain('id="checkoutForm"');
  });

  it("does not claim payment or activation from an unverified return URL", async () => {
    const res = await app.request("https://darcloud.host/checkout/success?session_id=unverified", {}, env);
    const html = await res.text();
    expect(html).toContain("have not been verified");
    expect(html).not.toContain("Payment Successful");
    expect(html).not.toContain("subscription is now active");
  });
});
