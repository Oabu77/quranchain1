import assert from "node:assert/strict";
import fs from "node:fs";

const entry = fs.readFileSync("src/security-entry.ts", "utf8");
const wrangler = fs.readFileSync("wrangler.jsonc", "utf8");

assert.match(wrangler, /"main"\s*:\s*"src\/security-entry\.ts"/);
assert.match(entry, /url\.pathname === "\/api\/auth\/signup"/);
assert.match(entry, /Paid plans cannot be selected during signup/);
assert.match(entry, /url\.pathname === "\/api\/checkout\/session"/);
assert.match(entry, /Checkout is temporarily disabled pending entitlement hardening/);
assert.match(entry, /url\.pathname === "\/api\/stripe\/portal"/);
assert.match(entry, /Billing portal is temporarily disabled pending account binding/);
assert.match(entry, /url\.pathname === "\/api\/admin\/stats"/);
assert.match(entry, /Administrator authorization required/);
assert.doesNotMatch(entry, /STRIPE_SECRET_KEY/);
assert.doesNotMatch(entry, /customer_id\s*[:=]/);

console.log("auth/billing containment regression checks passed");
