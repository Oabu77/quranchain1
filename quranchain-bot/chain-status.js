// Read-only projection of this bot's local SQLite accounting ledger.
// Stored rows do not prove a public blockchain, consensus, or settled revenue.
const { timingSafeEqual } = require("node:crypto");

const STATUS_QUERY = `
  SELECT
    (SELECT COUNT(*) FROM blocks) AS block_count,
    (SELECT COUNT(*) FROM transactions) AS transaction_count,
    latest.id AS latest_index,
    latest.block_number AS latest_chain_index,
    latest.chain AS latest_chain,
    latest.created_at AS latest_timestamp
  FROM (SELECT 1) AS snapshot
  LEFT JOIN (
    SELECT id, block_number, chain, created_at
    FROM blocks ORDER BY id DESC LIMIT 1
  ) AS latest ON 1 = 1
`;

function nonnegativeInteger(value) {
  if (!Number.isSafeInteger(value) || value < 0) throw new Error("Invalid ledger count");
  return value;
}

function sqliteTimestamp(value) {
  // The existing schema writes datetime('now'): UTC, without a suffix.
  if (typeof value !== "string" || !/^\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2}$/.test(value)) {
    throw new Error("Invalid ledger timestamp");
  }
  const timestamp = new Date(value.replace(" ", "T") + "Z").toISOString();
  if (timestamp.slice(0, 19).replace("T", " ") !== value) throw new Error("Invalid ledger timestamp");
  return timestamp;
}

function createChainStatusReader(db, now = () => new Date()) {
  const query = db.prepare(STATUS_QUERY);
  return () => {
    // One statement gives counts and the newest record from the same snapshot.
    const row = query.get();
    const latest = row.latest_index === null ? null : {
      index: nonnegativeInteger(row.latest_index),
      chain_index: nonnegativeInteger(row.latest_chain_index),
      chain: row.latest_chain,
      timestamp: sqliteTimestamp(row.latest_timestamp),
    };
    if (latest && (typeof latest.chain !== "string" || !latest.chain || latest.chain.length > 128)) {
      throw new Error("Invalid ledger chain");
    }
    return {
      source_type: "local_sqlite_ledger",
      observed_at: now().toISOString(),
      block_count: nonnegativeInteger(row.block_count),
      transaction_count: nonnegativeInteger(row.transaction_count),
      latest_block: latest,
    };
  };
}

function json(body, status = 200, headers = {}) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json", "Cache-Control": "no-store", ...headers },
  });
}

function createChainStatusHandler(readStatus, token = () => process.env.CHAIN_STATUS_TOKEN) {
  return (req, _body, params) => {
    if (req.method !== "GET") return json({ error: "method_not_allowed" }, 405, { Allow: "GET" });
    if (params && params.toString()) return json({ error: "query_not_allowed" }, 400);
    const expected = token();
    if (typeof expected !== "string" || !expected.trim()) {
      return json({ error: "status_not_configured" }, 503);
    }
    const authorization = req.headers.authorization;
    const supplied = typeof authorization === "string" ? authorization : "";
    const received = Buffer.from(supplied);
    const required = Buffer.from(`Bearer ${expected}`);
    if (received.length !== required.length || !timingSafeEqual(received, required)) {
      return json({ error: "unauthorized" }, 401);
    }
    try {
      return json(readStatus());
    } catch {
      return json({ error: "ledger_unavailable" }, 503);
    }
  };
}

module.exports = { createChainStatusReader, createChainStatusHandler };
