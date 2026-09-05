import assert from 'node:assert/strict';
import { webcrypto } from 'node:crypto';

if (!globalThis.crypto) globalThis.crypto = webcrypto;

const { authorizeIspRequest } = await import('../src/endpoints/isp/security.ts');
const readToken = 'r'.repeat(40);
const mutationToken = 'm'.repeat(40);

let result = await authorizeIspRequest('GET', undefined, readToken, mutationToken);
assert.equal(result.ok, false);
assert.equal(result.status, 401);

result = await authorizeIspRequest('GET', 'Bearer wrong', readToken, mutationToken);
assert.equal(result.ok, false);
assert.equal(result.status, 403);

result = await authorizeIspRequest('GET', `Bearer ${readToken}`, readToken, mutationToken);
assert.deepEqual(result, { ok: true, scope: 'read' });

result = await authorizeIspRequest('POST', `Bearer ${readToken}`, readToken, mutationToken);
assert.equal(result.ok, false);
assert.equal(result.status, 403);

result = await authorizeIspRequest('POST', `Bearer ${mutationToken}`, readToken, mutationToken);
assert.deepEqual(result, { ok: true, scope: 'mutation' });

result = await authorizeIspRequest('GET', `Bearer ${readToken}`, 'weak', mutationToken);
assert.equal(result.ok, false);
assert.equal(result.status, 503);

result = await authorizeIspRequest('POST', `Bearer ${mutationToken}`, readToken, undefined);
assert.equal(result.ok, false);
assert.equal(result.status, 503);

console.log('ISP authorization behavior: PASS');
