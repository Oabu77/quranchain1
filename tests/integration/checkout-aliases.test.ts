import { env } from "cloudflare:test";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import app from "../../src/index";
import checkoutAlias from "../../landing-pages/darcloud-checkout.js";

describe.each(["checkout.darcloud.host", "checkout.darcloud.net"])("Checkout alias %s", (hostname) => {
	beforeEach(() => {
		vi.spyOn(globalThis, "fetch").mockRejectedValue(new Error("Unexpected outbound payment request"));
	});
	afterEach(() => {
		expect(globalThis.fetch).not.toHaveBeenCalled();
		vi.restoreAllMocks();
	});

	it.each(["/api/checkout/session", "/api/stripe/portal"])("routes %s to authentication without fabricated success", async (path) => {
		const response = await app.request(`https://${hostname}${path}`, {
			method: "POST",
			headers: { "Content-Type": "application/json" },
			body: JSON.stringify({ plan: "pro", email: "untrusted@example.com", customer_id: "cus_untrusted" }),
		}, env);
		expect(response.status).toBe(401);
		expect(response.headers.get("Content-Type")).toContain("application/json");
		expect(await response.json()).not.toHaveProperty("session_id");
	});

	it("redirects public plan pages to the canonical checkout without forwarding submitted fields", async () => {
		for (const plan of ["pro", "enterprise", "fungimesh", "hwc"]) {
			const response = await app.request(`https://${hostname}/checkout/${plan}?email=private%40example.com&return_url=https://example.com`, {}, env);
			expect(response.status).toBe(302);
			expect(response.headers.get("Location")).toBe(`https://darcloud.host/checkout/${plan}`);
			expect(response.headers.get("Cache-Control")).toBe("no-store");
			expect(await response.text()).toBe("");
		}
		const response = await app.request(`https://${hostname}/`, {}, env);
		expect(response.headers.get("Location")).toBe("https://darcloud.host/checkout/pro");
	});

	it("redirects result URLs without asserting payment or activation", async () => {
		for (const result of ["success", "cancel"]) {
			const response = await app.request(`https://${hostname}/${result}?session_id=unverified`, {}, env);
			expect(response.status).toBe(302);
			expect(response.headers.get("Location")).toBe(`https://darcloud.host/checkout/${result}`);
			expect(await response.text()).toBe("");
		}
	});

	it("rejects unknown plans and paths rather than offering an invented checkout", async () => {
		for (const path of ["/checkout/unknown", "/checkout/pro/extra", "/api/private-records"]) {
			const response = await app.request(`https://${hostname}${path}`, {}, env);
			expect(response.status).toBe(404);
			expect(response.headers.get("Location")).toBeNull();
		}
	});
});

it("never forwards payment submissions or manufactures sessions in the standalone alias handler", async () => {
	const fetchSpy = vi.spyOn(globalThis, "fetch").mockRejectedValue(new Error("Unexpected outbound payment request"));
	try {
		const response = await checkoutAlias.fetch(new Request("https://checkout.darcloud.host/api/checkout/session", {
			method: "POST",
			headers: { "Content-Type": "application/json" },
			body: JSON.stringify({ plan: "pro" }),
		}));
		expect(response.status).toBe(405);
		expect(response.headers.get("Allow")).toBe("GET");
		expect(await response.json()).toEqual({ error: "method_not_allowed" });
		expect(fetchSpy).not.toHaveBeenCalled();
	} finally {
		fetchSpy.mockRestore();
	}
});

it.each(["darcloud.host", "darcloud.net"])("reports measured D1 health and unknown fleet health on %s", async (hostname) => {
	const response = await app.request(`https://${hostname}/health`, {}, env);
	expect(response.status).toBe(200);
	const report = await response.json<Record<string, any>>();
	expect(report.status).toBe("degraded");
	expect(report).not.toHaveProperty("service", "darcloud-net");
	expect(JSON.stringify(report)).toContain("not_checked");
	expect(JSON.stringify(report)).not.toContain('"status":"live"');
});
