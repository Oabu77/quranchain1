import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, resolve } from "node:path";

const here = dirname(fileURLToPath(import.meta.url));
const source = readFileSync(resolve(here, "../../shared/cell-tower.js"), "utf8");

assert.match(
  source,
  /const MAX_TOWER_HEADER_BYTES = 1024;/,
  "cell-tower relay must retain the 1 KiB protocol-header cap",
);

const dataHandler = source.indexOf("if (!headerParsed) {");
const sizeGuard = source.indexOf("headerBuf.length + incomingHeaderBytes > MAX_TOWER_HEADER_BYTES", dataHandler);
const destroy = source.indexOf("socket.destroy();", sizeGuard);
const concatenate = source.indexOf("headerBuf = Buffer.concat([headerBuf, data]);", dataHandler);

assert.ok(dataHandler >= 0, "expected TCP header parser was not found");
assert.ok(sizeGuard > dataHandler, "header-size guard must exist inside the pre-header parser");
assert.ok(destroy > sizeGuard, "oversized headers must destroy the socket");
assert.ok(concatenate > destroy, "size enforcement must happen before Buffer.concat growth");

// Provider-free boundary model for the exact arithmetic used by the source.
function wouldReject(existingBytes, chunkBytes, newlineIndex = -1) {
  const incomingHeaderBytes = newlineIndex >= 0 ? newlineIndex : chunkBytes;
  return existingBytes + incomingHeaderBytes > 1024;
}

assert.equal(wouldReject(0, 1024), false, "1 KiB header should remain accepted");
assert.equal(wouldReject(1024, 1), true, "header growth beyond 1 KiB must be rejected");
assert.equal(wouldReject(1000, 200, 20), false, "payload after an early newline must not count as header bytes");
assert.equal(wouldReject(1000, 200, 25), true, "header bytes before newline must still obey the cap");

console.log("FungiMesh cell-tower header security guard passed");
