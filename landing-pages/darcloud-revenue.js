// Public service metadata only. Financial records are served by the
// authenticated Hono routes in src/index.ts; this module never proxies them.
export default {
  async fetch(request) {
    const url = new URL(request.url);
    if (request.method !== "GET" && request.method !== "HEAD") {
      return json({ error: "Legacy revenue endpoint unavailable" }, 410);
    }
    if (url.pathname === "/" || url.pathname === "/health") {
      return json({
        service: "DarCloud Revenue",
        status: "endpoint_available",
        financial_data: "authenticated_api_only",
        observed_at: new Date().toISOString(),
        note: "Endpoint availability does not verify collections, balances, or payment processor status.",
      });
    }
    return json({ error: "Not found" }, 404);
  },
};

function json(data, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { "Content-Type": "application/json", "Cache-Control": "no-store" },
  });
}
