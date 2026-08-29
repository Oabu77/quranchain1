import { SELF } from "cloudflare:test";
import { describe, expect, it } from "vitest";

describe("Legacy messaging surface", () => {
  it.each([
    ["GET", "/messages"],
    ["GET", "/messaging/conversations"],
    ["POST", "/messaging/conversations"],
    ["GET", "/messaging/conversations/1/messages"],
    ["POST", "/messaging/conversations/1/messages"],
    ["PUT", "/messaging/messages/1"],
    ["DELETE", "/messaging/messages/1"],
  ])("is retired for %s %s", async (method, path) => {
    const response = await SELF.fetch(`http://local.test${path}`, {
      method,
      headers: { "Content-Type": "application/json" },
      body: method === "GET" ? undefined : JSON.stringify({ content: "must-not-persist" }),
    });
    const body = await response.json<{ writes_enabled: boolean }>();

    expect(response.status).toBe(410);
    expect(body.writes_enabled).toBe(false);
  });
});
