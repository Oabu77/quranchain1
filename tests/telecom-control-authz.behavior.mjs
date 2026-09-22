import assert from 'node:assert/strict';
import { webcrypto } from 'node:crypto';

if (!globalThis.crypto) globalThis.crypto = webcrypto;

const { authorizeTelecomRequest } = await import('../src/endpoints/telecom/security.ts');
const readToken = 'r'.repeat(40);
const mutationToken = 'm'.repeat(40);

let result = await authorizeTelecomRequest('GET', undefined, readToken, mutationToken);
assert.equal(result.ok, false);
assert.equal(result.status, 401);

result = await authorizeTelecomRequest('GET', 'Bearer wrong', readToken, mutationToken);
assert.equal(result.ok, false);
assert.equal(result.status, 403);

result = await authorizeTelecomRequest('GET', `Bearer ${readToken}`, readToken, mutationToken);
assert.deepEqual(result, { ok: true, scope: 'read' });

result = await authorizeTelecomRequest('POST', `Bearer ${readToken}`, readToken, mutationToken);
assert.equal(result.ok, false);
assert.equal(result.status, 403);

result = await authorizeTelecomRequest('POST', `Bearer ${mutationToken}`, readToken, mutationToken);
assert.deepEqual(result, { ok: true, scope: 'mutation' });

result = await authorizeTelecomRequest('GET', `Bearer ${readToken}`, 'weak', mutationToken);
assert.equal(result.ok, false);
assert.equal(result.status, 503);

result = await authorizeTelecomRequest('DELETE', `Bearer ${mutationToken}`, readToken, undefined);
assert.equal(result.ok, false);
assert.equal(result.status, 503);

console.log('telecom authorization behavior: PASS');
