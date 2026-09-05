import assert from 'node:assert/strict';
import { webcrypto } from 'node:crypto';

if (!globalThis.crypto) globalThis.crypto = webcrypto;

const { authorizeBackupRequest } = await import('../src/endpoints/backups/security.ts');

const readToken = 'r'.repeat(40);
const mutationToken = 'm'.repeat(40);

let result = await authorizeBackupRequest('GET', undefined, readToken, mutationToken);
assert.equal(result.ok, false);
assert.equal(result.status, 401);

result = await authorizeBackupRequest('GET', 'Bearer wrong', readToken, mutationToken);
assert.equal(result.ok, false);
assert.equal(result.status, 403);

result = await authorizeBackupRequest('GET', `Bearer ${readToken}`, readToken, mutationToken);
assert.deepEqual(result, { ok: true, scope: 'read' });

result = await authorizeBackupRequest('GET', `Bearer ${mutationToken}`, readToken, mutationToken);
assert.deepEqual(result, { ok: true, scope: 'mutation' });

result = await authorizeBackupRequest('POST', `Bearer ${readToken}`, readToken, mutationToken);
assert.equal(result.ok, false);
assert.equal(result.status, 403);

result = await authorizeBackupRequest('PUT', `Bearer ${mutationToken}`, readToken, mutationToken);
assert.deepEqual(result, { ok: true, scope: 'mutation' });

result = await authorizeBackupRequest('DELETE', `Bearer ${mutationToken}`, readToken, mutationToken);
assert.deepEqual(result, { ok: true, scope: 'mutation' });

result = await authorizeBackupRequest('GET', `Bearer ${readToken}`, 'weak', mutationToken);
assert.equal(result.ok, false);
assert.equal(result.status, 503);

result = await authorizeBackupRequest('POST', `Bearer ${mutationToken}`, readToken, undefined);
assert.equal(result.ok, false);
assert.equal(result.status, 503);

const sharedToken = 's'.repeat(40);
result = await authorizeBackupRequest('GET', `Bearer ${sharedToken}`, sharedToken, sharedToken);
assert.equal(result.ok, false);
assert.equal(result.status, 503);

console.log('backup registry authorization behavior: PASS');
