import { SELF } from "cloudflare:test";
import { describe, expect, it } from "vitest";

describe("Retired contract and legal automation API", () => {
  const paths = [
    "/api/contracts",
    "/api/contracts/companies",
    "/api/contracts/companies/seed",
    "/api/contracts/sign",
    "/api/contracts/seed-all",
    "/api/contracts/clients",
    "/api/contracts/revenue",
    "/api/contracts/legal/file-all",
    "/api/contracts/legal/filings",
    "/api/contracts/legal/protect-ip",
    "/api/contracts/legal/ip",
    "/api/contracts/darlaw/agents",
    "/api/contracts/bootstrap",
  ];

  for (const path of paths) {
    it(`returns an explicit retirement response for GET ${path}`, async () => {
      const response = await SELF.fetch(`http://local.test${path}`);
      const body = await response.json<{
        error: string;
        mode: string;
        signed: boolean;
        filed: boolean;
        licensed: boolean;
        revenue_verified: boolean;
      }>();

      expect(response.status).toBe(410);
      expect(response.headers.get("allow")).toBe("GET, HEAD, OPTIONS");
      expect(body).toEqual({
        error: "Contract and legal automation endpoints are retired.",
        mode: "internal-planning-only",
        signed: false,
        filed: false,
        licensed: false,
        revenue_verified: false,
      });
    });
  }

  it("rejects every former mutation without claiming success", async () => {
    for (const path of [
      "/api/contracts/companies/seed",
      "/api/contracts/sign",
      "/api/contracts/seed-all",
      "/api/contracts/legal/file-all",
      "/api/contracts/legal/protect-ip",
      "/api/contracts/bootstrap",
    ]) {
      const response = await SELF.fetch(`http://local.test${path}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title: "must not persist" }),
      });
      const body = await response.json<Record<string, unknown>>();
      expect(response.status, path).toBe(410);
      expect(body.success, path).not.toBe(true);
      expect(body.signed, path).toBe(false);
      expect(body.filed, path).toBe(false);
      expect(body.licensed, path).toBe(false);
      expect(body.revenue_verified, path).toBe(false);
    }
  });
});
