import { SELF } from "cloudflare:test";
import { describe, expect, it } from "vitest";

describe("System Health API Integration Tests", () => {
  it("reports only verified pre-release capabilities", async () => {
    const response = await SELF.fetch("http://local.test/health");
    expect(response.status).toBe(200);
    expect(await response.json()).toEqual({
      status: "preview",
      service: "DarCloud pre-release API",
      version: "5.4.0",
      mode: "restricted",
      payments: false,
      contracts: false,
      operational_writes: false,
      live_infrastructure_verified: false,
    });
  });
});
