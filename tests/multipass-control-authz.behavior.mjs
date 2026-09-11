import assert from 'node:assert/strict';
import { webcrypto } from 'node:crypto';

if (!globalThis.crypto) globalThis.crypto = webcrypto;

const { authorizeMultipassRequest, isSafeVmName } = await import('../src/endpoints/multipass/security.ts');
const readToken = 'r'.repeat(40);
const mutationToken = 'm'.repeat(40);

let result = await authorizeMultipassRequest('GET', undefined, readToken, mutationToken);
assert.equal(result.ok, false);
assert.equal(result.status, 401);

result = await authorizeMultipassRequest('GET', 'Bearer wrong', readToken, mutationToken);
assert.equal(result.ok, false);
assert.equal(result.status, 403);

result = await authorizeMultipassRequest('GET', `Bearer ${readToken}`, readToken, mutationToken);
assert.deepEqual(result, { ok: true, scope: 'read' });

result = await authorizeMultipassRequest('POST', `Bearer ${readToken}`, readToken, mutationToken);
assert.equal(result.ok, false);
assert.equal(result.status, 403);

result = await authorizeMultipassRequest('DELETE', `Bearer ${mutationToken}`, readToken, mutationToken);
assert.deepEqual(result, { ok: true, scope: 'mutation' });

result = await authorizeMultipassRequest('GET', `Bearer ${readToken}`, 'weak', mutationToken);
assert.equal(result.ok, false);
assert.equal(result.status, 503);

result = await authorizeMultipassRequest('POST', `Bearer ${mutationToken}`, readToken, undefined);
assert.equal(result.ok, false);
assert.equal(result.status, 503);

for (const safe of ['vm1', 'fungimesh-relay1', 'node-2026']) {
  assert.equal(isSafeVmName(safe), true, `${safe} should be accepted`);
}

for (const unsafe of [
  'vm;id',
  'vm$(id)',
  'vm name',
  'vm|id',
  'vm&&id',
  '-leading',
  'trailing-',
  "vm'id",
]) {
  assert.equal(isSafeVmName(unsafe), false, `${unsafe} should be rejected`);
}

console.log('multipass authorization and VM-name behavior: PASS');
