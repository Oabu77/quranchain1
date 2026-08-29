import { SELF } from "cloudflare:test";
import { describe, expect, it } from "vitest";

const SECURE_HEADERS = [
  "content-security-policy",
  "x-content-type-options",
  "x-frame-options",
  "referrer-policy",
  "permissions-policy",
  "cache-control",
  "x-robots-tag",
] as const;

const UNSUPPORTED_WALLET_CLAIMS = [
  /\bmember\s+fdic\b/i,
  /\bfdic[-\s]?insured\b/i,
  /\bequal\s+housing\s+(?:lender|opportunity)\b/i,
  /\bnational\s+bank\b/i,
  /\b(?:checking|savings|deposit)\s+accounts?\b/i,
  /\b(?:home|business|construction)\s+loans?\b/i,
  /\b(?:free\s+)?debit\s+card\b/i,
  /\bauto[-\s]?approv(?:ed|al)\b/i,
  /\bbank-owned (?:homes?|properties)\b/i,
  /\b30[-\s]?day funding window\b/i,
  /\bfull property purchase\b/i,
  /\btrue halal banking\b/i,
  /\bcomplete halal financial services\b/i,
  /\bevery transaction secured\b/i,
  /\bblockchain[-\s]verified agreements?\b/i,
  /\bapply (?:now|for membership)\b/i,
  /\bsubmit application\b/i,
  /\bapplication received\b/i,
  /(?:\$5,?000|\$5K).{0,40}\b(?:auto[-\s]?approv|down payment|full property)/i,
] as const;

const UNSUPPORTED_LOGISTICS_CLAIMS = [
  /\b190\+\s*(?:countries)?\b/i,
  /\b100%\s+halal chain\b/i,
  /\blive\s+tracking\b/i,
  /\breal[-\s]?time fleet tracking\b/i,
  /\bAI\b.{0,20}\broute optimization\b/i,
  /\bcertified handling\b/i,
  /\bconnecting .{0,60} worldwide\b/i,
  /\bcommunity-based last-mile delivery\b/i,
  /\blocal mesh network couriers\b/i,
  /\bAI-optimized routing\b/i,
  /\bmosque stops\b/i,
  /\binternational shipping and customs clearance\b/i,
  /\bbasic insurance\b/i,
  /\bpay per use\b/i,
  /\$(?:149|699)(?:\.00)?\s*\/?\s*mo\b/i,
  /href=["'][^"']*\/checkout\//i,
  /\b(?:stripe|payments?)\s+(?:connected|live|enabled|ready)\b/i,
] as const;

function expectSecurePreview(response: Response): void {
  for (const name of SECURE_HEADERS) {
    expect(response.headers.get(name), `${name} should be present`).toBeTruthy();
  }
  expect(response.headers.get("content-security-policy")).toContain(
    "frame-ancestors 'none'",
  );
  expect(response.headers.get("x-content-type-options")).toBe("nosniff");
  expect(response.headers.get("x-frame-options")).toBe("DENY");
  expect(response.headers.get("x-robots-tag")).toBe(
    "noindex, nofollow, noarchive",
  );
  expect(response.headers.get("x-darcloud-no-sso")).toBeNull();
}

function expectNoClaims(text: string, patterns: readonly RegExp[]): void {
  for (const pattern of patterns) {
    expect(text, `unexpected claim matched ${pattern}`).not.toMatch(pattern);
  }
}

describe("Wallet and HWC research preview", () => {
  const hosts = [
    "banking.darcloud.host",
    "wallet.darcloud.host",
    "darwallet.darcloud.host",
    "hwc.darcloud.host",
    "halalwealthclub.darcloud.host",
    "banking.darcloud.net",
  ];

  for (const host of hosts) {
    it(`routes ${host} to the same safe research surface`, async () => {
      const response = await SELF.fetch(`https://${host}/`);
      const html = await response.text();

      expect(response.status).toBe(200);
      expect(response.headers.get("location")).toBeNull();
      expect(html).toContain("DarCloud Wallet Research Preview");
      expect(html).toContain("Research preview");
      expect(html).toContain("No data intake");
      expect(html).not.toContain("<form");
      expect(html).not.toMatch(
        /name=["'](?:fullName|phone|city|address|ssn|itin|dob)["']/i,
      );
      expectNoClaims(html, UNSUPPORTED_WALLET_CLAIMS);
      expectSecurePreview(response);
    });
  }

  it("reports truthful health state", async () => {
    const response = await SELF.fetch("https://banking.darcloud.host/health");
    const health = await response.json<{
      status: string;
      mode: string;
      waitlist_enabled: boolean;
      transactions_enabled: boolean;
      sensitive_identity_collection_enabled: boolean;
    }>();

    expect(response.status).toBe(200);
    expect(health).toMatchObject({
      status: "ok",
      mode: "research-only",
      waitlist_enabled: false,
      transactions_enabled: false,
      sensitive_identity_collection_enabled: false,
    });
    expectSecurePreview(response);
  });

  it("rejects legacy enrollment writes on every wallet alias", async () => {
    for (const host of hosts) {
      const response = await SELF.fetch(`https://${host}/api/hwc/apply`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: "no-write@example.com" }),
      });
      expect(response.status, host).toBe(405);
      expect(response.headers.get("allow"), host).toBe(
        "GET, HEAD, OPTIONS",
      );
    }
  });

  it("retires both apex and www legacy application routes", async () => {
    for (const [url, status] of [
      ["http://local.test/api/hwc/apply", 410],
      ["https://www.darcloud.host/api/hwc/apply", 405],
    ]) {
      const response = await SELF.fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: "Test", email: "test@example.com" }),
      });
      expect(response.status, url).toBe(status);
      expect(response.headers.get("allow"), url).toBe(
        "GET, HEAD, OPTIONS",
      );
    }
  });

  it("fails closed for every legacy financial checkout alias", async () => {
    const plans = [
      "hwc",
      "wallet",
      "darwallet",
      "banking",
      "halalwealthclub",
      "pro",
      "enterprise",
      "fungimesh",
    ];

    for (const plan of plans) {
      for (const [url, status] of [
        ["http://local.test/api/checkout/session", 410],
        ["https://checkout.darcloud.host/api/checkout/session", 405],
        ["https://www.darcloud.host/api/checkout/session", 405],
      ]) {
        const response = await SELF.fetch(url, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            plan,
            email: "no-financial-checkout@example.com",
          }),
        });
        expect(response.status, `${url} (${plan})`).toBe(status);
        expect(response.headers.get("allow"), `${url} (${plan})`).toBe(
          "GET, HEAD, OPTIONS",
        );
      }
    }
  });

  it("never turns a checkout URL into another plan or a success page", async () => {
    for (const url of [
      "http://local.test/checkout/hwc",
      "http://local.test/checkout/HWC",
      "http://local.test/checkout/hwc/",
      "http://local.test/checkout/%68wc",
      "https://checkout.darcloud.host/checkout/hwc",
      "https://checkout.darcloud.host/checkout/HWC",
      "https://checkout.darcloud.host/checkout/hwc/",
      "https://checkout.darcloud.host/checkout/%68wc",
    ]) {
      const response = await SELF.fetch(url);
      const html = await response.text();
      expect(response.status, url).toBe(410);
      expect(html, url).toContain("Checkout is unavailable");
      expect(html, url).not.toContain("Payment Successful");
      expect(html, url).not.toContain("Subscribe");
    }
  });

  it("never lets a Wallet host fall through to the apex contact collector", async () => {
    for (const host of ["banking", "wallet", "darwallet", "hwc", "halalwealthclub"]) {
      for (const method of ["POST", "PUT", "PATCH", "DELETE"]) {
        const response = await SELF.fetch(`https://${host}.darcloud.host/api/contact`, {
          method,
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            name: "Injected",
            email: "wallet-bypass@example.com",
            message: "Must not persist",
            source: "enterprise",
          }),
        });
        expect(response.status, `${host} ${method}`).toBe(405);
        expect(await response.json(), `${host} ${method}`).toMatchObject({
          mode: "research-only",
        });
      }
    }
  });

  it("removes old claims from every public page that previously echoed them", async () => {
    const urls: Array<[string, number]> = [
      ["https://realestate.darcloud.host/", 200],
      ["https://www.darcloud.host/", 200],
      ["https://darcloud.net/", 200],
      ["https://checkout.darcloud.host/checkout/pro", 410],
      ["http://local.test/onboarding", 200],
      ["http://local.test/dashboard", 410],
      ["http://local.test/checkout/pro", 410],
      ["http://local.test/terms", 200],
    ];

    for (const [url, status] of urls) {
      const response = await SELF.fetch(url);
      const html = await response.text();
      expect(response.status, url).toBe(status);
      expectNoClaims(html, UNSUPPORTED_WALLET_CLAIMS);
    }
  });
});

describe("Dar Logistics internal-test preview", () => {
  const hosts = [
    "logistics.darcloud.host",
    "darlogistics.darcloud.host",
    "transport.darcloud.host",
    "logistics.darcloud.net",
  ];

  for (const host of hosts) {
    it(`routes ${host} to the fictional-data preview`, async () => {
      const response = await SELF.fetch(`https://${host}/`);
      const html = await response.text();

      expect(response.status).toBe(200);
      expect(response.headers.get("location")).toBeNull();
      expect(html).toContain("Dar Logistics Internal Test");
      expect(html).toContain("fictional data");
      expect(html).toContain("No live operations");
      expect(html).not.toContain("<form");
      expectNoClaims(html, UNSUPPORTED_LOGISTICS_CLAIMS);
      expectSecurePreview(response);
    });
  }

  it("reports every live capability as disabled", async () => {
    const response = await SELF.fetch("https://logistics.darcloud.host/health");
    const health = await response.json<{
      status: string;
      mode: string;
      fictional_data: boolean;
      bookings_enabled: boolean;
      shipments_enabled: boolean;
      dispatch_enabled: boolean;
      payments_enabled: boolean;
      location_tracking_enabled: boolean;
    }>();

    expect(response.status).toBe(200);
    expect(health).toMatchObject({
      status: "ok",
      mode: "internal-test",
      fictional_data: true,
      bookings_enabled: false,
      shipments_enabled: false,
      dispatch_enabled: false,
      payments_enabled: false,
      location_tracking_enabled: false,
    });
    expectSecurePreview(response);
  });

  it("returns 405 for every write method, path, and Logistics alias", async () => {
    for (const host of hosts) {
      for (const path of ["/", "/api/checkout", "/api/bookings", "/dispatch"]) {
        for (const method of ["POST", "PUT", "PATCH", "DELETE"]) {
          const response = await SELF.fetch(`https://${host}${path}`, {
            method,
            headers: { "Content-Type": "application/json" },
            body: "{}",
          });
          expect(response.status, `${host} ${method} ${path}`).toBe(405);
          expect(response.headers.get("allow"), `${host} ${method} ${path}`).toBe(
            "GET, HEAD, OPTIONS",
          );
        }
      }
    }
  });
});

describe("Unverified service safety gate", () => {
  const hosts = [
    "pay.darcloud.host",
    "revenue.darcloud.host",
    "defi.darcloud.host",
    "trade.darcloud.host",
    "commerce.darcloud.host",
    "enterprise.darcloud.host",
    "law.darcloud.host",
    "energy.darcloud.host",
    "hr.darcloud.host",
    "telecom.darcloud.host",
    "mesh.darcloud.host",
    "ai.darcloud.host",
    "unmapped-concept.darcloud.host",
  ];

  for (const host of hosts) {
    it(`keeps ${host} non-operational`, async () => {
      const page = await SELF.fetch(`https://${host}/`);
      const html = await page.text();
      expect(page.status).toBe(200);
      expect(html).toContain("This service is not live");
      expect(html).toContain("No payment processing");
      expectSecurePreview(page);

      const health = await SELF.fetch(`https://${host}/health`);
      expect(await health.json()).toMatchObject({
        status: "unavailable",
        mode: "internal-concept",
        live: false,
        payments: false,
        transactions: false,
        regulated_services: false,
        real_world_fulfillment: false,
      });

      const write = await SELF.fetch(`https://${host}/activate`, { method: "POST" });
      expect(write.status).toBe(405);
      expect(write.headers.get("allow")).toBe("GET, HEAD, OPTIONS");
    });
  }
});

describe("DarCloud host routing guards", () => {
  it.each([
    "https://nested.ai.darcloud.host/",
    "https://nested.ai.darcloud.net/",
    "https://ai.darcloud.host./",
  ])("fails closed for non-canonical host %s", async (url) => {
    const response = await SELF.fetch(url);
    const html = await response.text();
    expect(response.status).toBe(200);
    expect(html).toContain("This service is not live");
    expectSecurePreview(response);
  });

  it.each([
    "/meshtalk",
    "/meshtalk/privacy",
    "/meshtalk/terms",
    "/meshtalk/child-safety",
    "/meshtalk/delete-account",
  ])("fails closed if the dedicated MeshTalk route is lost for %s", async (path) => {
    const response = await SELF.fetch(`http://local.test${path}`);
    expect(response.status).toBe(503);
    expect(response.headers.get("cache-control")).toBe("no-store");
    expect(await response.json()).toEqual({
      error: "MeshTalk is unavailable through this deployment.",
      service: "meshtalk",
      expected_route_owner: "quranchain",
      handled_here: false,
      writes_enabled: false,
    });
  });
});
