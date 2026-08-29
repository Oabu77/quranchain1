import { SELF } from "cloudflare:test";
import { describe, expect, it } from "vitest";
import app from "../../src/index";

function trappedEnvironment() {
  let touched = false;
  const database = new Proxy({} as D1Database, {
    get() {
      touched = true;
      throw new Error("A retired route attempted to access D1");
    },
  });
  return {
    bindings: { DB: database } as Env,
    wasTouched: () => touched,
  };
}

describe("Release side-effect gates", () => {
  it("does not store disabled contact or privacy requests", async () => {
    const trap = trappedEnvironment();

    const contact = await app.request("http://local.test/api/contact", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: "Test",
        email: "test@example.com",
        message: "Must not persist",
      }),
    }, trap.bindings);
    expect(contact.status).toBe(410);
    expect(await contact.json()).toMatchObject({ stored: false });

    const privacy = await app.request("http://local.test/api/privacy-request", {
      method: "POST",
      headers: { "Content-Type": "text/plain" },
      body: JSON.stringify({
        email: "test@example.com",
        type: "data-export",
      }),
    }, trap.bindings);
    expect(privacy.status).toBe(410);
    expect(await privacy.json()).toMatchObject({ stored: false });

    expect(trap.wasTouched()).toBe(false);
  });

  it("retires Stripe webhooks without parsing, acknowledging, fulfilling, or touching D1", async () => {
    const trap = trappedEnvironment();
    const body = JSON.stringify({
      id: "evt_release_gate",
      type: "checkout.session.completed",
      data: {
        object: {
          metadata: { product: "enterprise", userId: "1" },
          amount_total: 49900,
        },
      },
    });
    const response = await app.request(
      "http://local.test/api/stripe/webhook",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "stripe-signature": "t=1,v1=attacker-supplied",
        },
        body,
      },
      trap.bindings,
    );
    expect(response.status).toBe(410);
    expect(await response.json()).toEqual({
      error: "Stripe webhook processing is unavailable.",
      received: false,
      payments: false,
      subscriptions: false,
    });

    const portal = await app.request("http://local.test/api/stripe/portal", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ customer: "cus_attacker_supplied" }),
    }, trap.bindings);
    expect(portal.status).toBe(405);
    expect(await portal.json()).toMatchObject({ subscriptions: false });
    expect(trap.wasTouched()).toBe(false);
  });

  it("ships a no-store cleanup worker and non-financial replacement manifest", async () => {
    for (const origin of [
      "http://local.test",
      "https://www.darcloud.host",
      "https://darcloud.net",
    ]) {
      const worker = await SELF.fetch(`${origin}/sw.js`);
      expect(worker.status, origin).toBe(200);
      expect(worker.headers.get("content-type"), origin).toContain(
        "application/javascript",
      );
      expect(worker.headers.get("cache-control"), origin).toContain("no-store");
      expect(worker.headers.get("service-worker-allowed"), origin).toBe("/");
      const workerSource = await worker.text();
      expect(workerSource, origin).toContain(
        "event.waitUntil(self.skipWaiting())",
      );
      expect(workerSource, origin).toContain('key.startsWith("quranchain-")');
      expect(workerSource, origin).toContain("caches.delete(key)");
      expect(workerSource, origin).toContain("registration.unregister()");
      expect(workerSource, origin).not.toContain("caches.match(event.request)");

      const manifest = await SELF.fetch(`${origin}/manifest.json`);
      expect(manifest.status, origin).toBe(200);
      expect(manifest.headers.get("cache-control"), origin).toBe("no-store");
      const manifestText = await manifest.text();
      expect(JSON.parse(manifestText), origin).toMatchObject({
        name: "DarCloud Preview Catalog",
        start_url: "/onboarding",
      });
      expect(manifestText, origin).not.toMatch(/token|trading|defi|finance/i);
    }
  });

  it("adds clickjacking, content, privacy, and cache defenses to apex HTML", async () => {
    const response = await SELF.fetch("http://local.test/login");
    expect(response.status).toBe(410);
    expect(response.headers.get("content-security-policy")).toContain(
      "frame-ancestors 'none'",
    );
    expect(response.headers.get("x-frame-options")).toBe("DENY");
    expect(response.headers.get("x-content-type-options")).toBe("nosniff");
    expect(response.headers.get("referrer-policy")).toBe("no-referrer");
    expect(response.headers.get("permissions-policy")).toContain(
      "geolocation=()",
    );
    expect(response.headers.get("cache-control")).toBe("no-store");
  });
});
