// Generic safety gate for unverified DarCloud concepts.

const HEADERS = {
  "Content-Security-Policy": "default-src 'none'; style-src 'unsafe-inline'; base-uri 'none'; form-action 'none'; frame-ancestors 'none'",
  "Referrer-Policy": "no-referrer",
  "X-Content-Type-Options": "nosniff",
  "X-Frame-Options": "DENY",
  "X-Robots-Tag": "noindex, nofollow, noarchive",
  "Permissions-Policy": "camera=(), microphone=(), geolocation=(), payment=(), usb=(), bluetooth=()",
  "Cache-Control": "no-store",
  "X-DarCloud-No-SSO": "1",
};

function reply(request, body, status, contentType, extra = {}) {
  return new Response(request.method === "HEAD" ? null : body, {
    status,
    headers: { ...HEADERS, "Content-Type": contentType, ...extra },
  });
}

function json(request, data, status = 200, extra = {}) {
  return reply(request, JSON.stringify(data), status, "application/json; charset=UTF-8", extra);
}

const PAGE = `<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Internal concept | DarCloud</title>
<style>:root{color-scheme:dark}*{box-sizing:border-box}body{margin:0;background:#07101c;color:#edf7ff;font:16px/1.65 system-ui,sans-serif}main{width:min(700px,calc(100% - 2rem));margin:0 auto;padding:4rem 0}.box{background:#0e1b2b;border:1px solid #28425f;border-radius:16px;padding:1.5rem}p{color:#adc1d6}a{color:#43ddbd}.label{display:inline-block;border:1px solid #725f2a;background:#282111;color:#f0cf7a;border-radius:99px;padding:.2rem .6rem;font-size:.75rem;font-weight:800;text-transform:uppercase;letter-spacing:.06em}</style></head>
<body><main><section class="box"><span class="label">Internal concept</span><h1>This service is not live</h1><p>Any names, screens, records, metrics, prices, companies, contracts, licenses, certifications, locations, users, nodes, chains, fleets, agents, revenue, or transactions associated with this concept are fictional planning or test material unless a separate page supplies independently verifiable evidence.</p><p><strong>No payment processing, financial account, custody, transfer, exchange, lending, insurance, investment, token, mining, staking, yield, legal filing, regulated advice, telecom service, booking, dispatch, location tracking, shipment, or real-world fulfillment is available here.</strong></p><p><a href="https://www.darcloud.host/">Return to the DarCloud preview catalog</a></p></section></main></body></html>`;

export default {
  async fetch(request) {
    const url = new URL(request.url);
    const method = request.method.toUpperCase();
    if (method === "OPTIONS") return reply(request, null, 204, "text/plain; charset=UTF-8", { Allow: "GET, HEAD, OPTIONS" });
    if (method !== "GET" && method !== "HEAD") {
      return json(request, { error: "This concept is read-only and unavailable.", live: false }, 405, { Allow: "GET, HEAD, OPTIONS" });
    }
    if (url.pathname === "/health") {
      return json(request, {
        status: "unavailable",
        mode: "internal-concept",
        live: false,
        payments: false,
        transactions: false,
        regulated_services: false,
        real_world_fulfillment: false,
      });
    }
    if (url.pathname === "/") return reply(request, PAGE, 200, "text/html; charset=UTF-8");
    return reply(request, PAGE, 404, "text/html; charset=UTF-8");
  },
};
