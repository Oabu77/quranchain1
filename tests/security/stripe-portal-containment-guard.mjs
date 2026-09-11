import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

const entry = readFileSync(resolve("src/security-entry.ts"), "utf8");
const wrangler = readFileSync(resolve("wrangler.jsonc"), "utf8");
const legacy = readFileSync(resolve("src/index.ts"), "utf8");

assert.ok(
  wrangler.includes('"main": "src/security-entry.ts"'),
  "Cloudflare deployment must execute the security containment entrypoint",
);

const pathCheck = entry.indexOf('url.pathname === STRIPE_PORTAL_PATH');
const failClosed = entry.indexOf('{ status: 503');
const legacyDispatch = entry.indexOf('app.fetch(request, env, ctx)');
assert.ok(pathCheck >= 0, "portal path must be intercepted");
assert.ok(failClosed > pathCheck, "portal interception must return fail-closed status");
assert.ok(legacyDispatch > failClosed, "portal decision must execute before legacy app dispatch");
assert.ok(
  entry.includes('const STRIPE_PORTAL_PATH = "/api/stripe/portal"'),
  "portal containment must target the exact provider-backed route",
);

assert.ok(
  legacy.includes('app.post("/api/stripe/portal"'),
  "guard should fail if the legacy route disappears without updating this security decision",
);
assert.ok(
  legacy.includes('const { customer_id } = await c.req.json()'),
  "guard should remain until caller-selected customer authority is removed from the legacy handler",
);

console.log("Stripe portal fail-closed containment guard passed");
