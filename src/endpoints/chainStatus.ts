import { z } from "zod";

// This reports stored bot ledger records, not independently verified consensus.
const source = { type: "local_sqlite_ledger", service: "quranchain-bot", endpoint: "/chain-status" };
const MAX_AGE_MS = 60_000;
const CLOCK_SKEW_MS = 5_000;
const MAX_RESPONSE_BYTES = 65_536;
const count = z.number().int().nonnegative().max(Number.MAX_SAFE_INTEGER);
const timestamp = z.string().datetime();
const snapshotSchema = z.object({
  source_type: z.literal("local_sqlite_ledger"),
  observed_at: timestamp,
  block_count: count,
  transaction_count: count,
  latest_block: z.object({
    index: count.refine((n) => n > 0),
    chain_index: count.refine((n) => n > 0),
    chain: z.string().min(1).max(128),
    timestamp,
  }).nullable(),
}).refine((data) => (data.block_count === 0) === (data.latest_block === null));

function json(data: unknown, status: number, extraHeaders?: Record<string, string>): Response {
  return Response.json(data, { status, headers: {
    "Cache-Control": "no-store",
    "Access-Control-Allow-Origin": "*",
    "X-Content-Type-Options": "nosniff",
    ...extraHeaders,
  } });
}

// Read a bounded payload; never forward raw upstream errors or private fields.
async function readSnapshot(response: Response): Promise<unknown> {
  const reader = response.body?.getReader();
  if (!reader) throw new Error("Missing response");
  const decoder = new TextDecoder();
  let text = "";
  let size = 0;
  try {
    while (true) {
      const chunk = await reader.read();
      if (chunk.done) break;
      size += chunk.value.byteLength;
      if (size > MAX_RESPONSE_BYTES) throw new Error("Response too large");
      text += decoder.decode(chunk.value, { stream: true });
    }
    return JSON.parse(text + decoder.decode());
  } finally {
    await reader.cancel().catch(() => undefined);
    reader.releaseLock();
  }
}

export async function chainStatus(request: Request, env: Pick<Env, "CHAIN_STATUS_URL" | "CHAIN_STATUS_TOKEN">): Promise<Response> {
  const fetchedAt = new Date(Date.now()).toISOString();
  const unavailable = (reason: string, status = 503) => json({
    status: "unavailable", reason, source, observed_at: null, fetched_at: fetchedAt,
    age_seconds: null, max_age_seconds: MAX_AGE_MS / 1000, data: null,
  }, status);
  if (request.method !== "GET") return json({ error: "method_not_allowed" }, 405, { Allow: "GET" });
  if (new URL(request.url).search) return json({ error: "query_not_allowed" }, 400);
  if (!env.CHAIN_STATUS_URL || !env.CHAIN_STATUS_TOKEN) return unavailable("not_configured");

  let upstream: URL;
  try {
    upstream = new URL(env.CHAIN_STATUS_URL);
    const hostname = upstream.hostname.toLowerCase().replace(/\.$/, "");
    if (upstream.protocol !== "https:" || upstream.username || upstream.password || upstream.search || upstream.hash ||
        upstream.pathname !== "/chain-status" || upstream.port ||
        hostname === "localhost" || hostname.endsWith(".localhost") ||
        /^(?:[\d.]+|\[.*\])$/.test(hostname) ||
        /(^|\.)darcloud\.(host|net)$/.test(hostname) ||
        hostname === new URL(request.url).hostname.toLowerCase()) throw new Error("Invalid upstream");
  } catch {
    return unavailable("invalid_configuration");
  }

  // A fixed configured URL and our own credential only; no caller headers,
  // cookies, request bodies, paths or query strings reach the private service.
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 5_000);
  try {
    const response = await fetch(upstream.href, {
      method: "GET", redirect: "manual", signal: controller.signal,
      headers: { Accept: "application/json", Authorization: `Bearer ${env.CHAIN_STATUS_TOKEN}` },
    });
    if (!response.ok) {
      await response.body?.cancel();
      return unavailable("upstream_unavailable", 502);
    }
    let snapshot: z.infer<typeof snapshotSchema>;
    try {
      snapshot = snapshotSchema.parse(await readSnapshot(response));
    } catch {
      return unavailable(controller.signal.aborted ? "upstream_timeout" : "invalid_upstream_response", 502);
    }
    const observed = Date.parse(snapshot.observed_at);
    const age = Date.now() - observed;
    if (age < -CLOCK_SKEW_MS || (snapshot.latest_block && Date.parse(snapshot.latest_block.timestamp) > observed + CLOCK_SKEW_MS)) {
      return unavailable("invalid_upstream_response", 502);
    }
    const stale = age > MAX_AGE_MS;
    return json({
      status: stale ? "stale" : "fresh", reason: stale ? "observation_expired" : null,
      source, observed_at: snapshot.observed_at, fetched_at: fetchedAt,
      age_seconds: Math.max(0, Math.floor(age / 1000)), max_age_seconds: MAX_AGE_MS / 1000,
      data: { block_count: snapshot.block_count, transaction_count: snapshot.transaction_count, latest_block: snapshot.latest_block },
    }, stale ? 503 : 200);
  } catch {
    return unavailable(controller.signal.aborted ? "upstream_timeout" : "upstream_unavailable", 502);
  } finally {
    clearTimeout(timeout);
  }
}
