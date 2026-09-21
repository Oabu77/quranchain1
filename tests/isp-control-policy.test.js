const fs = require('node:fs');
const assert = require('node:assert/strict');

const router = fs.readFileSync('src/endpoints/isp/router.ts', 'utf8');
const security = fs.readFileSync('src/endpoints/isp/security.ts', 'utf8');

const authGate = router.indexOf('ispRouter.use("*"');
assert(authGate >= 0, 'ISP authorization gate must exist');

for (const publicRoute of [
  'ispRouter.get("/plans"',
  'ispRouter.get("/wifi-directory"',
  'ispRouter.get("/coverage-map"',
  'ispRouter.get("/satellites"',
  'ispRouter.get("/satellites/overhead"',
]) {
  const index = router.indexOf(publicRoute);
  assert(index >= 0 && index < authGate, `${publicRoute} must remain intentionally public before the gate`);
}

for (const sensitiveRoute of [
  'ispRouter.get("/dashboard"',
  'ispRouter.get("/subscribers"',
  'ispRouter.post("/subscribers/provision"',
  'ispRouter.get("/devices"',
  'ispRouter.post("/devices/register"',
  'ispRouter.get("/firmware"',
  'ispRouter.get("/cellular"',
  'ispRouter.post("/cellular/provision"',
  'ispRouter.get("/coverage"',
  'ispRouter.post("/wifi-hotspot/register"',
  'ispRouter.get("/ground-stations"',
  'ispRouter.post("/ground-stations/register"',
  'ispRouter.get("/towers"',
  'ispRouter.get("/signal-map"',
]) {
  const index = router.indexOf(sensitiveRoute);
  assert(index > authGate, `${sensitiveRoute} must be registered behind the authorization gate`);
}

assert(router.includes('authorizeIspRequest('), 'router must invoke ISP authorization policy');
assert(router.includes('DARCLOUD_ISP_READ_TOKEN'), 'read credential must be server-managed');
assert(router.includes('DARCLOUD_ISP_MUTATION_TOKEN'), 'mutation credential must be server-managed');
assert(security.includes('MIN_CONTROL_TOKEN_LENGTH = 32'), 'weak server credentials must fail closed');
assert(security.includes('status: 503'), 'missing/weak server config must fail closed');
assert(security.includes('status: 401'), 'missing bearer credentials must be rejected');
assert(security.includes('status: 403'), 'incorrect/insufficient credentials must be rejected');
assert(security.includes('crypto.subtle.digest("SHA-256"'), 'credential comparison must avoid plaintext direct equality');

console.log('ISP control-plane authorization regression: PASS');
