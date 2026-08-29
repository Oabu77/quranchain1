// DarCloud checkout safety gate — Cloudflare Worker module.
// No paid product may be sold until fulfillment, pricing, disclosures, and
// support operations have been independently verified.

const SECURITY_HEADERS = {
  "Content-Security-Policy": "default-src 'none'; style-src 'unsafe-inline'; base-uri 'none'; form-action 'none'; frame-ancestors 'none'",
  "Referrer-Policy": "no-referrer",
  "X-Content-Type-Options": "nosniff",
  "X-Frame-Options": "DENY",
  "Permissions-Policy": "camera=(), microphone=(), geolocation=(), payment=(), usb=(), bluetooth=()",
  "X-Robots-Tag": "noindex, nofollow, noarchive",
  "X-DarCloud-No-SSO": "1",
};

function responseHeaders(contentType) {
  return { ...SECURITY_HEADERS, "Content-Type": contentType, "Cache-Control": "no-store" };
}

function json(data, status = 200, extraHeaders = {}) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { ...responseHeaders("application/json; charset=UTF-8"), ...extraHeaders },
  });
}

function page(status = 200) {
  const html = `<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>Checkout unavailable | DarCloud</title><style>:root{color-scheme:dark}*{box-sizing:border-box}body{margin:0;background:#07090f;color:#e6edf3;font:16px/1.65 system-ui,sans-serif}main{width:min(660px,calc(100% - 2rem));margin:0 auto;padding:4rem 0}.box{background:#0d1117;border:1px solid #2b3440;border-radius:14px;padding:1.5rem}p{color:#a9b3bf}a{color:#66d9ff}</style></head>
<body><main><section class="box"><h1>Checkout is unavailable</h1><p><strong>DarCloud is not accepting payment for this product.</strong></p><p>This page does not create a purchase, subscription, membership, financial account, node, token balance, or service entitlement. Product fulfillment, support, pricing, and required disclosures must be verified before checkout can be enabled.</p><p><a href="https://www.darcloud.host/">Return to DarCloud</a></p></section></main></body></html>`;
  return new Response(html, { status, headers: responseHeaders("text/html; charset=UTF-8") });
}

function methodNotAllowed() {
  return json({
    error: "Checkout is disabled.",
    mode: "non-transactional-preview",
    payments: false,
    subscriptions: false,
  }, 405, { Allow: "GET, HEAD, OPTIONS" });
}

export default {
  async fetch(request) {
    const url = new URL(request.url);
    const method = request.method.toUpperCase();

    if (method === "OPTIONS") {
      return new Response(null, { status: 204, headers: { ...SECURITY_HEADERS, Allow: "GET, HEAD, OPTIONS" } });
    }
    if (method !== "GET" && method !== "HEAD") return methodNotAllowed();

    if (url.pathname === "/health") {
      return json({
        status: "preview",
        service: "DarCloud checkout gate",
        mode: "non-transactional-preview",
        checkout: false,
        payments: false,
        subscriptions: false,
      });
    }

    if (url.pathname === "/" || url.pathname === "/success" || url.pathname === "/cancel") return page();
    if (/^\/checkout(?:\/|$)/i.test(url.pathname) || /^\/api\/checkout\/session\/?$/i.test(url.pathname)) return page(410);
    return page(404);
  },
};
