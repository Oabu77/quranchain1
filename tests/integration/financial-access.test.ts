import { env } from "cloudflare:test";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import app from "../../src/index";
import revenuePage from "../../landing-pages/darcloud-revenue.js";

let counter = 0;

async function member() {
	const suffix = ++counter;
	const response = await app.request("https://darcloud.host/api/auth/signup", {
		method: "POST",
		headers: { "Content-Type": "application/json", "X-Forwarded-For": `10.31.0.${suffix}` },
		body: JSON.stringify({ name: "Finance Test", email: `finance-${suffix}@example.com`, password: "test-only-long-password" }),
	}, env);
	expect(response.status).toBe(200);
	const { token } = await response.json<{ token: string }>();
	const payload = JSON.parse(atob(token.split(".")[1].replace(/-/g, "+").replace(/_/g, "/")));
	return { token, id: String(payload.sub) };
}

async function testToken(payload: Record<string, unknown>) {
	const encode = (value: string) => btoa(value).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
	const input = `${encode(JSON.stringify({ alg: "HS256", typ: "JWT" }))}.${encode(JSON.stringify({ ...payload, exp: Math.floor(Date.now() / 1000) + 60 }))}`;
	const key = await crypto.subtle.importKey("raw", new TextEncoder().encode(env.JWT_SECRET), { name: "HMAC", hash: "SHA-256" }, false, ["sign"]);
	const signature = await crypto.subtle.sign("HMAC", key, new TextEncoder().encode(input));
	return `${input}.${encode(String.fromCharCode(...new Uint8Array(signature)))}`;
}

describe("Administrative financial access", () => {
	it.each(["/api/admin/stats", "/api/contracts", "/api/contracts/revenue", "/api/contracts/clients"])("rejects anonymous access to %s", async (path) => {
		const response = await app.request(`https://darcloud.host${path}`, {}, env);
		expect(response.status).toBe(401);
	});

	it.each(["/api/contracts/companies/seed", "/api/contracts/seed-all", "/api/contracts/sign", "/api/contracts/bootstrap"])("rejects anonymous mutations at %s", async (path) => {
		const response = await app.request(`https://darcloud.host${path}`, { method: "POST" }, env);
		expect(response.status).toBe(401);
	});

	it("denies an ordinary signed-in member", async () => {
		const user = await member();
		const response = await app.request("https://darcloud.host/api/admin/stats", {
			headers: { Authorization: `Bearer ${user.token}` },
		}, { ...env, ADMIN_USER_IDS: "999999" });
		expect(response.status).toBe(403);
	});

	it("rejects inconsistent signed user identifiers", async () => {
		const user = await member();
		const token = await testToken({ sub: Number(user.id), userId: Number(user.id) + 1 });
		const response = await app.request("https://darcloud.host/api/admin/stats", {
			headers: { Authorization: `Bearer ${token}` },
		}, { ...env, ADMIN_USER_IDS: user.id });
		expect(response.status).toBe(403);
	});

	it("does not grant administrator access from a role claim", async () => {
		const user = await member();
		const token = await testToken({ sub: Number(user.id), userId: Number(user.id), role: "admin" });
		const response = await app.request("https://darcloud.host/api/admin/stats", {
			headers: { Authorization: `Bearer ${token}` },
		}, { ...env, ADMIN_USER_IDS: undefined });
		expect(response.status).toBe(403);
	});

	it("fails closed when the administrator allowlist is unset", async () => {
		const user = await member();
		const response = await app.request("https://darcloud.host/api/contracts/revenue", {
			headers: { Authorization: `Bearer ${user.token}` },
		}, { ...env, ADMIN_USER_IDS: undefined });
		expect(response.status).toBe(403);
	});

	it("allows an explicitly configured existing administrator", async () => {
		const user = await member();
		const response = await app.request("https://darcloud.host/api/admin/stats", {
			headers: { Authorization: `Bearer ${user.token}` },
		}, { ...env, ADMIN_USER_IDS: user.id });
		expect(response.status).toBe(200);
		expect((await response.json<{ success: boolean }>()).success).toBe(true);
	});

	it("revokes administrative access when the user no longer exists", async () => {
		const user = await member();
		await env.DB.prepare("DELETE FROM users WHERE id = ?").bind(Number(user.id)).run();
		const response = await app.request("https://darcloud.host/api/admin/stats", {
			headers: { Authorization: `Bearer ${user.token}` },
		}, { ...env, ADMIN_USER_IDS: user.id });
		expect(response.status).toBe(403);
	});

	it("returns contract amounts with explicit provenance and no collected-revenue claim", async () => {
		const user = await member();
		const response = await app.request("https://darcloud.host/api/contracts/revenue", {
			headers: { Cookie: `darcloud_session=${user.token}` },
		}, { ...env, ADMIN_USER_IDS: user.id });
		expect(response.status).toBe(200);
		const body = await response.json<Record<string, any>>();
		expect(body.source).toBe("D1.contracts");
		expect(body.payment_verification).toBe("unverified");
		expect(body.collected_revenue).toBeNull();
		expect(body.contractual_amounts.monthly).toBe("$0");
		expect(Number.isFinite(Date.parse(body.observed_at))).toBe(true);
		expect(body).not.toHaveProperty("revenue_by_company");
	});

	it.each(["/api/contracts", "/api/contracts/clients"])("labels stored payment status as unverified at %s", async (path) => {
		const user = await member();
		const response = await app.request(`https://darcloud.host${path}`, {
			headers: { Authorization: `Bearer ${user.token}` },
		}, { ...env, ADMIN_USER_IDS: user.id });
		expect(response.status).toBe(200);
		const body = await response.json<Record<string, any>>();
		expect(body.source).toBe(path.endsWith("/clients") ? "D1.clients" : "D1.contracts");
		expect(body.payment_verification).toBe("unverified");
		expect(Number.isFinite(Date.parse(body.observed_at))).toBe(true);
	});
});

describe("Customer billing portal ownership", () => {
	beforeEach(() => {
		vi.spyOn(globalThis, "fetch").mockRejectedValue(new Error("Unexpected outbound Stripe request"));
	});
	afterEach(() => {
		vi.restoreAllMocks();
	});

	it("rejects anonymous access without contacting Stripe", async () => {
		const response = await app.request("https://darcloud.host/api/stripe/portal", {
			method: "POST",
			headers: { "Content-Type": "application/json" },
			body: JSON.stringify({ customer_id: "cus_test_untrusted" }),
		}, env);
		expect(response.status).toBe(401);
		expect(globalThis.fetch).not.toHaveBeenCalled();
	});

	it("rejects a member requesting another customer without contacting Stripe", async () => {
		const user = await member();
		await env.DB.prepare("UPDATE users SET darpay_customer_id = ? WHERE id = ?").bind("cus_test_owner", Number(user.id)).run();
		const response = await app.request("https://darcloud.host/api/stripe/portal", {
			method: "POST",
			headers: { Authorization: `Bearer ${user.token}`, "Content-Type": "application/json" },
			body: JSON.stringify({ customer_id: "cus_test_other" }),
		}, { ...env, STRIPE_SECRET_KEY: "sk_test_fixture_only" });
		expect(response.status).toBe(403);
		expect(globalThis.fetch).not.toHaveBeenCalled();
	});

	it("creates a portal only for the authenticated user's stored customer", async () => {
		const user = await member();
		await env.DB.prepare("UPDATE users SET darpay_customer_id = ? WHERE id = ?").bind("cus_test_owner", Number(user.id)).run();
		vi.mocked(globalThis.fetch).mockResolvedValue(new Response(JSON.stringify({ url: "https://billing.stripe.test/session-fixture" }), {
			headers: { "Content-Type": "application/json" },
		}));
		const response = await app.request("https://darcloud.host/api/stripe/portal", {
			method: "POST",
			headers: { Authorization: `Bearer ${user.token}`, "Content-Type": "application/json" },
			body: JSON.stringify({ customer_id: "cus_test_owner" }),
		}, { ...env, STRIPE_SECRET_KEY: "sk_test_fixture_only" });
		expect(response.status).toBe(200);
		expect(await response.json()).toMatchObject({ success: true, portal_url: "https://billing.stripe.test/session-fixture" });
		expect(globalThis.fetch).toHaveBeenCalledTimes(1);
		const [url, request] = vi.mocked(globalThis.fetch).mock.calls[0];
		expect(url).toBe("https://api.stripe.com/v1/billing_portal/sessions");
		expect(new URLSearchParams(String(request?.body)).get("customer")).toBe("cus_test_owner");
	});
});

describe.each(["darcloud.host", "revenue.darcloud.host", "blockchain.darcloud.host"])("Financial routes on %s", (hostname) => {
	beforeEach(() => {
		vi.spyOn(globalThis, "fetch").mockRejectedValue(new Error("Unexpected outbound financial request"));
	});
	afterEach(() => {
		expect(globalThis.fetch).not.toHaveBeenCalled();
		vi.restoreAllMocks();
	});

	it.each(["dashboard", "treasury"])("rejects anonymous %s access and disables caching", async (endpoint) => {
		const response = await app.request(`https://${hostname}/api/revenue/${endpoint}`, {}, env);
		expect(response.status).toBe(401);
		expect(response.headers.get("Cache-Control")).toBe("no-store");
	});

	it.each(["dashboard", "treasury"])("rejects ordinary member %s access and disables caching", async (endpoint) => {
		const user = await member();
		const response = await app.request(`https://${hostname}/api/revenue/${endpoint}`, {
			headers: { Authorization: `Bearer ${user.token}` },
		}, { ...env, ADMIN_USER_IDS: "999999" });
		expect(response.status).toBe(403);
		expect(response.headers.get("Cache-Control")).toBe("no-store");
	});

	it.each(["dashboard", "treasury"])("allows configured administrator %s access without caching or proxying", async (endpoint) => {
		const user = await member();
		const response = await app.request(`https://${hostname}/api/revenue/${endpoint}`, {
			headers: { Authorization: `Bearer ${user.token}` },
		}, { ...env, ADMIN_USER_IDS: user.id });
		expect(response.status).toBe(200);
		expect(response.headers.get("Cache-Control")).toBe("no-store");
		const body = await response.json<Record<string, any>>();
		expect(body.success).toBe(true);
		if (endpoint === "dashboard") {
			expect(body.revenue.transactions).toBe(0);
			expect(body.revenue.total_cents).toBe(0);
		} else {
			expect(Array.isArray(body.accounts)).toBe(true);
			expect(body.recent_payouts).toEqual([]);
		}
	});
});

describe("Public revenue landing", () => {
	it("does not fabricate revenue or payment processor status", async () => {
		const response = await revenuePage.fetch(new Request("https://revenue.darcloud.host/health"));
		const body = await response.json<Record<string, any>>();
		expect(body.financial_data).toBe("authenticated_api_only");
		expect(body).not.toHaveProperty("distribution");
		expect(body).not.toHaveProperty("revenue_streams");
	});

	it.each(["/api/dashboard", "/api/revenue", "/api/gas-toll", "/api/private-records", "/api/webhooks/stripe"])("does not fetch or fabricate data through legacy route %s", async (path) => {
		const fetchSpy = vi.spyOn(globalThis, "fetch").mockRejectedValue(new Error("Unexpected outbound request"));
		try {
			const response = await revenuePage.fetch(new Request(`https://revenue.darcloud.host${path}`, {
				method: path.includes("webhooks") ? "POST" : "GET",
			}));
			expect([404, 410]).toContain(response.status);
			expect(fetchSpy).not.toHaveBeenCalled();
		} finally {
			fetchSpy.mockRestore();
		}
	});
});
