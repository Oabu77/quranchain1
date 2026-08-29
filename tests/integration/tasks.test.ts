import { SELF } from "cloudflare:test";
import { describe, expect, it } from "vitest";

const retiredOperationalPaths = [
  "/tasks",
  "/backups",
  "/mesh",
  "/ai",
  "/minecraft",
  "/multipass",
  "/messages",
  "/messaging",
  "/telecom",
  "/wifi",
  "/isp",
];

describe("Retired operational APIs", () => {
  for (const path of retiredOperationalPaths) {
    it.each([
      ["GET", path],
      ["GET", `${path}/sample-record`],
      ["POST", path],
      ["PUT", `${path}/sample-record`],
      ["PATCH", `${path}/sample-record`],
      ["DELETE", `${path}/sample-record`],
    ])("fails closed for %s %s", async (method, target) => {
      const response = await SELF.fetch(`http://local.test${target}`, {
        method,
        headers: { "Content-Type": "application/json" },
        body: method === "GET" ? undefined : JSON.stringify({ value: "must-not-persist" }),
      });
      const body = await response.json<{
        error: string;
        mode: string;
        writes_enabled: boolean;
        live_infrastructure_verified: boolean;
      }>();

      expect(response.status).toBe(410);
      expect(response.headers.get("allow")).toBe("GET, HEAD, OPTIONS");
      expect(body).toEqual({
        error: "Operational endpoint is unavailable.",
        mode: "internal-planning-only",
        writes_enabled: false,
        live_infrastructure_verified: false,
      });
    });
  }
});
