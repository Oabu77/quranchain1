import { describe, expect, it } from "vitest";
import { SELF } from "cloudflare:test";
import tracker from "../../landing-pages/darcloud-quran-tracker.js";

const base = "https://quranchain.darcloud.host";

async function request(path = "/", init?: RequestInit): Promise<Response> {
  return tracker.fetch(new Request(base + path, init));
}

describe("QuranChain Tracker isolated internal preview", () => {
  it("serves a useful, truthful device-only tracker shell", async () => {
    const response = await request();
    const html = await response.text();

    expect(response.status).toBe(200);
    expect(response.headers.get("content-security-policy")).toContain("script-src 'self'");
    expect(response.headers.get("permissions-policy")).toContain("geolocation=()");
    expect(response.headers.get("x-darcloud-no-sso")).toBe("1");
    expect(html).toContain("Today's prayers");
    expect(html).toContain("Reading progress");
    expect(html).toContain("Recitation session timer");
    expect(html).toContain("device-only data");
    expect(html).toContain("does not calculate prayer times");
  });

  it("does not present financial, network, location, or fabricated activity claims", async () => {
    const html = await (await request()).text();
    const forbidden = [
      /\bQRN\b/i,
      /QuranCoin/i,
      /\bmin(?:e|ing)\b/i,
      /\btoken(?:s|ized)?\b/i,
      /\bstak(?:e|ing)\b/i,
      /\btrading\b/i,
      /\binvest(?:ment|ing)?\b/i,
      /\bgeo(?:location)?\b/i,
      /mosque visit/i,
      /node reward/i,
      /live users/i,
      /live chains/i,
      /gas revenue/i,
      /wallet balance/i,
      /all validators online/i,
    ];

    for (const claim of forbidden) expect(html).not.toMatch(claim);
  });

  it("keeps all writes disabled and reports truthful capabilities", async () => {
    const post = await request("/anything", { method: "POST", body: "x" });
    expect(post.status).toBe(405);
    expect(post.headers.get("allow")).toBe("GET, HEAD, OPTIONS");

    const health = await request("/health");
    expect(await health.json()).toEqual({
      status: "ok",
      service: "QuranChain Tracker preview",
      mode: "internal-test",
      server_writes_enabled: false,
      accounts_enabled: false,
      payments_enabled: false,
      location_access_enabled: false,
      user_entries: "device-only",
    });
  });

  it("serves the local app script and required disclosure pages", async () => {
    const script = await request("/app.js");
    const js = await script.text();
    expect(script.headers.get("content-type")).toContain("text/javascript");
    expect(js).toContain("localStorage");
    expect(js).not.toContain("fetch(");
    expect(js).not.toContain("geolocation");
    expect(() => new Function(js)).not.toThrow();

    for (const path of ["/privacy", "/terms", "/delete-data"]) {
      const page = await request(path);
      expect(page.status).toBe(200);
      expect(page.headers.get("content-type")).toContain("text/html");
    }
  });

  it("supports HEAD without returning a body", async () => {
    const response = await request("/", { method: "HEAD" });
    expect(response.status).toBe(200);
    expect(await response.text()).toBe("");
  });

  it("replaces the former public explorer on integrated routes", async () => {
    for (const host of ["quranchain.darcloud.host", "blockchain.darcloud.host"]) {
      const response = await SELF.fetch(`https://${host}/`);
      const html = await response.text();
      expect(response.status, host).toBe(200);
      expect(html, host).toContain("device-only data");
      expect(html, host).not.toContain("47 live chains");
      expect(html, host).not.toContain("gas revenue");
      expect(response.headers.get("x-darcloud-no-sso"), host).toBeNull();
      expect(response.headers.get("content-security-policy"), host).toContain("script-src 'self'");
    }
  });
});
