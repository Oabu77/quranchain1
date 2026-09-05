const fs = require('node:fs');
const assert = require('node:assert/strict');

const router = fs.readFileSync('src/endpoints/backups/router.ts', 'utf8');
const security = fs.readFileSync('src/endpoints/backups/security.ts', 'utf8');

const authGate = router.indexOf('backupsRouter.use("*"');
const firstRoute = router.indexOf('backupsRouter.get("/"');

assert(authGate >= 0, 'backup authorization gate must exist');
assert(firstRoute >= 0, 'backup routes must exist');
assert(authGate < firstRoute, 'authorization gate must precede every backup route');
assert(router.includes('authorizeBackupRequest('), 'router must invoke backup authorization policy');
assert(router.includes('DARCLOUD_BACKUPS_READ_TOKEN'), 'read credential must be server-managed');
assert(router.includes('DARCLOUD_BACKUPS_MUTATION_TOKEN'), 'mutation credential must be server-managed');
assert(router.includes('Cache-Control", "no-store"'), 'authenticated backup responses must be non-cacheable');
assert(security.includes('MIN_CONTROL_TOKEN_LENGTH = 32'), 'weak server credentials must fail closed');
assert(security.includes('status: 503'), 'missing/unsafe server auth configuration must fail closed');
assert(security.includes('status: 401'), 'missing bearer credentials must be rejected');
assert(security.includes('status: 403'), 'incorrect/insufficient credentials must be rejected');
assert(security.includes('crypto.subtle.digest("SHA-256"'), 'credential comparison must avoid direct plaintext equality');
assert(security.includes('read and mutation credentials must be distinct'), 'read/mutation credentials must not collapse into one shared secret');

console.log('backup control-plane authorization regression: PASS');
