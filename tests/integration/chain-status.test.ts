import { env, fetchMock } from "cloudflare:test";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import app from "../../src/index";

const NOW = Date.parse("2026-09-21T20:00:00.000Z");
const bindings = () => ({
  ...env,
  CHAIN_STATUS_URL: "https://ledger-origin.example/chain-status",
  CHAIN_STATUS_TOKEN: "test-only-origin-token",
});
const snapshot = () => ({
  source_type: "local_sqlite_ledger",
  observed_at: "2026-09-21T20:00:00.000Z",
  block_count: 2,
  transaction_count: 3,
  latest_block: { index: 2, chain_index: 1, chain: "Ethereum", timestamp: "2026-09-21T19:59:00.000Z" },
});
const request = (path = "/api/chain/status", options?: RequestInit, config = bindings()) =>
  app.fetch(new Request(`https://blockchain.darcloud.host${path}`, options), config as Env);

describe("Public ledger status", () => {
  beforeEach(() => {
    vi.spyOn(Date, "now").mockReturnValue(NOW);
    fetchMock.activate();
    fetchMock.disableNetConnect();
  });
  afterEach(() => {
    try { fetchMock.assertNoPendingInterceptors(); }
    finally { fetchMock.deactivate(); vi.restoreAllMocks(); vi.useRealTimers(); }
  });

  it("reports only observed ledger fields, with their source and observation time", async () => {
    fetchMock.get("https://ledger-origin.example").intercept({
      path: "/chain-status", method: "GET", headers: { authorization: "Bearer test-only-origin-token" },
    }).reply(200, { ...snapshot(), revenue: 402000, private_record: "must-not-leak" });
    const response = await request();
    const body = await response.json<any>();
    expect(response.status).toBe(200);
    expect(response.headers.get("cache-control")).toBe("no-store");
    expect(body.status).toBe("fresh");
    expect(body.source).toEqual({ type: "local_sqlite_ledger", service: "quranchain-bot", endpoint: "/chain-status" });
    expect(body.observed_at).toBe("2026-09-21T20:00:00.000Z");
    expect(body.data).toEqual({ block_count: 2, transaction_count: 3, latest_block: snapshot().latest_block });
    expect(JSON.stringify(body)).not.toContain("must-not-leak");
    expect(JSON.stringify(body)).not.toContain("402000");
  });

  it("fails closed without a configured upstream instead of inventing an empty or healthy chain", async () => {
    const response = await request("/api/chain/status", undefined, { ...env } as any);
    const body = await response.json<any>();
    expect(response.status).toBe(503);
    expect(body).toMatchObject({ status: "unavailable", reason: "not_configured", observed_at: null, data: null });
  });

  it("marks an old upstream observation stale without refreshing its timestamp", async () => {
    fetchMock.get("https://ledger-origin.example").intercept({ path: "/chain-status" }).reply(200,
      { ...snapshot(), observed_at: "2026-09-21T19:58:00.000Z", latest_block: null, block_count: 0 });
    const response = await request();
    expect(response.status).toBe(503);
    expect(await response.json()).toMatchObject({ status: "stale", observed_at: "2026-09-21T19:58:00.000Z", age_seconds: 120, data: { block_count: 0 } });
  });

  it("uses observation freshness independently of the most recent block age", async () => {
    fetchMock.get("https://ledger-origin.example").intercept({ path: "/chain-status" }).reply(200,
      { ...snapshot(), latest_block: { ...snapshot().latest_block, timestamp: "2025-01-01T00:00:00.000Z" } });
    const response = await request();
    expect(response.status).toBe(200);
    expect(await response.json()).toMatchObject({ status: "fresh", data: { latest_block: { timestamp: "2025-01-01T00:00:00.000Z" } } });
  });

  it.each([
    { ...snapshot(), block_count: -1 },
    { ...snapshot(), observed_at: "2027-01-01T00:00:00.000Z" },
    { ...snapshot(), source_type: "verified_mainnet" },
    { ...snapshot(), block_count: 0 },
    { ...snapshot(), latest_block: { ...snapshot().latest_block, timestamp: "2030-01-01T00:00:00.000Z" } },
  ])("rejects inconsistent or unsupported upstream data", async (invalid) => {
    fetchMock.get("https://ledger-origin.example").intercept({ path: "/chain-status" }).reply(200, invalid);
    const response = await request();
    expect(response.status).toBe(502);
    expect(await response.json()).toMatchObject({ status: "unavailable", reason: "invalid_upstream_response", data: null });
  });

  it("reports upstream failure without leaking the upstream response", async () => {
    fetchMock.get("https://ledger-origin.example").intercept({ path: "/chain-status" }).reply(500, "private server error");
    const response = await request();
    expect(response.status).toBe(502);
    expect(await response.json()).toMatchObject({ status: "unavailable", reason: "upstream_unavailable", data: null });
  });

  it("does not follow redirects carrying the private service credential", async () => {
    fetchMock.get("https://ledger-origin.example").intercept({ path: "/chain-status" }).reply(302, "", { headers: { location: "https://other-origin.example/private" } });
    const response = await request();
    expect(response.status).toBe(502);
    expect(await response.json()).toMatchObject({ reason: "upstream_unavailable", data: null });
  });

  it("reports a network failure without fabricated fallback data", async () => {
    vi.spyOn(globalThis, "fetch").mockRejectedValueOnce(new Error("private infrastructure detail"));
    const response = await request();
    const body = await response.json<any>();
    expect(response.status).toBe(502);
    expect(body.data).toBeNull();
    expect(JSON.stringify(body)).not.toContain("private infrastructure detail");
  });

  it.each(["headers", "body"])("times out while waiting for upstream %s", async (stage) => {
    vi.useFakeTimers({ toFake: ["setTimeout", "clearTimeout"] });
    vi.spyOn(globalThis, "fetch").mockImplementationOnce(async (_input, init) => {
      if (stage === "headers") {
        return new Promise<Response>((_resolve, reject) => {
          init!.signal!.addEventListener("abort", () => reject(new DOMException("Aborted", "AbortError")), { once: true });
        });
      }
      return new Response(new ReadableStream({
        start(controller) {
          init!.signal!.addEventListener("abort", () => controller.error(new DOMException("Aborted", "AbortError")), { once: true });
        },
      }));
    });
    const pending = request();
    await vi.advanceTimersByTimeAsync(5_000);
    const response = await pending;
    expect(response.status).toBe(502);
    expect(await response.json()).toMatchObject({ status: "unavailable", reason: "upstream_timeout", data: null });
  });

  it("rejects upstream bodies above the byte limit without exposing the payload", async () => {
    fetchMock.get("https://ledger-origin.example").intercept({ path: "/chain-status" }).reply(200, "x".repeat(65_537));
    const response = await request();
    expect(response.status).toBe(502);
    expect(await response.json()).toMatchObject({ reason: "invalid_upstream_response", data: null });
  });

  it("rejects mutation methods and query strings before contacting the upstream", async () => {
    expect((await request("/api/chain/status", { method: "POST" })).status).toBe(405);
    expect((await request("/api/chain/status?path=/member")).status).toBe(400);
  });

  it("rejects recursive Worker origins rather than calling its own wildcard route", async () => {
    const response = await request("/api/chain/status", undefined,
      { ...bindings(), CHAIN_STATUS_URL: "https://blockchain.darcloud.host/chain-status" });
    expect(response.status).toBe(503);
    expect(await response.json()).toMatchObject({ reason: "invalid_configuration" });
  });

  it("serves blockchain health from the same observed upstream data", async () => {
    fetchMock.get("https://ledger-origin.example").intercept({ path: "/chain-status" }).reply(200, snapshot());
    const response = await request("/health");
    expect(response.status).toBe(200);
    expect(await response.json()).toMatchObject({ status: "fresh", data: { block_count: 2 } });
  });

  it("does not proxy undefined blockchain API paths", async () => {
    const response = await request("/api/blocks");
    expect(response.status).toBe(404);
    expect(await response.json()).toMatchObject({ error: "not_found" });
  });
});
