// Dar Al Nas housing research preview (Cloudflare Worker landing module)
const SECURITY_HEADERS = {
  "Content-Security-Policy": "default-src 'none'; style-src 'unsafe-inline'; base-uri 'none'; frame-ancestors 'none'",
  "X-Content-Type-Options": "nosniff",
  "X-Frame-Options": "DENY",
  "Referrer-Policy": "no-referrer",
  "Permissions-Policy": "camera=(), microphone=(), geolocation=(), payment=(), usb=(), bluetooth=()",
  "Cache-Control": "no-store",
  "X-Robots-Tag": "noindex, nofollow, noarchive",
  "X-DarCloud-No-SSO": "1",
};

function send(body, status, contentType, extraHeaders = {}) {
  return new Response(body, {
    status,
    headers: {
      ...SECURITY_HEADERS,
      "Content-Type": contentType,
      ...extraHeaders,
    },
  });
}

const PAGE = `<!doctype html>
<html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>Dar Al Nas Housing Research Preview</title><meta name="description" content="A research-only housing information concept from DarCloud.">
<style>:root{color-scheme:dark;--bg:#0a120c;--panel:#111d14;--line:#314537;--text:#f2f6f3;--muted:#adbbb0;--green:#75df9a}*{box-sizing:border-box}body{margin:0;background:var(--bg);color:var(--text);font:16px/1.6 system-ui,sans-serif}main{width:min(740px,calc(100% - 2rem));margin:0 auto;padding:4rem 0}h1{font-size:clamp(2rem,7vw,4rem);line-height:1.08}h1 span,a{color:var(--green)}p{color:var(--muted)}.box{background:var(--panel);border:1px solid var(--line);border-radius:16px;padding:1.3rem;margin:1.3rem 0}.label{color:var(--green);font-weight:800;text-transform:uppercase;letter-spacing:.08em;font-size:.78rem}footer{margin-top:2rem;font-size:.85rem}</style></head>
<body><main><div class="label">Research only</div><h1>Dar Al Nas <span>housing concept</span></h1><p>This page is a static study of educational housing information and possible interface layouts.</p><div class="box"><strong>No live offering or application.</strong><p>No properties are offered through this page. It does not accept money, identity documents, eligibility requests, or transaction instructions. Any future service would require separate verification, disclosures, and legal review before launch.</p></div><p>The current experience contains no listings, pricing, approvals, or personalized recommendations.</p><footer><a href="https://darcloud.host">DarCloud home</a> · <a href="https://darcloud.host/privacy">Privacy</a> · <a href="https://darcloud.host/terms">Terms</a></footer></main></body></html>`;

const src_default = {
  async fetch(request) {
    const url = new URL(request.url);
    if (request.method === "OPTIONS") return send(null, 204, "text/plain;charset=UTF-8", { Allow: "GET, HEAD, OPTIONS" });
    if (request.method !== "GET" && request.method !== "HEAD") {
      return send(JSON.stringify({ error: "Writes are disabled", mode: "research-only" }), 405, "application/json;charset=UTF-8", { Allow: "GET, HEAD, OPTIONS" });
    }
    if (url.pathname === "/health") {
      return send(JSON.stringify({ status: "ok", service: "Dar Al Nas housing research preview", mode: "research-only", applications_enabled: false, transactions_enabled: false }), 200, "application/json;charset=UTF-8");
    }
    if (url.pathname !== "/") return send(JSON.stringify({ error: "Not found" }), 404, "application/json;charset=UTF-8");
    return send(PAGE, 200, "text/html;charset=UTF-8");
  },
};

export { src_default as default };
