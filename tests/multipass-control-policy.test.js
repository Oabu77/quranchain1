const fs = require('node:fs');
const assert = require('node:assert/strict');

const router = fs.readFileSync('src/endpoints/multipass/router.ts', 'utf8');
const security = fs.readFileSync('src/endpoints/multipass/security.ts', 'utf8');
const launch = fs.readFileSync('src/endpoints/multipass/vmLaunch.ts', 'utf8');
const remove = fs.readFileSync('src/endpoints/multipass/vmDelete.ts', 'utf8');

const authGate = router.indexOf('multipassRouter.use("*"');
const firstRoute = router.indexOf('multipassRouter.get("/vms"');

assert(authGate >= 0, 'Multipass authorization gate must exist');
assert(authGate < firstRoute, 'authorization gate must precede every Multipass route');
assert(router.includes('authorizeMultipassRequest('), 'router must invoke authorization policy');
assert(router.includes('DARCLOUD_MULTIPASS_READ_TOKEN'), 'read credential must be server-managed');
assert(router.includes('DARCLOUD_MULTIPASS_MUTATION_TOKEN'), 'mutation credential must be server-managed');
assert(security.includes('MIN_CONTROL_TOKEN_LENGTH = 32'), 'weak server credentials must fail closed');
assert(security.includes('status: 503'), 'missing/weak server config must fail closed');
assert(security.includes('status: 401'), 'missing bearer credentials must be rejected');
assert(security.includes('status: 403'), 'incorrect/insufficient credentials must be rejected');
assert(security.includes('crypto.subtle.digest("SHA-256"'), 'credential comparison must avoid plaintext direct equality');
assert(launch.includes('.regex(VM_NAME_PATTERN'), 'launch must reject unsafe VM names');
assert(remove.includes('.regex(VM_NAME_PATTERN'), 'delete must reject unsafe VM identifiers before command generation');

console.log('multipass control-plane authorization regression: PASS');
