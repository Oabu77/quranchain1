// DarCloud Wallet / HWC research preview (Cloudflare Worker landing module)
const SECURITY_HEADERS = {
  "Content-Security-Policy": "default-src 'none'; style-src 'unsafe-inline'; img-src data:; form-action 'self'; base-uri 'none'; frame-ancestors 'none'",
  "X-Content-Type-Options": "nosniff",
  "X-Frame-Options": "DENY",
  "Referrer-Policy": "no-referrer",
  "Permissions-Policy": "camera=(), microphone=(), geolocation=(), payment=(), usb=(), bluetooth=()",
  "Cross-Origin-Opener-Policy": "same-origin",
  "Cross-Origin-Resource-Policy": "same-origin",
  "Cache-Control": "no-store",
  "X-Robots-Tag": "noindex, nofollow, noarchive",
  // Internal marker removed by the subdomain router. This page intentionally has no script.
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

function page() {
  return `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width,initial-scale=1">
  <title>DarCloud Wallet Research Preview</title>
  <meta name="description" content="A research-only preview of a possible DarCloud member budgeting and learning experience.">
  <style>
    :root{color-scheme:dark;--bg:#07110d;--panel:#0e1c16;--line:#294437;--text:#f3f7f4;--muted:#adbbb3;--mint:#66e2aa;--gold:#f5cf70}
    *{box-sizing:border-box}body{margin:0;background:radial-gradient(circle at 50% 0,#153326 0,var(--bg) 48%);color:var(--text);font:16px/1.6 system-ui,-apple-system,sans-serif;min-height:100vh}
    main{width:min(760px,calc(100% - 2rem));margin:0 auto;padding:3rem 0 4rem}.eyebrow{color:var(--mint);font-weight:750;letter-spacing:.08em;text-transform:uppercase;font-size:.78rem}
    h1{font-size:clamp(2.1rem,7vw,4rem);line-height:1.08;margin:.6rem 0 1rem}h1 span{color:var(--gold)}p{margin:.7rem 0;color:var(--muted)}
    .status,.card{border:1px solid var(--line);background:rgba(14,28,22,.92);border-radius:18px;padding:1.35rem;margin:1.3rem 0}.status strong{color:var(--gold)}
    .facts{display:grid;grid-template-columns:repeat(auto-fit,minmax(180px,1fr));gap:.8rem;margin:1.2rem 0}.fact{border:1px solid var(--line);border-radius:14px;padding:1rem;background:#0a1711}.fact b{display:block;color:var(--mint);margin-bottom:.25rem}.fact span{color:var(--muted);font-size:.9rem}
    a{color:var(--mint)}footer{margin-top:2rem;color:var(--muted);font-size:.85rem}
  </style>
</head>
<body>
  <main>
    <div class="eyebrow">HWC / DarCloud Wallet</div>
    <h1>A concept for <span>member money education</span></h1>
    <div class="status"><strong>Research preview — not a launched financial product.</strong><p>No accounts or transactions are available. DarCloud does not accept or hold money or sensitive identity documents through this page.</p></div>
    <div class="facts" aria-label="Preview facts">
      <div class="fact"><b>Concept only</b><span>Static ideas for budgeting, goals, and educational content.</span></div>
      <div class="fact"><b>No activation</b><span>Viewing this page does not create a membership, account, or application.</span></div>
      <div class="fact"><b>No data intake</b><span>This preview has no waitlist, application, enrollment, or contact form.</span></div>
    </div>
    <section class="card" aria-labelledby="preview-title">
      <h2 id="preview-title">Closed research preview</h2>
      <p>No sign-up or data-collection workflow is available on this page.</p>
    </section>
    <footer><a href="https://darcloud.host/privacy">Privacy</a> · <a href="https://darcloud.host/terms">Terms</a> · <a href="https://darcloud.host">DarCloud home</a></footer>
  </main>
</body>
</html>`;
}

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
        {
          error: "Enrollment is disabled. This host is a research-only preview.",
          mode: "research-only",
        },
        405,
        { Allow: "GET, HEAD, OPTIONS" },
      );
    }

    if (request.method !== "GET" && request.method !== "HEAD") {
      return json({ error: "Method not allowed", mode: "research-only" }, 405, {
        Allow: "GET, HEAD, OPTIONS",
      });
    }

    if (url.pathname === "/health") {
      return json({
        status: "ok",
        service: "DarCloud Wallet research preview",
        mode: "research-only",
        waitlist_enabled: false,
        transactions_enabled: false,
        sensitive_identity_collection_enabled: false,
      });
    }

    if (url.pathname !== "/") {
      return json({ error: "Not found", mode: "research-only" }, 404);
    }

    return response(
      page(),
      200,
      "text/html;charset=UTF-8",
    );
  },
};

export { src_default as default };
