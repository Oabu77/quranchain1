// Dar Logistics internal-test preview (Cloudflare Worker landing module)
const SECURITY_HEADERS = {
  "Content-Security-Policy": "default-src 'none'; style-src 'unsafe-inline'; base-uri 'none'; frame-ancestors 'none'",
  "X-Content-Type-Options": "nosniff",
  "X-Frame-Options": "DENY",
  "Referrer-Policy": "no-referrer",
  "Permissions-Policy": "camera=(), microphone=(), geolocation=(), payment=(), usb=(), bluetooth=()",
  "Cross-Origin-Opener-Policy": "same-origin",
  "Cross-Origin-Resource-Policy": "same-origin",
  "Cache-Control": "no-store",
  "X-Robots-Tag": "noindex, nofollow, noarchive",
  "X-DarCloud-No-SSO": "1",
};

function response(body, status, contentType, extraHeaders = {}) {
  return new Response(body, {
    status,
    headers: {
      ...SECURITY_HEADERS,
      "Content-Type": contentType,
      ...extraHeaders,
    },
  });
}

function json(data, status = 200, extraHeaders = {}) {
  return response(
    JSON.stringify(data),
    status,
    "application/json;charset=UTF-8",
    extraHeaders,
  );
}

const PREVIEW = `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width,initial-scale=1">
  <title>Dar Logistics Internal Test</title>
  <meta name="description" content="A fictional-data interface preview for internal product testing.">
  <style>
    :root{color-scheme:dark;--bg:#061018;--panel:#0c1b28;--line:#264157;--text:#f1f7fb;--muted:#a8bac7;--sky:#6bd0ff;--amber:#ffc766}
    *{box-sizing:border-box}body{margin:0;background:linear-gradient(155deg,#10283a 0,var(--bg) 45%);color:var(--text);font:16px/1.55 system-ui,-apple-system,sans-serif;min-height:100vh}
    main{width:min(920px,calc(100% - 2rem));margin:0 auto;padding:3rem 0 4rem}.tag{display:inline-block;border:1px solid #8b641b;background:#35270d;color:#ffde9c;border-radius:999px;padding:.35rem .75rem;font-weight:800;font-size:.78rem;letter-spacing:.06em;text-transform:uppercase}
    h1{font-size:clamp(2.2rem,7vw,4.5rem);line-height:1.05;margin:.8rem 0}h1 span{color:var(--sky)}p{color:var(--muted)}.warning{border-left:4px solid var(--amber);background:#1e1c13;padding:1rem 1.2rem;border-radius:10px;margin:1.3rem 0}.warning strong{color:var(--amber)}
    .grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(230px,1fr));gap:1rem;margin:1.5rem 0}.card{background:rgba(12,27,40,.94);border:1px solid var(--line);border-radius:16px;padding:1.2rem}.card small{color:var(--sky);font-weight:750;text-transform:uppercase;letter-spacing:.06em}.card h2{font-size:1.15rem;margin:.45rem 0}.card p{font-size:.92rem;margin:0}
    .disabled{display:inline-block;margin-top:.8rem;border:1px solid var(--line);color:var(--muted);border-radius:8px;padding:.45rem .65rem;font-size:.8rem}a{color:var(--sky)}footer{margin-top:2rem;color:var(--muted);font-size:.85rem}
  </style>
</head>
<body>
  <main>
    <span class="tag">Internal test · fictional data</span>
    <h1>Dar <span>Logistics</span></h1>
    <p>This page evaluates a possible workflow and information layout using invented examples.</p>
    <div class="warning"><strong>No live operations.</strong><p>Nothing can be scheduled, moved, charged, or tracked here. The preview has no checkout connection, does not access device position, and is not connected to providers in the real world.</p></div>
    <div class="grid" aria-label="Fictional interface samples">
      <article class="card"><small>Example request</small><h2>Community center cleanup</h2><p>Sample reference DL-0001 · invented address · sample date</p><span class="disabled">Action unavailable</span></article>
      <article class="card"><small>Example route</small><h2>Three-stop layout study</h2><p>Static map-free sequence for evaluating information hierarchy.</p><span class="disabled">Position access off</span></article>
      <article class="card"><small>Example status</small><h2>Draft → reviewed → archived</h2><p>Illustrative states only; they do not describe real-world activity.</p><span class="disabled">Internal preview</span></article>
    </div>
    <p>All names, addresses, dates, routes, and status events displayed here are fictional.</p>
    <footer><a href="https://darcloud.host">DarCloud home</a> · <a href="https://darcloud.host/privacy">Privacy</a> · <a href="https://darcloud.host/terms">Terms</a></footer>
  </main>
</body>
</html>`;

const src_default = {
  async fetch(request) {
    const url = new URL(request.url);

    if (request.method === "OPTIONS") {
      return response(null, 204, "text/plain;charset=UTF-8", {
        Allow: "GET, HEAD, OPTIONS",
      });
    }

    if (request.method === "POST") {
      return json(
        { error: "Writes are disabled in this internal-test preview." },
        405,
        { Allow: "GET, HEAD, OPTIONS" },
      );
    }

    if (request.method !== "GET" && request.method !== "HEAD") {
      return json({ error: "Method not allowed" }, 405, {
        Allow: "GET, HEAD, OPTIONS",
      });
    }

    if (url.pathname === "/health") {
      return json({
        status: "ok",
        service: "Dar Logistics preview",
        mode: "internal-test",
        fictional_data: true,
        bookings_enabled: false,
        shipments_enabled: false,
        dispatch_enabled: false,
        payments_enabled: false,
        location_tracking_enabled: false,
      });
    }

    if (url.pathname !== "/") {
      return json({ error: "Not found", mode: "internal-test" }, 404);
    }

    return response(PREVIEW, 200, "text/html;charset=UTF-8");
  },
};

export { src_default as default };
