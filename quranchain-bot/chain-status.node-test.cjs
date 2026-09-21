const { test } = require("node:test");
const assert = require("node:assert/strict");
const { DatabaseSync } = require("node:sqlite");
const { readFileSync } = require("node:fs");
const { resolve } = require("node:path");
const vm = require("node:vm");
const { once } = require("node:events");
const { createChainStatusReader, createChainStatusHandler } = require("./chain-status");

function fixture() {
  const db = new DatabaseSync(":memory:");
  db.exec(`
    CREATE TABLE blocks (
      id INTEGER PRIMARY KEY AUTOINCREMENT, block_number INTEGER NOT NULL,
      hash TEXT, prev_hash TEXT, miner TEXT, validator TEXT, reward REAL,
      gas_collected REAL, difficulty INTEGER, nonce INTEGER, tx_count INTEGER,
      chain TEXT NOT NULL, created_at TEXT NOT NULL
    );
    CREATE TABLE transactions (
      id INTEGER PRIMARY KEY AUTOINCREMENT, tx_hash TEXT, from_user TEXT,
      to_user TEXT, amount REAL, type TEXT, chain TEXT, memo TEXT,
      block_number INTEGER, created_at TEXT
    );
  `);
  return db;
}

function seed(db) {
  db.exec(`
    INSERT INTO blocks (block_number, hash, miner, reward, chain, created_at) VALUES
      (1, 'unverified-stored-hash', 'private-discord-id', 50, 'QuranChain', '2026-09-21 19:58:00'),
      (1, 'another-unverified-hash', 'another-private-id', 50, 'Ethereum', '2026-09-21 19:59:00');
    INSERT INTO transactions (tx_hash, to_user, amount, memo) VALUES
      ('private-tx-one', 'private-user-one', 100, 'private-memo'),
      ('private-tx-two', 'private-user-two', 50, 'private-memo'),
      ('private-tx-three', 'private-user-three', 50, 'private-memo');
  `);
}

test("an empty ledger is observed without fabricated records", () => {
  const db = fixture();
  try {
    const read = createChainStatusReader(db, () => new Date("2026-09-21T20:00:00Z"));
    assert.deepEqual(read(), {
      source_type: "local_sqlite_ledger", observed_at: "2026-09-21T20:00:00.000Z",
      block_count: 0, transaction_count: 0, latest_block: null,
    });
    assert.equal(db.prepare("SELECT COUNT(*) AS n FROM blocks").get().n, 0);
  } finally { db.close(); }
});

test("stored counts and timestamps are projected without hashes, identities, or financial records", () => {
  const db = fixture();
  try {
    seed(db);
    const read = createChainStatusReader(db, () => new Date("2026-09-21T20:00:00Z"));
    assert.deepEqual(read(), {
      source_type: "local_sqlite_ledger", observed_at: "2026-09-21T20:00:00.000Z",
      block_count: 2, transaction_count: 3,
      latest_block: { index: 2, chain_index: 1, chain: "Ethereum", timestamp: "2026-09-21T19:59:00.000Z" },
    });
    const serialized = JSON.stringify(read());
    for (const privateField of ["hash", "miner", "reward", "memo", "private", "revenue", "validator"]) {
      assert.equal(serialized.includes(privateField), false);
    }
    assert.equal(db.prepare("SELECT COUNT(*) AS n FROM blocks").get().n, 2);
    assert.equal(db.prepare("SELECT COUNT(*) AS n FROM transactions").get().n, 3);
  } finally { db.close(); }
});

test("new reads reflect new rows and retain the source record time", () => {
  const db = fixture();
  try {
    let now = new Date("2026-09-21T20:00:00Z");
    const read = createChainStatusReader(db, () => now);
    assert.equal(read().block_count, 0);
    seed(db);
    now = new Date("2026-09-22T20:00:00Z");
    const updated = read();
    assert.equal(updated.block_count, 2);
    assert.equal(updated.observed_at, "2026-09-22T20:00:00.000Z");
    assert.equal(updated.latest_block.timestamp, "2026-09-21T19:59:00.000Z");
  } finally { db.close(); }
});

test("handler requires configuration, authentication, GET, and no query", async () => {
  let reads = 0;
  const read = () => { reads++; return { source_type: "local_sqlite_ledger" }; };
  const request = { method: "GET", headers: { authorization: "Bearer fixture-token" } };
  const handler = createChainStatusHandler(read, () => "fixture-token");
  const cases = [
    [createChainStatusHandler(read, () => undefined), request, "", 503, "status_not_configured"],
    [handler, { method: "GET", headers: {} }, "", 401, "unauthorized"],
    [handler, { method: "GET", headers: { authorization: "Bearer invalid-token" } }, "", 401, "unauthorized"],
    [handler, { ...request, method: "POST" }, "", 405, "method_not_allowed"],
    [handler, request, "include=wallets", 400, "query_not_allowed"],
  ];
  for (const [handle, req, query, status, error] of cases) {
    const result = handle(req, {}, new URLSearchParams(query));
    assert.equal(result.status, status);
    assert.equal(result.headers.get("cache-control"), "no-store");
    assert.deepEqual(await result.json(), { error });
  }
  assert.equal(reads, 0);
  const result = handler(request, {}, new URLSearchParams());
  assert.equal(result.status, 200);
  assert.equal(reads, 1);
});

test("closed database and malformed stored timestamps fail closed without error details", async () => {
  const db = fixture();
  seed(db);
  const reader = createChainStatusReader(db);
  const handler = createChainStatusHandler(reader, () => "fixture-token");
  const req = { method: "GET", headers: { authorization: "Bearer fixture-token" } };
  db.exec("UPDATE blocks SET created_at='2026-02-30 10:00:00' WHERE id=2");
  let response = handler(req, {}, new URLSearchParams());
  assert.equal(response.status, 503);
  assert.deepEqual(await response.json(), { error: "ledger_unavailable" });
  db.close();
  response = handler(req, {}, new URLSearchParams());
  assert.equal(response.status, 503);
  assert.deepEqual(await response.json(), { error: "ledger_unavailable" });
});

test("IPC forwards native Response status and headers while preserving legacy JSON and loopback binding", async () => {
  // Isolate onboarding's unrelated database; exercise the actual IPC HTTP server.
  const module = { exports: {} };
  const onboarding = { db: { exec() {}, prepare() { return {}; } } };
  vm.runInNewContext(readFileSync(resolve(__dirname, "../shared/bot-ipc.js"), "utf8"), {
    module, exports: module.exports,
    require(name) { return name === "./onboarding-db" ? onboarding : require(name); },
    console: { log() {}, error() {} }, URL, Response, Buffer,
  });
  const ipc = module.exports;
  ipc.BOT_REGISTRY.quranchain.port = 0;
  const db = fixture();
  seed(db);
  const server = ipc.startIpcServer("quranchain", {
    "/chain-status": createChainStatusHandler(createChainStatusReader(db), () => "fixture-token"),
    "/legacy": async () => ({ ok: true, legacy: true }),
  });
  await once(server, "listening");
  try {
    assert.equal(server.address().address, "127.0.0.1");
    const origin = `http://127.0.0.1:${server.address().port}`;
    let response = await fetch(origin + "/chain-status");
    assert.equal(response.status, 401);
    assert.equal(response.headers.get("cache-control"), "no-store");
    assert.deepEqual(await response.json(), { error: "unauthorized" });
    response = await fetch(origin + "/chain-status", { headers: { authorization: "Bearer fixture-token" } });
    assert.equal(response.status, 200);
    assert.equal((await response.json()).block_count, 2);
    response = await fetch(origin + "/chain-status", { method: "POST", body: "{}" });
    assert.equal(response.status, 405);
    assert.equal(response.headers.get("allow"), "GET");
    response = await fetch(origin + "/legacy");
    assert.deepEqual(await response.json(), { ok: true, legacy: true });
  } finally {
    server.closeAllConnections();
    await new Promise(resolve => server.close(resolve));
    db.close();
  }
});

test("IPC preserves legacy JSON handlers when the runtime has no global Response", async () => {
  const module = { exports: {} };
  const onboarding = { db: { exec() {}, prepare() { return {}; } } };
  vm.runInNewContext(readFileSync(resolve(__dirname, "../shared/bot-ipc.js"), "utf8"), {
    module, exports: module.exports,
    require(name) { return name === "./onboarding-db" ? onboarding : require(name); },
    console: { log() {}, error() {} }, URL, Buffer,
  });
  const ipc = module.exports;
  ipc.BOT_REGISTRY.quranchain.port = 0;
  const server = ipc.startIpcServer("quranchain", { "/legacy": async () => ({ legacy: true }) });
  await once(server, "listening");
  try {
    const response = await fetch(`http://127.0.0.1:${server.address().port}/legacy`);
    assert.equal(response.status, 200);
    assert.deepEqual(await response.json(), { legacy: true });
  } finally {
    server.closeAllConnections();
    await new Promise(resolve => server.close(resolve));
  }
});
