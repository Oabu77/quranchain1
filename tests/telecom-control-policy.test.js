const fs = require('node:fs');
const assert = require('node:assert/strict');

const router = fs.readFileSync('src/endpoints/telecom/router.ts', 'utf8');
const security = fs.readFileSync('src/endpoints/telecom/security.ts', 'utf8');

const publicPlans = router.indexOf('telecomRouter.get("/plans"');
const authGate = router.indexOf('telecomRouter.use("*"');
const firstSensitiveRoute = router.indexOf('telecomRouter.get("/dashboard"');

assert(publicPlans >= 0, 'public plans route must exist');
assert(authGate > publicPlans, 'authorization gate must be registered after public plans');
assert(authGate < firstSensitiveRoute, 'authorization gate must precede sensitive telecom routes');
assert(router.includes('authorizeTelecomRequest('), 'router must invoke the authorization policy');
assert(router.includes('DARCLOUD_TELECOM_READ_TOKEN'), 'read credential must be server-managed');
assert(router.includes('DARCLOUD_TELECOM_MUTATION_TOKEN'), 'mutation credential must be server-managed');

for (const route of [
  'telecomRouter.post("/subscribers"',
  'telecomRouter.get("/subscribers"',
  'telecomRouter.patch("/subscribers/:id"',
  'telecomRouter.delete("/subscribers/:id"',
  'telecomRouter.get("/sims"',
  'telecomRouter.get("/esim/:subscriber_id"',
  'telecomRouter.post("/network/event"',
  'telecomRouter.post("/mesh/register"',
  'telecomRouter.post("/mesh/heartbeat"',
  'telecomRouter.get("/billing/summary"',
]) {
  assert(router.indexOf(route) > authGate, `${route} must remain behind the authorization gate`);
}

assert(security.includes('MIN_CONTROL_TOKEN_LENGTH = 32'), 'weak server credentials must fail closed');
assert(security.includes('status: 503'), 'missing/weak server config must fail closed');
assert(security.includes('status: 401'), 'missing bearer credentials must be rejected');
assert(security.includes('status: 403'), 'wrong bearer credentials must be rejected');
assert(security.includes('crypto.subtle.digest("SHA-256"'), 'credential comparison must avoid plaintext direct equality');

console.log('telecom control-plane authorization regression: PASS');
