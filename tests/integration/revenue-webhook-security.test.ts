import { describe, expect, it, vi } from "vitest";
import revenuePage from "../../landing-pages/darcloud-revenue.js";

const makeContext = () => ({
	waitUntil: vi.fn(),
});

describe("DarCloud revenue Stripe webhook security", () => {
	it("fails closed when the webhook secret is not configured", async () => {
		const request = new Request("https://revenue.darcloud.host/api/webhooks/stripe", {
			method: "POST",
			headers: {
				"Content-Type": "application/json",
				"Stripe-Signature": "t=1700000000,v1=deadbeef",
			},
			body: JSON.stringify({ id: "evt_test", type: "checkout.session.completed" }),
		});

		const response = await revenuePage.fetch(request, {}, makeContext());
		expect(response.status).toBe(400);
		expect(await response.json()).toEqual({ error: "Invalid webhook signature" });
	});

	it("rejects a forged signature before forwarding the event", async () => {
		const timestamp = Math.floor(Date.now() / 1000);
		const request = new Request("https://revenue.darcloud.host/api/webhooks/stripe", {
			method: "POST",
			headers: {
				"Content-Type": "application/json",
				"Stripe-Signature": `t=${timestamp},v1=${"0".repeat(64)}`,
			},
			body: JSON.stringify({ id: "evt_test", type: "checkout.session.completed" }),
		});
		const ctx = makeContext();

		const response = await revenuePage.fetch(
			request,
			{ STRIPE_WEBHOOK_SECRET: "test-webhook-secret" },
			ctx,
		);

		expect(response.status).toBe(400);
		expect(ctx.waitUntil).not.toHaveBeenCalled();
	});
});
